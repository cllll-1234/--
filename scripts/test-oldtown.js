/* 新版旧城区的无浏览器回归检查：配置、碰撞、热点可达性和剧情约束。 */
"use strict";

const assert = require("node:assert/strict");
global.window = global;
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

const map = global.TitanExploreMaps.chapter1_ruins;
const scenes = global.TitanStory.scenes;
const fallenTitanVisual = map.decorations.find(item => item.id === "fallen-titan-visual");
assert.equal(fallenTitanVisual.asset, "images/objects/巨人尸体.png");
assert.equal(fallenTitanVisual.visibleWhenFlag, "chapter1_minigame_finished");

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function feetAt(position) {
  return { x: position.x + 7, y: position.y + 38, width: 30, height: 17 };
}

function canStand(position) {
  const feet = feetAt(position);
  return feet.x >= 0 && feet.y >= 0 && feet.x + feet.width <= map.width && feet.y + feet.height <= map.height &&
    !map.collisions.some(function (collision) { return overlaps(feet, collision); });
}

function canReach(start, target) {
  const step = 24;
  const columns = Math.floor((map.width - 44) / step) + 1;
  const rows = Math.floor((map.height - 56) / step) + 1;
  const startCell = { x: Math.round(start.x / step), y: Math.round(start.y / step) };
  const queue = [startCell];
  const visited = new Set([startCell.x + "," + startCell.y]);
  while (queue.length) {
    const cell = queue.shift();
    const position = { x: cell.x * step, y: cell.y * step, width: 44, height: 56 };
    const center = { x: position.x + 22, y: position.y + 28 };
    if (target.kind === "zone" && overlaps(feetAt(position), target.value)) return true;
    if (target.kind === "interactable") {
      const item = target.value;
      const itemCenter = { x: item.x + item.width / 2, y: item.y + item.height / 2 };
      if (Math.hypot(center.x - itemCenter.x, center.y - itemCenter.y) <= item.interactionDistance) return true;
    }
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (offset) {
      const next = { x: cell.x + offset[0], y: cell.y + offset[1] };
      const key = next.x + "," + next.y;
      const candidate = { x: next.x * step, y: next.y * step, width: 44, height: 56 };
      if (next.x < 0 || next.y < 0 || next.x >= columns || next.y >= rows || visited.has(key) || !canStand(candidate)) return;
      visited.add(key);
      queue.push(next);
    });
  }
  return false;
}

assert.equal(map.backgroundAsset, "images/maps/oldtown.png");
assert.equal(map.worldScale, 1.5);
assert.equal(map.width, 2508);
assert.equal(map.height, 1412);
assert.equal(map.cameraMode, "follow");
assert.ok(map.width > 1440 && map.height > 900, "地图不应在 1440×900 视口中一次完整显示");
assert.ok(canStand(Object.assign({ width: 44, height: 56 }, map.playerStart)), "玩家出生点被碰撞体覆盖");
map.npcs.forEach(function (npc) {
  assert.ok(canStand({ x: npc.x, y: npc.y, width: npc.width, height: npc.height }), npc.name + "出生点被碰撞体覆盖");
  (npc.positionByFlags || []).forEach(function (position) {
    assert.ok(canStand({ x: position.x, y: position.y, width: npc.width, height: npc.height }), npc.name + "阶段坐标被碰撞体覆盖：" + position.flag);
  });
});

assert.equal(map.interactables.some(function (item) { return /letter|信/.test(item.id + item.name); }), false, "旧城区仍存在卡尔旧信热点");
["burned-wagon", "children-graffiti", "ruins-dawn-symbol", "ruins-footprints"].forEach(function (id) {
  const item = map.interactables.find(function (candidate) { return candidate.id === id; });
  assert.ok(item, "缺少调查点：" + id);
  assert.ok(canReach(map.playerStart, { kind: "interactable", value: item }), "调查点无法从入口到达：" + id);
});

const encounter = map.triggerZones.find(function (zone) { return zone.id === "chapter1TitanTrigger"; });
assert.ok(encounter && encounter.onceFlag === "chapter1_minigame_started");
assert.ok(canReach(map.playerStart, { kind: "zone", value: encounter }), "巨人小游戏触发区无法从入口到达");

const returnStart = map.playerStartByFlag[0];
assert.ok(canStand({ x: returnStart.x, y: returnStart.y, width: 44, height: 56 }), "小游戏返回点被碰撞体覆盖");
const corpse = map.interactables.find(function (item) { return item.id === "fallen-titan"; });
assert.equal(corpse.visibleWhenFlag, "chapter1_minigame_finished");
assert.ok(canReach(returnStart, { kind: "interactable", value: corpse }), "返回点无法到达巨人尸体调查范围");

Object.keys(scenes).filter(function (id) { return id.indexOf("chapter1_") === 0; }).forEach(function (id) {
  assert.equal(/卡尔|Karl|破晓者/.test(scenes[id].text), false, "第一章提前泄露名称：" + id);
});
assert.ok(scenes.chapter1_cross_found.flags.includes("clue_cross_obtained"));
assert.equal(scenes.chapter1_end_card.next, "chapter2_intro");

Object.keys(scenes).forEach(function (id) {
  const scene = scenes[id];
  const targets = [scene.next]
    .concat((scene.choices || []).map(function (choice) { return choice.next; }))
    .concat((scene.routes || []).map(function (route) { return route.next; }));
  if (scene.minigame) targets.push(scene.minigame.onSuccess, scene.minigame.onFailure, scene.minigame.onUnavailable);
  targets.filter(Boolean).forEach(function (target) {
    assert.ok(scenes[target], "剧情节点 " + id + " 指向不存在的节点 " + target);
  });
});
map.interactables.forEach(function (item) {
  if (item.dialog) assert.ok(scenes[item.dialog], "旧城区交互点指向不存在的节点：" + item.id);
});
map.triggerZones.forEach(function (zone) {
  if (zone.scene) assert.ok(scenes[zone.scene], "旧城区触发区指向不存在的节点：" + zone.id);
});

console.log("Oldtown regression checks passed.");
