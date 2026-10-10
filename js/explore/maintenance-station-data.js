/* 第三章第七维护站：正式地图几何、交互点与剧情状态映射。 */
(function () {
  "use strict";

  const collisions = Object.freeze([
    { id: "station-north-wall", x: 36, y: 0, width: 1602, height: 27, label: "北墙" },
    { id: "station-west-wall", x: 30, y: 0, width: 45, height: 806, label: "西墙" },
    { id: "station-east-wall", x: 1604, y: 0, width: 41, height: 842, label: "东墙" },
    { id: "station-south-west-wall", x: 30, y: 805, width: 113, height: 57, label: "南墙西段" },
    { id: "station-south-east-wall", x: 252, y: 805, width: 1393, height: 57, label: "南墙东段" },
    { id: "station-west-divider-north", x: 550, y: 18, width: 35, height: 283, label: "仓库隔墙北段" },
    { id: "station-west-divider-south", x: 550, y: 404, width: 35, height: 405, label: "仓库隔墙南段" },
    { id: "station-east-divider-north", x: 996, y: 18, width: 34, height: 212, label: "档案区隔墙北段" },
    { id: "station-east-divider-south", x: 998, y: 305, width: 32, height: 504, label: "档案区隔墙南段" },
    { id: "station-sealed-wall-west", x: 1028, y: 411, width: 142, height: 42, label: "封闭房间北墙西段" },
    { id: "station-sealed-wall-east", x: 1308, y: 411, width: 240, height: 42, label: "封闭房间北墙东段" },
    { id: "station-warehouse-north-shelves", x: 78, y: 21, width: 168, height: 91, label: "仓库北侧货架" },
    { id: "station-warehouse-north-cabinets", x: 370, y: 40, width: 167, height: 80, label: "仓库北侧柜体" },
    { id: "station-warehouse-west-shelves", x: 76, y: 121, width: 54, height: 348, label: "仓库西侧货架" },
    { id: "station-g17-crates", x: 209, y: 174, width: 206, height: 138, label: "G-17木箱堆" },
    { id: "station-warehouse-covered-stock", x: 126, y: 344, width: 120, height: 118, label: "仓库杂物" },
    { id: "station-warehouse-south-stock", x: 328, y: 483, width: 190, height: 116, label: "仓库南侧箱堆" },
    { id: "station-warehouse-west-crates", x: 72, y: 561, width: 39, height: 101, label: "仓库西侧木箱" },
    { id: "station-warehouse-equipment", x: 311, y: 726, width: 53, height: 77, label: "仓库大型设备" },
    { id: "station-warehouse-south-shelves", x: 589, y: 691, width: 156, height: 110, label: "仓库南侧货架" },
    { id: "station-office-north-desk", x: 638, y: 20, width: 129, height: 169, label: "北侧档案桌" },
    { id: "station-office-north-cabinet", x: 928, y: 28, width: 54, height: 82, label: "北侧文件柜" },
    { id: "station-office-desk", x: 691, y: 281, width: 238, height: 114, label: "中央档案桌" },
    { id: "station-office-chair-north", x: 789, y: 246, width: 52, height: 47, label: "档案桌北椅" },
    { id: "station-office-chair-south", x: 791, y: 389, width: 52, height: 49, label: "档案桌南椅" },
    { id: "station-map-table", x: 1073, y: 64, width: 316, height: 113, label: "墙外资源调查桌" },
    { id: "station-archive-north-shelves", x: 1195, y: 15, width: 215, height: 50, label: "档案室北侧货架" },
    { id: "station-archive-east-cabinets", x: 1545, y: 54, width: 51, height: 134, label: "档案室东侧文件柜" },
    { id: "station-archive-covered-equipment", x: 1151, y: 269, width: 111, height: 108, label: "档案室大型设备" },
    { id: "station-archive-east-equipment", x: 1433, y: 191, width: 168, height: 156, label: "档案室东侧设备" },
    { id: "station-sealed-side-table", x: 1130, y: 573, width: 30, height: 67, label: "木床左侧设备" },
    { id: "station-sealed-bed", x: 1203, y: 554, width: 75, height: 141, label: "木床与束缚带" },
    { id: "station-sealed-lab-table", x: 1341, y: 549, width: 32, height: 138, label: "实验器材台" },
    { id: "station-sealed-cage", x: 1439, y: 575, width: 94, height: 120, label: "封闭房间大型设备" },
    { id: "station-sealed-east-shelves", x: 1542, y: 420, width: 62, height: 388, label: "封闭房间东侧货架" },
    { id: "custom-mu3r2zbm", x: 775, y: 33, width: 58, height: 52, label: "自定义障碍" },
    { id: "custom-mu3r7ord", x: 1415, y: 36, width: 128, height: 62, label: "自定义障碍" },
    { id: "custom-mu3r8e5l", x: 1036, y: 29, width: 111, height: 34, label: "自定义障碍" },
    { id: "custom-mu3r9b8x", x: 1116, y: 321, width: 39, height: 39, label: "自定义障碍" },
    { id: "custom-mu3rap94", x: 244, y: 28, width: 120, height: 80, label: "自定义障碍" },
    { id: "custom-mu3rayl4", x: 589, y: 603, width: 40, height: 84, label: "自定义障碍" }
  ]);

  const interactionZones = Object.freeze([
    { id: "station_g17_crate", type: "inspect", action: "startDialog", name: "G-17木箱", x: 149, y: 154, width: 66, height: 84,
      interactionDistance: 100, prompt: "[E] 调查", targetScene: "chapter3_g17_01", disabledAfterFlag: "clue_g17_station" },
    { id: "station_transfer_record", type: "inspect", action: "startDialog", name: "损坏人员转运记录", x: 778, y: 296, width: 108, height: 68,
      interactionDistance: 90, prompt: "[E] 调查", targetScene: "chapter3_transfer_file_01", requiredFlag: "clue_g17_station",
      lockedMessage: "先检查左侧仓库的G-17木箱。", dialogByFlag: [
        { flag: "archive_game_completed", scene: "chapter3_archive_review_prompt" },
        { flag: "archive_game_started", scene: "chapter3_archive_continue" }
      ] },
    { id: "station_karl_archive", type: "inspect", action: "startDialog", name: "卡尔档案", x: 674, y: 77, width: 96, height: 70,
      interactionDistance: 105, prompt: "[E] 调查", targetScene: "chapter3_karl_file_01", requiredFlag: "chapter3_archive_puzzle_completed",
      lockedMessage: "这份档案缺少上下文，暂时看不出异常。", disabledAfterFlag: "clue_karl_purification" },
    { id: "station_outside_map", type: "inspect", action: "startDialog", name: "墙外资源调查图", x: 1116, y: 78, width: 220, height: 76,
      interactionDistance: 100, prompt: "[E] 调查", targetScene: "chapter3_outside_map_01", requiredFlag: "clue_karl_purification",
      lockedMessage: "先确认卡尔档案中的处置记录。", disabledAfterFlag: "clue_outside_resource_map" },
    { id: "station_group_experiment", type: "inspect", action: "startDialog", name: "缺损的群体诱导实验记录", x: 938, y: 34, width: 38, height: 70,
      interactionDistance: 70, prompt: "[E] 调查", targetScene: "chapter3_hidden_experiment_01", hiddenInteraction: true,
      requiredFlag: "chapter3_archive_puzzle_completed", lockedMessage: "先复原损坏的人员转运记录。", disabledAfterFlag: "hidden_group_induction_record" },
    { id: "station_sealed_room", type: "inspect", action: "startDialog", name: "木床与束缚带", x: 1198, y: 562, width: 80, height: 125,
      interactionDistance: 110, prompt: "[E] 调查", targetScene: "chapter3_sealed_room_01", requiredFlag: "clue_outside_resource_map",
      lockedMessage: "先调查墙外资源图，再检查封闭房间。", disabledAfterFlag: "chapter3_sealed_room_checked" },
    { id: "station_exit", type: "exit", name: "返回总部", x: 145, y: 748, width: 106, height: 59,
      interactionDistance: 90, interactionPriority: 20, prompt: "[E] 返回总部", targetScene: "chapter3_leave_station",
      requiredFlag: "chapter3_sealed_room_checked", lockedMessage: "莱纳的记忆闪回尚未触发，调查还没有结束。" }
  ]);

  const stateFlags = Object.freeze({
    g17Found: "clue_g17_station",
    archiveFound: "chapter3_archive_found",
    archiveRepaired: "chapter3_archive_puzzle_completed",
    transferRecordFound: "clue_personnel_transfer_record",
    karlFileFound: "clue_karl_purification",
    outsideMapFound: "clue_outside_resource_map",
    memoryTriggered: "chapter3_sealed_room_checked",
    returnedToHq: "chapter3_returned_to_hq"
  });

  window.TitanMaintenanceStation = Object.freeze({
    referenceWidth: 1672,
    referenceHeight: 941,
    backgroundAsset: "images/maps/seventh-maintenance-station.webp",
    spawn: Object.freeze({ x: 171, y: 733 }),
    collisions: collisions,
    interactionZones: interactionZones,
    decorations: Object.freeze([]),
    npcs: Object.freeze([]),
    stateFlags: stateFlags
  });
}());
