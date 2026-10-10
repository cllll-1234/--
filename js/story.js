/* Version 3.0 主线剧情：总部探索入口、短场景、选择、调查、小游戏与多结局。 */
(function () {
  "use strict";

  const START_SCENE = "prologue_09";
  const B = {
    city: "images/bg/city.png",
    gate: "images/bg/gate.png",
    field: "images/bg/forest.png",
    training: "images/bg/training.png",
    crisis: "images/bg/disaster.png",
    street: "images/maps/street_sermon.webp",
    oldTown: "images/maps/oldtown.png",
    tavern: "images/maps/underground-tavern.png",
    oldChurch: "images/maps/old_church.png",
    warehouse: "images/maps/warehouse_interior.png"
  };
  const C = {
    reiner: "images/characters/dialog/reiner_normal.png",
    reinerTrauma: "images/characters/dialog/reiner_trauma.png",
    bertholdt: "images/characters/dialog/bertholdt_normal.png",
    dawnbreakerCross: "images/characters/dialog/十字架.png",
    g17Vial: "images/characters/dialog/G-17完整版.png",
    g17Damaged: "images/characters/dialog/G-17破损版.png",
    hange: "images/characters/dialog/hange_normal.png",
    hangeWorried: "images/characters/dialog/hange_worried.png",
    levi: "images/characters/dialog/levi_normal.png",
    priest: "images/characters/dialog/priest_normal.png",
    soldier: "images/characters/dialog/hq_soldier.png",
    medic: "images/characters/dialog/medic_normal.png",
    civilianA: "images/characters/dialog/civilian_a.png",
    civilianB: "images/characters/dialog/civilian_b.png",
    blackMarketMerchant: "images/characters/dialog/sannes_normal.png",
    tavernOwner: "images/characters/dialog/tavern_owner.png",
    tavernCustomerA: "images/characters/dialog/tavern_customer_a.png",
    tavernCustomerB: "images/characters/dialog/tavern_customer_b.png",
    oldwoman: "images/characters/dialog/oldwoman.png",
    karlMother: "images/characters/dialog/karl_mother_normal.png",
    dawnbreakersNote: "images/objects/dawnbreakers-note.png",
    passerby: "images/characters/dialog/passerby.png",
    female: "images/characters/female.png"
  };
  const chapters = [
    { id: "prologue", title: "序章 · 失忆者" },
    { id: "chapter1", title: "第一章 · 尸体上的十字架" },
    { id: "chapter2", title: "第二章 · 消失的人" },
    { id: "chapter3", title: "第三章 · 墙后的档案" },
    { id: "chapter4", title: "第四章 · 钟楼与破墙之日" },
    { id: "chapter5", title: "第五章 · 黎明之前" },
    { id: "ending", title: "结局" }
  ];
  const chapter2CoreClues = Object.freeze([
    Object.freeze({ flag: "clue_missing_people", label: "大量失踪人口" }),
    Object.freeze({ flag: "clue_night_carriage", label: "深夜马车" }),
    Object.freeze({ flag: "clue_seventh_dock", label: "第七码头" })
  ]);
  const chapter2RequiredFlags = Object.freeze(chapter2CoreClues.map(function (clue) { return clue.flag; }));

  function getChapter2MissingClues(flags) {
    return chapter2CoreClues.filter(function (clue) { return !flags || !flags[clue.flag]; });
  }

  function getChapter2Objective(flags) {
    const missing = getChapter2MissingClues(flags);
    return missing.length
      ? "调查地下街，尚缺核心线索：\n" + missing.map(function (clue) { return "• " + clue.label; }).join("\n")
      : "核心线索已齐：返回调查兵团总部";
  }

  function createScene(data) {
    const scene = Object.assign({
      chapter: "", speaker: "", text: "", background: B.city, character: "",
      choices: [], minigame: null, conditions: null, routes: [], flags: [], evidence: [],
      achievement: null, objective: null, next: "", ending: null, returnToExplore: false, autosave: true,
      targetMap: "", returnTransition: null, exploreOnly: false, effect: "", hideDialog: false,
      autoAdvance: 0, autoStartMinigame: false, audio: []
    }, data);
    if (scene.speaker === "韩吉" && (!data.character || data.character === C.female)) scene.character = C.hange;
    if (scene.speaker === "莱纳" || scene.speaker === "记忆中的莱纳" || scene.speaker === "年迈的莱纳") scene.character = C.reiner;
    if (scene.speaker === "贝尔托特") scene.character = C.bertholdt;
    if (scene.speaker === "利威尔") scene.character = C.levi;
    if (scene.speaker === "巨壁教祭司") scene.character = C.priest;
    if (scene.speaker === "士兵" || scene.speaker === "普通士兵" || scene.speaker === "驻地士兵" || scene.speaker === "年轻士兵") scene.character = C.soldier;
    if (scene.speaker === "医疗兵") scene.character = C.medic;
    if (scene.speaker === "普通民众A") scene.character = C.civilianA;
    if (scene.speaker === "普通民众B") scene.character = C.civilianB;
    if (scene.speaker === "黑市商人") scene.character = C.blackMarketMerchant;
    if (scene.speaker === "酒馆老板") scene.character = C.tavernOwner;
    if (scene.speaker === "左侧顾客") scene.character = C.tavernCustomerA;
    if (scene.speaker === "右侧顾客") scene.character = C.tavernCustomerB;
    if (scene.speaker === "老妇人" && !data.character) scene.character = C.oldwoman;
    if (scene.speaker === "路人" || scene.speaker === "旁观路人") scene.character = C.passerby;
    return Object.freeze(scene);
  }

  function churchScene(data) {
    return createScene(Object.assign({ chapter: "第二章 · 旧教堂", background: B.oldChurch }, data));
  }

  const scenes = {
    /* =========================
       序章 · 失忆者
       莱纳的噩梦视频结束后，直接从病床上的对话进入总部探索。
       ========================= */
    prologue_09: createScene({ chapter: "序章 · 失忆者", speaker: "医疗兵", text: "又做噩梦了？", background: B.training, character: C.medic, next: "prologue_10" }),
    prologue_10: createScene({ chapter: "序章 · 失忆者", speaker: "莱纳", text: "嗯......", background: B.training, character: C.reiner, next: "prologue_11" }),
    prologue_11: createScene({ chapter: "序章 · 失忆者", speaker: "医疗兵", text: "你的伤还没完全恢复。韩吉分队长说，如果又出现头痛或者记忆混乱，请你立刻告诉她。", background: B.training, character: C.medic, next: "prologue_12" }),
    prologue_12: createScene({ chapter: "序章 · 失忆者", speaker: "莱纳", text: "嗯......", background: B.training, character: C.reiner,
      flags: ["prologueDreamComplete"], objective: "去找韩吉谈谈", targetMap: "hq", returnToExplore: true }),

    /* 调查兵团总部 */
    hq_hange_intro_01: createScene({ chapter: "序章 · 调查兵团总部", speaker: "韩吉", text: "又做梦了？", background: B.training, character: C.hange, next: "hq_hange_intro_02" }),
    hq_hange_intro_02: createScene({ chapter: "序章 · 调查兵团总部", speaker: "莱纳", text: "嗯......", background: B.training, character: C.reiner, next: "hq_hange_intro_03" }),
    hq_hange_intro_03: createScene({ chapter: "序章 · 调查兵团总部", speaker: "韩吉", text: "你还记得玛丽亚之墙被攻破的那一天吗？", background: B.training, character: C.hange, choices: [
      { id: "hq_remember_nothing", text: "完全不记得。", flags: ["forgotWallMariaDay"], next: "hq_hange_memory_clue" },
      { id: "hq_remember_crying", text: "我只记得有人在哭。", flags: ["rememberedCrying"], next: "hq_hange_memory_clue" },
      { id: "hq_refuse_memory", text: "我不想谈。", flags: ["refusedMemoryTalk"], next: "hq_hange_memory_clue" }
    ] }),
    hq_hange_memory_clue: createScene({ chapter: "序章 · 调查兵团总部", speaker: "韩吉", text: "嗯......记忆缺失本身也是一种线索。", background: B.training, character: C.hange, next: "hq_hange_intro_done" }),
    hq_hange_intro_done: createScene({ chapter: "序章 · 调查兵团总部", speaker: "韩吉", text: "现在没有任务，出去走走吧，别闷着总部啦。", background: B.training, character: C.hange,
      flags: ["hqIntroComplete"], objective: "离开总部，经过巨壁教布道街道", returnToExplore: true }),
    hq_hange_after_01: createScene({ chapter: "序章 · 调查兵团总部", speaker: "韩吉", text: "出去走走吧，也许换个环境能让你的脑袋安静一点。", background: B.training, character: C.hange, returnToExplore: true }),
    hq_levi_01: createScene({ chapter: "序章 · 调查兵团总部", speaker: "利威尔", text: "能走就别装死。", background: B.training, character: C.levi, returnToExplore: true }),
    hq_soldier_01: createScene({ chapter: "序章 · 调查兵团总部", speaker: "驻地士兵", text: "巨人的活动又频繁起来了啊", background: B.training, character: C.soldier, returnToExplore: true }),
    hq_medic_01: createScene({ chapter: "序章 · 调查兵团总部", speaker: "医疗兵", text: "你头上的伤还没完全好，别逞强。", background: B.training, character: C.medic, next: "hq_medic_02" }),
    hq_medic_02: createScene({ chapter: "序章 · 调查兵团总部", speaker: "莱纳", text: "我已经休息得够久了。", background: B.training, character: C.reiner, returnToExplore: true }),
    hq_priest_01: createScene({ chapter: "序章 · 调查兵团总部", speaker: "医疗兵", text: "你头上的伤还没完全好，别逞强。", background: B.training, character: C.medic, next: "hq_medic_02" }),

    /* 序章后半段 · 巨壁教布道街道 */
    street_01_enter: createScene({ chapter: "序章 · 巨壁教布道", speaker: "", text: "", background: B.street,
      exploreOnly: true, flags: ["streetEntered"], objective: "经过布道街道；可与居民交谈或调查周围" }),
    street_02_civilian_a: createScene({ chapter: "序章 · 巨壁教布道", speaker: "信徒A", text: "听说最近又有人在墙外看见巨人了......", background: B.street, flags: ["streetTalkedCivilianA"], returnToExplore: true }),
    street_03_civilian_b: createScene({ chapter: "序章 · 巨壁教布道", speaker: "信徒B", text: "祭司大人说得没错。只要墙还在，我们就还有神的庇护!", background: B.street, flags: ["streetTalkedCivilianB"], returnToExplore: true }),
    street_04_oldwoman: createScene({ chapter: "序章 · 巨壁教布道", speaker: "老妇", text: "巨壁是我们的庇护，我们必不至流离", background: B.street, flags: ["streetTalkedOldwoman"], returnToExplore: true }),
    street_23_passerby: createScene({ chapter: "序章 · 巨壁教布道", speaker: "旁观路人", text: "奥秘不属于凡人，唯有虔信可得安宁", background: B.street, flags: ["streetTalkedPasserby"], returnToExplore: true }),
    street_dawn_symbol: createScene({ chapter: "序章 · 巨壁教布道", speaker: "旁白", text: "墙角有一枚被黑漆覆盖大半的图案：一轮太阳正从地平线上升起。莱纳觉得眼熟，却想不起在哪里见过。", background: B.street, flags: ["streetDawnSymbolRead"], evidence: ["dawn_symbol"], returnToExplore: true }),
    street_06_trigger: createScene({ chapter: "序章 · 巨壁教布道", speaker: "", text: "", background: B.street, flags: ["sermonTriggered"], effect: "sermon-lock", hideDialog: true, autoAdvance: 180, next: "street_07_sermon_1" }),
    street_07_sermon_1: createScene({ chapter: "序章 · 巨壁教布道", speaker: "巨壁教祭司", text: "墙，是神留给人类最后的慈悲。", background: B.street, audio: ["churchBell"], next: "street_08_sermon_2" }),
    street_08_sermon_2: createScene({ chapter: "序章 · 巨壁教布道", speaker: "巨壁教祭司", text: "墙外只有死亡。", background: B.street, next: "street_09_sermon_3" }),
    street_09_sermon_3: createScene({ chapter: "序章 · 巨壁教布道", speaker: "巨壁教祭司", text: "妄图跨越高墙的人，教唆无知者跨越高墙的人，最终都被巨人吞噬。", background: B.street, next: "street_11_flash_start" }),
    street_11_flash_start: createScene({ chapter: "序章 · 巨壁教布道", speaker: "", text: "针管。", background: B.crisis, flags: ["reinerFlashbackStarted"], effect: "flash-start", hideDialog: true, audio: ["heartbeat", "tinnitus"], autoAdvance: 720, next: "street_12_flash_1" }),
    street_12_flash_1: createScene({ chapter: "序章 · 巨壁教布道", speaker: "", text: "被绑住的手。", background: B.crisis, effect: "memory-fragment", hideDialog: true, autoAdvance: 760, next: "street_13_flash_2" }),
    street_13_flash_2: createScene({ chapter: "序章 · 巨壁教布道", speaker: "记忆", text: "对象确认。", background: B.crisis, effect: "memory-fragment", hideDialog: true, autoAdvance: 760, next: "street_14_flash_3" }),
    street_14_flash_3: createScene({ chapter: "序章 · 巨壁教布道", speaker: "记忆", text: "准备净化。", background: B.crisis, effect: "memory-fragment", hideDialog: true, autoAdvance: 860, next: "street_18_collapse" }),
    street_15_flash_4: createScene({ chapter: "序章 · 巨壁教布道", speaker: "", text: "高墙边的铁门。", background: B.crisis, effect: "memory-fragment", hideDialog: true, autoAdvance: 800, next: "street_18_collapse" }),
    street_16_flash_5: createScene({ chapter: "序章 · 巨壁教布道", speaker: "", text: "哭声。", background: B.crisis, effect: "memory-fragment", hideDialog: true, autoAdvance: 760, next: "street_18_collapse" }),
    street_17_flash_6: createScene({ chapter: "序章 · 巨壁教布道", speaker: "", text: "巨人的吼声。", background: B.crisis, effect: "memory-roar", hideDialog: true, autoAdvance: 900, next: "street_18_collapse" }),
    street_18_collapse: createScene({ chapter: "序章 · 巨壁教布道", speaker: "", text: "", background: B.street, effect: "collapse", hideDialog: true, autoAdvance: 900, next: "street_19_reiner_1" }),
    street_19_reiner_1: createScene({ chapter: "序章 · 巨壁教布道", speaker: "莱纳", text: "……刚才那是什么？", background: B.street, character: C.reinerTrauma, next: "street_20_reiner_2" }),
    street_20_reiner_2: createScene({ chapter: "序章 · 巨壁教布道", speaker: "莱纳", text: "巨人么......", background: B.street, character: C.reinerTrauma, flags: ["churchMemorySuspicion"], next: "street_return_objective" }),
    street_21_reiner_3: createScene({ chapter: "序章 · 巨壁教布道", speaker: "莱纳", text: "……", background: B.street, character: C.reinerTrauma, next: "street_return_objective" }),
    street_22_reiner_4: createScene({ chapter: "序章 · 巨壁教布道", speaker: "莱纳", text: "先回总部。", background: B.street, character: C.reinerTrauma, next: "street_return_objective" }),
    street_23_aftershock: createScene({ chapter: "序章 · 巨壁教布道", speaker: "旁观路人", text: "你还好吧？", background: B.street, next: "street_return_objective" }),
    street_24_objective: createScene({ chapter: "序章 · 巨壁教布道", speaker: "系统", text: "韩吉队长似乎有任务找你。", background: B.street, next: "street_return_objective" }),
    street_return_objective: createScene({ chapter: "序章 · 巨壁教布道", speaker: "系统", text: "韩吉队长似乎有任务找你，请返回调查兵团总部。", background: B.street, flags: ["streetReturnPrompted"], objective: "从来时的入口返回调查兵团总部", returnToExplore: true }),
    street_25_exit: createScene({ chapter: "序章 · 巨壁教布道", speaker: "", text: "序章结束", background: B.crisis, effect: "chapter-card", hideDialog: true, autoAdvance: 900, next: "chapter1_intro" }),

    /* 返回总部后的任务说明 */
    hq_mission_briefing_01: createScene({ chapter: "序章 · 任务说明", speaker: "韩吉", text: "你来了啊，莱纳。刚收到巡逻队报告。", background: B.training, character: C.hange, next: "hq_mission_briefing_02" }),
    hq_mission_briefing_02: createScene({ chapter: "序章 · 任务说明", speaker: "韩吉", text: "最近有一只巨人一直在玛利亚之墙旧城区附近徘徊。这次任务除了清剿，我还想观察它的活动规律。嘿嘿...嘿...", background: B.training, character: C.hange, next: "hq_mission_briefing_03" }),
    hq_mission_briefing_03: createScene({ chapter: "序章 · 任务说明", speaker: "驻地士兵", text: "奇怪，那一带早就没有活人了啊。", background: B.training, character: C.soldier, next: "hq_mission_briefing_04" }),
    hq_mission_briefing_04: createScene({ chapter: "序章 · 任务说明", speaker: "韩吉", text: "所以才值得去看。准备装备，出发！", background: B.training, character: C.hange, flags: ["hqMissionBriefingComplete", "prologueComplete"], next: "chapter1_intro" }),

    /* =========================
       第一章 · 尸体上的十字架
       ========================= */
    chapter1_intro: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "", text: "第一章\n尸体上的十字架", background: B.crisis, effect: "chapter-card", hideDialog: true, autoAdvance: 1500, objective: "调查玛利亚之墙旧城区", targetMap: "chapter1_ruins", returnToExplore: true }),
    chapter1_ruins_enter: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "", text: "", background: B.oldTown, exploreOnly: true, flags: ["chapter1RuinsEntered"], objective: "探索旧城区，寻找异常痕迹" }),
    chapter1_ruins_hange_idle: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "韩吉", text: "先看看旧城区留下了什么。别离得太远。", background: B.oldTown, character: C.hange, returnToExplore: true }),
    chapter1_ruins_soldier_idle: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "普通士兵", text: "这里比巡逻报告里看起来还要安静。", background: B.oldTown, character: C.soldier, returnToExplore: true }),

    chapter1_ruins_wagon_01: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "莱纳", text: "已经烧得看不出原来的样子了。", background: B.oldTown, character: C.reiner, next: "chapter1_ruins_wagon_02" }),
    chapter1_ruins_wagon_02: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "普通士兵", text: "845年留下的。", background: B.oldTown, character: C.soldier, next: "chapter1_ruins_wagon_03" }),
    chapter1_ruins_wagon_03: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "莱纳", text: "……", background: B.oldTown, character: C.reiner, flags: ["chapter1WagonChecked"], returnToExplore: true }),

    chapter1_ruins_graffiti_01: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "莱纳", text: "……", background: B.oldTown, character: C.reiner, next: "chapter1_ruins_graffiti_02" }),
    chapter1_ruins_graffiti_memory_01: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "陌生男人", text: "等门打开以后……", background: B.crisis, effect: "memory-fragment", hideDialog: true, autoAdvance: 1100, next: "chapter1_ruins_graffiti_memory_02" }),
    chapter1_ruins_graffiti_03: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "韩吉", text: "莱纳？", background: B.oldTown, character: C.hangeWorried, next: "chapter1_ruins_graffiti_04" }),
    chapter1_ruins_graffiti_04: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "莱纳", text: "刚才……", background: B.oldTown, character: C.reinerTrauma, next: "chapter1_ruins_graffiti_05" }),
    chapter1_ruins_graffiti_05: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "莱纳", text: "不......没事", background: B.oldTown, character: C.reinerTrauma,
      flags: ["clue_sea_memory", "chapter1GraffitiRead"], evidence: ["sea_memory"], returnToExplore: true }),

    chapter1_ruins_dawn_01: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "莱纳", text: "这个图案……", background: B.oldTown, character: C.reiner, next: "chapter1_ruins_dawn_02" }),
    chapter1_ruins_dawn_02: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "韩吉", text: "你见过？", background: B.oldTown, character: C.hange, next: "chapter1_ruins_dawn_03" }),
    chapter1_ruins_dawn_03: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "莱纳", text: "嗯。", background: B.oldTown, character: C.reiner, next: "chapter1_ruins_dawn_04" }),
    chapter1_ruins_dawn_04: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "韩吉", text: "不是巨壁教的标志。", background: B.oldTown, character: C.hange, next: "chapter1_ruins_dawn_05" }),
    chapter1_ruins_dawn_05: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "韩吉", text: "更像某种组织留下的记号。", background: B.oldTown, character: C.hange, next: "chapter1_ruins_dawn_06" }),
    chapter1_ruins_dawn_06: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "莱纳", text: "什么组织？", background: B.oldTown, character: C.reiner, next: "chapter1_ruins_dawn_07" }),
    chapter1_ruins_dawn_07: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "韩吉", text: "我也不清楚。", background: B.oldTown, character: C.hange,
      flags: ["clue_dawn_symbol", "chapter1DawnSymbolRead"], evidence: ["ruins_dawn_symbol"], returnToExplore: true }),

    chapter1_ruins_footprints_01: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "韩吉", text: "新的。", background: B.oldTown, character: C.hange, next: "chapter1_ruins_footprints_02" }),
    chapter1_ruins_footprints_02: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "莱纳", text: "多久？", background: B.oldTown, character: C.reiner, next: "chapter1_ruins_footprints_03" }),
    chapter1_ruins_footprints_03: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "韩吉", text: "一两天。", background: B.oldTown, character: C.hange, next: "chapter1_ruins_footprints_04" }),
    chapter1_ruins_footprints_04: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "莱纳", text: "明明已经没人了。", background: B.oldTown, character: C.reiner, next: "chapter1_ruins_footprints_05" }),
    chapter1_ruins_footprints_05: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "韩吉", text: "嗯......奇怪", background: B.oldTown, character: C.hange,
      flags: ["clue_titan_footprints"], evidence: ["titan_footprints"], returnToExplore: true }),

    chapter1_titan_roar: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "", text: "吼——！", background: B.oldTown,
      effect: "titan-encounter", hideDialog: true, audio: ["titanRoar"], autoAdvance: 700, flags: ["chapter1TitanTriggered"], next: "chapter1_titan_warning_01" }),
    chapter1_titan_warning_01: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "普通士兵", text: "前方！", background: B.oldTown, character: C.soldier, next: "chapter1_titan_warning_02" }),
    chapter1_titan_warning_02: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "韩吉", text: "十二米级！", background: B.oldTown, character: C.hangeWorried, next: "chapter1_titan_warning_03" }),
    chapter1_titan_warning_03: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "韩吉", text: "莱纳！", background: B.oldTown, character: C.hangeWorried, next: "chapter1_titan_warning_04" }),
    chapter1_titan_warning_04: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "莱纳", text: "明白！", background: B.oldTown, character: C.reiner, next: "chapter1_titan_warning_05" }),
    chapter1_titan_warning_05: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "韩吉", text: "帮我牵制它！", background: B.oldTown, character: C.hangeWorried, next: "chapter1_before_maneuver" }),
    chapter1_before_maneuver: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "莱纳", text: "上了！", background: B.oldTown, character: C.reiner,
      flags: ["chapter1_minigame_started", "chapter1TitanTriggered"], autoStartMinigame: true,
      minigame: { type: "maneuver", resultKey: "maneuver", label: "进入立体机动", onSuccess: "chapter1_maneuver_success", onFailure: "chapter1_maneuver_fail", onUnavailable: "chapter1_maneuver_fail" } }),
    chapter1_maneuver_success: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "韩吉", text: "干得不错。它倒了。", background: B.oldTown, character: C.hange, next: "chapter1_maneuver_success_02" }),
    chapter1_maneuver_success_02: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "韩吉", text: "趁它还没完全蒸发，去看看尸体。", background: B.oldTown, character: C.hange, objective: "调查倒下的巨人", returnToExplore: true }),
    chapter1_maneuver_fail: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "旁白", text: "猛烈的冲击让莱纳的视野一黑。普通士兵抓住他的绳索，把他拖离攻击范围。", background: B.oldTown, flags: ["dodgeFailed"], next: "chapter1_maneuver_fail_02" }),
    chapter1_maneuver_fail_02: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "韩吉", text: "巨人倒下了！你没事吧莱纳，还站得起来吗？", background: B.oldTown, character: C.hangeWorried, next: "chapter1_maneuver_fail_03" }),
    chapter1_maneuver_fail_03: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "莱纳", text: "……还能动。", background: B.oldTown, character: C.reiner, objective: "调查倒下的巨人", returnToExplore: true }),

    chapter1_body_investigation: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "韩吉", text: "蒸汽还没散完。你想先看哪里？", background: B.oldTown, character: C.hange, choices: [
      { id: "inspect_body_clothes", text: "调查后颈", conditions: { notEvidence: ["titan_clothes"] }, next: "chapter1_body_clothes" },
      { id: "inspect_body_hands", text: "调查手部", conditions: { notEvidence: ["titan_hands"] }, next: "chapter1_body_bone" },
      { id: "inspect_body_metal", text: "调查金属反光", next: "chapter1_body_metal" }
    ] }),
    chapter1_body_bone: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "莱纳", text: "这手掌，可以用沧桑来形容啊......", background: B.oldTown, character: C.reiner, evidence: ["titan_hands"], next: "chapter1_body_investigation" }),
    chapter1_body_clothes: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "莱纳", text: "后颈是巨人的唯一弱点，看来砍中了呢", background: B.oldTown, character: C.reiner, evidence: ["titan_clothes"], next: "chapter1_body_investigation" }),
    chapter1_body_metal: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "旁白", text: "莱纳在地上捡起一枚银色十字架。", background: B.oldTown, next: "chapter1_cross_found" }),
    chapter1_cross_found: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "获得物品", text: "【太阳十字架】\n正面是普通的银色十字架；背面刻着与残墙相同的升起太阳。", background: B.oldTown,
      flags: ["clue_cross_obtained", "crossFound"], evidence: ["dawn_cross"], achievement: "relic_cross", next: "chapter1_cross_reflection" }),

    chapter1_cross_reflection: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "莱纳", text: "总感觉在哪见过这东西。", background: B.oldTown, character: C.reiner, choices: [
      { id: "give_cross_to_hange", text: "把它交给韩吉调查", next: "chapter1_cross_share_reiner" },
      { id: "keep_cross_secret", text: "自己偷偷留下", next: "chapter1_cross_hide_reiner" }
    ] }),
    chapter1_cross_share_reiner: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "莱纳", text: "要相信自己的队友啊。", background: B.oldTown, character: C.reiner, next: "chapter1_cross_share_hange_look" }),
    chapter1_cross_share_hange_look: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "韩吉", text: "（仔细端详.......）", background: B.oldTown, character: C.hange, next: "chapter1_cross_share_hange_clue" }),
    chapter1_cross_share_hange_clue: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "韩吉", text: "这个......好像是地下街的东西。", background: B.oldTown, character: C.hange, next: "chapter1_cross_share_reiner_ask" }),
    chapter1_cross_share_reiner_ask: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "莱纳", text: "地下街么.....", background: B.oldTown, character: C.reiner, next: "chapter1_cross_share_hange_return" }),
    chapter1_cross_share_hange_return: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "韩吉", text: "好！今天总算没有白来，我们回去！", background: B.oldTown, character: C.hange, flags: ["chapter1Complete"], next: "chapter1_end_voice_01" }),
    chapter1_cross_hide_reiner: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "莱纳", text: "（有些话还是不说为好......）", background: B.oldTown, character: C.reiner, next: "chapter1_cross_hide_hange_return" }),
    chapter1_cross_hide_hange_return: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "韩吉", text: "唉。没什么收获嘛，只是杀了一只巨人宝宝，我们回去吧。", background: B.oldTown, character: C.hange, flags: ["chapter1Complete"], next: "chapter1_end_voice_01" }),

    chapter1_end_voice_01: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "模糊的声音", text: "莱纳……", background: B.crisis, effect: "memory-fragment", hideDialog: true, autoAdvance: 900, next: "chapter1_end_voice_02" }),
    chapter1_end_voice_02: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "模糊的声音", text: "门——", background: B.crisis, effect: "memory-fragment", hideDialog: true, autoAdvance: 650, next: "chapter1_end_card" }),
    chapter1_end_card: createScene({ chapter: "第一章 · 尸体上的十字架", speaker: "", text: "第一章结束", background: B.crisis, effect: "chapter-card", hideDialog: true, autoAdvance: 1200, next: "chapter2_intro" }),

    /* =========================
       第二章 · 消失的人
       地下街改为大型 Explore Mode 地图。
       ========================= */
    chapter2_intro: createScene({ chapter: "第二章 · 消失的人", speaker: "", text: "第二章\n消失的人", background: B.city, effect: "chapter-card", hideDialog: true, autoAdvance: 1450, next: "chapter2_01" }),
    chapter2_01: createScene({ chapter: "第二章 · 消失的人", speaker: "韩吉", text: "我翻了最近几个月的人口记录。地下街有不少人的去向对不上。", background: B.training, character: C.hange, next: "chapter2_02" }),
    chapter2_02: createScene({ chapter: "第二章 · 消失的人", speaker: "韩吉", text: "疫病死亡、异端审判、外墙劳动、人口迁移、流放……单独看都说得通，可墓地、家属记录和征召名单互相矛盾。", background: B.training, character: C.hange, next: "chapter2_03" }),
    chapter2_03: createScene({ chapter: "第二章 · 消失的人", speaker: "韩吉", text: "我继续查官方档案。你去地下街，问问那些不会出现在档案里的人。", background: B.training, character: C.hange, flags: ["chapter2BriefingDone"], objective: "进入地下街，调查近期居民失踪事件", targetMap: "undergroundStreet", returnToExplore: true }),
    chapter2_slum_enter: createScene({ chapter: "第二章 · 消失的人", speaker: "", text: "", background: B.city, exploreOnly: true, flags: ["chapter2SlumEntered"], objective: "在地下街搜集失踪人口、夜间马车、卡尔与运输去向的线索" }),

    chapter2_resident: createScene({ chapter: "第二章 · 消失的人", speaker: "地下街居民", text: "调查兵团？你真想查，就先去看看广场上的公告墙。", background: B.city, flags: ["chapter2ResidentSpoken"], returnToExplore: true }),
    chapter2_clue_list: createScene({ chapter: "第二章 · 消失的人", speaker: "系统", text: "寻人启事 A：寻找哥哥。三个月前被通知前往外墙劳动区，此后没有消息。", background: B.city, next: "chapter2_clue_list_b" }),
    chapter2_clue_list_b: createScene({ chapter: "第二章 · 消失的人", speaker: "系统", text: "寻人启事 B：寻找丈夫。巨壁教称其正在接受“教会审查”", background: B.city, next: "chapter2_clue_list_c" }),
    chapter2_clue_list_c: createScene({ chapter: "第二章 · 消失的人", speaker: "系统", text: "寻人启事 C：寻找女儿。官方记录称其因疫病死亡", background: B.city, next: "chapter2_clue_list_01" }),
    chapter2_clue_list_01: createScene({ chapter: "第二章 · 消失的人", speaker: "莱纳", text: "……", background: B.city, character: C.reiner, next: "chapter2_clue_list_02" }),
    chapter2_clue_list_02: createScene({ chapter: "第二章 · 消失的人", speaker: "莱纳", text: "地下街这种地方全是失踪人口啊", background: B.city, character: C.reiner, next: "chapter2_clue_list_record" }),
    chapter2_clue_list_record: createScene({ chapter: "第二章 · 消失的人", speaker: "系统", text: "获得线索：大量失踪人口", background: B.city, flags: ["slumNoticeRead", "clue_missing_people"], evidence: ["slum_list"], returnToExplore: true }),

    /* 地下街酒馆：普通居民的人证与生活层面的异常。 */
    chapter2_tavern_enter: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "", text: "", background: B.tavern,
      exploreOnly: true, flags: ["tavernEntered"] }),

    tavern_owner_first_01: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "莱纳", text: "最近地下街有人失踪？", background: B.tavern, character: C.reiner, next: "tavern_owner_first_02" }),
    tavern_owner_first_02: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "酒馆老板", text: "这是地下街啊同志，这哪天不失踪人？", background: B.tavern, next: "tavern_owner_first_03" }),
    tavern_owner_first_03: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "莱纳", text: "我指的是……被教会带走的人。", background: B.tavern, character: C.reiner, next: "tavern_owner_first_04" }),
    tavern_owner_first_04: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "旁白", text: "老板停下手里的动作。", background: B.tavern, next: "tavern_owner_first_05" }),
    tavern_owner_first_05: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "酒馆老板", text: "……", background: B.tavern, next: "tavern_owner_first_06" }),
    tavern_owner_first_06: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "酒馆老板", text: "年轻人，你喝高了吧？你不会也是那些想去墙外给巨人当点心的蠢蛋之一吧？哈哈哈哈哈哈！", background: B.tavern, flags: ["talkedTavernOwner"], routes: [
      { conditions: { allFlags: ["clue_missing_people"] }, next: "tavern_owner_notice_01" }
    ], next: "tavern_owner_first_done" }),
    tavern_owner_first_done: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "莱纳", text: "……", background: B.tavern, character: C.reiner, returnToExplore: true }),
    tavern_owner_refuse_repeat: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "酒馆老板", text: "去去去，去别的地方发神经", background: B.tavern, returnToExplore: true }),

    tavern_owner_notice_01: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "莱纳", text: "公告墙上至少有十几个。", background: B.tavern, character: C.reiner, next: "tavern_owner_notice_02" }),
    tavern_owner_notice_02: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "酒馆老板", text: "……", background: B.tavern, next: "tavern_owner_notice_03" }),
    tavern_owner_notice_03: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "莱纳", text: "他们去哪了？", background: B.tavern, character: C.reiner, next: "tavern_owner_notice_04" }),
    tavern_owner_notice_04: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "酒馆老板", text: "我不知道，说不定去墙外乐土了呢，你也想去吗？哈哈哈哈哈哈", background: B.tavern, next: "tavern_owner_notice_05" }),
    tavern_owner_notice_05: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "莱纳", text: "你知道。", background: B.tavern, character: C.reiner, next: "tavern_owner_reveal_01" }),
    tavern_owner_reveal_01: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "酒馆老板", text: "我只知道每个月都会有几辆马车过来拉走你们这种疯子！", background: B.tavern, next: "tavern_owner_reveal_02" }),
    tavern_owner_reveal_02: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "莱纳", text: "马车？", background: B.tavern, character: C.reiner, next: "tavern_owner_reveal_03" }),
    tavern_owner_reveal_03: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "酒馆老板", text: "不然呢？你还想坐飞船吗？", background: B.tavern, next: "tavern_owner_reveal_04" }),
    tavern_owner_reveal_04: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "酒馆老板", text: "我告诉你，那马车进去的时候有人", background: B.tavern, next: "tavern_owner_reveal_05" }),
    tavern_owner_reveal_05: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "酒馆老板", text: "回来的时候……", background: B.tavern, next: "tavern_owner_reveal_06" }),
    tavern_owner_reveal_06: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "旁白", text: "老板停顿。", background: B.tavern, next: "tavern_owner_reveal_07" }),
    tavern_owner_reveal_07: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "酒馆老板", text: "空的。", background: B.tavern, next: "tavern_owner_clue" }),
    tavern_owner_clue: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "系统", text: "获得线索：深夜马车", background: B.tavern,
      flags: ["talkedTavernOwner", "slumNightCarriage", "clue_night_carriage"], evidence: ["slum_merchant"], returnToExplore: true }),
    tavern_owner_after_01: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "酒馆老板", text: "我已经把知道的都告诉你了，别给我惹麻烦，去别处撒酒疯去", background: B.tavern, next: "tavern_owner_after_02" }),
    tavern_owner_after_02: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "酒馆老板", text: "调查兵团的小子，别以为穿着那身制服，就什么都能查。权力可不是你发疯的工具", background: B.tavern, returnToExplore: true }),

    tavern_guest_a_01: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "左侧顾客", text: "想问事？先请我喝一杯。算了，调查兵团的人估计也没钱。", background: B.tavern, next: "tavern_guest_a_02" }),
    tavern_guest_a_02: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "莱纳", text: "最近这里晚上有什么异常吗？", background: B.tavern, character: C.reiner, next: "tavern_guest_a_03" }),
    tavern_guest_a_03: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "左侧顾客", text: "车轮声吧。最近几个月，月底那几天特别明显。大半夜，一辆接一辆，咯噔……咯噔……", background: B.tavern, next: "tavern_guest_a_04" }),
    tavern_guest_a_04: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "莱纳", text: "你见过车吗？", background: B.tavern, character: C.reiner, next: "tavern_guest_a_05" }),
    tavern_guest_a_05: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "左侧顾客", text: "我又不疯。", background: B.tavern, next: "tavern_guest_a_record" }),
    tavern_guest_a_record: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "系统", text: "【传闻：午夜车轮声】\n最近数月的月底，午夜后会有连续不断的马车驶过地下街。", background: B.tavern,
      flags: ["heardWheelRumor"], evidence: ["slum_wheel_rumor"], returnToExplore: true }),
    tavern_guest_a_repeat_01: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "左侧顾客", text: "还在查？那我再提醒你一句：月底晚上别站在主街中央。马车会把你拉走哦，伙计", background: B.tavern, returnToExplore: true }),

    tavern_guest_b_01: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "右侧顾客", text: "调查兵团？你们什么时候开始管地下街了？", background: B.tavern, next: "tavern_guest_b_02" }),
    tavern_guest_b_02: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "莱纳", text: "最近这是不是有很多人失踪？", background: B.tavern, character: C.reiner, next: "tavern_guest_b_03" }),
    tavern_guest_b_03: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "右侧顾客", text: "这里每天都有人失踪，这是地下街，不归你们这帮疯子管", background: B.tavern, next: "tavern_guest_b_04" }),
    tavern_guest_b_04: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "莱纳", text: "那广告牌上面的人都搬走了？", background: B.tavern, character: C.reiner, next: "tavern_guest_b_05" }),
    tavern_guest_b_05: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "右侧顾客", text: "搬家会把锅留在炉子上？", background: B.tavern, next: "tavern_guest_b_record" }),
    tavern_guest_b_notice_01: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "莱纳", text: "公告墙上有很多类似的人。以前没人查？", background: B.tavern, character: C.reiner, next: "tavern_guest_b_notice_02" }),
    tavern_guest_b_notice_02: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "右侧顾客", text: "这里是地下街。上面的人只有需要劳工、税钱或者罪犯的时候，就会想起这里还有人活着。", background: B.tavern, next: "tavern_guest_b_03" }),
    tavern_guest_b_record: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "系统", text: "【传闻：突然消失的住户】\n附近住户突然全部消失，锅、衣服等生活物品都没有带走。", background: B.tavern,
      flags: ["heardDisappearanceRumor"], evidence: ["slum_disappearance_rumor"], returnToExplore: true }),

    tavern_ledger_01: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "旁白", text: "一本已经用了很久的酒馆账本。连续数月的同一页都写着：‘月末——提前打烊。’", background: B.tavern, next: "tavern_ledger_02" }),
    tavern_ledger_02: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "莱纳", text: "每个月月底……为什么总在同一个时间提前关门？", background: B.tavern, character: C.reiner, next: "tavern_ledger_record" }),
    tavern_ledger_record: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "系统", text: "【酒馆账本】\n每个月月底，酒馆都会提前打烊。", background: B.tavern,
      flags: ["slumTavernLedgerRead"], evidence: ["slum_tavern_ledger"], routes: [
        { conditions: { allFlags: ["slumNightCarriage"] }, next: "tavern_clue_link" }
      ], next: "tavern_ledger_done" }),
    tavern_ledger_done: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "莱纳", text: "先记下来。", background: B.tavern, character: C.reiner, returnToExplore: true }),
    tavern_ledger_repeat: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "莱纳", text: "连续数月都是月底提前打烊，没有别的新记录。", background: B.tavern, character: C.reiner, returnToExplore: true }),
    tavern_ledger_repeat_linked: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "莱纳", text: "月底提前打烊，是为了避开那些深夜马车。", background: B.tavern, character: C.reiner, returnToExplore: true }),
    tavern_clue_link: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "系统", text: "【线索关联】\n月底提前打烊 ↔ 深夜马车", background: B.tavern,
      flags: ["slumTavernCluesLinked"], returnToExplore: true }),

    tavern_counter: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "莱纳", text: "杯子很多。看来这里的生意不差。", background: B.tavern, character: C.reiner, returnToExplore: true }),
    tavern_counter_after_notice: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "莱纳", text: "杯子很多。地下街的人，大概只有这种地方还能暂时忘掉外面的事。", background: B.tavern, character: C.reiner, returnToExplore: true }),
    tavern_barrel: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "莱纳", text: "廉价麦酒。味道从这里都闻得到。", background: B.tavern, character: C.reiner, flags: ["tavernBarrelChecked"], returnToExplore: true }),
    tavern_barrel_repeat: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "莱纳", text: "没必要再看了。", background: B.tavern, character: C.reiner, returnToExplore: true }),
    tavern_fireplace: createScene({ chapter: "第二章 · 地下街老酒馆", speaker: "莱纳", text: "火烧得很旺。地下街见不到太阳，这种地方恐怕一年到头都离不开火。", background: B.tavern, character: C.reiner, returnToExplore: true }),

    chapter2_tavern_closed: createScene({ chapter: "第二章 · 消失的人", speaker: "酒馆老板", text: "想喝酒就坐下。不喝酒就别问耍酒疯的问题。", background: B.city, returnToExplore: true }),
    chapter2_clue_merchant: createScene({ chapter: "第二章 · 消失的人", speaker: "酒馆老板", text: "……每个月月底都会来几辆没有标志的封闭马车。进去的时候有人，回来的时候是空车。", background: B.city, flags: ["slumNightCarriage", "clue_night_carriage"], evidence: ["slum_merchant"], next: "chapter2_clue_merchant_02" }),
    chapter2_clue_merchant_02: createScene({ chapter: "第二章 · 消失的人", speaker: "莱纳", text: "那些车往哪走？", background: B.city, character: C.reiner, next: "chapter2_clue_merchant_03" }),
    chapter2_clue_merchant_03: createScene({ chapter: "第二章 · 消失的人", speaker: "酒馆老板", text: "我只知道它们会经过黑市那条巷子", background: B.city, returnToExplore: true }),

    chapter2_oldwoman_01: createScene({ chapter: "第二章 · 消失的人", speaker: "老妇人", text: "你是调查兵团的人？", background: B.city, character: C.karlMother, next: "chapter2_oldwoman_02" }),
    chapter2_oldwoman_02: createScene({ chapter: "第二章 · 消失的人", speaker: "莱纳", text: "是。", background: B.city, character: C.reiner, next: "chapter2_oldwoman_03" }),
    chapter2_oldwoman_03: createScene({ chapter: "第二章 · 消失的人", speaker: "老妇人", text: "那你能不能帮我找一个人？", background: B.city, character: C.karlMother, next: "chapter2_oldwoman_04" }),
    chapter2_oldwoman_04: createScene({ chapter: "第二章 · 消失的人", speaker: "莱纳", text: "谁？", background: B.city, character: C.reiner, next: "chapter2_oldwoman_paper" }),
    chapter2_oldwoman_paper: createScene({ chapter: "第二章 · 消失的人", speaker: "系统", text: "老妇人递出一张旧纸。\n姓名：卡尔·费舍尔。", background: B.city, next: "chapter2_oldwoman_05" }),
    chapter2_oldwoman_05: createScene({ chapter: "第二章 · 消失的人", speaker: "莱纳", text: "卡尔……", background: B.city, character: C.reinerTrauma, next: "chapter2_oldwoman_flash" }),
    chapter2_oldwoman_flash: createScene({ chapter: "第二章 · 消失的人", speaker: "", text: "", background: B.crisis, effect: "flash-start", hideDialog: true, autoAdvance: 420, next: "chapter2_oldwoman_memory_01" }),
    chapter2_oldwoman_memory_01: createScene({ chapter: "第二章 · 消失的人", speaker: "陌生男人", text: "等门打开以后……", background: B.crisis, effect: "memory-fragment", hideDialog: true, autoAdvance: 1050, next: "chapter2_oldwoman_memory_02" }),
    chapter2_oldwoman_memory_02: createScene({ chapter: "第二章 · 消失的人", speaker: "陌生男人", text: "我要带她去看海。", background: B.crisis, effect: "memory-fragment", hideDialog: true, autoAdvance: 1150, next: "chapter2_oldwoman_06" }),
    chapter2_oldwoman_06: createScene({ chapter: "第二章 · 消失的人", speaker: "老妇人", text: "你认识他？", background: B.city, character: C.karlMother, choices: [
      { id: "karl_unknown", text: "不认识。", next: "chapter2_oldwoman_choice_a" },
      { id: "karl_maybe_known", text: "也许认识。", next: "chapter2_oldwoman_choice_b" }
    ] }),
    chapter2_oldwoman_choice_a: createScene({ chapter: "第二章 · 消失的人", speaker: "莱纳", text: "只是这个名字很熟。", background: B.city, character: C.reiner, next: "chapter2_oldwoman_07" }),
    chapter2_oldwoman_choice_b: createScene({ chapter: "第二章 · 消失的人", speaker: "莱纳", text: "但我想不起来。", background: B.city, character: C.reiner, next: "chapter2_oldwoman_07" }),
    chapter2_oldwoman_07: createScene({ chapter: "第二章 · 消失的人", speaker: "老妇人", text: "他以前总说一些危险的话。", background: B.city, character: C.karlMother, next: "chapter2_oldwoman_08" }),
    chapter2_oldwoman_08: createScene({ chapter: "第二章 · 消失的人", speaker: "莱纳", text: "什么？", background: B.city, character: C.reiner, next: "chapter2_oldwoman_09" }),
    chapter2_oldwoman_09: createScene({ chapter: "第二章 · 消失的人", speaker: "老妇人", text: "说墙外不是地狱。说外面有海。", background: B.city, character: C.karlMother, next: "chapter2_oldwoman_10" }),
    chapter2_oldwoman_10: createScene({ chapter: "第二章 · 消失的人", speaker: "老妇人", text: "还说……总有一天，人应该自己决定去哪里。", background: B.city, character: C.karlMother, next: "chapter2_oldwoman_11" }),
    chapter2_oldwoman_11: createScene({ chapter: "第二章 · 消失的人", speaker: "莱纳", text: "后来呢？", background: B.city, character: C.reiner, next: "chapter2_oldwoman_12" }),
    chapter2_oldwoman_12: createScene({ chapter: "第二章 · 消失的人", speaker: "老妇人", text: "845年以后，他就再也没回来。", background: B.city, character: C.karlMother, next: "chapter2_oldwoman_13" }),
    chapter2_oldwoman_13: createScene({ chapter: "第二章 · 消失的人", speaker: "莱纳", text: "官方记录呢？", background: B.city, character: C.reiner, next: "chapter2_oldwoman_14" }),
    chapter2_oldwoman_14: createScene({ chapter: "第二章 · 消失的人", speaker: "老妇人", text: "写着……‘参与危险组织，接受异端审查’。", background: B.city, character: C.karlMother, next: "chapter2_oldwoman_15" }),
    chapter2_oldwoman_15: createScene({ chapter: "第二章 · 消失的人", speaker: "莱纳", text: "危险组织？", background: B.city, character: C.reiner, next: "chapter2_oldwoman_16" }),
    chapter2_oldwoman_16: createScene({ chapter: "第二章 · 消失的人", speaker: "老妇人", text: "我不知道。他们有一个标记。", background: B.city, character: C.karlMother, next: "chapter2_oldwoman_symbol" }),
    chapter2_oldwoman_symbol: createScene({ chapter: "第二章 · 消失的人", speaker: "系统", text: "旧纸片上画着一轮升起的太阳。", background: B.city, character: C.dawnbreakersNote, next: "chapter2_oldwoman_17" }),
    chapter2_oldwoman_17: createScene({ chapter: "第二章 · 消失的人", speaker: "莱纳", text: "……", background: B.city, character: C.reiner, next: "chapter2_oldwoman_18" }),
    chapter2_oldwoman_18: createScene({ chapter: "第二章 · 消失的人", speaker: "老妇人", text: "他们称自己……", background: B.city, character: C.karlMother, next: "chapter2_oldwoman_19" }),
    chapter2_oldwoman_19: createScene({ chapter: "第二章 · 消失的人", speaker: "老妇人", text: "破晓者。", background: B.city, character: C.karlMother, next: "chapter2_oldwoman_20" }),
    chapter2_oldwoman_20: createScene({ chapter: "第二章 · 消失的人", speaker: "莱纳", text: "破晓者……", background: B.city, character: C.reinerTrauma, next: "chapter2_oldwoman_distortion" }),
    chapter2_oldwoman_distortion: createScene({ chapter: "第二章 · 消失的人", speaker: "", text: "", background: B.city, effect: "subtle-distortion", hideDialog: true, autoAdvance: 480, next: "chapter2_oldwoman_21" }),
    chapter2_oldwoman_21: createScene({ chapter: "第二章 · 消失的人", speaker: "老妇人", text: "他们说，黎明总有一天会越过高墙。", background: B.city, character: C.karlMother, next: "chapter2_oldwoman_22" }),
    chapter2_oldwoman_22: createScene({ chapter: "第二章 · 消失的人", speaker: "老妇人", text: "我以前只觉得他们疯了。", background: B.city, character: C.karlMother, routes: [
      { conditions: { allFlags: ["clue_cross_obtained"] }, next: "chapter2_oldwoman_cross_link" }
    ], next: "chapter2_oldwoman_clue" }),
    chapter2_oldwoman_cross_link: createScene({ chapter: "第二章 · 消失的人", speaker: "系统", text: "太阳十字架似乎与‘破晓者’有关。\n道具名称更新为‘破晓者十字架’。", background: B.city, flags: ["dawnbreakersCrossIdentified"], next: "chapter2_oldwoman_clue" }),
    chapter2_oldwoman_clue: createScene({ chapter: "第二章 · 消失的人", speaker: "系统", text: "获得线索：破晓者", background: B.city,
      flags: ["dawnbreakersIdentified", "clue_dawnbreakers"], evidence: ["slum_cross"], returnToExplore: true }),
    chapter2_oldwoman_repeat: createScene({ chapter: "第二章 · 消失的人", speaker: "老妇人", text: "如果你查到卡尔的消息……请告诉我。", background: B.city, character: C.karlMother, returnToExplore: true }),

    /* 废弃仓库：深夜运输、第七码头与可选隐藏证言。 */
    warehouse_enter_title: createScene({ chapter: "第二章 · 消失的人", speaker: "", text: "【废弃仓库】", background: B.warehouse,
      effect: "chapter-card", hideDialog: true, autoAdvance: 850, next: "warehouse_enter_sound" }),
    warehouse_enter_sound: createScene({ chapter: "第二章 · 消失的人", speaker: "旁白", text: "咔。", background: B.warehouse, next: "warehouse_enter_reiner_01" }),
    warehouse_enter_reiner_01: createScene({ chapter: "第二章 · 消失的人", speaker: "莱纳", text: "……", background: B.warehouse, character: C.reiner, next: "warehouse_enter_reiner_02" }),
    warehouse_enter_reiner_02: createScene({ chapter: "第二章 · 消失的人", speaker: "莱纳", text: "有人？", background: B.warehouse, character: C.reiner, next: "warehouse_enter_silence" }),
    warehouse_enter_silence: createScene({ chapter: "第二章 · 消失的人", speaker: "旁白", text: "无人回应。", background: B.warehouse,
      flags: ["visited_warehouse"], objective: "调查废弃仓库，寻找深夜运输的去向", returnToExplore: true }),

    warehouse_tracks_01: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "入口附近的车辙……是新的。", background: B.warehouse, character: C.reiner, next: "warehouse_tracks_02" }),
    warehouse_tracks_02: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "这里最近有马车进出。", background: B.warehouse, character: C.reiner,
      flags: ["warehouse_tracks_checked"], returnToExplore: true }),

    warehouse_normal_crate_01: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "普通货箱。", background: B.warehouse, character: C.reiner, next: "warehouse_normal_crate_02" }),
    warehouse_normal_crate_02: createScene({ chapter: "第二章 · 废弃仓库", speaker: "旁白", text: "里面只剩发霉的麻袋和破损的煤块。", background: B.warehouse,
      flags: ["warehouse_normal_crate_checked"], returnToExplore: true }),

    warehouse_church_crate_01: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "这里有东西。", background: B.warehouse, character: C.reiner, next: "warehouse_church_crate_02" }),
    warehouse_church_crate_02: createScene({ chapter: "第二章 · 废弃仓库", speaker: "系统", text: "【一个已经被刮掉大半的巨壁教纹章。】", background: B.warehouse, next: "warehouse_church_crate_03" }),
    warehouse_church_crate_03: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "有人故意把标志刮掉了。", background: B.warehouse, character: C.reiner, next: "warehouse_church_crate_04" }),
    warehouse_church_crate_04: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "但没有刮干净。", background: B.warehouse, character: C.reiner,
      flags: ["clue_church_warehouse"], evidence: ["warehouse_church_mark"], returnToExplore: true }),

    warehouse_g17_crate_01: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "药品？", background: B.warehouse, character: C.reiner, next: "warehouse_g17_crate_02" }),
    warehouse_g17_crate_02: createScene({ chapter: "第二章 · 废弃仓库", speaker: "系统", text: "【箱体标签大部分已经损坏。】", background: B.warehouse, next: "warehouse_g17_crate_03" }),
    warehouse_g17_crate_03: createScene({ chapter: "第二章 · 废弃仓库", speaker: "系统", text: "【仍可以辨认：G-17】", background: B.warehouse, next: "warehouse_g17_crate_04" }),
    warehouse_g17_crate_04: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "G-17……", background: B.warehouse, character: C.reiner, next: "warehouse_g17_crate_05" }),
    warehouse_g17_crate_05: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "是什么？", background: B.warehouse, character: C.reiner,
      flags: ["clue_g17_warehouse"], evidence: ["warehouse_g17_crate"], returnToExplore: true }),
    warehouse_g17_linked_01: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "G-17。", background: B.warehouse, character: C.reiner, next: "warehouse_g17_linked_02" }),
    warehouse_g17_linked_02: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "和旧教堂那个药瓶一样。", background: B.warehouse, character: C.reiner, next: "warehouse_g17_linked_03" }),
    warehouse_g17_linked_03: createScene({ chapter: "第二章 · 废弃仓库", speaker: "系统", text: "【线索关联】\n旧教堂G-17药瓶\n↕\n废弃仓库G-17药箱", background: B.warehouse,
      flags: ["clue_g17_warehouse"], evidence: ["warehouse_g17_crate"], returnToExplore: true }),

    warehouse_rope_01: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "绳子。", background: B.warehouse, character: C.reiner, next: "warehouse_rope_02" }),
    warehouse_rope_02: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "磨损得很严重。", background: B.warehouse, character: C.reiner, next: "warehouse_rope_03" }),
    warehouse_rope_03: createScene({ chapter: "第二章 · 废弃仓库", speaker: "系统", text: "【普通搬运用绳索。】", background: B.warehouse, next: "warehouse_rope_04" }),
    warehouse_rope_04: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "可能只是用来固定货物。", background: B.warehouse, character: C.reiner, returnToExplore: true }),
    warehouse_rope_people_01: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "绳子。磨损得很严重。", background: B.warehouse, character: C.reiner, next: "warehouse_rope_people_02" }),
    warehouse_rope_people_02: createScene({ chapter: "第二章 · 废弃仓库", speaker: "系统", text: "【普通搬运用绳索。】", background: B.warehouse, next: "warehouse_rope_people_03" }),
    warehouse_rope_people_03: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "可能只是用来固定货物。", background: B.warehouse, character: C.reiner, next: "warehouse_rope_people_04" }),
    warehouse_rope_people_04: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "……也可能不是。", background: B.warehouse, character: C.reiner, returnToExplore: true }),

    warehouse_table_01: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "灰尘很厚。", background: B.warehouse, character: C.reiner, next: "warehouse_table_01b" }),
    warehouse_table_01b: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "但是这里……", background: B.warehouse, character: C.reiner, next: "warehouse_table_01c" }),
    warehouse_table_01c: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "有人动过。", background: B.warehouse, character: C.reiner,
      flags: ["warehouse_table_checked"], returnToExplore: true }),
    warehouse_table_02: createScene({ chapter: "第二章 · 废弃仓库", speaker: "系统", text: "【桌子下面似乎压着东西。】", background: B.warehouse, next: "warehouse_table_02b" }),
    warehouse_table_02b: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "嗯？", background: B.warehouse, character: C.reiner,
      flags: ["warehouse_manifest_unlocked"], returnToExplore: true }),
    warehouse_table_repeat: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "运输记录就在桌上。", background: B.warehouse, character: C.reiner, returnToExplore: true }),

    warehouse_manifest_01: createScene({ chapter: "第二章 · 废弃仓库", speaker: "运输记录", text: "玛利亚地区物资调度记录\n\n日期：██月██日\n\nG-17：32箱\n镇静剂：8箱\n绷带：14箱\n食品：6箱\n\n出发地点：地下街第三区仓库\n目的地：玛利亚西侧第七码头\n调度单位：█████████", background: B.warehouse, next: "warehouse_manifest_02" }),
    warehouse_manifest_02: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "第七码头……", background: B.warehouse, character: C.reiner, next: "warehouse_manifest_03" }),
    warehouse_manifest_03: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "玛利亚西侧有这种地方？", background: B.warehouse, character: C.reiner, next: "warehouse_manifest_clue" }),
    warehouse_manifest_clue: createScene({ chapter: "第二章 · 废弃仓库", speaker: "系统", text: "【获得关键线索：第七码头】\n\n【主线任务更新】\n【已找到深夜运输的目的地记录。】", background: B.warehouse,
      flags: ["clue_seventh_dock", "slumTransportFound"], evidence: ["slum_transport"], returnToExplore: true }),

    warehouse_map_plain: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "旧运输地图。", background: B.warehouse, character: C.reiner, returnToExplore: true }),
    warehouse_map_deduction_01: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "等一下。", background: B.warehouse, character: C.reiner, next: "warehouse_map_deduction_02" }),
    warehouse_map_deduction_02: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "玛利亚西侧……", background: B.warehouse, character: C.reiner, next: "warehouse_map_deduction_03" }),
    warehouse_map_deduction_03: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "这里没有河。", background: B.warehouse, character: C.reiner, next: "warehouse_map_deduction_04" }),
    warehouse_map_deduction_04: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "也没有任何码头。", background: B.warehouse, character: C.reiner, next: "warehouse_map_deduction_05" }),
    warehouse_map_deduction_05: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "……", background: B.warehouse, character: C.reiner, next: "warehouse_map_deduction_06" }),
    warehouse_map_deduction_06: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "所以……‘第七码头’根本不是正常地名。", background: B.warehouse, character: C.reiner, next: "warehouse_map_deduction_clue" }),
    warehouse_map_deduction_clue: createScene({ chapter: "第二章 · 废弃仓库", speaker: "系统", text: "【关键推断】\n【‘玛利亚西侧第七码头’可能是某个秘密地点的代号。】", background: B.warehouse,
      flags: ["clue_seventh_dock_code"], evidence: ["seventh_dock_code"], returnToExplore: true }),
    warehouse_map_repeat: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "第七码头不是正常地名，而是某个秘密地点的代号。", background: B.warehouse, character: C.reiner, returnToExplore: true }),

    warehouse_dawn_mark_01: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "这是……", background: B.warehouse, character: C.reiner, next: "warehouse_dawn_mark_02" }),
    warehouse_dawn_mark_02: createScene({ chapter: "第二章 · 废弃仓库", speaker: "系统", text: "【一个已经几乎被磨掉的升起太阳图案。】", background: B.warehouse, next: "warehouse_dawn_mark_03" }),
    warehouse_dawn_mark_03: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "又是这个太阳。", background: B.warehouse, character: C.reiner,
      flags: ["hidden_warehouse_dawn"], evidence: ["warehouse_dawn_mark"], returnToExplore: true }),
    warehouse_dawn_known_01: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "破晓者的标志。", background: B.warehouse, character: C.reiner, next: "warehouse_dawn_known_02" }),
    warehouse_dawn_known_02: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "他们以前来过这里？", background: B.warehouse, character: C.reiner,
      flags: ["hidden_warehouse_dawn"], evidence: ["warehouse_dawn_mark"], returnToExplore: true }),

    warehouse_porter_first_01: createScene({ chapter: "第二章 · 废弃仓库", speaker: "老搬运工", text: "……", background: B.warehouse, next: "warehouse_porter_first_02" }),
    warehouse_porter_first_02: createScene({ chapter: "第二章 · 废弃仓库", speaker: "老搬运工", text: "我什么都没拿。", background: B.warehouse, next: "warehouse_porter_first_03" }),
    warehouse_porter_first_03: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "我没问你拿了什么。", background: B.warehouse, character: C.reiner, next: "warehouse_porter_first_04" }),
    warehouse_porter_first_04: createScene({ chapter: "第二章 · 废弃仓库", speaker: "老搬运工", text: "调查兵团？", background: B.warehouse, next: "warehouse_porter_first_05" }),
    warehouse_porter_first_05: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "嗯。", background: B.warehouse, character: C.reiner, next: "warehouse_porter_first_06" }),
    warehouse_porter_first_06: createScene({ chapter: "第二章 · 废弃仓库", speaker: "老搬运工", text: "那更麻烦。", background: B.warehouse, next: "warehouse_porter_first_07" }),
    warehouse_porter_first_07: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "这里不是废弃了吗？", background: B.warehouse, character: C.reiner, next: "warehouse_porter_first_08" }),
    warehouse_porter_first_08: createScene({ chapter: "第二章 · 废弃仓库", speaker: "老搬运工", text: "白天是。", background: B.warehouse, next: "warehouse_porter_first_09" }),
    warehouse_porter_first_09: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "什么意思？", background: B.warehouse, character: C.reiner, next: "warehouse_porter_first_10" }),
    warehouse_porter_first_10: createScene({ chapter: "第二章 · 废弃仓库", speaker: "老搬运工", text: "……没什么意思。", background: B.warehouse,
      flags: ["talked_old_porter"], routes: [
        { conditions: { allFlags: ["warehouse_tracks_checked"] }, next: "warehouse_porter_tracks_01" }
      ], next: "warehouse_porter_no_tracks_01" }),
    warehouse_porter_no_tracks_01: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "最近有人来这里吗？", background: B.warehouse, character: C.reiner, next: "warehouse_porter_no_tracks_02" }),
    warehouse_porter_no_tracks_02: createScene({ chapter: "第二章 · 废弃仓库", speaker: "老搬运工", text: "没有。", background: B.warehouse, next: "warehouse_porter_no_tracks_03" }),
    warehouse_porter_no_tracks_03: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "确定？", background: B.warehouse, character: C.reiner, next: "warehouse_porter_no_tracks_04" }),
    warehouse_porter_no_tracks_04: createScene({ chapter: "第二章 · 废弃仓库", speaker: "老搬运工", text: "确定。", background: B.warehouse, returnToExplore: true }),
    warehouse_porter_tracks_01: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "外面的车辙是新的。", background: B.warehouse, character: C.reiner, next: "warehouse_porter_tracks_02" }),
    warehouse_porter_tracks_02: createScene({ chapter: "第二章 · 废弃仓库", speaker: "老搬运工", text: "……", background: B.warehouse, next: "warehouse_porter_tracks_03" }),
    warehouse_porter_tracks_03: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "这里最近有人用。", background: B.warehouse, character: C.reiner, next: "warehouse_porter_tracks_04" }),
    warehouse_porter_tracks_04: createScene({ chapter: "第二章 · 废弃仓库", speaker: "老搬运工", text: "你既然已经知道了，还问我干什么？", background: B.warehouse, next: "warehouse_porter_tracks_05" }),
    warehouse_porter_tracks_05: createScene({ chapter: "第二章 · 废弃仓库", speaker: "老搬运工", text: "以前白天运粮食、煤，还有药。现在只在晚上。", background: B.warehouse, next: "warehouse_porter_tracks_06" }),
    warehouse_porter_tracks_06: createScene({ chapter: "第二章 · 废弃仓库", speaker: "老搬运工", text: "车是黑色的，没有标志。驾车的人也从不说话。", background: B.warehouse, next: "warehouse_porter_tracks_07" }),
    warehouse_porter_tracks_07: createScene({ chapter: "第二章 · 废弃仓库", speaker: "老搬运工", text: "那些车来的时候，原来在仓库干活的人都得离开。", background: B.warehouse, next: "warehouse_porter_tracks_08" }),
    warehouse_porter_tracks_08: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "谁让你们离开？", background: B.warehouse, character: C.reiner, next: "warehouse_porter_tracks_09" }),
    warehouse_porter_tracks_09: createScene({ chapter: "第二章 · 废弃仓库", speaker: "老搬运工", text: "穿长袍的人。", background: B.warehouse, next: "warehouse_porter_tracks_10" }),
    warehouse_porter_tracks_10: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "巨壁教？", background: B.warehouse, character: C.reiner, next: "warehouse_porter_tracks_11" }),
    warehouse_porter_tracks_11: createScene({ chapter: "第二章 · 废弃仓库", speaker: "老搬运工", text: "我可没这么说。", background: B.warehouse, next: "warehouse_porter_tracks_12" }),
    warehouse_porter_tracks_12: createScene({ chapter: "第二章 · 废弃仓库", speaker: "老搬运工", text: "你也没听我说过。", background: B.warehouse,
      flags: ["porter_night_transport"], routes: [
        { conditions: { allFlags: ["clue_missing_people"], notFlags: ["clue_people_in_carriage"] }, next: "warehouse_porter_secret_choice" }
      ], next: "warehouse_porter_tracks_done" }),
    warehouse_porter_tracks_done: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "明白。", background: B.warehouse, character: C.reiner, returnToExplore: true }),
    warehouse_porter_night_repeat: createScene({ chapter: "第二章 · 废弃仓库", speaker: "老搬运工", text: "我只知道那些车在夜里来。别再问了。", background: B.warehouse, returnToExplore: true }),
    warehouse_porter_secret_choice: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "还有一件事。", background: B.warehouse, character: C.reiner, choices: [
      { id: "ask_carriage_cargo", text: "那些车运的是货物吗？", next: "warehouse_porter_secret_01" },
      { id: "leave_porter_alone", text: "暂时不问。", next: "warehouse_porter_tracks_done" }
    ] }),
    warehouse_porter_secret_01: createScene({ chapter: "第二章 · 废弃仓库", speaker: "老搬运工", text: "……有一次，我回来拿东西。车还没走。", background: B.warehouse, next: "warehouse_porter_secret_02" }),
    warehouse_porter_secret_02: createScene({ chapter: "第二章 · 废弃仓库", speaker: "老搬运工", text: "我听见有人在车厢里敲。", background: B.warehouse, next: "warehouse_porter_secret_03" }),
    warehouse_porter_secret_03: createScene({ chapter: "第二章 · 废弃仓库", speaker: "老搬运工", text: "三下。", background: B.warehouse, next: "warehouse_porter_secret_04" }),
    warehouse_porter_secret_04: createScene({ chapter: "第二章 · 废弃仓库", speaker: "老搬运工", text: "然后就没声音了。", background: B.warehouse, next: "warehouse_porter_secret_clue" }),
    warehouse_porter_secret_clue: createScene({ chapter: "第二章 · 废弃仓库", speaker: "系统", text: "【获得隐藏线索：车厢中的敲击声】", background: B.warehouse,
      flags: ["clue_people_in_carriage"], evidence: ["people_in_carriage"], returnToExplore: true }),

    warehouse_porter_dock_01: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "第七码头。", background: B.warehouse, character: C.reiner, next: "warehouse_porter_dock_02" }),
    warehouse_porter_dock_02: createScene({ chapter: "第二章 · 废弃仓库", speaker: "旁白", text: "老搬运工明显迟疑。", background: B.warehouse, next: "warehouse_porter_dock_03" }),
    warehouse_porter_dock_03: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "你听说过？", background: B.warehouse, character: C.reiner, next: "warehouse_porter_dock_04" }),
    warehouse_porter_dock_04: createScene({ chapter: "第二章 · 废弃仓库", speaker: "老搬运工", text: "没有。", background: B.warehouse, next: "warehouse_porter_dock_05" }),
    warehouse_porter_dock_05: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "那里根本没有码头。", background: B.warehouse, character: C.reiner, next: "warehouse_porter_dock_06" }),
    warehouse_porter_dock_06: createScene({ chapter: "第二章 · 废弃仓库", speaker: "老搬运工", text: "那你就别去。", background: B.warehouse, next: "warehouse_porter_dock_07" }),
    warehouse_porter_dock_07: createScene({ chapter: "第二章 · 废弃仓库", speaker: "老搬运工", text: "因为不存在的地方……通常都不是给普通人去的。", background: B.warehouse, next: "warehouse_porter_dock_08" }),
    warehouse_porter_dock_08: createScene({ chapter: "第二章 · 废弃仓库", speaker: "老搬运工", text: "以前也有个年轻人问过这个名字。后来我再没见过他。", background: B.warehouse, routes: [
      { conditions: { allFlags: ["clue_dawnbreakers"] }, next: "warehouse_porter_dock_dawn" }
    ], next: "warehouse_porter_dock_done" }),
    warehouse_porter_dock_dawn: createScene({ chapter: "第二章 · 废弃仓库", speaker: "莱纳", text: "是不是破晓者的人？", background: B.warehouse, character: C.reiner, next: "warehouse_porter_dock_dawn_02" }),
    warehouse_porter_dock_dawn_02: createScene({ chapter: "第二章 · 废弃仓库", speaker: "老搬运工", text: "你知道得已经够多了。", background: B.warehouse, returnToExplore: true }),
    warehouse_porter_dock_done: createScene({ chapter: "第二章 · 废弃仓库", speaker: "老搬运工", text: "别再追着不存在的地方问。", background: B.warehouse, returnToExplore: true }),

    /* 旧教堂只留下近期使用、药物储存和转运的疑点；完整记录仍在废弃仓库。 */
    chapter2_church_enter: churchScene({ exploreOnly: true, flags: ["visited_old_church"] }),
    chapter2_church_intro_01: churchScene({ speaker: "莱纳", text: "这里就是旧教堂？", routes: [
      { conditions: { allFlags: ["chapter2ResidentSpoken"] }, next: "chapter2_church_intro_resident" }
    ], next: "chapter2_church_intro_pause" }),
    chapter2_church_intro_resident: churchScene({ speaker: "莱纳", text: "他们说这里早就废弃了。", next: "chapter2_church_intro_pause" }),
    chapter2_church_intro_pause: churchScene({ hideDialog: true, autoAdvance: 350, next: "chapter2_church_intro_02" }),
    chapter2_church_intro_02: churchScene({ speaker: "莱纳", text: "可这里看起来……不像完全没人来过。", next: "chapter2_church_intro_goal" }),
    chapter2_church_intro_goal: churchScene({ speaker: "系统", text: "【调查旧教堂中的异常痕迹】", flags: ["churchIntroSeen"], objective: "调查旧教堂中的异常痕迹", returnToExplore: true }),

    chapter2_church_bench: churchScene({ speaker: "莱纳", text: "已经很久没人来这里祈祷了。", returnToExplore: true }),
    chapter2_church_tracks_01: churchScene({ speaker: "莱纳", text: "灰尘很厚。", next: "chapter2_church_tracks_02" }),
    chapter2_church_tracks_02: churchScene({ speaker: "莱纳", text: "但这些痕迹是新的。", next: "chapter2_church_tracks_03" }),
    chapter2_church_tracks_03: churchScene({ speaker: "莱纳", text: "像有什么东西经常从这里被拖过去。", next: "chapter2_church_tracks_clue" }),
    chapter2_church_tracks_clue: churchScene({ speaker: "系统", text: "【发现线索：较新的拖痕】", flags: ["churchDragMarksFound"], evidence: ["church_drag_marks"], returnToExplore: true }),
    chapter2_church_tracks_repeat: churchScene({ speaker: "莱纳", text: "这些拖痕是新留下的。旧教堂还有人在用。", returnToExplore: true }),

    chapter2_church_sedatives_01: churchScene({ speaker: "莱纳", text: "镇静剂……", next: "chapter2_church_sedatives_02" }),
    chapter2_church_sedatives_02: churchScene({ speaker: "莱纳", text: "还有这么多。", next: "chapter2_church_sedatives_03" }),
    chapter2_church_sedatives_03: churchScene({ speaker: "莱纳", text: "一个废弃教堂为什么需要这些东西？", routes: [
      { conditions: { allFlags: ["churchDragMarksFound"] }, next: "chapter2_church_sedatives_link_01" }
    ], next: "chapter2_church_sedatives_clue" }),
    chapter2_church_sedatives_link_01: churchScene({ speaker: "莱纳", text: "拖痕、镇静剂……", next: "chapter2_church_sedatives_link_02" }),
    chapter2_church_sedatives_link_02: churchScene({ speaker: "莱纳", text: "这里以前到底是干什么的？", next: "chapter2_church_sedatives_clue" }),
    chapter2_church_sedatives_clue: churchScene({ speaker: "系统", text: "【发现线索：大量镇静剂】", flags: ["churchSedativesFound"], evidence: ["church_sedatives"], returnToExplore: true }),
    chapter2_church_sedatives_repeat: churchScene({ speaker: "莱纳", text: "这么多镇静剂，不可能只是随手存放。", returnToExplore: true }),

    chapter2_church_cloth_01: churchScene({ speaker: "莱纳", text: "纱布和旧医疗布。", next: "chapter2_church_cloth_02" }),
    chapter2_church_cloth_02: churchScene({ speaker: "莱纳", text: "看起来不是祈祷用的东西。", flags: ["churchMedicalClothChecked"], returnToExplore: true }),
    chapter2_church_cloth_repeat: churchScene({ speaker: "莱纳", text: "有一些已经用过，但看不出是什么时候留下的。", returnToExplore: true }),
    chapter2_church_rope_01: churchScene({ speaker: "莱纳", text: "很粗的绳子。", next: "chapter2_church_rope_02" }),
    chapter2_church_rope_02: churchScene({ speaker: "莱纳", text: "看起来承受过不小的拉力。", returnToExplore: true }),

    chapter2_church_altar_01: churchScene({ speaker: "莱纳", text: "巨壁教的祭坛。", next: "chapter2_church_altar_02" }),
    chapter2_church_altar_02: churchScene({ speaker: "莱纳", text: "这里原本应该有不少人来祈祷。", next: "chapter2_church_altar_03" }),
    chapter2_church_altar_03: churchScene({ speaker: "莱纳", text: "现在只剩灰尘了。", flags: ["churchAltarChecked"], routes: [
      { conditions: { allFlags: ["churchSedativesFound"] }, next: "chapter2_church_altar_link_01" }
    ], next: "chapter2_church_altar_done" }),
    chapter2_church_altar_link_01: churchScene({ speaker: "莱纳", text: "祈祷的地方……", next: "chapter2_church_altar_link_02" }),
    chapter2_church_altar_link_02: churchScene({ speaker: "莱纳", text: "却堆着镇静剂。", returnToExplore: true }),
    chapter2_church_altar_done: churchScene({ speaker: "莱纳", text: "祭坛附近还有别的东西值得看看。", returnToExplore: true }),
    chapter2_church_altar_repeat: churchScene({ speaker: "莱纳", text: "这座祭坛已经落满灰尘。", returnToExplore: true }),

    chapter2_church_cabinet_01: churchScene({ speaker: "莱纳", text: "这里还有个柜子。", next: "chapter2_church_cabinet_02" }),
    chapter2_church_cabinet_02: churchScene({ speaker: "旁白", text: "莱纳打开半掩着的暗柜，里面有一只旧药瓶。", next: "chapter2_clue_vial" }),
    chapter2_clue_vial: churchScene({ speaker: "莱纳", text: "G-17……", itemImage: C.g17Damaged, itemAlt: "标签磨损的G-17药瓶", next: "chapter2_clue_vial_02" }),
    chapter2_clue_vial_02: churchScene({ speaker: "莱纳", text: "其他字已经看不清了。", itemImage: C.g17Damaged, itemAlt: "标签磨损的G-17药瓶", next: "chapter2_clue_vial_03" }),
    chapter2_clue_vial_03: churchScene({ speaker: "莱纳", text: "瓶子底部还有巨壁教的标记。", next: "chapter2_church_g17_clue" }),
    chapter2_church_g17_clue: churchScene({ speaker: "系统", text: "【获得关键线索：G-17药瓶】", flags: ["slumVialFound", "clue_g17", "churchG17Found"], evidence: ["slum_vial"], returnToExplore: true }),
    chapter2_church_cabinet_repeat: churchScene({ speaker: "莱纳", text: "G-17……其他字已经看不清了。", returnToExplore: true }),

    chapter2_church_emblem_01: churchScene({ speaker: "莱纳", text: "巨壁教的标志。", next: "chapter2_church_emblem_02" }),
    chapter2_church_emblem_02: churchScene({ speaker: "莱纳", text: "至少可以确定，这里以前属于他们。", flags: ["churchEmblemChecked"], routes: [
      { conditions: { allFlags: ["churchG17Found"] }, next: "chapter2_church_emblem_link" }
    ], next: "chapter2_church_emblem_done" }),
    chapter2_church_emblem_link: churchScene({ speaker: "莱纳", text: "所以那个药瓶出现在这里，不是偶然。", returnToExplore: true }),
    chapter2_church_emblem_done: churchScene({ speaker: "莱纳", text: "巨壁教曾使用过这里。", returnToExplore: true }),
    chapter2_church_emblem_repeat: churchScene({ speaker: "莱纳", text: "这是巨壁教留下的徽记。", returnToExplore: true }),

    chapter2_church_bed_01: churchScene({ speaker: "莱纳", text: "一张旧诊疗床。", next: "chapter2_church_bed_02" }),
    chapter2_church_bed_02: churchScene({ speaker: "莱纳", text: "不像是用来休息的。", next: "chapter2_church_bed_03" }),
    chapter2_church_bed_03: churchScene({ speaker: "莱纳", text: "这里还有断掉的皮带。", next: "chapter2_church_bed_04" }),
    chapter2_church_bed_04: churchScene({ speaker: "莱纳", text: "好像固定过什么东西。", flags: ["churchTreatmentBedChecked"], returnToExplore: true }),
    chapter2_church_bed_repeat: churchScene({ speaker: "莱纳", text: "旧诊疗床和断掉的皮带，暂时看不出更多。", returnToExplore: true }),
    chapter2_church_sink_01: churchScene({ speaker: "莱纳", text: "洗手盆。", next: "chapter2_church_sink_02" }),
    chapter2_church_sink_02: churchScene({ speaker: "莱纳", text: "水管已经锈死了。", flags: ["churchSinkChecked"], routes: [
      { conditions: { allFlags: ["churchG17Found"] }, next: "chapter2_church_sink_link_01" }
    ], next: "chapter2_church_sink_done" }),
    chapter2_church_sink_link_01: churchScene({ speaker: "莱纳", text: "药瓶、诊疗床、洗手盆……", next: "chapter2_church_sink_link_02" }),
    chapter2_church_sink_link_02: churchScene({ speaker: "莱纳", text: "这里以前应该有人做过某种处理。", returnToExplore: true }),
    chapter2_church_sink_done: churchScene({ speaker: "莱纳", text: "现在已经没有水了。", returnToExplore: true }),
    chapter2_church_sink_repeat: churchScene({ speaker: "莱纳", text: "水管已经锈死，洗手盆也不能用了。", returnToExplore: true }),
    chapter2_church_old_vials_01: churchScene({ speaker: "莱纳", text: "普通药瓶。", next: "chapter2_church_old_vials_02" }),
    chapter2_church_old_vials_02: churchScene({ speaker: "莱纳", text: "标签已经完全褪色。", returnToExplore: true }),

    chapter2_church_sun: churchScene({ speaker: "莱纳", text: "……", next: "chapter2_church_sun_wall_01" }),
    chapter2_church_sun_wall_01: churchScene({ speaker: "莱纳", text: "这块墙面的颜色不太一样。", next: "chapter2_church_sun_wall_02" }),
    chapter2_church_sun_wall_02: churchScene({ speaker: "莱纳", text: "像是后来重新刷过一层。", next: "chapter2_church_sun_pause" }),
    chapter2_church_sun_pause: churchScene({ hideDialog: true, autoAdvance: 320, next: "chapter2_church_sun_wall_03" }),
    chapter2_church_sun_wall_03: churchScene({ speaker: "莱纳", text: "下面好像还有东西。", next: "chapter2_church_sun_reveal" }),
    chapter2_church_sun_reveal: churchScene({ speaker: "旁白", text: "油漆下露出一处旧涂记：从地平线升起的太阳。", itemImage: C.dawnbreakersNote, itemAlt: "被覆盖过的升日标记", next: "chapter2_church_sun_recognized" }),
    chapter2_church_sun_recognized: churchScene({ speaker: "莱纳", text: "又是这个太阳。", itemImage: C.dawnbreakersNote, itemAlt: "被覆盖过的升日标记", routes: [
      { conditions: { allFlags: ["clue_dawn_symbol"] }, next: "chapter2_church_sun_oldtown_01" }
    ], next: "chapter2_church_sun_name_check" }),
    chapter2_church_sun_oldtown_01: churchScene({ speaker: "莱纳", text: "旧城区也有。", next: "chapter2_church_sun_oldtown_02" }),
    chapter2_church_sun_oldtown_02: churchScene({ speaker: "莱纳", text: "为什么巨壁教的旧教堂里，会出现同样的东西？", next: "chapter2_church_sun_name_check" }),
    chapter2_church_sun_name_check: churchScene({ hideDialog: true, autoAdvance: 1, routes: [
      { conditions: { allFlags: ["clue_dawnbreakers"] }, next: "chapter2_church_sun_known_01" }
    ], next: "chapter2_church_sun_unknown" }),
    chapter2_church_sun_known_01: churchScene({ speaker: "莱纳", text: "破晓者……", next: "chapter2_church_sun_known_02" }),
    chapter2_church_sun_known_02: churchScene({ speaker: "莱纳", text: "他们来过这里。", next: "chapter2_church_sun_clue" }),
    chapter2_church_sun_unknown: churchScene({ speaker: "莱纳", text: "到底是什么人留下的？", next: "chapter2_church_sun_clue" }),
    chapter2_church_sun_clue: churchScene({ speaker: "系统", text: "【发现隐藏线索：被覆盖的太阳标记】", flags: ["churchDawnMarkFound"], evidence: ["church_hidden_sun"], returnToExplore: true }),
    chapter2_church_sun_repeat: churchScene({ speaker: "莱纳", text: "被覆盖的太阳标记还留在侧墙上。", routes: [
      { conditions: { allFlags: ["clue_dawnbreakers"] }, next: "chapter2_church_sun_repeat_known" }
    ], next: "chapter2_church_sun_repeat_done" }),
    chapter2_church_sun_repeat_known: churchScene({ speaker: "莱纳", text: "破晓者曾在这里留下痕迹。", returnToExplore: true }),
    chapter2_church_sun_repeat_done: churchScene({ speaker: "莱纳", text: "到底是什么人留下的？", returnToExplore: true }),

    chapter2_church_paper_01: churchScene({ speaker: "系统", text: "一张被烧毁大半的纸。", next: "chapter2_church_paper_02" }),
    chapter2_church_paper_02: churchScene({ speaker: "系统", text: "还能辨认：\n“东区……”\n“……转运……”\n“……27日……”", next: "chapter2_church_paper_03" }),
    chapter2_church_paper_03: churchScene({ speaker: "莱纳", text: "转运？", next: "chapter2_church_paper_04" }),
    chapter2_church_paper_04: churchScene({ speaker: "莱纳", text: "剩下的部分全烧掉了。", next: "chapter2_church_paper_clue" }),
    chapter2_church_paper_clue: churchScene({ speaker: "系统", text: "【获得线索：残缺转运纸片】", flags: ["churchTransferPaperFound"], evidence: ["church_transfer_paper"], returnToExplore: true }),
    chapter2_church_paper_repeat: churchScene({ speaker: "莱纳", text: "只能看清“东区”“转运”和“27日”。", returnToExplore: true }),

    chapter2_church_exit_need_clues: churchScene({ speaker: "莱纳", text: "还不能走。拖痕、镇静剂和祭坛旁的药瓶，我得先查清楚。", returnToExplore: true }),
    chapter2_church_exit_01: churchScene({ speaker: "莱纳", text: "废弃教堂。", next: "chapter2_church_exit_02" }),
    chapter2_church_exit_02: churchScene({ speaker: "莱纳", text: "新的拖痕。", next: "chapter2_church_exit_03" }),
    chapter2_church_exit_03: churchScene({ speaker: "莱纳", text: "镇静剂。", next: "chapter2_church_exit_04" }),
    chapter2_church_exit_04: churchScene({ speaker: "旁白", text: "莱纳拿出那只标着 G-17 的旧药瓶。", itemImage: C.g17Damaged, itemAlt: "标签磨损的G-17药瓶", next: "chapter2_church_exit_05" }),
    chapter2_church_exit_05: churchScene({ speaker: "莱纳", text: "还有这个。", next: "chapter2_church_exit_pause" }),
    chapter2_church_exit_pause: churchScene({ hideDialog: true, autoAdvance: 350, next: "chapter2_church_exit_06" }),
    chapter2_church_exit_06: churchScene({ speaker: "莱纳", text: "这里绝对不只是祈祷的地方。", next: "chapter2_church_exit_goal" }),
    chapter2_church_exit_goal: churchScene({ speaker: "系统", text: "【继续调查地下街】\n也许其他地方还保存着关于 G-17 和人员转运的记录。", flags: ["churchExitSummarySeen"], objective: "继续调查地下街", targetMap: "undergroundStreet", restoreMapPosition: true, mapTransition: true, returnToExplore: true }),
    chapter2_church_exit_repeat: churchScene({ speaker: "莱纳", text: "这里的线索已经记下。继续调查地下街。", targetMap: "undergroundStreet", restoreMapPosition: true, mapTransition: true, returnToExplore: true }),

    chapter2_blackmarket_closed: createScene({ chapter: "第二章 · 消失的人", speaker: "黑市商人", text: "没东西卖给调查兵团。也没消息。", background: B.city, returnToExplore: true }),
    chapter2_blackmarket_hint: createScene({ chapter: "第二章 · 消失的人", speaker: "黑市商人", text: "你说那些封闭马车？去废弃仓库看看。有人把运输账本藏在那里。不过我没跟你说过。", background: B.city, flags: ["slumWarehouseHint"], evidence: ["slum_blackmarket_hint"], returnToExplore: true }),

    chapter2_clue_transport: createScene({ chapter: "第二章 · 消失的人", speaker: "运输记录", text: "医疗物资运输：G-17药剂 32箱；镇静剂 8箱。目的地：玛利亚西侧第七码头。", background: B.city, flags: ["slumTransportFound", "clue_seventh_dock"], evidence: ["slum_transport"], next: "chapter2_clue_transport_02" }),
    chapter2_clue_transport_02: createScene({ chapter: "第二章 · 消失的人", speaker: "莱纳", text: "第七码头？这附近根本没有河，也没有码头。这个名字是假的。", background: B.city, character: C.reiner, routes: [
      { conditions: { evidence: ["slum_vial"] }, next: "chapter2_clue_transport_g17" }
    ], next: "chapter2_clue_transport_03" }),
    chapter2_clue_transport_g17: createScene({ chapter: "第二章 · 消失的人", speaker: "莱纳", text: "而且G-17……和旧教堂里的药瓶编号一样。", background: B.city, character: C.reiner, next: "chapter2_clue_transport_03" }),
    chapter2_clue_transport_03: createScene({ chapter: "第二章 · 消失的人", speaker: "系统", text: "线索已经开始指向同一个去处。你可以继续调查，也可以尝试返回总部整理证据。", background: B.city, returnToExplore: true }),

    chapter2_exit_check: createScene({ chapter: "第二章 · 消失的人", speaker: "莱纳", text: "现在就回总部吗？", background: B.city, character: C.reiner, routes: [
      { conditions: { allFlags: chapter2RequiredFlags, evidence: ["slum_list", "slum_cross", "slum_merchant", "slum_transport", "slum_vial"] }, next: "chapter2_all_evidence" },
      { conditions: { allFlags: chapter2RequiredFlags }, next: "chapter2_investigation_complete" }
    ], next: "chapter2_need_more" }),
    chapter2_need_more: createScene({ chapter: "第二章 · 消失的人", speaker: "莱纳", text: "还不能回去。失踪人口、深夜马车和第七码头这三条线索必须查齐。", background: B.city, character: C.reiner, returnToExplore: true }),
    chapter2_all_evidence: createScene({ chapter: "第二章 · 消失的人", speaker: "莱纳", text: "失踪名单、破晓者、夜间马车、G-17和第七码头……这些东西不该彼此有关。", background: B.city, character: C.reiner, flags: ["allSlumEvidence"], achievement: "missing_people", next: "chapter2_return_hq" }),
    chapter2_investigation_complete: createScene({ chapter: "第二章 · 消失的人", speaker: "莱纳", text: "证据已经足够证明：这些人不是正常离开地下街的。", background: B.city, character: C.reiner, achievement: "missing_people", next: "chapter2_return_hq" }),
    chapter2_return_hq: createScene({ chapter: "第二章 · 消失的人", speaker: "系统", text: "返回调查兵团总部，向韩吉汇报。", background: B.city, flags: ["chapter2ReturnedToHq"], objective: "向韩吉汇报地下街调查结果", targetMap: "hq", returnToExplore: true }),
    chapter2_04: createScene({ chapter: "第二章 · 消失的人", speaker: "韩吉", text: "地下街有人大规模失踪；教会的封闭马车在运人；一批G-17药剂和镇静剂被送往一个地图上不存在的‘第七码头’。", background: B.training, character: C.hange, next: "chapter2_05" }),
    chapter2_05: createScene({ chapter: "第二章 · 消失的人", speaker: "韩吉", text: "现在还不能说他们去了哪里。但至少有人在故意隐藏这些人的去向，而且巨壁教一定知道些什么。", background: B.training, character: C.hange, next: "chapter2_06" }),
    chapter2_06: createScene({ chapter: "第二章 · 消失的人", speaker: "莱纳", text: "如果那些人真的没有死……他们到底被带去了哪里？", background: B.training, character: C.reiner, flags: ["chapter2Reported", "chapter2Complete"], next: "chapter2_end_memory_01" }),
    chapter2_end_memory_01: createScene({ chapter: "第二章 · 消失的人", speaker: "记忆", text: "对象确认。", background: B.crisis, effect: "memory-fragment", hideDialog: true, autoAdvance: 850, next: "chapter2_end_memory_02" }),
    chapter2_end_memory_02: createScene({ chapter: "第二章 · 消失的人", speaker: "记忆", text: "准备净化。", background: B.crisis, effect: "memory-fragment", hideDialog: true, autoAdvance: 950, next: "chapter2_end_memory_03" }),
    chapter2_end_memory_03: createScene({ chapter: "第二章 · 消失的人", speaker: "", text: "针管。", background: B.crisis, effect: "memory-fragment", hideDialog: true, autoAdvance: 900, next: "chapter2_end_card" }),
    chapter2_end_card: createScene({ chapter: "第二章 · 消失的人", speaker: "", text: "第二章结束\n第三章 · 墙后的档案", background: B.crisis, effect: "chapter-card", hideDialog: true, autoAdvance: 1500, next: "chapter3_01" }),

    /* 第三章 · 墙后的档案：第七维护站探索。 */
    chapter3_01: createScene({ chapter: "第三章 · 墙后的档案", speaker: "韩吉", text: "我查到‘第七码头’了。", background: B.training, character: C.hange, next: "chapter3_02" }),
    chapter3_02: createScene({ chapter: "第三章 · 墙后的档案", speaker: "莱纳", text: "那里不是没有码头吗？", background: B.training, character: C.reiner, next: "chapter3_03" }),
    chapter3_03: createScene({ chapter: "第三章 · 墙后的档案", speaker: "韩吉", text: "因为它根本不是码头。", background: B.training, character: C.hange, next: "chapter3_04" }),
    chapter3_04: createScene({ chapter: "第三章 · 墙后的档案", speaker: "韩吉", text: "那个位置原本叫‘第七维护站’，845年后归巨壁教管理。", background: B.training, character: C.hange,
      flags: ["clue_seventh_station_church_facility"], evidence: ["seventh_maintenance_station_record"], next: "chapter3_05" }),
    chapter3_05: createScene({ chapter: "第三章 · 墙后的档案", speaker: "莱纳", text: "所以地下街的人被送到了那里。", background: B.training, character: C.reiner, next: "chapter3_06" }),
    chapter3_06: createScene({ chapter: "第三章 · 墙后的档案", speaker: "韩吉", text: "今晚去看看。", background: B.training, character: C.hange, next: "chapter3_mission" }),
    chapter3_mission: createScene({ chapter: "第三章 · 墙后的档案", speaker: "系统", text: "【主线任务更新】\n【前往第七维护站。】", background: B.training,
      flags: ["chapter3_briefing_done"], objective: "进入第七维护站，调查巨壁教留下的档案", targetMap: "seventhMaintenanceStation", returnToExplore: true }),
    chapter3_station_enter: createScene({ chapter: "第三章 · 墙后的档案", speaker: "", text: "", background: B.city, exploreOnly: true,
      flags: ["visited_seventh_maintenance_station"], objective: "调查维护站内的四项核心线索" }),

    chapter3_g17_01: createScene({ chapter: "第三章 · 第七维护站", speaker: "系统", text: "【木箱编号：G-17】", background: B.city, next: "chapter3_g17_02" }),
    chapter3_g17_02: createScene({ chapter: "第三章 · 第七维护站", speaker: "莱纳", text: "和地下街的药瓶一样。", background: B.city, character: C.reiner, next: "chapter3_g17_03" }),
    chapter3_g17_03: createScene({ chapter: "第三章 · 第七维护站", speaker: "韩吉", text: "看来我们找对地方了。", background: B.city, character: C.hange,
      flags: ["clue_g17_station"], evidence: ["station_g17_crate"], returnToExplore: true }),

    chapter3_transfer_file_01: createScene({ chapter: "第三章 · 第七维护站", speaker: "韩吉", text: "这些不是普通的废纸。", background: B.city, character: C.hange,
      flags: ["chapter3_archive_found"], next: "chapter3_transfer_file_02" }),
    chapter3_transfer_file_02: createScene({ chapter: "第三章 · 第七维护站", speaker: "莱纳", text: "被人故意撕碎了。", background: B.city, character: C.reiner, next: "chapter3_transfer_file_03" }),
    chapter3_transfer_file_03: createScene({ chapter: "第三章 · 第七维护站", speaker: "韩吉", text: "能拼回多少算多少。真正重要的记录，也许就混在里面。", background: B.city, character: C.hange, next: "chapter3_archive_puzzle" }),
    chapter3_archive_continue: createScene({ chapter: "第三章 · 第七维护站", speaker: "系统", text: "继续复原档案。", background: B.city, next: "chapter3_archive_puzzle" }),
    chapter3_archive_puzzle: createScene({ chapter: "第三章 · 第七维护站", speaker: "系统", text: "把六块文件碎片拼回原位。", background: B.city, minigame: {
      type: "archivePuzzle", resultKey: "archivePuzzle", scope: "chapter3_transfer_record", label: "开始档案复原",
      successFlags: ["chapter3_archive_puzzle_completed", "archive_game_completed", "has_dock_transfer_record"],
      successEvidence: ["dock_transfer_record"], onSuccess: "chapter3_transfer_record_01",
      onFailure: "chapter3_archive_puzzle_paused", onUnavailable: "chapter3_archive_puzzle_placeholder"
    } }),
    chapter3_archive_puzzle_paused: createScene({ chapter: "第三章 · 第七维护站", speaker: "系统", text: "档案碎片的位置已经保留。之后可以继续复原。", background: B.city, returnToExplore: true }),
    chapter3_archive_puzzle_retry: createScene({ chapter: "第三章 · 第七维护站", speaker: "莱纳", text: "碎片的位置不对。", background: B.city, character: C.reiner, choices: [
      { id: "retry_archive_puzzle", text: "重新复原档案", next: "chapter3_archive_puzzle" },
      { id: "read_archive_manually", text: "先按残留文字整理", next: "chapter3_archive_puzzle_placeholder" }
    ] }),
    chapter3_archive_puzzle_placeholder: createScene({ chapter: "第三章 · 第七维护站", speaker: "系统", text: "【档案复原小游戏接口已预留。当前版本按碎片边缘与残留字迹完成整理。】", background: B.city,
      flags: ["chapter3_archive_puzzle_completed"], next: "chapter3_transfer_record_01" }),
    chapter3_transfer_record_01: createScene({ chapter: "第三章 · 第七维护站", speaker: "韩吉", text: "现在可以确定了。", background: B.city, character: C.hange, next: "chapter3_transfer_record_02" }),
    chapter3_transfer_record_02: createScene({ chapter: "第三章 · 第七维护站", speaker: "莱纳", text: "那些人不是普通的失踪。", background: B.city, character: C.reiner, next: "chapter3_transfer_record_03" }),
    chapter3_transfer_record_03: createScene({ chapter: "第三章 · 第七维护站", speaker: "韩吉", text: "有人把他们从地下街集中运走，再逐一使用G-17。", background: B.city, character: C.hange, next: "chapter3_transfer_record_04" }),
    chapter3_transfer_record_04: createScene({ chapter: "第三章 · 第七维护站", speaker: "莱纳", text: "但是‘净化’究竟会把人变成什么……", background: B.city, character: C.reiner, next: "chapter3_transfer_record_05" }),
    chapter3_transfer_record_05: createScene({ chapter: "第三章 · 第七维护站", speaker: "韩吉", text: "我们还没有看到最后一步。", background: B.city, character: C.hange, next: "chapter3_transfer_record_clue" }),
    chapter3_transfer_record_clue: createScene({ chapter: "第三章 · 第七维护站", speaker: "系统", text: "【获得关键证据：人员转运记录】", background: B.city,
      flags: ["clue_personnel_transfer_record", "clue_g17_missing_people"], evidence: ["personnel_transfer_record"], returnToExplore: true }),
    chapter3_archive_review_prompt: createScene({ chapter: "第三章 · 第七维护站", speaker: "系统", text: "这份档案已经完成复原。", background: B.city, choices: [
      { id: "review_dock_record", text: "重新查看档案", next: "chapter3_archive_review" },
      { id: "leave_dock_record", text: "离开", next: "chapter3_archive_review_leave" }
    ] }),
    chapter3_archive_review: createScene({ chapter: "第三章 · 第七维护站", speaker: "第七码头转运记录", text: "批次：07-24\n来源区域：地下街东区\n转运人数：18\n处理方式：净化\nG-17消耗：18单位\n后续地点：投放区A", background: B.city, next: "chapter3_archive_review_leave" }),
    chapter3_archive_review_leave: createScene({ chapter: "第三章 · 第七维护站", speaker: "系统", text: "档案被重新收好。", background: B.city, returnToExplore: true }),

    chapter3_karl_file_01: createScene({ chapter: "第三章 · 第七维护站", speaker: "档案", text: "卡尔·费舍尔\n身份：地下街居民\n关联组织：破晓者\n处置：净化", background: B.city, next: "chapter3_karl_file_02" }),
    chapter3_karl_file_02: createScene({ chapter: "第三章 · 第七维护站", speaker: "莱纳", text: "卡尔……", background: B.city, character: C.reiner, next: "chapter3_karl_file_03" }),
    chapter3_karl_file_03: createScene({ chapter: "第三章 · 第七维护站", speaker: "韩吉", text: "就是第一章信里的那个人？", background: B.city, character: C.hange, next: "chapter3_karl_file_04" }),
    chapter3_karl_file_04: createScene({ chapter: "第三章 · 第七维护站", speaker: "莱纳", text: "嗯。", background: B.city, character: C.reiner, routes: [
      { conditions: { allFlags: ["clue_cross_obtained"] }, next: "chapter3_karl_cross_01" }
    ], next: "chapter3_karl_file_clue" }),
    chapter3_karl_cross_01: createScene({ chapter: "第三章 · 第七维护站", speaker: "莱纳", text: "那只巨人身上，也有他的十字架。", background: B.city, character: C.reiner, next: "chapter3_karl_cross_02" }),
    chapter3_karl_cross_02: createScene({ chapter: "第三章 · 第七维护站", speaker: "韩吉", text: "……", background: B.city, character: C.hange, next: "chapter3_karl_cross_03" }),
    chapter3_karl_cross_03: createScene({ chapter: "第三章 · 第七维护站", speaker: "韩吉", text: "还不能确定。", background: B.city, character: C.hange, next: "chapter3_karl_cross_04" }),
    chapter3_karl_cross_04: createScene({ chapter: "第三章 · 第七维护站", speaker: "莱纳", text: "但你也想到了。", background: B.city, character: C.reiner, next: "chapter3_karl_file_clue" }),
    chapter3_karl_file_clue: createScene({ chapter: "第三章 · 第七维护站", speaker: "系统", text: "【记录档案：卡尔·费舍尔——处置：净化】", background: B.city,
      flags: ["clue_karl_purification"], evidence: ["karl_purification_record"], returnToExplore: true }),

    chapter3_outside_map_01: createScene({ chapter: "第三章 · 第七维护站", speaker: "墙外资源调查图", text: "森林\n平原\n河流\n海岸\n可耕种区域\n\n高墙附近：【生物隔离带】", background: B.field, next: "chapter3_outside_map_02" }),
    chapter3_outside_map_02: createScene({ chapter: "第三章 · 第七维护站", speaker: "莱纳", text: "这些地方都适合居住。", background: B.field, character: C.reiner, next: "chapter3_outside_map_03" }),
    chapter3_outside_map_03: createScene({ chapter: "第三章 · 第七维护站", speaker: "韩吉", text: "嗯。", background: B.field, character: C.hange, next: "chapter3_outside_map_04" }),
    chapter3_outside_map_04: createScene({ chapter: "第三章 · 第七维护站", speaker: "莱纳", text: "可巨壁教一直说墙外只有死亡。", background: B.field, character: C.reiner, next: "chapter3_outside_map_05" }),
    chapter3_outside_map_05: createScene({ chapter: "第三章 · 第七维护站", speaker: "韩吉", text: "说明他们一直知道真相。", background: B.field, character: C.hange, next: "chapter3_outside_map_clue" }),
    chapter3_outside_map_clue: createScene({ chapter: "第三章 · 第七维护站", speaker: "系统", text: "【获得关键证据：墙外资源调查图】", background: B.field,
      flags: ["clue_outside_resource_map", "outsideWorldSafe"], evidence: ["outside_resource_map", "archive_resource"], achievement: "outside_no_titans", returnToExplore: true }),

    chapter3_hidden_experiment_01: createScene({ chapter: "第三章 · 第七维护站", speaker: "系统", text: "【档案柜夹层中藏着一页残缺记录。】", background: B.city, next: "chapter3_hidden_experiment_02" }),
    chapter3_hidden_experiment_02: createScene({ chapter: "第三章 · 第七维护站", speaker: "群体诱导实验记录", text: "目标数量：32\n统一转向成功\n控制来源：始祖……\n\n【后半部分缺失】", background: B.city, next: "chapter3_hidden_experiment_clue" }),
    chapter3_hidden_experiment_clue: createScene({ chapter: "第三章 · 第七维护站", speaker: "系统", text: "【获得隐藏证据：群体诱导实验记录】", background: B.city,
      flags: ["hidden_group_induction_record", "foundFounderRecord"], evidence: ["group_induction_record", "archive_founder"], returnToExplore: true }),

    chapter3_sealed_room_01: createScene({ chapter: "第三章 · 第七维护站", speaker: "系统", text: "【封闭房间里只有一张木床、束缚带和几个空G-17药瓶。】", background: B.city, next: "chapter3_sealed_room_flash_01" }),
    chapter3_sealed_room_flash_01: createScene({ chapter: "第三章 · 第七维护站", speaker: "记忆", text: "对象确认。", background: B.crisis, effect: "memory-fragment", hideDialog: true, autoAdvance: 850, next: "chapter3_sealed_room_flash_02" }),
    chapter3_sealed_room_flash_02: createScene({ chapter: "第三章 · 第七维护站", speaker: "记忆", text: "开始净化。", background: B.crisis, effect: "memory-fragment", hideDialog: true, autoAdvance: 950, next: "chapter3_sealed_room_02" }),
    chapter3_sealed_room_02: createScene({ chapter: "第三章 · 第七维护站", speaker: "莱纳", text: "……", background: B.city, character: C.reinerTrauma, next: "chapter3_sealed_room_03" }),
    chapter3_sealed_room_03: createScene({ chapter: "第三章 · 第七维护站", speaker: "莱纳", text: "我来过这里。", background: B.city, character: C.reinerTrauma, next: "chapter3_sealed_room_04" }),
    chapter3_sealed_room_04: createScene({ chapter: "第三章 · 第七维护站", speaker: "韩吉", text: "你确定？", background: B.city, character: C.hange, next: "chapter3_sealed_room_05" }),
    chapter3_sealed_room_05: createScene({ chapter: "第三章 · 第七维护站", speaker: "莱纳", text: "不确定。", background: B.city, character: C.reinerTrauma, next: "chapter3_sealed_room_06" }),
    chapter3_sealed_room_06: createScene({ chapter: "第三章 · 第七维护站", speaker: "莱纳", text: "但我见过有人被绑在这张床上。", background: B.city, character: C.reinerTrauma, next: "chapter3_sealed_room_done" }),
    chapter3_sealed_room_done: createScene({ chapter: "第三章 · 第七维护站", speaker: "系统", text: "【主线任务更新】\n【返回调查兵团总部。】", background: B.city,
      flags: ["chapter3_sealed_room_checked"], objective: "返回调查兵团总部，与韩吉整理调查结果", returnToExplore: true }),

    chapter3_leave_station: createScene({ chapter: "第三章 · 墙后的档案", speaker: "系统", text: "【莱纳与韩吉带着档案返回调查兵团总部。】", background: B.training,
      flags: ["chapter3_returned_to_hq"], objective: "与韩吉整理第七维护站的调查结果", targetMap: "hq", returnToExplore: true }),
    chapter3_return_hq_01: createScene({ chapter: "第三章 · 墙后的档案", speaker: "韩吉", text: "现在已经可以确定。", background: B.training, character: C.hange, next: "chapter3_return_hq_02" }),
    chapter3_return_hq_02: createScene({ chapter: "第三章 · 墙后的档案", speaker: "韩吉", text: "失踪的人被带到了这里。", background: B.training, character: C.hange, next: "chapter3_return_hq_03" }),
    chapter3_return_hq_03: createScene({ chapter: "第三章 · 墙后的档案", speaker: "莱纳", text: "然后接受所谓的‘净化’。", background: B.training, character: C.reiner, next: "chapter3_return_hq_04" }),
    chapter3_return_hq_04: createScene({ chapter: "第三章 · 墙后的档案", speaker: "韩吉", text: "但净化之后发生了什么，我们还不知道。", background: B.training, character: C.hange, next: "chapter3_return_cross" }),
    chapter3_return_cross: createScene({ chapter: "第三章 · 墙后的档案", speaker: "旁白", text: "莱纳拿出卡尔的十字架。", background: B.training, next: "chapter3_return_voice_01" }),
    chapter3_return_voice_01: createScene({ chapter: "第三章 · 墙后的档案", speaker: "过去的声音", text: "莱纳。", background: B.crisis, effect: "memory-fragment", hideDialog: true, autoAdvance: 850, next: "chapter3_return_voice_02" }),
    chapter3_return_voice_02: createScene({ chapter: "第三章 · 墙后的档案", speaker: "过去的声音", text: "等门打开以后……", background: B.crisis, effect: "memory-fragment", hideDialog: true, autoAdvance: 1050, next: "chapter3_return_voice_03" }),
    chapter3_return_voice_03: createScene({ chapter: "第三章 · 墙后的档案", speaker: "过去的声音", text: "我要带她去看海。", background: B.crisis, effect: "memory-fragment", hideDialog: true, autoAdvance: 1100, next: "chapter3_return_flash" }),
    chapter3_return_flash: createScene({ chapter: "第三章 · 墙后的档案", speaker: "", text: "莱纳第一次看见，过去的自己也握着同样的十字架。", background: B.crisis, effect: "flash-start", hideDialog: true, autoAdvance: 700, next: "chapter3_return_reiner_01" }),
    chapter3_return_reiner_01: createScene({ chapter: "第三章 · 墙后的档案", speaker: "莱纳", text: "……", background: B.training, character: C.reinerTrauma, next: "chapter3_return_reiner_02" }),
    chapter3_return_reiner_02: createScene({ chapter: "第三章 · 墙后的档案", speaker: "莱纳", text: "我也是破晓者？", background: B.training, character: C.reinerTrauma,
      flags: ["chapter3_complete"], objective: "继续追查破墙之日的真相", next: "chapter3_end_card" }),
    chapter3_end_card: createScene({ chapter: "第三章 · 墙后的档案", speaker: "", text: "第三章结束", background: B.crisis,
      effect: "chapter-card", hideDialog: true, autoAdvance: 1500, targetMap: "hq", next: "chapter4_01" }),

    /* 第四章 · 破墙之日：钟楼、净化室与记忆重构。 */
    chapter4_01: createScene({ chapter: "第四章 · 破墙之日", speaker: "旁白", text: "调查兵团总部。莱纳收到一封没有署名的信。", background: B.training, next: "chapter4_letter" }),
    chapter4_letter: createScene({ chapter: "第四章 · 破墙之日", speaker: "匿名信", text: "你已经找到卡尔了。\n\n想知道845年的真相。\n\n黄昏，旧城区钟楼。\n\n一个人来。\n\n【信纸最下方画着破晓者的太阳标记。】", background: B.training,
      flags: ["chapter4_letter_received"], next: "chapter4_02" }),
    chapter4_02: createScene({ chapter: "第四章 · 破墙之日", speaker: "韩吉", text: "你准备去？", background: B.training, character: C.hange, next: "chapter4_03" }),
    chapter4_03: createScene({ chapter: "第四章 · 破墙之日", speaker: "莱纳", text: "嗯。", background: B.training, character: C.reiner, next: "chapter4_04" }),
    chapter4_04: createScene({ chapter: "第四章 · 破墙之日", speaker: "韩吉", text: "天亮以前回来。", background: B.training, character: C.hange, next: "chapter4_clocktower_arrival" }),

    chapter4_clocktower_arrival: createScene({ chapter: "第四章 · 破墙之日", speaker: "旁白", text: "黄昏。旧城区钟楼。莱纳独自推开布满铁锈的门。", background: B.city, next: "chapter4_clocktower_01" }),
    chapter4_clocktower_01: createScene({ chapter: "第四章 · 破墙之日", speaker: "莱纳", text: "是你找我？", background: B.city, character: C.reiner, next: "chapter4_clocktower_02" }),
    chapter4_clocktower_02: createScene({ chapter: "第四章 · 破墙之日", speaker: "贝尔托特", text: "你真的都忘了。", background: B.city, next: "chapter4_clocktower_03" }),
    chapter4_clocktower_03: createScene({ chapter: "第四章 · 破墙之日", speaker: "莱纳", text: "我们认识？", background: B.city, character: C.reiner, next: "chapter4_clocktower_cross" }),
    chapter4_clocktower_cross: createScene({ chapter: "第四章 · 破墙之日", speaker: "旁白", text: "贝尔托特拿出一枚破晓者十字架。", background: B.city, character: C.dawnbreakerCross, next: "chapter4_clocktower_04" }),
    chapter4_clocktower_04: createScene({ chapter: "第四章 · 破墙之日", speaker: "贝尔托特", text: "我们以前都是破晓者。", background: B.city,
      flags: ["chapter4_past_identity_revealed"], evidence: ["dawnbreaker_identity"], next: "chapter4_old_memory_01" }),
    chapter4_old_memory_01: createScene({ chapter: "第四章 · 破墙之日", speaker: "年轻莱纳", text: "只要墙还关着，他们就永远出不去。", background: B.crisis,
      effect: "memory-fragment", hideDialog: true, autoAdvance: 1100, next: "chapter4_clocktower_05" }),
    chapter4_clocktower_05: createScene({ chapter: "第四章 · 破墙之日", speaker: "莱纳", text: "卡尔呢？", background: B.city, character: C.reiner, next: "chapter4_clocktower_06" }),
    chapter4_clocktower_06: createScene({ chapter: "第四章 · 破墙之日", speaker: "贝尔托特", text: "跟我来。", background: B.city, next: "chapter4_enter_purification_room" }),
    chapter4_enter_purification_room: createScene({ chapter: "第四章 · 破墙之日", speaker: "系统", text: "【钟楼地下——净化室】\n调查木床、药瓶和投放口。", background: B.city,
      objective: "调查净化室内的三个关键位置", targetMap: "clockTowerUnderground", returnToExplore: true }),
    chapter4_purification_room_enter: createScene({ chapter: "第四章 · 破墙之日", speaker: "", text: "", background: B.city, exploreOnly: true,
      flags: ["visited_clock_tower_underground"], objective: "调查净化室内的三个关键位置" }),

    chapter4_bed_01: createScene({ chapter: "第四章 · 地下净化室", speaker: "旁白", text: "木床上的皮制束缚带已经发黑，金属扣环留着反复使用的磨痕。", background: B.city, next: "chapter4_bed_memory_01" }),
    chapter4_bed_memory_01: createScene({ chapter: "第四章 · 地下净化室", speaker: "记忆", text: "对象确认。", background: B.crisis, effect: "memory-fragment", hideDialog: true, autoAdvance: 800, next: "chapter4_bed_memory_02" }),
    chapter4_bed_memory_02: createScene({ chapter: "第四章 · 地下净化室", speaker: "记忆", text: "G-17准备。", background: B.crisis, effect: "memory-fragment", hideDialog: true, autoAdvance: 900, next: "chapter4_bed_done" }),
    chapter4_bed_done: createScene({ chapter: "第四章 · 地下净化室", speaker: "莱纳", text: "这和第七维护站的房间一样。", background: B.city, character: C.reiner,
      flags: ["chapter4_bed_checked"], returnToExplore: true }),

    chapter4_g17_01: createScene({ chapter: "第四章 · 地下净化室", speaker: "莱纳", text: "G-17到底是什么？", background: B.city, character: C.reiner, itemImage: C.g17Vial, next: "chapter4_g17_02" }),
    chapter4_g17_02: createScene({ chapter: "第四章 · 地下净化室", speaker: "贝尔托特", text: "巨人脊髓液。", background: B.city, itemImage: C.g17Vial, next: "chapter4_g17_03" }),
    chapter4_g17_03: createScene({ chapter: "第四章 · 地下净化室", speaker: "莱纳", text: "……", background: B.city, character: C.reiner, itemImage: C.g17Vial, next: "chapter4_g17_04" }),
    chapter4_g17_04: createScene({ chapter: "第四章 · 地下净化室", speaker: "贝尔托特", text: "被注射的人，会变成无垢巨人。", background: B.city, itemImage: C.g17Vial, next: "chapter4_g17_truth" }),
    chapter4_g17_truth: createScene({ chapter: "第四章 · 地下净化室", speaker: "系统", text: "【真相：无垢巨人原本都是人类】", background: B.city,
      itemImage: C.g17Vial, flags: ["chapter4_g17_truth_found", "truth_pure_titans_are_human"], evidence: ["g17_spinal_fluid", "pure_titans_were_human"], returnToExplore: true }),

    chapter4_chute_01: createScene({ chapter: "第四章 · 地下净化室", speaker: "旁白", text: "投放口下方是通往墙外的封闭坡道。莱纳碰到控制杆的一瞬间，记忆猛地涌回。", background: B.city, next: "chapter4_karl_memory_01" }),
    chapter4_karl_memory_01: createScene({ chapter: "第四章 · 地下净化室", speaker: "卡尔", text: "我还有女儿！", background: B.crisis, effect: "memory-fragment", hideDialog: true, autoAdvance: 900, next: "chapter4_karl_memory_02" }),
    chapter4_karl_memory_02: createScene({ chapter: "第四章 · 地下净化室", speaker: "卡尔", text: "莱纳！", background: B.crisis, effect: "memory-fragment", hideDialog: true, autoAdvance: 850, next: "chapter4_chute_02" }),
    chapter4_chute_02: createScene({ chapter: "第四章 · 地下净化室", speaker: "莱纳", text: "卡尔……", background: B.city, character: C.reiner, next: "chapter4_chute_03" }),
    chapter4_chute_03: createScene({ chapter: "第四章 · 地下净化室", speaker: "贝尔托特", text: "他被抓以后，被送到了这里。", background: B.city, next: "chapter4_chute_04" }),
    chapter4_chute_04: createScene({ chapter: "第四章 · 地下净化室", speaker: "莱纳", text: "第一章那只巨人……", background: B.city, character: C.reiner, next: "chapter4_chute_05" }),
    chapter4_chute_05: createScene({ chapter: "第四章 · 地下净化室", speaker: "贝尔托特", text: "就是他。", background: B.city, next: "chapter4_chute_06" }),
    chapter4_chute_06: createScene({ chapter: "第四章 · 地下净化室", speaker: "莱纳", text: "是我杀了他。", background: B.city, character: C.reiner, next: "chapter4_chute_07" }),
    chapter4_chute_07: createScene({ chapter: "第四章 · 地下净化室", speaker: "贝尔托特", text: "他早在被注射的时候，就已经回不来了。", background: B.city, next: "chapter4_chute_truth" }),
    chapter4_chute_truth: createScene({ chapter: "第四章 · 地下净化室", speaker: "系统", text: "【确认：卡尔·费舍尔就是旧城区的无垢巨人】", background: B.city,
      flags: ["chapter4_karl_truth_found"], evidence: ["karl_titan_truth"], returnToExplore: true }),

    chapter4_dawnbreakers_01: createScene({ chapter: "第四章 · 破墙之日", speaker: "贝尔托特", text: "破晓者最早只是想知道墙外有什么。", background: B.city, next: "chapter4_dawnbreakers_02" }),
    chapter4_dawnbreakers_02: createScene({ chapter: "第四章 · 破墙之日", speaker: "贝尔托特", text: "后来我们发现了巨人制造设施。", background: B.city, next: "chapter4_dawnbreakers_03" }),
    chapter4_dawnbreakers_03: createScene({ chapter: "第四章 · 破墙之日", speaker: "贝尔托特", text: "也发现墙外真正安全的地方。", background: B.city, next: "chapter4_dawnbreakers_04" }),
    chapter4_dawnbreakers_04: createScene({ chapter: "第四章 · 破墙之日", speaker: "莱纳", text: "所以我们决定打开玛利亚之墙。", background: B.city, character: C.reiner, next: "chapter4_dawnbreakers_05" }),
    chapter4_dawnbreakers_05: createScene({ chapter: "第四章 · 破墙之日", speaker: "贝尔托特", text: "而最坚持这么做的人，就是你。", background: B.city, next: "chapter4_dawnbreakers_06" }),
    chapter4_dawnbreakers_06: createScene({ chapter: "第四章 · 破墙之日", speaker: "贝尔托特", text: "你、我，还有阿妮。", background: B.city, next: "chapter4_dawnbreakers_07" }),
    chapter4_dawnbreakers_07: createScene({ chapter: "第四章 · 破墙之日", speaker: "贝尔托特", text: "我们拥有普通人没有的巨人力量。", background: B.city,
      flags: ["chapter4_dawnbreakers_truth"], evidence: ["dawnbreakers_truth"], next: "chapter4_dawnbreakers_08" }),
    chapter4_dawnbreakers_08: createScene({ chapter: "第四章 · 破墙之日", speaker: "莱纳", text: "那845年到底发生了什么？", background: B.city, character: C.reiner, next: "chapter4_dawnbreakers_09" }),
    chapter4_dawnbreakers_09: createScene({ chapter: "第四章 · 破墙之日", speaker: "贝尔托特", text: "你自己想起来吧。", background: B.city, next: "chapter4_memory_reconstruction" }),

    chapter4_memory_reconstruction: createScene({ chapter: "第四章 · 破墙之日", speaker: "系统", text: "排列六张记忆卡片，恢复845年破墙之日的完整顺序。", background: B.crisis, minigame: {
      type: "memoryReconstruction", resultKey: "memory", scope: "wall_breach_845", label: "开始记忆重构",
      successFlags: ["memoryRecovered", "chapter4_memory_puzzle_completed"], achievement: "memory_restored",
      onSuccess: "chapter4_845_memory_01", onFailure: "chapter4_memory_reconstruction_retry", onUnavailable: "chapter4_memory_reconstruction_retry"
    } }),
    chapter4_memory_reconstruction_retry: createScene({ chapter: "第四章 · 破墙之日", speaker: "莱纳", text: "顺序不对……记忆又散开了。", background: B.crisis, character: C.reiner, choices: [
      { id: "retry_memory_reconstruction", text: "重新排列记忆", next: "chapter4_memory_reconstruction" },
      { id: "follow_memory_fragments", text: "沿着残留记忆继续排序", next: "chapter4_memory_reconstruction" }
    ] }),
    chapter4_845_memory_01: createScene({ chapter: "第四章 · 845年的记忆", speaker: "卡尔", text: "门打开以后，我要带她去看海。", background: B.crisis, effect: "memory-fragment", hideDialog: true, autoAdvance: 1100, next: "chapter4_845_memory_02" }),
    chapter4_845_memory_02: createScene({ chapter: "第四章 · 845年的记忆", speaker: "年轻莱纳", text: "那就一起活着出去。", background: B.crisis, effect: "memory-fragment", hideDialog: true, autoAdvance: 1050, next: "chapter4_845_memory_03" }),
    chapter4_845_memory_03: createScene({ chapter: "第四章 · 845年的记忆", speaker: "旁白", text: "莱纳化身铠之巨人，撞开玛利亚之墙的城门。", background: B.crisis, next: "chapter4_845_memory_04" }),
    chapter4_845_memory_04: createScene({ chapter: "第四章 · 845年的记忆", speaker: "旁白", text: "城门被撞开。等待在附近的平民开始向墙外撤离。", background: B.crisis, next: "chapter4_845_memory_05" }),
    chapter4_845_memory_05: createScene({ chapter: "第四章 · 845年的记忆", speaker: "旁白", text: "突然，远处响起钟声。大量无垢巨人在同一瞬间改变方向，冲向城门。", background: B.crisis, next: "chapter4_845_memory_06" }),
    chapter4_845_memory_06: createScene({ chapter: "第四章 · 845年的记忆", speaker: "年轻莱纳", text: "为什么……", background: B.crisis, next: "chapter4_845_memory_07" }),
    chapter4_845_memory_07: createScene({ chapter: "第四章 · 845年的记忆", speaker: "贝尔托特", text: "巨人被控制了！", background: B.crisis, next: "chapter4_845_memory_collapse" }),
    chapter4_845_memory_collapse: createScene({ chapter: "第四章 · 845年的记忆", speaker: "", text: "哭喊。巨人吼声。建筑倒塌声。", background: B.crisis,
      effect: "collapse", hideDialog: true, autoAdvance: 1200, audio: ["titanRoar"], next: "chapter4_845_memory_08" }),
    chapter4_845_memory_08: createScene({ chapter: "第四章 · 845年的记忆", speaker: "年轻莱纳", text: "是我打开的门……", background: B.crisis, next: "chapter4_845_truth" }),
    chapter4_845_truth: createScene({ chapter: "第四章 · 845年的记忆", speaker: "系统", text: "巨壁教和王政利用始祖巨人的力量，\n将墙外的无垢巨人引入玛利亚之墙。\n\n破晓者的逃亡计划因此变成了大屠杀。", background: B.crisis,
      flags: ["chapter4_845_truth_recovered", "memoryRecovered"], evidence: ["wall_breach_845_truth"], next: "chapter4_845_memory_break" }),
    chapter4_845_memory_break: createScene({ chapter: "第四章 · 845年的记忆", speaker: "旁白", text: "莱纳在混乱中受伤。记忆再次中断。", background: B.crisis, next: "chapter4_present_01" }),

    chapter4_present_01: createScene({ chapter: "第四章 · 破墙之日", speaker: "莱纳", text: "是我撞开的门。", background: B.city, character: C.reiner, next: "chapter4_present_02" }),
    chapter4_present_02: createScene({ chapter: "第四章 · 破墙之日", speaker: "贝尔托特", text: "是。", background: B.city, next: "chapter4_present_03" }),
    chapter4_present_03: createScene({ chapter: "第四章 · 破墙之日", speaker: "莱纳", text: "如果我没有这么做……", background: B.city, character: C.reiner, next: "chapter4_present_04" }),
    chapter4_present_04: createScene({ chapter: "第四章 · 破墙之日", speaker: "贝尔托特", text: "也许那一天不会死那么多人。", background: B.city, next: "chapter4_present_05" }),
    chapter4_present_05: createScene({ chapter: "第四章 · 破墙之日", speaker: "贝尔托特", text: "但如果我们什么都不做，那些人还是会继续被抓走，变成巨人。", background: B.city, next: "chapter4_present_06" }),
    chapter4_present_06: createScene({ chapter: "第四章 · 破墙之日", speaker: "莱纳", text: "……", background: B.city, character: C.reiner, next: "chapter4_present_07" }),
    chapter4_present_07: createScene({ chapter: "第四章 · 破墙之日", speaker: "贝尔托特", text: "我们错在以为只要打开一道门，一切就会结束。", background: B.city, next: "chapter4_leave_clocktower" }),
    chapter4_leave_clocktower: createScene({ chapter: "第四章 · 破墙之日", speaker: "系统", text: "【莱纳在天亮前返回调查兵团总部。】", background: B.training,
      flags: ["chapter4_returned_to_hq"], objective: "将845年的真相告诉韩吉", targetMap: "hq", returnToExplore: true }),

    chapter4_hq_report_01: createScene({ chapter: "第四章 · 破墙之日", speaker: "旁白", text: "莱纳将钟楼里得知的一切告诉韩吉。", background: B.training, next: "chapter4_hq_report_02" }),
    chapter4_hq_report_02: createScene({ chapter: "第四章 · 破墙之日", speaker: "韩吉", text: "如果公开这些东西，整个墙内都会发生巨变。", background: B.training, character: C.hange, next: "chapter4_hq_report_03" }),
    chapter4_hq_report_03: createScene({ chapter: "第四章 · 破墙之日", speaker: "莱纳", text: "但继续隐瞒，也会有人继续变成下一个卡尔。", background: B.training, character: C.reiner, next: "chapter4_route_choice_new" }),
    chapter4_route_choice_new: createScene({ chapter: "第四章 · 破墙之日", speaker: "莱纳", text: "知道真相以后，我必须决定下一步。", background: B.training, character: C.reiner, choices: [
      { id: "route_rebellion", text: "公开真相。", route: "rebellion", next: "chapter4_end_card" },
      { id: "route_order", text: "现在公开只会死更多人。", route: "order", next: "chapter4_end_card" },
      { id: "route_truth", text: "还有东西没有查清。", route: "truth", conditions: { allFlags: ["warehouse_full_investigation", "hidden_group_induction_record"] }, next: "chapter4_end_card" }
    ] }),
    chapter4_end_card: createScene({ chapter: "第四章 · 破墙之日", speaker: "", text: "第四章结束\n第五章 · 黎明之前", background: B.crisis,
      flags: ["chapter4_complete"], effect: "chapter-card", hideDialog: true, autoAdvance: 1500, next: "chapter5_hq_arrival" }),

    /* 第五章 · 黎明之前 */
    chapter5_hq_arrival: createScene({ chapter: "第五章 · 黎明之前", speaker: "旁白", text: "第二天清晨。调查兵团总部外已经出现王政士兵，普通士兵正在匆忙搬运装备。韩吉和利威尔站在大厅中央。", background: B.training,
      flags: ["chapter5_started"], objective: "靠近大厅中央的韩吉和利威尔，按E交谈", targetMap: "hq", returnToExplore: true }),
    chapter5_hq_royal_guard: createScene({ chapter: "第五章 · 黎明之前", speaker: "王政监视兵", text: "奉命执行警戒。无关人员不得离开总部。", background: B.training, returnToExplore: true }),
    chapter5_hq_equipment_soldier: createScene({ chapter: "第五章 · 黎明之前", speaker: "普通士兵", text: "装备都在转移。外面的人看起来不像是来保护我们的。", background: B.training, returnToExplore: true }),
    chapter5_common_01: createScene({ chapter: "第五章 · 黎明之前", speaker: "韩吉", text: "他们已经知道了。", background: B.training, next: "chapter5_common_02" }),
    chapter5_common_02: createScene({ chapter: "第五章 · 黎明之前", speaker: "莱纳", text: "巨壁教？", background: B.training, next: "chapter5_common_03" }),
    chapter5_common_03: createScene({ chapter: "第五章 · 黎明之前", speaker: "韩吉", text: "嗯。第七维护站昨天晚上被彻底封锁。", background: B.training, next: "chapter5_common_04" }),
    chapter5_common_04: createScene({ chapter: "第五章 · 黎明之前", speaker: "韩吉", text: "我们带出来的文件，也被列成了王政最高机密。", background: B.training, next: "chapter5_common_05" }),
    chapter5_common_05: createScene({ chapter: "第五章 · 黎明之前", speaker: "利威尔", text: "外面还有人在监视总部。", background: B.training, next: "chapter5_common_06" }),
    chapter5_common_06: createScene({ chapter: "第五章 · 黎明之前", speaker: "莱纳", text: "所以我们已经没有时间了。", background: B.training, next: "chapter5_common_07" }),
    chapter5_common_07: createScene({ chapter: "第五章 · 黎明之前", speaker: "韩吉", text: "对。", background: B.training,
      flags: ["chapter5_hq_briefing_complete"], next: "chapter5_route_gate" }),
    chapter5_route_gate: createScene({ chapter: "第五章 · 黎明之前", speaker: "旁白", text: "第四章作出的决定，正在把所有人带向不同的黎明。", background: B.training, routes: [
      { conditions: { route: "rebellion" }, next: "chapter5_rebellion_01" },
      { conditions: { route: "order" }, next: "chapter5_order_01" },
      { conditions: { route: "truth" }, next: "chapter5_truth_01" }
    ], next: "chapter5_rebellion_01" }),

    /* 反抗路线 */
    chapter5_rebellion_01: createScene({ chapter: "第五章 · 反抗路线", speaker: "莱纳", text: "那就现在公开。", background: B.training, next: "chapter5_rebellion_02" }),
    chapter5_rebellion_02: createScene({ chapter: "第五章 · 反抗路线", speaker: "韩吉", text: "我已经准备好了。", background: B.training, next: "chapter5_rebellion_03" }),
    chapter5_rebellion_03: createScene({ chapter: "第五章 · 反抗路线", speaker: "莱纳", text: "怎么做？", background: B.training, next: "chapter5_rebellion_04" }),
    chapter5_rebellion_04: createScene({ chapter: "第五章 · 反抗路线", speaker: "韩吉", text: "中央城区有一座广播塔。只要把我们拿到的档案送过去，整个城区都能听见。", background: B.training, next: "chapter5_rebellion_05" }),
    chapter5_rebellion_05: createScene({ chapter: "第五章 · 反抗路线", speaker: "利威尔", text: "问题是……他们也知道。", background: B.training, next: "chapter5_rebellion_alarm" }),
    chapter5_rebellion_alarm: createScene({ chapter: "第五章 · 反抗路线", speaker: "旁白", text: "远处突然响起警报。紧接着，一声巨人吼叫穿过城区。", background: B.crisis, effect: "titan-encounter", audio: ["titanRoar"], next: "chapter5_rebellion_soldier_01" }),
    chapter5_rebellion_soldier_01: createScene({ chapter: "第五章 · 反抗路线", speaker: "普通士兵", text: "韩吉分队长！城门方向发现巨人！", background: B.training, next: "chapter5_rebellion_soldier_02" }),
    chapter5_rebellion_soldier_02: createScene({ chapter: "第五章 · 反抗路线", speaker: "莱纳", text: "多少？", background: B.training, next: "chapter5_rebellion_soldier_03" }),
    chapter5_rebellion_soldier_03: createScene({ chapter: "第五章 · 反抗路线", speaker: "普通士兵", text: "只有一只。但是……很大。", background: B.training, next: "chapter5_rebellion_06" }),
    chapter5_rebellion_06: createScene({ chapter: "第五章 · 反抗路线", speaker: "韩吉", text: "巨壁教。", background: B.training, next: "chapter5_rebellion_07" }),
    chapter5_rebellion_07: createScene({ chapter: "第五章 · 反抗路线", speaker: "莱纳", text: "他们想用巨人封锁通往广播塔的道路。", background: B.training, next: "chapter5_rebellion_08" }),
    chapter5_rebellion_08: createScene({ chapter: "第五章 · 反抗路线", speaker: "韩吉", text: "莱纳。如果我们现在被拖住……", background: B.training, next: "chapter5_rebellion_09" }),
    chapter5_rebellion_09: createScene({ chapter: "第五章 · 反抗路线", speaker: "莱纳", text: "那他们就能把证据全部拿走。我去。", background: B.training, next: "chapter5_rebellion_10" }),
    chapter5_rebellion_10: createScene({ chapter: "第五章 · 反抗路线", speaker: "韩吉", text: "你一个人？", background: B.training, next: "chapter5_rebellion_11" }),
    chapter5_rebellion_11: createScene({ chapter: "第五章 · 反抗路线", speaker: "莱纳", text: "第一章的时候，你让我掩护你杀巨人。这次反过来。", background: B.training, next: "chapter5_rebellion_12" }),
    chapter5_rebellion_12: createScene({ chapter: "第五章 · 反抗路线", speaker: "韩吉", text: "那就别死。", background: B.training, next: "chapter5_rebellion_task" }),
    chapter5_rebellion_task: createScene({ chapter: "第五章 · 反抗路线", speaker: "系统", text: "【主线任务】\n前往中央城区。\n击败阻挡广播塔道路的异常巨人。", background: B.city,
      objective: "前往中央城区，击败阻挡广播塔道路的异常巨人", targetMap: "centralDistrict", returnToExplore: true }),
    chapter5_central_district_enter: createScene({ chapter: "第五章 · 中央城区", speaker: "", text: "", background: B.city, exploreOnly: true,
      flags: ["chapter5_central_district_entered"], objective: "穿过街道，前往中央广场和广播塔" }),
    chapter5_central_resident_01: createScene({ chapter: "第五章 · 中央城区", speaker: "居民", text: "巨人为什么会出现在这里？！", background: B.city, next: "chapter5_central_resident_reiner" }),
    chapter5_central_resident_02: createScene({ chapter: "第五章 · 中央城区", speaker: "居民", text: "城墙不是还好好的吗？！", background: B.city, next: "chapter5_central_resident_reiner" }),
    chapter5_central_resident_reiner: createScene({ chapter: "第五章 · 中央城区", speaker: "莱纳", text: "……", background: B.city, returnToExplore: true }),
    chapter5_guardian_intro_01: createScene({ chapter: "第五章 · 守门者", speaker: "旁白", text: "抵达广场时，地面开始震动。一只十五米级异常无垢巨人挡在通往广播塔的道路中央。", background: B.crisis, effect: "titan-encounter", audio: ["titanRoar"], next: "chapter5_guardian_intro_02" }),
    chapter5_guardian_intro_02: createScene({ chapter: "第五章 · 守门者", speaker: "韩吉", text: "前面！", background: B.crisis, next: "chapter5_guardian_intro_03" }),
    chapter5_guardian_intro_03: createScene({ chapter: "第五章 · 守门者", speaker: "韩吉", text: "这不是偶然跑进来的。", background: B.crisis, next: "chapter5_guardian_intro_04" }),
    chapter5_guardian_intro_04: createScene({ chapter: "第五章 · 守门者", speaker: "莱纳", text: "我知道。", background: B.crisis, next: "chapter5_guardian_memory" }),
    chapter5_guardian_memory: createScene({ chapter: "第五章 · 守门者", speaker: "记忆", text: "G-17。木床。投放口。", background: B.crisis, effect: "memory-flash", next: "chapter5_guardian_intro_05" }),
    chapter5_guardian_intro_05: createScene({ chapter: "第五章 · 守门者", speaker: "莱纳", text: "它以前也是人。", background: B.crisis, next: "chapter5_guardian_intro_06" }),
    chapter5_guardian_intro_06: createScene({ chapter: "第五章 · 守门者", speaker: "韩吉", text: "莱纳。", background: B.crisis, next: "chapter5_guardian_intro_07" }),
    chapter5_guardian_intro_07: createScene({ chapter: "第五章 · 守门者", speaker: "莱纳", text: "我没事。开始吧。", background: B.crisis, next: "chapter5_guardian_boss" }),
    chapter5_guardian_boss: createScene({ chapter: "第五章 · 守门者", speaker: "系统", text: "利用立体机动装置躲避攻击、击破架势；必要时按 R 巨人化，最后接近后颈完成QTE。", background: B.crisis, autoStartMinigame: true, minigame: {
      type: "guardianBoss", resultKey: "guardianBoss", scope: "central_district_guardian", label: "开始守门者Boss战",
      successFlags: ["chapter5_guardian_battle_complete"], onSuccess: "chapter5_guardian_final_01", onFailure: "chapter5_guardian_retry", onUnavailable: "chapter5_guardian_placeholder"
    } }),
    chapter5_guardian_retry: createScene({ chapter: "第五章 · 守门者", speaker: "韩吉", text: "别急着攻击后颈！先破坏它的平衡！", background: B.crisis, choices: [
      { id: "retry_guardian", text: "重新挑战", next: "chapter5_guardian_boss" }
    ] }),
    chapter5_guardian_placeholder: createScene({ chapter: "第五章 · 守门者", speaker: "旁白", text: "莱纳避开横扫、踩踏与抓取，在巨人硬直时连续斩击双腿。守门者失去平衡，跪倒在广场中央。", background: B.crisis,
      flags: ["chapter5_guardian_battle_complete"], next: "chapter5_guardian_final_01" }),
    chapter5_guardian_final_01: createScene({ chapter: "第五章 · 守门者", speaker: "旁白", text: "守门者只剩最后的力量。莱纳看向它，陌生普通人的脸在白光中一闪而过。", background: B.crisis, effect: "memory-flash", next: "chapter5_guardian_final_02" }),
    chapter5_guardian_final_02: createScene({ chapter: "第五章 · 守门者", speaker: "记忆", text: "对象确认。开始净化。", background: B.crisis, next: "chapter5_guardian_final_03" }),
    chapter5_guardian_final_03: createScene({ chapter: "第五章 · 守门者", speaker: "韩吉", text: "莱纳！", background: B.crisis, next: "chapter5_guardian_final_04" }),
    chapter5_guardian_final_04: createScene({ chapter: "第五章 · 守门者", speaker: "莱纳", text: "我知道。它不是怪物。至少……以前不是。", background: B.crisis, next: "chapter5_guardian_final_strike" }),
    chapter5_guardian_final_strike: createScene({ chapter: "第五章 · 守门者", speaker: "系统", text: "【完成最后一击】", background: B.crisis, effect: "collapse", autoAdvance: 900, next: "chapter5_guardian_after_01" }),
    chapter5_guardian_after_01: createScene({ chapter: "第五章 · 守门者", speaker: "旁白", text: "守门者倒地。白色蒸汽从巨大的身体上升起。", background: B.crisis, next: "chapter5_guardian_after_02" }),
    chapter5_guardian_after_02: createScene({ chapter: "第五章 · 守门者", speaker: "韩吉", text: "结束了。怎么了？", background: B.crisis, next: "chapter5_guardian_after_03" }),
    chapter5_guardian_after_03: createScene({ chapter: "第五章 · 守门者", speaker: "莱纳", text: "第一章的时候，我看到巨人倒下，只觉得任务完成了。", background: B.crisis, next: "chapter5_guardian_after_04" }),
    chapter5_guardian_after_04: createScene({ chapter: "第五章 · 守门者", speaker: "莱纳", text: "现在我知道。它曾经也有名字。", background: B.crisis, next: "chapter5_guardian_after_05" }),
    chapter5_guardian_after_05: createScene({ chapter: "第五章 · 守门者", speaker: "莱纳", text: "走吧。还有人等着听真相。", background: B.crisis, next: "chapter5_guardian_complete" }),
    chapter5_guardian_complete: createScene({ chapter: "第五章 · 守门者", speaker: "系统", text: "【Boss战完成】\n通往广播塔的道路已经打开。", background: B.city,
      flags: ["chapter5_guardian_defeated"], objective: "进入中央城区广播塔", returnToExplore: true }),
    chapter5_broadcast_tower_01: createScene({ chapter: "第五章 · 广播塔", speaker: "旁白", text: "韩吉把档案放在广播设备前。", background: B.city, next: "chapter5_broadcast_tower_02" }),
    chapter5_broadcast_tower_02: createScene({ chapter: "第五章 · 广播塔", speaker: "韩吉", text: "准备好了？", background: B.city, next: "chapter5_broadcast_tower_03" }),
    chapter5_broadcast_tower_03: createScene({ chapter: "第五章 · 广播塔", speaker: "莱纳", text: "嗯。", background: B.city, next: "chapter5_broadcast_hange_01" }),
    chapter5_broadcast_hange_01: createScene({ chapter: "第五章 · 广播塔", speaker: "广播中的韩吉", text: "这里是调查兵团。接下来公布的内容，全部来自巨壁教和王政内部档案。", background: B.city, next: "chapter5_broadcast_evidence" }),
    chapter5_broadcast_evidence: createScene({ chapter: "第五章 · 广播塔", speaker: "系统", text: "地下街失踪名单。\n第七码头运输记录。\nG-17记录。\n生物隔离带文件。", background: B.city, next: "chapter5_broadcast_hange_02" }),
    chapter5_broadcast_hange_02: createScene({ chapter: "第五章 · 广播塔", speaker: "广播中的韩吉", text: "所谓失踪人口，实际上被秘密送往巨壁教设施。", background: B.city, next: "chapter5_broadcast_hange_03" }),
    chapter5_broadcast_hange_03: createScene({ chapter: "第五章 · 广播塔", speaker: "广播中的韩吉", text: "所谓净化，实际上是将普通人变成无垢巨人。", background: B.city, next: "chapter5_broadcast_reiner_01" }),
    chapter5_broadcast_reiner_01: createScene({ chapter: "第五章 · 广播塔", speaker: "莱纳", text: "我是莱纳·布朗。", background: B.city, next: "chapter5_broadcast_reiner_02" }),
    chapter5_broadcast_reiner_02: createScene({ chapter: "第五章 · 广播塔", speaker: "莱纳", text: "845年，玛利亚之墙是我撞开的。", background: B.city, next: "chapter5_broadcast_reiner_03" }),
    chapter5_broadcast_reiner_03: createScene({ chapter: "第五章 · 广播塔", speaker: "莱纳", text: "我不会逃避这件事。", background: B.city, next: "chapter5_broadcast_reiner_04" }),
    chapter5_broadcast_reiner_04: createScene({ chapter: "第五章 · 广播塔", speaker: "莱纳", text: "但我们当时不是为了让巨人进来。我们想打开一条路，让那些想离开高墙的人出去。", background: B.city, next: "chapter5_broadcast_reiner_05" }),
    chapter5_broadcast_reiner_05: createScene({ chapter: "第五章 · 广播塔", speaker: "莱纳", text: "真正把巨人引进城里的，是巨壁教和王政。", background: B.city, next: "chapter5_broadcast_reiner_06" }),
    chapter5_broadcast_reiner_06: createScene({ chapter: "第五章 · 广播塔", speaker: "莱纳", text: "墙外不是地狱。", background: B.city, next: "chapter5_broadcast_reiner_07" }),
    chapter5_broadcast_reiner_07: createScene({ chapter: "第五章 · 广播塔", speaker: "莱纳", text: "真正把我们关在这里的，一直都是人。", background: B.city, flags: ["chapter5_broadcast_complete", "broadcastComplete"], next: "ending_good_01" }),

    /* 秩序路线 */
    chapter5_order_01: createScene({ chapter: "第五章 · 秩序路线", speaker: "旁白", text: "巨壁教使者主动来到调查兵团总部。", background: B.training, flags: ["chapter5_order_contacted"], next: "chapter5_order_02" }),
    chapter5_order_02: createScene({ chapter: "第五章 · 秩序路线", speaker: "巨壁教祭司", text: "你已经知道所有真相。", background: B.training, next: "chapter5_order_03" }),
    chapter5_order_03: createScene({ chapter: "第五章 · 秩序路线", speaker: "莱纳", text: "所以呢？", background: B.training, next: "chapter5_order_04" }),
    chapter5_order_04: createScene({ chapter: "第五章 · 秩序路线", speaker: "巨壁教祭司", text: "所以你更应该理解，为什么这些真相不能现在公开。", background: B.training, next: "chapter5_order_05" }),
    chapter5_order_05: createScene({ chapter: "第五章 · 秩序路线", speaker: "莱纳", text: "因为你们害怕失去权力？", background: B.training, next: "chapter5_order_06" }),
    chapter5_order_06: createScene({ chapter: "第五章 · 秩序路线", speaker: "巨壁教祭司", text: "因为你已经见过一次失控的结果。845年。", background: B.training, next: "chapter5_order_07" }),
    chapter5_order_07: createScene({ chapter: "第五章 · 秩序路线", speaker: "巨壁教祭司", text: "你打开城门的时候，也相信自己是在给人自由。最后呢？", background: B.training, next: "chapter5_order_08" }),
    chapter5_order_08: createScene({ chapter: "第五章 · 秩序路线", speaker: "莱纳", text: "……", background: B.training, next: "chapter5_order_09" }),
    chapter5_order_09: createScene({ chapter: "第五章 · 秩序路线", speaker: "巨壁教祭司", text: "墙很残酷。但秩序有时候本来就很残酷。", background: B.training, next: "chapter5_order_demand" }),
    chapter5_order_demand: createScene({ chapter: "第五章 · 秩序路线", speaker: "系统", text: "巨壁教要求：销毁全部证据。", background: B.training, next: "chapter5_order_hq_01" }),
    chapter5_order_hq_01: createScene({ chapter: "第五章 · 秩序路线", speaker: "韩吉", text: "他们想让你做什么？", background: B.training, next: "chapter5_order_hq_02" }),
    chapter5_order_hq_02: createScene({ chapter: "第五章 · 秩序路线", speaker: "莱纳", text: "销毁档案。", background: B.training, next: "chapter5_order_hq_03" }),
    chapter5_order_hq_03: createScene({ chapter: "第五章 · 秩序路线", speaker: "韩吉", text: "你准备答应？", background: B.training, next: "chapter5_order_hq_04" }),
    chapter5_order_hq_04: createScene({ chapter: "第五章 · 秩序路线", speaker: "莱纳", text: "如果现在公开，整个墙内都可能陷入混乱。", background: B.training, next: "chapter5_order_hq_05" }),
    chapter5_order_hq_05: createScene({ chapter: "第五章 · 秩序路线", speaker: "韩吉", text: "845年不是自由造成的。是他们造成的。", background: B.training, next: "chapter5_order_choice" }),
    chapter5_order_choice: createScene({ chapter: "第五章 · 秩序路线", speaker: "莱纳", text: "档案就在我手里。", background: B.training, choices: [
      { id: "destroy_all_archives", text: "销毁全部档案", flags: ["destroyedArchives"], next: "ending_bad_01" },
      { id: "secretly_keep_archives", text: "秘密保留档案", flags: ["chapter5_archives_retained"], next: "ending_normal_01" }
    ] }),

    /* 真相路线 */
    chapter5_truth_01: createScene({ chapter: "第五章 · 真相路线", speaker: "莱纳", text: "现在公开档案还不够。", background: B.training, next: "chapter5_truth_02" }),
    chapter5_truth_02: createScene({ chapter: "第五章 · 真相路线", speaker: "韩吉", text: "始祖？", background: B.training, next: "chapter5_truth_03" }),
    chapter5_truth_03: createScene({ chapter: "第五章 · 真相路线", speaker: "莱纳", text: "嗯。只要他们还能制造巨人，只要他们还能控制巨人，845年随时可能再发生一次。", background: B.training, next: "chapter5_truth_04" }),
    chapter5_truth_04: createScene({ chapter: "第五章 · 真相路线", speaker: "旁白", text: "韩吉拿出第三章获得的《群体诱导实验记录》。", background: B.training, next: "chapter5_truth_05" }),
    chapter5_truth_05: createScene({ chapter: "第五章 · 真相路线", speaker: "韩吉", text: "文件里提到一个地下中央设施。", background: B.training, next: "chapter5_truth_task" }),
    chapter5_truth_task: createScene({ chapter: "第五章 · 真相路线", speaker: "系统", text: "【主线任务】\n前往地下中央设施。", background: B.crisis,
      objective: "前往地下中央设施，终止巨人制造与控制体系", targetMap: "centralFacility", returnToExplore: true }),
    chapter5_central_facility_enter: createScene({ chapter: "第五章 · 地下中央设施", speaker: "", text: "", background: B.crisis, exploreOnly: true,
      flags: ["chapter5_central_facility_entered", "enteredCore"], objective: "调查G-17库存和净化名单" }),
    chapter5_truth_g17_01: createScene({ chapter: "第五章 · 地下中央设施", speaker: "莱纳", text: "这么多……", background: B.crisis, next: "chapter5_truth_g17_02" }),
    chapter5_truth_g17_02: createScene({ chapter: "第五章 · 地下中央设施", speaker: "韩吉", text: "如果没有被发现，下一批巨人很快就会出现。", background: B.crisis, next: "chapter5_truth_g17_destroy" }),
    chapter5_truth_g17_destroy: createScene({ chapter: "第五章 · 地下中央设施", speaker: "系统", text: "【摧毁G-17库存】", background: B.crisis,
      flags: ["chapter5_g17_stock_destroyed"], evidence: ["destroyed_g17_stock"], returnToExplore: true }),
    chapter5_truth_list_01: createScene({ chapter: "第五章 · 地下中央设施", speaker: "系统", text: "净化名单包括：地下街居民、反对教会者、调查兵团相关人员。", background: B.crisis, next: "chapter5_truth_list_02" }),
    chapter5_truth_list_02: createScene({ chapter: "第五章 · 地下中央设施", speaker: "莱纳", text: "他们从来没有打算停。", background: B.crisis,
      flags: ["chapter5_purification_list_found"], evidence: ["final_purification_list"], returnToExplore: true }),
    chapter5_truth_device_01: createScene({ chapter: "第五章 · 地下中央设施", speaker: "韩吉", text: "就是这里。", background: B.crisis, next: "chapter5_truth_device_02" }),
    chapter5_truth_device_02: createScene({ chapter: "第五章 · 地下中央设施", speaker: "莱纳", text: "845年，他们就是靠这个控制巨人的。", background: B.crisis, next: "chapter5_truth_device_03" }),
    chapter5_truth_device_03: createScene({ chapter: "第五章 · 地下中央设施", speaker: "莱纳", text: "如果它能让巨人进入城里……也许也能让它们离开。", background: B.crisis, next: "chapter5_truth_qte" }),
    chapter5_truth_qte: createScene({ chapter: "第五章 · 地下中央设施", speaker: "系统", text: "在下一次巨人指令发出前，完成控制节点QTE。", background: B.crisis, minigame: {
      type: "founderControlQte", resultKey: "founderControl", scope: "founder_control_device", label: "启动最终QTE",
      successFlags: ["chapter5_founder_control_completed"], onSuccess: "chapter5_truth_success_01", onFailure: "chapter5_truth_retry", onUnavailable: "chapter5_truth_placeholder"
    } }),
    chapter5_truth_retry: createScene({ chapter: "第五章 · 地下中央设施", speaker: "韩吉", text: "控制节点正在重新连接。还有一次机会！", background: B.crisis, choices: [
      { id: "retry_founder_control", text: "重新尝试", next: "chapter5_truth_qte" }
    ] }),
    chapter5_truth_placeholder: createScene({ chapter: "第五章 · 地下中央设施", speaker: "旁白", text: "莱纳依次切断控制节点，在下一道指令发出前反转了装置的方向。", background: B.crisis,
      flags: ["chapter5_founder_control_completed"], next: "chapter5_truth_success_01" }),
    chapter5_truth_success_01: createScene({ chapter: "第五章 · 地下中央设施", speaker: "系统", text: "墙外的无垢巨人逐渐停止移动，随后集体转向远离高墙的方向。", background: B.field, next: "chapter5_truth_success_02" }),
    chapter5_truth_success_02: createScene({ chapter: "第五章 · 地下中央设施", speaker: "莱纳", text: "走吧。", background: B.field, next: "chapter5_truth_success_03" }),
    chapter5_truth_success_03: createScene({ chapter: "第五章 · 地下中央设施", speaker: "莱纳", text: "这一次，别再回来。", background: B.field, next: "chapter5_truth_success_04" }),
    chapter5_truth_success_04: createScene({ chapter: "第五章 · 地下中央设施", speaker: "系统", text: "【始祖控制装置已摧毁】\n【G-17库存已摧毁】\n【巨人制造体系永久停止】", background: B.crisis,
      flags: ["chapter5_founder_device_destroyed", "chapter5_titan_system_ended", "qteSucceeded"], evidence: ["founder_device_destroyed"], next: "ending_hidden_01" }),

    /* Bad Ending · 神权的走狗 */
    ending_bad_01: createScene({ endingPresentation: "bad", chapter: "Bad Ending · 神权的走狗", speaker: "系统", text: "第七维护站事件被列为最高机密。调查兵团停止相关调查。地下街仍然有人继续失踪。", background: B.city, achievement: "ending_bad", next: "ending_bad_02" }),
    ending_bad_02: createScene({ chapter: "Bad Ending · 神权的走狗", speaker: "旁白", text: "街道上，巨壁教的布道仍在继续。", background: B.street, next: "ending_bad_03" }),
    ending_bad_03: createScene({ chapter: "Bad Ending · 神权的走狗", speaker: "巨壁教祭司", text: "墙，是神留给人类最后的慈悲。", background: B.street, next: "ending_bad_04" }),
    ending_bad_04: createScene({ chapter: "Bad Ending · 神权的走狗", speaker: "孩子", text: "墙外只有死亡。", background: B.street, next: "ending_bad_05" }),
    ending_bad_05: createScene({ chapter: "Bad Ending · 神权的走狗", speaker: "莱纳", text: "我告诉自己。至少他们还活着。", background: B.street, next: "ending_bad_06" }),
    ending_bad_06: createScene({ chapter: "Bad Ending · 神权的走狗", speaker: "莱纳", text: "后来我已经不知道，这句话究竟是谁教给我的。", background: B.street,
      flags: ["chapter5_bad_ending", "chapter5_complete"], ending: "bad" }),

    /* Normal Ending · 沉默者 */
    ending_normal_01: createScene({ endingPresentation: "normal", chapter: "Normal Ending · 沉默者", speaker: "系统", text: "莱纳向巨壁教交出了大部分证据，但留下了一份完整副本。", background: B.city, achievement: "ending_normal", next: "ending_normal_02" }),
    ending_normal_02: createScene({ chapter: "Normal Ending · 沉默者", speaker: "旁白", text: "真相没有消失。只是再次回到了黑暗中。", background: B.city,
      flags: ["chapter5_normal_ending", "chapter5_complete"], ending: "normal" }),

    /* Good Ending · 破晓的黎明 */
    ending_good_01: createScene({ endingPresentation: "good", chapter: "Good Ending · 破晓的黎明", speaker: "系统", text: "巨壁教档案开始在城区传播。越来越多失踪者家属认出了名单上的名字。王政内部开始出现分裂。调查兵团公开站在真相一方。", background: B.crisis, achievement: "ending_good", next: "ending_good_02" }),
    ending_good_02: createScene({ chapter: "Good Ending · 破晓的黎明", speaker: "旁白", text: "玛利亚之墙的城门再次被打开。这一次，不是为了发动一次秘密行动，而是正式允许民众离开高墙。", background: B.gate, next: "ending_good_03" }),
    ending_good_03: createScene({ chapter: "Good Ending · 破晓的黎明", speaker: "旁白", text: "一些第一次离开高墙的人站在海边。一个孩子蹲下来，伸手碰了碰海水。", background: B.field, next: "ending_good_04" }),
    ending_good_04: createScene({ chapter: "Good Ending · 破晓的黎明", speaker: "孩子", text: "是咸的！", background: B.field, next: "ending_good_05" }),
    ending_good_05: createScene({ chapter: "Good Ending · 破晓的黎明", speaker: "旁白", text: "有人笑，有人哭。莱纳站在人群后面，手里拿着卡尔的十字架。", background: B.field, next: "ending_good_06" }),
    ending_good_06: createScene({ chapter: "Good Ending · 破晓的黎明", speaker: "过去的卡尔", text: "等门打开以后……我要带她去看海。", background: B.field, next: "ending_good_07" }),
    ending_good_07: createScene({ chapter: "Good Ending · 破晓的黎明", speaker: "莱纳", text: "卡尔。", background: B.field, next: "ending_good_08" }),
    ending_good_08: createScene({ chapter: "Good Ending · 破晓的黎明", speaker: "莱纳", text: "这一次。门真的打开了。", background: B.field,
      flags: ["chapter5_good_ending", "chapter5_complete"], ending: "good" }),

    /* Hidden Ending · 自由的诅咒 */
    ending_hidden_01: createScene({ endingPresentation: "hidden", chapter: "Hidden Ending · 自由的诅咒", speaker: "系统", text: "巨壁教秘密被公开。王政体系瓦解。人类开始真正走出高墙。", background: B.field, achievement: "ending_hidden", next: "ending_hidden_02" }),
    ending_hidden_02: createScene({ chapter: "Hidden Ending · 自由的诅咒", speaker: "旁白", text: "海边的浪潮越过沙滩。随后，画面沉入黑暗。", background: B.field, next: "ending_hidden_03" }),
    ending_hidden_03: createScene({ chapter: "Hidden Ending · 自由的诅咒", speaker: "系统", text: "十二年后", background: B.crisis, effect: "chapter-card", next: "ending_hidden_04" }),
    ending_hidden_04: createScene({ chapter: "Hidden Ending · 自由的诅咒", speaker: "旁白", text: "战壕、炮火、新的国旗和新的军队占据了曾经陌生的土地。", background: B.crisis, next: "ending_hidden_05" }),
    ending_hidden_05: createScene({ chapter: "Hidden Ending · 自由的诅咒", speaker: "年轻士兵", text: "长官。你真的见过以前那三道高墙？", background: B.crisis, next: "ending_hidden_06" }),
    ending_hidden_06: createScene({ chapter: "Hidden Ending · 自由的诅咒", speaker: "年迈的莱纳", text: "见过。", background: B.crisis, next: "ending_hidden_07" }),
    ending_hidden_07: createScene({ chapter: "Hidden Ending · 自由的诅咒", speaker: "年轻士兵", text: "你们为了走出去，死了那么多人。值得吗？", background: B.crisis, next: "ending_hidden_08" }),
    ending_hidden_08: createScene({ chapter: "Hidden Ending · 自由的诅咒", speaker: "年迈的莱纳", text: "我们花了一生，走出那堵墙。", background: B.crisis, next: "ending_hidden_09" }),
    ending_hidden_09: createScene({ chapter: "Hidden Ending · 自由的诅咒", speaker: "年迈的莱纳", text: "后来才发现……", background: B.crisis, next: "ending_hidden_10" }),
    ending_hidden_10: createScene({ chapter: "Hidden Ending · 自由的诅咒", speaker: "年迈的莱纳", text: "真正的墙，从来不在那里。", background: B.crisis,
      flags: ["chapter5_hidden_ending", "chapter5_complete"], ending: "hidden" })
  };

  window.TitanStory = Object.freeze({
    startScene: START_SCENE, chapters: Object.freeze(chapters), scenes: Object.freeze(scenes),
    chapter2CoreClues: chapter2CoreClues, getChapter2MissingClues: getChapter2MissingClues,
    getChapter2Objective: getChapter2Objective
  });
}());
