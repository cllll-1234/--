/* 第二章地下街坐标配置；坐标基准为 1619 x 971 原图。 */
(function () {
  "use strict";

  /* 采用地图 Debug 编辑器手动校准后的碰撞范围。 */
  const undergroundStreetCollisions = Object.freeze([
    { id: "north-boundary", x: 0, y: 0, width: 1619, height: 24, label: "北侧边界" },
    { id: "west-boundary", x: 0, y: 0, width: 58, height: 971, label: "西侧边界" },
    { id: "east-boundary", x: 1561, y: 0, width: 58, height: 971, label: "东侧边界" },
    { id: "south-west-boundary", x: 0, y: 727, width: 665, height: 244, label: "南侧蓄水区与城墙" },
    { id: "south-east-boundary", x: 934, y: 761, width: 562, height: 186, label: "南侧蓄水区与城墙" },
    { id: "entrance-right-wall", x: 877, y: 658, width: 54, height: 227, label: "入口右墙" },
    { id: "north-west-buildings", x: 60, y: 26, width: 273, height: 119, label: "左上居民建筑" },
    { id: "west-upper-houses", x: 59, y: 256, width: 220, height: 92, label: "西侧居民建筑" },
    { id: "west-middle-houses", x: 435, y: 277, width: 159, height: 64, label: "西侧棚屋群" },
    { id: "west-lower-houses", x: 172, y: 352, width: 171, height: 55, label: "西侧下层住宅" },
    { id: "old-church", x: 570, y: 24, width: 282, height: 137, label: "旧教堂主体" },
    { id: "old-church-stairs-west", x: 605, y: 202, width: 71, height: 31, label: "旧教堂台阶" },
    { id: "old-church-stairs-east", x: 764, y: 202, width: 67, height: 32, label: "旧教堂台阶" },
    { id: "warehouse", x: 1033, y: 26, width: 274, height: 183, label: "废弃仓库主体" },
    { id: "warehouse-west-stock", x: 908, y: 237, width: 57, height: 42, label: "仓库西侧货堆" },
    { id: "warehouse-east-stock", x: 1220, y: 174, width: 65, height: 52, label: "仓库东侧货堆" },
    { id: "announcement-board", x: 955, y: 348, width: 41, height: 43, label: "公告墙" },
    { id: "tavern-block-west", x: 62, y: 479, width: 220, height: 180, label: "左下酒馆与住宅" },
    { id: "tavern-block-door-top", x: 282, y: 481, width: 94, height: 155, label: "酒馆主体" },
    { id: "tavern-block-east", x: 473, y: 435, width: 119, height: 96, label: "左下酒馆与住宅" },
    { id: "tavern-east-stalls", x: 588, y: 521, width: 78, height: 77, label: "酒馆东侧摊位" },
    { id: "south-west-railing-left", x: 0, y: 615, width: 212, height: 112, label: "西南侧围栏" },
    { id: "south-east-houses", x: 1064, y: 493, width: 296, height: 205, label: "右下居民建筑" },
    { id: "south-east-railing", x: 934, y: 684, width: 24, height: 73, label: "东南侧围栏" },
    { id: "black-market-north-stalls", x: 1288, y: 281, width: 97, height: 65, label: "黑市北侧摊位" },
    { id: "black-market-east-stalls", x: 1460, y: 327, width: 114, height: 138, label: "黑市东侧摊位" },
    { id: "black-market-west-stalls-north", x: 1178, y: 345, width: 139, height: 36, label: "黑市西侧摊位" },
    { id: "black-market-west-stalls-south", x: 1207, y: 384, width: 62, height: 49, label: "黑市西侧摊位" },
    { id: "custom-mtydbeb2", label: "自定义障碍", x: 648, y: 786, width: 48, height: 182 },
    { id: "custom-mtydbqra", label: "自定义障碍", x: 840, y: 787, width: 87, height: 181 },
    { id: "custom-mtydfxys", label: "自定义障碍", x: 383, y: 449, width: 86, height: 154 },
    { id: "custom-mtydgfz1", label: "自定义障碍", x: 597, y: 473, width: 32, height: 46 },
    { id: "custom-mtydgmna", label: "自定义障碍", x: 632, y: 499, width: 25, height: 21 },
    { id: "custom-mtydi0at", label: "自定义障碍", x: 62, y: 430, width: 65, height: 43 },
    { id: "custom-mtydk8ms", label: "自定义障碍", x: 62, y: 148, width: 96, height: 103 },
    { id: "custom-mtydkgtw", label: "自定义障碍", x: 242, y: 104, width: 115, height: 90 },
    { id: "custom-mtydklf0", label: "自定义障碍", x: 295, y: 144, width: 98, height: 102 },
    { id: "custom-mtydkpqc", label: "自定义障碍", x: 350, y: 184, width: 88, height: 109 },
    { id: "custom-mtydku5w", label: "自定义障碍", x: 393, y: 221, width: 108, height: 100 },
    { id: "custom-mtydlvng", label: "自定义障碍", x: 432, y: 28, width: 82, height: 63 },
    { id: "custom-mtydm4zo", label: "自定义障碍", x: 516, y: 28, width: 51, height: 117 },
    { id: "custom-mtydmw9g", label: "自定义障碍", x: 582, y: 184, width: 44, height: 22 },
    { id: "custom-mtydn184", label: "自定义障碍", x: 565, y: 164, width: 31, height: 21 },
    { id: "custom-mtydngzn", label: "自定义障碍", x: 546, y: 146, width: 23, height: 19 },
    { id: "custom-mtydpctn", label: "自定义障碍", x: 982, y: 370, width: 51, height: 35 },
    { id: "custom-mtydqx0z", label: "自定义障碍", x: 573, y: 654, width: 86, height: 71 },
    { id: "custom-mtydsqwa", label: "自定义障碍", x: 356, y: 568, width: 131, height: 87 },
    { id: "custom-mtydv37m", label: "自定义障碍", x: 1207, y: 700, width: 290, height: 59 },
    { id: "custom-mtydvbz6", label: "自定义障碍", x: 956, y: 493, width: 103, height: 126 },
    { id: "custom-mtydvk3m", label: "自定义障碍", x: 1027, y: 601, width: 45, height: 92 },
    { id: "custom-mtydvydt", label: "自定义障碍", x: 891, y: 529, width: 62, height: 44 },
    { id: "custom-mtye09kg", label: "自定义障碍", x: 1271, y: 386, width: 28, height: 32 },
    { id: "custom-mtye0r0r", label: "自定义障碍", x: 1179, y: 387, width: 23, height: 24 },
    { id: "custom-mtye1dhk", label: "自定义障碍", x: 1314, y: 332, width: 36, height: 46 },
    { id: "custom-mtye281k", label: "自定义障碍", x: 1363, y: 629, width: 195, height: 67 },
    { id: "custom-mtye2l49", label: "自定义障碍", x: 1363, y: 581, width: 100, height: 44 },
    { id: "custom-mtye2we8", label: "自定义障碍", x: 1362, y: 549, width: 87, height: 29 },
    { id: "custom-mtye35m0", label: "自定义障碍", x: 1361, y: 508, width: 50, height: 38 },
    { id: "custom-mtye3emg", label: "自定义障碍", x: 1500, y: 463, width: 65, height: 43 },
    { id: "custom-mtye3jxs", label: "自定义障碍", x: 1527, y: 502, width: 37, height: 28 },
    { id: "custom-mtye3ohk", label: "自定义障碍", x: 1471, y: 461, width: 42, height: 29 },
    { id: "custom-mtye3v6g", label: "自定义障碍", x: 1406, y: 383, width: 50, height: 33 },
    { id: "custom-mtye40yg", label: "自定义障碍", x: 1425, y: 413, width: 33, height: 25 },
    { id: "custom-mtye5f4v", label: "自定义障碍", x: 854, y: 28, width: 149, height: 72 },
    { id: "custom-mtye5no0", label: "自定义障碍", x: 819, y: 180, width: 32, height: 39 },
    { id: "custom-mtye5vf4", label: "自定义障碍", x: 836, y: 95, width: 52, height: 76 },
    { id: "custom-mtye62nj", label: "自定义障碍", x: 849, y: 167, width: 25, height: 26 },
    { id: "custom-mtye6gk7", label: "自定义障碍", x: 888, y: 107, width: 29, height: 45 },
    { id: "custom-mtye704g", label: "自定义障碍", x: 931, y: 209, width: 29, height: 21 },
    { id: "custom-mtye74dr", label: "自定义障碍", x: 950, y: 185, width: 24, height: 23 },
    { id: "custom-mtye791e", label: "自定义障碍", x: 973, y: 168, width: 24, height: 22 },
    { id: "custom-mtye7ejb", label: "自定义障碍", x: 1000, y: 141, width: 29, height: 63 },
    { id: "custom-mtye87js", label: "自定义障碍", x: 954, y: 277, width: 72, height: 26 },
    { id: "custom-mtye8db3", label: "自定义障碍", x: 1025, y: 295, width: 66, height: 29 },
    { id: "custom-mtye8ys7", label: "自定义障碍", x: 1065, y: 315, width: 45, height: 22 },
    { id: "custom-mtyecm60", label: "自定义障碍", x: 1214, y: 324, width: 97, height: 21 },
    { id: "custom-mtyectji", label: "自定义障碍", x: 1231, y: 300, width: 58, height: 19 },
    { id: "custom-mtyedkni", label: "自定义障碍", x: 1322, y: 261, width: 91, height: 43 },
    { id: "custom-mtyedtmp", label: "自定义障碍", x: 1363, y: 240, width: 38, height: 18 },
    { id: "custom-mtyee566", label: "自定义障碍", x: 1395, y: 220, width: 29, height: 21 },
    { id: "custom-mtyeeaoe", label: "自定义障碍", x: 1420, y: 191, width: 36, height: 32 },
    { id: "custom-mtyeegmd", label: "自定义障碍", x: 1310, y: 130, width: 49, height: 63 },
    { id: "custom-mtyefmrq", label: "自定义障碍", x: 1311, y: 28, width: 245, height: 69 },
    { id: "custom-mtyefv0w", label: "自定义障碍", x: 1425, y: 98, width: 131, height: 71 },
    { id: "custom-mtyeg1n1", label: "自定义障碍", x: 1459, y: 147, width: 99, height: 110 },
    { id: "custom-mtyeg7z1", label: "自定义障碍", x: 1504, y: 252, width: 71, height: 71 },
    { id: "custom-mtyeta3f", label: "自定义障碍", x: 550, y: 518, width: 65, height: 43 },
    { id: "custom-mtyetutf", label: "自定义障碍", x: 438, y: 392, width: 96, height: 53 },
    { id: "custom-mtyeu00r", label: "自定义障碍", x: 307, y: 462, width: 92, height: 42 },
    { id: "custom-mtyevlle", label: "自定义障碍", x: 744, y: 365, width: 39, height: 38 },
    { id: "custom-mtyew4cy", label: "自定义障碍", x: 1097, y: 689, width: 65, height: 43 }
  ]);

  const interactionZones = Object.freeze([
    { id: "announcementBoard", type: "inspect", action: "startDialog", targetScene: "chapter2_clue_list", name: "公告墙", x: 963, y: 376, width: 51, height: 36, interactionDistance: 89, prompt: "[E] 调查公告墙", disabledAfterFlag: "slumNoticeRead" },
    { id: "karlFamily", type: "talk", action: "startDialog", targetScene: "chapter2_oldwoman_01", name: "卡尔的家属", x: 384, y: 348, width: 29, height: 29, interactionDistance: 90, prompt: "[E] 与卡尔的家属交谈", dialogByFlag: [{ allFlags: ["clue_dawnbreakers"], scene: "chapter2_oldwoman_repeat" }] },
    { id: "blackMarketMerchant", type: "talk", action: "startDialog", targetScene: "chapter2_blackmarket_closed", name: "黑市商人", x: 1348, y: 408, width: 29, height: 38, interactionDistance: 93, prompt: "[E] 与黑市商人交谈", dialogByFlag: [{ allFlags: ["slumNightCarriage"], notFlags: ["slumWarehouseHint"], scene: "chapter2_blackmarket_hint" }] },
    { id: "tavernEntrance", type: "building", action: "enterBuilding", targetScene: "tavern", name: "酒馆", x: 283, y: 637, width: 76, height: 50, interactionDistance: 90, prompt: "[E] 进入" },
    { id: "oldChurchEntrance", type: "building", action: "enterBuilding", targetScene: "oldChurch", name: "旧教堂", x: 681, y: 134, width: 70, height: 66, interactionDistance: 79, prompt: "[E] 进入" },
    { id: "warehouseEntrance", type: "building", action: "enterBuilding", targetMap: "warehouse", targetScene: "warehouse", name: "废弃仓库", x: 1129, y: 170, width: 79, height: 52, interactionDistance: 116, prompt: "[E] 进入" },
    { id: "undergroundExit", type: "exit", action: "startDialog", targetScene: "chapter2_exit_check", name: "返回上层", x: 693, y: 871, width: 150, height: 100, interactionDistance: 138.9646808082954, interactionPriority: 40, prompt: "[E] 返回调查兵团总部" }
  ]);

  const npcs = Object.freeze([
    { id: "slum-resident", name: "地下街居民", shortName: "民", x: 510, y: 370, width: 13, height: 16, spriteAsset: "images/explore/npc/civilian_a.png", interactionDistance: 84, dialog: "chapter2_resident" },
    { id: "karl-family-npc", name: "卡尔的家属", shortName: "妇", x: 393, y: 356, width: 13, height: 16, spriteAsset: "images/explore/npc/karl_mother.png", interactionDisabled: true },
    { id: "black-market-merchant-npc", name: "黑市商人", shortName: "商", x: 1353, y: 420, width: 24, height: 30, spriteAsset: "images/explore/npc/sannes.png", interactionDisabled: true },
    { id: "slum-bystander", name: "地下街青年", shortName: "青", x: 1040, y: 470, width: 13, height: 16, spriteAsset: "images/explore/npc/civilian_a.png", interactionDistance: 82, dialog: "chapter2_resident" }
  ]);

  const undergroundStreet = Object.freeze({
    referenceWidth: 1619,
    referenceHeight: 971,
    /* 临时图运行时至少放大到约正式版宽度；换成 3000px 正式图后倍率自动回到 1。 */
    minimumWorldWidth: 3000,
    spawn: Object.freeze({ x: 787, y: 744 }),
    collisions: undergroundStreetCollisions,
    interactionZones: interactionZones,
    npcs: npcs
  });

  window.undergroundStreet = undergroundStreet;
  window.undergroundStreetCollisions = undergroundStreetCollisions;
  window.TitanUndergroundStreet = undergroundStreet;
}());
