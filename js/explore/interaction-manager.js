/* 统一处理 NPC、线索物件与地图出口交互。 */
(function () {
  "use strict";

  function center(entity) {
    const x = Number.isFinite(entity.worldX) ? entity.worldX : entity.x;
    const y = Number.isFinite(entity.worldY) ? entity.worldY : entity.y;
    return { x: x + entity.width / 2, y: y + entity.height / 2 };
  }

  function isFacing(playerCenter, entityCenter, direction) {
    const dx = entityCenter.x - playerCenter.x;
    const dy = entityCenter.y - playerCenter.y;
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return true;
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? direction === "right" : direction === "left";
    return dy > 0 ? direction === "down" : direction === "up";
  }

  function conditionalScene(target, state) {
    const conditional = (target.dialogByFlag || []).find(function (entry) {
      const all = entry.allFlags || (entry.flag ? [entry.flag] : []);
      const excluded = entry.notFlags || [];
      return all.every(function (name) { return Boolean(state.flags[name]); }) &&
        excluded.every(function (name) { return !state.flags[name]; });
    });
    return conditional ? conditional.scene : (target.targetScene || target.dialog);
  }

  function InteractionManager(manager, npcManager, prompt) {
    this.manager = manager;
    this.npcManager = npcManager;
    this.prompt = prompt;
    this.current = null;
    this.prompt.addEventListener("click", this.interact.bind(this));
  }

  InteractionManager.prototype.update = function (player, map) {
    if (!map || this.manager.getMode() !== "explore") return this.clear();
    const state = this.manager.getState();
    const feet = window.getPlayerFootRect ? window.getPlayerFootRect(player) : player;
    const trigger = (map.triggerZones || []).find(function (zone) {
      if (zone.onceFlag && state.flags[zone.onceFlag]) return false;
      return window.TitanAabbOverlaps ? window.TitanAabbOverlaps(feet, zone) : false;
    });
    if (trigger) {
      this.clear();
      this.manager.triggerZone(trigger);
      return;
    }
    /* 第七维护站按脚部中心计算，避免正式地图上的大尺寸人物贴图让提示提前触发。 */
    const playerCenter = map.id === "seventhMaintenanceStation" ? center(feet) : center(player);
    const controller = this.manager.getPlayerController && this.manager.getPlayerController();
    const facing = controller ? controller.lastDirection : "down";
    const candidates = this.npcManager.npcs.filter(function (npc) { return !npc.interactionDisabled; })
      .concat(map.interactables || [], map.interactionZones || []);
    let nearest = null;
    let nearestScore = Infinity;
    candidates.forEach(function (entity) {
      if (entity.disabledAfterFlag && state.flags[entity.disabledAfterFlag]) return;
      if (entity.visibleWhenFlag && !state.flags[entity.visibleWhenFlag]) return;
      const entityCenter = center(entity);
      const distance = Math.hypot(playerCenter.x - entityCenter.x, playerCenter.y - entityCenter.y);
      const score = distance - (entity.interactionPriority || 0);
      if (entity.requireFacing && !isFacing(playerCenter, entityCenter, facing)) return;
      if (distance <= (entity.interactionDistance || 80) && score < nearestScore) {
        nearest = entity;
        nearestScore = score;
      }
    });
    this.current = nearest;
    this.prompt.hidden = !nearest;
    if (nearest) {
      const text = nearest.prompt || "[E] 与" + nearest.name + "交谈";
      if (this.prompt.dataset.promptText !== text) {
        this.prompt.dataset.promptText = text;
        const keyMatch = text.match(/^\[([^\]]+)\]\s*/);
        if (keyMatch) {
          const key = document.createElement("kbd");
          key.textContent = keyMatch[1];
          const label = document.createElement("span");
          label.className = "interaction-label";
          label.textContent = text.slice(keyMatch[0].length);
          this.prompt.replaceChildren(key, label);
        } else this.prompt.textContent = text;
      }
    }
  };

  InteractionManager.prototype.clear = function () {
    this.current = null;
    this.prompt.hidden = true;
  };

  InteractionManager.prototype.interact = function () {
    const target = this.current;
    if (!target || this.manager.getMode() !== "explore") return;
    const state = this.manager.getState();
    if (target.element) {
      this.manager.startDialog(this.npcManager.getDialog(target, state));
      return;
    }
    const requiredFlags = target.requiredFlags || (target.requiredFlag ? [target.requiredFlag] : []);
    if (requiredFlags.some(function (name) { return !state.flags[name]; })) {
      this.manager.showToast(target.lockedMessage || "这里现在还不能通过。", "warning");
      return;
    }
    if (target.type === "evidence") {
      if (state.flags[target.flag]) {
        this.manager.showToast("公告栏已经调查过了。", "info");
        return;
      }
      this.manager.addEvidence(target.evidenceId);
      this.manager.setFlag(target.flag, true);
      this.manager.showToast(target.message, "evidence");
      this.manager.save();
      return;
    }
    if (target.action === "enterBuilding" || target.type === "building") {
      this.manager.enterBuilding(target.targetMap || target.targetScene || target.id);
      return;
    }
    if (target.action === "startDialog" || target.type === "talk") {
      this.manager.startDialog(conditionalScene(target, state));
      return;
    }
    if (target.type === "inspect") {
      const scene = conditionalScene(target, state);
      if (scene) this.manager.startDialog(scene);
      return;
    }
    if (target.type === "exit") {
      (target.flags || []).forEach(function (name) { this.manager.setFlag(name, true); }, this);
      if (target.objective) this.manager.setObjective(target.objective);
      this.manager.save();
      if (target.targetMap) this.manager.loadMap(target.targetMap, {
        restorePosition: Boolean(target.restoreMapPosition),
        transition: Boolean(target.mapTransition)
      });
      else this.manager.startDialog(conditionalScene(target, state));
    }
  };

  window.TitanInteractionManager = InteractionManager;
}());
