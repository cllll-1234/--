/* NPC 渲染和条件对话选择。 */
(function () {
  "use strict";

  function NpcManager(layer) {
    this.layer = layer;
    this.npcs = [];
  }

  NpcManager.prototype.render = function (npcs, state) {
    const layer = this.layer;
    layer.innerHTML = "";
    this.npcs = (npcs || []).filter(function (config) {
      return !config.visibleWhenFlag || Boolean(state && state.flags[config.visibleWhenFlag]);
    }).map(function (config) {
      const stagedPosition = (config.positionByFlags || []).find(function (position) {
        return state && state.flags[position.flag];
      });
      const alternate = stagedPosition || (config.positionAfterFlag && state && state.flags[config.positionAfterFlag.flag] ? config.positionAfterFlag : null);
      const x = alternate ? alternate.x : config.x;
      const y = alternate ? alternate.y : config.y;
      const element = document.createElement("div");
      element.className = "explore-npc";
      element.dataset.npcId = config.id;
      element.style.left = x + "px";
      element.style.top = y + "px";
      element.style.width = config.width + "px";
      element.style.height = config.height + "px";
      element.setAttribute("role", "button");
      element.setAttribute("aria-label", "与" + config.name + "交谈");
      const sprite = document.createElement("img");
      sprite.className = "npc-sprite";
      sprite.alt = "";
      sprite.draggable = false;
      sprite.addEventListener("load", function () { element.classList.add("sprite-ready"); });
      sprite.addEventListener("error", function () { element.classList.remove("sprite-ready"); });
      if (config.spriteAsset) sprite.src = config.spriteAsset;
      const placeholder = document.createElement("span");
      placeholder.className = "npc-placeholder";
      placeholder.textContent = config.shortName;
      const label = document.createElement("span");
      label.className = "entity-label";
      label.textContent = config.name;
      element.appendChild(sprite);
      element.appendChild(placeholder);
      element.appendChild(label);
      layer.appendChild(element);
      return Object.assign({}, config, { x: x, y: y, element: element });
    });
    return this.npcs;
  };

  NpcManager.prototype.getDialog = function (npc, state) {
    const conditional = (npc.dialogByFlag || []).find(function (entry) {
      const all = entry.allFlags || (entry.flag ? [entry.flag] : []);
      const excluded = entry.notFlags || [];
      return all.every(function (name) { return Boolean(state.flags[name]); }) &&
        excluded.every(function (name) { return !state.flags[name]; });
    });
    if (conditional) return conditional.scene;
    if (npc.dialogAfterFlag && state.flags[npc.dialogAfterFlag.flag]) return npc.dialogAfterFlag.scene;
    return npc.dialog;
  };

  window.TitanNpcManager = NpcManager;
}());
