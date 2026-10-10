/* 第五章真相路线地下中央设施：正式地图补齐前使用的功能地图。 */
(function () {
  "use strict";

  const collisions = Object.freeze([
    { id: "facility-north", x: 0, y: 0, width: 1000, height: 36, label: "北侧墙体" },
    { id: "facility-west", x: 0, y: 0, width: 36, height: 680, label: "西侧墙体" },
    { id: "facility-east", x: 964, y: 0, width: 36, height: 680, label: "东侧墙体" },
    { id: "facility-south-west", x: 0, y: 644, width: 66, height: 36, label: "南侧墙体" },
    { id: "facility-south-east", x: 176, y: 644, width: 824, height: 36, label: "南侧墙体" },
    { id: "facility-g17-stock", x: 92, y: 88, width: 270, height: 126, label: "G-17库存" },
    { id: "facility-record-desk", x: 650, y: 94, width: 240, height: 112, label: "净化名单档案桌" },
    { id: "facility-control-device", x: 350, y: 334, width: 300, height: 154, label: "始祖控制装置" },
    { id: "facility-west-pipes", x: 58, y: 280, width: 76, height: 202, label: "西侧管线" },
    { id: "facility-east-pipes", x: 866, y: 274, width: 76, height: 210, label: "东侧管线" }
  ]);

  const interactionZones = Object.freeze([
    { id: "central_facility_g17_stock", type: "inspect", action: "startDialog", name: "G-17库存",
      x: 92, y: 88, width: 270, height: 126, interactionDistance: 118, prompt: "[E] 调查G-17库存",
      targetScene: "chapter5_truth_g17_01", disabledAfterFlag: "chapter5_g17_stock_destroyed" },
    { id: "central_facility_purification_list", type: "inspect", action: "startDialog", name: "净化名单",
      x: 650, y: 94, width: 240, height: 112, interactionDistance: 116, prompt: "[E] 调查净化名单",
      targetScene: "chapter5_truth_list_01", disabledAfterFlag: "chapter5_purification_list_found" },
    { id: "central_facility_founder_device", type: "inspect", action: "startDialog", name: "始祖控制装置",
      x: 350, y: 334, width: 300, height: 154, interactionDistance: 124, interactionPriority: 70,
      prompt: "[E] 调查始祖控制装置", requiredFlag: "chapter5_facility_evidence_complete",
      lockedMessage: "先检查这里的G-17库存和人员名单。", targetScene: "chapter5_truth_device_01" }
  ]);

  const decorations = Object.freeze([
    { id: "facility-room-label", type: "station-room", name: "地下中央设施", symbol: "地下中央设施", x: 406, y: 52, width: 190, height: 58 },
    { id: "facility-g17-visual", type: "station-clue", name: "G-17库存", symbol: "G-17库存", x: 92, y: 88, width: 270, height: 126 },
    { id: "facility-list-visual", type: "station-clue", name: "净化名单", symbol: "净化名单", x: 650, y: 94, width: 240, height: 112 },
    { id: "facility-device-visual", type: "station-clue", name: "始祖控制装置", symbol: "始祖控制装置", x: 350, y: 334, width: 300, height: 154 }
  ]);

  window.TitanCentralFacility = Object.freeze({
    referenceWidth: 1000,
    referenceHeight: 680,
    backgroundAsset: "",
    expectedBackgroundAsset: "images/maps/central-facility.png",
    spawn: Object.freeze({ x: 92, y: 560 }),
    collisions: collisions,
    interactionZones: interactionZones,
    decorations: decorations,
    npcs: Object.freeze([])
  });
}());
