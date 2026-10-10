/* 第二章废弃仓库：室内碰撞、调查点与固定背景 NPC 的透明交互区。 */
(function () {
  "use strict";

  const collisions = Object.freeze([
    { id: "warehouse-north-wall", x: 0, y: 0, width: 1672, height: 55, label: "北墙" },
    { id: "warehouse-west-wall", x: 0, y: 0, width: 65, height: 941, label: "西墙" },
    { id: "warehouse-east-wall", x: 1605, y: 0, width: 67, height: 941, label: "东墙" },
    { id: "warehouse-south-west", x: 0, y: 780, width: 710, height: 161, label: "南墙西段" },
    { id: "warehouse-south-east", x: 980, y: 780, width: 692, height: 161, label: "南墙东段" },
    { id: "warehouse-exit-limit", x: 710, y: 912, width: 270, height: 29, label: "入口边界" },
    { id: "warehouse-north-west-stock", x: 406, y: 65, width: 243, height: 188, label: "北侧木箱与货架" },
    { id: "warehouse-north-map-wall", x: 655, y: 55, width: 560, height: 190, label: "北墙地图区" },
    { id: "warehouse-north-east-stock", x: 1235, y: 52, width: 390, height: 205, label: "北侧货架与木桶" },
    { id: "warehouse-west-shelves", x: 8, y: 536, width: 132, height: 161, label: "左侧货架" },
    { id: "warehouse-left-crates", x: 210, y: 310, width: 106, height: 179, label: "左侧木箱堆" },
    { id: "warehouse-left-lower-stock", x: 73, y: 700, width: 286, height: 75, label: "左下货物与木桶" },
    { id: "warehouse-rope-pile", x: 269, y: 304, width: 127, height: 258, label: "麻绳堆" },
    { id: "warehouse-center-table", x: 680, y: 390, width: 325, height: 165, label: "中央桌子" },
    { id: "warehouse-center-chair", x: 745, y: 550, width: 70, height: 65, label: "桌前木椅" },
    { id: "warehouse-east-upper-crates", x: 1000, y: 175, width: 239, height: 81, label: "右上箱子与绳索" },
    { id: "warehouse-porter-stock", x: 1308, y: 337, width: 215, height: 97, label: "老搬运工与货物" },
    { id: "warehouse-east-shelves", x: 1417, y: 255, width: 185, height: 204, label: "右侧货架" },
    { id: "warehouse-south-east-stock", x: 1300, y: 535, width: 305, height: 245, label: "右下木箱堆" },
    { id: "warehouse-south-barrel", x: 1130, y: 687, width: 95, height: 81, label: "南侧大木桶" },
    { id: "warehouse-south-crates", x: 1249, y: 679, width: 95, height: 105, label: "南侧散落木箱" },
    { id: "custom-mtztbjmg", x: 367, y: 714, width: 284, height: 59, label: "自定义障碍" },
    { id: "custom-mtztbus8", x: 145, y: 610, width: 98, height: 85, label: "自定义障碍" },
    { id: "custom-mtztd0tf", x: 70, y: 61, width: 66, height: 310, label: "自定义障碍" },
    { id: "custom-mtztd9ig", x: 140, y: 63, width: 256, height: 159, label: "自定义障碍" },
    { id: "custom-mtzthu13", x: 401, y: 323, width: 60, height: 222, label: "自定义障碍" }
  ]);

  const interactionZones = Object.freeze([
    { id: "warehouse_normal_crate", type: "inspect", action: "startDialog", name: "普通木箱", x: 1257, y: 653, width: 53, height: 57,
      interactionDistance: 105, prompt: "[E] 调查普通木箱", targetScene: "warehouse_normal_crate_01", disabledAfterFlag: "warehouse_normal_crate_checked" },
    { id: "warehouse_church_crate", type: "inspect", action: "startDialog", name: "带红色印记的木箱", x: 362, y: 311, width: 74, height: 76,
      interactionDistance: 105, prompt: "[E] 调查木箱上的印记", targetScene: "warehouse_church_crate_01", disabledAfterFlag: "clue_church_warehouse" },
    { id: "warehouse_g17_crate", type: "inspect", action: "startDialog", name: "损坏的药箱", x: 276, y: 497, width: 65, height: 60,
      interactionDistance: 85, prompt: "[E] 调查药箱", targetScene: "warehouse_g17_crate_01", disabledAfterFlag: "clue_g17_warehouse", dialogByFlag: [
        { allFlags: ["clue_g17"], scene: "warehouse_g17_linked_01" }
      ] },
    { id: "warehouse_rope", type: "inspect", action: "startDialog", name: "磨损的麻绳", x: 481, y: 585, width: 57, height: 45,
      interactionDistance: 75, prompt: "[E] 调查麻绳", targetScene: "warehouse_rope_01", dialogByFlag: [
        { allFlags: ["clue_people_in_carriage"], scene: "warehouse_rope_people_01" }
      ] },
    { id: "warehouse_table", type: "inspect", action: "startDialog", name: "中央桌子", x: 671, y: 380, width: 344, height: 187,
      interactionDistance: 112, prompt: "[E] 调查中央桌子", targetScene: "warehouse_table_01", dialogByFlag: [
        { allFlags: ["warehouse_manifest_unlocked"], scene: "warehouse_table_repeat" },
        { allFlags: ["warehouse_table_checked"], scene: "warehouse_table_02" }
      ] },
    { id: "warehouse_manifest", type: "inspect", action: "startDialog", name: "运输记录", x: 820, y: 430, width: 90, height: 70,
      interactionDistance: 125, interactionPriority: 120, prompt: "[E] 阅读运输记录", targetScene: "warehouse_manifest_01",
      visibleWhenFlag: "warehouse_manifest_unlocked", disabledAfterFlag: "clue_seventh_dock" },
    { id: "warehouse_map", type: "inspect", action: "startDialog", name: "玛利亚地区旧地图", x: 720, y: 75, width: 260, height: 145,
      interactionDistance: 135, prompt: "[E] 查看旧运输地图", targetScene: "warehouse_map_plain", dialogByFlag: [
        { allFlags: ["clue_seventh_dock"], notFlags: ["clue_seventh_dock_code"], scene: "warehouse_map_deduction_01" },
        { allFlags: ["clue_seventh_dock_code"], scene: "warehouse_map_repeat" }
      ] },
    { id: "warehouse_dawn_mark", type: "inspect", action: "startDialog", name: "几乎磨掉的太阳图案", x: 1080, y: 60, width: 160, height: 105,
      interactionDistance: 180, prompt: "[E] 调查", targetScene: "warehouse_dawn_mark_01", hiddenInteraction: true,
      disabledAfterFlag: "hidden_warehouse_dawn", dialogByFlag: [
        { allFlags: ["clue_dawnbreakers"], scene: "warehouse_dawn_known_01" }
      ] },
    { id: "warehouse_old_porter", type: "talk", action: "startDialog", name: "老搬运工", x: 1328, y: 317, width: 115, height: 135,
      interactionDistance: 125, interactionPriority: 80, prompt: "[E] 与老搬运工交谈", targetScene: "warehouse_porter_first_01", dialogByFlag: [
        { allFlags: ["clue_seventh_dock", "talked_old_porter"], scene: "warehouse_porter_dock_01" },
        { allFlags: ["clue_missing_people", "porter_night_transport"], notFlags: ["clue_people_in_carriage"], scene: "warehouse_porter_secret_choice" },
        { allFlags: ["warehouse_tracks_checked", "talked_old_porter"], notFlags: ["porter_night_transport"], scene: "warehouse_porter_tracks_01" },
        { allFlags: ["porter_night_transport"], scene: "warehouse_porter_night_repeat" },
        { allFlags: ["talked_old_porter"], scene: "warehouse_porter_no_tracks_01" }
      ] },
    { id: "warehouse_tracks", type: "inspect", action: "startDialog", name: "入口附近的新车辙", x: 755, y: 760, width: 170, height: 75,
      interactionDistance: 95, prompt: "[E] 调查地面车辙", targetScene: "warehouse_tracks_01", hiddenInteraction: true,
      disabledAfterFlag: "warehouse_tracks_checked" },
    { id: "warehouse_exit", type: "exit", name: "仓库出口", x: 720, y: 815, width: 255, height: 105,
      interactionDistance: 100, interactionPriority: 60, prompt: "[E] 离开仓库", targetMap: "undergroundStreet",
      restoreMapPosition: true, mapTransition: true }
  ]);

  window.TitanWarehouse = Object.freeze({
    referenceWidth: 1672,
    referenceHeight: 941,
    spawn: Object.freeze({ x: 814, y: 810 }),
    collisions: collisions,
    interactionZones: interactionZones,
    npcs: Object.freeze([])
  });
}());
