/* 首页菜单音效：UI SFX Cinematic（CC0）。 */
(function () {
  "use strict";

  const SETTINGS_KEY = "TitanStory-settings";
  const paths = Object.freeze({
    hover: "audio/sfx/menu/hover.mp3",
    select: "audio/sfx/menu/select.mp3",
    open: "audio/sfx/menu/open.mp3"
  });
  const volumes = Object.freeze({ hover: 0.22, select: 0.34, open: 0.44 });
  const players = {};

  function soundEnabled() {
    try {
      const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
      return settings.sound !== false;
    } catch (error) {
      return true;
    }
  }

  function getPlayer(name) {
    if (!paths[name]) return null;
    if (!players[name]) {
      const player = new Audio(paths[name]);
      player.preload = "auto";
      player.volume = volumes[name];
      players[name] = player;
    }
    return players[name];
  }

  function play(name) {
    if (!soundEnabled()) return;
    const player = getPlayer(name);
    if (!player) return;
    player.currentTime = 0;
    const promise = player.play();
    if (promise && typeof promise.catch === "function") promise.catch(function () {});
  }

  function bindMenuSounds() {
    const controls = document.querySelectorAll(".home-menu .button");
    controls.forEach(function (control) {
      control.addEventListener("pointerenter", function (event) {
        if (event.pointerType === "touch") return;
        play("hover");
      });
      control.addEventListener("pointerdown", function () {
        play("select");
      });
      control.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") play("select");
      });
    });
  }

  window.TitanMenuSfx = Object.freeze({
    paths: paths,
    play: play
  });

  document.addEventListener("DOMContentLoaded", bindMenuSounds);
}());
