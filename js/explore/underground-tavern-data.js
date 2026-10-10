/* 第二章地下街酒馆：背景内 NPC 的透明交互区与室内碰撞。 */
(function () {
  "use strict";

  const collisions = Object.freeze([
    { id: "tavern-north-wall", x: 0, y: 0, width: 1619, height: 145, label: "北墙" },
    { id: "tavern-west-wall", x: 0, y: 145, width: 97, height: 697, label: "西墙与酒桶" },
    { id: "tavern-east-wall", x: 1445, y: 145, width: 174, height: 695, label: "东墙与储物架" },
    { id: "tavern-south-wall-west", x: 0, y: 840, width: 650, height: 131, label: "南墙" },
    { id: "tavern-south-wall-east", x: 951, y: 840, width: 668, height: 131, label: "南墙" },
    { id: "tavern-door-pillar-west", x: 650, y: 775, width: 70, height: 196, label: "入口左墙" },
    { id: "tavern-door-pillar-east", x: 900, y: 775, width: 51, height: 196, label: "入口右墙" },
    { id: "tavern-door-limit", x: 720, y: 950, width: 180, height: 21, label: "入口边界" },
    { id: "tavern-north-west-furniture", x: 284, y: 93, width: 117, height: 103, label: "酒架与木桶" },
    { id: "tavern-counter", x: 510, y: 174, width: 575, height: 121, label: "吧台" },
    { id: "tavern-north-east-furniture", x: 1170, y: 125, width: 189, height: 89, label: "壁炉与柴架" },
    { id: "tavern-table-guest-a", x: 257, y: 351, width: 166, height: 132, label: "左侧酒桌" },
    { id: "tavern-table-guest-b", x: 1193, y: 356, width: 184, height: 128, label: "右侧酒桌" },
    { id: "tavern-west-barrels", x: 68, y: 407, width: 96, height: 425, label: "西侧酒桶" },
    { id: "tavern-table-south-west", x: 262, y: 620, width: 181, height: 156, label: "左下酒桌" },
    { id: "tavern-table-south-east", x: 1172, y: 620, width: 190, height: 156, label: "右下酒桌" },
    { id: "tavern-east-storage", x: 1524, y: 281, width: 39, height: 480, label: "东侧储物区" },
    { id: "custom-mtz9n0dz", x: 117, y: 137, width: 134, height: 109, label: "自定义障碍" },
    { id: "custom-mtz9pasn", x: 513, y: 134, width: 36, height: 81, label: "自定义障碍" },
    { id: "custom-mtz9tmja", x: 1033, y: 105, width: 45, height: 95, label: "自定义障碍" }
  ]);

  const interactionZones = Object.freeze([
    { id: "tavernOwner", type: "talk", action: "startDialog", name: "酒馆老板",
      x: 690, y: 145, width: 225, height: 105, interactionDistance: 175, interactionPriority: 100, requireFacing: true,
      prompt: "[E] 交谈", targetScene: "tavern_owner_first_01", dialogByFlag: [
        { allFlags: ["slumNightCarriage"], scene: "tavern_owner_after_01" },
        { allFlags: ["clue_missing_people", "talkedTavernOwner"], notFlags: ["slumNightCarriage"], scene: "tavern_owner_notice_01" },
        { allFlags: ["talkedTavernOwner"], notFlags: ["clue_missing_people"], scene: "tavern_owner_refuse_repeat" }
      ] },
    { id: "tavernGuestA", type: "talk", action: "startDialog", name: "左侧顾客",
      x: 275, y: 292, width: 135, height: 95, interactionDistance: 135, requireFacing: true,
      prompt: "[E] 交谈", targetScene: "tavern_guest_a_01", dialogByFlag: [
        { allFlags: ["heardWheelRumor"], scene: "tavern_guest_a_repeat_01" }
      ] },
    { id: "tavernGuestB", type: "talk", action: "startDialog", name: "右侧顾客",
      x: 1262, y: 340, width: 120, height: 110, interactionDistance: 135, requireFacing: true,
      prompt: "[E] 交谈", targetScene: "tavern_guest_b_01", dialogByFlag: [
        { allFlags: ["heardDisappearanceRumor"], scene: "tavern_guest_b_repeat" },
        { allFlags: ["slumNoticeRead"], notFlags: ["heardDisappearanceRumor"], scene: "tavern_guest_b_notice_01" }
      ] },
    { id: "tavernLedger", type: "inspect", action: "startDialog", name: "靠墙的旧账本",
      x: 1435, y: 414, width: 125, height: 85, interactionDistance: 180, requireFacing: true,
      prompt: "[E] 调查", targetScene: "tavern_ledger_01", dialogByFlag: [
        { allFlags: ["slumTavernCluesLinked"], scene: "tavern_ledger_repeat_linked" },
        { allFlags: ["slumTavernLedgerRead", "slumNightCarriage"], scene: "tavern_clue_link" },
        { allFlags: ["slumTavernLedgerRead"], scene: "tavern_ledger_repeat" }
      ] },
    { id: "tavernFireplace", type: "inspect", action: "startDialog", name: "壁炉",
      x: 1130, y: 145, width: 155, height: 100, interactionDistance: 165, requireFacing: true,
      prompt: "[E] 调查", targetScene: "tavern_fireplace" },
    { id: "tavernBarrel", type: "inspect", action: "startDialog", name: "左侧酒桶",
      x: 111, y: 141, width: 145, height: 125, interactionDistance: 155, requireFacing: true,
      prompt: "[E] 调查", targetScene: "tavern_barrel", dialogByFlag: [
        { allFlags: ["tavernBarrelChecked"], scene: "tavern_barrel_repeat" }
      ] },
    { id: "tavernCounter", type: "inspect", action: "startDialog", name: "吧台",
      x: 544, y: 186, width: 140, height: 70, interactionDistance: 105, requireFacing: true,
      prompt: "[E] 调查", targetScene: "tavern_counter", dialogByFlag: [
        { allFlags: ["slumNoticeRead"], scene: "tavern_counter_after_notice" }
      ] },
    { id: "tavernExit", type: "exit", name: "酒馆出口",
      x: 720, y: 815, width: 180, height: 135, interactionDistance: 105, interactionPriority: 60,
      requireFacing: true, prompt: "[E] 返回地下街", targetMap: "undergroundStreet",
      restoreMapPosition: true, mapTransition: true }
  ]);

  window.TitanUndergroundTavern = Object.freeze({
    referenceWidth: 1619,
    referenceHeight: 971,
    spawn: Object.freeze({ x: 788, y: 790 }),
    collisions: collisions,
    interactionZones: interactionZones
  });
}());
