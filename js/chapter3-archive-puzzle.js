/* 第三章“档案复原”小游戏接入契约。正式小游戏完成后调用 register(handler) 即可。 */
(function () {
  "use strict";

  const TYPE = "archivePuzzle";
  const PIECE_COUNT = 6;

  function showUnavailableNotice() {
    if (window.TitanExplore) window.TitanExplore.showToast("档案复原小游戏尚未接入", "warning");
  }

  function unavailableHandler() {
    showUnavailableNotice();
    return { type: TYPE, status: "not_implemented", completed: false, success: false };
  }

  function register(handler) {
    if (!window.TitanMinigames) throw new Error("小游戏管理器尚未加载。");
    window.TitanMinigames.registerMiniGame(TYPE, handler);
  }

  function startArchiveRepairGame(context) {
    if (!window.TitanMinigames) return Promise.reject(new Error("小游戏管理器尚未加载。"));
    return window.TitanMinigames.startMiniGame(TYPE, context || {}).then(function (result) {
      if (result.status === "not_implemented") showUnavailableNotice();
      return result;
    });
  }

  window.TitanChapter3ArchivePuzzle = Object.freeze({
    type: TYPE,
    pieceCount: PIECE_COUNT,
    expectedUrl: "minigames/archive-puzzle/game.html",
    expectedAssetsDirectory: "images/minigames/archive-puzzle/",
    register: register,
    start: startArchiveRepairGame
  });
  window.startArchiveRepairGame = startArchiveRepairGame;
  if (window.TitanMinigames) window.TitanMinigames.registerMiniGame(TYPE, unavailableHandler);
}());
