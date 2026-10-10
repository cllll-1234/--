/* 第二章旧教堂：按手动调整的 1280×960 地图布局配置碰撞、交互与占位物件。 */
(function () {
  "use strict";

  const collisions = Object.freeze([
  {
    "id": "church-north-wall",
    "x": 0,
    "y": 0,
    "width": 1280,
    "height": 70,
    "label": "北外墙"
  },
  {
    "id": "church-west-wall",
    "x": 0,
    "y": 70,
    "width": 80,
    "height": 830,
    "label": "西外墙"
  },
  {
    "id": "church-east-wall",
    "x": 1200,
    "y": 70,
    "width": 80,
    "height": 830,
    "label": "东外墙"
  },
  {
    "id": "church-south-west-wall",
    "x": 0,
    "y": 870,
    "width": 560,
    "height": 90,
    "label": "南外墙左段"
  },
  {
    "id": "church-south-east-wall",
    "x": 720,
    "y": 870,
    "width": 560,
    "height": 90,
    "label": "南外墙右段"
  },
  {
    "id": "church-entrance-limit",
    "x": 560,
    "y": 946,
    "width": 160,
    "height": 14,
    "label": "入口边界"
  },
  {
    "id": "church-back-west-wall",
    "x": 400,
    "y": 70,
    "width": 34,
    "height": 262,
    "label": "后室西墙"
  },
  {
    "id": "church-back-east-wall",
    "x": 843,
    "y": 72,
    "width": 45,
    "height": 269,
    "label": "后室东墙"
  },
  {
    "id": "church-back-south-west",
    "x": 400,
    "y": 282,
    "width": 171,
    "height": 44,
    "label": "后室隔墙左段"
  },
  {
    "id": "church-back-south-east",
    "x": 704,
    "y": 284,
    "width": 168,
    "height": 43,
    "label": "后室隔墙右段"
  },
  {
    "id": "church-storage-shelf",
    "x": 112,
    "y": 308,
    "width": 95,
    "height": 250,
    "label": "储物架"
  },
  {
    "id": "church-storage-crates",
    "x": 241,
    "y": 384,
    "width": 94,
    "height": 95,
    "label": "镇静剂木箱"
  },
  {
    "id": "church-altar",
    "x": 930,
    "y": 340,
    "width": 160,
    "height": 110,
    "label": "祭坛"
  },
  {
    "id": "church-cabinet",
    "x": 1124,
    "y": 330,
    "width": 65,
    "height": 125,
    "label": "祭坛旁暗柜"
  },
  {
    "id": "church-bed",
    "x": 502,
    "y": 131,
    "width": 183,
    "height": 72,
    "label": "木床"
  },
  {
    "id": "church-sink",
    "x": 758,
    "y": 141,
    "width": 48,
    "height": 56,
    "label": "洗手盆"
  },
  {
    "id": "church-pew-left-north",
    "x": 355,
    "y": 557,
    "width": 170,
    "height": 80,
    "label": "左前长椅"
  },
  {
    "id": "church-pew-right-north",
    "x": 755,
    "y": 557,
    "width": 170,
    "height": 80,
    "label": "右前长椅"
  },
  {
    "id": "church-pew-left-south",
    "x": 355,
    "y": 692,
    "width": 170,
    "height": 80,
    "label": "左后长椅"
  },
  {
    "id": "church-pew-right-south",
    "x": 755,
    "y": 692,
    "width": 170,
    "height": 80,
    "label": "右后长椅"
  },
  {
    "id": "custom-mu85hvfn",
    "label": "自定义障碍",
    "x": 84,
    "y": 75,
    "width": 314,
    "height": 84
  },
  {
    "id": "custom-mu85mk2j",
    "label": "自定义障碍",
    "x": 766,
    "y": 58,
    "width": 54,
    "height": 55
  },
  {
    "id": "custom-mu85n0zf",
    "label": "自定义障碍",
    "x": 771,
    "y": 204,
    "width": 72,
    "height": 72
  },
  {
    "id": "custom-mu85p21f",
    "label": "自定义障碍",
    "x": 438,
    "y": 72,
    "width": 57,
    "height": 37
  },
  {
    "id": "custom-mu85qe3b",
    "label": "自定义障碍",
    "x": 514,
    "y": 199,
    "width": 29,
    "height": 31
  },
  {
    "id": "custom-mu85v4gw",
    "label": "自定义障碍",
    "x": 895,
    "y": 76,
    "width": 302,
    "height": 199
  }
]);
  const interactionZones = Object.freeze([
  {
    "id": "church_exit",
    "type": "exit",
    "action": "startDialog",
    "name": "旧教堂出口",
    "x": 600,
    "y": 884,
    "width": 80,
    "height": 36,
    "interactionDistance": 70,
    "prompt": "[E] 返回地下街",
    "targetScene": "chapter2_church_exit_need_clues",
    "dialogByFlag": [
      {
        "allFlags": [
          "churchInvestigationComplete",
          "churchExitSummarySeen"
        ],
        "scene": "chapter2_church_exit_repeat"
      },
      {
        "allFlags": [
          "churchDragMarksFound",
          "churchSedativesFound",
          "churchG17Found"
        ],
        "scene": "chapter2_church_exit_01"
      }
    ]
  },
  {
    "id": "church_bench",
    "type": "inspect",
    "action": "startDialog",
    "name": "破旧长椅",
    "x": 414,
    "y": 715,
    "width": 50,
    "height": 34,
    "interactionDistance": 75,
    "prompt": "[E] 调查",
    "targetScene": "chapter2_church_bench"
  },
  {
    "id": "church_recent_tracks",
    "type": "inspect",
    "action": "startDialog",
    "name": "较新的拖痕和脚印",
    "x": 660,
    "y": 560,
    "width": 52,
    "height": 34,
    "interactionDistance": 65,
    "prompt": "[E] 调查",
    "targetScene": "chapter2_church_tracks_01",
    "dialogByFlag": [
      {
        "allFlags": [
          "churchDragMarksFound"
        ],
        "scene": "chapter2_church_tracks_repeat"
      }
    ]
  },
  {
    "id": "church_emblem",
    "type": "inspect",
    "action": "startDialog",
    "name": "巨壁教徽记",
    "x": 1000,
    "y": 217,
    "width": 80,
    "height": 50,
    "interactionDistance": 70,
    "prompt": "[E] 调查",
    "targetScene": "chapter2_church_emblem_01",
    "dialogByFlag": [
      {
        "allFlags": [
          "churchEmblemChecked",
          "churchG17Found"
        ],
        "scene": "chapter2_church_emblem_link"
      },
      {
        "allFlags": [
          "churchEmblemChecked"
        ],
        "scene": "chapter2_church_emblem_repeat"
      }
    ]
  },
  {
    "id": "church_g17_vial",
    "type": "inspect",
    "action": "startDialog",
    "name": "祭坛旁暗柜与G-17药瓶",
    "x": 1132,
    "y": 370,
    "width": 50,
    "height": 44,
    "interactionDistance": 75,
    "prompt": "[E] 调查",
    "targetScene": "chapter2_church_cabinet_01",
    "dialogByFlag": [
      {
        "allFlags": [
          "churchG17Found"
        ],
        "scene": "chapter2_church_cabinet_repeat"
      }
    ]
  },
  {
    "id": "church_sedative_crate",
    "type": "inspect",
    "action": "startDialog",
    "name": "镇静剂木箱",
    "x": 272,
    "y": 386,
    "width": 54,
    "height": 50,
    "interactionDistance": 75,
    "prompt": "[E] 调查",
    "targetScene": "chapter2_church_sedatives_01",
    "dialogByFlag": [
      {
        "allFlags": [
          "churchSedativesFound"
        ],
        "scene": "chapter2_church_sedatives_repeat"
      }
    ]
  },
  {
    "id": "church_bed_straps",
    "type": "inspect",
    "action": "startDialog",
    "name": "木床与束缚带",
    "x": 556,
    "y": 163,
    "width": 54,
    "height": 36,
    "interactionDistance": 100,
    "prompt": "[E] 调查",
    "targetScene": "chapter2_church_bed_01",
    "dialogByFlag": [
      {
        "allFlags": [
          "churchTreatmentBedChecked"
        ],
        "scene": "chapter2_church_bed_repeat"
      }
    ]
  },
  {
    "id": "church_hidden_sun",
    "type": "inspect",
    "action": "startDialog",
    "name": "侧墙上被覆盖的旧刻痕",
    "x": 78,
    "y": 708,
    "width": 18,
    "height": 40,
    "interactionDistance": 60,
    "prompt": "[E] 调查",
    "targetScene": "chapter2_church_sun",
    "dialogByFlag": [
      {
        "allFlags": [
          "churchDawnMarkFound"
        ],
        "scene": "chapter2_church_sun_repeat"
      }
    ]
  },
  {
    "id": "church_medical_cloth",
    "type": "inspect",
    "action": "startDialog",
    "name": "医疗布",
    "x": 225,
    "y": 517,
    "width": 31,
    "height": 26,
    "interactionDistance": 40,
    "prompt": "[E] 调查",
    "targetScene": "chapter2_church_cloth_01",
    "dialogByFlag": [
      {
        "allFlags": [
          "churchMedicalClothChecked"
        ],
        "scene": "chapter2_church_cloth_repeat"
      }
    ]
  },
  {
    "id": "church_rope",
    "type": "inspect",
    "action": "startDialog",
    "name": "绳索",
    "x": 295,
    "y": 517,
    "width": 54,
    "height": 30,
    "interactionDistance": 40,
    "prompt": "[E] 调查",
    "targetScene": "chapter2_church_rope_01"
  },
  {
    "id": "church_altar",
    "type": "inspect",
    "action": "startDialog",
    "name": "祭坛",
    "x": 976,
    "y": 381,
    "width": 36,
    "height": 35,
    "interactionDistance": 85,
    "prompt": "[E] 调查",
    "targetScene": "chapter2_church_altar_01",
    "dialogByFlag": [
      {
        "allFlags": [
          "churchAltarChecked",
          "churchSedativesFound"
        ],
        "scene": "chapter2_church_altar_link_01"
      },
      {
        "allFlags": [
          "churchAltarChecked"
        ],
        "scene": "chapter2_church_altar_repeat"
      }
    ]
  },
  {
    "id": "church_sink",
    "type": "inspect",
    "action": "startDialog",
    "name": "洗手盆",
    "x": 751,
    "y": 170,
    "width": 40,
    "height": 44,
    "interactionDistance": 60,
    "prompt": "[E] 调查",
    "targetScene": "chapter2_church_sink_01",
    "dialogByFlag": [
      {
        "allFlags": [
          "churchSinkChecked",
          "churchG17Found"
        ],
        "scene": "chapter2_church_sink_link_01"
      },
      {
        "allFlags": [
          "churchSinkChecked"
        ],
        "scene": "chapter2_church_sink_repeat"
      }
    ]
  },
  {
    "id": "church_old_vials",
    "type": "inspect",
    "action": "startDialog",
    "name": "旧药瓶",
    "x": 748,
    "y": 74,
    "width": 35,
    "height": 32,
    "interactionDistance": 40,
    "prompt": "[E] 调查",
    "targetScene": "chapter2_church_old_vials_01"
  },
  {
    "id": "church_burned_paper",
    "type": "inspect",
    "action": "startDialog",
    "name": "烧毁的纸片",
    "x": 195,
    "y": 298,
    "width": 50,
    "height": 30,
    "interactionDistance": 45,
    "prompt": "[E] 调查",
    "targetScene": "chapter2_church_paper_01",
    "dialogByFlag": [
      {
        "allFlags": [
          "churchTransferPaperFound"
        ],
        "scene": "chapter2_church_paper_repeat"
      }
    ]
  }
]);
  const decorations = Object.freeze([
  {
    "id": "church-floor-back",
    "type": "church-zone-back",
    "name": "后侧小房间",
    "symbol": "后侧小房间",
    "x": 426,
    "y": 70,
    "width": 428,
    "height": 260
  },
  {
    "id": "church-floor-storage",
    "type": "church-zone-storage",
    "name": "储物区",
    "symbol": "储物区",
    "x": 90,
    "y": 350,
    "width": 325,
    "height": 520
  },
  {
    "id": "church-floor-altar",
    "type": "church-zone-altar",
    "name": "祭坛区",
    "symbol": "祭坛区",
    "x": 880,
    "y": 350,
    "width": 310,
    "height": 520
  },
  {
    "id": "church-floor-nave",
    "type": "church-zone-nave",
    "name": "祈祷区",
    "symbol": "祈祷区 / 中央通道",
    "x": 425,
    "y": 375,
    "width": 430,
    "height": 515
  },
  {
    "id": "church-north-wall-visual",
    "type": "church-wall",
    "name": "北外墙",
    "symbol": "北外墙",
    "x": 0,
    "y": 0,
    "width": 1280,
    "height": 70
  },
  {
    "id": "church-west-wall-visual",
    "type": "church-wall",
    "name": "西外墙",
    "symbol": "西外墙",
    "x": 0,
    "y": 70,
    "width": 80,
    "height": 830
  },
  {
    "id": "church-east-wall-visual",
    "type": "church-wall",
    "name": "东外墙",
    "symbol": "东外墙",
    "x": 1200,
    "y": 70,
    "width": 80,
    "height": 830
  },
  {
    "id": "church-south-west-wall-visual",
    "type": "church-wall",
    "name": "南外墙左段",
    "symbol": "南外墙左段",
    "x": 0,
    "y": 870,
    "width": 560,
    "height": 90
  },
  {
    "id": "church-south-east-wall-visual",
    "type": "church-wall",
    "name": "南外墙右段",
    "symbol": "南外墙右段",
    "x": 720,
    "y": 870,
    "width": 560,
    "height": 90
  },
  {
    "id": "church-entrance-limit-visual",
    "type": "church-wall",
    "name": "入口边界",
    "symbol": "入口边界",
    "x": 560,
    "y": 946,
    "width": 160,
    "height": 14
  },
  {
    "id": "church-back-west-wall-visual",
    "type": "church-wall",
    "name": "后室西墙",
    "symbol": "后室西墙",
    "x": 400,
    "y": 70,
    "width": 26,
    "height": 286
  },
  {
    "id": "church-back-east-wall-visual",
    "type": "church-wall",
    "name": "后室东墙",
    "symbol": "后室东墙",
    "x": 854,
    "y": 70,
    "width": 26,
    "height": 286
  },
  {
    "id": "church-back-south-west-visual",
    "type": "church-wall",
    "name": "后室隔墙左段",
    "symbol": "后室隔墙左段",
    "x": 400,
    "y": 282,
    "width": 185,
    "height": 48
  },
  {
    "id": "church-back-south-east-visual",
    "type": "church-wall",
    "name": "后室隔墙右段",
    "symbol": "后室隔墙右段",
    "x": 695,
    "y": 282,
    "width": 185,
    "height": 48
  },
  {
    "id": "church-storage-shelf-visual",
    "type": "church-shelf",
    "name": "储物架",
    "symbol": "储物架",
    "x": 112,
    "y": 308,
    "width": 95,
    "height": 250
  },
  {
    "id": "church-storage-crates-visual",
    "type": "church-crate",
    "name": "镇静剂木箱",
    "symbol": "镇静剂木箱",
    "x": 267,
    "y": 370,
    "width": 121,
    "height": 110
  },
  {
    "id": "church-altar-visual",
    "type": "church-altar",
    "name": "祭坛",
    "symbol": "祭坛",
    "x": 930,
    "y": 340,
    "width": 160,
    "height": 110
  },
  {
    "id": "church-cabinet-visual",
    "type": "church-cabinet",
    "name": "祭坛旁暗柜",
    "symbol": "祭坛旁暗柜",
    "x": 1124,
    "y": 330,
    "width": 65,
    "height": 125
  },
  {
    "id": "church-bed-visual",
    "type": "church-bed",
    "name": "木床",
    "symbol": "木床",
    "x": 490,
    "y": 145,
    "width": 185,
    "height": 75
  },
  {
    "id": "church-sink-visual",
    "type": "church-sink",
    "name": "洗手盆",
    "symbol": "洗手盆",
    "x": 745,
    "y": 145,
    "width": 82,
    "height": 75
  },
  {
    "id": "church-pew-left-north-visual",
    "type": "church-pew",
    "name": "左前长椅",
    "symbol": "左前长椅",
    "x": 355,
    "y": 557,
    "width": 170,
    "height": 80
  },
  {
    "id": "church-pew-right-north-visual",
    "type": "church-pew",
    "name": "右前长椅",
    "symbol": "右前长椅",
    "x": 755,
    "y": 557,
    "width": 170,
    "height": 80
  },
  {
    "id": "church-pew-left-south-visual",
    "type": "church-pew",
    "name": "左后长椅",
    "symbol": "左后长椅",
    "x": 355,
    "y": 692,
    "width": 170,
    "height": 80
  },
  {
    "id": "church-pew-right-south-visual",
    "type": "church-pew",
    "name": "右后长椅",
    "symbol": "右后长椅",
    "x": 755,
    "y": 692,
    "width": 170,
    "height": 80
  },
  {
    "id": "church-medical-cloth",
    "type": "church-small",
    "name": "医疗布",
    "symbol": "医疗布",
    "x": 210,
    "y": 495,
    "width": 60,
    "height": 30
  },
  {
    "id": "church-rope",
    "type": "church-small",
    "name": "绳索",
    "symbol": "绳索",
    "x": 293,
    "y": 555,
    "width": 54,
    "height": 30
  },
  {
    "id": "church-old-vials",
    "type": "church-small",
    "name": "旧药瓶",
    "symbol": "旧药瓶",
    "x": 722,
    "y": 70,
    "width": 40,
    "height": 30
  },
  {
    "id": "church-burned-paper",
    "type": "church-small",
    "name": "烧毁的纸片",
    "symbol": "残纸",
    "x": 195,
    "y": 298,
    "width": 50,
    "height": 30
  },
  {
    "id": "church-emblem-visual",
    "type": "church-emblem",
    "name": "巨壁教徽记",
    "symbol": "巨壁教",
    "x": 1010,
    "y": 185,
    "width": 80,
    "height": 50
  },
  {
    "id": "church-tracks-visual",
    "type": "church-tracks",
    "name": "新拖痕",
    "symbol": "〰 〰",
    "x": 660,
    "y": 560,
    "width": 52,
    "height": 34
  },
  {
    "id": "church-vial-visual",
    "type": "church-vial",
    "name": "G-17",
    "symbol": "G-17",
    "x": 1132,
    "y": 370,
    "width": 50,
    "height": 44
  },
  {
    "id": "church-exit-visual",
    "type": "church-exit",
    "name": "地下街出口",
    "symbol": "出口 ↓",
    "x": 600,
    "y": 884,
    "width": 80,
    "height": 36
  }
]);

  window.TitanOldChurch = Object.freeze({
    mapId: "oldChurch",
    referenceWidth: 1280,
    referenceHeight: 960,
    spawn: Object.freeze({
  "x": 618,
  "y": 790
}),
    collisions: collisions,
    interactionZones: interactionZones,
    decorations: decorations
  });
}());
