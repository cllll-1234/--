/* 旧教堂进门、调查、分支和出口的浏览器流程检查。 */
"use strict";
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const serverPort = 18765;
const debugPort = 19231;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "old-church-browser-"));
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const server = spawn("python", ["-m", "http.server", String(serverPort), "--bind", "127.0.0.1"], { cwd: root, stdio: "ignore", windowsHide: true });
const edge = spawn(edgePath, ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-allow-origins=*",
  `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`,
  `http://127.0.0.1:${serverPort}/game.html?mode=new&map=undergroundStreet`], { stdio: "ignore", windowsHide: true });

async function connect() {
  let target;
  for (let i = 0; i < 80; i++) {
    try {
      const targets = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then(response => response.json());
      target = targets.find(item => item.type === "page");
      if (target) break;
    } catch (_) { /* Edge is still starting. */ }
    await delay(100);
  }
  if (!target) throw new Error("Edge 调试端口没有启动");
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let id = 0;
  const pending = new Map();
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const entry = pending.get(message.id); pending.delete(message.id);
      message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result);
    }
  });
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const callId = ++id;
    pending.set(callId, { resolve, reject });
    socket.send(JSON.stringify({ id: callId, method, params }));
  });
  const evaluate = async expression => {
    const result = await call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.result.description || result.exceptionDetails.text);
    return result.result.value;
  };
  await call("Runtime.enable");
  return { socket, evaluate, call };
}

async function main() {
  const browser = await connect();
  const seen = [];
  async function advanceUntilExplore(limit = 120) {
    for (let i = 0; i < limit; i++) {
      const result = await browser.evaluate(`(() => {
        const state=getTitanGameState();
        if(state.mode==="explore")return {done:true,map:state.currentMap};
        const scene=state.currentScene,box=document.querySelector("#dialog-box");
        box.click();box.click();return {done:false,scene};
      })()`);
      if (result.done) return result.map;
      seen.push(result.scene);
      await delay(35);
    }
    throw new Error("对话未能返回探索模式");
  }
  async function interact(id) {
    const result = await browser.evaluate(`(() => {
      const ok=TitanExplore.teleportToInteraction(${JSON.stringify(id)});
      const prompt=document.querySelector("#interaction-prompt");
      const selected=TitanExplore.getCurrentMap().id;
      const shown=!prompt.hidden;
      if(ok&&shown)prompt.click();
      return {ok,shown,map:selected,scene:getTitanGameState().currentScene};
    })()`);
    assert.equal(result.ok && result.shown, true, `${id} 无法靠近并按 E：${JSON.stringify(result)}`);
    assert.equal(result.map, "oldChurch");
    return result;
  }

  try {
    await delay(800);
    assert.equal(await browser.evaluate(`TitanExplore.getCurrentMap().id`), "undergroundStreet");
    await browser.evaluate(`window.startDialog("chapter2_resident")`);
    assert.equal(await advanceUntilExplore(), "undergroundStreet");
    assert.equal(await browser.evaluate(`getTitanGameState().flags.chapter2ResidentSpoken`), true);

    await browser.evaluate(`TitanExplore.enterBuilding("oldChurch")`);
    await delay(300);
    assert.equal(await browser.evaluate(`getTitanGameState().currentScene`), "chapter2_church_intro_01");
    assert.equal(await advanceUntilExplore(), "oldChurch");
    assert(seen.includes("chapter2_church_intro_resident"), "居民条件进门台词没有出现");
    assert.equal(await browser.evaluate(`getTitanGameState().currentObjective`),
      "调查地下街，尚缺核心线索：\n• 大量失踪人口\n• 深夜马车\n• 第七码头");
    assert.equal(await browser.evaluate(`TitanExplore.getCurrentMap().width`), 1448);

    await interact("church_exit");
    assert.equal(await browser.evaluate(`getTitanGameState().currentScene`), "chapter2_church_exit_need_clues");
    assert.equal(await advanceUntilExplore(), "oldChurch");

    for (const id of ["church_recent_tracks", "church_sedative_crate", "church_g17_vial"]) {
      await interact(id);
      assert.equal(await advanceUntilExplore(), "oldChurch");
    }
    assert(seen.includes("chapter2_church_sedatives_link_01"), "拖痕与镇静剂的线索关联没有触发");
    assert.equal(await browser.evaluate(`(() => {
      const s=getTitanGameState();return s.flags.churchInvestigationComplete && s.evidence.includes("slum_vial") && s.evidence.includes("church_drag_marks");
    })()`), true);

    for (const id of ["church_medical_cloth", "church_rope", "church_altar", "church_emblem", "church_bed_straps",
      "church_sink", "church_old_vials", "church_burned_paper", "church_hidden_sun", "church_bench"]) {
      await interact(id);
      assert.equal(await advanceUntilExplore(), "oldChurch");
    }
    assert(seen.includes("chapter2_church_sun_unknown"), "未知组织名称时不应跳过隐藏标记分支");
    assert.equal(await browser.evaluate(`getTitanGameState().flags.churchDawnMarkFound`), true);

    const streetPosition = await browser.evaluate(`getTitanGameState().mapPositions.undergroundStreet`);
    await interact("church_exit");
    assert.equal(await browser.evaluate(`getTitanGameState().currentScene`), "chapter2_church_exit_01");
    assert.equal(await advanceUntilExplore(), "undergroundStreet");
    assert.equal(await browser.evaluate(`getTitanGameState().flags.churchExitSummarySeen`), true);
    assert.equal(await browser.evaluate(`getTitanGameState().currentObjective`),
      "调查地下街，尚缺核心线索：\n• 大量失踪人口\n• 深夜马车\n• 第七码头");
    assert.deepEqual(await browser.evaluate(`(() => {const p=TitanExplore.getPlayerController();return {x:p.worldX,y:p.worldY};})()`), streetPosition);
    async function useStreetExit() {
      const result = await browser.evaluate(`(() => {
        const ok=TitanExplore.teleportToInteraction("undergroundExit");
        const prompt=document.querySelector("#interaction-prompt");
        if(ok&&!prompt.hidden)prompt.click();
        return {ok,scene:getTitanGameState().currentScene};
      })()`);
      assert.equal(result.ok, true);
      return result.scene;
    }
    assert.equal(await useStreetExit(), "chapter2_exit_check");
    assert.equal(await advanceUntilExplore(), "undergroundStreet");
    assert(seen.includes("chapter2_need_more"));

    const progression = [
      ["warehouse_manifest_clue", "调查地下街，尚缺核心线索：\n• 大量失踪人口\n• 深夜马车"],
      ["chapter2_clue_list_record", "调查地下街，尚缺核心线索：\n• 深夜马车"],
      ["tavern_owner_clue", "核心线索已齐：返回调查兵团总部"]
    ];
    for (const [scene, objective] of progression) {
      await browser.evaluate(`window.startDialog(${JSON.stringify(scene)})`);
      assert.equal(await advanceUntilExplore(), "undergroundStreet");
      assert.equal(await browser.evaluate(`getTitanGameState().currentObjective`), objective);
      assert.equal(await browser.evaluate(`document.querySelector("#objective-text").textContent`), objective);
      assert.equal(await useStreetExit(), "chapter2_exit_check");
      if (scene === "tavern_owner_clue") {
        assert.equal(await advanceUntilExplore(), "hq");
        assert(seen.includes("chapter2_investigation_complete"));
      } else {
        assert.equal(await advanceUntilExplore(), "undergroundStreet");
        assert.equal(seen.at(-1), "chapter2_need_more");
      }
    }
    if (process.argv.includes("--capture")) {
      await browser.call("Emulation.setDeviceMetricsOverride", { width: 1280, height: 960, deviceScaleFactor: 1, mobile: false });
      for (const [query, name] of [["?capture=1", "old-church-layout.png"],
        ["?debug=1&capture=1", "old-church-debug-layout.png"]]) {
        await browser.call("Page.navigate", { url: `http://127.0.0.1:${serverPort}/old-church-overview.html${query}` });
        await delay(400);
        const shot = await browser.call("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
        fs.writeFileSync(path.join(root, "references", name), Buffer.from(shot.data, "base64"));
      }
    }
    console.log("旧教堂与第二章浏览器流程通过：线索目标逐项减少，三项集齐后才能返回总部。");
  } finally {
    browser.socket.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  edge.kill();
  server.kill();
  const relative = path.relative(os.tmpdir(), profile);
  if (relative && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)) {
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 }); } catch (_) { /* Edge may still be closing. */ }
  }
});
