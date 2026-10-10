/* 街道布道与记忆闪回的轻量演出。缺失音频默认不加载，避免产生资源错误。 */
(function () {
  "use strict";

  const AUDIO_ASSETS = Object.freeze({
    heartbeat: "audio/sfx/heartbeat.mp3",
    tinnitus: "audio/sfx/tinnitus.mp3",
    wind: "audio/sfx/wind.mp3",
    churchBell: "audio/sfx/church_bell.mp3",
    memoryBreathing: "audio/sfx/memory-heavy-breathing.mp3"
  });
  const BLACK_MEMORY_EFFECTS = Object.freeze({
    "flash-start": true,
    "memory-fragment": true,
    "memory-roar": true
  });
  const enabledAudio = Object.create(null);
  let players = [];
  let memoryBreathingPlayer = null;

  function getAudioSettings() {
    return window.TitanSettings ? window.TitanSettings.loadSettings() : { sound: true, volume: 100 };
  }

  function getEffectVolume() {
    return window.TitanSettings ? window.TitanSettings.getVolume(1) : 1;
  }

  function getElements() {
    return {
      stage: document.querySelector("#game-stage"),
      overlay: document.querySelector("#scene-effect-overlay"),
      text: document.querySelector("#scene-effect-text")
    };
  }

  function stopAudio() {
    players.forEach(function (player) {
      if (player.pause) player.pause();
      if (player.removeAttribute) player.removeAttribute("src");
    });
    players = [];
  }

  function stopMemoryBreathing() {
    if (!memoryBreathingPlayer) return;
    if (memoryBreathingPlayer.pause) memoryBreathingPlayer.pause();
    if (memoryBreathingPlayer.removeAttribute) memoryBreathingPlayer.removeAttribute("src");
    memoryBreathingPlayer = null;
  }

  function playMemoryBreathing() {
    if (!getAudioSettings().sound) {
      stopMemoryBreathing();
      return;
    }
    try {
      if (!memoryBreathingPlayer) {
        memoryBreathingPlayer = new Audio(AUDIO_ASSETS.memoryBreathing);
        memoryBreathingPlayer.preload = "auto";
        memoryBreathingPlayer.loop = true;
      }
      memoryBreathingPlayer.volume = window.TitanSettings ? window.TitanSettings.getVolume(0.42) : 0.42;
      const promise = memoryBreathingPlayer.play();
      if (promise && promise.catch) promise.catch(function () { /* 浏览器禁止自动播放时静默退化 */ });
    } catch (error) { /* 音频不可用时保留无声演出 */ }
  }

  function playSynthesizedTitanRoar() {
    if (!getAudioSettings().sound) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      const master = context.createGain();
      const oscillator = context.createOscillator();
      const filter = context.createBiquadFilter();
      const duration = 0.85;
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(92, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(34, context.currentTime + duration);
      filter.type = "lowpass";
      filter.frequency.value = 420;
      master.gain.setValueAtTime(0.0001, context.currentTime);
      master.gain.exponentialRampToValueAtTime(Math.max(0.0001, 0.16 * getEffectVolume()), context.currentTime + 0.06);
      master.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
      oscillator.connect(filter);
      filter.connect(master);
      master.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + duration);
      players.push({ pause: function () {
        try { oscillator.stop(); } catch (error) { /* 已自然结束 */ }
        context.close();
      } });
    } catch (error) { /* 音频上下文不可用时保留无声震动 */ }
  }

  function clear(options) {
    const elements = getElements();
    stopAudio();
    if (!options || !options.keepMemoryBreathing) stopMemoryBreathing();
    if (!elements.stage || !elements.overlay) return;
    Array.from(elements.stage.classList).forEach(function (name) {
      if (name.indexOf("effect-") === 0) elements.stage.classList.remove(name);
    });
    elements.stage.classList.remove("scene-effect-active");
    elements.overlay.hidden = true;
    elements.text.textContent = "";
  }

  function playOptionalAudio(name) {
    if (!getAudioSettings().sound) return;
    if (name === "titanRoar") {
      playSynthesizedTitanRoar();
      return;
    }
    if (!enabledAudio[name] || !AUDIO_ASSETS[name]) return;
    try {
      const player = new Audio(AUDIO_ASSETS[name]);
      player.preload = "auto";
      player.volume = getEffectVolume();
      players.push(player);
      const promise = player.play();
      if (promise && promise.catch) promise.catch(function () { /* 浏览器禁止自动播放时静默退化 */ });
    } catch (error) { /* 音频不可用时保留无声演出 */ }
  }

  function play(scene) {
    const isBlackMemory = Boolean(scene && BLACK_MEMORY_EFFECTS[scene.effect]);
    clear({ keepMemoryBreathing: isBlackMemory });
    if (!scene || !scene.effect) return;
    const elements = getElements();
    if (!elements.stage || !elements.overlay) return;
    elements.stage.classList.add("scene-effect-active", "effect-" + scene.effect);
    elements.text.textContent = scene.text || "";
    elements.overlay.hidden = false;
    if (isBlackMemory) playMemoryBreathing();
    (scene.audio || []).forEach(playOptionalAudio);
  }

  function enableAudio(name) {
    if (AUDIO_ASSETS[name]) enabledAudio[name] = true;
  }

  window.TitanSceneEffects = Object.freeze({
    audioAssets: AUDIO_ASSETS,
    enableAudio: enableAudio,
    play: play,
    clear: clear
  });
}());
