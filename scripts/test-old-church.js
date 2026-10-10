/* 旧教堂布局检查：脚部碰撞、调查可达性与交互圆重叠。 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../js/explore/old-church-data.js"), "utf8"), context);
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../js/explore/player-controller.js"), "utf8"), context);
const church = context.window.TitanOldChurch;
const player = context.window.TitanPlayerSize;
assert.equal(player.spriteWidth, 92);
assert.equal(player.spriteHeight, 92);
assert.equal(player.width, 44);
assert.equal(player.height, 56);
assert.equal(player.footWidth, 30);
assert.equal(player.footHeight, 17);
assert.equal(church.referenceWidth, 1280);
assert.equal(church.referenceHeight, 960);
assert.equal(church.interactionZones.length, 14);

for (const block of church.collisions) {
  assert(block.x >= 0 && block.y >= 0 && block.width > 0 && block.height > 0, block.id);
  assert(block.x + block.width <= church.referenceWidth && block.y + block.height <= church.referenceHeight, block.id);
}

const center = zone => ({ x: zone.x + zone.width / 2, y: zone.y + zone.height / 2 });
for (let i = 0; i < church.interactionZones.length; i++) {
  for (let j = i + 1; j < church.interactionZones.length; j++) {
    const a = church.interactionZones[i];
    const b = church.interactionZones[j];
    const ac = center(a);
    const bc = center(b);
    assert(Math.hypot(ac.x - bc.x, ac.y - bc.y) >= a.interactionDistance + b.interactionDistance,
      `${a.id} 与 ${b.id} 的交互范围重叠`);
  }
}

function canOccupy(x, y, blocks = church.collisions, width = church.referenceWidth, height = church.referenceHeight) {
  const foot = context.window.getPlayerFootRect({ x, y });
  if (x < 0 || y < 0 || x + player.width > width || y + player.height > height) return false;
  return blocks.every(block => foot.x + foot.width <= block.x || foot.x >= block.x + block.width ||
    foot.y + foot.height <= block.y || foot.y >= block.y + block.height);
}

const step = 6;
const queue = [[church.spawn.x, church.spawn.y]];
const visited = new Set([queue[0].join(",")]);
assert(canOccupy(...queue[0]), "出生点必须可站立");
for (let head = 0; head < queue.length; head++) {
  const [x, y] = queue[head];
  for (const [dx, dy] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
    const nx = x + dx;
    const ny = y + dy;
    const key = `${nx},${ny}`;
    if (visited.has(key) || !canOccupy(nx, ny)) continue;
    visited.add(key);
    queue.push([nx, ny]);
  }
}

for (const zone of church.interactionZones) {
  const point = center(zone);
  const reachable = queue.some(([x, y]) => Math.hypot(x + player.width / 2 - point.x, y + player.height / 2 - point.y) <= zone.interactionDistance);
  assert(reachable, `${zone.id} 不可从出生点走到交互范围内`);
}

const cabinet = church.collisions.find(block => block.id === "church-cabinet");
const altar = church.collisions.find(block => block.id === "church-altar");
const vial = church.interactionZones.find(zone => zone.id === "church_g17_vial");
assert(cabinet.x >= altar.x + altar.width, "暗柜应位于祭坛右侧");
assert(cabinet.y < altar.y + altar.height && cabinet.y + cabinet.height > altar.y, "暗柜应与祭坛并排，而非位于正后方");
const frontStand = queue.find(([x, y]) => {
  const foot = context.window.getPlayerFootRect({ x, y });
  const vialCenter = center(vial);
  if (foot.x < cabinet.x || foot.x + foot.width > cabinet.x + cabinet.width) return false;
  if (foot.y < cabinet.y + cabinet.height || foot.y > cabinet.y + cabinet.height + 80) return false;
  const playerCenter = { x: x + player.width / 2, y: y + player.height / 2 };
  if (Math.hypot(playerCenter.x - vialCenter.x, playerCenter.y - vialCenter.y) > vial.interactionDistance) return false;
  const nearest = church.interactionZones.filter(zone => {
    const point = center(zone);
    return Math.hypot(playerCenter.x - point.x, playerCenter.y - point.y) <= zone.interactionDistance;
  }).sort((a, b) => {
    const ac = center(a);
    const bc = center(b);
    return Math.hypot(playerCenter.x - ac.x, playerCenter.y - ac.y) - Math.hypot(playerCenter.x - bc.x, playerCenter.y - bc.y);
  })[0];
  return nearest && nearest.id === vial.id;
});
assert(frontStand, "玩家无法从出生点走到暗柜正面并以 E 调查 G-17");

const art = fs.readFileSync(path.join(__dirname, "../images/maps/old_church.png"));
const artWidth = art.readUInt32BE(16);
const artHeight = art.readUInt32BE(20);
assert.equal(artWidth * church.referenceHeight, artHeight * church.referenceWidth, "正式地图比例必须匹配参考坐标");
const scale = artWidth / church.referenceWidth;
const scaledBlocks = church.collisions.map(block => ({ x: block.x * scale, y: block.y * scale, width: block.width * scale, height: block.height * scale }));
const scaledZones = church.interactionZones.map(zone => ({ ...zone, x: zone.x * scale, y: zone.y * scale,
  width: zone.width * scale, height: zone.height * scale }));
const scaledQueue = [[church.spawn.x * scale, church.spawn.y * scale]];
const scaledSeen = new Set(["0,0"]);
for (let head = 0; head < scaledQueue.length; head++) {
  const [x, y] = scaledQueue[head];
  for (const [dx, dy] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
    const nx = x + dx;
    const ny = y + dy;
    const key = `${Math.round((nx - scaledQueue[0][0]) / step)},${Math.round((ny - scaledQueue[0][1]) / step)}`;
    if (scaledSeen.has(key) || !canOccupy(nx, ny, scaledBlocks, artWidth, artHeight)) continue;
    scaledSeen.add(key);
    scaledQueue.push([nx, ny]);
  }
}
for (const zone of scaledZones) {
  const point = center(zone);
  assert(scaledQueue.some(([x, y]) => Math.hypot(x + player.width / 2 - point.x, y + player.height / 2 - point.y) <= zone.interactionDistance),
    `正式地图中无法从出生点走到 ${zone.id}`);
}

const hiddenMark = church.interactionZones.find(zone => zone.id === "church_hidden_sun");
assert(hiddenMark.x <= 100 && hiddenMark.x + hiddenMark.width >= 80, "隐藏刻痕应位于西侧墙的内缘");
assert(!church.decorations.some(item => /church-sun|sun-visual/.test(item.id + " " + item.type)), "普通地图不应绘制隐藏标记");

const story = fs.readFileSync(path.join(__dirname, "../js/story.js"), "utf8");
const churchStory = story.slice(story.indexOf("chapter2_church_enter:"), story.indexOf("chapter2_blackmarket_closed:"));
assert(churchStory.length > 0, "缺少旧教堂剧情段落");
assert(!/Titan|巨人|脊髓液/i.test(churchStory), "旧教堂对话提前揭露药剂真相");
for (const zone of church.interactionZones.filter(zone => zone.type === "inspect")) {
  assert(churchStory.includes(`${zone.targetScene}:`), `${zone.id} 缺少对话场景`);
}
assert(churchStory.includes('flags: ["slumVialFound", "clue_g17", "churchG17Found"]'), "G-17 未接入第二章现有证据链");
assert(churchStory.includes("重新刷过一层") && churchStory.includes("又是这个太阳"), "隐藏交互需要说明被覆盖的标记与莱纳的辨认");
assert(churchStory.includes('conditions: { allFlags: ["clue_dawnbreakers"] }, next: "chapter2_church_sun_known_01"'),
  "隐蔽太阳标记应在组织名称解锁后才提示名称");
assert(churchStory.includes('itemImage: C.g17Damaged'), "G-17 调查必须展示磨损版药瓶");
assert(churchStory.includes('itemImage: C.dawnbreakersNote'), "升日标记只应在调查后的特写中出现");
assert(churchStory.includes('flags: ["churchDragMarksFound"]') && churchStory.includes('flags: ["churchSedativesFound"]'),
  "旧教堂缺少主线调查旗标");
assert(church.interactionZones.find(zone => zone.id === "church_exit").dialogByFlag.some(rule => rule.allFlags.includes("churchG17Found")),
  "出口应按三条核心线索判断调查是否完成");

const storyContext = { window: {} };
vm.runInNewContext(story, storyContext);
const scenes = storyContext.window.TitanStory.scenes;
for (const zone of church.interactionZones) {
  assert(scenes[zone.targetScene], `${zone.id} 缺少初始场景`);
  for (const rule of zone.dialogByFlag || []) assert(scenes[rule.scene], `${zone.id} 缺少条件场景 ${rule.scene}`);
}
for (const [id, scene] of Object.entries(scenes).filter(([id]) => id.startsWith("chapter2_church_") || id.startsWith("chapter2_clue_vial"))) {
  if (scene.next) assert(scenes[scene.next], `${id} 的下一场景不存在：${scene.next}`);
  for (const route of scene.routes || []) assert(scenes[route.next], `${id} 的条件场景不存在：${route.next}`);
  if (scene.itemImage) assert(fs.existsSync(path.join(__dirname, "..", scene.itemImage)), `${id} 的特写图片不存在`);
  assert(!/Titan|巨人|脊髓液|第七码头/.test(scene.text), `${id} 提前揭露后续章节线索`);
}
const exitZone = church.interactionZones.find(zone => zone.id === "church_exit");
const exitScene = flags => (exitZone.dialogByFlag.find(rule => rule.allFlags.every(flag => flags[flag])) || { scene: exitZone.targetScene }).scene;
assert.equal(exitScene({}), "chapter2_church_exit_need_clues");
assert.equal(exitScene({ churchDragMarksFound: true, churchSedativesFound: true, churchG17Found: true }), "chapter2_church_exit_01");
assert.equal(exitScene({ churchDragMarksFound: true, churchSedativesFound: true, churchG17Found: true,
  churchInvestigationComplete: true, churchExitSummarySeen: true }), "chapter2_church_exit_repeat");
assert.equal(scenes.chapter2_church_exit_goal.targetMap, "undergroundStreet");
assert.equal(scenes.chapter2_church_exit_goal.restoreMapPosition, true);

const saveContext = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../js/save.js"), "utf8"), saveContext);
const initial = saveContext.window.TitanSave.createInitialGameState();
const normalized = saveContext.window.TitanSave.normalizeGameState({ flags: {
  ...initial.flags, churchDragMarksFound: true, churchSedativesFound: true, churchG17Found: true
} });
assert.equal(normalized.flags.churchInvestigationComplete, true, "三条核心线索应在存档中恢复完成状态");

console.log(`旧教堂：${church.collisions.length} 个碰撞框、${church.interactionZones.length} 个可达交互点、0 组交互范围重叠；正式地图 ${artWidth}×${artHeight} 全部可达，暗柜正面可站立于 (${frontStand.join(", ")})。`);
