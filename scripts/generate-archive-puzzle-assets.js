"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const source = path.join(__dirname, "archive-puzzle-master.html");
const output = path.join(root, "images", "minigames", "archive-puzzle");
const edgePath = process.env.PROGRAMFILES_X86
  ? path.join(process.env.PROGRAMFILES_X86, "Microsoft", "Edge", "Application", "msedge.exe")
  : "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const port = 9250;
const profile = path.join(process.env.TEMP || __dirname, "titanstory-archive-asset-generator");

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function connect() {
  let targets;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(response => response.json());
      if (targets.length) break;
    } catch (error) { /* Edge is still starting. */ }
    await delay(100);
  }
  if (!targets || !targets.length) throw new Error("无法连接到Edge资产生成器。");
  const target = targets.find(item => item.type === "page") || targets[0];
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const task = pending.get(message.id); pending.delete(message.id);
      message.error ? task.reject(new Error(message.error.message)) : task.resolve(message.result);
    }
  });
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params }));
  });
  return { socket, call };
}

function writeDataUrl(filename, dataUrl) {
  const encoded = dataUrl.slice(dataUrl.indexOf(",") + 1);
  fs.writeFileSync(path.join(output, filename), Buffer.from(encoded, "base64"));
}

async function main() {
  fs.mkdirSync(output, { recursive: true });
  const edge = spawn(edgePath, ["--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, new URL(`file:///${source.replace(/\\/g, "/")}`).href], { stdio: "ignore" });
  try {
    const cdp = await connect();
    try {
      await cdp.call("Runtime.enable");
      for (let attempt = 0; attempt < 30; attempt += 1) {
        const ready = await cdp.call("Runtime.evaluate", { expression: 'typeof window.generateArchiveAssets === "function"', returnByValue: true });
        if (ready.result.value) break;
        await delay(100);
      }
      const result = await cdp.call("Runtime.evaluate", { expression: "window.generateArchiveAssets()", awaitPromise: true, returnByValue: true });
      if (result.exceptionDetails) throw new Error(result.result.description || result.exceptionDetails.text);
      const assets = result.result.value;
      writeDataUrl("archive_full.webp", assets.full);
      assets.pieces.forEach((data, index) => writeDataUrl(`archive_piece_${String(index + 1).padStart(2, "0")}.png`, data));
      const decoyNames = { garrison: "garrison", supply: "supply", church: "church" };
      assets.decoys.forEach(decoy => decoy.pieces.forEach((data, index) => writeDataUrl(`archive_decoy_${decoyNames[decoy.group]}_${String(index + 1).padStart(2, "0")}.png`, data)));
      fs.writeFileSync(path.join(output, "archive-assets.json"), JSON.stringify({ width: assets.width, height: assets.height, pieceSize: assets.pieceSize, margin: assets.margin }, null, 2) + "\n");
      console.log(`Generated archive master and ${assets.pieces.length} pieces in ${output}`);
    } finally { cdp.socket.close(); }
  } finally { edge.kill(); }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
