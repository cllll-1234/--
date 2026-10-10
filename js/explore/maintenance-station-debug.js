/* 第七维护站专用快捷调试面板；几何编辑继续复用通用 F2 编辑器。 */
(function () {
  "use strict";

  function readPanelState(key) {
    try { return JSON.parse(localStorage.getItem("titan_debug_panel:" + key) || "{}"); }
    catch (error) { return {}; }
  }

  function writePanelState(key, state) {
    try { localStorage.setItem("titan_debug_panel:" + key, JSON.stringify(state)); }
    catch (error) { /* Debug布局保存失败不影响地图调试。 */ }
  }

  function getRestoreDock(parent) {
    let dock = parent.querySelector("#debug-panel-restore-dock");
    if (!dock) {
      dock = document.createElement("div");
      dock.id = "debug-panel-restore-dock";
      parent.appendChild(dock);
    }
    return dock;
  }

  function makeMovable(panel, options) {
    if (!panel || panel.dataset.debugPanelBound === "1") return;
    const key = options.key;
    const parent = panel.parentElement;
    const header = panel.querySelector(".debug-panel-header");
    const body = panel.querySelector(".debug-panel-body");
    if (!header || !body || !parent) return;
    panel.dataset.debugPanelBound = "1";

    const controls = document.createElement("span");
    controls.className = "debug-panel-controls";
    controls.innerHTML = '<button type="button" data-panel-action="reset" title="恢复默认位置">↺</button>' +
      '<button type="button" data-panel-action="collapse" title="折叠面板">−</button>' +
      '<button type="button" data-panel-action="hide" title="隐藏面板">×</button>';
    header.appendChild(controls);

    const restore = document.createElement("button");
    restore.type = "button";
    restore.className = "debug-panel-restore";
    function updateToggleLabel() {
      restore.textContent = (panel.hidden ? "显示" : "隐藏") + options.label;
      restore.classList.toggle("is-panel-hidden", panel.hidden);
    }
    getRestoreDock(parent).appendChild(restore);

    function saveLayout() {
      writePanelState(key, {
        left: parseFloat(panel.style.left), top: parseFloat(panel.style.top),
        collapsed: panel.classList.contains("debug-panel-collapsed"),
        hidden: panel.dataset.userHidden === "1"
      });
    }

    function resetPosition() {
      panel.style.left = "";
      panel.style.top = "";
      panel.style.right = "";
      panel.style.bottom = "";
      panel.classList.remove("debug-panel-collapsed");
      panel.dataset.userHidden = "0";
      panel.hidden = false;
      updateToggleLabel();
      localStorage.removeItem("titan_debug_panel:" + key);
    }

    const saved = readPanelState(key);
    if (Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
      panel.style.left = saved.left + "px";
      panel.style.top = saved.top + "px";
      panel.style.right = "auto";
      panel.style.bottom = "auto";
    }
    panel.classList.toggle("debug-panel-collapsed", Boolean(saved.collapsed));
    panel.dataset.userHidden = saved.hidden ? "1" : "0";
    panel.hidden = Boolean(saved.hidden);
    updateToggleLabel();

    controls.addEventListener("click", function (event) {
      const action = event.target.dataset.panelAction;
      if (!action) return;
      event.stopPropagation();
      if (action === "reset") return resetPosition();
      if (action === "collapse") panel.classList.toggle("debug-panel-collapsed");
      if (action === "hide") {
        panel.dataset.userHidden = "1";
        panel.hidden = true;
        updateToggleLabel();
      }
      saveLayout();
    });

    restore.addEventListener("click", function () {
      const show = panel.hidden;
      panel.dataset.userHidden = show ? "0" : "1";
      panel.hidden = !show;
      updateToggleLabel();
      saveLayout();
    });

    header.addEventListener("pointerdown", function (event) {
      if (event.target.closest("button")) return;
      event.preventDefault();
      const parentRect = parent.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const start = { x: event.clientX, y: event.clientY, left: panelRect.left - parentRect.left, top: panelRect.top - parentRect.top };
      panel.style.left = start.left + "px";
      panel.style.top = start.top + "px";
      panel.style.right = "auto";
      panel.style.bottom = "auto";
      panel.classList.add("debug-panel-dragging");
      function move(moveEvent) {
        const left = Math.max(0, Math.min(parent.clientWidth - Math.min(panel.offsetWidth, parent.clientWidth), start.left + moveEvent.clientX - start.x));
        const top = Math.max(0, Math.min(parent.clientHeight - header.offsetHeight, start.top + moveEvent.clientY - start.y));
        panel.style.left = Math.round(left) + "px";
        panel.style.top = Math.round(top) + "px";
      }
      function up() {
        panel.classList.remove("debug-panel-dragging");
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        saveLayout();
      }
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    });
  }

  window.TitanDebugPanels = { makeMovable: makeMovable };

  const chapter3Flags = [
    "visited_seventh_maintenance_station", "clue_g17_station", "chapter3_archive_found",
    "chapter3_archive_puzzle_completed", "clue_personnel_transfer_record", "clue_g17_missing_people",
    "clue_karl_purification", "clue_outside_resource_map", "outsideWorldSafe",
    "hidden_group_induction_record", "foundFounderRecord", "chapter3_core_evidence_complete",
    "chapter3_sealed_room_checked", "chapter3_returned_to_hq"
  ];

  const teleportTargets = [
    ["station_g17_crate", "G-17木箱"],
    ["station_transfer_record", "损坏档案"],
    ["station_karl_archive", "卡尔档案"],
    ["station_outside_map", "墙外资源图"],
    ["station_sealed_room", "封闭房间"],
    ["station_exit", "返回总部出口"]
  ];

  const evidenceIds = [
    "station_g17_crate", "personnel_transfer_record", "karl_purification_record",
    "outside_resource_map", "archive_resource", "group_induction_record", "archive_founder"
  ];

  function isActive() {
    const query = new URLSearchParams(location.search);
    const map = window.TitanExplore && window.TitanExplore.getCurrentMap();
    return query.get("debug") === "map" && map && map.id === "seventhMaintenanceStation";
  }

  function setFlags(values) {
    const state = window.TitanExplore.getState();
    chapter3Flags.forEach(function (name) { state.flags[name] = false; });
    Object.keys(values || {}).forEach(function (name) { state.flags[name] = Boolean(values[name]); });
    if (!state.evidence) state.evidence = [];
    state.evidence = state.evidence.filter(function (id) { return !evidenceIds.includes(id); });
    if (values && values.__allEvidence) {
      evidenceIds.forEach(function (id) { if (!state.evidence.includes(id)) state.evidence.push(id); });
    }
    if (state.minigameResults) state.minigameResults.archivePuzzle = state.flags.chapter3_archive_puzzle_completed ? {
      type: "archivePuzzle", status: "debug", completed: true, success: true
    } : null;
    window.TitanExplore.refreshMapState();
  }

  function initialize() {
    if (!isActive()) return;
    const panel = document.createElement("aside");
    panel.id = "maintenance-station-debug-panel";
    panel.innerHTML = '<div class="debug-panel-header"><strong>第七维护站 · 剧情调试</strong></div>' +
      '<div class="debug-panel-body"><small>拖动标题栏移动｜F2：总开关/坐标编辑</small>' +
      '<details open><summary>显示图层</summary><div id="station-debug-layers"></div></details>' +
      '<details open><summary>快速传送</summary><div id="station-debug-teleports"></div></details>' +
      '<details><summary>剧情状态</summary><div id="station-debug-state"></div></details>' +
      '<a class="station-debug-link" href="debug-archive-restoration.html">打开档案复原 Debug</a>' +
      '<button type="button" id="station-debug-set-spawn">将出生点设为当前位置</button>' +
      '<button type="button" id="station-debug-reset">重置第三章剧情状态</button></div>';
    document.querySelector("#explore-scene").appendChild(panel);
    makeMovable(panel, { key: "maintenance-story", label: "剧情调试器" });

    const world = document.querySelector("#explore-world");
    const layers = [
      ["碰撞框", "debug-hide-collisions"],
      ["交互范围", "debug-hide-interactions"],
      ["玩家碰撞框", "debug-hide-player-boxes"]
    ];
    const layerBox = panel.querySelector("#station-debug-layers");
    layers.forEach(function (entry) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "隐藏" + entry[0];
      button.addEventListener("click", function () {
        const hidden = world.classList.toggle(entry[1]);
        button.textContent = (hidden ? "显示" : "隐藏") + entry[0];
      });
      layerBox.appendChild(button);
    });

    const teleportBox = panel.querySelector("#station-debug-teleports");
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

    const stateBox = panel.querySelector("#station-debug-state");
    const repaired = document.createElement("button");
    repaired.type = "button";
    repaired.id = "station-debug-archive-repaired";
    repaired.textContent = "设置 archiveRepaired = true";
    repaired.addEventListener("click", function () {
      const state = window.TitanExplore.getState();
      state.flags.chapter3_archive_found = true;
      state.flags.chapter3_archive_puzzle_completed = true;
      window.TitanExplore.refreshMapState();
    });
    stateBox.appendChild(repaired);

    const unlock = document.createElement("button");
    unlock.type = "button";
    unlock.id = "station-debug-unlock-all";
    unlock.textContent = "一键解锁全部线索";
    unlock.addEventListener("click", function () {
      setFlags({
        visited_seventh_maintenance_station: true, clue_g17_station: true, chapter3_archive_found: true,
        chapter3_archive_puzzle_completed: true, clue_personnel_transfer_record: true, clue_g17_missing_people: true,
        clue_karl_purification: true, clue_outside_resource_map: true, outsideWorldSafe: true,
        hidden_group_induction_record: true, foundFounderRecord: true, chapter3_core_evidence_complete: true,
        chapter3_sealed_room_checked: true, __allEvidence: true
      });
    });
    stateBox.appendChild(unlock);

    panel.querySelector("#station-debug-set-spawn").addEventListener("click", function () {
      if (!window.TitanExplore.setDebugSpawnFromPlayer()) window.TitanExplore.showToast("当前无法修改第七维护站出生点", "warning");
    });
    panel.querySelector("#station-debug-reset").addEventListener("click", function () { setFlags({}); });
  }

  document.addEventListener("DOMContentLoaded", initialize);
}());
