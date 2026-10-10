/* 独立片尾：开场留白、匀速滚动、暂停和最终致谢，不写入剧情存档。 */
(function () {
  "use strict";
  const endings = {
    bad: ["神权的走狗", "当沉默成为习惯，谁会记得那些消失的人？"],
    normal: ["沉默者", "被留下的真相，等待着下一次被说出的勇气。"],
    good: ["破晓的黎明", "门已经打开。愿每一个被记住的人，都能抵达自己的海。"],
    hidden: ["自由的诅咒", "走出高墙以后，我们仍要学会如何与自由同行。"]
  };
  const selected = endings[new URLSearchParams(location.search).get("ending")];
  if (selected) {
    document.querySelector("#ending-title").textContent = selected[0];
    document.querySelector("#ending-thought").textContent = selected[1];
  }
  const presentationParams = new URLSearchParams(location.search);
  if (selected && presentationParams.has("title")) {
    document.querySelector("#ending-title").textContent = presentationParams.get("title");
    document.querySelector("#ending-thought").textContent = presentationParams.get("thought") || selected[1];
  }
  const opening = document.querySelector("#opening");
  const viewport = document.querySelector("#roll-viewport");
  const roll = document.querySelector("#credits-roll");
  const farewell = document.querySelector("#farewell");
  const controls = document.querySelector("#credits-controls");
  const pauseButton = document.querySelector("#pause");
  const progress = document.querySelector("#progress-fill");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let elapsed = 0;
  let offset = 0;
  let previousTime = null;
  let paused = false;
  let finished = false;
  let frameId = null;
  const INTRO_DURATION = 6500;
  const SCROLL_SPEED = 28; // 像素/秒；移动端随视口调整，保持阅读节奏。
  let carriedMusic = null;
  try { if (window.parent !== window && presentationParams.get("ending") === "good") carriedMusic = window.parent.TitanCreditsMusic || null; } catch (error) {}
  const audio = carriedMusic ? carriedMusic.audio : new Audio("audio/bgm/good_end.mp3");
  const musicBase = carriedMusic ? carriedMusic.baseVolume : 0.4;
  let firstStart = true;
  if (carriedMusic) document.querySelectorAll("a[href]").forEach(link => { link.target = "_top"; });
  audio.loop = true;
  let fade = 0;

  function syncAudio() {
    const settings = window.TitanSettings.loadSettings();
    audio.volume = window.TitanSettings.getVolume(musicBase) * fade;
    if (!settings.music || finished) audio.pause();
    else if (audio.paused) audio.play().catch(function () {});
  }
  function showFarewell() {
    if (finished) return;
    finished = true;
    if (frameId !== null) cancelAnimationFrame(frameId);
    opening.hidden = true;
    viewport.hidden = true;
    controls.hidden = true;
    farewell.hidden = false;
    progress.style.transform = "scaleX(1)";
    audio.pause();
    document.querySelector("#replay").focus({ preventScroll: true });
  }
  function togglePause() {
    if (finished) return;
    paused = !paused;
    pauseButton.textContent = paused ? "继续" : "暂停";
    pauseButton.setAttribute("aria-pressed", String(paused));
  }
  function distance() { return viewport.clientHeight + roll.offsetHeight; }
  function paintRoll() {
    roll.style.transform = "translateY(" + (-offset) + "px)";
    progress.style.transform = "scaleX(" + Math.min(1, offset / distance()) + ")";
  }
  function frame(time) {
    const dt = previousTime === null ? 0 : Math.min(100, time - previousTime);
    previousTime = time;
    if (!paused && !document.hidden) {
      elapsed += dt;
      fade = carriedMusic ? 1 : Math.min(1, elapsed / 3500);
      audio.volume = window.TitanSettings.getVolume(musicBase) * fade;
      if (elapsed >= INTRO_DURATION - 1800) opening.classList.add("is-leaving");
      if (elapsed >= INTRO_DURATION) {
        opening.hidden = true;
        offset += SCROLL_SPEED * Math.min(1, window.innerWidth / 700) * dt / 1000;
        paintRoll();
        audio.volume = window.TitanSettings.getVolume(musicBase) * Math.min(1, Math.max(0, (distance() + 70 - offset) / 100));
        if (offset >= distance() + 70) return showFarewell();
      }
    }
    frameId = requestAnimationFrame(frame);
  }
  function start() {
    if (frameId !== null) cancelAnimationFrame(frameId);
    elapsed = 0; offset = 0; previousTime = null; paused = false; finished = false; fade = 0;
    if (!carriedMusic || !firstStart) audio.currentTime = 0;
    firstStart = false;
    if (carriedMusic) fade = 1;
    farewell.hidden = true; viewport.hidden = false; controls.hidden = false;
    opening.hidden = reducedMotion; opening.classList.remove("is-leaving");
    pauseButton.hidden = reducedMotion;
    pauseButton.textContent = "暂停"; pauseButton.setAttribute("aria-pressed", "false");
    roll.style.transform = "translateY(0)"; progress.style.transform = "scaleX(0)";
    viewport.scrollTop = 0;
    if (reducedMotion) {
      fade = 1;
      document.querySelector("#control-hint").textContent = "滚动阅读片尾 · Tab 跳过片尾";
      frameId = null;
    } else frameId = requestAnimationFrame(frame);
    syncAudio();
  }
  pauseButton.addEventListener("click", togglePause);
  document.querySelector("#finish").addEventListener("click", showFarewell);
  document.querySelector("#replay").addEventListener("click", function () { start(); viewport.focus(); });
  document.addEventListener("keydown", function (event) {
    if (finished) return;
    if (event.key === "Tab") { event.preventDefault(); showFarewell(); return; }
    if (event.target.closest("button, a")) return;
    if (event.key === " " && !reducedMotion) { event.preventDefault(); togglePause(); }
    if ((event.key === "ArrowUp" || event.key === "ArrowDown") && !reducedMotion) {
      event.preventDefault(); elapsed = Math.max(elapsed, INTRO_DURATION); opening.hidden = true;
      offset = Math.max(0, Math.min(distance(), offset + (event.key === "ArrowDown" ? 100 : -100)));
      paintRoll();
    }
  });
  document.addEventListener("pointerdown", syncAudio);
  document.addEventListener("keydown", syncAudio);
  window.addEventListener("titan-settings-changed", syncAudio);
  window.addEventListener("pagehide", function () { audio.pause(); cancelAnimationFrame(frameId); });
  document.addEventListener("visibilitychange", function () { previousTime = null; if (document.hidden) audio.pause(); else syncAudio(); });
  start();
}());
