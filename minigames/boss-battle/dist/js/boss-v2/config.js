(function (global) {
  "use strict";

  const CONFIG = {
    version: "2.2.0",
    fixedStep: 1 / 120,
    maxFrame: 0.05,
    arena: {
      width: 2200,
      height: 900,
      groundY: 790,
      left: 40,
      right: 2160,
      anchors: [
        { x: 260, y: 310 }, { x: 620, y: 220 }, { x: 980, y: 300 },
        { x: 1320, y: 210 }, { x: 1680, y: 290 }, { x: 2020, y: 230 }
      ]
    },
    difficulty: {
      normal: { label: "NORMAL", telegraph: 1.1, damage: 0.85, recovery: 1.15, resolve: 1.15, qte: 1.1 },
      hard: { label: "HARD", telegraph: 0.9, damage: 1, recovery: 1, resolve: 1, qte: 1 },
      nightmare: { label: "NIGHTMARE", telegraph: 0.72, damage: 1.25, recovery: 0.82, resolve: 0.85, qte: 0.82 }
    },
    player: {
      maxHp: 140,
      human: {
        w: 26, h: 38, accel: 2600, airAccel: 1650, maxSpeed: 310,
        jump: 690, jumpCut: 135, gravity: 2050, maxFall: 980,
        coyoteTime: 0.1, jumpBufferTime: 0.12
      },
      titan: { w: 260, h: 470, accel: 2500, airAccel: 1500, maxSpeed: 360, jump: 640, gravity: 1750, maxFall: 900 },
      friction: 2400,
      airControl: 0.62,
      dash: { speed: 720, duration: 0.18, invuln: 0.24, cooldown: 0.58, cost: 12 },
      grapple: {
        range: 700, minLength: 86, retractSpeed: 210, pull: 500, liftBonus: 165,
        springStrength: 18, maxTension: 1200, tangentAcceleration: 360,
        maxSpeed: 620, damping: 0.992, gasPerSecond: 28, arriveDistance: 58, maxLatchTime: 2.5
      },
      gasMax: 100,
      gasRegen: 16,
      resolveStart: 0,
      resolveRequired: 100,
      resolveOnAvoid: 11,
      resolveOnPerfect: 23,
      resolveOnCounter: 18,
      resolveLossOnHit: 14,
      resolveDecay: 1.5,
      transformWindup: 0.65,
      titanEnergy: 100,
      titanDrain: 2.1,
      titanDamageScale: 0.28,
      humanBlade: { windup: 0.06, active: 0.11, recover: 0.16, range: 112, poiseOpen: 7, poiseClosed: 1, poiseAerial: 14, resolveOpen: 9, resolveClosed: 3, resolveAerial: 13, speedThreshold: 390 },
      quick: { windup: 0.07, active: 0.15, recover: 0.14, range: 180, poiseOpen: 32, poiseClosed: 14, hpDamage: 5 },
      heavy: { windup: 0.26, active: 0.22, recover: 0.34, range: 235, poiseOpen: 65, poiseClosed: 22, hpDamage: 12, counterPoise: 58 },
      brace: { duration: 0.42, cooldown: 0.8, counterPoise: 30 }
    },
    boss: {
      name: "兽之巨人",
      maxHp: 100,
      x: 1480,
      w: 260,
      h: 470,
      solidPadding: 12,
      escapeSpeed: 280,
      moveSpeed: 205,
      chaseDistance: 320,
      lungeSpeed: 470,
      turnRate: 0.18,
      legCollider: { width: 66, height: 178, inset: 22 },
      poiseMax: 160,
      poiseDecay: 4,
      idle: 0.28,
      downTime: 6.5,
      napeDamage: 30,
      recoverAfterDown: 1.15,
      patterns: [
        ["quickSlash", "shoulder", "boulder", "slowBlade", "stomp", "grab", "roar", "leap", "backhand", "spear"],
        ["grab", "quickSlash", "spear", "shoulder", "leap", "boulder", "slowBlade", "uppercut", "backhand", "stomp"],
        ["stomp", "slowBlade", "grab", "boulder", "shoulder", "roar", "quickSlash", "leap", "uppercut", "sweep"]
      ],
      attacks: {
        sweep: {
          name: "横扫",
          hint: "横扫：穿过Boss或冲刺离开红区",
          telegraph: 0.9,
          active: 0.2,
          recovery: 1.05,
          damage: 20,
          kind: "rect",
          reach: 520,
          height: 250,
          counterStart: 0.64
        },
        stomp: {
          name: "踩踏",
          hint: "踩踏：离开锁定圆，冲击落下前不要回头",
          telegraph: 1.05,
          active: 0.22,
          recovery: 1.2,
          damage: 26,
          kind: "circle",
          radius: 230,
          counterStart: 0.72
        },
        grab: {
          name: "抓取",
          hint: "抓取：锁定前变向；巨人形态可格挡反制",
          telegraph: 1.12,
          active: 0.25,
          recovery: 1.28,
          damage: 32,
          kind: "rect",
          reach: 430,
          height: 330,
          trackUntil: 0.58,
          counterStart: 0.6
        },
        shoulder: {
          name: "装甲冲撞", hint: "装甲冲撞：斜向闪避，别被逼到墙角", telegraph: 0.62, active: 0.3, recovery: 0.88, damage: 28, kind: "rect", reach: 390, height: 285, counterStart: 0.72
        },
        backhand: {
          name: "回身重臂", hint: "回身重臂：绕到背后，红区会突然反转", telegraph: 0.56, active: 0.2, recovery: 0.82, damage: 24, kind: "rect", reach: 360, height: 235, counterStart: 0.7
        },
        roar: {
          name: "装甲咆哮", hint: "装甲咆哮：全场冲击，跳起或立刻脱离", telegraph: 0.68, active: 0.24, recovery: 0.98, damage: 24, kind: "circle", radius: 320, counterStart: 0.78
        },
        leap: {
          name: "跃击震地", hint: "跃击震地：巨人落点会炸开，空中也会被追击", telegraph: 0.72, active: 0.28, recovery: 1.02, damage: 30, kind: "circle", radius: 275, counterStart: 0.8
        },
        boulder: {
          name: "装甲投掷", hint: "装甲投掷：远程碎片来袭，预判轨迹并穿过空隙", telegraph: 0.52, active: 1.5, recovery: 0.7, damage: 30, kind: "projectile", speed: 420, radius: 42, counterStart: 0.8
        },
        spear: {
          name: "装甲飞矛", hint: "装甲飞矛：直线高速穿刺，跳跃或反向闪避", telegraph: 0.42, active: 1.25, recovery: 0.62, damage: 34, kind: "projectile", speed: 760, radius: 24, counterStart: 0.84
        },
        uppercut: {
          name: "升龙破甲", hint: "升龙破甲：近身上挑，空中也会被抓到", telegraph: 0.46, active: 0.24, recovery: 0.72, damage: 32, kind: "rect", reach: 300, height: 430, counterStart: 0.74
        },
        quickSlash: {
          name: "瞬发快刀", hint: "瞬发快刀：预警极短，立刻改变方向", telegraph: 0.2, active: 0.16, recovery: 0.5, damage: 22, kind: "rect", reach: 360, height: 270, counterStart: 0.9
        },
        slowBlade: {
          name: "蓄势慢刀", hint: "蓄势慢刀：延迟更久但覆盖巨大，不要过早闪避", telegraph: 1.18, active: 0.3, recovery: 0.82, damage: 44, kind: "rect", reach: 560, height: 300, counterStart: 0.78
        },
        annihilation: {
          name: "装甲灭场", hint: "装甲灭场：全屏冲击！闪避可无伤，巨人硬抗会损失生命和巨化值", telegraph: 0.9, active: 0.26, recovery: 1.15, damage: 100, kind: "screen", counterStart: 0.98
        }
      }
    },
    qte: {
      stepTime: 0.56,
      finalStepTime: 0.42,
      failDamage: 18
    },
    dialogue: [
      { speaker: "阿尔敏", text: "装甲裂开了！他正在把意识转移到全身。" },
      { speaker: "韩吉", text: "别给他恢复的时间——弱点仍然是后颈。" },
      { speaker: "利威尔", text: "从屋顶绕过去。只需要一次干净的斩击。" },
      { speaker: "韩吉", text: "他的后颈暴露了，抓住这几秒。" }
    ]
  };

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.keys(value).forEach(key => deepFreeze(value[key]));
    return value;
  }

  global.GATEKEEPER_CONFIG = deepFreeze(CONFIG);
}(window));

