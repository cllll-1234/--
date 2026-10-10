/* Explore Mode 地图配置。素材路径先保留，当前总部使用 CSS 占位绘制。 */
(function () {
  "use strict";

  const goldPlayerRoot = "images/explore/player/reiner-gold/";
  const playerAssets = Object.freeze({
    walkDown: Object.freeze([goldPlayerRoot + "reiner_walk_down_1.png", goldPlayerRoot + "reiner_walk_down_2.png"]),
    walkUp: Object.freeze([goldPlayerRoot + "reiner_walk_up_1.png", goldPlayerRoot + "reiner_walk_up_2.png"]),
    walkLeft: Object.freeze([goldPlayerRoot + "reiner_walk_left_1.png", goldPlayerRoot + "reiner_walk_left_2.png"]),
    walkRight: Object.freeze([goldPlayerRoot + "reiner_walk_right_1.png", goldPlayerRoot + "reiner_walk_right_2.png"]),
    idleDown: goldPlayerRoot + "reiner_idle_down.png",
    idleUp: goldPlayerRoot + "reiner_idle_up.png",
    idleLeft: goldPlayerRoot + "reiner_idle_left.png",
    idleRight: goldPlayerRoot + "reiner_idle_right.png"
  });
  const oldTown = window.TitanOldTownGeometry;
  const undergroundStreet = window.TitanUndergroundStreet;
  const undergroundTavern = window.TitanUndergroundTavern;
  const oldChurch = window.TitanOldChurch;
  const warehouse = window.TitanWarehouse;
  const maintenanceStation = window.TitanMaintenanceStation;
  const clockTower = window.TitanClockTower;
  const centralDistrict = window.TitanCentralDistrict;
  const centralFacility = window.TitanCentralFacility;
  const undergroundStreetMap = Object.freeze({
    id: "undergroundStreet",
    name: "地下街",
    chapter: "第二章 · 消失的人",
    width: undergroundStreet.referenceWidth,
    height: undergroundStreet.referenceHeight,
    referenceWidth: undergroundStreet.referenceWidth,
    referenceHeight: undergroundStreet.referenceHeight,
    minimumWorldWidth: undergroundStreet.minimumWorldWidth,
    useNaturalSize: true,
    cameraMode: "follow",
    cameraScale: 1,
    cameraScaleMode: "native",
    backgroundAsset: "images/maps/underground-street.png",
    playerAssets: playerAssets,
    spawn: undergroundStreet.spawn,
    playerStart: undergroundStreet.spawn,
    entryScene: "chapter2_slum_enter",
    buildings: Object.freeze({ tavern: "undergroundTavern", oldChurch: "oldChurch", warehouse: "warehouse" }),
    collisions: undergroundStreet.collisions,
    interactionZones: undergroundStreet.interactionZones,
    npcs: undergroundStreet.npcs,
    decorations: Object.freeze([]),
    interactables: Object.freeze([])
  });
  const undergroundTavernMap = Object.freeze({
    id: "undergroundTavern",
    name: "地下街 · 老酒馆",
    chapter: "第二章 · 消失的人",
    width: undergroundTavern.referenceWidth,
    height: undergroundTavern.referenceHeight,
    referenceWidth: undergroundTavern.referenceWidth,
    referenceHeight: undergroundTavern.referenceHeight,
    useNaturalSize: true,
    backgroundAsset: "images/maps/underground-tavern.png",
    playerAssets: playerAssets,
    spawn: undergroundTavern.spawn,
    playerStart: undergroundTavern.spawn,
    entryScene: "chapter2_tavern_enter",
    collisions: undergroundTavern.collisions,
    interactionZones: undergroundTavern.interactionZones,
    npcs: Object.freeze([]),
    decorations: Object.freeze([]),
    interactables: Object.freeze([])
  });
  const oldChurchMap = Object.freeze({
    id: "oldChurch",
    name: "地下街 · 旧教堂",
    chapter: "第二章 · 消失的人",
    width: oldChurch.referenceWidth,
    height: oldChurch.referenceHeight,
    referenceWidth: oldChurch.referenceWidth,
    referenceHeight: oldChurch.referenceHeight,
    useNaturalSize: true,
    cameraMode: "follow",
    cameraScale: 1,
    cameraScaleMode: "native",
    backgroundAsset: "images/maps/old_church.png",
    playerAssets: playerAssets,
    spawn: oldChurch.spawn,
    playerStart: oldChurch.spawn,
    entryScene: "chapter2_church_enter",
    entryDialog: "chapter2_church_intro_01",
    entryDialogFlag: "churchIntroSeen",
    collisions: oldChurch.collisions,
    interactionZones: oldChurch.interactionZones,
    npcs: Object.freeze([]),
    decorations: oldChurch.decorations,
    interactables: Object.freeze([])
  });
  const warehouseMap = Object.freeze({
    id: "warehouse",
    name: "废弃仓库",
    chapter: "第二章 · 消失的人",
    width: warehouse.referenceWidth,
    height: warehouse.referenceHeight,
    referenceWidth: warehouse.referenceWidth,
    referenceHeight: warehouse.referenceHeight,
    useNaturalSize: true,
    cameraMode: "follow",
    cameraScale: 1,
    cameraScaleMode: "native",
    backgroundAsset: "images/maps/warehouse_interior.png",
    playerAssets: playerAssets,
    spawn: warehouse.spawn,
    playerStart: warehouse.spawn,
    entryDialog: "warehouse_enter_title",
    entryDialogFlag: "visited_warehouse",
    collisions: warehouse.collisions,
    interactionZones: warehouse.interactionZones,
    npcs: warehouse.npcs,
    decorations: Object.freeze([]),
    interactables: Object.freeze([])
  });
  const maintenanceStationMap = Object.freeze({
    id: "seventhMaintenanceStation",
    name: "第七维护站",
    chapter: "第三章 · 墙后的档案",
    width: maintenanceStation.referenceWidth,
    height: maintenanceStation.referenceHeight,
    referenceWidth: maintenanceStation.referenceWidth,
    referenceHeight: maintenanceStation.referenceHeight,
    useNaturalSize: true,
    cameraMode: "follow",
    cameraScale: 1,
    cameraScaleMode: "native",
    backgroundAsset: maintenanceStation.backgroundAsset,
    playerAssets: playerAssets,
    spawn: maintenanceStation.spawn,
    playerStart: maintenanceStation.spawn,
    entryScene: "chapter3_station_enter",
    collisions: maintenanceStation.collisions,
    interactionZones: maintenanceStation.interactionZones,
    npcs: maintenanceStation.npcs,
    decorations: maintenanceStation.decorations,
    stateFlags: maintenanceStation.stateFlags,
    interactables: Object.freeze([])
  });
  const clockTowerMap = Object.freeze({
    id: "clockTowerUnderground",
    name: "旧城区钟楼 · 地下净化室",
    chapter: "第四章 · 破墙之日",
    width: clockTower.referenceWidth,
    height: clockTower.referenceHeight,
    referenceWidth: clockTower.referenceWidth,
    referenceHeight: clockTower.referenceHeight,
    useNaturalSize: Boolean(clockTower.backgroundAsset),
    cameraMode: clockTower.backgroundAsset ? "follow" : "fit",
    cameraScale: 1,
    cameraScaleMode: "native",
    backgroundAsset: clockTower.backgroundAsset,
    pendingBackgroundAsset: clockTower.expectedBackgroundAsset,
    playerAssets: playerAssets,
    spawn: clockTower.spawn,
    playerStart: clockTower.spawn,
    entryScene: "chapter4_purification_room_enter",
    collisions: clockTower.collisions,
    interactionZones: clockTower.interactionZones,
    npcs: clockTower.npcs,
    decorations: clockTower.decorations,
    interactables: Object.freeze([])
  });
  const centralDistrictMap = Object.freeze({
    id: "centralDistrict",
    name: "中央城区",
    chapter: "第五章 · 黎明之前",
    width: centralDistrict.referenceWidth,
    height: centralDistrict.referenceHeight,
    referenceWidth: centralDistrict.referenceWidth,
    referenceHeight: centralDistrict.referenceHeight,
    minimumWorldWidth: centralDistrict.minimumWorldWidth,
    useNaturalSize: Boolean(centralDistrict.backgroundAsset),
    cameraMode: centralDistrict.backgroundAsset ? "follow" : "fit",
    cameraScale: 1,
    cameraScaleMode: "native",
    backgroundAsset: centralDistrict.backgroundAsset,
    pendingBackgroundAsset: centralDistrict.expectedBackgroundAsset,
    playerAssets: playerAssets,
    spawn: centralDistrict.spawn,
    playerStart: centralDistrict.spawn,
    entryScene: "chapter5_central_district_enter",
    collisions: centralDistrict.collisions,
    interactionZones: centralDistrict.interactionZones,
    triggerZones: centralDistrict.triggerZones,
    npcs: centralDistrict.npcs,
    decorations: centralDistrict.decorations,
    interactables: Object.freeze([])
  });
  const centralFacilityMap = Object.freeze({
    id: "centralFacility",
    name: "地下中央设施",
    chapter: "第五章 · 黎明之前",
    width: centralFacility.referenceWidth,
    height: centralFacility.referenceHeight,
    referenceWidth: centralFacility.referenceWidth,
    referenceHeight: centralFacility.referenceHeight,
    useNaturalSize: Boolean(centralFacility.backgroundAsset),
    cameraMode: centralFacility.backgroundAsset ? "follow" : "fit",
    cameraScale: 1,
    cameraScaleMode: "native",
    backgroundAsset: centralFacility.backgroundAsset,
    pendingBackgroundAsset: centralFacility.expectedBackgroundAsset,
    playerAssets: playerAssets,
    spawn: centralFacility.spawn,
    playerStart: centralFacility.spawn,
    entryScene: "chapter5_central_facility_enter",
    collisions: centralFacility.collisions,
    interactionZones: centralFacility.interactionZones,
    npcs: centralFacility.npcs,
    decorations: centralFacility.decorations,
    interactables: Object.freeze([])
  });

  window.TitanExploreMaps = Object.freeze({
    hq: Object.freeze({
      id: "hq",
      name: "调查兵团总部",
      chapter: "序章 · 调查兵团总部",
      width: 1672,
      height: 941,
      backgroundAsset: "images/maps/hq.webp",
      collisionReferenceAsset: "images/maps/hq_collision_reference.png",
      playerAssets: playerAssets,
      playerStart: Object.freeze({ x: 335, y: 579 }),
      playerStartByFlag: Object.freeze([
        Object.freeze({ flag: "chapter5_started", x: 1508, y: 620 }),
        Object.freeze({ flag: "returnedToHqForMission", x: 1508, y: 620 })
      ]),
      collisions: window.TitanHqCollisions || Object.freeze([]),
      npcs: Object.freeze([
        { id: "hange", name: "韩吉", shortName: "韩", x: 1164, y: 420, width: 46, height: 58,
          spriteAsset: "images/explore/npc/hange.png", interactionDistance: 92,
          dialog: "hq_hange_intro_01", dialogByFlag: [
            { allFlags: ["chapter5_started"], notFlags: ["chapter5_hq_briefing_complete"], scene: "chapter5_common_01" },
            { allFlags: ["chapter4_returned_to_hq", "chapter4_845_truth_recovered"], notFlags: ["chapter4_complete"], scene: "chapter4_hq_report_01" },
            { allFlags: ["chapter3_returned_to_hq", "chapter3_sealed_room_checked"], notFlags: ["chapter3_complete"], scene: "chapter3_return_hq_01" },
            { allFlags: ["chapter2ReturnedToHq"], notFlags: ["chapter2Reported"], scene: "chapter2_04" },
            { allFlags: ["returnedToHqForMission"], notFlags: ["hqMissionBriefingComplete"], scene: "hq_mission_briefing_01" }
          ], dialogAfterFlag: { flag: "hqIntroComplete", scene: "hq_hange_after_01" } },
        { id: "levi", name: "利威尔", shortName: "利", x: 1324, y: 257, width: 46, height: 58,
          spriteAsset: "images/explore/npc/levi.png", interactionDistance: 88, dialog: "hq_levi_01" },
        { id: "soldier", name: "驻地士兵", shortName: "兵", x: 267, y: 434, width: 46, height: 58,
          spriteAsset: "images/explore/npc/soldier.png", interactionDistance: 84, dialog: "hq_soldier_01",
          positionAfterFlag: { flag: "returnedToHqForMission", x: 1092, y: 430 } },
        { id: "medic", name: "医疗兵", shortName: "医", x: 1207, y: 572, width: 46, height: 58,
          spriteAsset: "images/explore/npc/medic.png", interactionDistance: 88, dialog: "hq_medic_01" },
        { id: "chapter5-royal-guard", name: "王政监视兵", shortName: "宪", x: 1518, y: 454, width: 46, height: 58,
          spriteAsset: "images/explore/npc/soldier.png", interactionDistance: 82,
          visibleWhenFlag: "chapter5_started", dialog: "chapter5_hq_royal_guard" },
        { id: "chapter5-equipment-soldier", name: "搬运装备的士兵", shortName: "兵", x: 1030, y: 560, width: 46, height: 58,
          spriteAsset: "images/explore/npc/soldier.png", interactionDistance: 82,
          visibleWhenFlag: "chapter5_started", dialog: "chapter5_hq_equipment_soldier" }
      ]),
      interactables: Object.freeze([
        { id: "noticeboard", type: "evidence", name: "公告栏", x: 270, y: 120, width: 120, height: 80,
          asset: "images/explore/objects/hq-noticeboard.png", interactionDistance: 92,
          prompt: "[E] 调查公告栏", evidenceId: "hq_old_district_activity", evidenceName: "旧城区巨人活动报告",
          flag: "hqNoticeRead", message: "获得线索：旧城区巨人活动报告" },
        { id: "east-exit", type: "exit", name: "总部出口", x: 1471, y: 572, width: 117, height: 150,
          asset: "images/explore/objects/hq-exit.png", interactionDistance: 120, interactionPriority: 50,
          prompt: "[E] 离开总部", requiredFlag: "hqIntroComplete", disabledAfterFlag: "returnedToHqForMission",
          lockedMessage: "先和韩吉确认本次行动。", targetMap: "street_sermon", objective: "与街道上的居民交谈" }
      ])
    }),

    street_sermon: Object.freeze({
      id: "street_sermon",
      name: "街道布道",
      chapter: "序章 · 街道布道",
      width: 1672,
      height: 941,
      backgroundAsset: "images/maps/street_sermon.webp",
      collisionReferenceAsset: "images/maps/street_sermon_collision_reference.png",
      playerAssets: playerAssets,
      playerStart: Object.freeze({ x: 224, y: 754 }),
      entryScene: "street_01_enter",
      collisions: window.TitanStreetSermonCollisions || Object.freeze([]),
      npcs: Object.freeze([
        { id: "street-priest", name: "巨壁教祭司", shortName: "祭", x: 813, y: 198, width: 46, height: 58,
          spriteAsset: "images/explore/npc/priest.png", interactionDistance: 92, dialog: "street_06_trigger",
          disabledAfterFlag: "sermonTriggered" },
        { id: "civilian-a", name: "祈祷的民众", shortName: "民", x: 657, y: 323, width: 44, height: 56,
          spriteAsset: "images/explore/npc/civilian_a.png", interactionDistance: 82, dialog: "street_02_civilian_a" },
        { id: "civilian-b", name: "祈祷的民众", shortName: "民", x: 776, y: 330, width: 44, height: 56,
          spriteAsset: "images/explore/npc/civilian_b.png", interactionDistance: 82, dialog: "street_03_civilian_b" },
        { id: "oldwoman", name: "老妇人", shortName: "妇", x: 858, y: 331, width: 44, height: 56,
          spriteAsset: "images/explore/npc/oldwoman.png", interactionDistance: 84, dialog: "street_04_oldwoman" },
        { id: "passerby", name: "旁观路人", shortName: "路", x: 970, y: 315, width: 44, height: 56,
          spriteAsset: "images/explore/npc/passerby.png", interactionDistance: 82, dialog: "street_23_passerby" }
      ]),
      triggerZones: Object.freeze([
        { id: "sermonTriggerZone", x: 598, y: 289, width: 476, height: 98,
          onceFlag: "sermonTriggered", scene: "street_06_trigger", visible: true }
      ]),
      interactables: Object.freeze([
        { id: "church-notice", type: "inspect", name: "布道宣传纸", x: 430, y: 145, width: 150, height: 126,
          interactionDistance: 86, prompt: "[E] 阅读布道宣传纸", dialog: "street_05_notice" },
        { id: "street-dawn-symbol", type: "inspect", name: "被涂黑的太阳图案", x: 1112, y: 392, width: 74, height: 70,
          interactionDistance: 90, prompt: "[E] 查看墙角图案", dialog: "street_dawn_symbol", disabledAfterFlag: "streetDawnSymbolRead" },
        { id: "street-return", type: "exit", name: "返回调查兵团总部", x: 154, y: 684, width: 144, height: 142,
          interactionDistance: 118, interactionPriority: 60, prompt: "[E] 返回调查兵团总部",
          visibleWhenFlag: "streetReturnPrompted", requiredFlag: "streetReturnPrompted",
          flags: ["returnedToHqForMission"], targetMap: "hq", objective: "去找韩吉了解新任务" }
      ])
    }),

    chapter1_ruins: Object.freeze({
      id: "chapter1_ruins",
      name: "玛利亚之墙旧城区",
      chapter: "第一章 · 尸体上的十字架",
      width: oldTown.width,
      height: oldTown.height,
      sourceWidth: oldTown.sourceWidth,
      sourceHeight: oldTown.sourceHeight,
      worldScale: oldTown.scale,
      cameraMode: "follow",
      cameraScale: 1,
      backgroundAsset: "images/maps/oldtown.png",
      playerAssets: playerAssets,
      playerStart: oldTown.point(800, 680),
      playerStartByFlag: Object.freeze([
        Object.freeze({ flag: "chapter1_minigame_finished", x: oldTown.point(1160, 265).x, y: oldTown.point(1160, 265).y })
      ]),
      entryScene: "chapter1_ruins_enter",
      collisions: oldTown.collisions,
      npcs: Object.freeze([
        { id: "chapter1-hange", name: "韩吉", shortName: "韩", x: oldTown.point(805, 620).x, y: oldTown.point(805, 620).y,
          width: 46, height: 58, spriteAsset: "images/explore/npc/hange.png", interactionDistance: oldTown.distance(72), dialog: "chapter1_ruins_hange_idle",
          positionByFlags: Object.freeze([
            Object.freeze({ flag: "chapter1_minigame_finished", x: oldTown.point(1260, 275).x, y: oldTown.point(1260, 275).y }),
            Object.freeze({ flag: "chapter1FieldApproached", x: oldTown.point(1135, 275).x, y: oldTown.point(1135, 275).y }),
            Object.freeze({ flag: "chapter1CentralReached", x: oldTown.point(865, 545).x, y: oldTown.point(865, 545).y })
          ]) },
        { id: "chapter1-soldier", name: "普通士兵", shortName: "兵", x: oldTown.point(855, 680).x, y: oldTown.point(855, 680).y,
          width: 46, height: 58, spriteAsset: "images/explore/npc/soldier.png", interactionDistance: oldTown.distance(68), dialog: "chapter1_ruins_soldier_idle",
          positionByFlags: Object.freeze([
            Object.freeze({ flag: "chapter1_minigame_finished", x: oldTown.point(1110, 270).x, y: oldTown.point(1110, 270).y }),
            Object.freeze({ flag: "chapter1FieldApproached", x: oldTown.point(1060, 260).x, y: oldTown.point(1060, 260).y }),
            Object.freeze({ flag: "chapter1CentralReached", x: oldTown.point(700, 485).x, y: oldTown.point(700, 485).y })
          ]) }
      ]),
      decorations: Object.freeze([
        Object.freeze(Object.assign({ id: "fallen-titan-visual", type: "titan", name: "倒下的巨人", symbol: "巨人残骸",
          asset: "images/objects/巨人尸体.png",
          visibleWhenFlag: "chapter1_minigame_finished", debugCategory: "corpse" }, oldTown.rect(1290, 120, 245, 150)))
      ]),
      triggerZones: Object.freeze([
        Object.freeze(Object.assign({ id: "chapter1CentralStage", onceFlag: "chapter1CentralReached", flagOnly: true, debugCategory: "stage" }, oldTown.worldRect(1042, 854, 285, 158))),
        Object.freeze(Object.assign({ id: "chapter1FieldApproach", onceFlag: "chapter1FieldApproached", flagOnly: true, debugCategory: "stage" }, oldTown.rect(1010, 245, 170, 100))),
        Object.freeze(Object.assign({ id: "chapter1TitanTrigger", onceFlag: "chapter1_minigame_started", scene: "chapter1_titan_roar", visible: false, debugCategory: "minigame" }, oldTown.rect(1180, 75, 355, 205)))
      ]),
      interactables: Object.freeze([
        Object.freeze(Object.assign({ id: "burned-wagon", type: "inspect", name: "烧毁的马车", symbol: "车", interactionDistance: oldTown.distance(105),
          prompt: "[E] 调查烧毁马车", dialog: "chapter1_ruins_wagon_01", disabledAfterFlag: "chapter1WagonChecked", debugCategory: "inspect" }, oldTown.rect(105, 145, 215, 110))),
        Object.freeze(Object.assign({ id: "children-graffiti", type: "inspect", name: "儿童涂鸦", symbol: "画", interactionDistance: oldTown.distance(105),
          prompt: "[E] 调查儿童涂鸦", dialog: "chapter1_ruins_graffiti_01", disabledAfterFlag: "clue_sea_memory", debugCategory: "inspect" }, oldTown.rect(430, 425, 185, 85))),
        Object.freeze(Object.assign({ id: "ruins-dawn-symbol", type: "inspect", name: "升起的太阳图案", symbol: "☀", interactionDistance: oldTown.distance(105),
          prompt: "[E] 调查太阳图案", dialog: "chapter1_ruins_dawn_01", disabledAfterFlag: "clue_dawn_symbol", debugCategory: "inspect" }, oldTown.rect(925, 165, 95, 85))),
        Object.freeze(Object.assign({ id: "ruins-footprints", type: "inspect", name: "巨人脚印", symbol: "足", interactionDistance: oldTown.distance(92),
          prompt: "[E] 调查巨人脚印", dialog: "chapter1_ruins_footprints_01", disabledAfterFlag: "clue_titan_footprints", debugCategory: "inspect" }, oldTown.rect(850, 390, 160, 155))),
        Object.freeze(Object.assign({ id: "fallen-titan", type: "inspect", name: "倒下的巨人", symbol: "查", interactionDistance: oldTown.distance(125),
          prompt: "[E] 调查巨人尸体", dialog: "chapter1_body_investigation", visibleWhenFlag: "chapter1_minigame_finished", disabledAfterFlag: "clue_cross_obtained", debugCategory: "corpse" }, oldTown.rect(1305, 135, 220, 130)))
      ])
    }),

    undergroundStreet: undergroundStreetMap,
    undergroundTavern: undergroundTavernMap,
    oldChurch: oldChurchMap,
    warehouse: warehouseMap,
    seventhMaintenanceStation: maintenanceStationMap,
    clockTowerUnderground: clockTowerMap,
    centralDistrict: centralDistrictMap,
    centralFacility: centralFacilityMap,
    /* 兼容 v3.1 旧存档和旧调试链接。 */
    chapter2_slum: undergroundStreetMap
  });
}());
