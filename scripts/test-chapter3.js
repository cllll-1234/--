/* 第三章：维护站地图可达性、剧情引用、证据条件与占位接口检查。 */
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

const map = TitanExploreMaps.seventhMaintenanceStation;
const scenes = TitanStory.scenes;
assert.deepEqual([map.width, map.height], [1672, 941]);
assert.deepEqual(map.spawn, { x: 171, y: 733 });
assert.equal(map.backgroundAsset, "images/maps/seventh-maintenance-station.webp");
assert.equal(fs.existsSync(path.join(root, map.backgroundAsset)), true, "第七维护站正式地图不存在");
assert.equal(map.cameraMode, "follow");
assert.equal(map.useNaturalSize, true);

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
  for (let index = 0; index < queue.length && index < 80000; index += 1) {
    const current = queue[index];
    const distance = Math.hypot(current.x + 22 - (zone.x + zone.width / 2), current.y + 46.5 - (zone.y + zone.height / 2));
    if (distance <= zone.interactionDistance) return true;
    [[step, 0], [-step, 0], [0, step], [0, -step]].forEach(([dx, dy]) => {
      const next = { x: current.x + dx, y: current.y + dy };
      const key = next.x + "," + next.y;
      if (!seen.has(key) && canStand(next)) { seen.add(key); queue.push(next); }
    });
  }
  return false;
}

assert.ok(canStand(map.spawn), "维护站出生点被碰撞覆盖");
map.interactionZones.forEach(zone => assert.ok(canReachZone(zone), "维护站交互点不可达：" + zone.id));
[
  "station_g17_crate", "station_transfer_record", "station_karl_archive", "station_outside_map",
  "station_group_experiment", "station_sealed_room", "station_exit"
].forEach(id => assert.ok(map.interactionZones.some(zone => zone.id === id), "缺少维护站交互点：" + id));
assert.equal(map.interactionZones.find(zone => zone.id === "station_group_experiment").hiddenInteraction, true);
assert.equal(map.interactionZones.find(zone => zone.id === "station_transfer_record").requiredFlag, "clue_g17_station");
assert.equal(map.interactionZones.find(zone => zone.id === "station_transfer_record").dialogByFlag[0].flag, "archive_game_completed");
assert.equal(map.interactionZones.find(zone => zone.id === "station_transfer_record").dialogByFlag[0].scene, "chapter3_archive_review_prompt");
assert.equal(map.interactionZones.find(zone => zone.id === "station_karl_archive").requiredFlag, "chapter3_archive_puzzle_completed");
assert.equal(map.interactionZones.find(zone => zone.id === "station_outside_map").requiredFlag, "clue_karl_purification");
assert.equal(map.interactionZones.find(zone => zone.id === "station_sealed_room").requiredFlag, "clue_outside_resource_map");
assert.equal(map.interactionZones.find(zone => zone.id === "station_exit").requiredFlag, "chapter3_sealed_room_checked");
map.interactionZones.forEach(zone => assert.ok(zone.interactionDistance >= 60 && zone.interactionDistance <= 120,
  "交互半径应保持在60～120px：" + zone.id));
map.interactionZones.filter(zone => zone.type !== "exit").forEach(zone => assert.equal(zone.prompt, "[E] 调查"));

Object.keys(scenes).filter(id => id.indexOf("chapter3_") === 0).forEach(id => {
  const scene = scenes[id];
  const targets = [scene.next]
    .concat((scene.choices || []).map(choice => choice.next))
    .concat((scene.routes || []).map(route => route.next));
  if (scene.minigame) targets.push(scene.minigame.onSuccess, scene.minigame.onFailure, scene.minigame.onUnavailable);
  targets.filter(Boolean).forEach(target => assert.ok(scenes[target], id + " 指向不存在的剧情：" + target));
});
map.interactionZones.forEach(zone => assert.ok(scenes[zone.targetScene], zone.id + " 指向不存在的剧情：" + zone.targetScene));
assert.equal(scenes.chapter3_archive_puzzle.minigame.type, "archivePuzzle");
assert.ok(scenes.chapter3_04.flags.includes("clue_seventh_station_church_facility"));
assert.match(scenes.chapter3_archive_review.text, /转运人数：18/);
assert.match(scenes.chapter3_archive_review.text, /G-17消耗：18单位/);
assert.equal(scenes.chapter3_transfer_file_01.text, "这些不是普通的废纸。");
assert.equal(scenes.chapter3_transfer_file_02.text, "被人故意撕碎了。");
assert.ok(scenes.chapter3_archive_puzzle.minigame.successEvidence.includes("dock_transfer_record"));
assert.equal(scenes.chapter3_archive_review_prompt.choices.length, 2);
assert.ok(scenes.chapter3_transfer_record_clue.flags.includes("clue_g17_missing_people"));
assert.ok(scenes.chapter3_outside_map_clue.flags.includes("outsideWorldSafe"));
assert.ok(scenes.chapter3_hidden_experiment_clue.flags.includes("foundFounderRecord"));
assert.equal(/教会制造巨人|人会变成巨人/.test(Object.keys(scenes).filter(id => id.indexOf("chapter3_") === 0).map(id => scenes[id].text).join("\n")), false,
  "第三章不应直接揭晓人会变成巨人");

const saveContext = { window: {}, localStorage: { getItem: () => null, setItem: () => {} } };
saveContext.window = saveContext;
vm.runInNewContext(fs.readFileSync(path.join(root, "js/save.js"), "utf8"), saveContext);
const initial = saveContext.TitanSave.createInitialGameState();
[
  "chapter3_briefing_done", "clue_seventh_station_church_facility", "visited_seventh_maintenance_station", "clue_g17_station", "chapter3_archive_found",
  "archive_game_started", "archive_fragments_selected", "archive_puzzle_completed", "archive_anomalies_marked",
  "archive_reasoning_completed", "archive_game_completed", "has_dock_transfer_record", "chapter3_archive_puzzle_completed",
  "clue_personnel_transfer_record", "clue_g17_missing_people", "clue_karl_purification",
  "clue_outside_resource_map", "hidden_group_induction_record", "chapter3_core_evidence_complete",
  "chapter3_sealed_room_checked", "chapter3_returned_to_hq", "chapter3_complete"
].forEach(flag => assert.equal(initial.flags[flag], false, "存档缺少第三章状态：" + flag));
assert.equal(initial.minigameResults.archivePuzzle, null);
assert.equal(saveContext.TitanSave.normalizeGameState({ currentScene: "chapter3_manual_hub" }).currentScene, "chapter3_01");

const adapterSource = fs.readFileSync(path.join(root, "js/chapter3-archive-puzzle.js"), "utf8");
assert.match(adapterSource, /pieceCount:\s*PIECE_COUNT/);
assert.match(adapterSource, /minigames\/archive-puzzle\/game\.html/);
assert.match(adapterSource, /startArchiveRepairGame/);
const archiveGameSource = fs.readFileSync(path.join(root, "js/minigames/archive-restoration.js"), "utf8");
assert.equal((archiveGameSource.match(/correct:\s*true/g) || []).length, 6);
assert.equal((archiveGameSource.match(/correct:\s*false/g) || []).length, 6);
assert.match(archiveGameSource, /TitanChapter3ArchivePuzzle\.register\(start\)/);
assert.match(archiveGameSource, /dock_transfer_record/);
assert.match(archiveGameSource, /window\.startArchiveRestorationGame/);
const debugSource = fs.readFileSync(path.join(root, "js/explore/maintenance-station-debug.js"), "utf8");
assert.match(debugSource, /station-debug-archive-repaired/);
assert.match(debugSource, /station-debug-unlock-all/);
[
  "station_g17_crate", "station_transfer_record", "station_karl_archive",
  "station_outside_map", "station_sealed_room", "station_exit"
].forEach(id => assert.match(debugSource, new RegExp(id), "Debug缺少传送目标：" + id));
console.log("Chapter 3 checks passed.");
