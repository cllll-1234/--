/* Explore Mode 总控：沿用唯一 gameState，在探索/对话/小游戏之间切换。 */
(function () {
  "use strict";

  let state;
  let map;
  let elements;
  let npcManager;
  let interactionManager;
  let playerController;
  let toastTimer;
  const DEBUG_MAP = false;
  let debugCollisions = false;
  let debugMap = DEBUG_MAP;
  let debugOldTown = false;
  let editOldTown = false;
  let editorSelection = null;
  const oldTownEditorStorageKey = "titan_oldtown_geometry_editor_v1";
  const mapEditorStoragePrefix = "titan_map_geometry_editor_v1:";
  let cameraPosition = { x: 0, y: 0 };
  let cameraScale = 1;
  let debugMapPoint = null;
  let mapLoadToken = 0;
  const imageDimensionCache = Object.create(null);

  function isOldTownDebug() { return debugOldTown && map && map.id === "chapter1_ruins"; }
  function isMapDebug() { return Boolean(map && (debugMap || isOldTownDebug())); }
  function syncMapDebugUi() {
    if (!elements || !elements.explore) return;
    elements.explore.classList.toggle("map-debug-active", isMapDebug());
  }
  function isMapEditorActive(targetMap) {
    const current = targetMap || map;
    return Boolean(current && ((current.id === "chapter1_ruins" && editOldTown) ||
      (["undergroundStreet", "undergroundTavern", "oldChurch", "warehouse", "seventhMaintenanceStation", "clockTowerUnderground", "centralDistrict", "centralFacility"].includes(current.id) && debugMap)));
  }

  function editorStorageKey(mapId) {
    return mapId === "chapter1_ruins" ? oldTownEditorStorageKey : mapEditorStoragePrefix + mapId;
  }

  function applySavedEditorState(copy, mapId) {
    try {
      const saved = JSON.parse(localStorage.getItem(editorStorageKey(mapId)) || "{}");
      if (saved._spawn && Number.isFinite(saved._spawn.x) && Number.isFinite(saved._spawn.y)) {
        copy.spawn = Object.assign({}, copy.spawn, { x: saved._spawn.x, y: saved._spawn.y });
      }
      const deleted = saved._deleted || [];
      deleted.forEach(function (entry) {
        const splitAt = entry.indexOf(":");
        const listName = entry.slice(0, splitAt);
        const itemId = entry.slice(splitAt + 1);
        if (copy[listName]) copy[listName] = copy[listName].filter(function (item, index) {
          return (item.id || String(index)) !== itemId;
        });
      });
      Object.keys(saved).forEach(function (key) {
        if (key === "_deleted" || key === "_spawn") return;
        const parts = key.split(":");
        const list = copy[parts[0]];
        const itemId = parts.slice(1).join(":");
        let item = list && list.find(function (entry, index) { return (entry.id || String(index)) === itemId; });
        if (!item && list && itemId.indexOf("custom-") === 0) {
          item = parts[0] === "interactionZones" ? {
            id: itemId, type: "inspect", action: "startDialog", targetScene: "",
            name: saved[key].name || "新交互区", prompt: "[E] 调查", interactionDistance: 80
          } : { id: itemId, label: saved[key].label || "自定义障碍" };
          list.push(item);
        }
        if (item) Object.assign(item, saved[key]);
      });
    } catch (error) { /* Ignore malformed local editor data. */ }
    return copy;
  }

  function cloneEditableMap(source) {
    if (!isMapEditorActive(source)) return source;
    const copy = Object.assign({}, source);
    ["collisions", "interactables", "interactionZones", "triggerZones", "npcs", "decorations"].forEach(function (key) {
      copy[key] = (source[key] || []).map(function (item) { return Object.assign({}, item); });
    });
    return applySavedEditorState(copy, source.id);
  }

  function getMode() { return state ? state.mode : "explore"; }
  function getState() { return state; }

  function save() {
    if (!state) return null;
    if (window.TitanAchievements) state.achievements = window.TitanAchievements.getAchievements();
    return window.TitanSave.saveGame(state);
  }

  function setGameMode(mode) {
    if (!state || !["explore", "dialog", "minigame"].includes(mode)) return;
    state.mode = mode;
    elements.stage.dataset.gameMode = mode;
    elements.explore.hidden = mode !== "explore";
    elements.dialog.hidden = mode !== "dialog";
    elements.character.hidden = mode !== "dialog";
    playerController.setActive(mode === "explore");
    if (mode !== "explore") interactionManager.clear();
    if (mode === "explore" && window.TitanSceneEffects) window.TitanSceneEffects.clear();
  }

  function applyExploreScene(sceneId) {
    const scene = window.TitanStory && window.TitanStory.scenes[sceneId];
    if (!scene || !scene.exploreOnly) return;
    const flags = scene.flags || [];
    if (flags.length && flags.every(function (name) { return Boolean(state.flags[name]); })) return;
    flags.forEach(function (name) { state.flags[name] = true; });
    (scene.evidence || []).forEach(addEvidence);
    if (scene.objective) state.currentObjective = scene.objective;
  }

  function renderCollisions(collisions) {
    elements.collisions.innerHTML = "";
    collisions.forEach(function (obstacle, index) {
      const block = document.createElement("div");
      block.className = "collision-block";
      block.style.left = obstacle.x + "px";
      block.style.top = obstacle.y + "px";
      block.style.width = obstacle.width + "px";
      block.style.height = obstacle.height + "px";
      block.dataset.label = obstacle.label || "障碍物";
      block.dataset.debugCategory = "collision";
      block.dataset.editorList = "collisions";
      block.dataset.editorId = obstacle.id || String(index);
      elements.collisions.appendChild(block);
    });
  }

  function appendDebugMarker(item, category, listName, index) {
    const marker = document.createElement("div");
    marker.className = "oldtown-debug-marker debug-" + category;
    marker.style.left = item.x + "px";
    marker.style.top = item.y + "px";
    marker.style.width = item.width + "px";
    marker.style.height = item.height + "px";
    marker.textContent = item.name || item.id || category;
    marker.setAttribute("aria-hidden", "true");
    marker.dataset.editorList = listName;
    marker.dataset.editorId = item.id || String(index);
    if (item.hiddenInteraction) marker.classList.add("debug-hidden-interaction");
    if (item.type === "exit") marker.classList.add("debug-exit-interaction");
    if (category === "interaction" && item.interactionDistance) {
      const radius = document.createElement("span");
      radius.className = "interaction-radius-marker";
      radius.style.width = item.interactionDistance * 2 + "px";
      radius.style.height = item.interactionDistance * 2 + "px";
      marker.appendChild(radius);
    }
    elements.objects.appendChild(marker);
  }

  function renderOldTownDebugMarkers() {
    if (!isOldTownDebug()) return;
    (map.interactables || []).forEach(function (item, index) {
      appendDebugMarker(item, item.debugCategory === "corpse" ? "corpse" : "inspect", "interactables", index);
    });
    (map.triggerZones || []).forEach(function (zone, index) {
      appendDebugMarker(zone, zone.debugCategory === "minigame" ? "minigame" : "stage", "triggerZones", index);
    });
  }

  function renderMapDebugMarkers() {
    if (!isMapDebug()) return;
    (map.interactionZones || []).forEach(function (zone, index) {
      appendDebugMarker(zone, "interaction", "interactionZones", index);
    });
    (map.triggerZones || []).forEach(function (zone, index) {
      appendDebugMarker(zone, zone.debugCategory || "stage", "triggerZones", index);
    });
  }

  function renderObjects(objects) {
    elements.objects.innerHTML = "";
    objects.filter(function (object) {
      if (object.visibleWhenFlag && !state.flags[object.visibleWhenFlag]) return false;
      if (object.hiddenAfterFlag && state.flags[object.hiddenAfterFlag]) return false;
      return true;
    }).forEach(function (object) {
      const element = document.createElement("div");
      const visual = object.visual || object;
      element.className = "explore-object object-" + object.type;
      element.style.left = visual.x + "px";
      element.style.top = visual.y + "px";
      element.style.width = visual.width + "px";
      element.style.height = visual.height + "px";
      element.dataset.objectId = object.id;
      const symbol = document.createElement("span");
      symbol.className = "object-symbol";
      symbol.setAttribute("aria-hidden", "true");
      symbol.textContent = object.symbol || (object.type === "exit" ? "↗" : "?");
      if (object.asset) {
        const image = document.createElement("img");
        image.className = "object-image";
        image.alt = object.name || "";
        image.draggable = false;
        image.addEventListener("load", function () { element.classList.add("has-object-image"); });
        image.addEventListener("error", function () { element.classList.remove("has-object-image"); });
        image.src = object.asset;
        element.appendChild(image);
      }
      const label = document.createElement("span");
      label.className = "entity-label";
      label.textContent = object.name;
      element.appendChild(symbol);
      element.appendChild(label);
      elements.objects.appendChild(element);
    });
    (map.triggerZones || []).filter(function (zone) { return zone.visible; }).forEach(function (zone) {
      const marker = document.createElement("div");
      marker.className = "trigger-zone-marker";
      marker.style.left = zone.x + "px";
      marker.style.top = zone.y + "px";
      marker.style.width = zone.width + "px";
      marker.style.height = zone.height + "px";
      marker.setAttribute("aria-hidden", "true");
      elements.objects.appendChild(marker);
    });
    renderOldTownDebugMarkers();
    renderMapDebugMarkers();
  }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

  function updateCamera(position) {
    if (!map || !elements || elements.explore.hidden) return;
    const rect = elements.explore.getBoundingClientRect();
    if (map.cameraMode === "follow") {
      /* 大地图保持 1:1；只有当浏览器视口本身大于整张图时才等比放大兜底，避免露出地图外空白。 */
      const coverScale = Math.max(rect.width / map.width, rect.height / map.height);
      const scale = map.cameraScaleMode === "native" ? Math.max(1, coverScale) :
        Math.max(map.cameraScale || 1, coverScale);
      const visibleWidth = rect.width / scale;
      const visibleHeight = rect.height / scale;
      const player = position || (playerController && playerController.position) || map.playerStart;
      const centerX = player.x + (player.width || 44) / 2;
      const centerY = player.y + (player.height || 56) / 2;
      const maxX = Math.max(0, map.width - visibleWidth);
      const maxY = Math.max(0, map.height - visibleHeight);
      const cameraX = clamp(centerX - visibleWidth / 2, 0, maxX);
      const cameraY = clamp(centerY - visibleHeight / 2, 0, maxY);
      cameraPosition = { x: cameraX, y: cameraY };
      cameraScale = scale;
      elements.world.style.transform = "translate(" + (-cameraX * scale) + "px," + (-cameraY * scale) + "px) scale(" + scale + ")";
      updateDebugReadout(player);
      return;
    }
    const scale = Math.min(rect.width / map.width, rect.height / map.height);
    const x = (rect.width - map.width * scale) / 2;
    const y = (rect.height - map.height * scale) / 2;
    cameraPosition = { x: 0, y: 0 };
    cameraScale = scale;
    elements.world.style.transform = "translate(" + x + "px," + y + "px) scale(" + scale + ")";
    updateDebugReadout(position || map.playerStart);
  }

  function updateDebugReadout(position) {
    if (!elements || !elements.debugReadout) return;
    syncMapDebugUi();
    elements.debugReadout.hidden = !isMapDebug() || elements.debugReadout.dataset.userHidden === "1";
    if (!isMapDebug()) return;
    const player = position || (playerController && playerController.position) || map.playerStart;
    const foot = window.getPlayerFootRect ? window.getPlayerFootRect(player) : player;
    elements.debugReadoutValues.textContent =
      "Map: " + map.id + " (F2 关闭调试)\n" +
      "World: " + map.width + " × " + map.height + "\n" +
      "Natural: " + (map.naturalWidth || map.referenceWidth || map.width) + " × " + (map.naturalHeight || map.referenceHeight || map.height) + "\n" +
      "World scale: " + Number(map.worldRenderScale || 1).toFixed(2) + "\n" +
      "Player X: " + Math.round(player.worldX !== undefined ? player.worldX : player.x) + "\n" +
      "Player Y: " + Math.round(player.worldY !== undefined ? player.worldY : player.y) + "\n" +
      "Facing: " + (playerController ? playerController.lastDirection : "down") + "\n" +
      "Player: " + player.width + " × " + player.height + "\n" +
      "Foot: " + Math.round(foot.x) + ", " + Math.round(foot.y) + " / " + foot.width + " × " + foot.height + "\n" +
      "Camera X: " + Math.round(cameraPosition.x) + "\n" +
      "Camera Y: " + Math.round(cameraPosition.y) + "\n" +
      "Camera scale: " + cameraScale.toFixed(2) + "\n" +
      "Interaction: " + (interactionManager && interactionManager.current ? interactionManager.current.id : "none") +
      (debugMapPoint ? "\nMap point: " + debugMapPoint.x + ", " + debugMapPoint.y : "");
  }

  function resizeWorld() {
    updateCamera(playerController && playerController.position);
  }

  function scaleRect(item, scaleX, scaleY) {
    const copy = Object.assign({}, item, {
      x: item.x * scaleX,
      y: item.y * scaleY,
      width: item.width * scaleX,
      height: item.height * scaleY
    });
    if (item.visual) copy.visual = scaleRect(item.visual, scaleX, scaleY);
    /* 交互距离以玩家使用的世界像素为单位；玩家尺寸不缩放，因此这里不能跟随地图再次放大。 */
    if (item.interactionDistance) copy.interactionDistance = item.interactionDistance;
    return copy;
  }

  function scaleNpc(item, scaleX, scaleY) {
    const copy = Object.assign({}, item, { x: item.x * scaleX, y: item.y * scaleY });
    if (item.positionAfterFlag) {
      copy.positionAfterFlag = Object.assign({}, item.positionAfterFlag, {
        x: item.positionAfterFlag.x * scaleX,
        y: item.positionAfterFlag.y * scaleY
      });
    }
    copy.positionByFlags = (item.positionByFlags || []).map(function (position) {
      return Object.assign({}, position, { x: position.x * scaleX, y: position.y * scaleY });
    });
    return copy;
  }

  function createRuntimeMap(source, worldWidth, worldHeight) {
    const referenceWidth = source.referenceWidth || source.width;
    const referenceHeight = source.referenceHeight || source.height;
    const scaleX = worldWidth / referenceWidth;
    const scaleY = worldHeight / referenceHeight;
    const runtime = Object.assign({}, source, {
      width: worldWidth, height: worldHeight,
      naturalWidth: source.width, naturalHeight: source.height,
      worldRenderScale: worldWidth / referenceWidth
    });
    runtime.spawn = source.spawn ? { x: source.spawn.x * scaleX, y: source.spawn.y * scaleY } : null;
    runtime.playerStart = runtime.spawn || { x: source.playerStart.x * scaleX, y: source.playerStart.y * scaleY };
    runtime.collisions = (source.collisions || []).map(function (item) { return scaleRect(item, scaleX, scaleY); });
    runtime.interactables = (source.interactables || []).map(function (item) { return scaleRect(item, scaleX, scaleY); });
    runtime.interactionZones = (source.interactionZones || []).map(function (item) { return scaleRect(item, scaleX, scaleY); });
    runtime.triggerZones = (source.triggerZones || []).map(function (item) { return scaleRect(item, scaleX, scaleY); });
    runtime.decorations = (source.decorations || []).map(function (item) { return scaleRect(item, scaleX, scaleY); });
    runtime.npcs = (source.npcs || []).map(function (item) { return scaleNpc(item, scaleX, scaleY); });
    return runtime;
  }

  function getWorldDimensions(source, imageWidth, imageHeight) {
    const minimumScale = source.minimumWorldWidth ? source.minimumWorldWidth / imageWidth : 1;
    const renderScale = Math.max(1, minimumScale);
    return {
      width: Math.round(imageWidth * renderScale),
      height: Math.round(imageHeight * renderScale)
    };
  }

  function getImageDimensions(source) {
    if (imageDimensionCache[source]) return imageDimensionCache[source];
    imageDimensionCache[source] = new Promise(function (resolve, reject) {
      const image = new Image();
      image.onload = function () { resolve({ width: image.naturalWidth, height: image.naturalHeight }); };
      image.onerror = function () { reject(new Error("地图图片加载失败：" + source)); };
      image.src = source;
    });
    return imageDimensionCache[source];
  }

  function playMapTransition() {
    if (!elements || !elements.explore) return;
    elements.explore.classList.remove("map-transition-pulse");
    void elements.explore.offsetWidth;
    elements.explore.classList.add("map-transition-pulse");
    setTimeout(function () { elements.explore.classList.remove("map-transition-pulse"); }, 460);
  }

  function applyMap(runtimeMap, options) {
    editorSelection = null;
    map = cloneEditableMap(runtimeMap);
    state.currentMap = map.id;
    if (map.entryScene) applyExploreScene(map.entryScene);
    elements.world.style.width = map.width + "px";
    elements.world.style.height = map.height + "px";
    elements.world.dataset.map = map.id;
    elements.world.dataset.asset = map.backgroundAsset;
    elements.world.classList.toggle("has-map-art", Boolean(map.backgroundAsset));
    elements.world.classList.toggle("debug-oldtown", isOldTownDebug());
    elements.world.classList.toggle("debug-map", isMapDebug());
    syncMapDebugUi();
    elements.map.style.backgroundImage = map.backgroundAsset ? 'url("' + map.backgroundAsset + '")' : "";
    elements.collisions.style.backgroundImage = debugCollisions && map.collisionReferenceAsset ? 'url("' + map.collisionReferenceAsset + '")' : "";
    elements.world.classList.toggle("show-collision-reference", debugCollisions && Boolean(map.collisionReferenceAsset));
    elements.chapter.textContent = map.chapter;
    renderCollisions(map.collisions);
    npcManager.render(map.npcs, state);
    renderObjects((map.decorations || []).concat(map.interactables || []));
    const editorPanel = document.querySelector("#oldtown-editor-panel");
    if (isMapEditorActive()) initializeMapEditor();
    else if (editorPanel) editorPanel.hidden = true;
    playerController.setMap(map);
    const savedPosition = options && options.restorePosition && state.mapPositions && state.mapPositions[map.id];
    if (savedPosition && playerController.canOccupy(savedPosition)) {
      playerController.setWorldPosition(savedPosition.x, savedPosition.y);
      playerController.render();
      interactionManager.update(playerController.position, map);
    }
    setObjective(state.currentObjective || "与韩吉交谈");
    resizeWorld();
    save();
  }

  function loadMap(mapId, options) {
    const source = window.TitanExploreMaps[mapId] || window.TitanExploreMaps.hq;
    const token = ++mapLoadToken;
    if (options && options.transition) playMapTransition();
    const configuredDimensions = getWorldDimensions(source, source.width, source.height);
    applyMap(createRuntimeMap(source, configuredDimensions.width, configuredDimensions.height), options);
    if (!source.useNaturalSize || !source.backgroundAsset) return Promise.resolve(map);
    return getImageDimensions(source.backgroundAsset).then(function (dimensions) {
      if (token !== mapLoadToken) return map;
      const worldDimensions = getWorldDimensions(source, dimensions.width, dimensions.height);
      if (worldDimensions.width !== map.width || worldDimensions.height !== map.height) {
        applyMap(createRuntimeMap(source, worldDimensions.width, worldDimensions.height), options);
      }
      return map;
    }).catch(function (error) {
      console.warn(error.message);
      showToast((source.name || "探索") + "地图加载失败，已保留坐标调试层。", "warning");
      return map;
    });
  }

  function setObjective(objective) {
    if (map && ["undergroundStreet", "undergroundTavern", "oldChurch", "warehouse"].includes(map.id) &&
        !state.flags.chapter2ReturnedToHq) {
      objective = window.TitanStory.getChapter2Objective(state.flags);
    }
    state.currentObjective = objective;
    elements.objective.textContent = objective;
  }

  function setFlag(name, value) { state.flags[name] = value === undefined ? true : Boolean(value); }
  function addEvidence(id) { if (!state.evidence.includes(id)) state.evidence.push(id); }

  function showToast(message, kind) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.dataset.kind = kind || "info";
    elements.toast.hidden = false;
    toastTimer = setTimeout(function () { elements.toast.hidden = true; }, 2600);
  }

  function enterBuilding(buildingId) {
    const buildingAliases = {
      tavernEntrance: "tavern",
      oldChurchEntrance: "oldChurch",
      warehouseEntrance: "warehouse"
    };
    const requestedId = typeof buildingId === "string" ? buildingId : "";
    const buildingKey = buildingAliases[requestedId] || requestedId;
    const mappedTarget = map && map.buildings && (map.buildings[buildingKey] || map.buildings[requestedId]);
    const targetMap = mappedTarget || (window.TitanExploreMaps[requestedId] ? requestedId : null);
    if (targetMap && window.TitanExploreMaps[targetMap]) {
      const destination = window.TitanExploreMaps[targetMap];
      state.mapPositions = state.mapPositions || {};
      state.mapPositions[map.id] = { x: playerController.worldX, y: playerController.worldY };
      save();
      return Promise.resolve(loadMap(targetMap, { transition: true })).then(function (loadedMap) {
        if (destination.entryDialog && (!destination.entryDialogFlag || !state.flags[destination.entryDialogFlag])) {
          startDialog(destination.entryDialog);
        }
        return loadedMap;
      });
    }
    showToast("该区域暂未开放", "warning");
    return false;
  }

  function startDialog(sceneId) {
    if (!sceneId || !window.startDialog) return false;
    setGameMode("dialog");
    return window.startDialog(sceneId);
  }

  function teleportToInteraction(id) {
    if (!map || !playerController) return false;
    const targets = (map.interactionZones || []).concat(map.interactables || [], map.npcs || []);
    const target = targets.find(function (item) { return item.id === id; });
    if (!target) return false;
    const center = { x: target.x + target.width / 2, y: target.y + target.height / 2 };
    const radius = target.interactionDistance || 80;
    const useFootCenter = map.id === "seventhMaintenanceStation";
    let best = null;
    for (let y = Math.max(0, Math.floor(center.y - radius - 28)); y <= Math.min(map.height - 56, center.y + radius); y += 6) {
      for (let x = Math.max(0, Math.floor(center.x - radius - 22)); x <= Math.min(map.width - 44, center.x + radius); x += 6) {
        const candidate = { worldX: x, worldY: y };
        if (!playerController.canOccupy(candidate)) continue;
        const distance = Math.hypot(x + 22 - center.x, y + (useFootCenter ? 46.5 : 28) - center.y);
        if (distance <= radius && (!best || distance < best.distance)) best = { x: x, y: y, distance: distance };
      }
    }
    if (!best) return false;
    playerController.setWorldPosition(best.x, best.y);
    const dx = center.x - (best.x + 22);
    const dy = center.y - (best.y + (useFootCenter ? 46.5 : 28));
    playerController.lastDirection = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
    playerController.render();
    updateCamera(playerController.position);
    interactionManager.update(playerController.position, map);
    updateDebugReadout(playerController.position);
    return true;
  }

  function refreshMapState() {
    if (!map) return;
    setObjective(state.currentObjective);
    npcManager.render(map.npcs || [], state);
    renderObjects((map.decorations || []).concat(map.interactables || []));
    if (isMapEditorActive()) initializeMapEditor();
    interactionManager.update(playerController.position, map);
    updateDebugReadout(playerController.position);
    save();
  }

  function setDebugSpawnFromPlayer() {
    if (!map || !["warehouse", "seventhMaintenanceStation"].includes(map.id) || !isMapEditorActive() || !playerController) return false;
    const spawn = {
      x: Math.round(playerController.position.worldX),
      y: Math.round(playerController.position.worldY)
    };
    map.spawn = Object.assign({}, map.spawn, spawn);
    try {
      const key = editorStorageKey(map.id);
      const saved = JSON.parse(localStorage.getItem(key) || "{}");
      saved._spawn = spawn;
      localStorage.setItem(key, JSON.stringify(saved));
    } catch (error) { return false; }
    showToast(map.name + "出生点已设为 X " + spawn.x + " / Y " + spawn.y, "save");
    return true;
  }

  function triggerZone(zone) {
    if (!zone || getMode() !== "explore") return false;
    if (zone.onceFlag && state.flags[zone.onceFlag]) return false;
    if (zone.onceFlag) setFlag(zone.onceFlag, true);
    if (zone.objective) setObjective(zone.objective);
    save();
    if (zone.flagOnly) {
      npcManager.render(map.npcs, state);
      renderObjects((map.decorations || []).concat(map.interactables || []));
      if (isMapEditorActive()) initializeMapEditor();
      interactionManager.clear();
      return true;
    }
    return startDialog(zone.dialog || zone.scene);
  }

  function resumeExplore() {
    setGameMode("explore");
    elements.chapter.textContent = map.chapter;
    npcManager.render(map.npcs, state);
    renderObjects((map.decorations || []).concat(map.interactables || []));
    if (isMapEditorActive()) initializeMapEditor();
    setObjective(state.currentObjective);
    resizeWorld();
    save();
  }

  function initialize() {
    if (!window.getTitanGameState || !window.TitanExploreMaps) return;
    state = window.getTitanGameState();
    const query = new URLSearchParams(location.search);
    elements = {
      stage: document.querySelector("#game-stage"), explore: document.querySelector("#explore-scene"),
      world: document.querySelector("#explore-world"), dialog: document.querySelector("#dialog-area"),
      character: document.querySelector(".character-layer"), chapter: document.querySelector("#chapter-label"),
      map: document.querySelector("#map-layer"), collisions: document.querySelector("#collision-layer"), npcs: document.querySelector("#npc-layer"),
      objects: document.querySelector("#object-layer"), player: document.querySelector("#player"),
      objective: document.querySelector("#objective-text"), prompt: document.querySelector("#interaction-prompt"),
      toast: document.querySelector("#evidence-toast")
    };
    debugCollisions = query.get("debug") === "collisions";
    debugMap = DEBUG_MAP || query.get("debug") === "map";
    debugOldTown = Boolean(window.TitanOldTownGeometry && window.TitanOldTownGeometry.DEBUG_OLDTOWN) ||
      query.get("debug") === "oldtown";
    editOldTown = debugOldTown && query.get("edit") === "1";
    const debugMapId = query.get("map");
    if (debugMapId && window.TitanExploreMaps[debugMapId]) {
      state.currentMap = debugMapId;
      state.mode = "explore";
      state.currentScene = null;
      if (debugMapId === "chapter1_ruins") {
        state.currentObjective = "探索旧城区，寻找异常痕迹";
        state.flags.hqIntroComplete = true;
        state.flags.sermonTriggered = true;
        state.flags.returnedToHqForMission = true;
        state.flags.hqMissionBriefingComplete = true;
      }
      if (debugMapId === "undergroundStreet" || debugMapId === "chapter2_slum") {
        state.currentObjective = "调试地下街地图、碰撞与交互区域";
        state.flags.chapter2BriefingDone = true;
      }
      if (debugMapId === "warehouse") {
        state.currentObjective = "调试废弃仓库碰撞、交互与剧情变量";
        state.flags.chapter2BriefingDone = true;
      }
      if (debugMapId === "seventhMaintenanceStation") {
        state.currentObjective = "调试第七维护站碰撞与调查点";
        state.flags.chapter3_briefing_done = true;
      }
      if (debugMapId === "clockTowerUnderground") {
        state.currentObjective = "调试钟楼地下净化室的三个调查点";
        state.flags.chapter4_letter_received = true;
      }
      if (debugMapId === "centralDistrict") {
        state.currentObjective = "调试中央城区、守门者触发区和广播塔入口";
        state.route = "rebellion";
        state.flags.chapter4_complete = true;
        state.flags.chapter5_started = true;
        state.flags.chapter5_hq_briefing_complete = true;
        state.flags.chapter5_guardian_encountered = false;
        state.flags.chapter5_guardian_battle_complete = false;
        state.flags.chapter5_guardian_defeated = false;
        if (state.minigameResults) state.minigameResults.guardianBoss = null;
      }
      if (debugMapId === "oldChurch") {
        state.currentObjective = "调试旧教堂布局、碰撞与调查点";
        state.flags.chapter2BriefingDone = true;
      }
      if (debugMapId === "centralFacility") {
        state.currentObjective = "调试地下中央设施的三个调查点";
        state.route = "truth";
        state.flags.chapter4_complete = true;
        state.flags.chapter5_started = true;
        state.flags.chapter5_hq_briefing_complete = true;
      }
    }
    elements.debugReadout = document.createElement("aside");
    elements.debugReadout.className = "oldtown-debug-readout";
    elements.debugReadout.innerHTML = '<div class="debug-panel-header"><strong>坐标信息</strong></div><div class="debug-panel-body"><pre class="debug-readout-values"></pre></div>';
    elements.debugReadoutValues = elements.debugReadout.querySelector(".debug-readout-values");
    elements.debugReadout.hidden = true;
    elements.explore.appendChild(elements.debugReadout);
    if (window.TitanDebugPanels) window.TitanDebugPanels.makeMovable(elements.debugReadout, { key: "coordinate-readout", label: "坐标信息" });
    npcManager = new window.TitanNpcManager(elements.npcs);
    interactionManager = new window.TitanInteractionManager(api, npcManager, elements.prompt);
    playerController = new window.TitanPlayerController(elements.player, interactionManager);
    playerController.setOnMove(updateCamera);
    loadMap(state.currentMap || "hq");
    setGameMode(state.mode === "dialog" && state.currentScene ? "dialog" : "explore");
    document.querySelector("#quick-save").addEventListener("click", function () {
      save();
      showToast("进度已保存。", "save");
    });
    window.addEventListener("resize", resizeWorld);
    elements.explore.addEventListener("click", function (event) {
      if (!isMapDebug() || event.target.closest("button, #oldtown-editor-panel, #warehouse-debug-panel, #old-church-debug-panel")) return;
      const rect = elements.world.getBoundingClientRect();
      debugMapPoint = {
        x: Math.round((event.clientX - rect.left) / cameraScale),
        y: Math.round((event.clientY - rect.top) / cameraScale)
      };
      updateDebugReadout(playerController.position);
      showToast("地图坐标：" + debugMapPoint.x + ", " + debugMapPoint.y, "info");
    });
  }

  function editorItem(element) {
    const list = map[element.dataset.editorList] || [];
    return list.find(function (item, index) { return (item.id || String(index)) === element.dataset.editorId; });
  }

  function readEditorState() {
    try { return JSON.parse(localStorage.getItem(editorStorageKey(map.id)) || "{}"); }
    catch (error) { return {}; }
  }

  function writeEditorState(saved) {
    localStorage.setItem(editorStorageKey(map.id), JSON.stringify(saved));
  }

  function saveEditorItem(element, item) {
    const saved = readEditorState();
    const value = {
      x: Math.round(item.x), y: Math.round(item.y),
      width: Math.round(item.width), height: Math.round(item.height)
    };
    ["label", "name", "type", "action", "targetScene", "prompt", "interactionDistance"].forEach(function (key) {
      if (item[key] !== undefined) value[key] = item[key];
    });
    saved[element.dataset.editorList + ":" + element.dataset.editorId] = value;
    writeEditorState(saved);
  }

  function editorReferenceScale() {
    if (map.referenceWidth && map.referenceHeight) {
      return { x: map.width / map.referenceWidth, y: map.height / map.referenceHeight };
    }
    const scale = map.worldScale || 1;
    return { x: scale, y: scale };
  }

  function renderEditorSelection() {
    if (!editorSelection) return;
    const item = editorItem(editorSelection);
    if (!item) return;
    editorSelection.style.left = item.x + "px";
    editorSelection.style.top = item.y + "px";
    editorSelection.style.width = item.width + "px";
    editorSelection.style.height = item.height + "px";
    const radiusMarker = editorSelection.querySelector(".interaction-radius-marker");
    if (radiusMarker && item.interactionDistance) {
      radiusMarker.style.width = item.interactionDistance * 2 + "px";
      radiusMarker.style.height = item.interactionDistance * 2 + "px";
    }
    if (editorSelection.dataset.editorList === "npcs") {
      const liveNpc = (npcManager.npcs || []).find(function (npc) { return npc.id === item.id; });
      if (liveNpc) Object.assign(liveNpc, { x: item.x, y: item.y, width: item.width, height: item.height });
    }
    const scale = editorReferenceScale();
    document.querySelector("#oldtown-editor-values").textContent =
      editorSelection.dataset.editorList + ":" + editorSelection.dataset.editorId + "\n" +
      "world  x:" + Math.round(item.x) + " y:" + Math.round(item.y) + " w:" + Math.round(item.width) + " h:" + Math.round(item.height) + "\n" +
      "source x:" + Math.round(item.x / scale.x) + " y:" + Math.round(item.y / scale.y) +
      " w:" + Math.round(item.width / scale.x) + " h:" + Math.round(item.height / scale.y) +
      (item.interactionDistance ? "\ninteraction radius:" + Math.round(item.interactionDistance) : "");
    const radiusControls = document.querySelector("#map-editor-radius-controls");
    const radiusInput = document.querySelector("#map-editor-radius-input");
    const isInteraction = editorSelection.dataset.editorList === "interactionZones";
    if (radiusControls) radiusControls.hidden = !isInteraction;
    if (radiusInput && isInteraction) radiusInput.value = Math.round(item.interactionDistance || 80);
    saveEditorItem(editorSelection, item);
  }

  function adjustSelectedInteractionRadius(value, relative) {
    if (!editorSelection || editorSelection.dataset.editorList !== "interactionZones") return;
    const item = editorItem(editorSelection);
    if (!item) return;
    const next = relative ? Number(item.interactionDistance || 80) + value : Number(value);
    if (!Number.isFinite(next)) return;
    item.interactionDistance = Math.max(10, Math.min(1000, Math.round(next)));
    renderEditorSelection();
    if (interactionManager && playerController) interactionManager.update(playerController.position, map);
  }

  function exportEditorData() {
    const scale = editorReferenceScale();
    function clean(item, listName) {
      const copy = {};
      Object.keys(item).forEach(function (key) {
        if (key !== "element" && key !== "visual" && key !== "positionByFlags") copy[key] = item[key];
      });
      copy.x = Math.round(item.x / scale.x);
      copy.y = Math.round(item.y / scale.y);
      copy.width = Math.round(listName === "npcs" ? item.width : item.width / scale.x);
      copy.height = Math.round(listName === "npcs" ? item.height : item.height / scale.y);
      return copy;
    }
    const exported = {
      mapId: map.id,
      referenceWidth: map.referenceWidth || map.sourceWidth || map.width,
      referenceHeight: map.referenceHeight || map.sourceHeight || map.height,
      spawn: { x: Math.round(map.spawn.x / scale.x), y: Math.round(map.spawn.y / scale.y) }
    };
    ["collisions", "interactables", "interactionZones", "triggerZones", "npcs", "decorations"].forEach(function (listName) {
      if (map[listName] && map[listName].length) exported[listName] = map[listName].map(function (item) { return clean(item, listName); });
    });
    if (navigator.clipboard) navigator.clipboard.writeText(JSON.stringify(exported, null, 2));
    showToast("当前地图配置 JSON 已复制", "save");
  }

  function refreshEditorLayers() {
    renderCollisions(map.collisions || []);
    npcManager.render(map.npcs || [], state);
    renderObjects((map.decorations || []).concat(map.interactables || []));
    initializeMapEditor();
  }

  function selectEditorItem(listName, id) {
    const element = elements.world.querySelector('[data-editor-list="' + listName + '"][data-editor-id="' + id + '"]');
    if (!element) return;
    if (editorSelection) editorSelection.classList.remove("editor-selected");
    editorSelection = element;
    element.classList.add("editor-selected");
    renderEditorSelection();
  }

  function addEditorItem(listName) {
    const player = playerController && playerController.position || map.playerStart;
    const id = "custom-" + Date.now().toString(36);
    const item = listName === "interactionZones" ? {
      id: id, type: "inspect", action: "startDialog", targetScene: "", name: "新交互区",
      prompt: "[E] 调查", interactionDistance: 80,
      x: Math.round(Math.max(0, Math.min(map.width - 120, player.x + 70))),
      y: Math.round(Math.max(0, Math.min(map.height - 80, player.y - 40))),
      width: 120, height: 80
    } : {
      id: id,
      label: "自定义障碍",
      x: Math.round(Math.max(0, Math.min(map.width - 120, player.x + 70))),
      y: Math.round(Math.max(0, Math.min(map.height - 80, player.y - 40))),
      width: 120,
      height: 80
    };
    map[listName].push(item);
    refreshEditorLayers();
    selectEditorItem(listName, id);
    showToast(listName === "collisions" ? "已新增碰撞框" : "已新增交互区", "save");
  }

  function deleteEditorItem() {
    if (!editorSelection) return showToast("请先选择一个框", "warning");
    const listName = editorSelection.dataset.editorList;
    const id = editorSelection.dataset.editorId;
    const list = map[listName];
    const index = list && list.findIndex(function (item, itemIndex) { return (item.id || String(itemIndex)) === id; });
    if (index === undefined || index < 0) return;
    list.splice(index, 1);
    const saved = readEditorState();
    delete saved[listName + ":" + id];
    saved._deleted = saved._deleted || [];
    if (saved._deleted.indexOf(listName + ":" + id) < 0) saved._deleted.push(listName + ":" + id);
    writeEditorState(saved);
    editorSelection = null;
    refreshEditorLayers();
    document.querySelector("#oldtown-editor-values").textContent = "已删除 " + listName + ":" + id;
    const radiusControls = document.querySelector("#map-editor-radius-controls");
    if (radiusControls) radiusControls.hidden = true;
    showToast("框已删除", "warning");
  }

  function initializeMapEditor() {
    let panel = document.querySelector("#oldtown-editor-panel");
    if (!panel) {
      panel = document.createElement("aside");
      panel.id = "oldtown-editor-panel";
      panel.innerHTML = '<div class="debug-panel-header"><strong id="map-editor-title">地图坐标编辑器</strong></div><div class="debug-panel-body"><small>拖动标题栏移动｜色块拖动：调整坐标｜右下角：缩放</small><pre id="oldtown-editor-values">点击一个色块开始调整</pre><div id="map-editor-radius-controls" hidden><label for="map-editor-radius-input">交互触发半径</label><button type="button" id="map-editor-radius-minus">−10</button><input id="map-editor-radius-input" type="number" min="10" max="1000" step="1"><button type="button" id="map-editor-radius-plus">+10</button></div><button type="button" id="map-editor-add-collision">新增碰撞框</button><button type="button" id="map-editor-add-interaction">新增交互区</button><button type="button" id="map-editor-delete">删除选中</button><button type="button" id="oldtown-editor-copy">复制 JSON</button><button type="button" id="oldtown-editor-reset">清除调整</button></div>';
      elements.explore.appendChild(panel);
      panel.querySelector("#map-editor-add-collision").addEventListener("click", function () { addEditorItem("collisions"); });
      panel.querySelector("#map-editor-add-interaction").addEventListener("click", function () { addEditorItem("interactionZones"); });
      panel.querySelector("#map-editor-delete").addEventListener("click", deleteEditorItem);
      panel.querySelector("#map-editor-radius-minus").addEventListener("click", function () { adjustSelectedInteractionRadius(-10, true); });
      panel.querySelector("#map-editor-radius-plus").addEventListener("click", function () { adjustSelectedInteractionRadius(10, true); });
      panel.querySelector("#map-editor-radius-input").addEventListener("change", function (event) { adjustSelectedInteractionRadius(event.target.value, false); });
      panel.querySelector("#map-editor-radius-input").addEventListener("keydown", function (event) { event.stopPropagation(); });
      panel.querySelector("#oldtown-editor-copy").addEventListener("click", exportEditorData);
      panel.querySelector("#oldtown-editor-reset").addEventListener("click", function () {
        localStorage.removeItem(editorStorageKey(map.id));
        location.reload();
      });
      if (window.TitanDebugPanels) window.TitanDebugPanels.makeMovable(panel, { key: "map-editor", label: "坐标编辑器" });
    }
    if (panel.dataset.userHidden !== "1") panel.hidden = false;
    panel.querySelector("#map-editor-title").textContent = map.name + " · 坐标编辑器";
    elements.npcs.querySelectorAll("[data-npc-id]").forEach(function (npcElement) {
      npcElement.dataset.editorList = "npcs";
      npcElement.dataset.editorId = npcElement.dataset.npcId;
    });
    const targets = elements.world.querySelectorAll("[data-editor-list]");
    targets.forEach(function (target) {
      target.classList.add("oldtown-editable");
      if (target.dataset.editorBound === "1") return;
      target.dataset.editorBound = "1";
      target.addEventListener("pointerdown", function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (editorSelection) editorSelection.classList.remove("editor-selected");
        editorSelection = target;
        target.classList.add("editor-selected");
        const item = editorItem(target);
        const worldRect = elements.world.getBoundingClientRect();
        const scale = worldRect.width / map.width;
        const targetRect = target.getBoundingClientRect();
        const resizing = event.clientX > targetRect.right - 18 && event.clientY > targetRect.bottom - 18;
        const start = { x: event.clientX, y: event.clientY, itemX: item.x, itemY: item.y, width: item.width, height: item.height };
        function move(moveEvent) {
          const dx = (moveEvent.clientX - start.x) / scale;
          const dy = (moveEvent.clientY - start.y) / scale;
          if (resizing) {
            item.width = Math.max(8, start.width + dx);
            item.height = Math.max(8, start.height + dy);
          } else {
            item.x = Math.max(0, Math.min(map.width - item.width, start.itemX + dx));
            item.y = Math.max(0, Math.min(map.height - item.height, start.itemY + dy));
          }
          renderEditorSelection();
        }
        function up() { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); }
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
        renderEditorSelection();
      });
    });
  }

  window.addEventListener("keydown", function (event) {
    if (event.key === "F2") {
      event.preventDefault();
      debugMap = !debugMap;
      if (elements && map) {
        if (debugMap && ["undergroundStreet", "undergroundTavern", "oldChurch", "warehouse", "seventhMaintenanceStation", "clockTowerUnderground", "centralDistrict", "centralFacility"].includes(map.id)) applySavedEditorState(map, map.id);
        elements.world.classList.toggle("debug-map", isMapDebug());
        renderCollisions(map.collisions || []);
        renderObjects((map.decorations || []).concat(map.interactables || []));
        const editorPanel = document.querySelector("#oldtown-editor-panel");
        if (isMapEditorActive()) initializeMapEditor();
        else {
          editorSelection = null;
          if (editorPanel) editorPanel.hidden = true;
        }
        updateDebugReadout(playerController && playerController.position);
        showToast(debugMap ? "地图调试已开启" : "地图调试已关闭", "info");
      }
      return;
    }
    if (!isMapEditorActive() || !editorSelection || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const item = editorItem(editorSelection);
    const step = event.shiftKey ? 10 : 1;
    if (event.key === "ArrowLeft") item.x -= step;
    if (event.key === "ArrowRight") item.x += step;
    if (event.key === "ArrowUp") item.y -= step;
    if (event.key === "ArrowDown") item.y += step;
    renderEditorSelection();
  });

  const api = {
    getMode: getMode, getState: getState, save: save, loadMap: loadMap,
    setGameMode: setGameMode, setObjective: setObjective, setFlag: setFlag,
    addEvidence: addEvidence, showToast: showToast, startDialog: startDialog,
    triggerZone: triggerZone, enterBuilding: enterBuilding,
    getCurrentMap: function () { return map; }, teleportToInteraction: teleportToInteraction, refreshMapState: refreshMapState,
    setDebugSpawnFromPlayer: setDebugSpawnFromPlayer,
    pauseExplore: function () { setGameMode("dialog"); }, resumeExplore: resumeExplore,
    getPlayerController: function () { return playerController; }
  };

  window.TitanExplore = api;
  window.enterBuilding = enterBuilding;
  document.addEventListener("DOMContentLoaded", initialize);
}());
