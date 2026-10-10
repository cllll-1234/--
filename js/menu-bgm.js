/* 开始菜单背景音乐。自动播放受限时，在首次用户交互后重试。 */
(function () {
  "use strict";

  const AUDIO_PATH = "audio/bgm/menu.mp3";
  let player = null;
  let unlockBound = false;

  function retryAfterInteraction() {
    document.removeEventListener("pointerdown", retryAfterInteraction);
    document.removeEventListener("keydown", retryAfterInteraction);
    unlockBound = false;
    start();
  }

  function bindUnlock() {
    if (unlockBound) return;
    unlockBound = true;
    document.addEventListener("pointerdown", retryAfterInteraction, { once: true });
    document.addEventListener("keydown", retryAfterInteraction, { once: true });
  }

  function start() {
    if (document.body.classList.contains("startup-active")) return;
    const settings = window.TitanSettings ? window.TitanSettings.loadSettings() : { music: true };
    if (!settings.music) {
      stop();
      return;
    }
    if (!player) {
      player = new Audio(AUDIO_PATH);
      player.loop = true;
      player.preload = "auto";
    }
    player.volume = window.TitanSettings ? window.TitanSettings.getVolume(0.45) : 0.45;
    const promise = player.play();
    if (promise && typeof promise.catch === "function") promise.catch(bindUnlock);
  }

  function stop() {
    if (!player) return;
    player.pause();
    player.currentTime = 0;
  }

  window.TitanMenuBgm = Object.freeze({
    AUDIO_PATH: AUDIO_PATH,
    start: start,
    stop: stop
  });

  window.addEventListener("titan-settings-changed", start);

  start();
}());
