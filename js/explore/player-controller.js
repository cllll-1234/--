/* 连续四方向移动、AABB 碰撞、地图边界和移动端长按控制。 */
(function () {
  "use strict";

  const KEY_DIRECTIONS = {
    ArrowUp: "up", w: "up", W: "up",
    ArrowDown: "down", s: "down", S: "down",
    ArrowLeft: "left", a: "left", A: "left",
    ArrowRight: "right", d: "right", D: "right"
  };

  const PLAYER_SIZE = Object.freeze({
    width: 44,
    height: 56,
    spriteWidth: 92,
    spriteHeight: 92,
    footWidth: 30,
    footHeight: 17,
    footOffsetX: 7,
    footOffsetY: 38
  });

  function overlaps(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  function getPlayerFootRect(position) {
    const worldX = Number.isFinite(position.worldX) ? position.worldX : position.x;
    const worldY = Number.isFinite(position.worldY) ? position.worldY : position.y;
    return {
      x: worldX + PLAYER_SIZE.footOffsetX,
      y: worldY + PLAYER_SIZE.footOffsetY,
      width: PLAYER_SIZE.footWidth,
      height: PLAYER_SIZE.footHeight
    };
  }

  function PlayerController(element, interactionManager) {
    this.element = element;
    this.spriteElement = element.querySelector(".player-sprite");
    this.interactionManager = interactionManager;
    this.map = null;
    this.worldX = 0;
    this.worldY = 0;
    this.width = PLAYER_SIZE.width;
    this.height = PLAYER_SIZE.height;
    this.spriteWidth = PLAYER_SIZE.spriteWidth;
    this.spriteHeight = PLAYER_SIZE.spriteHeight;
    this.footWidth = PLAYER_SIZE.footWidth;
    this.footHeight = PLAYER_SIZE.footHeight;
    this.position = {
      width: this.width, height: this.height,
      spriteWidth: this.spriteWidth, spriteHeight: this.spriteHeight,
      footWidth: this.footWidth, footHeight: this.footHeight
    };
    const controller = this;
    Object.defineProperties(this.position, {
      x: { enumerable: true, get: function () { return controller.worldX; }, set: function (value) { controller.worldX = value; } },
      y: { enumerable: true, get: function () { return controller.worldY; }, set: function (value) { controller.worldY = value; } },
      worldX: { enumerable: true, get: function () { return controller.worldX; }, set: function (value) { controller.worldX = value; } },
      worldY: { enumerable: true, get: function () { return controller.worldY; }, set: function (value) { controller.worldY = value; } }
    });
    this.speed = 215;
    this.active = false;
    this.keys = Object.create(null);
    this.directionOrder = [];
    this.lastDirection = "down";
    this.assets = null;
    this.loadedAssets = null;
    this.preloadedSprites = [];
    this.animationTime = 0;
    this.walkFrame = 1;
    this.lastTime = 0;
    this.frame = 0;
    this.onMove = null;
    this.bindControls();
  }

  PlayerController.prototype.bindControls = function () {
    const controller = this;
    document.addEventListener("keydown", function (event) {
      const direction = KEY_DIRECTIONS[event.key];
      if (direction && controller.active) {
        event.preventDefault();
        controller.setDirectionPressed(direction, true);
      }
      if ((event.key === "e" || event.key === "E") && controller.active && !event.repeat) {
        event.preventDefault();
        controller.interactionManager.interact();
      }
    });
    document.addEventListener("keyup", function (event) {
      const direction = KEY_DIRECTIONS[event.key];
      if (direction) controller.setDirectionPressed(direction, false);
    });
    document.querySelectorAll("[data-direction]").forEach(function (button) {
      const direction = button.dataset.direction;
      const press = function (event) {
        event.preventDefault();
        if (!controller.active) return;
        controller.setDirectionPressed(direction, true);
        if (button.setPointerCapture && event.pointerId !== undefined) button.setPointerCapture(event.pointerId);
      };
      const release = function (event) {
        event.preventDefault();
        controller.setDirectionPressed(direction, false);
      };
      button.addEventListener("pointerdown", press);
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("lostpointercapture", release);
    });
    const interactButton = document.querySelector("#mobile-interact");
    if (interactButton) interactButton.addEventListener("click", function () { controller.interactionManager.interact(); });
    window.addEventListener("blur", function () { controller.clearKeys(); });
    document.addEventListener("visibilitychange", function () { if (document.hidden) controller.clearKeys(); });
  };

  PlayerController.prototype.setDirectionPressed = function (direction, pressed) {
    if (pressed) {
      // 长按产生的重复事件不改变方向优先级。
      if (!this.keys[direction]) this.directionOrder.push(direction);
      this.keys[direction] = true;
    } else {
      this.keys[direction] = false;
      this.directionOrder = this.directionOrder.filter(function (name) { return name !== direction; });
    }
  };

  PlayerController.prototype.clearKeys = function () {
    this.keys = Object.create(null);
    this.directionOrder = [];
  };

  PlayerController.prototype.setMap = function (map) {
    this.map = map;
    this.assets = map.playerAssets || null;
    // 提前缓存完整循环，第一次切帧也能保持连贯。
    if (this.assets && this.loadedAssets !== this.assets) {
      this.loadedAssets = this.assets;
      this.preloadedSprites = [];
      Object.keys(this.assets).forEach(function (key) {
        const value = this.assets[key];
        const sources = Array.isArray(value) ? value : [value];
        sources.forEach(function (source) {
          const image = new Image();
          image.src = source;
          this.preloadedSprites.push(image);
        }, this);
      }, this);
    }
    const state = this.interactionManager && this.interactionManager.manager.getState();
    const stagedStart = (map.playerStartByFlag || []).find(function (position) {
      return state && state.flags[position.flag];
    });
    const start = stagedStart || map.spawn || map.playerStart;
    this.setWorldPosition(start.x, start.y);
    this.render();
    if (this.onMove) this.onMove(this.position, this.map);
    this.interactionManager.update(this.position, this.map);
  };

  PlayerController.prototype.setWorldPosition = function (worldX, worldY) {
    this.worldX = worldX;
    this.worldY = worldY;
  };

  PlayerController.prototype.getPlayerFootRect = function (position) {
    return getPlayerFootRect(position || this.position);
  };

  PlayerController.prototype.setOnMove = function (callback) {
    this.onMove = typeof callback === "function" ? callback : null;
  };

  PlayerController.prototype.setActive = function (active) {
    this.active = Boolean(active);
    if (!this.active) this.clearKeys();
    if (this.active && !this.frame) {
      this.lastTime = performance.now();
      this.frame = requestAnimationFrame(this.loop.bind(this));
    }
  };

  PlayerController.prototype.canOccupy = function (candidate) {
    if (!this.map) return false;
    const feet = getPlayerFootRect(candidate);
    if (feet.x < 0 || feet.y < 0 || feet.x + feet.width > this.map.width || feet.y + feet.height > this.map.height) return false;
    return !this.map.collisions.some(function (obstacle) { return overlaps(feet, obstacle); });
  };

  PlayerController.prototype.update = function (deltaSeconds) {
    if (!this.active || !this.map) return;
    const direction = this.directionOrder[this.directionOrder.length - 1];
    if (direction) {
      // 移动、动画和停止后的朝向共用当前仍按住的方向。
      if (this.lastDirection !== direction) {
        this.animationTime = 0;
        this.walkFrame = 1;
      }
      this.lastDirection = direction;
      const distance = this.speed * Math.min(deltaSeconds, 0.05);
      const candidate = { worldX: this.worldX, worldY: this.worldY };
      if (direction === "up") candidate.worldY -= distance;
      if (direction === "down") candidate.worldY += distance;
      if (direction === "left") candidate.worldX -= distance;
      if (direction === "right") candidate.worldX += distance;
      if (this.canOccupy(candidate)) {
        this.setWorldPosition(candidate.worldX, candidate.worldY);
        const suffix = direction.charAt(0).toUpperCase() + direction.slice(1);
        const cycle = this.assets && this.assets["walk" + suffix];
        const count = Array.isArray(cycle) ? cycle.length : 2;
        const frameDuration = Array.isArray(cycle) ? (count <= 2 ? 0.14 : 0.08) : 0.18;
        this.animationTime = (this.animationTime + Math.min(deltaSeconds, 0.05)) % (count * frameDuration);
        this.walkFrame = Math.floor(this.animationTime / frameDuration) + 1;
        this.element.classList.add("is-moving");
      } else {
        this.animationTime = 0;
        this.walkFrame = 1;
        this.element.classList.remove("is-moving");
      }
      this.element.dataset.direction = direction;
    } else {
      this.animationTime = 0;
      this.walkFrame = 1;
      this.element.classList.remove("is-moving");
    }
    this.render();
    if (this.onMove) this.onMove(this.position, this.map);
    this.interactionManager.update(this.position, this.map);
  };

  PlayerController.prototype.loop = function (time) {
    const delta = (time - this.lastTime) / 1000;
    this.lastTime = time;
    this.update(delta);
    this.frame = requestAnimationFrame(this.loop.bind(this));
  };

  PlayerController.prototype.render = function () {
    this.element.style.transform = "translate3d(" + Math.round(this.worldX) + "px," + Math.round(this.worldY) + "px,0)";
    if (this.assets) {
      const suffix = this.lastDirection.charAt(0).toUpperCase() + this.lastDirection.slice(1);
      const key = this.element.classList.contains("is-moving") ? "walk" + suffix + this.walkFrame : "idle" + suffix;
      const cycle = this.assets["walk" + suffix];
      const source = this.element.classList.contains("is-moving") && Array.isArray(cycle)
        ? cycle[(this.walkFrame - 1) % cycle.length] : this.assets[key];
      if (source) {
        if (this.spriteElement && this.spriteElement.getAttribute("src") !== source) this.spriteElement.src = source;
        this.element.classList.add("has-sprite");
      }
    }
  };

  window.TitanPlayerController = PlayerController;
  window.TitanPlayerSize = PLAYER_SIZE;
  window.TitanAabbOverlaps = overlaps;
  window.getPlayerFootRect = getPlayerFootRect;
  window.TitanPlayerFootRect = getPlayerFootRect;
  window.TitanPlayerFeetBox = getPlayerFootRect;
}());
