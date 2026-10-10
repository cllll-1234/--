/* 第五章：共同开场、三路线、两张功能地图、小游戏接口与四结局检查。 */
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

const maps = [TitanExploreMaps.centralDistrict, TitanExploreMaps.centralFacility];
const scenes = TitanStory.scenes;

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}
function feetAt(position) { return { x: position.x + 7, y: position.y + 38, width: 30, height: 17 }; }
function canStand(map, position) {
  const feet = feetAt(position);
  return feet.x >= 0 && feet.y >= 0 && feet.x + feet.width <= map.width && feet.y + feet.height <= map.height &&
    !map.collisions.some(collision => overlaps(feet, collision));
}
function canReach(map, target, isTrigger) {
  const step = 8;
  const queue = [map.spawn];
  const seen = new Set([map.spawn.x + "," + map.spawn.y]);
  for (let index = 0; index < queue.length && index < 90000; index += 1) {
    const current = queue[index];
    const reached = isTrigger ? overlaps(feetAt(current), target) :
      Math.hypot(current.x + 22 - (target.x + target.width / 2), current.y + 28 - (target.y + target.height / 2)) <= target.interactionDistance;
    if (reached) return true;
    [[step, 0], [-step, 0], [0, step], [0, -step]].forEach(([dx, dy]) => {
      const next = { x: current.x + dx, y: current.y + dy };
      const key = next.x + "," + next.y;
      if (!seen.has(key) && canStand(map, next)) { seen.add(key); queue.push(next); }
    });
  }
  return false;
}

assert.deepEqual([maps[0].width, maps[0].height], [1672, 941]);
assert.equal(maps[0].backgroundAsset, "images/maps/chapter5_central_square.png");
assert.equal(maps[0].pendingBackgroundAsset, "images/maps/chapter5_central_square.png");
assert.equal(maps[0].minimumWorldWidth, 3000);
assert.deepEqual([
  maps[0].minimumWorldWidth,
  Math.round(maps[0].height * maps[0].minimumWorldWidth / maps[0].width)
], [3000, 1688]);
assert.equal(maps[0].useNaturalSize, true);
assert.equal(maps[0].cameraMode, "follow");
assert.deepEqual(maps[0].spawn, { x: 814, y: 850 });
assert.equal(maps[0].decorations.length, 1);
assert.deepEqual(
  [maps[0].decorations[0].id, maps[0].decorations[0].hiddenAfterFlag],
  ["central-guardian-visual", "chapter5_guardian_defeated"]
);
assert.equal(maps[0].decorations[0].asset, "images/explore/objects/sprite.png");
assert.deepEqual(
  [maps[0].decorations[0].x, maps[0].decorations[0].y, maps[0].decorations[0].width, maps[0].decorations[0].height],
  [716, 180, 240, 360]
);
const guardianAsset = path.join(root, maps[0].decorations[0].asset);
assert.ok(fs.existsSync(guardianAsset), "第五章守门者图片不存在");
const guardianPng = fs.readFileSync(guardianAsset);
assert.deepEqual([guardianPng.readUInt32BE(16), guardianPng.readUInt32BE(20)], [1086, 1448]);
assert.equal(maps[0].triggerZones[0].scene, "chapter5_guardian_intro_01");
assert.equal(maps[0].triggerZones[0].onceFlag, "chapter5_guardian_encountered");
const centralMapAsset = path.join(root, maps[0].backgroundAsset);
assert.ok(fs.existsSync(centralMapAsset), "第五章中央广场正式地图不存在");
const centralMapPng = fs.readFileSync(centralMapAsset);
assert.deepEqual([centralMapPng.readUInt32BE(16), centralMapPng.readUInt32BE(20)], [1672, 941]);
assert.equal(maps[1].pendingBackgroundAsset, "images/maps/central-facility.png");
maps.forEach(map => assert.ok(canStand(map, map.spawn), map.id + " 出生点被碰撞覆盖"));
maps.forEach(map => map.interactionZones.forEach(zone => assert.ok(canReach(map, zone, false), map.id + " 交互点不可达：" + zone.id)));
maps[0].triggerZones.forEach(zone => assert.ok(canReach(maps[0], zone, true), "中央城区触发区不可达：" + zone.id));
assert.deepEqual(maps[1].interactionZones.map(zone => zone.id), [
  "central_facility_g17_stock", "central_facility_purification_list", "central_facility_founder_device"
]);
assert.equal(maps[1].interactionZones[2].requiredFlag, "chapter5_facility_evidence_complete");

Object.keys(scenes).filter(id => id.indexOf("chapter5_") === 0 || id.indexOf("ending_") === 0).forEach(id => {
  const scene = scenes[id];
  const targets = [scene.next]
    .concat((scene.choices || []).map(choice => choice.next))
    .concat((scene.routes || []).map(route => route.next));
  if (scene.minigame) targets.push(scene.minigame.onSuccess, scene.minigame.onFailure, scene.minigame.onUnavailable);
  targets.filter(Boolean).forEach(target => assert.ok(scenes[target], id + " 指向不存在的剧情：" + target));
});
maps.forEach(map => map.interactionZones.forEach(zone => assert.ok(scenes[zone.targetScene], zone.id + " 指向不存在的剧情")));
maps[0].triggerZones.forEach(zone => assert.ok(scenes[zone.scene], zone.id + " 指向不存在的剧情"));

assert.equal(scenes.chapter4_end_card.next, "chapter5_hq_arrival");
assert.equal(scenes.chapter5_hq_arrival.targetMap, "hq");
assert.equal(scenes.chapter5_hq_arrival.returnToExplore, true);
assert.deepEqual(scenes.chapter5_route_gate.routes.map(item => item.conditions.route), ["rebellion", "order", "truth"]);
assert.deepEqual(scenes.chapter5_route_gate.routes.map(item => item.next), ["chapter5_rebellion_01", "chapter5_order_01", "chapter5_truth_01"]);
assert.equal(scenes.chapter5_guardian_boss.minigame.type, "guardianBoss");
assert.equal(scenes.chapter5_guardian_boss.minigame.resultKey, "guardianBoss");
assert.equal(scenes.chapter5_guardian_boss.autoStartMinigame, true);
assert.equal(scenes.chapter5_truth_qte.minigame.type, "founderControlQte");
assert.equal(scenes.chapter5_truth_qte.minigame.resultKey, "founderControl");
assert.match(scenes.chapter5_broadcast_reiner_02.text, /玛利亚之墙是我撞开的/);
assert.match(scenes.chapter5_broadcast_reiner_05.text, /巨壁教和王政/);
assert.deepEqual(scenes.chapter5_order_choice.choices.map(choice => choice.next), ["ending_bad_01", "ending_normal_01"]);
assert.equal(scenes.ending_good_08.ending, "good");
assert.equal(scenes.ending_bad_06.ending, "bad");
assert.equal(scenes.ending_normal_02.ending, "normal");
assert.equal(scenes.ending_hidden_10.ending, "hidden");
assert.match(scenes.ending_hidden_10.text, /真正的墙，从来不在那里/);

const hange = TitanExploreMaps.hq.npcs.find(npc => npc.id === "hange");
assert.ok(hange.dialogByFlag.some(item => item.scene === "chapter5_common_01"));
assert.ok(TitanExploreMaps.hq.npcs.some(npc => npc.id === "chapter5-royal-guard" && npc.visibleWhenFlag === "chapter5_started"));

const saveContext = { window: {}, localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
saveContext.window = saveContext;
vm.runInNewContext(fs.readFileSync(path.join(root, "js/save.js"), "utf8"), saveContext);
const initial = saveContext.TitanSave.createInitialGameState();
[
  "chapter5_started", "chapter5_hq_briefing_complete", "chapter5_central_district_entered",
  "chapter5_guardian_encountered", "chapter5_guardian_battle_complete", "chapter5_guardian_defeated",
  "chapter5_broadcast_complete", "chapter5_order_contacted", "chapter5_archives_retained",
  "chapter5_central_facility_entered", "chapter5_g17_stock_destroyed", "chapter5_purification_list_found",
  "chapter5_facility_evidence_complete", "chapter5_founder_control_completed", "chapter5_founder_device_destroyed",
  "chapter5_titan_system_ended", "chapter5_good_ending", "chapter5_bad_ending", "chapter5_normal_ending",
  "chapter5_hidden_ending", "chapter5_complete"
].forEach(flag => assert.equal(initial.flags[flag], false, "存档缺少第五章状态：" + flag));
assert.equal(initial.minigameResults.guardianBoss, null);
assert.equal(initial.minigameResults.founderControl, null);
assert.equal(saveContext.TitanSave.normalizeGameState({ currentScene: "chapter5_church_archive", route: "order" }).currentScene, "chapter5_order_01");

const adapterSource = fs.readFileSync(path.join(root, "js/chapter5-minigames.js"), "utf8");
assert.match(adapterSource, /minigames\/boss-battle\/boss-battle\.html\?return=story/);
assert.ok(fs.existsSync(path.join(root, "minigames/boss-battle/boss-battle.html")));
const exploreCss = fs.readFileSync(path.join(root, "css/explore.css"), "utf8");
assert.match(exploreCss, /has-map-art\[data-map="centralDistrict"\][\s\S]*?background-repeat:\s*no-repeat/);
assert.match(exploreCss, /has-map-art\[data-map="centralDistrict"\][\s\S]*?background-size:\s*100% 100%/);
assert.match(exploreCss, /object-guardian-boss/);
const exploreManagerSource = fs.readFileSync(path.join(root, "js/explore/explore-manager.js"), "utf8");
assert.match(exploreManagerSource, /hiddenAfterFlag/);
assert.match(exploreManagerSource, /zone\.debugCategory \|\| "stage", "triggerZones"/);
assert.match(adapterSource, /minigames\/founder-control\/game\.html/);
const html = fs.readFileSync(path.join(root, "game.html"), "utf8");
assert.match(html, /js\/chapter5-minigames\.js/);
assert.match(html, /js\/explore\/central-district-data\.js/);
assert.match(html, /js\/explore\/central-facility-data\.js/);

const storage = new Map();
const handlers = {};
const state = saveContext.TitanSave.createInitialGameState();
const adapterContext = {
  console, location: { href: "" },
  localStorage: {
    getItem: key => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key)
  },
  TitanMinigames: { registerMiniGame: (type, handler) => { handlers[type] = handler; } },
  TitanSave: { saveGame: () => {} },
  getTitanGameState: () => state
};
adapterContext.window = adapterContext;
vm.runInNewContext(adapterSource, adapterContext);
const bossAdapter = adapterContext.TitanChapter5Minigames.guardianBoss;
assert.equal(handlers.guardianBoss, bossAdapter.start);
storage.set(bossAdapter.resultKey, "stale result");
handlers.guardianBoss({ sceneId: "chapter5_guardian_boss" });
assert.equal(storage.has(bossAdapter.resultKey), false);
assert.equal(state.mode, "minigame");
assert.equal(adapterContext.location.href, "minigames/boss-battle/boss-battle.html?return=story");

storage.set(bossAdapter.resultKey, JSON.stringify({ type: "guardianBoss", completed: true, success: true, elapsed: 42, retries: 1 }));
assert.equal(bossAdapter.consumeResult(state), "chapter5_guardian_final_01");
assert.equal(state.flags.chapter5_guardian_battle_complete, true);
assert.equal(state.minigameResults.guardianBoss.success, true);
assert.equal(storage.has(bossAdapter.resultKey), false);

state.mode = "minigame";
state.currentScene = "chapter5_guardian_boss";
state.flags.chapter5_guardian_battle_complete = false;
storage.set(bossAdapter.resultKey, JSON.stringify({ type: "guardianBoss", completed: true, success: false }));
assert.equal(bossAdapter.consumeResult(state), "chapter5_guardian_retry");
assert.equal(state.flags.chapter5_guardian_battle_complete, false);
assert.equal(state.minigameResults.guardianBoss.success, false);

const battleHtml = fs.readFileSync(path.join(root, "minigames/boss-battle/boss-battle.html"), "utf8");
assert.match(battleHtml, /js\/story-bridge\.js/);
const bridgeSource = fs.readFileSync(path.join(root, "minigames/boss-battle/js/story-bridge.js"), "utf8");
const listeners = {};
const timers = [];
const returnButton = { addEventListener: (name, callback) => { listeners["return:" + name] = callback; } };
const bridgeContext = {
  console,
  URLSearchParams,
  location: { search: "?return=story", href: "" },
  localStorage: adapterContext.localStorage,
  setTimeout: callback => timers.push(callback),
  document: {
    body: { dataset: {}, appendChild: () => {} },
    querySelector: () => ({ setAttribute() {}, textContent: "" }),
    createElement: () => returnButton,
    addEventListener: (name, callback) => { listeners[name] = callback; }
  }
};
bridgeContext.window = bridgeContext;
vm.runInNewContext(bridgeSource, bridgeContext);
listeners["gatekeeper:complete"]({ detail: { difficulty: "hard", elapsed: 42, retries: 1, stats: { napeHits: 3 } } });
assert.equal(JSON.parse(storage.get(bossAdapter.resultKey)).success, true);
timers.shift()();
assert.equal(bridgeContext.location.href, "../../game.html?mode=guardian-boss-return");

storage.delete(bossAdapter.resultKey);
listeners["return:click"]();
assert.equal(storage.has(bossAdapter.resultKey), false, "完成后的重复返回不能覆盖胜利结果");

const failureTimers = [];
const failureBridge = Object.assign({}, bridgeContext, {
  location: { search: "?return=story", href: "" },
  setTimeout: callback => failureTimers.push(callback)
});
failureBridge.window = failureBridge;
vm.runInNewContext(bridgeSource, failureBridge);
listeners["gatekeeper:exit"]({ detail: { reason: "defeat" } });
assert.equal(JSON.parse(storage.get(bossAdapter.resultKey)).success, false);
failureTimers.shift()();
assert.equal(failureBridge.location.href, "../../game.html?mode=guardian-boss-return");

console.log("Chapter 5 checks passed.");
