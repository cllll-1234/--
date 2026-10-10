/* 第四章：净化室地图、记忆重构接口、剧情真相与路线条件检查。 */
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
global.window = global;
require("../js/explore/hq-collisions.js");
require("../js/explore/street-sermon-collisions.js");
require("../js/explore/oldtown-collisions.js");
require("../js/explore/underground-street-data.js");
require("../js/explore/underground-tavern-data.js");
require("../js/explore/old-church-data.js");
require("../js/explore/warehouse-data.js");
require("../js/explore/maintenance-station-data.js");
require("../js/explore/clock-tower-data.js");
require("../js/explore/central-district-data.js");
require("../js/explore/central-facility-data.js");
require("../js/explore/map-data.js");
require("../js/story.js");

const map = TitanExploreMaps.clockTowerUnderground;
const scenes = TitanStory.scenes;
assert.deepEqual([map.width, map.height], [1672, 941]);
assert.deepEqual(map.spawn, { x: 442, y: 757 });
assert.equal(map.backgroundAsset, "images/maps/地下净化室.png");
assert.equal(map.pendingBackgroundAsset, map.backgroundAsset);
assert.equal(map.useNaturalSize, true);
assert.equal(map.cameraMode, "follow");
const mapImage = fs.readFileSync(path.join(root, map.backgroundAsset));
assert.deepEqual([mapImage.readUInt32BE(16), mapImage.readUInt32BE(20)], [map.width, map.height]);

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}
function feetAt(position) { return { x: position.x + 7, y: position.y + 38, width: 30, height: 17 }; }
function canStand(position) {
  const feet = feetAt(position);
  return feet.x >= 0 && feet.y >= 0 && feet.x + feet.width <= map.width && feet.y + feet.height <= map.height &&
    !map.collisions.some(collision => overlaps(feet, collision));
}
function canReachZone(zone) {
  const step = 8;
  const queue = [map.spawn];
  const seen = new Set([map.spawn.x + "," + map.spawn.y]);
  for (let index = 0; index < queue.length && index < 50000; index += 1) {
    const current = queue[index];
    const distance = Math.hypot(current.x + 22 - (zone.x + zone.width / 2), current.y + 28 - (zone.y + zone.height / 2));
    if (distance <= zone.interactionDistance) return true;
    [[step, 0], [-step, 0], [0, step], [0, -step]].forEach(([dx, dy]) => {
      const next = { x: current.x + dx, y: current.y + dy };
      const key = next.x + "," + next.y;
      if (!seen.has(key) && canStand(next)) { seen.add(key); queue.push(next); }
    });
  }
  return false;
}

assert.ok(canStand(map.spawn), "钟楼地下出生点被碰撞覆盖");
map.collisions.concat(map.interactionZones).forEach(item => {
  assert.ok(item.x >= 0 && item.y >= 0 && item.x + item.width <= map.width && item.y + item.height <= map.height,
    "钟楼地下区域超出地图：" + item.id);
});
map.interactionZones.forEach(zone => assert.ok(canReachZone(zone), "钟楼地下交互点不可达：" + zone.id));
assert.deepEqual(map.interactionZones.map(zone => zone.id), [
  "clock_tower_bed", "clock_tower_g17_vial", "clock_tower_chute", "clock_tower_stairs"
]);
const clockTowerExit = map.interactionZones.find(zone => zone.id === "clock_tower_stairs");
assert.deepEqual(clockTowerExit.requiredFlags, ["chapter4_bed_checked", "chapter4_g17_truth_found", "chapter4_karl_truth_found"]);
assert.deepEqual(clockTowerExit.flags, ["chapter4_purification_room_complete"]);

Object.keys(scenes).filter(id => id.indexOf("chapter4_") === 0).forEach(id => {
  const scene = scenes[id];
  const targets = [scene.next]
    .concat((scene.choices || []).map(choice => choice.next))
    .concat((scene.routes || []).map(route => route.next));
  if (scene.minigame) targets.push(scene.minigame.onSuccess, scene.minigame.onFailure, scene.minigame.onUnavailable);
  targets.filter(Boolean).forEach(target => assert.ok(scenes[target], id + " 指向不存在的剧情：" + target));
});
const bertholdtScenes = Object.keys(scenes).filter(id => id.indexOf("chapter4_") === 0 && scenes[id].speaker === "贝尔托特");
assert.ok(bertholdtScenes.length > 0, "第四章缺少贝尔托特对白");
bertholdtScenes.forEach(id => assert.equal(scenes[id].character, "images/characters/dialog/bertholdt_normal.png", id + " 未接入贝尔托特立绘"));
map.interactionZones.forEach(zone => assert.ok(scenes[zone.targetScene], zone.id + " 指向不存在的剧情：" + zone.targetScene));

assert.equal(scenes.chapter4_memory_reconstruction.minigame.type, "memoryReconstruction");
assert.equal(scenes.chapter4_memory_reconstruction.minigame.resultKey, "memory");
assert.equal(scenes.chapter4_memory_reconstruction.minigame.onUnavailable, "chapter4_memory_reconstruction_retry");
assert.ok(scenes.chapter4_memory_reconstruction_retry.choices.every(choice => choice.next === "chapter4_memory_reconstruction"));
assert.equal(scenes.chapter4_memory_reconstruction_placeholder, undefined);
assert.match(scenes.chapter4_g17_04.text, /会变成无垢巨人/);
const vialAsset = "images/characters/dialog/G-17完整版.png";
assert.ok(fs.existsSync(path.join(root, vialAsset)), "第四章 G-17 药瓶图片不存在");
["chapter4_g17_01", "chapter4_g17_02", "chapter4_g17_03", "chapter4_g17_04", "chapter4_g17_truth"].forEach(id => {
  assert.equal(scenes[id].itemImage, vialAsset, id + " 未展示 G-17 药瓶");
});
assert.match(scenes.chapter4_chute_05.text, /就是他/);
assert.match(scenes.chapter4_845_truth.text, /巨壁教和王政利用始祖巨人的力量/);
assert.match(scenes.chapter4_845_truth.text, /逃亡计划因此变成了大屠杀/);
const choices = scenes.chapter4_route_choice_new.choices;
assert.deepEqual(choices.map(choice => choice.route), ["rebellion", "order", "truth"]);
assert.deepEqual(choices.find(choice => choice.route === "truth").conditions.allFlags,
  ["warehouse_full_investigation", "hidden_group_induction_record"]);
assert.ok(scenes.chapter5_route_gate.routes.some(route => route.conditions.route === "order" && route.next === "chapter5_order_01"));

assert.equal(scenes.chapter4_clocktower_cross.character, "images/characters/dialog/十字架.png");
assert.ok(fs.existsSync(path.join(root, scenes.chapter4_clocktower_cross.character)));

const saveContext = { window: {}, localStorage: { getItem: () => null, setItem: () => {} } };
saveContext.window = saveContext;
vm.runInNewContext(fs.readFileSync(path.join(root, "js/save.js"), "utf8"), saveContext);
const initial = saveContext.TitanSave.createInitialGameState();
[
  "chapter4_letter_received", "chapter4_past_identity_revealed", "visited_clock_tower_underground",
  "chapter4_bed_checked", "chapter4_g17_truth_found", "truth_pure_titans_are_human",
  "chapter4_karl_truth_found", "chapter4_purification_room_complete", "chapter4_dawnbreakers_truth",
  "chapter4_memory_puzzle_completed", "chapter4_845_truth_recovered", "chapter4_returned_to_hq", "chapter4_complete"
].forEach(flag => assert.equal(initial.flags[flag], false, "存档缺少第四章状态：" + flag));
assert.equal(saveContext.TitanSave.normalizeGameState({ route: "church" }).route, "order");

const adapterSource = fs.readFileSync(path.join(root, "js/chapter4-memory-reconstruction.js"), "utf8");
assert.match(adapterSource, /const cards = Object\.freeze\(\[/);
assert.equal((adapterSource.match(/^    "/gm) || []).length >= 6, true);
assert.match(adapterSource, /minigames\/memory-reconstruction\/index\.html\?return=story/);
assert.match(adapterSource, /consumeResult/);
assert.match(adapterSource, /chapter4_845_memory_01/);
assert.match(adapterSource, /chapter4_memory_reconstruction_retry/);
const memoryGameSource = fs.readFileSync(path.join(root, "minigames/memory-reconstruction/memory.js"), "utf8");
assert.match(memoryGameSource, /TitanStory-memory-reconstruction-result/);
assert.match(memoryGameSource, /game\.html\?mode=memory-reconstruction-return/);
assert.match(memoryGameSource, /memoryScene\.addEventListener\([\s\S]*?"click"[\s\S]*?nextMemoryScene/);
assert.match(memoryGameSource, /event\.key !== "Enter"/);
assert.match(memoryGameSource, /memoryAdvanceLocked/);

const resultStore = new Map([["TitanStory-memory-reconstruction-result", JSON.stringify({
  type: "memoryReconstruction", completed: true, success: true
})]]);
const adapterContext = {
  console,
  location: { href: "" },
  localStorage: {
    getItem: key => resultStore.get(key) || null,
    setItem: (key, value) => resultStore.set(key, value),
    removeItem: key => resultStore.delete(key)
  },
  TitanMinigames: { registerMiniGame: (type, handler) => { adapterContext.registered = { type, handler }; } },
  TitanSave: { saveGame: state => { adapterContext.savedState = state; } },
  TitanAchievements: { unlockAchievement: id => adapterContext.unlocked.push(id) },
  unlocked: []
};
adapterContext.window = adapterContext;
vm.runInNewContext(adapterSource, adapterContext);
const returnedState = { flags: {}, minigameResults: {}, mode: "minigame", currentScene: "chapter4_memory_reconstruction" };
assert.equal(adapterContext.TitanChapter4MemoryReconstruction.consumeResult(returnedState), "chapter4_845_memory_01");
assert.equal(returnedState.flags.chapter4_memory_puzzle_completed, true);
assert.equal(returnedState.minigameResults.memory.success, true);
assert.equal(resultStore.has("TitanStory-memory-reconstruction-result"), false);
console.log("Chapter 4 checks passed.");
