/* Edge/CDP 档案复原四阶段、Debug隔离与正式存档检查。 */
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const port = process.argv[2] || "9234";
const baseUrl = (process.argv[3] || "http://127.0.0.1:8768").replace(/\/$/, "");
const viewportWidth = Number(process.argv[4]) || 1366;
const viewportHeight = Number(process.argv[5]) || 768;
const screenshotPath = process.argv[6] || "";
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
    if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") errors.push(message.params.args.map(item => item.value || item.description).join(" "));
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
    await cdp.call("Emulation.setDeviceMetricsOverride", { width: viewportWidth, height: viewportHeight, deviceScaleFactor: 1, mobile: false });
    await cdp.call("Page.navigate", { url: `${baseUrl}/debug-archive-restoration.html` });
    await delay(700);
    const menu = await cdp.evaluate(`(() => ({buttons:document.querySelectorAll("[data-archive-stage]").length,
      formal:localStorage.getItem("TitanStory-save-guest"),debug:localStorage.getItem("TitanStory-debug-archive-restoration-v1")}))()`);
    assert.equal(menu.buttons, 5);
    assert.equal(menu.formal, null);

    await cdp.evaluate(`document.querySelector('[data-archive-stage="select"]').click()`);
    await delay(80);
    const selectionStart = await cdp.evaluate(`(() => {
      const pieces=[...document.querySelectorAll(".archive-fragment")],images=[...document.querySelectorAll(".archive-fragment img")];
      return {pieces:pieces.length,count:document.querySelector("#archive-selected-count").textContent,
        disabled:document.querySelector(".archive-action").disabled,
        fits:document.querySelector(".archive-game-shell").scrollWidth<=innerWidth,
        stageFits:document.querySelector(".archive-game-stage").scrollHeight<=document.querySelector(".archive-game-stage").clientHeight,
        assets:images.length===12&&images.every(image=>image.naturalWidth===440&&image.naturalHeight===440&&image.alt),
        groups:["dock-transfer","garrison-log","supply-ledger","church-relief"].map(group=>pieces.filter(node=>node.dataset.group===group).length),
        correct:pieces.filter(node=>node.dataset.correct==="true").length,
        transparent:pieces.every(node=>{const s=getComputedStyle(node),surface=getComputedStyle(node.querySelector(".archive-paper-surface"));return s.backgroundColor==="rgba(0, 0, 0, 0)"&&s.borderStyle==="none"&&s.clipPath==="none"&&s.boxShadow==="none"&&surface.backgroundColor==="rgba(0, 0, 0, 0)"&&surface.borderStyle==="none"&&surface.clipPath==="none"&&surface.boxShadow==="none";}),
        legacy:document.querySelectorAll(".archive-fragment small,.archive-fragment p,.archive-fragment .archive-mark").length,
        hint:document.querySelector(".archive-hange-hint p").textContent,
        targetAssets:images.filter(image=>/archive_piece_0[1-6]\.png$/.test(image.getAttribute("src"))).length};
    })()`);
    assert.deepEqual(selectionStart, { pieces:12,count:"0",disabled:true,fits:true,stageFits:true,assets:true,groups:[6,2,2,2],correct:6,transparent:true,legacy:0,
      hint:"先别急着看文字。编号、纸张和印章，也许比内容更可靠。",targetAssets:6 });
    const allClickable = await cdp.evaluate(`(() => [...document.querySelectorAll(".archive-fragment")].every(node => {
      node.click(); const selected=node.getAttribute("aria-pressed")==="true"; node.click();
      return selected && node.getAttribute("aria-pressed")==="false";
    }))()`);
    assert.equal(allClickable, true);

    const selectionReady = await cdp.evaluate(`(() => {
      ["dock-a","dock-b","dock-c","dock-d","dock-e","ration"].forEach(id=>document.querySelector('[data-piece-id="'+id+'"]').click());
      const selected=[...document.querySelectorAll('.archive-fragment[aria-pressed="true"]')];
      return {selected:selected.length,badges:selected.every(node=>getComputedStyle(node.querySelector(".archive-selected-badge")).display!=="none"),
        enabled:!document.querySelector(".archive-action").disabled,ready:document.querySelector(".archive-stage-actions").classList.contains("is-ready")};
    })()`);
    assert.deepEqual(selectionReady, { selected:6,badges:true,enabled:true,ready:true });

    const firstError = await cdp.evaluate(`(() => {
      document.querySelector(".archive-action").click();
      return {count:document.querySelector("#archive-selected-count").textContent,feedback:document.querySelector(".archive-hange-hint p").textContent,
        retained:["dock-a","dock-b","dock-c","dock-d","dock-e"].every(id=>document.querySelector('[data-piece-id="'+id+'"]').classList.contains("is-selected"))};
    })()`);
    assert.equal(firstError.count, "5");
    assert.equal(firstError.retained, true);
    assert.equal(firstError.feedback, "这几张纸并不是来自同一份档案。看看编号的写法。");

    const secondError = await cdp.evaluate(`(() => {
      document.querySelector('[data-piece-id="stock"]').click();document.querySelector(".archive-action").click();
      return document.querySelector(".archive-hange-hint p").textContent;
    })()`);
    assert.equal(secondError, "注意暗红印章的圆弧。如果原本属于同一枚印章，它们应该能够接起来。");
    const thirdError = await cdp.evaluate(`(() => {
      document.querySelector('[data-piece-id="donation"]').click();document.querySelector(".archive-action").click();
      return {hint:document.querySelector(".archive-hange-hint p").textContent,
        retained:["dock-a","dock-b","dock-c","dock-d","dock-e"].every(id=>document.querySelector('[data-piece-id="'+id+'"]').getAttribute("aria-pressed")==="true"),
        gentle:Boolean(document.querySelector(".archive-fragment.is-gentle-hint"))};
    })()`);
    assert.deepEqual(thirdError, { hint:"目标档案的编号和07-24有关，先从编号入手。",retained:true,gentle:true });
    await cdp.evaluate(`document.querySelector('[data-piece-id="dock-f"]').click();document.querySelector(".archive-action").click()`);
    await delay(60);
    const puzzleStart = await cdp.evaluate(`(() => {
      const board=document.querySelector(".archive-slot-board"),slots=[...document.querySelectorAll(".archive-slot")],tray=[...document.querySelectorAll(".archive-piece-tray .archive-puzzle-piece")];
      const style=getComputedStyle(board);
      return {slots:slots.length,numbers:slots.some(node=>node.dataset.index||/^[1-6]$/.test(getComputedStyle(node,"::before").content.replace(/['\"]/g,"").trim())),
        gap:style.gap,fragments:tray.length,assets:new Set(tray.map(node=>node.querySelector("img").getAttribute("src"))).size,
        natural:tray.every(node=>node.querySelector("img").naturalWidth===440&&node.querySelector("img").naturalHeight===440),
        ratio:Math.round(board.getBoundingClientRect().width/board.getBoundingClientRect().height*100)/100,
        fits:document.querySelector(".archive-game-stage").scrollHeight<=document.querySelector(".archive-game-stage").clientHeight};
    })()`);
    assert.deepEqual(puzzleStart, { slots:6,numbers:false,gap:"0px",fragments:6,assets:6,natural:true,ratio:1.5,fits:true });

    const wrongPlacement = await cdp.evaluate(`(() => {
      const piece=document.querySelector('[data-piece-id="dock-a"]');piece.click();document.querySelector('[data-slot="1"]').click();
      return {stillInTray:Boolean(document.querySelector('.archive-piece-tray [data-piece-id="dock-a"]')),text:document.querySelector(".archive-puzzle-hint p").textContent};
    })()`);
    assert.equal(wrongPlacement.stillInTray, true);
    assert.match(wrongPlacement.text, /纸张的断口/);
    const progressivePlacementHint = await cdp.evaluate(`(() => {
      document.querySelector('[data-slot="2"]').click();
      const second={text:document.querySelector(".archive-puzzle-hint p").textContent,row:document.querySelectorAll(".archive-slot.is-row-hint").length};
      document.querySelector('[data-slot="2"]').click();
      return {second,text:document.querySelector(".archive-puzzle-hint p").textContent};
    })()`);
    assert.equal(progressivePlacementHint.second.row, 3);
    assert.match(progressivePlacementHint.second.text, /折痕/);
    assert.match(progressivePlacementHint.text, /左侧/);

    const dragged = await cdp.evaluate(`(() => {
      const piece=document.querySelector('.archive-piece-tray [data-piece-id="dock-a"]'),slot=document.querySelector('[data-slot="0"]');
      const p=piece.getBoundingClientRect(),s=slot.getBoundingClientRect();
      piece.dispatchEvent(new PointerEvent("pointerdown",{pointerId:1,button:0,clientX:p.left+10,clientY:p.top+10,bubbles:true}));
      window.dispatchEvent(new PointerEvent("pointermove",{pointerId:1,clientX:s.left+s.width/2,clientY:s.top+s.height/2,bubbles:true}));
      window.dispatchEvent(new PointerEvent("pointerup",{pointerId:1,clientX:s.left+s.width/2,clientY:s.top+s.height/2,bubbles:true}));
      return Boolean(document.querySelector('[data-slot="0"] [data-piece-id="dock-a"]'));
    })()`);
    assert.equal(dragged, true);
    for (const [id, slot] of [["dock-b",1],["dock-c",2],["dock-d",3],["dock-e",4],["dock-f",5]]) {
      await cdp.evaluate(`document.querySelector('.archive-piece-tray [data-piece-id="${id}"]').click();document.querySelector('[data-slot="${slot}"]').click()`);
    }
    await delay(80);
    const completionPreview = await cdp.evaluate(`(() => ({complete:Boolean(document.querySelector(".archive-puzzle-complete")),
      pieces:document.querySelectorAll(".archive-slot .archive-puzzle-piece").length,cssSeal:Boolean(document.querySelector(".archive-composed-seal")),
      stage:document.querySelector(".archive-stage-heading").textContent,seams:getComputedStyle(document.querySelector(".archive-slot-board")).gap}))()`);
    assert.deepEqual(completionPreview, { complete:true,pieces:6,cssSeal:false,stage:"拼接《第七码头转运记录》",seams:"0px" });
    await delay(1100);
    assert.match(await cdp.evaluate(`document.querySelector(".archive-stage-heading").textContent`), /标记/);
    assert.equal(await cdp.evaluate(`Boolean(document.querySelector(".archive-restored-document")) && /archive_full\.webp/.test(getComputedStyle(document.querySelector(".archive-restored-document")).backgroundImage)`), true);

    const wrongMark = await cdp.evaluate(`(() => {document.querySelector('[data-line-id="batch"]').click();return document.querySelector(".archive-feedback").textContent;})()`);
    assert.match(wrongMark, /暂时无法说明/);
    await cdp.evaluate(`document.querySelector('[data-line-id="people"]').click();document.querySelector('[data-line-id="people"]').click()`);
    assert.match(await cdp.evaluate(`document.querySelector(".archive-counter").textContent`), /1 \/ 3/);
    await cdp.evaluate(`document.querySelector('[data-line-id="g17"]').click();document.querySelector('[data-line-id="destination"]').click();document.querySelector(".archive-action").click()`);
    await delay(40);

    const wrongReason = await cdp.evaluate(`(() => {document.querySelectorAll(".archive-choice")[0].click();return {choices:document.querySelectorAll(".archive-choice").length,text:document.querySelector(".archive-feedback").textContent};})()`);
    assert.equal(wrongReason.choices, 4);
    assert.match(wrongReason.text, /还不能直接下这个结论/);
    await cdp.evaluate(`document.querySelectorAll(".archive-choice")[1].click()`);
    assert.match(await cdp.evaluate(`document.querySelector(".archive-complete-stamp").textContent`), /档案复原完成/);
    await cdp.evaluate(`document.querySelector(".archive-complete-card .archive-action").click()`);
    await delay(50);
    assert.equal(await cdp.evaluate(`document.querySelector("#archive-debug-status").textContent`), "测试完成；正式存档未受影响。");
    assert.equal(await cdp.evaluate(`localStorage.getItem("TitanStory-save-guest")`), null);

    for (const stage of ["puzzle", "anomaly", "reasoning", "complete"]) {
      await cdp.evaluate(`document.querySelector('[data-archive-stage="${stage}"]').click()`);
      await delay(30);
      assert.equal(await cdp.evaluate(`Boolean(document.querySelector(".archive-game-overlay"))`), true);
      await cdp.evaluate(`document.querySelector(".archive-game-exit").click()`);
    }
    await cdp.evaluate(`document.querySelector("#archive-debug-clear").click()`);
    assert.equal(await cdp.evaluate(`localStorage.getItem("TitanStory-debug-archive-restoration-v1")`), null);

    await cdp.call("Page.navigate", { url: `${baseUrl}/debug-archive-puzzle-assets.html` });
    await delay(300);
    const assetPreview = await cdp.evaluate(`(() => {const full=document.querySelector(".full"),assembly=document.querySelector(".assembly"),rect=assembly.getBoundingClientRect();return {
      full:[full.naturalWidth,full.naturalHeight],pieces:document.querySelectorAll(".assembly .piece img").length,
      pieceSizes:[...document.querySelectorAll(".assembly .piece img")].every(image=>image.naturalWidth===440&&image.naturalHeight===440),
      ratio:Math.round(rect.width/rect.height*100)/100};})()`);
    assert.deepEqual(assetPreview, { full:[1200,800],pieces:6,pieceSizes:true,ratio:1.5 });
    if (screenshotPath) {
      const shot = await cdp.call("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      fs.writeFileSync(screenshotPath, Buffer.from(shot.data, "base64"));
    }

    await cdp.call("Page.navigate", { url: `${baseUrl}/game.html?map=seventhMaintenanceStation&debug=map` });
    await delay(900);
    await cdp.evaluate(`(() => {
      const s=getTitanGameState();["archive_game_started","archive_fragments_selected","archive_puzzle_completed","chapter3_archive_puzzle_completed","archive_anomalies_marked","archive_reasoning_completed","archive_game_completed","has_dock_transfer_record"].forEach(k=>s.flags[k]=false);
      s.evidence=s.evidence.filter(id=>id!=="dock_transfer_record");s.minigameResults.archivePuzzle=null;TitanSave.saveGame(s);
      window.__archiveResult=null;TitanArchiveRestoration.start({debugStage:"reasoning"}).then(r=>window.__archiveResult=r);
    })()`);
    await delay(40);
    await cdp.evaluate(`document.querySelectorAll(".archive-choice")[1].click();document.querySelector(".archive-complete-card .archive-action").click()`);
    await delay(80);
    const saved = await cdp.evaluate(`(() => {const s=getTitanGameState(),stored=JSON.parse(localStorage.getItem("TitanStory-save-guest"));return {
      result:window.__archiveResult&&window.__archiveResult.success,started:s.flags.archive_game_started,selected:s.flags.archive_fragments_selected,
      puzzle:s.flags.archive_puzzle_completed,marked:s.flags.archive_anomalies_marked,reasoned:s.flags.archive_reasoning_completed,
      complete:s.flags.archive_game_completed,record:s.flags.has_dock_transfer_record,evidence:s.evidence.filter(id=>id==="dock_transfer_record").length,
      storedComplete:stored.state.flags.archive_game_completed};})()`);
    assert.deepEqual(saved, { result:true,started:true,selected:true,puzzle:true,marked:true,reasoned:true,complete:true,record:true,evidence:1,storedComplete:true });
    assert.deepEqual(cdp.errors, []);
    console.log(`Archive restoration browser checks passed at ${viewportWidth}x${viewportHeight}.`);
  } finally { cdp.socket.close(); }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
