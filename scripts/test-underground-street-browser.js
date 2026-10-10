/* Edge/CDP 地下街端到端冒烟测试。用法：node scripts/test-underground-street-browser.js [CDP端口] [站点地址] */
"use strict";

const assert = require("node:assert/strict");
const port = process.argv[2] || "9224";
const baseUrl = (process.argv[3] || "http://127.0.0.1:8765").replace(/\/$/, "");

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function connect() {
  const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(response => response.json());
  const target = targets.find(item => item.type === "page");
  if (!target) throw new Error("找不到 Edge 页面调试目标");
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let callId = 0;
  const pending = new Map();
  const runtimeErrors = [];
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown") {
      const details = message.params.exceptionDetails;
      runtimeErrors.push((details.exception && details.exception.description) || details.text);
    }
    if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
      runtimeErrors.push(message.params.args.map(item => item.value || item.description).join(" "));
    }
    if (!message.id || !pending.has(message.id)) return;
    const callback = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) callback.reject(new Error(message.error.message));
    else callback.resolve(message.result);
  });
  function call(method, params) {
    return new Promise((resolve, reject) => {
      const id = ++callId;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params: params || {} }));
    });
  }
  async function evaluate(expression) {
    const result = await call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.result.description || result.exceptionDetails.text);
    return result.result.value;
  }
  await call("Page.enable");
  await call("Runtime.enable");
  return { socket, call, evaluate, runtimeErrors };
}

async function main() {
  const cdp = await connect();
  try {
    await cdp.call("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await cdp.call("Page.navigate", { url: `${baseUrl}/game.html?map=undergroundStreet&debug=map` });
    await delay(1000);

    const initial = await cdp.evaluate(`(() => {
      const controller = TitanExplore.getPlayerController();
      const world = document.querySelector("#explore-world");
      const foot = getPlayerFootRect(controller.position);
      return {
        id: world.dataset.map,
        width: controller.map.width,
        height: controller.map.height,
        background: getComputedStyle(document.querySelector("#map-layer")).backgroundImage,
        transform: world.style.transform,
        player: {
          worldX: Math.round(controller.worldX), worldY: Math.round(controller.worldY),
          width: controller.width, height: controller.height,
          spriteWidth: controller.spriteWidth, spriteHeight: controller.spriteHeight,
          footWidth: controller.footWidth, footHeight: controller.footHeight
        },
        foot,
        collisionCount: controller.map.collisions.length,
        interactionCount: controller.map.interactionZones.length,
        debug: world.classList.contains("debug-map"),
        debugReadout: document.querySelector(".oldtown-debug-readout").textContent
      };
    })()`);
    assert.equal(initial.id, "undergroundStreet");
    assert.deepEqual([initial.width, initial.height], [3000, 1799]);
    assert.match(initial.background, /underground-street\.png/);
    assert.match(initial.transform, /scale\(1\)/);
    assert.deepEqual(initial.player, {
      worldX: 1458, worldY: 1378, width: 44, height: 56,
      spriteWidth: 92, spriteHeight: 92, footWidth: 30, footHeight: 17
    });
    assert.deepEqual([initial.foot.width, initial.foot.height], [30, 17]);
    assert.equal(initial.collisionCount, 91);
    assert.equal(initial.interactionCount, 7);
    assert.equal(initial.debug, true);
    assert.match(initial.debugReadout, /Camera X:/);

    const editor = await cdp.evaluate(`(() => {
      const pc = TitanExplore.getPlayerController();
      const panel = document.querySelector("#oldtown-editor-panel");
      const target = document.querySelector('[data-editor-list="interactionZones"][data-editor-id="announcementBoard"]');
      const zone = pc.map.interactionZones.find(item => item.id === "announcementBoard");
      const before = {x:zone.x,y:zone.y,width:zone.width,height:zone.height};
      let rect = target.getBoundingClientRect();
      target.dispatchEvent(new PointerEvent("pointerdown", {bubbles:true,clientX:rect.left+rect.width/2,clientY:rect.top+rect.height/2}));
      dispatchEvent(new PointerEvent("pointermove", {clientX:rect.left+rect.width/2+40,clientY:rect.top+rect.height/2+20}));
      dispatchEvent(new PointerEvent("pointerup"));
      rect = target.getBoundingClientRect();
      target.dispatchEvent(new PointerEvent("pointerdown", {bubbles:true,clientX:rect.right-2,clientY:rect.bottom-2}));
      dispatchEvent(new PointerEvent("pointermove", {clientX:rect.right+30,clientY:rect.bottom+14}));
      dispatchEvent(new PointerEvent("pointerup"));
      dispatchEvent(new KeyboardEvent("keydown", {key:"ArrowRight"}));
      const radiusInput=panel.querySelector("#map-editor-radius-input");
      radiusInput.value="96"; radiusInput.dispatchEvent(new Event("change", {bubbles:true}));
      const adjusted = {x:Math.round(zone.x),y:Math.round(zone.y),width:Math.round(zone.width),height:Math.round(zone.height)};
      const radiusMarker=target.querySelector(".interaction-radius-marker");
      const radiusControlsVisible=!panel.querySelector("#map-editor-radius-controls").hidden;
      const collisionCount = pc.map.collisions.length;
      panel.querySelector("#map-editor-add-collision").click();
      const addedCollision = pc.map.collisions.length === collisionCount + 1 && Boolean(document.querySelector(".editor-selected"));
      panel.querySelector("#map-editor-delete").click();
      const deletedCollision = pc.map.collisions.length === collisionCount;
      const interactionCount = pc.map.interactionZones.length;
      panel.querySelector("#map-editor-add-interaction").click();
      const addedInteraction = pc.map.interactionZones.length === interactionCount + 1;
      panel.querySelector("#map-editor-delete").click();
      return {
        visible: !panel.hidden,
        title: panel.querySelector("#map-editor-title").textContent,
        before, adjusted, radius:zone.interactionDistance, radiusWidth:radiusMarker.style.width,
        radiusControlsVisible,
        addedCollision, deletedCollision, addedInteraction,
        deletedInteraction: pc.map.interactionZones.length === interactionCount,
        persisted: Boolean(localStorage.getItem("titan_map_geometry_editor_v1:undergroundStreet"))
      };
    })()`);
    assert.equal(editor.visible, true);
    assert.match(editor.title, /地下街/);
    assert.ok(editor.adjusted.x > editor.before.x && editor.adjusted.y > editor.before.y, "编辑器无法拖动交互区");
    assert.ok(editor.adjusted.width > editor.before.width && editor.adjusted.height > editor.before.height, "编辑器无法缩放交互区");
    assert.equal(editor.radius, 96, "编辑器无法修改交互半径");
    assert.equal(editor.radiusWidth, "192px", "交互半径圆未实时更新");
    assert.equal(editor.radiusControlsVisible, true);
    assert.equal(editor.addedCollision && editor.deletedCollision && editor.addedInteraction && editor.deletedInteraction, true);
    assert.equal(editor.persisted, true);

    await cdp.call("Page.navigate", { url: `${baseUrl}/game.html?map=undergroundStreet` });
    await delay(700);
    const restoredByF2 = await cdp.evaluate(`(() => {
      const panel = document.querySelector("#oldtown-editor-panel");
      const hiddenBefore = !panel || panel.hidden;
      dispatchEvent(new KeyboardEvent("keydown", {key:"F2"}));
      const zone = TitanExplore.getPlayerController().map.interactionZones.find(item => item.id === "announcementBoard");
      return {hiddenBefore, panelVisible:!document.querySelector("#oldtown-editor-panel").hidden,
        adjusted:{x:Math.round(zone.x),y:Math.round(zone.y),width:Math.round(zone.width),height:Math.round(zone.height)}};
    })()`);
    assert.equal(restoredByF2.hiddenBefore && restoredByF2.panelVisible, true);
    assert.deepEqual(restoredByF2.adjusted, editor.adjusted, "F2 未恢复上次保存的地图调整");

    const f2 = await cdp.evaluate(`(() => {
      dispatchEvent(new KeyboardEvent("keydown", {key:"F2"}));
      const panel = document.querySelector("#oldtown-editor-panel");
      const off = !document.querySelector("#explore-world").classList.contains("debug-map") && document.querySelector(".oldtown-debug-readout").hidden && panel.hidden;
      dispatchEvent(new KeyboardEvent("keydown", {key:"F2"}));
      return {off, on:document.querySelector("#explore-world").classList.contains("debug-map") && !panel.hidden};
    })()`);
    assert.deepEqual(f2, { off: true, on: true });

    const cameraBounds = await cdp.evaluate(`(() => {
      const pc = TitanExplore.getPlayerController();
      pc.setActive(false);
      return [{x:0,y:0},{x:pc.map.width-44,y:0},{x:0,y:pc.map.height-56},{x:pc.map.width-44,y:pc.map.height-56}].map(point => {
        pc.position.x=point.x; pc.position.y=point.y; pc.render(); pc.onMove(pc.position,pc.map);
        const world=document.querySelector("#explore-world").getBoundingClientRect();
        const viewport=document.querySelector("#explore-scene").getBoundingClientRect();
        return {left:world.left-viewport.left,top:world.top-viewport.top,right:world.right-viewport.right,bottom:world.bottom-viewport.bottom};
      });
    })()`);
    cameraBounds.forEach(rect => {
      assert.ok(rect.left <= 0.1 && rect.top <= 0.1 && rect.right >= -0.1 && rect.bottom >= -0.1, "相机露出了地图外区域");
    });

    await cdp.call("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
    await cdp.evaluate(`dispatchEvent(new Event("resize"))`);
    await delay(80);
    const largeViewport = await cdp.evaluate(`(() => {
      const world=document.querySelector("#explore-world").getBoundingClientRect();
      const viewport=document.querySelector("#explore-scene").getBoundingClientRect();
      return {left:world.left-viewport.left,top:world.top-viewport.top,right:world.right-viewport.right,bottom:world.bottom-viewport.bottom};
    })()`);
    assert.ok(largeViewport.left <= 0.1 && largeViewport.top <= 0.1 && largeViewport.right >= -0.1 && largeViewport.bottom >= -0.1,
      "大于原图的视口露出了地图外区域");
    await cdp.call("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await cdp.evaluate(`dispatchEvent(new Event("resize"))`);

    const building = await cdp.evaluate(`(() => {
      const pc=TitanExplore.getPlayerController(),zone=pc.map.interactionZones.find(item=>item.id==="tavernEntrance");
      let best=null;
      for(let y=0;y<pc.map.height-56;y+=8) for(let x=0;x<pc.map.width-44;x+=8){
        const candidate={x,y,width:44,height:56}; if(!pc.canOccupy(candidate)) continue;
        const distance=Math.hypot(x+22-(zone.x+zone.width/2),y+28-(zone.y+zone.height/2));
        if(distance<=zone.interactionDistance&&(!best||distance<best.distance))best={x,y,distance};
      }
      pc.setWorldPosition(best.x,best.y); pc.render(); pc.interactionManager.update(pc.position,pc.map);
      const prompt=document.querySelector("#interaction-prompt").textContent;
      pc.interactionManager.interact();
      const tavernPc=TitanExplore.getPlayerController();
      const spriteStyle=getComputedStyle(tavernPc.spriteElement);
      return {prompt,map:tavernPc.map.id,background:getComputedStyle(document.querySelector("#map-layer")).backgroundImage,
        player:{x:Math.round(tavernPc.worldX),y:Math.round(tavernPc.worldY)},npcCount:tavernPc.map.npcs.length,
        sprite:{width:spriteStyle.width,height:spriteStyle.height},
        interactionCount:tavernPc.map.interactionZones.length,saved:getTitanGameState().mapPositions.undergroundStreet,
        transition:document.querySelector("#explore-scene").classList.contains("map-transition-pulse"),
        editorVisible:!document.querySelector("#oldtown-editor-panel").hidden};
    })()`);
    assert.equal(building.prompt, "[E] 进入");
    assert.equal(building.map, "undergroundTavern");
    assert.match(building.background, /underground-tavern\.png/);
    assert.deepEqual(building.player, {x:788,y:790});
    assert.deepEqual(building.sprite, {width:"124px",height:"124px"});
    assert.equal(building.npcCount, 0);
    assert.equal(building.interactionCount, 8);
    assert.equal(building.transition, true);
    assert.equal(building.editorVisible, true);

    const ownerScene = await cdp.evaluate(`(() => {
      const pc=TitanExplore.getPlayerController(),zone=pc.map.interactionZones.find(item=>item.id==="tavernOwner");
      let best=null;
      for(let y=zone.y+zone.height;y<pc.map.height-56;y+=4) for(let x=0;x<pc.map.width-44;x+=4){
        const candidate={x,y,width:44,height:56}; if(!pc.canOccupy(candidate)) continue;
        const distance=Math.hypot(x+22-(zone.x+zone.width/2),y+28-(zone.y+zone.height/2));
        if(distance<=zone.interactionDistance&&(!best||distance<best.distance))best={x,y,distance};
      }
      pc.lastDirection="up"; pc.setWorldPosition(best.x,best.y); pc.render(); pc.interactionManager.update(pc.position,pc.map);
      const prompt=document.querySelector("#interaction-prompt").textContent;
      const current=pc.interactionManager.current;
      pc.interactionManager.interact();
      return {prompt,scene:getTitanGameState().currentScene,current:current&&current.id,best,priority:zone.interactionPriority};
    })()`);
    assert.equal(ownerScene.prompt, "[E] 交谈", JSON.stringify(ownerScene));
    assert.equal(ownerScene.scene, "tavern_owner_first_01", JSON.stringify(ownerScene));

    const revealStart = await cdp.evaluate(`(() => {
      const state=getTitanGameState(); state.mode="explore"; state.currentScene=null;
      state.flags.slumNoticeRead=true; state.flags.clue_missing_people=true; state.flags.talkedTavernOwner=true;
      TitanExplore.resumeExplore();
      const pc=TitanExplore.getPlayerController(); pc.lastDirection="up";
      pc.interactionManager.update(pc.position,pc.map); pc.interactionManager.interact();
      return getTitanGameState().currentScene;
    })()`);
    assert.equal(revealStart, "tavern_owner_notice_01");
    for (let index = 0; index < 50; index += 1) {
      const finished = await cdp.evaluate(`(() => {
        const state=getTitanGameState();
        if(state.mode==="explore")return true;
        const choice=document.querySelector(".choice-button");
        if(choice){choice.click();return false;}
        const box=document.querySelector("#dialog-box"); if(box){box.click();box.click();}
        return false;
      })()`);
      if (finished) break;
      await delay(30);
    }
    assert.deepEqual(await cdp.evaluate(`(() => {const state=getTitanGameState();return {
      mode:state.mode,night:state.flags.slumNightCarriage,newNight:state.flags.clue_night_carriage,
      evidence:state.evidence.includes("slum_merchant")};})()`),
      {mode:"explore",night:true,newNight:true,evidence:true});

    const returned = await cdp.evaluate(`(() => {
      const state=getTitanGameState(); state.mode="explore"; state.currentScene=null;
      TitanExplore.resumeExplore();
      const pc=TitanExplore.getPlayerController();
      pc.lastDirection="down"; pc.setWorldPosition(788,790); pc.render(); pc.interactionManager.update(pc.position,pc.map);
      const prompt=document.querySelector("#interaction-prompt").textContent;
      pc.interactionManager.interact();
      const restored=TitanExplore.getPlayerController();
      return {prompt,map:restored.map.id,x:Math.round(restored.worldX),y:Math.round(restored.worldY)};
    })()`);
    assert.deepEqual(returned, {prompt:"[E] 返回地下街",map:"undergroundStreet",
      x:Math.round(building.saved.x),y:Math.round(building.saved.y)});

    assert.equal(await cdp.evaluate(`TitanStory.scenes.chapter2_03.targetMap`), "undergroundStreet");
    await cdp.evaluate(`(() => {
      TitanExplore.startDialog("chapter2_03");
      const box=document.querySelector("#dialog-box");
      box.click();
      box.click();
    })()`);
    await delay(250);
    assert.deepEqual(await cdp.evaluate(`(() => ({mode:getTitanGameState().mode,map:getTitanGameState().currentMap,
      world:document.querySelector("#explore-world").dataset.map}))()`),
      { mode: "explore", map: "undergroundStreet", world: "undergroundStreet" });
    await delay(100);
    assert.deepEqual(cdp.runtimeErrors, []);
    console.log("Underground street browser flow passed at 1440x900.");
  } finally {
    cdp.socket.close();
  }
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
