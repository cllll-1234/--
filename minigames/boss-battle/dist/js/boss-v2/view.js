(function (global) {
  "use strict";

  const C = global.GATEKEEPER_CONFIG;
  const KEYMAP = {
    KeyA: "left", ArrowLeft: "left", KeyD: "right", ArrowRight: "right", Space: "jump", Escape: "acceptFailure",
    ShiftLeft: "dash", ShiftRight: "dash", KeyQ: "grappleLeft", KeyE: "grappleRight", KeyS: "release",
    KeyF: "attack", KeyJ: "attack", KeyK: "heavy", KeyL: "brace", KeyR: "transform", Enter: "skip"
  };
  const EDGE = ["left", "right", "jump", "dash", "grappleLeft", "grappleRight", "release", "attack", "heavy", "brace", "transform", "skip", "acceptFailure"];

  class GatekeeperView {
    constructor(canvas, battle) {
      this.canvas = canvas; this.ctx = canvas.getContext("2d"); this.battle = battle;
      this.down = Object.create(null); this.pressed = Object.create(null); this.cameraX = 0; this.shake = 0; this.lastHp = battle.player.hp; this.lastPoise = battle.boss.poise; this.lastBossState = battle.boss.state;
      this.backdrop = new Image(); this.backdrop.src = "assets/city-dusk.png?v=22";
      this.guardSprites = new Image(); this.guardSprites.src = "assets/guard-sprites.png";
      this.titanSprites = new Image(); this.titanSprites.src = "assets/titan-sprites.png";
      this.playerTitanSprites = new Image(); this.playerTitanSprites.src = "assets/player-titan-actions.png";
      this.boulderSprites = new Image(); this.boulderSprites.src = "assets/boulder-projectile-tileset.png";
      this.groundTiles = new Image(); this.groundTiles.src = "assets/ground-tiles.png";
      this.embers = Array.from({ length: 54 }, (_, i) => ({ x: (i * 173) % C.arena.width, y: 120 + (i * 97) % 590, speed: 9 + i % 11, drift: 8 + i % 17, size: 1 + i % 3 }));
      this.bindInput(); this.cacheHud(); this.resize();
      global.addEventListener("resize", () => this.resize());
    }

    bindInput() {
      this.inputAbort = new AbortController();
      const capture = { signal: this.inputAbort.signal, capture: true };
      const passive = { signal: this.inputAbort.signal };
      const set = (code, value) => {
        const action = KEYMAP[code]; if (!action) return;
        if (value && !this.down[action]) this.pressed[action] = true;
        this.down[action] = value;
      };
      global.addEventListener("keydown", e => { if (KEYMAP[e.code]) { e.preventDefault(); set(e.code, true); } }, capture);
      global.addEventListener("keyup", e => { if (KEYMAP[e.code]) { e.preventDefault(); set(e.code, false); } }, capture);
      global.addEventListener("blur", () => { this.down = Object.create(null); this.pressed = Object.create(null); }, passive);
      document.querySelectorAll("[data-code]").forEach(button => {
        const code = button.dataset.code;
        ["pointerdown", "pointerenter"].forEach(type => button.addEventListener(type, e => { e.preventDefault(); set(code, true); }, passive));
        ["pointerup", "pointercancel", "pointerleave"].forEach(type => button.addEventListener(type, e => { e.preventDefault(); set(code, false); }, passive));
      });
    }

    input() {
      const p = this.pressed, d = this.down;
      let qteKey = "";
      if (p.jump) qteKey = "space"; else if (p.left) qteKey = "left"; else if (p.right) qteKey = "right";
      return { left: !!d.left, right: !!d.right, jump: !!d.jump, grappleLeft: !!d.grappleLeft, grappleRight: !!d.grappleRight, jumpPressed: !!p.jump, dashPressed: !!p.dash,
        grappleLeftPressed: !!p.grappleLeft, grappleRightPressed: !!p.grappleRight, releasePressed: !!p.release,
        attackPressed: !!p.attack, heavyPressed: !!p.heavy, bracePressed: !!p.brace, transformPressed: !!p.transform,
        skipPressed: !!p.skip, acceptFailurePressed: !!p.acceptFailure, qteKey };
    }

    consumeEdges() { EDGE.forEach(k => delete this.pressed[k]); }

    resize() {
      const dpr = Math.min(2, global.devicePixelRatio || 1), rect = this.canvas.getBoundingClientRect();
      this.canvas.width = Math.max(640, Math.round(rect.width * dpr)); this.canvas.height = Math.max(360, Math.round(rect.height * dpr));
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); this.width = rect.width; this.height = rect.height; this.scale = Math.min(this.width / 1280, this.height / 720);
    }

    cacheHud() {
      const ids = ["boss-hp-fill", "boss-hp-text", "poise-fill", "poise-text", "player-hp-fill", "player-hp-text", "resource-fill", "resource-text", "phase", "objective", "boss-state", "timer", "retry", "form", "round-text"];
      this.hud = {}; ids.forEach(id => this.hud[id] = document.getElementById(id));
    }

    destroy() { if (this.inputAbort) this.inputAbort.abort(); }

    updateHud(s) {
      const percent = (value, max) => `${Math.max(0, Math.min(100, value / max * 100))}%`;
      this.hud["boss-hp-fill"].style.width = percent(s.boss.hp, s.boss.maxHp); this.hud["boss-hp-text"].textContent = `兽之巨人 ${Math.ceil(s.boss.hp)} / ${s.boss.maxHp}`;
      this.hud["poise-fill"].style.width = percent(s.boss.poise, s.boss.poiseMax); this.hud["poise-text"].textContent = `装甲架势 ${Math.ceil(s.boss.poise)} / ${s.boss.poiseMax}`;
      this.hud["player-hp-fill"].style.width = percent(s.player.hp, s.player.maxHp); this.hud["player-hp-text"].textContent = `生命 ${Math.ceil(s.player.hp)} / ${s.player.maxHp}`;
      const resource = s.player.resolve;
      this.hud["resource-fill"].style.width = percent(resource, 100); this.hud["resource-text"].textContent = `巨化值 ${Math.floor(resource)} / 100`; this.hud["resource-fill"].parentElement.style.opacity = "1";
      const labels = { human: "Ⅰ 立体机动", titan: "Ⅱ 巨人化 / 击碎装甲", nape: "Ⅲ 绕背 / 后颈处决", finale: "最终处决", dead: "城门夺还" };
      this.hud.phase.textContent = labels[s.mode] || s.mode; this.hud.objective.textContent = s.warning;
      if (this.hud["boss-state"]) this.hud["boss-state"].textContent = `${s.boss.state.toUpperCase()}${s.boss.attack ? " · " + s.boss.attack.name : ""}`;
      this.hud.timer.textContent = `${Math.floor(s.elapsed / 60)}:${String(Math.floor(s.elapsed % 60)).padStart(2, "0")}`; if (this.hud.retry) this.hud.retry.textContent = s.retries;
      if (this.hud.form) this.hud.form.textContent = s.player.form === "titan" ? "进击巨人" : "调查兵";
      if (this.hud["round-text"]) this.hud["round-text"].textContent = s.mode === "dead" ? "目标沉默" : `后颈破坏 ${Math.min(3, s.cycle)} / 3`;
      document.querySelectorAll(".mission-progress i").forEach((dot, index) => dot.classList.toggle("active", index <= Math.min(2, s.cycle)));
      if (s.player.hp < this.lastHp) this.shake = 0.28;
      if (s.boss.poise - this.lastPoise > 20 || (this.lastBossState !== "down" && s.boss.state === "down")) this.shake = 0.34;
      this.lastHp = s.player.hp; this.lastPoise = s.boss.poise; this.lastBossState = s.boss.state;
    }

    render(alpha) {
      const s = this.battle.snapshot(); this.updateHud(s); const ctx = this.ctx;
      const targetCamera = Math.max(0, Math.min(C.arena.width - this.width / this.scale, s.player.x - this.width / this.scale * 0.38));
      this.cameraX += (targetCamera - this.cameraX) * 0.09; this.shake = Math.max(0, this.shake - 1 / 60);
      const sx = this.shake ? (Math.random() - 0.5) * 12 : 0, sy = this.shake ? (Math.random() - 0.5) * 8 : 0;
      ctx.clearRect(0, 0, this.width, this.height); ctx.save(); ctx.translate(sx, sy); ctx.scale(this.scale, this.scale); ctx.translate(-this.cameraX, (this.height / this.scale - C.arena.height) * 0.5);
      this.drawWorld(ctx, s); ctx.restore(); this.drawOverlay(ctx, s);
    }

    drawWorld(ctx, s) {
      const grd = ctx.createLinearGradient(0, 0, 0, C.arena.groundY); grd.addColorStop(0, "#111820"); grd.addColorStop(1, "#29302d"); ctx.fillStyle = grd; ctx.fillRect(0, 0, C.arena.width, C.arena.height);
      if (this.backdrop.complete && this.backdrop.naturalWidth) {
        ctx.save(); ctx.globalAlpha = 0.82; ctx.drawImage(this.backdrop, 0, 0, C.arena.width, C.arena.groundY + 40); ctx.restore();
      }
      const haze = ctx.createLinearGradient(0, 160, 0, C.arena.groundY); haze.addColorStop(0, "rgba(14,19,24,.05)"); haze.addColorStop(1, "rgba(10,13,15,.55)"); ctx.fillStyle = haze; ctx.fillRect(0, 0, C.arena.width, C.arena.groundY);
      this.drawAmbience(ctx);
      ctx.fillStyle = "#22221f"; ctx.fillRect(0, C.arena.groundY, C.arena.width, 110); ctx.fillStyle = "#4f4b41"; ctx.fillRect(0, C.arena.groundY, C.arena.width, 4);
      if (this.groundTiles.complete && this.groundTiles.naturalWidth) for (let x = 0; x < C.arena.width; x += 70) ctx.drawImage(this.groundTiles, 37, 50, 70, 80, x, C.arena.groundY - 2, 70, 80);
      C.arena.anchors.forEach(a => { ctx.fillStyle = "#d4b46e"; ctx.beginPath(); ctx.arc(a.x, a.y, 5, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "#f0d49255"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(a.x, a.y, 11, 0, Math.PI * 2); ctx.stroke(); });
      if (s.boss.danger) this.drawDanger(ctx, s.boss);
      if (s.boss.projectile) { const q = s.boss.projectile; ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(Math.atan2(q.vy, q.vx)); if (this.boulderSprites.complete && this.boulderSprites.naturalWidth) { const frame = Math.floor(performance.now() / 84) % 8, fw = this.boulderSprites.naturalWidth / 4, fh = this.boulderSprites.naturalHeight / 2, size = q.r * 2.5; ctx.imageSmoothingEnabled = false; ctx.drawImage(this.boulderSprites, (frame % 4) * fw, Math.floor(frame / 4) * fh, fw, fh, -size / 2, -size / 2, size, size); } else { ctx.fillStyle = "#8f8777"; ctx.strokeStyle = "#d8c39a"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-q.r, 2); ctx.lineTo(-q.r * .45, -q.r * .8); ctx.lineTo(q.r * .55, -q.r * .7); ctx.lineTo(q.r, q.r * .15); ctx.lineTo(q.r * .35, q.r); ctx.lineTo(-q.r * .65, q.r * .7); ctx.closePath(); ctx.fill(); ctx.stroke(); } ctx.restore(); }
      this.drawBoss(ctx, s.boss); this.drawHeadTarget(ctx, s); this.drawNape(ctx, s); this.drawPlayer(ctx, s.player);
      if (s.player.grapple) { ctx.strokeStyle = s.player.grapple.boss ? "#e0b75e" : "#d8d2bd"; ctx.lineWidth = s.player.grapple.boss ? 3 : 2; ctx.beginPath(); ctx.moveTo(s.player.x + s.player.w / 2, s.player.y + s.player.h / 2); ctx.lineTo(s.player.grapple.x, s.player.grapple.y); ctx.stroke(); }
    }

    drawAmbience(ctx) {
      const now = performance.now() / 1000;
      ctx.save();
      this.embers.forEach((e, i) => {
        const x = (e.x + now * e.drift) % C.arena.width, y = C.arena.groundY - ((e.y + now * e.speed) % 660);
        ctx.globalAlpha = .18 + (i % 5) * .055; ctx.fillStyle = i % 4 ? "#c97c39" : "#f0bd68";
        ctx.fillRect(x, y, e.size, e.size * 2.2);
      });
      ctx.restore();
    }

    drawDanger(ctx, boss) {
      const d = boss.danger, pulse = 0.22 + Math.sin(performance.now() / 55) * 0.08; ctx.fillStyle = `rgba(224,64,47,${pulse})`; ctx.strokeStyle = "#ff705c"; ctx.lineWidth = 4; ctx.setLineDash([18, 12]);
      if (d.kind === "screen") { ctx.fillStyle = `rgba(224,32,24,${0.18 + Math.sin(performance.now()/45)*0.08})`; ctx.fillRect(0, 0, this.width, this.height); ctx.strokeStyle = "#ffcc72"; ctx.strokeRect(18, 18, this.width - 36, this.height - 36); }
      else if (d.kind === "circle") { ctx.beginPath(); ctx.ellipse(d.x, d.y, d.r, d.r * 0.28, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      else { ctx.fillRect(d.x, d.y, d.w, d.h); ctx.strokeRect(d.x, d.y, d.w, d.h); }
      ctx.setLineDash([]);
    }

    drawBoss(ctx, b) {
      ctx.save();
      if (b.state !== "down" && b.state !== "dead" && this.titanSprites.complete && this.titanSprites.naturalWidth) {
        ctx.globalAlpha = 0.98; ctx.drawImage(this.titanSprites, 0, 0, 153, 360, b.x, b.y, b.w, b.h);
        ctx.restore(); return;
      }
      if (b.state === "down" || b.state === "dead") {
        if (this.titanSprites.complete && this.titanSprites.naturalWidth) { ctx.translate(b.x + b.w / 2, C.arena.groundY - 76); ctx.rotate(-0.08); ctx.globalAlpha = b.state === "dead" ? 0.72 : 1; ctx.drawImage(this.titanSprites, 0, 0, 153, 360, -b.w / 2, -b.h / 2, b.w, b.h); ctx.restore(); return; }
        ctx.translate(b.x + b.w / 2, C.arena.groundY - 76); ctx.rotate(-0.08);
        ctx.fillStyle = b.state === "dead" ? "#4d4944" : "#775c4e"; ctx.fillRect(-202, -60, 370, 118);
        ctx.fillStyle = "#b6a27f"; for (let x = -180; x < 150; x += 54) ctx.fillRect(x, -66 + Math.abs(x % 5), 42, 22);
        ctx.fillStyle = "#8d6d58"; ctx.beginPath(); ctx.arc(170, -36, 70, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#d1c097"; ctx.fillRect(135, -86, 50, 24); ctx.fillRect(172, -55, 48, 22);
        if (b.state === "dead") { ctx.fillStyle = "rgba(218,226,217,.22)"; for (let i = 0; i < 8; i++) { const t = (performance.now() / 1100 + i * .13) % 1; ctx.beginPath(); ctx.arc(-150 + i * 48, -90 - t * 150, 16 + t * 28, 0, Math.PI * 2); ctx.fill(); } }
        ctx.restore(); return;
      }
      const leapLift = b.attackKey === "leap" && b.state === "attack" ? Math.sin((1 - b.timer / Math.max(0.001, b.attack.active)) * Math.PI) * 110 : 0;
      ctx.translate(b.x + b.w / 2, b.y - leapLift);
      const attackReach = b.state === "telegraph" ? 46 : b.state === "attack" ? 172 : 0;
      ctx.fillStyle = "#49342e"; ctx.fillRect(-58, 230, 48, 218); ctx.fillRect(10, 230, 48, 218);
      ctx.fillStyle = "#b8a477"; ctx.fillRect(-67, 274, 55, 72); ctx.fillRect(12, 274, 55, 72); ctx.fillRect(-63, 394, 52, 48); ctx.fillRect(11, 394, 52, 48);
      ctx.fillStyle = "#7b594a"; ctx.beginPath(); ctx.ellipse(0, 215, 91, 137, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#c5b184"; ctx.fillRect(-77, 139, 62, 42); ctx.fillRect(15, 139, 62, 42); ctx.fillRect(-68, 190, 54, 50); ctx.fillRect(14, 190, 54, 50); ctx.fillRect(-53, 246, 42, 24); ctx.fillRect(11, 246, 42, 24);
      ctx.strokeStyle = "#3a2926"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 141); ctx.lineTo(0, 272); ctx.moveTo(-68, 187); ctx.lineTo(68, 187); ctx.stroke();
      ctx.fillStyle = "#86604f"; ctx.beginPath(); ctx.arc(0, 80, 77, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#cabb91"; ctx.fillRect(-64, 34, 38, 27); ctx.fillRect(26, 34, 38, 27); ctx.fillRect(-74, 72, 32, 43); ctx.fillRect(42, 72, 32, 43); ctx.fillRect(-27, 17, 54, 22);
      ctx.fillStyle = "#171719"; ctx.fillRect(-39, 67, 18, 8); ctx.fillRect(21, 67, 18, 8); ctx.fillStyle = "#f2eee1"; ctx.fillRect(-31, 111, 62, 9);
      ctx.fillStyle = "#7a584a";
      if (b.attackKey === "sweep" || b.attackKey === "grab" || b.attackKey === "slowBlade") {
        const dir = b.face || -1, start = dir < 0 ? -73 : 73; ctx.fillRect(start, 155, dir * (72 + attackReach), 48);
        ctx.fillStyle = "#b9a77e"; ctx.fillRect(dir < 0 ? start - 30 - attackReach : start + 38 + attackReach, 157, dir * 34, 44);
      } else if (b.attackKey === "uppercut") { ctx.save(); ctx.rotate(-0.38); ctx.fillRect(-123, 150, 48, 238); ctx.restore(); ctx.save(); ctx.rotate(0.38); ctx.fillRect(75, 150, 48, 238); ctx.restore(); }
      else if (b.attackKey === "boulder" || b.attackKey === "spear") { const dir = b.face || -1; ctx.fillRect(dir * 76, 116, dir * 52, 190); ctx.fillRect(-dir * 88, 180, -dir * 38, 150); }
      else { ctx.fillRect(-123, 150, 48, 238); ctx.fillRect(75, 150, 48, 238); }
      if (b.state === "telegraph") { ctx.strokeStyle = "#e2bd6944"; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 203, 112 + Math.sin(performance.now()/90)*7, 0, Math.PI*2); ctx.stroke(); }
      ctx.restore();
    }

    drawNape(ctx, s) {
      if (s.boss.state !== "down") return; const n = this.battle.napePoint(); const r = 18 + Math.sin(performance.now() / 100) * 5;
      ctx.fillStyle = "rgba(255,220,108,.28)"; ctx.strokeStyle = "#ffdc6c"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }

    drawHeadTarget(ctx, s) {
      if (s.boss.state === "down" || s.boss.state === "dead") return;
      const x = s.boss.x + s.boss.w * 0.5, y = s.boss.y + 82, r = 26 + Math.sin(performance.now() / 100) * 4;
      ctx.save(); ctx.strokeStyle = "#ffcf68aa"; ctx.lineWidth = 3; ctx.setLineDash([8, 7]); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    }

    drawPlayer(ctx, p) {
      ctx.save(); ctx.translate(p.x + p.w / 2, p.y + p.h / 2); if (p.hurt > 0) ctx.globalAlpha = 0.5;
      if (p.form === "titan" && p.dashTime > 0) {
        const side = p.facing || 1, alpha = 0.28 + Math.min(0.55, p.dashTime / Math.max(0.01, C.player.dash.duration) * 0.55);
        ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = "#8deaff"; ctx.shadowColor = "#55dfff"; ctx.shadowBlur = 20; ctx.lineWidth = 11;
        for (let i = 0; i < 4; i++) { const y = -p.h * 0.3 + i * p.h * 0.2; ctx.beginPath(); ctx.moveTo(-side * (p.w * 0.32 + i * 16), y); ctx.lineTo(-side * (p.w * 0.9 + i * 28), y); ctx.stroke(); }
        ctx.restore();
      }
      if (p.form === "human" && this.guardSprites.complete && this.guardSprites.naturalWidth) {
        const frame = p.hurt > 0 ? 3 : p.attack ? 2 : !p.grounded ? 1 : Math.abs(p.vx) > 35 ? 1 : 0;
        ctx.scale(p.facing || 1, 1); ctx.drawImage(this.guardSprites, (frame % 4) * 336, Math.floor(frame / 4) * 336, 336, 336, -34, -46, 68, 92);
        if (p.attack) { ctx.strokeStyle = "#f6f0d0"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(12, -4); ctx.lineTo(46, -18); ctx.stroke(); }
        ctx.restore(); return;
      }
      if (p.form === "titan") {
        if (this.playerTitanSprites.complete && this.playerTitanSprites.naturalWidth) {
          const fw = 440, fh = 460;
          const actionRow = p.attack ? 2 : (Math.abs(p.vx) > 200 ? 1 : 0);
          const directionRow = p.facing < 0 ? 1 : 0;
          const row = actionRow * 2 + directionRow;
          const frame = p.attack
            ? Math.min(3, Math.floor((p.attack.t / Math.max(0.001, p.attack.total)) * 4))
            : Math.floor(performance.now() / (actionRow === 1 ? 84 : 125)) % 4;
          ctx.globalAlpha = 0.98; ctx.imageSmoothingEnabled = false;
          const visualW = p.w * 1.8, visualH = p.h * 1.21;
          const drawY = p.h / 2 - visualH * ((fh - 28) / fh);
          ctx.drawImage(this.playerTitanSprites, frame * fw, row * fh, fw, fh, -visualW / 2, drawY, visualW, visualH);
          if (p.invuln > 0) { ctx.strokeStyle = "#b9f3ff"; ctx.lineWidth = 6; ctx.strokeRect(-p.w / 2 - 6, -p.h / 2 - 6, p.w + 12, p.h + 12); } ctx.restore(); return;
        }
        ctx.fillStyle = "#8f4e3e"; ctx.beginPath(); ctx.ellipse(0, 8, p.w * .44, p.h * .42, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#d39b72"; ctx.beginPath(); ctx.arc(0, -p.h * .33, p.w * .35, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ead1aa"; ctx.fillRect(-p.w*.25,-p.h*.38,p.w*.18,5);ctx.fillRect(p.w*.07,-p.h*.38,p.w*.18,5);
        ctx.fillStyle = "#5a2924"; ctx.fillRect(-p.w*.28,-p.h*.05,p.w*.22,p.h*.48);ctx.fillRect(p.w*.06,-p.h*.05,p.w*.22,p.h*.48);
      } else {
        ctx.scale(p.facing || 1, 1); ctx.fillStyle = "#1d2625"; ctx.fillRect(-7,-10,14,22); ctx.fillStyle = "#63745d"; ctx.fillRect(-10,-7,20,12);
        ctx.fillStyle = "#c4b79f"; ctx.beginPath(); ctx.arc(0,-14,7,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = "#202427"; ctx.fillRect(-10,12,7,8);ctx.fillRect(3,12,7,8);ctx.fillStyle="#8f9794";ctx.fillRect(-15,1,6,10);ctx.fillRect(9,1,6,10);
        ctx.strokeStyle="#e8e3d5";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(8,-2);ctx.lineTo(23,-8);ctx.stroke();
      }
      if (p.invuln > 0) { ctx.strokeStyle = "#b9f3ff"; ctx.lineWidth = 3; ctx.strokeRect(-p.w / 2 - 5, -p.h / 2 - 5, p.w + 10, p.h + 10); }
      if (p.braceTime > 0) { ctx.strokeStyle = "#f2ce6c"; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, p.w, -1.1, 1.1); ctx.stroke(); }
      if (p.attack) { ctx.strokeStyle = p.attack.boosted ? "#9ee9ff" : "#f2ead2"; ctx.lineWidth = p.attack.kind === "heavy" ? 12 : p.attack.boosted ? 8 : 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(p.facing * (p.attack.kind === "heavy" ? 110 : p.attack.boosted ? 105 : 75), -12); ctx.stroke(); }
      ctx.restore();
    }

    drawOverlay(ctx, s) {
      if (s.qte.active) {
        ctx.fillStyle = "rgba(3,5,7,.78)"; ctx.fillRect(0, 0, this.width, this.height); ctx.textAlign = "center";
        const labels = { space: "SPACE", left: "A / ←", right: "D / →" }; const shown = s.qte.sequence.length;
        const gap = Math.min(24, Math.max(10, this.width * 0.018)), cardW = Math.min(128, (this.width - 40 - gap * (shown - 1)) / shown), cardH = Math.min(92, cardW * 0.72), top = this.height / 2 - cardH / 2 - 4, totalW = cardW * shown + gap * (shown - 1), startX = (this.width - totalW) / 2;
        ctx.fillStyle = "#e6d29b"; ctx.font = "700 27px Microsoft YaHei"; ctx.fillText(s.qte.final ? "最后一击" : "攻击后颈", this.width / 2, top - 34);
        for (let i = 0; i < shown; i++) { const x = startX + i * (cardW + gap), done = i < s.qte.index, current = i === s.qte.index; ctx.fillStyle = done ? "#668a67" : current ? "#e0b75e" : "#50565b"; ctx.fillRect(x, top, cardW, cardH); ctx.fillStyle = "#101315"; ctx.font = `700 ${Math.max(16, Math.min(24, cardW * 0.2))}px monospace`; ctx.fillText(done || current ? labels[s.qte.sequence[i]] : "?", x + cardW / 2, top + cardH * 0.61); }
        const barW = Math.min(this.width - 32, Math.min(460, Math.max(180, totalW))), barX = (this.width - barW) / 2, barY = top + cardH + 24; ctx.fillStyle = "#892f29"; ctx.fillRect(barX, barY, barW, 10); ctx.fillStyle = "#e5bd69"; ctx.fillRect(barX, barY, barW * s.qte.timer / s.qte.stepTime, 10);
      }
      if (s.stage === "dialogue" && s.dialogue) this.drawCard(ctx, `${s.dialogue.speaker}`, s.dialogue.text, "Space / J 继续");
      if (s.stage === "defeat") this.drawCard(ctx, "战斗失败", "你已倒下，城墙战线暂时失守。", "Space / Enter 重新挑战 · Esc 接受死亡");
      if (s.stage === "victory") this.drawCard(ctx, "兽之巨人 已击败", "城门夺还。幸存者正在越过外墙。", "战斗结束");
    }

    drawCard(ctx, title, text, footer) {
      const w = Math.min(720, this.width - 40), x = (this.width - w) / 2, y = this.height * 0.62;
      ctx.fillStyle = "rgba(7,10,13,.94)"; ctx.fillRect(x, y, w, 130); ctx.strokeStyle = "#8e7649"; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, 130);
      ctx.textAlign = "left"; ctx.fillStyle = "#e2bd69"; ctx.font = "700 14px Microsoft YaHei"; ctx.fillText(title, x + 24, y + 31); ctx.fillStyle = "#e5dfd2"; ctx.font = "16px Microsoft YaHei"; ctx.fillText(text, x + 24, y + 66); ctx.fillStyle = "#869095"; ctx.font = "12px monospace"; ctx.fillText(footer, x + 24, y + 104);
    }
  }

  global.GatekeeperView = GatekeeperView;
}(window));

