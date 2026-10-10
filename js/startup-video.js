/* 首次打开游戏时播放 start.mp4；同一标签页中只播放一次。 */
(function () {
  "use strict";

  const STORAGE_KEY = "TitanStory-startup-video-played";
  let active = false;
  let finished = false;
  let playbackAttempt = 0;

  function elements() {
    return {
      overlay: document.querySelector("#startup-video-overlay"),
      video: document.querySelector("#startup-video"),
      status: document.querySelector("#startup-video-status"),
      play: document.querySelector("#play-startup-video"),
      entry: document.querySelector("#home-entry")
    };
  }

  function wasPlayed() {
    try { return sessionStorage.getItem(STORAGE_KEY) === "1"; }
    catch (error) { return false; }
  }

  function rememberPlayed() {
    try { sessionStorage.setItem(STORAGE_KEY, "1"); }
    catch (error) { /* 隐私模式下仍允许继续游戏 */ }
  }

  function finish() {
    if (finished) return;
    finished = true;
    active = false;
    rememberPlayed();
    const ui = elements();
    if (ui.video) ui.video.pause();
    document.removeEventListener("keydown", onKeydown, true);
    document.removeEventListener("pointerdown", enableAudio, true);
    document.removeEventListener("keydown", enableAudio, true);
    function completeTransition() {
      if (ui.overlay) ui.overlay.hidden = true;
      document.body.classList.remove("startup-active");
      if (window.TitanMenuBgm) window.TitanMenuBgm.start();
      if (ui.entry) {
        try { ui.entry.focus({ preventScroll: true }); }
        catch (error) { ui.entry.focus(); }
      }
    }
    if (ui.overlay && !ui.overlay.hidden && ui.video && ui.video.currentTime > 0) {
      ui.overlay.classList.add("startup-fading");
      window.setTimeout(completeTransition, 800);
    } else {
      completeTransition();
    }
  }

  function showPlaybackFallback(message) {
    const ui = elements();
    if (!active) return;
    ui.status.textContent = message;
    ui.status.hidden = false;
    ui.play.hidden = false;
  }

  function setVideoVolume(video) {
    video.volume = window.TitanSettings ? window.TitanSettings.getVolume(1) : 1;
  }

  function playMutedFallback(video, attempt) {
    if (!active || attempt !== playbackAttempt) return;
    video.muted = true;
    video.defaultMuted = true;
    let promise;
    try { promise = video.play(); }
    catch (error) {
      finish();
      return;
    }
    if (promise && typeof promise.catch === "function") {
      promise.catch(finish);
    }
  }

  function enableAudio(event) {
    if (!active || (event && event.type === "keydown" && event.key === "Tab")) return;
    const ui = elements();
    if (!ui.video) return;
    playbackAttempt += 1;
    setVideoVolume(ui.video);
    ui.video.muted = false;
    ui.video.defaultMuted = false;
    document.removeEventListener("pointerdown", enableAudio, true);
    document.removeEventListener("keydown", enableAudio, true);
    const promise = ui.video.play();
    if (promise && typeof promise.catch === "function") {
      promise.catch(function () { /* 画面继续播放，不显示浏览器拦截提示 */ });
    }
  }

  function requestPlayback() {
    const ui = elements();
    if (!active || !ui.video) return;
    ui.status.hidden = true;
    ui.play.hidden = true;
    const attempt = ++playbackAttempt;
    setVideoVolume(ui.video);
    ui.video.muted = false;
    ui.video.defaultMuted = false;
    let promise;
    try { promise = ui.video.play(); }
    catch (error) {
      playMutedFallback(ui.video, attempt);
      return;
    }
    if (promise && typeof promise.catch === "function") {
      promise.catch(function () {
        playMutedFallback(ui.video, attempt);
      });
    }
  }

  function onKeydown(event) {
    if (!active || event.key !== "Tab") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    finish();
  }

  function start() {
    const ui = elements();
    if (!ui.overlay || !ui.video) {
      document.body.classList.remove("startup-active");
      return;
    }
    if (wasPlayed()) {
      finish();
      return;
    }
    active = true;
    ui.overlay.hidden = false;
    document.addEventListener("keydown", onKeydown, true);
    document.addEventListener("pointerdown", enableAudio, true);
    document.addEventListener("keydown", enableAudio, true);
    ui.video.addEventListener("ended", finish, { once: true });
    ui.video.addEventListener("error", function () {
      finish();
    }, { once: true });
    ui.play.addEventListener("click", requestPlayback);
    const skipButton = ui.overlay.querySelector(".startup-skip-hint");
    if (skipButton) skipButton.addEventListener("click", finish);
    requestPlayback();
  }

  document.addEventListener("DOMContentLoaded", start);

  window.TitanStartupVideo = Object.freeze({
    finish: finish,
    play: requestPlayback
  });
}());
