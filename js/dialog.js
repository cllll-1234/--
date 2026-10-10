/* 通用剧情驱动：对话、打字机、选择、条件、状态、小游戏、结局与自动存档。 */
(function () {
  "use strict";

  let gameState = null;
  let currentText = "";
  let typedLength = 0;
  let typingTimer = null;
  let autoAdvanceTimer = null;
  let isTyping = false;
  let dialogCompleteCallback = null;
  let endingHandoff = false;

  function getScenes() { return window.TitanStory.scenes; }
  function getScene() { return getScenes()[gameState.currentScene]; }
  function displaySpeakerName(name) {
    if (name === "韩吉") return "韩吉（调查兵团分队长）";
    if (name === "利威尔") return "利威尔（调查兵团兵长）";
    return name;
  }
  function getElements() {
    return {
      stage: document.querySelector("#game-stage"), chapter: document.querySelector("#chapter-label"),
      speaker: document.querySelector("#speaker"), text: document.querySelector("#dialog-text"),
      hint: document.querySelector("#continue-hint"), choices: document.querySelector("#choices"),
      character: document.querySelector("#character-image"), dialogArea: document.querySelector("#dialog-area")
    };
  }

  function stopTyping() {
    if (typingTimer) clearTimeout(typingTimer);
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    typingTimer = null;
    autoAdvanceTimer = null;
    isTyping = false;
  }

  function persistState() {
    if (window.TitanAchievements) gameState.achievements = window.TitanAchievements.getAchievements();
    window.TitanSave.saveGame(gameState);
  }

  function applyFlags(flags) {
    (flags || []).forEach(function (entry) {
      if (typeof entry === "string") gameState.flags[entry] = true;
      else if (entry && entry.name) gameState.flags[entry.name] = entry.value === undefined ? true : entry.value;
    });
    if (["clue_g17_warehouse", "clue_seventh_dock", "hidden_warehouse_dawn", "clue_people_in_carriage"].every(function (name) {
      return Boolean(gameState.flags[name]);
    })) gameState.flags.warehouse_full_investigation = true;
    if (["churchDragMarksFound", "churchSedativesFound", "churchG17Found"].every(function (name) {
      return Boolean(gameState.flags[name]);
    })) gameState.flags.churchInvestigationComplete = true;
    if (["clue_g17_station", "clue_personnel_transfer_record", "clue_karl_purification", "clue_outside_resource_map"].every(function (name) {
      return Boolean(gameState.flags[name]);
    })) {
      gameState.flags.chapter3_core_evidence_complete = true;
      if (!gameState.flags.chapter3_sealed_room_checked) gameState.currentObjective = "进入档案室深处的封闭房间";
    }
    if (["chapter4_bed_checked", "chapter4_g17_truth_found", "chapter4_karl_truth_found"].every(function (name) {
      return Boolean(gameState.flags[name]);
    })) {
      gameState.flags.chapter4_purification_room_complete = true;
      gameState.currentObjective = "返回钟楼，听贝尔托特说明破晓者与845年的真相";
    }
    if (["chapter5_g17_stock_destroyed", "chapter5_purification_list_found"].every(function (name) {
      return Boolean(gameState.flags[name]);
    })) {
      gameState.flags.chapter5_facility_evidence_complete = true;
      gameState.currentObjective = "进入最终房间，调查始祖控制装置";
    }
  }

  function applyEvidence(evidence) {
    (evidence || []).forEach(function (item) {
      if (!gameState.evidence.includes(item)) gameState.evidence.push(item);
    });
  }

  function applyEvidenceEffects(evidence, effects) {
    (evidence || []).forEach(function (item) {
      const effect = effects && effects[item];
      if (!effect) return;
      applyFlags(effect.flags);
      if (effect.achievement && window.TitanAchievements) window.TitanAchievements.unlockAchievement(effect.achievement);
    });
  }

  function matchesConditions(conditions) {
    if (!conditions) return true;
    if (Array.isArray(conditions)) return conditions.every(matchesConditions);
    if (conditions.route !== undefined && gameState.route !== conditions.route) return false;
    if (conditions.allFlags && !conditions.allFlags.every(function (name) { return Boolean(gameState.flags[name]); })) return false;
    if (conditions.anyFlags && !conditions.anyFlags.some(function (name) { return Boolean(gameState.flags[name]); })) return false;
    if (conditions.notFlags && conditions.notFlags.some(function (name) { return Boolean(gameState.flags[name]); })) return false;
    if (conditions.evidence && !conditions.evidence.every(function (item) { return gameState.evidence.includes(item); })) return false;
    if (conditions.anyEvidence && !conditions.anyEvidence.some(function (item) { return gameState.evidence.includes(item); })) return false;
    if (conditions.notEvidence && conditions.notEvidence.some(function (item) { return gameState.evidence.includes(item); })) return false;
    if (conditions.evidenceCount) {
      const prefix = conditions.evidenceCount.prefix || "";
      const count = gameState.evidence.filter(function (item) { return item.indexOf(prefix) === 0; }).length;
      if (conditions.evidenceCount.min !== undefined && count < conditions.evidenceCount.min) return false;
      if (conditions.evidenceCount.max !== undefined && count > conditions.evidenceCount.max) return false;
    }
    if (conditions.minTrueFlags) {
      const trueCount = conditions.minTrueFlags.flags.filter(function (name) { return Boolean(gameState.flags[name]); }).length;
      if (trueCount < conditions.minTrueFlags.min) return false;
    }
    if (conditions.minigamesSucceeded && !conditions.minigamesSucceeded.every(function (key) {
      const result = gameState.minigameResults[key];
      return Boolean(result && result.completed && result.success);
    })) return false;
    return true;
  }

  function resolveNext(scene) {
    const route = (scene.routes || []).find(function (candidate) { return matchesConditions(candidate.conditions); });
    return route ? route.next : scene.next;
  }

  function finishTyping() {
    stopTyping();
    typedLength = currentText.length;
    getElements().text.textContent = currentText;
    revealActions();
  }

  function typeNextCharacter() {
    const elements = getElements();
    typedLength += 1;
    elements.text.textContent = currentText.slice(0, typedLength);
    if (typedLength < currentText.length) {
      const speed = window.TitanSettings ? window.TitanSettings.loadSettings().textSpeed : 40;
      typingTimer = setTimeout(typeNextCharacter, speed);
    } else {
      stopTyping();
      revealActions();
    }
  }

  function selectChoice(choice) {
    gameState.choices.push({ scene: gameState.currentScene, choice: choice.id });
    applyFlags(choice.flags || choice.setFlags);
    applyEvidence(choice.evidence);
    if (choice.route) gameState.route = choice.route;
    if (choice.achievement && window.TitanAchievements) window.TitanAchievements.unlockAchievement(choice.achievement);
    if (window.TitanAchievements) window.TitanAchievements.unlockAchievement("first_choice");
    persistState();
    loadScene(choice.next || resolveNext(getScene()));
  }

  function runMiniGame(scene, button) {
    button.disabled = true;
    button.textContent = "小游戏启动中…";
    gameState.mode = "minigame";
    if (window.TitanExplore) window.TitanExplore.setGameMode("minigame");
    persistState();
    window.startMiniGame(scene.minigame.type, {
      sceneId: gameState.currentScene,
      scope: scene.minigame.scope || null,
      evidenceIds: scene.minigame.evidenceIds || [],
      state: JSON.parse(JSON.stringify(gameState))
    })
      .then(function (result) {
        gameState.mode = "dialog";
        if (window.TitanExplore) window.TitanExplore.setGameMode("dialog");
        const resultKey = scene.minigame.resultKey || scene.minigame.type;
        gameState.minigameResults[resultKey] = result;
        if (result.completed && window.TitanAchievements) window.TitanAchievements.unlockAchievement("first_minigame");
        applyFlags(result.flags);
        applyEvidence(result.evidence);
        applyEvidenceEffects(result.evidence, scene.minigame.evidenceEffects);
        if (result.success) {
          applyFlags(scene.minigame.successFlags);
          applyEvidence(scene.minigame.successEvidence);
          if (scene.minigame.achievement && window.TitanAchievements) window.TitanAchievements.unlockAchievement(scene.minigame.achievement);
        } else {
          applyFlags(scene.minigame.failureFlags);
          applyEvidence(scene.minigame.failureEvidence);
        }
        persistState();
        if (result.status === "not_implemented" && scene.minigame.onUnavailable) {
          loadScene(scene.minigame.onUnavailable);
        } else if (result.success && scene.minigame.onSuccess) {
          loadScene(scene.minigame.onSuccess);
        } else if (!result.success && scene.minigame.onFailure) {
          loadScene(scene.minigame.onFailure);
        } else {
          loadScene(resolveNext(scene));
        }
      })
      .catch(function (error) {
        console.warn("小游戏未能完成。", error);
        gameState.mode = "dialog";
        if (window.TitanExplore) window.TitanExplore.setGameMode("dialog");
        persistState();
        button.disabled = false;
        button.textContent = scene.minigame.label || "重新开始小游戏";
      });
  }

  function revealActions() {
    const scene = getScene();
    if (!scene || !gameState || gameState.mode !== "dialog") return;
    const elements = getElements();
    if (scene.choices.length) {
      elements.choices.innerHTML = "";
      scene.choices.filter(function (choice) { return matchesConditions(choice.conditions); }).forEach(function (choice) {
        const button = document.createElement("button");
        button.className = "choice-button";
        button.type = "button";
        button.textContent = choice.text;
        button.addEventListener("click", function (event) { event.stopPropagation(); selectChoice(choice); });
        elements.choices.appendChild(button);
      });
    } else if (scene.minigame) {
      const button = document.createElement("button");
      button.className = "choice-button";
      button.type = "button";
      button.textContent = scene.minigame.label || "开始小游戏";
      button.addEventListener("click", function (event) { event.stopPropagation(); runMiniGame(scene, button); });
      elements.choices.appendChild(button);
      if (scene.autoStartMinigame) {
        button.hidden = true;
        runMiniGame(scene, button);
      }
    } else if (scene.ending) {
      elements.hint.hidden = false;
      elements.hint.textContent = "故事终章 · 点击进入片尾";
      elements.hint.classList.add("ending-badge");
    } else if (scene.autoAdvance) {
      autoAdvanceTimer = setTimeout(function () {
        autoAdvanceTimer = null;
        advanceDialog();
      }, scene.autoAdvance);
    } else {
      elements.hint.hidden = false;
      elements.hint.textContent = "点击继续 ▼";
    }
  }

  function loadScene(sceneId) {
    const scenes = getScenes();
    const scene = scenes[sceneId];
    if (!scene) {
      console.warn("剧情节点不存在，已返回总部探索：", sceneId);
      gameState.mode = "explore";
      gameState.currentScene = null;
      gameState.currentMap = gameState.currentMap || "hq";
      persistState();
      if (window.TitanExplore) window.TitanExplore.resumeExplore();
      if (window.TitanSceneEffects) window.TitanSceneEffects.clear();
      return;
    }
    if (!matchesConditions(scene.conditions)) return loadScene(scene.next || window.TitanStory.startScene);
    if (scene.endingPresentation) {
      if (endingHandoff) return;
      endingHandoff = true;
      stopTyping();
      gameState.mode = "dialog";
      gameState.currentScene = sceneId;
      persistState();
      // Fade the last main-story frame before entering the selected ending.
      const curtain = document.createElement("div");
      curtain.setAttribute("aria-hidden", "true");
      curtain.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:#000;opacity:0;transition:opacity .55s ease;pointer-events:auto";
      document.body.appendChild(curtain);
      requestAnimationFrame(function () { curtain.style.opacity = "1"; });
      setTimeout(function () {
        location.href = "ending.html?ending=" + encodeURIComponent(scene.endingPresentation) + "&from=story";
      }, 600);
      return;
    }
    stopTyping();
    gameState.mode = "dialog";
    gameState.currentScene = sceneId;
    applyFlags(scene.flags || scene.setFlags);
    applyEvidence(scene.evidence);
    if (scene.objective) gameState.currentObjective = scene.objective;
    if (["undergroundStreet", "undergroundTavern", "oldChurch", "warehouse"].includes(gameState.currentMap) &&
        !gameState.flags.chapter2ReturnedToHq) {
      gameState.currentObjective = window.TitanStory.getChapter2Objective(gameState.flags);
    }
    if (scene.achievement && window.TitanAchievements) window.TitanAchievements.unlockAchievement(scene.achievement);
    currentText = scene.text;
    typedLength = 0;
    const elements = getElements();
    if (window.TitanExplore) window.TitanExplore.setGameMode("dialog");
    else {
      const exploreScene = document.querySelector("#explore-scene");
      const dialogArea = document.querySelector("#dialog-area");
      if (exploreScene) exploreScene.hidden = true;
      if (dialogArea) dialogArea.hidden = false;
    }
    if (window.TitanPrologueBgm) {
      const mainStoryChapters = /^(序章|第一章|第二章|第三章|第四章|第五章)/.test(scene.chapter);
      const goodEnding = /^Good Ending/.test(scene.chapter);
      if (mainStoryChapters || goodEnding) window.TitanPrologueBgm.start(scene.chapter);
      else window.TitanPrologueBgm.stop();
    }
    elements.dialogArea.hidden = Boolean(scene.hideDialog);
    if (window.TitanSceneEffects) window.TitanSceneEffects.play(scene);
    elements.chapter.textContent = scene.chapter;
    elements.speaker.textContent = displaySpeakerName(scene.speaker);
    elements.text.textContent = "";
    elements.hint.hidden = true;
    elements.hint.classList.remove("ending-badge");
    elements.choices.innerHTML = "";
    elements.stage.style.backgroundImage = 'linear-gradient(to bottom, rgba(7,9,8,.18), rgba(7,9,8,.62)), url("' + scene.background + '")';
    const displayImage = scene.itemImage || scene.character;
    elements.character.classList.toggle("is-item-image", Boolean(scene.itemImage));
    if (displayImage) {
      elements.character.src = displayImage;
      elements.character.alt = scene.itemAlt || (scene.itemImage ? "道具特写" : scene.speaker + "角色立绘");
      elements.character.hidden = false;
    } else {
      elements.character.removeAttribute("src");
      elements.character.hidden = true;
    }
    if (scene.autosave) persistState();
    isTyping = true;
    typeNextCharacter();
  }

  function advanceDialog() {
    const scene = getScene();
    if (!scene || gameState.mode !== "dialog") return;
    if (isTyping) return finishTyping();
    if (scene.choices.length || scene.minigame) return;
    if (scene.returnToExplore) {
      if (scene.returnTransition && matchesConditions(scene.returnTransition.conditions)) {
        return loadScene(scene.returnTransition.next);
      }
      gameState.mode = "explore";
      gameState.currentScene = null;
      if (scene.targetMap) gameState.currentMap = scene.targetMap;
      persistState();
      if (window.TitanExplore) {
        if (scene.targetMap) {
          Promise.resolve(window.TitanExplore.loadMap(scene.targetMap, {
            restorePosition: Boolean(scene.restoreMapPosition), transition: Boolean(scene.mapTransition)
          })).then(function () {
            window.TitanExplore.resumeExplore();
          });
        } else {
          window.TitanExplore.resumeExplore();
        }
      }
      if (window.TitanSceneEffects) window.TitanSceneEffects.clear();
      if (dialogCompleteCallback) {
        const callback = dialogCompleteCallback;
        dialogCompleteCallback = null;
        callback(gameState);
      }
      return;
    }
    if (scene.ending) return void (location.href = "credits.html?ending=" + encodeURIComponent(scene.ending));
    const next = resolveNext(scene);
    if (next) loadScene(next);
  }

  function initializeGame() {
    const dialogBox = document.querySelector("#dialog-box");
    if (!dialogBox || !window.TitanStory || !window.TitanSave) return;
    const save = window.TitanSave.loadGameSave();
    const mode = new URLSearchParams(location.search).get("mode");
    gameState = window.TitanSave.createInitialGameState();
    if (mode !== "new" && save && save.incompatible) {
      if (!window.confirm("检测到旧版本存档，剧情系统已更新，需要重新开始游戏。\n\n点击“确定”重新开始。")) {
        location.href = "index.html";
        return;
      }
      window.TitanSave.clearGameSave();
    } else if (mode !== "new" && save && save.state) {
      gameState = save.state;
    }
    if (mode === "new" || !save || (save && save.incompatible)) {
      if (window.TitanAchievements) window.TitanAchievements.unlockAchievement("first_start");
      if (window.TitanAchievements) gameState.achievements = window.TitanAchievements.getAchievements();
    }
    if (mode === "maneuver-return" && window.TitanChapter1Maneuver) {
      window.TitanChapter1Maneuver.consumeResult(gameState);
    }
    if (mode === "memory-reconstruction-return" && window.TitanChapter4MemoryReconstruction) {
      window.TitanChapter4MemoryReconstruction.consumeResult(gameState);
    }
    if (mode === "guardian-boss-return" && window.TitanChapter5Minigames) {
      window.TitanChapter5Minigames.guardianBoss.consumeResult(gameState);
    }
    dialogBox.addEventListener("click", advanceDialog);
    document.addEventListener("keydown", function (event) {
      if ((event.key === " " || event.key === "Enter") && !event.target.classList.contains("choice-button")) {
        event.preventDefault();
        advanceDialog();
      }
    });
    if (gameState.mode === "minigame") gameState.mode = "dialog";
    if (gameState.mode === "dialog" && gameState.currentScene) loadScene(gameState.currentScene);
    else {
      gameState.mode = "explore";
      gameState.currentScene = null;
    }
    if ((mode === "new" || mode === "maneuver-return" || mode === "memory-reconstruction-return" || mode === "guardian-boss-return") && history.replaceState) {
      try {
        const remainingParams = new URLSearchParams(location.search);
        remainingParams.delete("mode");
        const query = remainingParams.toString();
        history.replaceState(null, "", "game.html" + (query ? "?" + query : ""));
      } catch (error) { /* file:// 环境不支持时安全忽略 */ }
    }
  }

  window.loadScene = loadScene;
  window.startDialog = function (sceneId, options) {
    if (!gameState) return false;
    dialogCompleteCallback = options && typeof options.onComplete === "function" ? options.onComplete : null;
    loadScene(sceneId);
    return Boolean(getScenes()[sceneId]);
  };
  window.getTitanGameState = function () { return gameState; };
  document.addEventListener("DOMContentLoaded", initializeGame);
}());
