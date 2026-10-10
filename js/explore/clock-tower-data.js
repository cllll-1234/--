/* 第四章钟楼地下净化室：坐标对应 1672×941 正式地图。 */
(function () {
  "use strict";

  const collisions = Object.freeze([
    { id: "clock-underground-north", x: 180, y: 0, width: 1340, height: 104, label: "北墙" },
    { id: "clock-underground-west", x: 0, y: 0, width: 184, height: 941, label: "西墙" },
    { id: "clock-underground-east", x: 1518, y: 0, width: 154, height: 941, label: "东墙" },
    { id: "clock-underground-south", x: 184, y: 851, width: 1334, height: 90, label: "南墙" },
    { id: "clock-underground-bed", x: 348, y: 140, width: 320, height: 176, label: "木床" },
    { id: "clock-underground-vial-table", x: 969, y: 164, width: 278, height: 147, label: "药瓶台" },
    { id: "clock-underground-west-cabinet", x: 190, y: 372, width: 113, height: 309, label: "西侧柜体" },
    { id: "clock-underground-east-cabinet", x: 1358, y: 59, width: 65, height: 147, label: "东侧柜体" },
    { id: "clock-underground-east-stock", x: 1381, y: 543, width: 79, height: 99, label: "东侧杂物" },
    { id: "clock-underground-chute", x: 949, y: 545, width: 307, height: 237, label: "投放口" },
    { id: "clock-underground-chute-control", x: 1264, y: 659, width: 66, height: 129, label: "投放口控制台" },
    { id: "custom-mu7zzka1", label: "自定义障碍", x: 736, y: 98, width: 148, height: 52 },
    { id: "custom-mu800or6", label: "自定义障碍", x: 1456, y: 111, width: 57, height: 417 },
    { id: "custom-mu80294t", label: "自定义障碍", x: 1434, y: 765, width: 77, height: 83 },
    { id: "custom-mu80354h", label: "自定义障碍", x: 1415, y: 648, width: 52, height: 115 }
  ]);

  const interactionZones = Object.freeze([
    { id: "clock_tower_bed", type: "inspect", action: "startDialog", name: "带束缚带的木床", x: 387, y: 166, width: 229, height: 119,
      interactionDistance: 149, prompt: "[E] 调查木床", targetScene: "chapter4_bed_01", disabledAfterFlag: "chapter4_bed_checked" },
    { id: "clock_tower_g17_vial", type: "inspect", action: "startDialog", name: "G-17药瓶", x: 1020, y: 175, width: 180, height: 87,
      interactionDistance: 126, prompt: "[E] 调查G-17药瓶", targetScene: "chapter4_g17_01", disabledAfterFlag: "chapter4_g17_truth_found" },
    { id: "clock_tower_chute", type: "inspect", action: "startDialog", name: "投放口", x: 1268, y: 661, width: 59, height: 99,
      interactionDistance: 104, prompt: "[E] 调查投放口", targetScene: "chapter4_chute_01", disabledAfterFlag: "chapter4_karl_truth_found" },
    { id: "clock_tower_stairs", type: "exit", name: "返回钟楼", x: 272, y: 745, width: 69, height: 90,
      interactionDistance: 104, interactionPriority: 70, prompt: "[E] 返回钟楼", targetScene: "chapter4_dawnbreakers_01",
      requiredFlags: ["chapter4_bed_checked", "chapter4_g17_truth_found", "chapter4_karl_truth_found"],
      flags: ["chapter4_purification_room_complete"], lockedMessage: "这里还有没有查清的东西。" }
  ]);

  const decorations = Object.freeze([
    { id: "clock-room-label", type: "station-room", name: "净化室", symbol: "净", x: 747, y: 120, width: 118, height: 54 },
    { id: "clock-bed-visual", type: "station-clue", name: "木床与束缚带", symbol: "床", x: 348, y: 140, width: 320, height: 176 },
    { id: "clock-vial-visual", type: "station-clue", name: "G-17药瓶", symbol: "G-17", x: 969, y: 164, width: 278, height: 147 },
    { id: "clock-chute-visual", type: "station-clue", name: "投放口", symbol: "口", x: 949, y: 545, width: 307, height: 237 },
    { id: "clock-stairs-visual", type: "exit", name: "返回钟楼", symbol: "↙", x: 229, y: 730, width: 172, height: 116 }
  ]);

  window.TitanClockTower = Object.freeze({
    referenceWidth: 1672,
    referenceHeight: 941,
    backgroundAsset: "images/maps/地下净化室.png",
    expectedBackgroundAsset: "images/maps/地下净化室.png",
    spawn: Object.freeze({ x: 442, y: 757 }),
    collisions: collisions,
    interactionZones: interactionZones,
    decorations: decorations,
    npcs: Object.freeze([])
  });
}());
