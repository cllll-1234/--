/* 第五章中央城区：所有坐标均直接对应 1672×941 正式中央广场地图。 */
(function () {
  "use strict";

  const collisions = Object.freeze([
    { id: "central-west-boundary", x: 0, y: 0, width: 48, height: 941, label: "西侧城墙" },
    { id: "central-east-boundary", x: 1624, y: 0, width: 48, height: 941, label: "东侧城墙" },
    { id: "central-north-west", x: 0, y: 0, width: 615, height: 38, label: "北侧城墙" },
    { id: "central-north-east", x: 1058, y: 0, width: 614, height: 38, label: "北侧城墙" },
    { id: "central-south-west", x: 0, y: 802, width: 732, height: 139, label: "南侧城墙" },
    { id: "central-south-east", x: 944, y: 802, width: 728, height: 139, label: "南侧城墙" },
    { id: "central-building-nw", x: 62, y: 54, width: 478, height: 320, label: "西北建筑群" },
    { id: "central-building-ne", x: 1138, y: 54, width: 482, height: 320, label: "东北建筑群" },
    { id: "central-building-sw", x: 62, y: 510, width: 480, height: 292, label: "西南建筑群" },
    { id: "central-building-se", x: 1138, y: 510, width: 482, height: 292, label: "东南建筑群" },
    { id: "central-broadcast-tower", x: 615, y: 0, width: 443, height: 164, label: "广播塔主体" },
    { id: "central-west-barricade-a", x: 268, y: 374, width: 118, height: 96, label: "西侧路障" },
    { id: "central-west-barricade-b", x: 442, y: 370, width: 150, height: 92, label: "西侧路障" },
    { id: "central-east-barricade-a", x: 1080, y: 370, width: 145, height: 96, label: "东侧路障" },
    { id: "central-east-barricade-b", x: 1280, y: 370, width: 120, height: 94, label: "东侧路障" }
  ]);

  const interactionZones = Object.freeze([
    { id: "central_broadcast_tower", type: "inspect", action: "startDialog", name: "中央城区广播塔入口",
      x: 748, y: 166, width: 176, height: 76, interactionDistance: 112, interactionPriority: 80,
      prompt: "[E] 进入广播塔", requiredFlag: "chapter5_guardian_defeated",
      lockedMessage: "守门者挡住了通往广播塔的道路。", targetScene: "chapter5_broadcast_tower_01" }
  ]);

  const triggerZones = Object.freeze([
    { id: "central_guardian_trigger", x: 616, y: 314, width: 440, height: 330,
      onceFlag: "chapter5_guardian_encountered", scene: "chapter5_guardian_intro_01",
      objective: "击败阻挡广播塔道路的异常巨人", visible: false, debugCategory: "minigame" }
  ]);

  const npcs = Object.freeze([
    { id: "central-resident-a", name: "逃离的居民", shortName: "民", x: 560, y: 512, width: 44, height: 56,
      spriteAsset: "images/explore/npc/civilian_a.png", interactionDistance: 82, dialog: "chapter5_central_resident_01" },
    { id: "central-resident-b", name: "惊慌的居民", shortName: "民", x: 1068, y: 520, width: 44, height: 56,
      spriteAsset: "images/explore/npc/civilian_b.png", interactionDistance: 82, dialog: "chapter5_central_resident_02" }
  ]);

  const decorations = Object.freeze([
    { id: "central-guardian-visual", type: "guardian-boss", name: "十五米级守门者", symbol: "BOSS 图片预留",
      x: 716, y: 180, width: 240, height: 360,
      asset: "images/explore/objects/sprite.png",
      hiddenAfterFlag: "chapter5_guardian_defeated" }
  ]);

  window.TitanCentralDistrict = Object.freeze({
    referenceWidth: 1672,
    referenceHeight: 941,
    /* 与第二章地下街保持相同的大地图尺度，玩家尺寸不随 world 放大。 */
    minimumWorldWidth: 3000,
    backgroundAsset: "images/maps/chapter5_central_square.png",
    expectedBackgroundAsset: "images/maps/chapter5_central_square.png",
    spawn: Object.freeze({ x: 814, y: 850 }),
    collisions: collisions,
    interactionZones: interactionZones,
    triggerZones: triggerZones,
    npcs: npcs,
    decorations: decorations
  });
}());
