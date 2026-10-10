/* Edge/CDP 端到端冒烟测试。用法：node scripts/test-oldtown-browser.js [CDP端口] [站点地址] */
"use strict";

const assert = require("node:assert/strict");
const port = process.argv[2] || "9223";
const baseUrl = (process.argv[3] || "http://127.0.0.1:8765").replace(/\/$/, "");
const screenshotPath = process.argv[4] || "";

function delay(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }

async function connect() {
  const targets = await fetch("http://127.0.0.1:" + port + "/json/list").then(function (response) { return response.json(); });
  const target = targets.find(function (item) { return item.type === "page"; });
  if (!target) throw new Error("找不到 Edge 页面调试目标");
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(function (resolve, reject) {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let callId = 0;
  const pending = new Map();
  socket.addEventListener("message", function (event) {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const callback = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) callback.reject(new Error(message.error.message));
    else callback.resolve(message.result);
  });
  function call(method, params) {
    return new Promise(function (resolve, reject) {
      const id = ++callId;
      pending.set(id, { resolve: resolve, reject: reject });
      socket.send(JSON.stringify({ id: id, method: method, params: params || {} }));
    });
  }
  async function evaluate(expression) {
    const result = await call("Runtime.evaluate", { expression: expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text + ": " + (result.result.description || ""));
    return result.result.value;
  }
  async function navigate(url) {
    await call("Page.navigate", { url: url });
    await delay(850);
  }
  await call("Page.enable");
  await call("Runtime.enable");
  return { socket: socket, call: call, evaluate: evaluate, navigate: navigate };
}

async function main() {
  const cdp = await connect();
  const evaluate = cdp.evaluate;
  try {
    await cdp.call("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    async function storyState() {
      return evaluate(`typeof getTitanGameState === "function" ? (() => { const state=getTitanGameState(); return {mode:state.mode,map:state.currentMap,scene:state.currentScene}; })() : null`);
    }
    async function driveStoryUntil(predicate, limit) {
      for (let i = 0; i < (limit || 160); i++) {
        const state = await storyState();
        if (state && predicate(state)) return state;
        await evaluate(`(() => {
          const choice = document.querySelector(".choice-button");
          if (choice) { choice.click(); return; }
          const box = document.querySelector("#dialog-box");
          if (box) { box.click(); box.click(); }
        })()`);
        await delay(55);
      }
      throw new Error("剧情未在预期步数内到达目标状态");
    }

    /* 从首页的新游戏入口实际走到第一章，验证既有序章链路没有被地图接入破坏。 */
    await cdp.navigate(baseUrl + "/index.html");
    await evaluate(`(() => { TitanSave.clearGameSave(); window.confirm=()=>true; document.querySelector("#new-game").click(); })()`);
    await delay(120);
    await evaluate(`document.querySelector("#skip-intro").click()`);
    await delay(80);
    await evaluate(`document.querySelector("#chapter-title-overlay").dispatchEvent(new AnimationEvent("animationend", {animationName:"prologue-overlay"}))`);
    await delay(80);
    await evaluate(`document.querySelector("#skip-intro").click()`);
    await delay(950);
    assert.match(await evaluate("location.href"), /game\.html/);
    await driveStoryUntil(function (state) { return state.mode === "explore" && state.map === "hq"; });
    await evaluate(`TitanExplore.startDialog("hq_hange_intro_01")`);
    await driveStoryUntil(function (state) { return state.mode === "explore" && state.map === "hq"; });
    await evaluate(`TitanExplore.loadMap("street_sermon"); TitanExplore.startDialog("street_06_trigger")`);
    await driveStoryUntil(function (state) { return state.mode === "explore" && state.map === "street_sermon"; });
    await evaluate(`(() => {
      TitanExplore.setFlag("streetReturnPrompted", true);
      const controller = TitanExplore.getPlayerController();
      controller.interactionManager.update(controller.position, controller.map);
      controller.interactionManager.interact();
    })()`);
    await delay(100);
    assert.deepEqual(await evaluate(`(() => {
      const controller = TitanExplore.getPlayerController();
      return {map:getTitanGameState().currentMap,x:Math.round(controller.worldX),y:Math.round(controller.worldY)};
    })()`), {map:"hq",x:1508,y:620});
    await evaluate(`TitanExplore.startDialog("hq_mission_briefing_01")`);
    await driveStoryUntil(function (state) { return state.mode === "explore" && state.map === "chapter1_ruins"; });

    /* 重新建立干净的第一章测试存档，逐项验证新版地图。 */
    await cdp.navigate(baseUrl + "/index.html");
    await evaluate(`(() => {
      const state = TitanSave.createInitialGameState();
      state.mode = "explore";
      state.currentMap = "chapter1_ruins";
      state.currentScene = null;
      state.currentObjective = "探索旧城区，寻找异常痕迹";
      state.flags.introPlayed = true;
      state.flags.prologueComplete = true;
      state.flags.hqMissionBriefingComplete = true;
      TitanSave.saveGame(state);
      return true;
    })()`);
    await cdp.navigate(baseUrl + "/game.html?debug=oldtown");

    const initial = await evaluate(`(() => {
      const map = TitanExploreMaps.chapter1_ruins;
      const viewport = document.querySelector("#explore-scene").getBoundingClientRect();
      const world = document.querySelector("#explore-world").getBoundingClientRect();
      const image = document.querySelector("#map-layer");
      const corpse = document.querySelector('[data-object-id="fallen-titan-visual"]');
      return {
        mapWidth: map.width, mapHeight: map.height, viewportWidth: viewport.width, viewportHeight: viewport.height,
        worldWidth: world.width, worldHeight: world.height, background: getComputedStyle(image).backgroundImage,
        corpseVisible: Boolean(corpse), debugVisible: !document.querySelector(".oldtown-debug-readout").hidden,
        player: { x: TitanExplore.getPlayerController().position.x, y: TitanExplore.getPlayerController().position.y }
      };
    })()`);
    assert.deepEqual([initial.mapWidth, initial.mapHeight], [2508, 1412]);
    assert.deepEqual([initial.viewportWidth, initial.viewportHeight], [1440, 900]);
    assert.ok(initial.worldWidth > initial.viewportWidth && initial.worldHeight > initial.viewportHeight);
    assert.match(initial.background, /oldtown\.png/);
    assert.equal(initial.corpseVisible, false);
    assert.equal(initial.debugVisible, true);
    if (screenshotPath) {
      const capture = await cdp.call("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      require("node:fs").writeFileSync(screenshotPath, Buffer.from(capture.data, "base64"));
    }
    await cdp.navigate(baseUrl + "/game.html");
    assert.equal(await evaluate(`document.querySelectorAll(".oldtown-debug-marker").length`), 0);
    assert.equal(await evaluate(`document.querySelector(".oldtown-debug-readout").hidden`), true);
    assert.equal(await evaluate(`getComputedStyle(document.querySelector("#collision-layer")).opacity`), "0");
    await cdp.navigate(baseUrl + "/game.html?debug=oldtown");

    const cameraBounds = await evaluate(`(() => {
      const pc = TitanExplore.getPlayerController();
      pc.setActive(false);
      const positions = [{x:0,y:0},{x:2464,y:0},{x:0,y:1356},{x:2464,y:1356}];
      return positions.map(position => {
        pc.position.x = position.x; pc.position.y = position.y; pc.render(); pc.onMove(pc.position, pc.map);
        const rect = document.querySelector("#explore-world").getBoundingClientRect();
        return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
      });
    })()`);
    cameraBounds.forEach(function (rect) {
      assert.ok(rect.left <= 0.1 && rect.top <= 0.1 && rect.right >= 1439.9 && rect.bottom >= 899.9, "相机露出了地图外区域");
    });

    async function interact(id) {
      return evaluate(`(() => {
        const pc = TitanExplore.getPlayerController();
        pc.setActive(false);
        const map = TitanExploreMaps.chapter1_ruins;
        const item = map.interactables.find(candidate => candidate.id === ${JSON.stringify(id)});
        let best = null;
        for (let y = 0; y < map.height - 56; y += 18) for (let x = 0; x < map.width - 44; x += 18) {
          const candidate = {x, y, width:44, height:56};
          if (!pc.canOccupy(candidate)) continue;
          const distance = Math.hypot(x + 22 - (item.x + item.width / 2), y + 28 - (item.y + item.height / 2));
          if (distance <= item.interactionDistance && (!best || distance < best.distance)) best = {x, y, distance};
        }
        if (!best) return {ok:false};
        pc.position.x = best.x; pc.position.y = best.y; pc.render(); pc.onMove(pc.position, pc.map);
        pc.interactionManager.update(pc.position, pc.map);
        const prompt = document.querySelector("#interaction-prompt").textContent;
        pc.interactionManager.interact();
        return {ok:true, prompt, scene:getTitanGameState().currentScene};
      })()`);
    }

    async function advanceUntilExplore() {
      return evaluate(`(async () => {
        for (let i = 0; i < 120; i++) {
          const state = getTitanGameState();
          if (state.mode === "explore") return true;
          const box = document.querySelector("#dialog-box");
          box.click(); await new Promise(resolve => setTimeout(resolve, 22));
          box.click(); await new Promise(resolve => setTimeout(resolve, 22));
        }
        return false;
      })()`);
    }

    for (const item of [
      ["children-graffiti", "clue_sea_memory"],
      ["ruins-dawn-symbol", "clue_dawn_symbol"],
      ["ruins-footprints", "clue_titan_footprints"]
    ]) {
      const result = await interact(item[0]);
      assert.equal(result.ok, true);
      assert.match(result.prompt, /调查/);
      assert.equal(await advanceUntilExplore(), true);
      assert.equal(await evaluate(`Boolean(getTitanGameState().flags[${JSON.stringify(item[1])}])`), true);
    }

    const triggered = await evaluate(`(() => {
      const pc = TitanExplore.getPlayerController();
      pc.setActive(false);
      const zone = TitanExploreMaps.chapter1_ruins.triggerZones.find(item => item.id === "chapter1TitanTrigger");
      for (let y = zone.y; y < zone.y + zone.height; y += 12) for (let x = zone.x; x < zone.x + zone.width; x += 12) {
        const candidate = {x, y, width:44, height:56};
        if (!pc.canOccupy(candidate)) continue;
        pc.position.x=x; pc.position.y=y; pc.render(); pc.interactionManager.update(pc.position, pc.map);
        return {scene:getTitanGameState().currentScene, started:getTitanGameState().flags.chapter1_minigame_started};
      }
      return null;
    })()`);
    assert.ok(triggered);
    assert.equal(triggered.scene, "chapter1_titan_roar");
    assert.equal(triggered.started, true);

    for (let i = 0; i < 35; i++) {
      const url = await evaluate("location.href");
      if (/minigames\/maneuver\/game\.html/.test(url)) break;
      await evaluate(`(() => { const box=document.querySelector("#dialog-box"); if(box){box.click();box.click();} })()`);
      await delay(120);
    }
    assert.match(await evaluate("location.href"), /minigames\/maneuver\/game\.html/);
    assert.equal(await evaluate(`Boolean(document.querySelector("#game"))`), true);

    await evaluate(`(() => {
      localStorage.setItem("wall-rift-maneuver-result", JSON.stringify({maneuverCleared:true, injured:false, time:18, deaths:0, titanHits:0, titanDamageTaken:false}));
      location.href = "../../game.html?mode=maneuver-return&debug=oldtown";
    })()`);
    await delay(1100);
    const returned = await evaluate(`(() => ({scene:getTitanGameState().currentScene, map:getTitanGameState().currentMap,
      finished:getTitanGameState().flags.chapter1_minigame_finished, completed:getTitanGameState().flags.maneuverCompleted}))()`);
    assert.equal(returned.map, "chapter1_ruins");
    assert.equal(returned.finished, true);
    assert.equal(returned.completed, true);
    assert.equal(returned.scene, "chapter1_maneuver_success");
    assert.equal(await advanceUntilExplore(), true);

    let corpseState = await evaluate(`(() => ({
      visible:Boolean(document.querySelector('[data-object-id="fallen-titan-visual"]')),
      image:(() => {const image=document.querySelector('[data-object-id="fallen-titan-visual"] .object-image');
        return image&&{src:image.getAttribute("src"),width:image.naturalWidth,height:image.naturalHeight,
          ready:image.parentElement.classList.contains("has-object-image")};})(),
      x:TitanExplore.getPlayerController().position.x,
      y:TitanExplore.getPlayerController().position.y
    }))()`);
    assert.equal(corpseState.visible, true);
    assert.deepEqual(corpseState.image, {src:"images/objects/巨人尸体.png",width:1564,height:1006,ready:true});
    assert.deepEqual([corpseState.x, corpseState.y], [1740, 398]);

    await cdp.call("Page.reload");
    await delay(900);
    corpseState = await evaluate(`(() => ({visible:Boolean(document.querySelector('[data-object-id="fallen-titan-visual"]')),
      finished:getTitanGameState().flags.chapter1_minigame_finished}))()`);
    assert.equal(corpseState.visible, true);
    assert.equal(corpseState.finished, true);

    const corpseInteraction = await interact("fallen-titan");
    assert.equal(corpseInteraction.ok, true);
    await evaluate(`document.querySelector("#dialog-box").click()`);
    await delay(60);
    async function choose(label) {
      const clicked = await evaluate(`(() => {
        const button = Array.from(document.querySelectorAll(".choice-button")).find(item => item.textContent.includes(${JSON.stringify(label)}));
        if (!button) return false; button.click(); return true;
      })()`);
      assert.equal(clicked, true, "找不到尸体调查选项：" + label);
      await delay(60);
    }
    async function returnToBodyMenu() {
      for (let i = 0; i < 8; i++) {
        if (await evaluate(`getTitanGameState().currentScene === "chapter1_body_investigation"`)) return;
        await evaluate(`document.querySelector("#dialog-box").click()`);
        await delay(35);
      }
      throw new Error("尸体调查没有返回选择菜单");
    }
    await choose("调查手部");
    await returnToBodyMenu();
    await evaluate(`document.querySelector("#dialog-box").click()`);
    await delay(40);
    await choose("调查残留衣物");
    await returnToBodyMenu();
    await evaluate(`document.querySelector("#dialog-box").click()`);
    await delay(40);
    await choose("调查金属反光");

    for (let i = 0; i < 100; i++) {
      const scene = await evaluate(`getTitanGameState().currentScene || ""`);
      if (scene.indexOf("chapter2_") === 0) break;
      await evaluate(`(() => { const box=document.querySelector("#dialog-box"); if(box){box.click();box.click();} })()`);
      await delay(45);
    }
    const finalState = await evaluate(`(() => ({scene:getTitanGameState().currentScene, cross:getTitanGameState().flags.clue_cross_obtained,
      complete:getTitanGameState().flags.chapter1Complete, achievement:TitanAchievements.getAchievements().includes("relic_cross")}))()`);
    assert.match(finalState.scene, /^chapter2_/);
    assert.equal(finalState.cross, true);
    assert.equal(finalState.complete, true);
    assert.equal(finalState.achievement, true);
    console.log("Oldtown browser flow passed at 1440x900.");
  } finally {
    cdp.socket.close();
  }
}

main().catch(function (error) {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
