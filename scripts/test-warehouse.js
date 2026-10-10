/* 废弃仓库：地图尺寸、脚部碰撞、交互可达性、剧情引用和存档字段检查。 */
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

const map = TitanExploreMaps.warehouse;
const scenes = TitanStory.scenes;
const png = fs.readFileSync(path.join(root, map.backgroundAsset));
assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [1672, 941]);
assert.deepEqual([map.width, map.height], [1672, 941]);
assert.equal(map.npcs.length, 0, "背景已有老搬运工，不应重复渲染 NPC sprite");
assert.equal(TitanExploreMaps.undergroundStreet.buildings.warehouse, "warehouse");
const warehouseEntrance = TitanExploreMaps.undergroundStreet.interactionZones.find(zone => zone.id === "warehouseEntrance");
assert.equal(warehouseEntrance.targetMap, "warehouse", "地下街仓库入口必须显式指向仓库地图");
assert.equal(TitanExploreMaps[warehouseEntrance.targetMap], map, "地下街仓库入口目标未注册");

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
  for (let index = 0; index < queue.length && index < 100000; index += 1) {
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

assert.ok(canStand(map.spawn), "仓库出生点被碰撞覆盖");
map.collisions.forEach(collision => {
  assert.ok(collision.x >= 0 && collision.y >= 0 && collision.x + collision.width <= map.width && collision.y + collision.height <= map.height,
    "碰撞框越界：" + collision.id);
});
map.interactionZones.forEach(zone => assert.ok(canReachZone(zone), "交互区不可达：" + zone.id));

const requiredInteractions = ["warehouse_normal_crate", "warehouse_church_crate", "warehouse_g17_crate", "warehouse_rope",
  "warehouse_table", "warehouse_manifest", "warehouse_map", "warehouse_dawn_mark", "warehouse_old_porter", "warehouse_exit"];
requiredInteractions.forEach(id => assert.ok(map.interactionZones.some(zone => zone.id === id), "缺少交互区：" + id));
assert.equal(map.interactionZones.find(zone => zone.id === "warehouse_dawn_mark").hiddenInteraction, true);

Object.keys(scenes).filter(id => id.indexOf("warehouse_") === 0).forEach(id => {
  const scene = scenes[id];
  const targets = [scene.next]
    .concat((scene.choices || []).map(choice => choice.next))
    .concat((scene.routes || []).map(route => route.next));
  targets.filter(Boolean).forEach(target => assert.ok(scenes[target], id + " 指向不存在的剧情：" + target));
});
map.interactionZones.forEach(zone => {
  [zone.targetScene].concat((zone.dialogByFlag || []).map(entry => entry.scene)).filter(Boolean)
    .forEach(scene => assert.ok(scenes[scene], zone.id + " 指向不存在的剧情：" + scene));
});
assert.ok(scenes.warehouse_manifest_clue.flags.includes("clue_seventh_dock"));
assert.ok(scenes.warehouse_manifest_clue.flags.includes("slumTransportFound"));
assert.equal(scenes.warehouse_porter_first_01.character, "", "老搬运工缺立绘时不应复用其他角色");
const coreFlags = ["clue_missing_people", "clue_night_carriage", "clue_seventh_dock"];
assert.deepEqual(TitanStory.chapter2CoreClues.map(clue => clue.flag), coreFlags);
assert.equal(scenes.chapter2_exit_check.routes.length, 2);
scenes.chapter2_exit_check.routes.forEach(route => {
  assert.deepEqual(Array.from(route.conditions.allFlags), coreFlags, "返回总部的每条分支都必须要求三项核心线索");
});
for (let mask = 0; mask < 8; mask++) {
  const flags = Object.fromEntries(coreFlags.map((name, index) => [name, Boolean(mask & (1 << index))]));
  const missing = TitanStory.getChapter2MissingClues(flags);
  const objective = TitanStory.getChapter2Objective(flags);
  assert.equal(missing.length, 3 - coreFlags.filter(name => flags[name]).length);
  assert.equal(objective.includes("返回调查兵团总部"), mask === 7);
  coreFlags.forEach((name, index) => {
    assert.equal(objective.includes(TitanStory.chapter2CoreClues[index].label), !flags[name]);
  });
  const canReturn = scenes.chapter2_exit_check.routes.some(route => route.conditions.allFlags.every(name => flags[name]));
  assert.equal(canReturn, mask === 7, `三项核心线索组合 ${mask} 的出口判定错误`);
}

const debugSource = fs.readFileSync(path.join(root, "js/explore/warehouse-debug.js"), "utf8");
assert.match(debugSource, /warehouse-debug-set-spawn/, "仓库 Debug 缺少出生点设置功能");
const exploreSource = fs.readFileSync(path.join(root, "js/explore/explore-manager.js"), "utf8");
assert.match(exploreSource, /warehouseEntrance:\s*"warehouse"/, "建筑切换缺少旧仓库入口ID兼容");

const saveContext = { window: {}, localStorage: { getItem: () => null, setItem: () => {} } };
saveContext.window = saveContext;
vm.runInNewContext(fs.readFileSync(path.join(root, "js/save.js"), "utf8"), saveContext);
const initial = saveContext.TitanSave.createInitialGameState();
["clue_night_carriage", "warehouse_tracks_checked", "clue_missing_people", "clue_g17", "clue_dawnbreakers",
  "visited_warehouse", "talked_old_porter", "porter_night_transport", "clue_people_in_carriage", "clue_church_warehouse",
  "clue_g17_warehouse", "clue_seventh_dock", "clue_seventh_dock_code", "hidden_warehouse_dawn", "warehouse_full_investigation"]
  .forEach(flag => assert.equal(initial.flags[flag], false, "存档缺少仓库状态：" + flag));

console.log("Warehouse checks passed.");
