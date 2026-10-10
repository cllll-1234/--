/* 设置模块：保存文字速度、音乐和音效偏好；没有音频资源时不会创建播放器。 */
(function () {
  "use strict";
  const KEY = "TitanStory-settings";
  const defaults = { textSpeed: 40, music: true, sound: true, volume: 100 };

  function normalizeSettings(settings) {
    const normalized = Object.assign({}, defaults, settings || {});
    normalized.volume = Math.max(0, Math.min(100, Number(normalized.volume) || 0));
    return normalized;
  }

  function loadSettings() {
    try { return normalizeSettings(JSON.parse(localStorage.getItem(KEY)) || {}); }
    catch (error) { return Object.assign({}, defaults); }
  }

  function saveSettings(settings) {
    const normalized = normalizeSettings(settings);
    localStorage.setItem(KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent("titan-settings-changed", { detail: normalized }));
    return normalized;
  }

  function getVolume(baseVolume) {
    const base = typeof baseVolume === "number" ? baseVolume : 1;
    return base * loadSettings().volume / 100;
  }

  function initializeSettingsPage() {
    const form = document.querySelector("#settings-form");
    if (!form) return;
    const speed = form.elements.textSpeed;
    const music = form.elements.music;
    const sound = form.elements.sound;
    const volume = form.elements.volume;
    const speedOutput = document.querySelector("#speed-output");
    const volumeOutput = document.querySelector("#volume-output");

    function fillForm(settings) {
      speed.value = settings.textSpeed;
      music.checked = settings.music;
      sound.checked = settings.sound;
      volume.value = settings.volume;
      speedOutput.textContent = settings.textSpeed + " ms/字";
      volumeOutput.textContent = settings.volume + "%";
    }
    fillForm(loadSettings());
    form.addEventListener("input", function () {
      fillForm(saveSettings({
        textSpeed: Number(speed.value),
        music: music.checked,
        sound: sound.checked,
        volume: Number(volume.value)
      }));
    });
    document.querySelector("#reset-settings").addEventListener("click", function () {
      fillForm(saveSettings(defaults));
    });
  }

  window.TitanSettings = { loadSettings, saveSettings, getVolume };
  document.addEventListener("DOMContentLoaded", initializeSettingsPage);
}());

