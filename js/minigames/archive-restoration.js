/* 第三章档案复原：筛选、拼接、异常标记与推理四阶段小游戏。 */
(function () {
  "use strict";

  const TYPE = "archivePuzzle";
  const DEBUG_KEY = "TitanStory-debug-archive-restoration-v1";
  const CORRECT_IDS = ["dock-a", "dock-b", "dock-c", "dock-d", "dock-e", "dock-f"];
  const ANOMALY_IDS = ["people", "g17", "destination"];
  const SELECTION_ORDER = ["garrison", "dock-c", "ration", "dock-a", "donation", "dock-e", "horses", "dock-b", "stock", "dock-f", "medical", "dock-d"];
  const STAGE_ORDER = { select: 0, puzzle: 1, anomaly: 2, reasoning: 3, complete: 4 };
  const pieces = [
    { id: "dock-a", src: "images/minigames/archive-puzzle/archive_piece_01.png", group: "dock-transfer", correct: true, slot: 0, alt: "第七码头转运记录碎片一" },
    { id: "dock-b", src: "images/minigames/archive-puzzle/archive_piece_02.png", group: "dock-transfer", correct: true, slot: 1, alt: "第七码头转运记录碎片二" },
    { id: "dock-c", src: "images/minigames/archive-puzzle/archive_piece_03.png", group: "dock-transfer", correct: true, slot: 2, alt: "第七码头转运记录碎片三" },
    { id: "dock-d", src: "images/minigames/archive-puzzle/archive_piece_04.png", group: "dock-transfer", correct: true, slot: 3, alt: "第七码头转运记录碎片四" },
    { id: "dock-e", src: "images/minigames/archive-puzzle/archive_piece_05.png", group: "dock-transfer", correct: true, slot: 4, alt: "第七码头转运记录碎片五" },
    { id: "dock-f", src: "images/minigames/archive-puzzle/archive_piece_06.png", group: "dock-transfer", correct: true, slot: 5, alt: "第七码头转运记录碎片六" },
    { id: "garrison", src: "images/minigames/archive-puzzle/archive_decoy_garrison_01.png", group: "garrison-log", correct: false, slot: null, alt: "驻军后勤登记册碎片一" },
    { id: "horses", src: "images/minigames/archive-puzzle/archive_decoy_garrison_02.png", group: "garrison-log", correct: false, slot: null, alt: "驻军后勤登记册碎片二" },
    { id: "ration", src: "images/minigames/archive-puzzle/archive_decoy_supply_01.png", group: "supply-ledger", correct: false, slot: null, alt: "东区物资账册碎片一" },
    { id: "stock", src: "images/minigames/archive-puzzle/archive_decoy_supply_02.png", group: "supply-ledger", correct: false, slot: null, alt: "东区物资账册碎片二" },
    { id: "donation", src: "images/minigames/archive-puzzle/archive_decoy_church_01.png", group: "church-relief", correct: false, slot: null, alt: "教会救济记录碎片一" },
    { id: "medical", src: "images/minigames/archive-puzzle/archive_decoy_church_02.png", group: "church-relief", correct: false, slot: null, alt: "教会救济记录碎片二" }
  ];

  function shuffled(list) {
    const copy = list.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      const value = copy[index]; copy[index] = copy[swap]; copy[swap] = value;
    }
    return copy;
  }

  function pieceAsset(piece) {
    return piece.src;
  }

  function defaultProgress(stage) {
    const target = STAGE_ORDER[stage] === undefined ? "select" : stage;
    return {
      stage: target,
      selected: target === "select" ? [] : CORRECT_IDS.slice(),
      placed: STAGE_ORDER[target] >= STAGE_ORDER.anomaly ? CORRECT_IDS.slice() : [],
      marked: STAGE_ORDER[target] >= STAGE_ORDER.reasoning ? ANOMALY_IDS.slice() : [],
      selectionErrors: 0,
      placementErrors: {},
      order: SELECTION_ORDER.slice(),
      puzzleOrder: shuffled(CORRECT_IDS)
    };
  }

  function copyProgress(source) {
    const base = defaultProgress(source && source.stage);
    if (!source || typeof source !== "object") return base;
    ["selected", "placed", "marked", "order", "puzzleOrder"].forEach(function (key) {
      if (Array.isArray(source[key])) base[key] = source[key].slice();
    });
    base.selectionErrors = Number(source.selectionErrors) || 0;
    base.placementErrors = source.placementErrors && typeof source.placementErrors === "object" ? Object.assign({}, source.placementErrors) : {};
    return base;
  }

  function createOverlay() {
    const overlay = document.createElement("section");
    overlay.className = "archive-game-overlay";
    overlay.setAttribute("aria-label", "档案复原小游戏");
    overlay.innerHTML = '<div class="archive-game-shell"><header class="archive-game-header">' +
      '<div class="archive-game-title"><small>CHAPTER 03 / ARCHIVE RESTORATION</small><strong>第七码头转运记录</strong></div>' +
      '<span class="archive-game-progress" aria-live="polite"></span>' +
      '<button class="archive-game-exit" type="button">暂时离开</button></header>' +
      '<main class="archive-game-stage"></main></div>';
    document.body.appendChild(overlay);
    return overlay;
  }

  function stageLabel(stage) {
    return { select: "阶段一 · 筛选碎片", puzzle: "阶段二 · 拼接档案", anomaly: "阶段三 · 标记异常", reasoning: "阶段四 · 推理确认", complete: "复原完成" }[stage];
  }

  function ArchiveGame(context, resolve) {
    this.context = context || {};
    this.debug = Boolean(this.context.debug);
    this.resolve = resolve;
    this.finished = false;
    this.overlay = createOverlay();
    this.stageElement = this.overlay.querySelector(".archive-game-stage");
    this.progressElement = this.overlay.querySelector(".archive-game-progress");
    this.dragCleanup = null;
    this.stageTimer = null;
    this.liveState = !this.debug && window.getTitanGameState ? window.getTitanGameState() : null;
    this.progress = this.loadProgress();
    this.boundKeydown = this.onKeydown.bind(this);
    document.addEventListener("keydown", this.boundKeydown);
    this.overlay.querySelector(".archive-game-exit").addEventListener("click", this.exit.bind(this));
    this.persist();
    this.render();
  }

  ArchiveGame.prototype.loadProgress = function () {
    if (this.context.debugStage) return defaultProgress(this.context.debugStage);
    if (this.debug) {
      try { return copyProgress(JSON.parse(localStorage.getItem(DEBUG_KEY) || "null")); }
      catch (error) { return defaultProgress("select"); }
    }
    const saved = this.liveState && this.liveState.minigameResults && this.liveState.minigameResults.archivePuzzle;
    if (saved && saved.progress && !saved.success) return copyProgress(saved.progress);
    return defaultProgress("select");
  };

  ArchiveGame.prototype.persist = function () {
    if (this.debug) {
      try { localStorage.setItem(DEBUG_KEY, JSON.stringify(this.progress)); } catch (error) { /* Debug降级为内存进度。 */ }
      return;
    }
    const state = this.liveState;
    if (!state) return;
    const level = STAGE_ORDER[this.progress.stage];
    state.flags.archive_game_started = true;
    state.flags.archive_fragments_selected = level >= STAGE_ORDER.puzzle;
    state.flags.archive_puzzle_completed = level >= STAGE_ORDER.anomaly;
    state.flags.chapter3_archive_puzzle_completed = level >= STAGE_ORDER.complete;
    state.flags.archive_anomalies_marked = level >= STAGE_ORDER.reasoning;
    state.flags.archive_reasoning_completed = level >= STAGE_ORDER.complete;
    state.flags.archive_game_completed = level >= STAGE_ORDER.complete;
    state.flags.has_dock_transfer_record = level >= STAGE_ORDER.complete;
    state.minigameResults.archivePuzzle = {
      type: TYPE,
      status: level >= STAGE_ORDER.complete ? "completed" : "in_progress",
      completed: level >= STAGE_ORDER.complete,
      success: level >= STAGE_ORDER.complete,
      progress: copyProgress(this.progress)
    };
    if (level >= STAGE_ORDER.complete && !state.evidence.includes("dock_transfer_record")) state.evidence.push("dock_transfer_record");
    if (window.TitanSave) window.TitanSave.saveGame(state);
  };

  ArchiveGame.prototype.setStage = function (stage) {
    this.progress.stage = stage;
    this.persist();
    this.render();
  };

  ArchiveGame.prototype.render = function () {
    if (this.dragCleanup) { this.dragCleanup(); this.dragCleanup = null; }
    if (this.stageTimer) { clearTimeout(this.stageTimer); this.stageTimer = null; }
    this.progressElement.textContent = stageLabel(this.progress.stage);
    if (this.progress.stage === "select") this.renderSelection();
    else if (this.progress.stage === "puzzle") this.renderPuzzle();
    else if (this.progress.stage === "anomaly") this.renderAnomalies();
    else if (this.progress.stage === "reasoning") this.renderReasoning();
    else this.renderComplete();
  };

  ArchiveGame.prototype.renderSelection = function () {
    const game = this;
    this.stageElement.innerHTML = '<section class="archive-stage-panel archive-selection-stage">' +
      '<div class="archive-desk-details" aria-hidden="true"><i class="archive-lamp-glow"></i><i class="archive-old-pen"></i><i class="archive-ink-stain"></i><i class="archive-paper-scrap scrap-one"></i><i class="archive-paper-scrap scrap-two"></i><i class="archive-folder-corner"></i></div>' +
      '<header class="archive-selection-header"><p class="archive-selection-status">阶段 1 / 4　<span>档案筛选</span>　已选 <b id="archive-selected-count">0</b> / 6</p>' +
      '<h1 class="archive-stage-heading">档案筛选</h1><p class="archive-selection-subtitle">从废弃文件中找出属于同一份记录的六张碎片</p>' +
      '<p class="archive-stage-copy">比较编号、纸张、文字关联和印章残片。</p></header>' +
      '<div class="archive-piece-grid" aria-label="十二张档案碎片"></div>' +
      '<aside class="archive-hange-hint" role="status"><img src="images/characters/dialog/hange_normal.png" alt="韩吉"><div><strong>韩吉</strong><p>先别急着看文字。编号、纸张和印章，也许比内容更可靠。</p></div></aside>' +
      '<div class="archive-stage-actions"><button class="archive-action primary" type="button" disabled>确认筛选</button></div></section>';
    const grid = this.stageElement.querySelector(".archive-piece-grid");
    const counter = this.stageElement.querySelector("#archive-selected-count");
    const confirm = this.stageElement.querySelector(".archive-action");
    const actions = this.stageElement.querySelector(".archive-stage-actions");
    const feedback = this.stageElement.querySelector(".archive-hange-hint p");
    let wasReady = game.progress.selected.length === 6;
    function update() {
      counter.textContent = game.progress.selected.length;
      const ready = game.progress.selected.length === 6;
      confirm.disabled = !ready;
      actions.classList.toggle("is-ready", ready);
      if (ready && !wasReady) {
        confirm.classList.remove("is-ready-pulse");
        void confirm.offsetWidth;
        confirm.classList.add("is-ready-pulse");
        setTimeout(function () { confirm.classList.remove("is-ready-pulse"); }, 620);
      }
      wasReady = ready;
    }
    this.progress.order.forEach(function (id) {
      const piece = pieces.find(function (item) { return item.id === id; });
      const button = document.createElement("button");
      button.type = "button";
      button.className = "archive-fragment" + (game.progress.selected.includes(id) ? " is-selected" : "");
      button.dataset.pieceId = id;
      button.dataset.group = piece.group;
      button.dataset.correct = String(piece.correct);
      button.setAttribute("aria-pressed", String(game.progress.selected.includes(id)));
      button.innerHTML = '<span class="archive-paper-surface archive-real-piece-surface"><img src="' + pieceAsset(piece) + '" alt="' + piece.alt + '"><span class="archive-selected-badge" aria-hidden="true">已选</span></span>';
      button.addEventListener("click", function () {
        const index = game.progress.selected.indexOf(id);
        if (index >= 0) game.progress.selected.splice(index, 1);
        else if (game.progress.selected.length < 6) game.progress.selected.push(id);
        else { feedback.textContent = "一次只能拿出六张。先放回一张，再继续比对。"; return; }
        button.classList.toggle("is-selected", game.progress.selected.includes(id));
        button.setAttribute("aria-pressed", String(game.progress.selected.includes(id)));
        game.persist(); update();
      });
      grid.appendChild(button);
    });
    confirm.addEventListener("click", function () {
      const wrong = game.progress.selected.filter(function (id) { return !CORRECT_IDS.includes(id); });
      if (!wrong.length && CORRECT_IDS.every(function (id) { return game.progress.selected.includes(id); })) {
        game.progress.selected = CORRECT_IDS.slice();
        game.setStage("puzzle");
        return;
      }
      game.progress.selectionErrors += 1;
      game.progress.selected = game.progress.selected.filter(function (id) { return CORRECT_IDS.includes(id); });
      feedback.textContent = game.progress.selectionErrors === 1
        ? "这几张纸并不是来自同一份档案。看看编号的写法。"
        : game.progress.selectionErrors === 2
          ? "注意暗红印章的圆弧。如果原本属于同一枚印章，它们应该能够接起来。"
          : "目标档案的编号和07-24有关，先从编号入手。";
      wrong.forEach(function (id) {
        const element = grid.querySelector('[data-piece-id="' + id + '"]');
        if (element) {
          element.classList.remove("is-selected"); element.classList.add("is-error"); element.setAttribute("aria-pressed", "false");
          setTimeout(function () { element.classList.remove("is-error"); }, 420);
        }
      });
      if (game.progress.selectionErrors >= 3) {
        const missing = CORRECT_IDS.find(function (id) { return !game.progress.selected.includes(id); });
        const clue = missing && grid.querySelector('[data-piece-id="' + missing + '"]');
        if (clue) {
          clue.classList.add("is-gentle-hint");
          setTimeout(function () { clue.classList.remove("is-gentle-hint"); }, 1050);
        }
      }
      game.persist(); update();
    });
    update();
  };

  ArchiveGame.prototype.tryPlace = function (pieceId, slotIndex, feedback) {
    const piece = pieces.find(function (item) { return item.id === pieceId; });
    if (!piece || this.progress.placed.includes(pieceId)) return;
    if (piece.slot !== slotIndex) {
      const slot = this.stageElement.querySelector('[data-slot="' + slotIndex + '"]');
      if (slot) { slot.classList.add("is-wrong"); setTimeout(function () { slot.classList.remove("is-wrong"); }, 260); }
      const count = (this.progress.placementErrors[pieceId] || 0) + 1;
      this.progress.placementErrors[pieceId] = count;
      if (count >= 2) {
        const row = piece.slot < 3 ? "top" : "bottom";
        const puzzleStage = this.stageElement;
        this.stageElement.querySelectorAll(".archive-slot").forEach(function (candidate) {
          if ((Number(candidate.dataset.slot) < 3 ? "top" : "bottom") === row) candidate.classList.add("is-row-hint");
        });
        setTimeout(function () {
          puzzleStage.querySelectorAll(".archive-slot.is-row-hint").forEach(function (candidate) { candidate.classList.remove("is-row-hint"); });
        }, 850);
      }
      if (count >= 3) {
        const position = ["左侧", "中间", "右侧"][piece.slot % 3];
        feedback.textContent = "这张碎片位于档案的" + position + "。折痕和断口还会延伸到相邻碎片。";
      } else if (count === 2 && [2, 4, 5].includes(piece.slot)) {
        feedback.textContent = "这块印章残痕应该还能接上另一部分。";
      } else if (count === 2) {
        feedback.textContent = "折痕没有在这里结束，它应该延伸到相邻的碎片。";
      } else {
        feedback.textContent = "别只看文字。纸张的断口也能说明它原来的位置。";
      }
      this.persist();
      return;
    }
    delete this.progress.placementErrors[pieceId];
    this.progress.placed.push(pieceId);
    this.persist();
    this.renderPuzzle();
  };

  ArchiveGame.prototype.renderPuzzle = function () {
    const game = this;
    const completed = this.progress.placed.length === 6;
    this.stageElement.innerHTML = '<section class="archive-stage-panel archive-puzzle-stage"><header class="archive-puzzle-header"><h1 class="archive-stage-heading">拼接《第七码头转运记录》</h1>' +
      '<p class="archive-stage-copy">依据文字断句、折痕、撕裂边缘和印章残痕，还原这张横向档案。</p>' +
      '<p class="archive-counter">档案复原度：' + this.progress.placed.length + ' / 6</p></header><div class="archive-puzzle-layout">' +
      '<div class="archive-slot-board" aria-label="连续档案拼接区域"></div>' +
      '<aside class="archive-piece-tray" aria-label="待拼接碎片"><strong>待拼接碎片</strong></aside></div>' +
      '<aside class="archive-puzzle-hint" role="status"><img src="images/characters/dialog/hange_normal.png" alt="韩吉"><div><strong>韩吉</strong><p>' +
      (completed ? "很好。文字、折痕和印章都接起来了。" : "别只看文字。纸张的断口也能说明它原来的位置。") + '</p></div></aside></section>';
    const board = this.stageElement.querySelector(".archive-slot-board");
    const tray = this.stageElement.querySelector(".archive-piece-tray");
    const feedback = this.stageElement.querySelector(".archive-puzzle-hint p");
    let activeId = null;

    function pieceElement(piece, locked) {
      const element = document.createElement("button");
      element.type = "button";
      element.className = "archive-puzzle-piece archive-puzzle-piece-" + piece.slot + (locked ? " is-locked" : "");
      element.dataset.pieceId = piece.id;
      element.dataset.targetRow = piece.slot < 3 ? "top" : "bottom";
      element.dataset.targetColumn = ["left", "middle", "right"][piece.slot % 3];
      element.innerHTML = '<img class="archive-puzzle-image" src="' + pieceAsset(piece) + '" alt="' + piece.alt + '">';
      if (!locked) element.addEventListener("click", function () {
        activeId = activeId === piece.id ? null : piece.id;
        tray.querySelectorAll(".archive-puzzle-piece").forEach(function (node) { node.classList.toggle("is-active", node.dataset.pieceId === activeId); });
      });
      return element;
    }

    for (let index = 0; index < 6; index += 1) {
      const slot = document.createElement("div");
      slot.className = "archive-slot";
      slot.dataset.slot = index;
      const lockedId = this.progress.placed.find(function (id) { return pieces.find(function (piece) { return piece.id === id; }).slot === index; });
      if (lockedId) slot.appendChild(pieceElement(pieces.find(function (piece) { return piece.id === lockedId; }), true));
      slot.addEventListener("click", function () { if (activeId) game.tryPlace(activeId, index, feedback); });
      board.appendChild(slot);
    }

    this.progress.puzzleOrder.filter(function (id) { return !game.progress.placed.includes(id); }).forEach(function (id) {
      const piece = pieces.find(function (item) { return item.id === id; });
      const element = pieceElement(piece, false);
      element.addEventListener("pointerdown", function (event) {
        if (event.button !== undefined && event.button !== 0) return;
        event.preventDefault();
        activeId = id;
        const ghost = element.cloneNode(true);
        ghost.className = "archive-puzzle-piece is-dragging";
        document.body.appendChild(ghost);
        element.style.opacity = ".3";
        function move(moveEvent) { ghost.style.left = moveEvent.clientX - 75 + "px"; ghost.style.top = moveEvent.clientY - 55 + "px"; }
        function cleanup() {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
          if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
          element.style.opacity = "";
        }
        function up(upEvent) {
          const target = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
          const slot = target && target.closest(".archive-slot");
          cleanup(); game.dragCleanup = null;
          if (slot) game.tryPlace(id, Number(slot.dataset.slot), feedback);
        }
        game.dragCleanup = cleanup;
        move(event);
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
      });
      tray.appendChild(element);
    });
    if (completed) {
      board.classList.add("is-completing");
      const banner = document.createElement("p");
      banner.className = "archive-puzzle-complete";
      banner.textContent = "档案复原完成";
      board.appendChild(banner);
      this.stageTimer = setTimeout(function () { game.setStage("anomaly"); }, 1050);
    }
  };

  ArchiveGame.prototype.documentHtml = function (interactive) {
    const marked = this.progress.marked;
    const lines = [
      ["batch", "批次：07-24"], ["source", "来源区域：地下街东区"], ["people", "转运人数：18"],
      ["process", "处理方式：净化"], ["g17", "G-17消耗：18单位"], ["destination", "后续地点：投放区A"]
    ];
    return '<article class="archive-document archive-restored-document"><h2 class="archive-visually-hidden">第七码头转运记录</h2><div class="archive-document-lines">' + lines.map(function (line) {
      return '<button type="button" class="archive-document-line' + (marked.includes(line[0]) ? " is-marked" : "") + '" data-line-id="' + line[0] + '"' + (interactive ? "" : " disabled") + '>' + line[1] + '</button>';
    }).join("") + '</div></article>';
  };

  ArchiveGame.prototype.renderAnomalies = function () {
    const game = this;
    this.stageElement.innerHTML = '<section class="archive-stage-panel archive-anomaly-stage"><h1 class="archive-stage-heading">请标记最值得注意的三处信息</h1>' +
      '<p class="archive-stage-copy">不要急着下结论。先找出能串联失踪者、G-17和最终去向的记录。</p>' +
      '<p class="archive-counter">已标记：' + this.progress.marked.length + ' / 3</p><div class="archive-document-wrap">' + this.documentHtml(true) +
      '<p class="archive-feedback" role="status"></p></div></section>';
    const feedback = this.stageElement.querySelector(".archive-feedback");
    const dialogue = {
      people: "莱纳：十八个人……",
      g17: "韩吉：人数和药剂数量完全一致。\n莱纳：一人一份。",
      destination: "莱纳：接受‘净化’以后，他们没有被释放。\n韩吉：而是被送去了某个投放区。"
    };
    this.stageElement.querySelectorAll(".archive-document-line").forEach(function (button) {
      button.addEventListener("click", function () {
        const id = button.dataset.lineId;
        if (!ANOMALY_IDS.includes(id)) {
          button.classList.remove("is-wrong"); void button.offsetWidth; button.classList.add("is-wrong");
          feedback.textContent = "这部分暂时无法说明失踪者的去向。";
          feedback.className = "archive-feedback is-warning";
          return;
        }
        if (game.progress.marked.includes(id)) return;
        game.progress.marked.push(id);
        button.classList.add("is-marked");
        feedback.textContent = dialogue[id];
        feedback.className = "archive-feedback is-dialogue";
        game.persist();
        const counter = game.stageElement.querySelector(".archive-counter");
        counter.textContent = "已标记：" + game.progress.marked.length + " / 3";
        if (game.progress.marked.length === 3) {
          const action = document.createElement("button");
          action.type = "button"; action.className = "archive-action primary"; action.textContent = "进行最终推理";
          action.addEventListener("click", function () { game.setStage("reasoning"); });
          game.stageElement.querySelector(".archive-document-wrap").appendChild(action);
        }
      });
    });
    if (this.progress.marked.length === 3) {
      const action = document.createElement("button");
      action.type = "button"; action.className = "archive-action primary"; action.textContent = "进行最终推理";
      action.addEventListener("click", function () { game.setStage("reasoning"); });
      this.stageElement.querySelector(".archive-document-wrap").appendChild(action);
    }
  };

  ArchiveGame.prototype.renderReasoning = function () {
    const game = this;
    const options = [
      ["A", "G-17只是普通镇静剂"],
      ["B", "地下街居民被集中送往某个危险处理流程"],
      ["C", "第七码头只是普通物资仓库"],
      ["D", "失踪人口已经被确认死亡"]
    ];
    this.stageElement.innerHTML = '<section class="archive-stage-panel archive-reasoning-stage"><h1 class="archive-stage-heading">根据现有记录，最合理的判断是什么？</h1>' +
      '<p class="archive-stage-copy">当前证据只能支持有限结论，不要越过档案中实际写明的信息。</p><div class="archive-reasoning">' +
      '<div>' + this.documentHtml(false) + '</div><div><div class="archive-choice-list"></div><p class="archive-feedback" role="status"></p></div></div></section>';
    const list = this.stageElement.querySelector(".archive-choice-list");
    const feedback = this.stageElement.querySelector(".archive-feedback");
    options.forEach(function (option) {
      const button = document.createElement("button");
      button.type = "button"; button.className = "archive-choice"; button.textContent = option[0] + ". " + option[1];
      button.addEventListener("click", function () {
        if (option[0] !== "B") {
          button.classList.remove("is-error"); void button.offsetWidth; button.classList.add("is-error");
          feedback.textContent = "韩吉：现在还不能直接下这个结论。再看看人数、药剂和‘投放’三个词之间的关系。";
          feedback.className = "archive-feedback is-warning";
          return;
        }
        game.setStage("complete");
      });
      list.appendChild(button);
    });
  };

  ArchiveGame.prototype.renderComplete = function () {
    const game = this;
    this.persist();
    this.stageElement.innerHTML = '<section class="archive-stage-panel archive-complete-card"><article><p class="archive-complete-stamp">档案复原完成</p>' +
      '<h2>获得关键证据</h2><p>《第七码头转运记录》</p><p class="archive-stage-copy">记录证明地下街居民被集中转运，并逐一使用G-17，随后送往“投放区A”。真正的最终处理仍然未知。</p>' +
      (this.debug ? '<p class="archive-debug-note">Debug状态不会写入正式存档。</p>' : "") +
      '<button class="archive-action primary" type="button">' + (this.debug ? "返回Debug控制台" : "继续剧情") + '</button></article></section>';
    this.stageElement.querySelector(".archive-action").addEventListener("click", function () { game.complete(); });
  };

  ArchiveGame.prototype.complete = function () {
    if (this.finished) return;
    this.finished = true;
    this.persist();
    this.destroy();
    this.resolve({
      type: TYPE, status: "completed", completed: true, success: true,
      flags: ["archive_game_started", "archive_fragments_selected", "archive_puzzle_completed", "chapter3_archive_puzzle_completed",
        "archive_anomalies_marked", "archive_reasoning_completed", "archive_game_completed", "has_dock_transfer_record"],
      evidence: ["dock_transfer_record"], progress: copyProgress(this.progress)
    });
  };

  ArchiveGame.prototype.exit = function () {
    if (this.finished) return;
    this.finished = true;
    this.persist();
    this.destroy();
    this.resolve({ type: TYPE, status: "paused", completed: false, success: false, progress: copyProgress(this.progress) });
  };

  ArchiveGame.prototype.onKeydown = function (event) { if (event.key === "Escape") this.exit(); };

  ArchiveGame.prototype.destroy = function () {
    if (this.dragCleanup) this.dragCleanup();
    if (this.stageTimer) clearTimeout(this.stageTimer);
    document.removeEventListener("keydown", this.boundKeydown);
    if (this.overlay.parentNode) this.overlay.parentNode.removeChild(this.overlay);
  };

  function start(context) {
    return new Promise(function (resolve) { new ArchiveGame(context || {}, resolve); });
  }

  function startArchiveRestorationGame(options) {
    const settings = options || {};
    return start(settings).then(function (result) {
      if (result.success && typeof settings.onComplete === "function") settings.onComplete(result);
      if (!result.success && typeof settings.onExit === "function") settings.onExit(result);
      return result;
    });
  }

  function clearDebugProgress() { try { localStorage.removeItem(DEBUG_KEY); } catch (error) { /* 无可清理。 */ } }

  window.TitanArchiveRestoration = Object.freeze({
    type: TYPE,
    start: start,
    startArchiveRestorationGame: startArchiveRestorationGame,
    startDebug: function (stage) { return start({ debug: true, debugStage: stage || "select" }); },
    clearDebugProgress: clearDebugProgress,
    correctPieceIds: CORRECT_IDS.slice(),
    anomalyIds: ANOMALY_IDS.slice()
  });
  window.startArchiveRestorationGame = startArchiveRestorationGame;
  if (window.TitanChapter3ArchivePuzzle) window.TitanChapter3ArchivePuzzle.register(start);
  else if (window.TitanMinigames) window.TitanMinigames.registerMiniGame(TYPE, start);
}());
