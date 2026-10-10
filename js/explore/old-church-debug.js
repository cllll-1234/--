/* 旧教堂快捷调试：沿用现有 F2 地图调试和交互传送。 */
(function () {
  "use strict";

  function initialize() {
    const query = new URLSearchParams(location.search);
    const map = window.TitanExplore && window.TitanExplore.getCurrentMap();
    if (query.get("churchDebug") !== "1" || !map || map.id !== "oldChurch") return;

    const world = document.querySelector("#explore-world");
    const panel = document.createElement("aside");
    panel.id = "old-church-debug-panel";
    panel.innerHTML = '<strong>旧教堂 · Debug</strong>' +
      '<small>F2：调试总开关与地图编辑｜右侧读数显示坐标和最近交互 ID</small>' +
      '<div id="old-church-debug-toggles"></div><div id="old-church-debug-teleports"></div>';
    document.querySelector("#explore-scene").appendChild(panel);

    const toggles = [
      ["debug-hide-collisions", "碰撞框"],
      ["debug-hide-interactions", "交互范围"],
      ["debug-hide-player-boxes", "玩家逻辑框/脚部框"]
    ];
    toggles.forEach(function (item) {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = true;
      input.addEventListener("change", function () { world.classList.toggle(item[0], !input.checked); });
      label.appendChild(input);
      label.appendChild(document.createTextNode(item[1]));
      panel.querySelector("#old-church-debug-toggles").appendChild(label);
    });

    [
      ["church_exit", "传送：入口"],
      ["church_g17_vial", "传送：祭坛"],
      ["church_bed_straps", "传送：后室"]
    ].forEach(function (item) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = item[1];
      button.addEventListener("click", function () {
        if (!window.TitanExplore.teleportToInteraction(item[0])) {
          window.TitanExplore.showToast("没有找到可站立的传送位置", "warning");
        }
      });
      panel.querySelector("#old-church-debug-teleports").appendChild(button);
    });
  }

  document.addEventListener("DOMContentLoaded", initialize);
}());
