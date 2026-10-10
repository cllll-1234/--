/* 存档模块：Version 3.1 探索/剧情统一状态、按用户隔离保存与旧存档识别。 */
(function () {
  "use strict";

  const SAVE_VERSION = "3.1";
  const PREFIX = "TitanStory-save-";

  function getCurrentUsername() {
    return localStorage.getItem("TitanStory-current-user") || "guest";
  }

  function getSaveKey() {
    return PREFIX + getCurrentUsername();
  }

  function createInitialGameState() {
    return {
      mode: "dialog",
      currentMap: "hq",
      currentScene: "prologue_09",
      currentObjective: "从噩梦中醒来",
      route: null,
      choices: [],
      evidence: [],
      mapPositions: {},
      flags: {
        crossFound: false,
        gaveCrossToHange: false,
        hidCross: false,
        allSlumEvidence: false,
        outsideWorldSafe: false,
        moatPlanFound: false,
        purgeListFound: false,
        foundFounderRecord: false,
        memoryRecovered: false,
        forgotWallMariaDay: false,
        rememberedCrying: false,
        refusedMemoryTalk: false,
        dodgeSucceeded: false,
        broadcastComplete: false,
        destroyedArchives: false,
        arrestedScouts: false,
        silencedWitness: false,
        protectedWitnesses: false,
        enteredCore: false,
        qteSucceeded: false,
        hqIntroComplete: false,
        hqNoticeRead: false,
        introPlayed: false,
        streetEntered: false,
        readChurchNotice: false,
        sermonTriggered: false,
        reinerFlashbackStarted: false,
        churchMemorySuspicion: false,
        prologueComplete: false,
        streetTalkedCivilianA: false,
        streetTalkedCivilianB: false,
        streetTalkedOldwoman: false,
        streetTalkedPasserby: false,
        streetReturnPrompted: false,
        returnedToHqForMission: false,
        hqMissionBriefingComplete: false,
        chapter1RuinsEntered: false,
        chapter1LetterFound: false,
        chapter1GraffitiRead: false,
        chapter1TitanTriggered: false,
        chapter1WagonChecked: false,
        chapter1CentralReached: false,
        chapter1FieldApproached: false,
        clue_sea_memory: false,
        clue_dawn_symbol: false,
        clue_titan_footprints: false,
        chapter1_minigame_started: false,
        chapter1_minigame_finished: false,
        clue_cross_obtained: false,
        maneuverPending: false,
        maneuverCompleted: false,
        dodgeFailed: false,
        prologueDreamComplete: false,
        streetDawnSymbolRead: false,
        chapter1DawnSymbolRead: false,
        chapter1Complete: false,
        chapter2BriefingDone: false,
        chapter2SlumEntered: false,
        slumNoticeRead: false,
        clue_missing_people: false,
        slumNightCarriage: false,
        clue_night_carriage: false,
        tavernEntered: false,
        visited_old_church: false,
        chapter2ResidentSpoken: false,
        churchIntroSeen: false,
        churchDragMarksFound: false,
        churchSedativesFound: false,
        churchG17Found: false,
        churchInvestigationComplete: false,
        churchExitSummarySeen: false,
        churchMedicalClothChecked: false,
        churchAltarChecked: false,
        churchEmblemChecked: false,
        churchTreatmentBedChecked: false,
        churchSinkChecked: false,
        churchDawnMarkFound: false,
        churchTransferPaperFound: false,
        talkedTavernOwner: false,
        heardWheelRumor: false,
        heardDisappearanceRumor: false,
        slumTavernLedgerRead: false,
        slumTavernCluesLinked: false,
        tavernBarrelChecked: false,
        slumVialFound: false,
        slumWarehouseHint: false,
        slumTransportFound: false,
        dawnbreakersIdentified: false,
        clue_dawnbreakers: false,
        dawnbreakersCrossIdentified: false,
        visited_warehouse: false,
        warehouse_tracks_checked: false,
        warehouse_normal_crate_checked: false,
        warehouse_table_checked: false,
        warehouse_manifest_unlocked: false,
        talked_old_porter: false,
        porter_night_transport: false,
        clue_people_in_carriage: false,
        clue_g17: false,
        clue_church_warehouse: false,
        clue_g17_warehouse: false,
        clue_seventh_dock: false,
        clue_seventh_dock_code: false,
        hidden_warehouse_dawn: false,
        warehouse_full_investigation: false,
        chapter2ReturnedToHq: false,
        chapter2Reported: false,
        chapter2Complete: false,
        chapter3_briefing_done: false,
        clue_seventh_station_church_facility: false,
        visited_seventh_maintenance_station: false,
        clue_g17_station: false,
        chapter3_archive_found: false,
        archive_game_started: false,
        archive_fragments_selected: false,
        archive_puzzle_completed: false,
        archive_anomalies_marked: false,
        archive_reasoning_completed: false,
        archive_game_completed: false,
        has_dock_transfer_record: false,
        chapter3_archive_puzzle_completed: false,
        clue_personnel_transfer_record: false,
        clue_g17_missing_people: false,
        clue_karl_purification: false,
        clue_outside_resource_map: false,
        hidden_group_induction_record: false,
        chapter3_core_evidence_complete: false,
        chapter3_sealed_room_checked: false,
        chapter3_returned_to_hq: false,
        chapter3_complete: false,
        chapter4_letter_received: false,
        chapter4_past_identity_revealed: false,
        visited_clock_tower_underground: false,
        chapter4_bed_checked: false,
        chapter4_g17_truth_found: false,
        truth_pure_titans_are_human: false,
        chapter4_karl_truth_found: false,
        chapter4_purification_room_complete: false,
        chapter4_dawnbreakers_truth: false,
        chapter4_memory_puzzle_completed: false,
        chapter4_845_truth_recovered: false,
        chapter4_returned_to_hq: false,
        chapter4_complete: false,
        chapter5_started: false,
        chapter5_hq_briefing_complete: false,
        chapter5_central_district_entered: false,
        chapter5_guardian_encountered: false,
        chapter5_guardian_battle_complete: false,
        chapter5_guardian_defeated: false,
        chapter5_broadcast_complete: false,
        chapter5_order_contacted: false,
        chapter5_archives_retained: false,
        chapter5_central_facility_entered: false,
        chapter5_g17_stock_destroyed: false,
        chapter5_purification_list_found: false,
        chapter5_facility_evidence_complete: false,
        chapter5_founder_control_completed: false,
        chapter5_founder_device_destroyed: false,
        chapter5_titan_system_ended: false,
        chapter5_good_ending: false,
        chapter5_bad_ending: false,
        chapter5_normal_ending: false,
        chapter5_hidden_ending: false,
        chapter5_complete: false
      },
      achievements: [],
      minigameResults: {
        dodge: null,
        investigation: null,
        archiveInvestigation: null,
        archivePuzzle: null,
        memory: null,
        qte: null,
        guardianBoss: null,
        founderControl: null,
        maneuver: null
      }
    };
  }

  function normalizeGameState(value) {
    const initial = createInitialGameState();
    const state = value && typeof value === "object" ? value : {};
    const normalizedFlags = Object.assign({}, initial.flags);
    const normalizedResults = Object.assign({}, initial.minigameResults);
    Object.keys(normalizedFlags).forEach(function (name) {
      if (state.flags && Object.prototype.hasOwnProperty.call(state.flags, name)) normalizedFlags[name] = Boolean(state.flags[name]);
    });
    Object.keys(normalizedResults).forEach(function (name) {
      if (state.minigameResults && Object.prototype.hasOwnProperty.call(state.minigameResults, name)) normalizedResults[name] = state.minigameResults[name];
    });
    if (normalizedFlags.chapter1GraffitiRead) normalizedFlags.clue_sea_memory = true;
    if (normalizedFlags.chapter1DawnSymbolRead) normalizedFlags.clue_dawn_symbol = true;
    if (normalizedFlags.chapter1TitanTriggered) normalizedFlags.chapter1_minigame_started = true;
    if (normalizedFlags.maneuverCompleted) normalizedFlags.chapter1_minigame_finished = true;
    if (normalizedFlags.crossFound) normalizedFlags.clue_cross_obtained = true;
    if (normalizedFlags.slumNoticeRead) normalizedFlags.clue_missing_people = true;
    if (normalizedFlags.slumNightCarriage) normalizedFlags.clue_night_carriage = true;
    if (normalizedFlags.slumTransportFound) normalizedFlags.clue_seventh_dock = true;
    if (normalizedFlags.slumVialFound) normalizedFlags.churchG17Found = true;
    if (["churchDragMarksFound", "churchSedativesFound", "churchG17Found"].every(function (name) { return normalizedFlags[name]; })) {
      normalizedFlags.churchInvestigationComplete = true;
    }
    const savedScene = typeof state.currentScene === "string" ? state.currentScene : null;
    const migratedScenes = {
      chapter1_ruins_letter: "chapter1_ruins_wagon_01",
      chapter1_ruins_letter_after: "chapter1_ruins_wagon_01",
      chapter1_ruins_dawn_symbol: "chapter1_ruins_dawn_01",
      chapter1_ruins_footprints: "chapter1_ruins_footprints_01",
      chapter1_ruins_wagon: "chapter1_ruins_wagon_01",
      chapter1_titan_warning: "chapter1_titan_roar",
      chapter1_maneuver_success_03: "chapter1_maneuver_success_02",
      chapter1_maneuver_success_04: "chapter1_maneuver_success_02",
      chapter1_maneuver_success_05: "chapter1_maneuver_success_02",
      chapter1_maneuver_fail_04: "chapter1_maneuver_fail_02",
      chapter1_maneuver_fail_05: "chapter1_maneuver_fail_02",
      chapter1_maneuver_fail_06: "chapter1_maneuver_fail_02",
      chapter1_maneuver_fail_07: "chapter1_maneuver_fail_02",
      chapter1_body_nape: "chapter1_body_metal",
      chapter1_end_soldier: "chapter1_cross_reflection",
      chapter1_end_hange_01: "chapter1_cross_reflection",
      chapter1_end_hange_02: "chapter1_cross_reflection",
      chapter1_end_reiner_01: "chapter1_cross_reflection",
      chapter1_end_hange_03: "chapter1_cross_reflection",
      chapter1_end_reiner_02: "chapter1_cross_reflection",
      chapter1_end_reiner_03: "chapter1_cross_reflection",
      chapter1_end_hange_04: "chapter1_cross_reflection",
      chapter1_end_hange_05: "chapter1_cross_reflection",
      chapter1_end_cross_card: "chapter1_end_voice_01",
      chapter1_flash_01: "chapter1_cross_reflection",
      chapter1_flash_02: "chapter1_cross_reflection",
      chapter1_flash_03: "chapter1_cross_reflection",
      chapter1_cross_01: "chapter1_body_metal",
      chapter1_cross_02: "chapter1_cross_reflection",
      chapter1_cross_03: "chapter1_cross_reflection",
      chapter1_cross_choice: "chapter1_cross_reflection",
      chapter1_cross_given: "chapter1_cross_reflection",
      chapter1_cross_hidden: "chapter1_cross_reflection",
      chapter1_end: "chapter1_cross_reflection",
      chapter1_end_memory_01: "chapter1_end_voice_01",
      chapter1_end_memory_02: "chapter1_end_voice_01",
      chapter1_end_karl: "chapter1_end_card",
      chapter3_investigation: "chapter3_01",
      chapter3_investigation_check: "chapter3_01",
      chapter3_manual_hub: "chapter3_01",
      chapter3_resource: "chapter3_01",
      chapter3_resource_02: "chapter3_01",
      chapter3_moat: "chapter3_01",
      chapter3_moat_02: "chapter3_01",
      chapter3_purge: "chapter3_01",
      chapter3_purge_02: "chapter3_01",
      chapter3_founder: "chapter3_01",
      chapter3_founder_02: "chapter3_01",
      chapter3_complete: "chapter3_01",
      chapter4_memory: "chapter4_01",
      chapter4_memory_retry: "chapter4_01",
      chapter4_memory_manual: "chapter4_01",
      chapter4_memory_01: "chapter4_01",
      chapter4_memory_02: "chapter4_01",
      chapter4_memory_03: "chapter4_01",
      chapter4_memory_04: "chapter4_01",
      chapter4_memory_05: "chapter4_01",
      chapter4_memory_06: "chapter4_01",
      chapter4_memory_07: "chapter4_01",
      chapter4_partial_01: "chapter4_01",
      chapter4_partial_02: "chapter4_01",
      chapter4_truth_01: "chapter4_01",
      chapter4_route_choice: "chapter4_01",
      chapter5_rebellion_qte: "chapter5_rebellion_01",
      chapter5_broadcast_success: "chapter5_rebellion_01",
      chapter5_broadcast_fail: "chapter5_rebellion_01",
      chapter5_broadcast_fail_02: "chapter5_rebellion_01",
      chapter5_rebellion_end_check: "chapter5_rebellion_01",
      chapter5_church_01: "chapter5_order_01",
      chapter5_church_archive: "chapter5_order_01",
      chapter5_church_arrest: "chapter5_order_01",
      chapter5_church_witness: "chapter5_order_01",
      chapter5_church_check: "chapter5_order_01",
      chapter5_church_break: "chapter5_order_01",
      chapter5_truth_gate: "chapter5_truth_01",
      chapter5_truth_fallback: "chapter5_truth_01",
      chapter5_truth_fallback_02: "chapter5_truth_01",
      chapter5_truth_success: "chapter5_truth_01",
      chapter5_truth_fail: "chapter5_truth_01",
      chapter5_truth_fail_02: "chapter5_truth_01"
    };
    const currentScene = /^prologue_0[1-8]$/.test(savedScene || "") ? "prologue_09" : (migratedScenes[savedScene] || savedScene);
    return {
      mode: ["explore", "dialog", "minigame"].includes(state.mode) ? state.mode : initial.mode,
      currentMap: state.currentMap === "chapter2_slum" ? "undergroundStreet" :
        (typeof state.currentMap === "string" ? state.currentMap : initial.currentMap),
      currentScene: currentScene,
      currentObjective: typeof state.currentObjective === "string" ? state.currentObjective : initial.currentObjective,
      route: state.route === "church" ? "order" : (["rebellion", "order", "truth"].includes(state.route) ? state.route : null),
      choices: Array.isArray(state.choices) ? state.choices : [],
      evidence: Array.isArray(state.evidence) ? state.evidence : [],
      mapPositions: state.mapPositions && typeof state.mapPositions === "object" ? Object.keys(state.mapPositions).reduce(function (positions, mapId) {
        const position = state.mapPositions[mapId];
        if (position && Number.isFinite(position.x) && Number.isFinite(position.y)) positions[mapId] = { x: position.x, y: position.y };
        return positions;
      }, {}) : {},
      flags: normalizedFlags,
      achievements: Array.isArray(state.achievements) ? state.achievements : [],
      minigameResults: normalizedResults
    };
  }

  function loadGameSave() {
    let data;
    try {
      data = JSON.parse(localStorage.getItem(getSaveKey()));
    } catch (error) {
      console.warn("存档数据无法解析，已忽略。", error);
      return null;
    }
    if (!data) return null;
    if (data.version !== SAVE_VERSION || !data.state) {
      return { incompatible: true, version: data.version || "1.x" };
    }
    return Object.assign({}, data, { state: normalizeGameState(data.state) });
  }

  function saveGame(state) {
    const data = {
      version: SAVE_VERSION,
      state: normalizeGameState(state),
      username: getCurrentUsername(),
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(getSaveKey(), JSON.stringify(data));
    return data;
  }

  function clearGameSave() {
    localStorage.removeItem(getSaveKey());
  }

  window.TitanSave = {
    SAVE_VERSION: SAVE_VERSION,
    getCurrentUsername: getCurrentUsername,
    getSaveKey: getSaveKey,
    createInitialGameState: createInitialGameState,
    normalizeGameState: normalizeGameState,
    loadGameSave: loadGameSave,
    saveGame: saveGame,
    clearGameSave: clearGameSave
  };
}());
