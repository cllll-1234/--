/* 第一章立体机动桥接：主剧情只依赖这个入口，不耦合小游戏实现。 */
(function () {
  "use strict";

  const RESULT_KEY = "wall-rift-maneuver-result";
  const GAME_URL = "minigames/maneuver/game.html?mode=maneuver&return=story";

  function persist(state) {
    if (window.TitanSave) window.TitanSave.saveGame(state);
  }

  function startChapter1Maneuver() {
    const state = window.getTitanGameState && window.getTitanGameState();
    if (!state) return Promise.reject(new Error("主剧情状态尚未初始化。"));
    state.flags = state.flags || {};
    state.flags.chapter1_minigame_started = true;
    state.flags.chapter1_minigame_finished = false;
    state.flags.maneuverPending = true;
    state.flags.maneuverCompleted = false;
    state.currentScene = "chapter1_before_maneuver";
    state.mode = "minigame";
    try { localStorage.removeItem(RESULT_KEY); } catch (error) { /* 存储不可用时仍可进入小游戏 */ }
    persist(state);
    location.href = GAME_URL;
    return new Promise(function () {});
  }

  function consumeResult(state) {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(RESULT_KEY)); } catch (error) { console.warn("立体机动结果无法解析。", error); }
    if (!raw || typeof raw !== "object") return null;
    try { localStorage.removeItem(RESULT_KEY); } catch (error) { /* 防重复主要由完成标记兜底 */ }

    const success = raw.maneuverCleared === true;
    state.flags = state.flags || {};
    state.minigameResults = state.minigameResults || {};
    state.minigameResults.maneuver = {
      type: "maneuver",
      status: "completed",
      completed: true,
      success: success,
      injured: Boolean(raw.injured !== undefined ? raw.injured : raw.lainerInjured),
      time: Number.isFinite(Number(raw.time)) ? Number(raw.time) : 0,
      deaths: Number.isFinite(Number(raw.deaths)) ? Number(raw.deaths) : 0,
      titanHits: Number.isFinite(Number(raw.titanHits)) ? Number(raw.titanHits) : 0,
      titanDamageTaken: Number.isFinite(Number(raw.titanDamageTaken)) ? Number(raw.titanDamageTaken) : 0
    };
    state.flags.maneuverCompleted = true;
    state.flags.chapter1_minigame_started = true;
    state.flags.chapter1_minigame_finished = true;
    state.flags.maneuverPending = false;
    state.flags.dodgeFailed = !success;
    state.mode = "dialog";
    state.currentScene = success ? "chapter1_maneuver_success" : "chapter1_maneuver_fail";
    persist(state);
    return state.currentScene;
  }

  window.startChapter1Maneuver = startChapter1Maneuver;
  window.TitanChapter1Maneuver = { start: startChapter1Maneuver, consumeResult: consumeResult, resultKey: RESULT_KEY };
  if (window.TitanMinigames) window.TitanMinigames.registerMiniGame("maneuver", startChapter1Maneuver);
}());
