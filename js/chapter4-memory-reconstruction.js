/* 第四章“记忆重构”小游戏桥接：负责离开主剧情、接收结果并恢复对应剧情节点。 */
(function () {
  "use strict";

  const TYPE = "memoryReconstruction";
  const RESULT_KEY = "TitanStory-memory-reconstruction-result";
  const GAME_URL = "minigames/memory-reconstruction/index.html?return=story";
  const cards = Object.freeze([
    "破晓者制定计划",
    "莱纳化身铠之巨人",
    "城门被撞开",
    "平民开始向外逃",
    "巨人突然同时转向",
    "巨人潮进入城内"
  ]);

  function persist(state) {
    if (window.TitanSave) window.TitanSave.saveGame(state);
  }

  function start(context) {
    const state = window.getTitanGameState && window.getTitanGameState();
    if (!state) return Promise.reject(new Error("主剧情状态尚未初始化。"));
    state.mode = "minigame";
    state.currentScene = (context && context.sceneId) || "chapter4_memory_reconstruction";
    try { localStorage.removeItem(RESULT_KEY); } catch (error) { /* 存储不可用时仍尝试启动小游戏。 */ }
    persist(state);
    location.href = GAME_URL;
    return new Promise(function () {});
  }

  function consumeResult(state) {
    let result = null;
    try { result = JSON.parse(localStorage.getItem(RESULT_KEY)); }
    catch (error) { console.warn("记忆重构结果无法解析。", error); }
    try { localStorage.removeItem(RESULT_KEY); } catch (error) { /* 防止重复消费结果。 */ }

    state.flags = state.flags || {};
    state.minigameResults = state.minigameResults || {};
    state.mode = "dialog";
    if (!result || result.type !== TYPE) {
      state.currentScene = "chapter4_memory_reconstruction";
      persist(state);
      return state.currentScene;
    }

    const success = result.success === true;
    state.minigameResults.memory = { type: TYPE, status: "completed", completed: true, success: success };
    if (window.TitanAchievements) window.TitanAchievements.unlockAchievement("first_minigame");
    if (success) {
      state.flags.memoryRecovered = true;
      state.flags.chapter4_memory_puzzle_completed = true;
      state.currentScene = "chapter4_845_memory_01";
      if (window.TitanAchievements) window.TitanAchievements.unlockAchievement("memory_restored");
    } else {
      state.currentScene = "chapter4_memory_reconstruction_retry";
    }
    persist(state);
    return state.currentScene;
  }

  if (window.TitanMinigames) window.TitanMinigames.registerMiniGame(TYPE, start);
  window.TitanChapter4MemoryReconstruction = Object.freeze({
    type: TYPE,
    cards: cards,
    expectedUrl: "minigames/memory-reconstruction/index.html",
    expectedAssetsDirectory: "minigames/memory-reconstruction/assets/",
    resultKey: RESULT_KEY,
    start: start,
    consumeResult: consumeResult
  });
}());
