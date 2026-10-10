/* 第五章小游戏接入：守门者战斗使用独立页面，完成后恢复主剧情。 */
(function () {
  "use strict";

  const GUARDIAN_RESULT_KEY = "TitanStory-chapter5-guardian-boss-result";
  const GUARDIAN_GAME_URL = "minigames/boss-battle/boss-battle.html?return=story";

  function startGuardianBoss(context) {
    const state = window.getTitanGameState && window.getTitanGameState();
    if (!state) return Promise.reject(new Error("主剧情状态尚未初始化。"));
    state.mode = "minigame";
    state.currentScene = (context && context.sceneId) || "chapter5_guardian_boss";
    try { localStorage.removeItem(GUARDIAN_RESULT_KEY); } catch (error) { /* 仍可进入战斗。 */ }
    if (window.TitanSave) window.TitanSave.saveGame(state);
    location.href = GUARDIAN_GAME_URL;
    return new Promise(function () {});
  }

  function consumeGuardianResult(state) {
    let result = null;
    try { result = JSON.parse(localStorage.getItem(GUARDIAN_RESULT_KEY)); }
    catch (error) { console.warn("守门者战斗结果无法解析。", error); }
    try { localStorage.removeItem(GUARDIAN_RESULT_KEY); } catch (error) { /* 避免重复消费。 */ }

    if (state.currentScene !== "chapter5_guardian_boss") return null;
    state.mode = "dialog";
    if (!result || result.type !== "guardianBoss" || result.completed !== true) {
      if (window.TitanSave) window.TitanSave.saveGame(state);
      return state.currentScene;
    }

    const success = result.success === true;
    state.flags = state.flags || {};
    state.minigameResults = state.minigameResults || {};
    state.minigameResults.guardianBoss = {
      type: "guardianBoss", status: "completed", completed: true, success: success,
      difficulty: result.difficulty, elapsed: result.elapsed, retries: result.retries,
      stats: result.stats
    };
    if (window.TitanAchievements) window.TitanAchievements.unlockAchievement("first_minigame");
    if (success) state.flags.chapter5_guardian_battle_complete = true;
    state.currentScene = success ? "chapter5_guardian_final_01" : "chapter5_guardian_retry";
    if (window.TitanSave) window.TitanSave.saveGame(state);
    return state.currentScene;
  }

  const guardianBoss = Object.freeze({
    type: "guardianBoss",
    expectedUrl: "minigames/boss-battle/boss-battle.html",
    expectedAssetsDirectory: "minigames/boss-battle/assets/",
    resultKey: GUARDIAN_RESULT_KEY,
    phases: Object.freeze([
      Object.freeze({ id: "dodge", attacks: Object.freeze(["横扫", "踩踏", "抓取"]), objective: "成功躲避攻击并寻找机会" }),
      Object.freeze({ id: "legs", objective: "在硬直期间攻击双腿，积累失衡值" }),
      Object.freeze({ id: "nape", objective: "利用钩锁接近后颈并完成 Space / A或D / Space QTE" })
    ]),
    register: function (handler) {
      if (!window.TitanMinigames) throw new Error("小游戏管理器尚未加载。");
      window.TitanMinigames.registerMiniGame("guardianBoss", handler);
    },
    start: startGuardianBoss,
    consumeResult: consumeGuardianResult
  });

  const founderControl = Object.freeze({
    type: "founderControlQte",
    expectedUrl: "minigames/founder-control/game.html",
    expectedAssetsDirectory: "images/minigames/founder-control/",
    objective: "在下一次巨人指令发出前完成控制节点QTE并摧毁装置",
    register: function (handler) {
      if (!window.TitanMinigames) throw new Error("小游戏管理器尚未加载。");
      window.TitanMinigames.registerMiniGame("founderControlQte", handler);
    }
  });

  window.TitanChapter5Minigames = Object.freeze({ guardianBoss: guardianBoss, founderControl: founderControl });
  guardianBoss.register(startGuardianBoss);
}());
