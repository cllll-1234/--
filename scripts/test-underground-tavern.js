/* 地下街酒馆：尺寸、碰撞、交互可达性、剧情与存档配置检查。 */
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

const map = TitanExploreMaps.undergroundTavern;
const png = fs.readFileSync(path.join(root, map.backgroundAsset));
assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [1619, 971]);
assert.deepEqual([map.width, map.height], [1619, 971]);
assert.equal(map.npcs.length, 0, "背景内人物不应重复渲染 NPC sprite");
assert.equal(map.interactionZones.length, 8);

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
  for (let index = 0; index < queue.length && index < 90000; index += 1) {
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
function faces(playerCenter, zoneCenter, direction) {
  const dx = zoneCenter.x - playerCenter.x;
  const dy = zoneCenter.y - playerCenter.y;
  if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return true;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? direction === "right" : direction === "left";
  return dy > 0 ? direction === "down" : direction === "up";
}
function canSelectZone(target) {
  const targetCenter = { x: target.x + target.width / 2, y: target.y + target.height / 2 };
  const radius = target.interactionDistance;
  for (let y = Math.max(0, Math.floor(targetCenter.y - radius - 28)); y <= Math.min(map.height - 56, targetCenter.y + radius); y += 4) {
    for (let x = Math.max(0, Math.floor(targetCenter.x - radius - 22)); x <= Math.min(map.width - 44, targetCenter.x + radius); x += 4) {
      if (!canStand({ x, y })) continue;
      const playerCenter = { x: x + 22, y: y + 28 };
      for (const direction of ["up", "down", "left", "right"]) {
        let selected = null;
        let nearestScore = Infinity;
        map.interactionZones.forEach(zone => {
          const zoneCenter = { x: zone.x + zone.width / 2, y: zone.y + zone.height / 2 };
          const distance = Math.hypot(playerCenter.x - zoneCenter.x, playerCenter.y - zoneCenter.y);
          if (zone.requireFacing && !faces(playerCenter, zoneCenter, direction)) return;
          const score = distance - (zone.interactionPriority || 0);
          if (distance <= zone.interactionDistance && score < nearestScore) { selected = zone; nearestScore = score; }
        });
        if (selected === target) return true;
      }
    }
  }
  return false;
}

assert.ok(canStand(map.spawn), "酒馆出生点被碰撞覆盖");
map.collisions.forEach(collision => {
  assert.ok(collision.x >= 0 && collision.y >= 0 && collision.x + collision.width <= map.width && collision.y + collision.height <= map.height,
    "碰撞框越界：" + collision.id);
});
map.interactionZones.forEach(zone => {
  assert.ok(canReachZone(zone), "交互区不可达：" + zone.id);
  assert.ok(canSelectZone(zone), "交互区会被其他目标遮蔽：" + zone.id);
});

const owner = map.interactionZones.find(zone => zone.id === "tavernOwner");
assert.equal(owner.dialogByFlag[0].scene, "tavern_owner_after_01");
assert.equal(owner.dialogByFlag[1].scene, "tavern_owner_notice_01");
assert.ok(owner.dialogByFlag[1].allFlags.includes("clue_missing_people"));
assert.equal(map.interactionZones.find(zone => zone.id === "tavernExit").restoreMapPosition, true);
assert.equal(TitanExploreMaps.undergroundStreet.buildings.tavern, "undergroundTavern");

const scenes = TitanStory.scenes;
assert.equal(TitanExploreMaps.undergroundStreet.interactionZones.find(zone => zone.id === "announcementBoard").targetScene, "chapter2_clue_list");
assert.equal(scenes.chapter2_clue_list.next, "chapter2_clue_list_b");
assert.equal(scenes.chapter2_clue_list_b.next, "chapter2_clue_list_c");
assert.equal(scenes.chapter2_clue_list_c.next, "chapter2_clue_list_01");
assert.equal(scenes.chapter2_clue_list_01.text, "……");
assert.equal(scenes.chapter2_clue_list_02.text, "太多了。");
assert.ok(scenes.chapter2_clue_list_record.flags.includes("clue_missing_people"));
assert.ok(scenes.chapter2_clue_list_record.flags.includes("slumNoticeRead"));
assert.ok(scenes.chapter2_clue_list_record.evidence.includes("slum_list"));
const karlZone = TitanExploreMaps.undergroundStreet.interactionZones.find(zone => zone.id === "karlFamily");
const karlNpc = TitanExploreMaps.undergroundStreet.npcs.find(npc => npc.id === "karl-family-npc");
assert.equal(karlNpc.spriteAsset, "images/explore/npc/karl_mother.png");
assert.equal(karlZone.dialogByFlag[0].scene, "chapter2_oldwoman_repeat");
assert.equal(scenes.chapter2_oldwoman_01.character, "images/characters/dialog/karl_mother_normal.png");
assert.equal(scenes.chapter2_oldwoman_06.choices.length, 2);
assert.equal(scenes.chapter2_oldwoman_symbol.character, "images/objects/dawnbreakers-note.png");
assert.ok(scenes.chapter2_oldwoman_clue.flags.includes("clue_dawnbreakers"));
assert.ok(scenes.chapter2_oldwoman_cross_link.flags.includes("dawnbreakersCrossIdentified"));
Object.keys(scenes).filter(id => id.indexOf("tavern_") === 0).forEach(id => {
  const scene = scenes[id];
  const targets = [scene.next]
    .concat((scene.choices || []).map(choice => choice.next))
    .concat((scene.routes || []).map(route => route.next));
  targets.filter(Boolean).forEach(target => assert.ok(scenes[target], id + " 指向不存在的剧情：" + target));
});
assert.ok(scenes.tavern_owner_clue.flags.includes("slumNightCarriage"));
assert.ok(scenes.tavern_owner_clue.flags.includes("clue_night_carriage"));
assert.ok(scenes.tavern_owner_clue.evidence.includes("slum_merchant"));
assert.ok(scenes.tavern_guest_a_record.evidence.includes("slum_wheel_rumor"));
assert.ok(scenes.tavern_guest_b_record.evidence.includes("slum_disappearance_rumor"));
assert.ok(scenes.tavern_ledger_record.evidence.includes("slum_tavern_ledger"));

const saveContext = { window: {}, localStorage: { getItem: () => null, setItem: () => {} } };
saveContext.window = saveContext;
vm.runInNewContext(fs.readFileSync(path.join(root, "js/save.js"), "utf8"), saveContext);
const initial = saveContext.TitanSave.createInitialGameState();
["clue_missing_people", "clue_night_carriage", "clue_dawnbreakers", "dawnbreakersCrossIdentified", "tavernEntered", "talkedTavernOwner", "heardWheelRumor", "heardDisappearanceRumor", "slumTavernLedgerRead", "slumTavernCluesLinked", "tavernBarrelChecked"]
  .forEach(flag => assert.equal(initial.flags[flag], false, "存档缺少酒馆状态：" + flag));
initial.mapPositions.undergroundStreet = { x: 512.5, y: 650.25 };
const restoredPosition = saveContext.TitanSave.normalizeGameState(initial).mapPositions.undergroundStreet;
assert.equal(restoredPosition.x, 512.5);
assert.equal(restoredPosition.y, 650.25);

console.log("Underground tavern checks passed.");
