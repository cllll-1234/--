/* 序章背景音乐控制。音频缺失或自动播放被阻止时静默退化为无声。 */
(function () {
  "use strict";

  const AUDIO_PATH = "audio/bgm/默认.m4a";
  const CHAPTER4_AUDIO_PATH = "audio/bgm/恶魔之子.mp3";
  const GOOD_END_AUDIO_PATH = "audio/bgm/good_end.mp3";
  let player = null;
  let currentAudioPath = "";
  let unlockBound = false;

  function retryAfterInteraction() {
    if (unlockBound) {
      document.removeEventListener("pointerdown", retryAfterInteraction);
      document.removeEventListener("keydown", retryAfterInteraction);
      unlockBound = false;
    }
    start();
  }

  function bindUnlock() {
    if (unlockBound) return;
    unlockBound = true;
    document.addEventListener("pointerdown", retryAfterInteraction, { once: true });
    document.addEventListener("keydown", retryAfterInteraction, { once: true });
  }

  function start(chapter) {
    const settings = window.TitanSettings ? window.TitanSettings.loadSettings() : { music: true };
    if (!settings.music) {
      stop();
      return;
    }
    const audioPath = chapter
      ? (chapter === "第四章 · 破墙之日" ? CHAPTER4_AUDIO_PATH
        : chapter.indexOf("Good Ending") === 0 ? GOOD_END_AUDIO_PATH : AUDIO_PATH)
      : currentAudioPath || AUDIO_PATH;
    if (!player || currentAudioPath !== audioPath) {
      if (player) player.pause();
      player = new Audio(audioPath);
      currentAudioPath = audioPath;
      player.loop = true;
      player.preload = "auto";
    }
    player.volume = window.TitanSettings ? window.TitanSettings.getVolume(0.45) : 0.45;
    const promise = player.play();
    if (promise && typeof promise.catch === "function") {
      promise.catch(function () { bindUnlock(); });
    }
  }

  function stop() {
    if (!player) return;
    player.pause();
    player.currentTime = 0;
  }

  window.TitanPrologueBgm = Object.freeze({
    AUDIO_PATH: AUDIO_PATH,
    start: start,
    stop: stop
  });

  window.addEventListener("titan-settings-changed", function () { start(); });
}());
