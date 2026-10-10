/* 废弃仓库专用快捷调试面板；地图框架编辑仍由通用 F2 编辑器负责。 */
(function () {
  "use strict";

  const warehouseFlags = [
    "clue_night_carriage", "warehouse_tracks_checked", "clue_missing_people", "clue_g17",
    "clue_dawnbreakers", "visited_warehouse", "talked_old_porter", "porter_night_transport",
    "clue_people_in_carriage", "clue_church_warehouse", "clue_g17_warehouse",
    "clue_seventh_dock", "clue_seventh_dock_code", "hidden_warehouse_dawn",
    "warehouse_full_investigation", "warehouse_table_checked", "warehouse_manifest_unlocked",
    "warehouse_normal_crate_checked"
  ];

  const teleportTargets = [
    ["warehouse_normal_crate", "普通木箱"], ["warehouse_church_crate", "巨壁教木箱"],
    ["warehouse_g17_crate", "G-17药箱"], ["warehouse_rope", "麻绳"],
    ["warehouse_table", "中央桌子"], ["warehouse_manifest", "运输记录"],
    ["warehouse_map", "旧地图"], ["warehouse_dawn_mark", "破晓者标记"],
    ["warehouse_old_porter", "老搬运工"], ["warehouse_tracks", "新车辙"],
    ["warehouse_exit", "出口"]
  ];

  const presets = {
    "初次进入": {},
    "已有深夜马车线索": { clue_night_carriage: true, warehouse_tracks_checked: true },
    "已有失踪人口线索": { clue_missing_people: true },
    "已有旧教堂G-17": { clue_g17: true },
    "已知破晓者": { clue_dawnbreakers: true },
    "已取得运输记录": { warehouse_table_checked: true, warehouse_manifest_unlocked: true, clue_seventh_dock: true },
    "完整调查状态": {
      visited_warehouse: true, warehouse_tracks_checked: true, warehouse_normal_crate_checked: true,
      warehouse_table_checked: true, warehouse_manifest_unlocked: true, talked_old_porter: true,
      porter_night_transport: true, clue_missing_people: true, clue_night_carriage: true,
      clue_g17: true, clue_dawnbreakers: true, clue_people_in_carriage: true,
      clue_church_warehouse: true, clue_g17_warehouse: true, clue_seventh_dock: true,
      clue_seventh_dock_code: true, hidden_warehouse_dawn: true, warehouse_full_investigation: true
    }
  };

  function isActive() {
    const query = new URLSearchParams(location.search);
    const map = window.TitanExplore && window.TitanExplore.getCurrentMap();
    return query.get("debug") === "map" && map && map.id === "warehouse";
  }

  function refreshDerivedFlag(state) {
    state.flags.warehouse_full_investigation = ["clue_g17_warehouse", "clue_seventh_dock", "hidden_warehouse_dawn", "clue_people_in_carriage"]
      .every(function (name) { return Boolean(state.flags[name]); });
  }

  function syncChecks(panel, state) {
    warehouseFlags.forEach(function (name) {
      const input = panel.querySelector('[data-warehouse-flag="' + name + '"]');
      if (input) input.checked = Boolean(state.flags[name]);
    });
  }

  function setPreset(panel, values) {
    const state = window.TitanExplore.getState();
    warehouseFlags.forEach(function (name) { state.flags[name] = false; });
    Object.keys(values).forEach(function (name) { state.flags[name] = Boolean(values[name]); });
    state.flags.slumNightCarriage = Boolean(state.flags.clue_night_carriage);
    refreshDerivedFlag(state);
    syncChecks(panel, state);
    window.TitanExplore.refreshMapState();
  }

  function initialize() {
    if (!isActive()) return;
    const state = window.TitanExplore.getState();
    const panel = document.createElement("aside");
    panel.id = "warehouse-debug-panel";
    panel.innerHTML = '<strong>废弃仓库 · 剧情调试</strong><small>F2：碰撞/框架编辑｜点击地图：显示坐标</small>' +
      '<details open><summary>快速传送</summary><div id="warehouse-debug-teleports"></div></details>' +
      '<details><summary>剧情预设</summary><div id="warehouse-debug-presets"></div></details>' +
      '<details><summary>Flag 开关</summary><div id="warehouse-debug-flags"></div></details>' +
      '<button type="button" id="warehouse-debug-set-spawn">将出生点设为当前位置</button>' +
      '<button type="button" id="warehouse-debug-reset">重置仓库剧情状态</button>';
    document.querySelector("#explore-scene").appendChild(panel);

    const teleportBox = panel.querySelector("#warehouse-debug-teleports");
    teleportTargets.forEach(function (target) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = target[1];
      button.dataset.teleportId = target[0];
      button.addEventListener("click", function () {
        if (!window.TitanExplore.teleportToInteraction(target[0])) window.TitanExplore.showToast("该交互点当前不可传送", "warning");
      });
      teleportBox.appendChild(button);
    });

    const presetBox = panel.querySelector("#warehouse-debug-presets");
    Object.keys(presets).forEach(function (name) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = name;
      button.addEventListener("click", function () { setPreset(panel, presets[name]); });
      presetBox.appendChild(button);
    });

    const flagBox = panel.querySelector("#warehouse-debug-flags");
    warehouseFlags.forEach(function (name) {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.dataset.warehouseFlag = name;
      input.checked = Boolean(state.flags[name]);
      input.addEventListener("change", function () {
        state.flags[name] = input.checked;
        if (name === "clue_night_carriage") state.flags.slumNightCarriage = input.checked;
        if (name !== "warehouse_full_investigation") refreshDerivedFlag(state);
        syncChecks(panel, state);
        window.TitanExplore.refreshMapState();
      });
      label.appendChild(input);
      label.appendChild(document.createTextNode(name));
      flagBox.appendChild(label);
    });

    panel.querySelector("#warehouse-debug-set-spawn").addEventListener("click", function () {
      if (!window.TitanExplore.setDebugSpawnFromPlayer()) window.TitanExplore.showToast("当前无法修改仓库出生点", "warning");
    });
    panel.querySelector("#warehouse-debug-reset").addEventListener("click", function () { setPreset(panel, {}); });
  }

  document.addEventListener("DOMContentLoaded", initialize);
}());
