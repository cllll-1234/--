/* 新版旧城区几何：全部数据以 1672×941 原图坐标标注，再统一按 1.5 倍换算。 */
(function () {
  "use strict";

  const OLD_TOWN_SCALE = 1.5;
  const SOURCE_WIDTH = 1672;
  const SOURCE_HEIGHT = 941;

  function scaled(value) { return Math.round(value * OLD_TOWN_SCALE); }
  function rect(x, y, width, height, extra) {
    return Object.freeze(Object.assign({
      x: scaled(x), y: scaled(y), width: scaled(width), height: scaled(height)
    }, extra || {}));
  }
  function point(x, y) { return Object.freeze({ x: scaled(x), y: scaled(y) }); }
  function distance(value) { return scaled(value); }
  function worldRect(x, y, width, height, extra) {
    return Object.freeze(Object.assign({ x: x, y: y, width: width, height: height }, extra || {}));
  }

  /* 手工贴合新版地图中的墙体、建筑主体与大型废墟，刻意保留宽阔主路。 */
  const collisions = Object.freeze([
    rect(0, 0, 1672, 50, { label: "北侧城墙" }),
    rect(0, 0, 45, 941, { label: "西侧城墙" }),
    rect(1625, 0, 47, 941, { label: "东侧城墙" }),
    rect(0, 920, 1672, 21, { label: "南侧地图边界" }),
    worldRect(1, 1128, 1116, 178, { label: "南侧城墙（西段）" }),
    worldRect(1275, 1128, 1138, 178, { label: "南侧城墙（东段）" }),

    worldRect(245, 86, 252, 121, { label: "西北废墟堆" }),
    worldRect(165, 225, 336, 174, { label: "烧毁马车" }),
    worldRect(75, 641, 84, 125, { label: "西北残墙" }),
    worldRect(608, 81, 503, 321, { label: "北侧钟楼废墟" }),
    rect(800, 50, 280, 230, { label: "太阳标志残墙" }),
    rect(1080, 50, 100, 205, { label: "空地西侧树木废墟" }),
    rect(1510, 50, 115, 260, { label: "空地东北碎石" }),

    worldRect(243, 598, 249, 239, { label: "西侧住宅废墟" }),
    worldRect(613, 484, 456, 266, { label: "儿童涂鸦残墙" }),
    rect(1030, 325, 185, 220, { label: "中东侧住宅" }),
    rect(1230, 330, 265, 220, { label: "东侧住宅群" }),
    rect(1510, 300, 115, 235, { label: "东侧塔楼" }),

    worldRect(199, 920, 296, 152, { label: "西南住宅废墟" }),
    worldRect(608, 831, 159, 231, { label: "南部住宅废墟" }),
    worldRect(1126, 763, 115, 147, { label: "中央喷泉" }),
    rect(900, 585, 130, 150, { label: "南部坍塌房屋" }),
    rect(1035, 550, 220, 185, { label: "南部残墙" }),
    rect(1260, 560, 275, 175, { label: "东南住宅废墟" }),
    rect(1530, 540, 95, 195, { label: "东南塔楼" }),
    worldRect(768, 971, 63, 87, { id: "custom-mtwzgxey", label: "自定义障碍" }),
    worldRect(199, 863, 103, 53, { id: "custom-mtwzipcx", label: "自定义障碍" })
  ]);

  window.TitanOldTownGeometry = Object.freeze({
    DEBUG_OLDTOWN: false,
    scale: OLD_TOWN_SCALE,
    sourceWidth: SOURCE_WIDTH,
    sourceHeight: SOURCE_HEIGHT,
    width: scaled(SOURCE_WIDTH),
    height: scaled(SOURCE_HEIGHT),
    rect: rect,
    worldRect: worldRect,
    point: point,
    distance: distance,
    collisions: collisions
  });
}());
