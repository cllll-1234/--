/* 新游戏专用开场：序章标题 -> 莱纳的噩梦 -> 进入现有游戏。 */
(function () {
  "use strict";

  const NIGHTMARE_VIDEO_PATH = "video/baddream.mp4";
  let active = false;
  let transitionStarted = false;
  let sequenceFinished = false;
  let phase = "idle";
  let options = null;
  let titleFallbackTimer = null;

  function elements() {
    return {
      main: document.querySelector("#main-content"),
      videoOverlay: document.querySelector("#intro-video-overlay"),
      video: document.querySelector("#intro-video"),
      status: document.querySelector("#intro-video-status"),
      play: document.querySelector("#play-intro"),
      skip: document.querySelector("#skip-intro"),
      title: document.querySelector("#chapter-title-overlay")
    };
  }

  function stopVideo(video) {
    if (!video) return;
    video.pause();
    video.removeAttribute("src");
    video.load();
  }

  function showPlaybackFallback(message, canRetry) {
    const ui = elements();
    if (!active || transitionStarted) return;
    ui.status.textContent = message;
    ui.status.hidden = false;
    ui.play.hidden = !canRetry;
  }

  function prepareVideo(path, label) {
    const ui = elements();
    stopVideo(ui.video);
    ui.video.src = path;
    ui.video.setAttribute("aria-label", label);
    ui.status.hidden = true;
    ui.play.hidden = true;
    ui.videoOverlay.hidden = false;
  }

  function finishSequence() {
    if (sequenceFinished) return;
    sequenceFinished = true;
    active = false;
    phase = "finished";
    clearTimeout(titleFallbackTimer);
    const ui = elements();
    ui.title.removeEventListener("animationend", onTitleAnimationEnd);
    stopVideo(ui.video);
    ui.title.hidden = true;
    ui.status.hidden = true;
    ui.play.hidden = true;
    if (options && typeof options.onComplete === "function") {
      // 页面跳转真正生效前继续保留黑色全屏层，避免首页短暂闪现。
      ui.videoOverlay.hidden = false;
      options.onComplete();
      return;
    }
    ui.videoOverlay.hidden = true;
    document.body.classList.remove("intro-active");
    if (ui.main) ui.main.removeAttribute("aria-hidden");
  }

  function onTitleAnimationEnd(event) {
    if (event.target === elements().title && event.animationName === "prologue-overlay") startNightmare();
  }

  function startNightmare() {
    if (!active || phase !== "title") return;
    clearTimeout(titleFallbackTimer);
    const ui = elements();
    ui.title.removeEventListener("animationend", onTitleAnimationEnd);
    ui.title.hidden = true;
    ui.title.classList.remove("is-active");
    phase = "nightmare";
    transitionStarted = false;
    prepareVideo(NIGHTMARE_VIDEO_PATH, "莱纳的噩梦");
    try { ui.skip.focus({ preventScroll: true }); } catch (error) { ui.skip.focus(); }
    requestPlayback();
  }

  function showPrologueTitle() {
    if (!active || transitionStarted) return;
    transitionStarted = true;
    phase = "title";
    const ui = elements();
    stopVideo(ui.video);
    ui.videoOverlay.hidden = true;
    ui.title.hidden = false;
    ui.title.addEventListener("animationend", onTitleAnimationEnd);
    void ui.title.offsetWidth;
    ui.title.classList.add("is-active");
    if (options && typeof options.onIntroComplete === "function") options.onIntroComplete();
    titleFallbackTimer = setTimeout(startNightmare, 5200);
  }

  function requestPlayback() {
    const ui = elements();
    ui.status.hidden = true;
    ui.play.hidden = true;
    let playPromise;
    try {
      playPromise = ui.video.play();
    } catch (error) {
      showPlaybackFallback("无法播放开场视频，请点击跳过继续。", false);
      return;
    }
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function (error) {
        const sourceUnavailable = error && error.name === "NotSupportedError";
        showPlaybackFallback(
          sourceUnavailable ? "开场视频暂未安装。请点击右上角“跳过”进入序章。" : "浏览器阻止了自动播放，请点击播放；也可以直接跳过。",
          !sourceUnavailable
        );
      });
    }
  }

  function onKeydown(event) {
    if (!active || transitionStarted) return;
    if (event.key === "Escape" || ((event.key === " " || event.key === "Enter") && event.target !== elements().play)) {
      event.preventDefault();
      skipCurrentVideo();
    }
  }

  function skipCurrentVideo() {
    if (phase === "nightmare") finishSequence();
    else showPrologueTitle();
  }

  function start(startOptions) {
    if (active) return false;
    const ui = elements();
    if (!ui.videoOverlay || !ui.video || !ui.title) return false;
    options = startOptions || {};
    active = true;
    transitionStarted = false;
    sequenceFinished = false;
    phase = "title";
    document.body.classList.add("intro-active");
    if (ui.main) ui.main.setAttribute("aria-hidden", "true");
    ui.title.hidden = true;
    ui.title.classList.remove("is-active");
    ui.videoOverlay.hidden = true;
    ui.status.hidden = true;
    ui.play.hidden = true;
    phase = "idle";
    showPrologueTitle();
    return true;
  }

  document.addEventListener("DOMContentLoaded", function () {
    const ui = elements();
    if (!ui.video) return;
    ui.video.addEventListener("ended", function () {
      if (phase === "nightmare") finishSequence();
      else showPrologueTitle();
    });
    ui.video.addEventListener("error", function () {
      showPlaybackFallback("开场视频暂未安装。请点击右上角“跳过”进入序章。", false);
    });
    ui.skip.addEventListener("click", skipCurrentVideo);
    ui.play.addEventListener("click", requestPlayback);
    document.addEventListener("keydown", onKeydown);
  });

  window.TitanIntro = Object.freeze({
    NIGHTMARE_VIDEO_PATH: NIGHTMARE_VIDEO_PATH,
    FUTURE_ENTRY_SCENE: "prologue_09",
    start: start,
    skip: skipCurrentVideo,
    showPrologueTitle: showPrologueTitle
  });
}());
