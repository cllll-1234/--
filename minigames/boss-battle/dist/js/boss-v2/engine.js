(function (global) {
  "use strict";

  const C = global.GATEKEEPER_CONFIG;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const moveToward = (n, target, amount) => n < target ? Math.min(target, n + amount) : Math.max(target, n - amount);
  const emptyInput = () => ({ left: false, right: false, jump: false, grappleLeft: false, grappleRight: false, jumpPressed: false, dashPressed: false, grappleLeftPressed: false, grappleRightPressed: false, releasePressed: false, attackPressed: false, heavyPressed: false, bracePressed: false, transformPressed: false, qteKey: "", skipPressed: false, acceptFailurePressed: false });

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function circleRect(circle, rect) {
    const x = clamp(circle.x, rect.x, rect.x + rect.w);
    const y = clamp(circle.y, rect.y, rect.y + rect.h);
    return (x - circle.x) ** 2 + (y - circle.y) ** 2 <= circle.r ** 2;
  }

  class GatekeeperBattle {
    constructor(options) {
      this.options = options || {};
      this.difficultyKey = C.difficulty[this.options.difficulty] ? this.options.difficulty : "hard";
      this.diff = C.difficulty[this.difficultyKey];
      this.onComplete = typeof this.options.onComplete === "function" ? this.options.onComplete : function () {};
      this.onExit = typeof this.options.onExit === "function" ? this.options.onExit : function () {};
      this.restart(this.options.startMode || "human");
    }

    restart(startMode) {
      this.elapsed = 0;
      this.cycle = 0;
      this.retries = 0;
      this.stage = "fight";
      this.mode = "human";
      this.dialogueIndex = 0;
      this.dialogueTimer = 0;
      this.warning = "观察攻击预警，寻找头部窗口";
      this.completed = false;
      this.stats = { avoids: 0, perfects: 0, counters: 0, napeHits: 0, damageTaken: 0 };
      this.player = this.makePlayer();
      this.boss = this.makeBoss();
      this.qte = { active: false, sequence: [], index: 0, timer: 0, stepTime: 0, final: false, result: "" };
      this.setStartMode(startMode);
    }

    makePlayer() {
      const p = C.player;
      return { x: 430, y: C.arena.groundY - p.human.h, w: p.human.w, h: p.human.h, vx: 0, vy: 0, grounded: true,
        hp: p.maxHp, maxHp: p.maxHp, gas: p.gasMax, resolve: p.resolveStart, titanEnergy: p.titanEnergy,
        form: "human", transformUsed: false, dashTime: 0, dashCd: 0, invuln: 0, hurt: 0, attack: null, braceTime: 0, braceCd: 0,
        grapple: null, grappleHoldLock: false, transformTime: 0, facing: 1, coyote: C.player.human.coyoteTime, jumpBuffer: 0 };
    }

    makeBoss() {
      return { x: C.boss.x, y: C.arena.groundY - C.boss.h, w: C.boss.w, h: C.boss.h, vx: 0, movePhase: 0,
        hp: C.boss.maxHp, maxHp: C.boss.maxHp, poise: 0, poiseMax: C.boss.poiseMax,
        state: "idle", timer: 0.85, attackKey: "", attack: null, patternIndex: 0, danger: null, projectile: null,
        hitResolved: false, playerWasThreatened: false, downTimer: 0, face: -1, fullScreenUses: 0 };
    }

    setStartMode(mode) {
      if (mode === "titan") {
        this.player.resolve = 100;
        this.transform(true);
      } else if (mode === "down" || mode === "qte") {
        this.downBoss();
        this.player.x = this.boss.x - 120;
        this.player.y = C.arena.groundY - 220;
        if (mode === "qte") this.beginQte(false);
      } else if (mode === "finale") {
        this.boss.hp = 10;
        this.beginDialogue();
      } else if (mode === "dead") {
        this.killBoss();
      }
    }

    step(dt, input) {
      input = input || emptyInput();
      dt = clamp(dt || 0, 0, C.maxFrame);
      if (!dt) return;
      this.elapsed += dt;
      if (this.stage === "dialogue") return this.stepDialogue(dt, input);
      if (this.stage === "defeat") {
        if (input.acceptFailurePressed) this.onExit({ reason: "defeat" });
        else if (input.jumpPressed || input.skipPressed) this.retry();
        return;
      }
      if (this.stage === "victory") return;
      if (this.qte.active) return this.stepQte(dt, input);

      this.tickTimers(dt);
      this.stepPlayer(dt, input);
      this.stepBoss(dt, input);
      this.resolveBossSolid();
      this.checkNape(input);
      if (this.player.hp <= 0) { this.fullResetOnRetry = true; this.defeat(); }
    }

    tickTimers(dt) {
      const p = this.player;
      ["dashTime", "dashCd", "invuln", "hurt", "braceTime", "braceCd"].forEach(k => p[k] = Math.max(0, p[k] - dt));
      const resolveDrain = p.form === "titan" ? C.player.titanDrain : C.player.resolveDecay;
      if (p.form === "titan" || p.resolve < C.player.resolveRequired) p.resolve = Math.max(0, p.resolve - resolveDrain * dt);
      if (p.form === "human" && !p.grapple) p.gas = Math.min(C.player.gasMax, p.gas + C.player.gasRegen * dt);
      if (p.form === "titan") {
        p.titanEnergy = Math.max(0, p.titanEnergy - C.player.titanDrain * dt);
        if (p.resolve <= 0) this.revertHuman("巨化值耗尽，恢复人类形态");
      }
    }

    stepPlayer(dt, input) {
      const p = this.player;
      if (p.transformTime > 0) {
        p.transformTime -= dt;
        if (p.transformTime <= 0) this.finishTransform();
        return;
      }
      if (input.transformPressed && p.form === "human" && !p.transformUsed && p.resolve >= C.player.resolveRequired && this.boss.state !== "down") this.transform(false);
      if (input.attackPressed && !p.attack && p.braceTime <= 0) this.startPlayerAttack("quick");
      this.stepPlayerAttack(dt);

      if (p.form === "human") {
        if (!input.grappleLeft && !input.grappleRight) p.grappleHoldLock = false;
        if ((input.jumpPressed || input.releasePressed) && p.grapple) { this.cancelGrapple(input.jumpPressed); p.grappleHoldLock = true; }
        if (p.grapple && (input.grappleLeftPressed || input.grappleRightPressed)) {
        } else if (!p.grapple) {
          if (input.grappleLeftPressed) this.startGrapple(-1, false);
          else if (input.grappleRightPressed) this.startGrapple(1, false);
          else if (input.grappleLeft && !p.grappleHoldLock) this.startGrapple(-1, true);
          else if (input.grappleRight && !p.grappleHoldLock) this.startGrapple(1, true);
        }
      }

      const form = C.player[p.form];
      const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      if (direction) p.facing = direction;
      p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);
      if (input.jumpPressed) p.jumpBuffer = form.jumpBufferTime || C.player.human.jumpBufferTime;
      p.coyote = p.grounded ? (form.coyoteTime || C.player.human.coyoteTime) : Math.max(0, p.coyote - dt);
      if (input.dashPressed && p.dashCd <= 0 && (p.form === "titan" || p.gas >= C.player.dash.cost)) {
        if (p.form === "human") p.gas -= C.player.dash.cost; p.dashTime = C.player.dash.duration; p.dashCd = C.player.dash.cooldown; p.invuln = C.player.dash.invuln;
        p.vx = (direction || p.facing || 1) * C.player.dash.speed; p.vy *= 0.25;
      }
      if (p.dashTime <= 0 && !p.attack) {
        const airAccel = form.airAccel || form.accel * (form.airControl || 0.62);
        if (direction) p.vx = clamp(p.vx + direction * (p.grounded ? form.accel : airAccel) * dt, -form.maxSpeed, form.maxSpeed);
        else if (p.grounded) p.vx = moveToward(p.vx, 0, C.player.friction * dt);
      }
      if (p.jumpBuffer > 0 && p.coyote > 0 && !p.attack) {
        p.vy = -form.jump; p.grounded = false; p.coyote = 0; p.jumpBuffer = 0;
      }
      if (!input.jump && p.vy < -(form.jumpCut || C.player.human.jumpCut)) p.vy = -(form.jumpCut || C.player.human.jumpCut);
      const grappleLocksMovement = p.grapple && p.form === "human" ? this.stepGrapple(dt, input) : false;
      if (grappleLocksMovement) { p.grounded = false; return; }
      p.vy = Math.min(form.maxFall || C.player.human.maxFall, p.vy + form.gravity * dt);
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.y + p.h >= C.arena.groundY) { p.y = C.arena.groundY - p.h; p.vy = 0; p.grounded = true; } else p.grounded = false;
      p.x = clamp(p.x, C.arena.left, C.arena.right - p.w);
    }

    findGrappleAnchor(side) {
      const p = this.player; let best = null; let bestD = Infinity;
      const anchors = C.arena.anchors.slice();
      if (this.boss.state !== "dead") {
        if (this.boss.state === "down") { const n = this.napePoint(); anchors.push({ x: n.x, y: n.y, boss: true }); }
      }
      anchors.forEach(a => {
        const dx = a.x - (p.x + p.w / 2), dy = a.y - (p.y + p.h / 2), d = Math.hypot(dx, dy);
        const priority = a.boss ? d * 0.84 : d;
        if ((side > 0 ? dx > 0 : dx < 0) && d < C.player.grapple.range && priority < bestD) { best = a; bestD = priority; }
      });
      return best;
    }

    startGrapple(side, legacyHold = false) {
      const p = this.player, best = this.findGrappleAnchor(side);
      if (!best) return false;
      const sx = p.x + p.w / 2, sy = p.y + p.h / 2;
      const length = Math.hypot(best.x - sx, best.y - sy);
      p.grapple = { state: "firing", x: sx, y: sy, targetX: best.x, targetY: best.y, side, boss: !!best.boss,
        length: Math.max(C.player.grapple.minLength, length * 0.94), legacyHold, tipSpeed: 1800, latchTime: 0 };
      p.vx += side * 80;
      return true;
    }

    cancelGrapple(jumpLaunch = false) {
      const p = this.player, form = C.player[p.form], g = p.grapple;
      if (!g) return;
      if (!Number.isFinite(g.targetX) || !Number.isFinite(g.targetY)) { p.grapple = null; p.grappleHoldLock = false; return; }
      const dx = g.targetX - (p.x + p.w / 2), dy = g.targetY - (p.y + p.h / 2), len = Math.max(1, Math.hypot(dx, dy));
      p.grapple = null; p.grounded = false;
      if (jumpLaunch) { p.vx = dx / len * 260; p.vy = -form.jump * 0.84; }
      else { const speed = Math.max(190, Math.hypot(p.vx, p.vy)); p.vx = dx / len * Math.min(520, speed); p.vy = dy / len * Math.min(520, speed) - 90; }
      this.warning = jumpLaunch ? "脱钩跃起" : "钩索已释放";
    }

    stepGrapple(dt, input) {
      const p = this.player; const g = p.grapple;
      if (!g || !Number.isFinite(g.x) || !Number.isFinite(g.y) || !Number.isFinite(g.targetX) || !Number.isFinite(g.targetY)) {
        p.grapple = null; p.grappleHoldLock = false; return false;
      }
      const spec = C.player.grapple;
      g.latchTime = (g.latchTime || 0) + dt;
      if (g.latchTime > spec.maxLatchTime) { this.cancelGrapple(false); this.warning = "钩索牵引超时，自动脱钩"; return false; }
      if (g.legacyHold && !input.grappleLeft && !input.grappleRight) { this.cancelGrapple(false); return false; }
      if (g.state === "firing") {
        const dx = g.targetX - g.x, dy = g.targetY - g.y, len = Math.max(1, Math.hypot(dx, dy));
        const travel = g.tipSpeed * dt;
        if (len <= travel) { g.x = g.targetX; g.y = g.targetY; g.state = "pulling"; g.length = Math.max(spec.minLength, Math.hypot(g.x - (p.x + p.w / 2), g.y - (p.y + p.h / 2)) * 0.92); }
        else { g.x += dx / len * travel; g.y += dy / len * travel; }
        return false;
      }
      const dx = g.targetX - (p.x + p.w / 2), dy = g.targetY - (p.y + p.h / 2), len = Math.max(1, Math.hypot(dx, dy));
      if (g.state === "pulling") {
        const nx = dx / len, ny = dy / len, offset = 30, desiredX = g.targetX - nx * offset - p.w / 2, desiredY = g.targetY - ny * offset - p.h / 2;
        const move = spec.pull * dt; p.vx = nx * spec.pull; p.vy = ny * spec.pull;
        if (Math.hypot(desiredX - p.x, desiredY - p.y) <= move + 4) { p.x = desiredX; p.y = desiredY; p.vx = nx * spec.pull * 0.72; p.vy = ny * spec.pull * 0.72 - 80; p.grapple = null; p.grappleHoldLock = true; this.warning = "钩索到达：惯性脱钩"; return false; }
        else { p.x += nx * move; p.y += ny * move; }
        return true;
      }
      if (g.state === "latched") { p.grapple = null; return false; }
      p.grapple = null;
      return false;
    }

    startPlayerAttack(kind) {
      const p = this.player;
      const spec = p.form === "human" ? C.player.humanBlade : C.player[kind];
      p.attack = { kind: p.form === "human" ? "blade" : kind, t: 0, hit: false, boosted: p.form === "human" && (!!p.grapple || !p.grounded) && Math.hypot(p.vx, p.vy) >= C.player.humanBlade.speedThreshold, total: spec.windup + spec.active + spec.recover };
      if (p.form === "human" && p.grapple) p.vx += p.facing * 110;
      if (p.form === "titan") { p.vx = p.facing * (kind === "heavy" ? 250 : 340); p.invuln = Math.max(p.invuln, kind === "heavy" ? 0.2 : 0.14); }
    }

    stepPlayerAttack(dt) {
      const p = this.player; if (!p.attack) return;
      const a = p.attack, spec = a.kind === "blade" ? C.player.humanBlade : C.player[a.kind]; a.t += dt;
      if (!a.hit && a.t >= spec.windup && a.t <= spec.windup + spec.active) {
        a.hit = true;
        const distance = Math.abs((p.x + p.w / 2) - (this.boss.x + this.boss.w / 2));
        const headOnlyAerial = a.kind === "blade" && !p.grounded;
        const headY = this.boss.y + 190, headX = this.boss.x + this.boss.w * 0.5;
        const hitsHead = p.y + p.h <= headY && Math.abs((p.x + p.w / 2) - headX) <= 125;
        const humanHeadAttack = p.form === "human" ? ((p.y + p.h <= headY && Math.abs((p.x + p.w / 2) - headX) <= spec.range + 60) || (a.boosted && p.grapple && p.grapple.boss)) : true;
        if (distance <= spec.range + this.boss.w / 2 && humanHeadAttack && this.boss.state !== "down" && this.boss.state !== "dead") {
          const open = this.boss.state === "recover";
          let gain = a.kind === "blade" && a.boosted ? spec.poiseAerial : (open ? spec.poiseOpen : spec.poiseClosed);
          if (headOnlyAerial && !hitsHead && !(a.boosted && p.grapple && p.grapple.boss)) gain = 0;
          if (a.kind === "blade") {
            const resolveGain = a.boosted ? spec.resolveAerial : (open ? spec.resolveOpen : spec.resolveClosed);
            p.resolve = clamp(p.resolve + resolveGain * this.diff.resolve, 0, 100);
            this.warning = a.boosted ? `高速钩索斩：架势 +${gain}` : open ? `硬直斩击：架势 +${gain}` : "刀击命中：等待硬直可造成更多架势伤害";
          }
          if (a.kind === "heavy" && this.boss.state === "telegraph" && this.inCounterWindow() && distance <= spec.range + 80) {
            gain = spec.counterPoise; this.stats.counters++; this.player.resolve = clamp(this.player.resolve + C.player.resolveOnCounter, 0, 100);
            this.forceBossRecovery("重击反制");
          }
          if (p.form === "titan" && a.kind === "heavy" && this.boss.state === "attack") {
            this.forceBossRecovery("巨人重击：打断攻击");
          }
          if (p.form === "titan" && a.kind !== "blade") {
            const aerialBodyHit = !p.grounded && !hitsHead;
            if (!aerialBodyHit) this.boss.hp = Math.max(this.boss.fullScreenUses < 3 ? 1 : 0, this.boss.hp - (spec.hpDamage || 0));
            p.titanEnergy = Math.max(0, p.titanEnergy - (a.kind === "heavy" ? 3 : 1.2));
            this.warning = aerialBodyHit ? "空中命中装甲：只有头部可造成伤害" : (a.kind === "heavy" ? `重击破甲：Boss 生命 -${spec.hpDamage}` : `巨人快攻：Boss 生命 -${spec.hpDamage}`);
          }
          this.addPoise(gain, p.form !== "titan");
        }
      }
      if (a.t >= a.total) p.attack = null;
    }

    transform(immediate) {
      const p = this.player;
      if (p.transformUsed || p.form !== "human") return;
      p.transformUsed = true; p.resolve = 0; p.grapple = null;
      if (immediate) this.finishTransform(); else { p.transformTime = C.player.transformWindup; p.invuln = p.transformTime; this.warning = "智慧巨人之力释放"; }
    }

    finishTransform() {
      const p = this.player, feet = p.y + p.h; p.form = "titan"; p.w = C.player.titan.w; p.h = C.player.titan.h; p.y = feet - p.h;
      p.titanEnergy = C.player.titanEnergy; p.resolve = C.player.resolveRequired; p.transformTime = 0; p.invuln = 0.8; this.mode = "titan";
      const distance = Math.abs((p.x + p.w / 2) - (this.boss.x + this.boss.w / 2));
      if (distance < 420) { this.addPoise(18, false); this.warning = "巨人化冲击：装甲架势 -18"; }
      else this.warning = "进击巨人：快攻破甲，重击反制";
    }

    revertHuman(reason) {
      const p = this.player, feet = p.y + p.h; p.form = "human"; p.w = C.player.human.w; p.h = C.player.human.h; p.y = feet - p.h;
      p.attack = null; p.braceTime = 0; p.resolve = Math.max(p.resolve, 30); p.invuln = 0.6; this.mode = "human"; this.warning = reason || "恢复士兵形态";
    }

    stepBoss(dt) {
      const b = this.boss;
      if (b.state === "dead" || b.state === "down") {
        if (b.state === "down") { b.downTimer -= dt; if (b.downTimer <= 0 && !this.qte.active) this.failNape("错失处决时机"); }
        return;
      }
      this.moveBoss(dt);
      if (b.state === "idle") {
        b.timer -= dt;
        if (b.timer <= 0) this.startBossAttack();
      } else if (b.state === "telegraph") {
        b.timer -= dt; this.updateDanger();
        if (b.timer <= 0) { b.state = "attack"; b.timer = b.attack.active; b.hitResolved = false; if (b.attack.kind === "projectile") { const sx = b.x + b.w / 2, sy = C.arena.groundY - 285, tx = this.player.x + this.player.w / 2, ty = this.player.y + this.player.h / 2, len = Math.max(1, Math.hypot(tx - sx, ty - sy)); b.projectile = { x: sx, y: sy, vx: (tx - sx) / len * b.attack.speed, vy: (ty - sy) / len * b.attack.speed, r: b.attack.radius }; } }
      } else if (b.state === "attack") {
        b.timer -= dt;
        if (b.attack.kind === "projectile") { if (b.projectile) { b.projectile.x += b.projectile.vx * dt; b.projectile.y += b.projectile.vy * dt; b.danger = { kind: "circle", x: b.projectile.x, y: b.projectile.y, r: b.projectile.r }; } } else if (b.attackKey !== "stomp") this.lockDanger();
        this.resolveAttackHit();
        if (b.timer <= 0) this.finishBossAttack();
      } else if (b.state === "recover") {
        b.timer -= dt;
        if (b.timer <= 0) { b.state = "idle"; b.timer = C.boss.idle; b.attack = null; b.attackKey = ""; b.danger = null; }
      }
      if (b.state !== "recover") b.poise = Math.max(0, b.poise - C.boss.poiseDecay * dt);
    }

    moveBoss(dt) {
      const b = this.boss, p = this.player, distance = (p.x + p.w / 2) - (b.x + b.w / 2);
      let targetV = 0;
      if (b.state === "idle" || b.state === "recover") {
        if (Math.abs(distance) > C.boss.chaseDistance + 80) targetV = Math.sign(distance) * C.boss.moveSpeed;
        else if (Math.abs(distance) < C.boss.chaseDistance - 110) targetV = -Math.sign(distance) * C.boss.moveSpeed * 0.72;
        else targetV = Math.sin((this.elapsed + b.movePhase) * 1.7) * 42;
      } else if (b.state === "telegraph") {
        targetV = Math.abs(distance) > C.boss.chaseDistance ? Math.sign(distance) * C.boss.moveSpeed * 0.64 : 0;
      } else if (b.state === "attack" && (b.attackKey === "grab" || b.attackKey === "sweep" || b.attackKey === "shoulder" || b.attackKey === "backhand" || b.attackKey === "uppercut" || b.attackKey === "quickSlash" || b.attackKey === "slowBlade" || b.attackKey === "leap")) {
        targetV = b.face * C.boss.lungeSpeed;
      }
      b.vx = moveToward(b.vx, targetV, (b.state === "attack" ? 1500 : 780) * dt);
      b.x = clamp(b.x + b.vx * dt, C.arena.left + 130, C.arena.right - b.w - 130);
      b.movePhase += dt;
    }

    startBossAttack() {
      const b = this.boss, pattern = C.boss.patterns[this.cycle % C.boss.patterns.length];
      const forced = b.hp <= 25 && b.fullScreenUses < 3;
      const airborne = this.player.y + this.player.h < C.arena.groundY - 90 || !!this.player.grapple;
      const key = forced ? "annihilation" : airborne ? (b.patternIndex++ % 2 ? "boulder" : "uppercut") : pattern[b.patternIndex++ % pattern.length]; b.attackKey = key; b.attack = C.boss.attacks[key]; if (forced) b.fullScreenUses++;
      b.state = "telegraph";
      b.timer = b.attack.telegraph * this.diff.telegraph; b.hitResolved = false; b.playerWasThreatened = true;
      b.face = this.player.x < b.x + b.w / 2 ? -1 : 1;
      this.lockDanger(); this.warning = b.attack.hint;
    }

    lockDanger() {
      const b = this.boss, p = this.player, a = b.attack;
      if (a.kind === "screen") b.danger = { kind: "screen" };
      else if (a.kind === "circle") b.danger = { kind: "circle", x: p.x + p.w / 2, y: C.arena.groundY, r: a.radius };
      else {
        const left = b.face < 0 ? b.x - a.reach : b.x + b.w;
        b.danger = { kind: "rect", x: left, y: C.arena.groundY - a.height, w: a.reach, h: a.height };
      }
    }

    updateDanger() {
      const b = this.boss;
      if (b.attackKey === "sweep" || b.attackKey === "shoulder" || b.attackKey === "backhand" || b.attackKey === "uppercut" || b.attackKey === "quickSlash" || b.attackKey === "slowBlade" || b.attackKey === "roar" || b.attackKey === "leap") this.lockDanger();
      if (b.attackKey === "grab") {
        const elapsedRatio = 1 - b.timer / (b.attack.telegraph * this.diff.telegraph);
        if (elapsedRatio < b.attack.trackUntil) { b.face = this.player.x < b.x + b.w / 2 ? -1 : 1; this.lockDanger(); }
      }
    }

    inCounterWindow() {
      const b = this.boss; if (b.state !== "telegraph" || !b.attack) return false;
      const progress = 1 - b.timer / (b.attack.telegraph * this.diff.telegraph);
      return progress >= b.attack.counterStart;
    }

    resolveAttackHit() {
      const b = this.boss, p = this.player; if (b.hitResolved || !b.danger) return;
      const hit = b.danger.kind === "screen" ? true : b.danger.kind === "circle" ? circleRect(b.danger, p) : overlap(b.danger, p);
      if (!hit) return;
      b.hitResolved = true;
      if (p.invuln > 0) {
        if (p.form === "human") { this.stats.perfects++; this.warning = "完美闪避"; }
        return;
      }
      if (b.attackKey === "annihilation" && p.form === "titan") {
        const tookDamage = this.damagePlayer(70);
        if (tookDamage) p.resolve = Math.max(0, p.resolve - Math.max(0, 50 - C.player.resolveLossOnHit));
        this.warning = tookDamage ? "全屏冲击：生命 -70，巨化值 -50" : "全屏冲击被闪避";
        return;
      }
      if (b.attackKey !== "annihilation" && p.form === "titan" && p.braceTime > 0) {
        this.stats.counters++; this.addPoise(b.attackKey === "grab" ? C.player.brace.counterPoise : C.player.brace.counterPoise * 0.72, false);
        this.forceBossRecovery(b.attackKey === "grab" ? "格挡反制抓取" : "装甲格挡：冲击被化解"); return;
      }
      if (p.grapple) { this.cancelGrapple(false); this.warning = "巨人击断绳索：被迫坠落"; }
      let damage = b.attack.damage * this.diff.damage;
      if (p.form === "titan") damage *= C.player.titanDamageScale;
      if (p.braceTime > 0) damage *= 0.5;
      this.damagePlayer(damage);
    }

    finishBossAttack() {
      const b = this.boss;
      if (!b.hitResolved && this.player.form === "human") { this.stats.avoids++; this.warning = "闪避成功"; }
      b.state = "recover"; b.timer = b.attack.recovery * this.diff.recovery; b.danger = null; b.projectile = null;
    }

    forceBossRecovery(text) {
      const b = this.boss; b.state = "recover"; b.timer = b.attack ? b.attack.recovery * 1.25 * this.diff.recovery : 1; b.danger = null; b.projectile = null; this.warning = text;
    }

    damagePlayer(amount) {
      const p = this.player; const damage = Math.round(amount); p.hp = Math.max(0, p.hp - damage); p.resolve = Math.max(0, p.resolve - C.player.resolveLossOnHit);
      p.invuln = 0.65; p.hurt = 0.28; p.vx = (p.x < this.boss.x ? -1 : 1) * 440; p.vy = -260; this.stats.damageTaken += damage; this.warning = "受击：观察预警再行动";
      return true;
    }

    addPoise(amount, allowDown = true) {
      if (this.boss.state === "down" || this.boss.state === "dead") return;
      this.boss.poise = clamp(this.boss.poise + amount, 0, this.boss.poiseMax);
      if (allowDown && this.boss.poise >= this.boss.poiseMax) this.downBoss();
    }

    downBoss() {
      const b = this.boss; b.state = "down"; b.downTimer = C.boss.downTime; b.poise = b.poiseMax; b.danger = null; b.attack = null;
      this.player.grapple = null;
      if (this.player.form === "titan") this.revertHuman("架势击破：立刻攻击后颈");
      this.mode = this.boss.hp <= 10 ? "finale" : "nape"; this.warning = "【攻击后颈】接近发光标记并按 J / F";
    }

    napePoint() {
      if (this.boss.state === "down" || this.boss.state === "dead") {
        return { x: this.boss.x + this.boss.w * 0.78, y: C.arena.groundY - 132 };
      }
      return { x: this.boss.x + this.boss.w * 0.5, y: this.boss.y + 125 };
    }

    checkNape(input) {
      if (this.boss.state !== "down") return;
      const p = this.player, n = this.napePoint(); const distance = Math.hypot(p.x + p.w / 2 - n.x, p.y + p.h / 2 - n.y);
      if (distance < 175 && input.attackPressed) this.beginQte(this.boss.hp <= 10);
    }

    beginQte(final) {
      this.player.attack = null; this.player.grapple = null;
      const pool = ["space", "left", "right"], seed = (this.cycle * 17 + this.boss.hp * 3 + this.stats.napeHits * 11) % 97;
      this.qte.active = true; this.qte.final = !!final; this.qte.sequence = Array.from({ length: final ? 5 : 4 }, (_, i) => pool[(seed + i * 7 + (i * i * 3)) % pool.length]);
      this.qte.index = 0; this.qte.stepTime = (final ? C.qte.finalStepTime : C.qte.stepTime) * this.diff.qte; this.qte.timer = this.qte.stepTime; this.qte.result = "";
      this.warning = final ? "最后一击" : "后颈处决";
    }

    stepQte(dt, input) {
      const q = this.qte; q.timer -= dt;
      if (input.qteKey) {
        if (input.qteKey === q.sequence[q.index]) {
          q.index++; q.timer = q.stepTime;
          if (q.index >= q.sequence.length) this.succeedQte();
        } else this.failNape("输入错误，被甩开");
      } else if (q.timer <= 0) this.failNape("输入超时，被甩开");
    }

    succeedQte() {
      const q = this.qte; q.active = false; this.stats.napeHits++;
      if (q.final || this.boss.hp <= 10 || this.stage === "dialogue") { this.boss.hp = 0; this.killBoss(); return; }
      this.boss.hp = Math.max(10, this.boss.hp - C.boss.napeDamage); this.cycle++;
      if (this.boss.hp <= 10 || this.cycle >= 3) { this.boss.hp = 10; this.beginDialogue(); return; }
      this.resumeCycle("后颈命中，兽之巨人重新站起");
    }

    failNape(reason) {
      this.qte.active = false; this.resumeCycle(`${reason}：处决失败，继续当前阶段`);
    }

    resumeCycle(reason) {
      const b = this.boss; b.state = "recover"; b.timer = C.boss.recoverAfterDown; b.downTimer = 0; b.patternIndex = 0;
      this.player.grapple = null;
      this.player.resolve = Math.max(35, this.player.resolve); this.mode = "human"; this.warning = reason;
    }

    beginDialogue() {
      this.stage = "dialogue"; this.dialogueIndex = 0; this.dialogueTimer = 0.5; this.qte.active = false; this.boss.state = "down"; this.boss.downTimer = 999; this.mode = "finale";
    }

    stepDialogue(dt, input) {
      this.dialogueTimer = Math.max(0, this.dialogueTimer - dt);
      if ((input.skipPressed || input.attackPressed || input.jumpPressed) && this.dialogueTimer <= 0) {
        this.dialogueIndex++; this.dialogueTimer = 0.18;
        if (this.dialogueIndex >= C.dialogue.length) {
          this.stage = "fight"; this.dialogueIndex = C.dialogue.length - 1; this.boss.state = "down"; this.boss.downTimer = 999; this.mode = "finale";
          this.player.x = this.boss.x - 180; this.player.y = this.boss.y + 40; this.warning = "完成最后一击：靠近后颈";
        }
      }
    }

    killBoss() {
      if (this.completed) return;
      this.completed = true; this.stage = "victory"; this.mode = "dead"; this.qte.active = false; this.qte.sequence = []; this.qte.index = 0; this.player.grapple = null; this.boss.state = "dead"; this.boss.hp = 0; this.boss.danger = null; this.boss.projectile = null;
      this.warning = "兽之巨人已击败";
      this.onComplete({ boss: C.boss.name, difficulty: this.difficultyKey, elapsed: this.elapsed, retries: this.retries, stats: Object.assign({}, this.stats) });
    }

    defeat() { this.stage = "defeat"; this.warning = this.fullResetOnRetry ? "按 Space / J 从头开始" : "按 Space / J 从当前轮次重试"; }

    retry() {
      if (this.fullResetOnRetry) { this.fullResetOnRetry = false; this.restart("human"); this.warning = "死亡：从头开始"; return; }
      this.retries++; const hp = this.boss.hp <= 10 ? 10 : Math.max(10, 100 - this.cycle * C.boss.napeDamage);
      this.player = this.makePlayer(); this.player.resolve = 0; this.boss = this.makeBoss(); this.boss.hp = hp; this.stage = "fight"; this.mode = "human"; this.qte.active = false;
      if (hp <= 10) { this.boss.hp = 10; this.downBoss(); this.player.x = this.boss.x - 180; this.player.y = this.boss.y + 40; }
      this.warning = "从当前轮次重试";
    }

    resolveBossSolid() {
    }

    bossLegColliders() {
      const b = this.boss, l = C.boss.legCollider, y = C.arena.groundY - l.height;
      return [{ x: b.x + l.inset, y, w: l.width, h: l.height }, { x: b.x + b.w - l.inset - l.width, y, w: l.width, h: l.height }];
    }

    snapshot() {
      return { version: C.version, elapsed: this.elapsed, stage: this.stage, mode: this.mode, cycle: this.cycle, retries: this.retries,
        difficulty: this.difficultyKey, warning: this.warning, player: Object.assign({}, this.player), boss: Object.assign({}, this.boss),
        qte: Object.assign({}, this.qte, { sequence: this.qte.sequence.slice() }), stats: Object.assign({}, this.stats),
        dialogue: this.stage === "dialogue" ? C.dialogue[this.dialogueIndex] : null };
    }
  }

  global.GatekeeperBattle = GatekeeperBattle;
  global.GatekeeperEmptyInput = emptyInput;
}(window));

