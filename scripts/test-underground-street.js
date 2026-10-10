const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const context = { window: {} };
context.window.window = context.window;
vm.runInNewContext(
  fs.readFileSync(path.join(root, "js/explore/underground-street-data.js"), "utf8"),
  context,
  { filename: "underground-street-data.js" }
);
vm.runInNewContext(
  fs.readFileSync(path.join(root, "js/explore/player-controller.js"), "utf8"),
  context,
  { filename: "player-controller.js" }
);

const config = context.window.TitanUndergroundStreet;
const png = fs.readFileSync(path.join(root, "images/maps/underground-street.png"));
const naturalWidth = png.readUInt32BE(16);
const naturalHeight = png.readUInt32BE(20);

assert.strictEqual(naturalWidth, config.referenceWidth, "地下街原图宽度与坐标基准不一致");
assert.strictEqual(naturalHeight, config.referenceHeight, "地下街原图高度与坐标基准不一致");
assert.strictEqual(config.minimumWorldWidth, 3000, "地下街当前运行宽度应至少放大到 3000px");

const footRect = context.window.getPlayerFootRect;
const overlaps = context.window.TitanAabbOverlaps;
const canStand = position => {
  const foot = footRect(position);
  return foot.x >= 0 && foot.y >= 0 && foot.x + foot.width <= config.referenceWidth && foot.y + foot.height <= config.referenceHeight &&
    !config.collisions.some(collider => overlaps(foot, collider));
};

assert.ok(canStand(config.spawn), "地下街出生点被碰撞区域覆盖");
config.collisions.forEach(collider => {
  assert.ok(collider.x >= 0 && collider.y >= 0, `碰撞区域超出地图：${collider.id}`);
  assert.ok(collider.x + collider.width <= config.referenceWidth && collider.y + collider.height <= config.referenceHeight, `碰撞区域超出地图：${collider.id}`);
});

function canReachZone(zone) {
  const step = 8;
  const queue = [config.spawn];
  const seen = new Set(["0,0"]);
  for (let index = 0; index < queue.length && index < 80000; index += 1) {
    const current = queue[index];
    const playerCenter = { x: current.x + 22, y: current.y + 28 };
    const zoneCenter = { x: zone.x + zone.width / 2, y: zone.y + zone.height / 2 };
    if (Math.hypot(playerCenter.x - zoneCenter.x, playerCenter.y - zoneCenter.y) <= zone.interactionDistance) return true;
    [[step, 0], [-step, 0], [0, step], [0, -step]].forEach(([dx, dy]) => {
      const gridX = Math.round((current.x + dx - config.spawn.x) / step);
      const gridY = Math.round((current.y + dy - config.spawn.y) / step);
      const key = `${gridX},${gridY}`;
      const next = { x: config.spawn.x + gridX * step, y: config.spawn.y + gridY * step };
      if (!seen.has(key) && canStand(next)) {
        seen.add(key);
        queue.push(next);
      }
    });
  }
  return false;
}

config.interactionZones.forEach(zone => {
  const id = zone.id;
  assert.ok(canReachZone(zone), `从出生点无法到达交互区域：${id}`);
});

console.log(`地下街检查通过：${naturalWidth}x${naturalHeight}，${config.collisions.length} 个碰撞框，${config.interactionZones.length} 个交互区。`);
