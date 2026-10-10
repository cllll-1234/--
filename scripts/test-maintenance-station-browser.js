/* Edge/CDP 第七维护站正式地图、相机、交互和 Debug 工具端到端检查。 */
"use strict";

const assert = require("node:assert/strict");
const port = process.argv[2] || "9231";
const baseUrl = (process.argv[3] || "http://127.0.0.1:8766").replace(/\/$/, "");
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function connect() {
  const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(response => response.json());
  const target = targets.find(item => item.type === "page");
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let id = 0;
  const pending = new Map();
  const errors = [];
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.text);
    if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
      errors.push(message.params.args.map(item => item.value || item.description).join(" "));
    }
    if (message.id && pending.has(message.id)) {
      const handler = pending.get(message.id); pending.delete(message.id);
      message.error ? handler.reject(new Error(message.error.message)) : handler.resolve(message.result);
    }
  });
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const callId = ++id; pending.set(callId, { resolve, reject });
    socket.send(JSON.stringify({ id: callId, method, params }));
  });
  const evaluate = async expression => {
    const result = await call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.result.description || result.exceptionDetails.text);
    return result.result.value;
  };
  await call("Page.enable"); await call("Runtime.enable");
  return { socket, call, evaluate, errors };
}

async function main() {
  const cdp = await connect();
  try {
    await cdp.call("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await cdp.call("Page.navigate", { url: `${baseUrl}/debug-seventh-maintenance-station.html` });
    await delay(1300);
    const initial = await cdp.evaluate(`(() => {
      document.querySelector("#station-debug-reset").click();
      const map=TitanExplore.getCurrentMap(),pc=TitanExplore.getPlayerController(),world=document.querySelector("#explore-world");
      return {id:map.id,size:[map.width,map.height],natural:[map.naturalWidth,map.naturalHeight],asset:map.backgroundAsset,
        spawn:[pc.worldX,pc.worldY],player:[pc.width,pc.height,pc.spriteWidth,pc.spriteHeight,pc.footWidth,pc.footHeight],
        cameraMode:map.cameraMode,transform:world.style.transform,collisionCount:map.collisions.length,
        interactionCount:map.interactionZones.length,panel:Boolean(document.querySelector("#maintenance-station-debug-panel")),
        teleports:document.querySelectorAll("#station-debug-teleports button").length,
        background:getComputedStyle(document.querySelector("#map-layer")).backgroundImage,
        readout:document.querySelector(".oldtown-debug-readout").textContent};
    })()`);
    assert.equal(initial.id, "seventhMaintenanceStation");
    assert.deepEqual(initial.size, [1672, 941]);
    assert.deepEqual(initial.natural, [1672, 941]);
    assert.equal(initial.asset, "images/maps/seventh-maintenance-station.webp");
    assert.deepEqual(initial.spawn, [171, 733]);
    assert.deepEqual(initial.player, [44, 56, 92, 92, 30, 17]);
    assert.equal(initial.cameraMode, "follow");
    assert.equal(initial.collisionCount >= 30, true);
    assert.equal(initial.interactionCount, 7);
    assert.equal(initial.panel && initial.teleports === 6, true);
    assert.match(initial.background, /seventh-maintenance-station\.webp/);
    assert.match(initial.readout, /Camera X:/);
    assert.match(initial.readout, /Interaction:/);
    assert.doesNotMatch(initial.transform, /translate\([^\)]*-\d{5}/);

    const movablePanels = await cdp.evaluate(`(() => {
      const story=document.querySelector("#maintenance-station-debug-panel"),editor=document.querySelector("#oldtown-editor-panel"),readout=document.querySelector(".oldtown-debug-readout");
      const header=story.querySelector(".debug-panel-header"),before=story.getBoundingClientRect();
      header.dispatchEvent(new PointerEvent("pointerdown",{clientX:before.left+20,clientY:before.top+15,bubbles:true}));
      window.dispatchEvent(new PointerEvent("pointermove",{clientX:before.left+100,clientY:before.top+75,bubbles:true}));
      window.dispatchEvent(new PointerEvent("pointerup",{bubbles:true}));
      const after=story.getBoundingClientRect(),moved=after.left!==before.left||after.top!==before.top;
      story.querySelector('[data-panel-action="collapse"]').click();
      const collapsed=story.classList.contains("debug-panel-collapsed");
      story.querySelector('[data-panel-action="collapse"]').click();
      story.querySelector('[data-panel-action="hide"]').click();
      const storyHidden=story.hidden;
      Array.from(document.querySelectorAll(".debug-panel-restore")).find(button=>button.textContent.includes("剧情调试器")).click();
      editor.querySelector('[data-panel-action="hide"]').click();
      const editorHidden=editor.hidden;
      Array.from(document.querySelectorAll(".debug-panel-restore")).find(button=>button.textContent.includes("坐标编辑器")).click();
      readout.querySelector('[data-panel-action="hide"]').click();
      const readoutHidden=readout.hidden;
      Array.from(document.querySelectorAll(".debug-panel-restore")).find(button=>button.textContent.includes("坐标信息")).click();
      return {moved,collapsed,storyHidden,storyRestored:!story.hidden,editorHidden,editorRestored:!editor.hidden,
        readoutHidden,readoutRestored:!readout.hidden,storyControls:story.querySelectorAll("[data-panel-action]").length,
        editorControls:editor.querySelectorAll("[data-panel-action]").length,readoutControls:readout.querySelectorAll("[data-panel-action]").length,
        toggles:document.querySelectorAll(".debug-panel-restore").length};
    })()`);
    assert.equal(Object.values(movablePanels).every(value => value === true || value === 3), true);

    const layers = await cdp.evaluate(`(() => {
      const buttons=Array.from(document.querySelectorAll("#station-debug-layers button")),world=document.querySelector("#explore-world");
      buttons.forEach(button=>button.click());
      const hidden=["debug-hide-collisions","debug-hide-interactions","debug-hide-player-boxes"].every(name=>world.classList.contains(name));
      buttons.forEach(button=>button.click());
      const shown=["debug-hide-collisions","debug-hide-interactions","debug-hide-player-boxes"].every(name=>!world.classList.contains(name));
      return {hidden,shown};
    })()`);
    assert.equal(layers.hidden && layers.shown, true);

    const targets = ["station_g17_crate", "station_transfer_record", "station_karl_archive", "station_outside_map", "station_sealed_room", "station_exit"];
    for (const target of targets) {
      const result = await cdp.evaluate(`(() => {
        const ok=TitanExplore.teleportToInteraction(${JSON.stringify(target)}),prompt=document.querySelector("#interaction-prompt");
        return {ok,current:TitanExplore.getCurrentMap().id,nearest:document.querySelector(".oldtown-debug-readout").textContent,
          prompt:prompt.textContent,hidden:prompt.hidden,transform:document.querySelector("#explore-world").style.transform};
      })()`);
      assert.equal(result.ok && !result.hidden, true, target + " 无法传送或无提示");
      assert.match(result.nearest, new RegExp("Interaction: " + target));
      assert.match(result.transform, /^translate\(-?\d/);
    }

    const lockedKarl = await cdp.evaluate(`(() => {
      document.querySelector("#station-debug-reset").click();
      TitanExplore.teleportToInteraction("station_karl_archive");
      document.querySelector("#interaction-prompt").click();
      return {mode:TitanExplore.getState().mode,toast:document.querySelector("#evidence-toast").textContent};
    })()`);
    assert.equal(lockedKarl.mode, "explore");
    assert.equal(lockedKarl.toast, "这份档案缺少上下文，暂时看不出异常。");

    const debugState = await cdp.evaluate(`(async()=>{
      document.querySelector("#station-debug-archive-repaired").click();
      const repaired=TitanExplore.getState().flags.chapter3_archive_puzzle_completed;
      document.querySelector("#station-debug-unlock-all").click();
      const f=TitanExplore.getState().flags;
      const unlocked=f.clue_g17_station&&f.clue_personnel_transfer_record&&f.clue_karl_purification&&f.clue_outside_resource_map&&f.chapter3_sealed_room_checked;
      const archiveRun=startArchiveRepairGame();
      const opened=Boolean(document.querySelector(".archive-game-overlay"));
      document.querySelector(".archive-game-exit").click();
      const archiveResult=await archiveRun;
      return {repaired,unlocked,opened,status:archiveResult.status};
    })()`);
    assert.equal(debugState.repaired && debugState.unlocked && debugState.opened, true);
    assert.equal(debugState.status, "paused");
    assert.deepEqual(cdp.errors, []);
    console.log("Maintenance station browser checks passed at 1440x900.");
  } finally {
    cdp.socket.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
