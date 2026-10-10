/* Edge/CDP 废弃仓库正式流程与专用 Debug 工具端到端测试。 */
"use strict";

const assert = require("node:assert/strict");
const port = process.argv[2] || "9230";
const baseUrl = (process.argv[3] || "http://127.0.0.1:8765").replace(/\/$/, "");
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
  async function advanceUntilExplore(limit = 100) {
    for (let index = 0; index < limit; index += 1) {
      const result = await cdp.evaluate(`(() => {
        const state=getTitanGameState(); if(state.mode==="explore")return {done:true};
        const choice=document.querySelector(".choice-button");
        if(choice){choice.click();return {done:false};}
        const box=document.querySelector("#dialog-box"); if(box){box.click();box.click();}
        return {done:false,scene:state.currentScene};
      })()`);
      if (result.done) return true;
      await delay(35);
    }
    return false;
  }
  async function interact(id) {
    const result = await cdp.evaluate(`(() => {
      const ok=TitanExplore.teleportToInteraction(${JSON.stringify(id)});
      const prompt=document.querySelector("#interaction-prompt");
      const text=prompt.textContent; if(ok&&!prompt.hidden)prompt.click();
      return {ok,text,hidden:prompt.hidden};
    })()`);
    await delay(80);
    return result;
  }

  try {
    await cdp.call("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await cdp.call("Page.navigate", { url: `${baseUrl}/debug-warehouse.html` });
    await delay(1000);
    const debug = await cdp.evaluate(`(() => {
      const pc=TitanExplore.getPlayerController(),map=TitanExplore.getCurrentMap();
      const panel=document.querySelector("#warehouse-debug-panel");
      return {map:map.id,width:map.width,height:map.height,background:getComputedStyle(document.querySelector("#map-layer")).backgroundImage,
        player:{x:pc.worldX,y:pc.worldY},collisionCount:map.collisions.length,interactionCount:map.interactionZones.length,
        debug:document.querySelector("#explore-world").classList.contains("debug-map"),panel:Boolean(panel),
        teleports:panel.querySelectorAll("[data-teleport-id]").length,flags:panel.querySelectorAll("[data-warehouse-flag]").length,
        hasSpawnButton:Boolean(panel.querySelector("#warehouse-debug-set-spawn")),
        readout:document.querySelector(".oldtown-debug-readout").textContent};})()`);
    assert.deepEqual([debug.map, debug.width, debug.height], ["warehouse", 1672, 941]);
    assert.match(debug.background, /warehouse_interior\.png/);
    assert.deepEqual(debug.player, { x: 814, y: 810 });
    assert.equal(debug.collisionCount, 26);
    assert.equal(debug.interactionCount, 11);
    assert.equal(debug.debug && debug.panel, true);
    assert.equal(debug.teleports, 11);
    assert.ok(debug.flags >= 15);
    assert.equal(debug.hasSpawnButton, true);
    assert.match(debug.readout, /Facing:/);
    assert.match(debug.readout, /Interaction:/);

    const geometryTools = await cdp.evaluate(`(() => {
      const map=TitanExplore.getCurrentMap(),editor=document.querySelector("#oldtown-editor-panel");
      const before=map.collisions.length;
      editor.querySelector("#map-editor-add-collision").click();
      const custom=map.collisions[map.collisions.length-1];
      const finite=[custom.x,custom.y,custom.width,custom.height].every(Number.isFinite);
      editor.querySelector("#map-editor-delete").click();
      document.querySelector("#warehouse-debug-set-spawn").click();
      const saved=JSON.parse(localStorage.getItem("titan_map_geometry_editor_v1:warehouse")||"{}");
      const spawnSaved=Boolean(saved._spawn&&saved._spawn.x===map.spawn.x&&saved._spawn.y===map.spawn.y);
      localStorage.removeItem("titan_map_geometry_editor_v1:warehouse");
      window.dispatchEvent(new KeyboardEvent("keydown",{key:"F2",bubbles:true}));
      const off=!document.querySelector("#explore-world").classList.contains("debug-map")&&editor.hidden;
      window.dispatchEvent(new KeyboardEvent("keydown",{key:"F2",bubbles:true}));
      const on=document.querySelector("#explore-world").classList.contains("debug-map")&&!editor.hidden;
      return {finite,countRestored:map.collisions.length===before,spawnSaved,off,on};
    })()`);
    assert.equal(Object.values(geometryTools).every(Boolean), true);

    const debugTools = await cdp.evaluate(`(() => {
      const panel=document.querySelector("#warehouse-debug-panel");
      Array.from(panel.querySelectorAll("button")).find(button=>button.textContent==="完整调查状态").click();
      const full=getTitanGameState().flags.warehouse_full_investigation;
      panel.querySelector('[data-teleport-id="warehouse_old_porter"]').click();
      const interaction=document.querySelector(".oldtown-debug-readout").textContent;
      panel.querySelector("#warehouse-debug-reset").click();
      const reset=!getTitanGameState().flags.clue_seventh_dock&&!getTitanGameState().flags.visited_warehouse;
      const manual=panel.querySelector('[data-warehouse-flag="warehouse_full_investigation"]');
      manual.click();
      const manualFull=getTitanGameState().flags.warehouse_full_investigation;
      panel.querySelector("#warehouse-debug-reset").click();
      return {full,interaction,reset,manualFull};
    })()`);
    assert.equal(debugTools.full && debugTools.reset && debugTools.manualFull, true);
    assert.match(debugTools.interaction, /warehouse_old_porter/);

    await cdp.evaluate(`(() => {
      const panel=document.querySelector("#warehouse-debug-panel");
      Array.from(panel.querySelectorAll("button")).find(button=>button.textContent==="已有深夜马车线索").click();
    })()`);
    assert.equal((await interact("warehouse_old_porter")).ok, true);
    assert.equal(await advanceUntilExplore(), true);
    assert.deepEqual(await cdp.evaluate(`(() => {const f=getTitanGameState().flags;return {talked:f.talked_old_porter,night:f.porter_night_transport};})()`),
      { talked: true, night: true });
    await cdp.evaluate(`document.querySelector('[data-warehouse-flag="clue_missing_people"]').click()`);
    assert.equal((await interact("warehouse_old_porter")).ok, true);
    assert.equal(await advanceUntilExplore(), true);
    assert.equal(await cdp.evaluate(`getTitanGameState().flags.clue_people_in_carriage`), true);
    await cdp.evaluate(`document.querySelector("#warehouse-debug-reset").click()`);

    await cdp.evaluate(`(() => {
      const state=getTitanGameState();
      state.mode="explore";state.currentScene=null;state.currentMap="undergroundStreet";
      ["visited_warehouse","warehouse_table_checked","warehouse_manifest_unlocked","clue_seventh_dock","slumTransportFound"].forEach(name=>state.flags[name]=false);
      state.evidence=state.evidence.filter(id=>id!=="slum_transport"); TitanSave.saveGame(state);
      return TitanExplore.loadMap("undergroundStreet");
    })()`);
    await delay(400);
    const enter = await interact("warehouseEntrance");
    assert.equal(enter.ok, true);
    await delay(600);
    const storedStreetPosition = await cdp.evaluate(`getTitanGameState().mapPositions.undergroundStreet`);
    assert.deepEqual(await cdp.evaluate(`(() => {const s=getTitanGameState();return {map:s.currentMap,mode:s.mode,scene:s.currentScene};})()`),
      { map: "warehouse", mode: "dialog", scene: "warehouse_enter_title" });
    assert.equal(await advanceUntilExplore(), true);
    assert.equal(await cdp.evaluate(`getTitanGameState().flags.visited_warehouse`), true);

    assert.equal((await interact("warehouse_table")).ok, true);
    assert.equal(await advanceUntilExplore(), true);
    assert.equal(await cdp.evaluate(`getTitanGameState().flags.warehouse_table_checked`), true);
    assert.equal((await interact("warehouse_table")).ok, true);
    assert.equal(await advanceUntilExplore(), true);
    assert.equal(await cdp.evaluate(`getTitanGameState().flags.warehouse_manifest_unlocked`), true);
    assert.equal((await interact("warehouse_manifest")).ok, true);
    assert.equal(await advanceUntilExplore(), true);
    assert.deepEqual(await cdp.evaluate(`(() => {const s=getTitanGameState();return {dock:s.flags.clue_seventh_dock,legacy:s.flags.slumTransportFound,
      evidence:s.evidence.includes("slum_transport"),objective:s.currentObjective};})()`), {
      dock: true, legacy: true, evidence: true, objective: "调查地下街，尚缺核心线索：\n• 大量失踪人口\n• 深夜马车"
    });

    assert.equal((await interact("warehouse_exit")).ok, true);
    await delay(350);
    assert.equal(await cdp.evaluate(`getTitanGameState().currentMap`), "undergroundStreet");
    assert.deepEqual(await cdp.evaluate(`(() => {const pc=TitanExplore.getPlayerController();return {x:pc.worldX,y:pc.worldY};})()`), storedStreetPosition);
    assert.deepEqual(cdp.errors, []);
    console.log("Warehouse browser and debug flows passed at 1440x900.");
  } finally {
    cdp.socket.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
