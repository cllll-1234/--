/* 小游戏公共接口：后续小游戏通过 registerMiniGame 接入，剧情统一调用 startMiniGame。 */
(function () {
  "use strict";

  const handlers = {};

  function registerMiniGame(type, handler) {
    if (!type || typeof handler !== "function") throw new TypeError("小游戏需要有效的类型和处理函数。");
    handlers[type] = handler;
  }

  function startMiniGame(type, context) {
    const handler = handlers[type];
    if (!handler) {
      return Promise.resolve({ type: type, status: "not_implemented", completed: false, success: false });
    }
    return Promise.resolve(handler(context || {})).then(function (result) {
      return Object.assign({ type: type, status: "completed", completed: true, success: false }, result || {});
    });
  }

  window.TitanMinigames = { registerMiniGame: registerMiniGame, startMiniGame: startMiniGame };
  window.startMiniGame = startMiniGame;
}());
