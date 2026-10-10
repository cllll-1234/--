/* 坏结局演出与可编辑纪念馆配置；入口及前置触发规则保持原样。 */
window.TitanEndingScripts=window.TitanEndingScripts||{};
window.TitanEndingScripts.bad={
  "title": "神权的走狗",
  "subtitle": "我亲眼见到他们被释放。",
  "note": "《借你的声音》：只使用一张由旧设施改建的纪念馆地图。三个展柜、孩子与老师、闭馆确认、画像下重播证词。不修改结局触发规则；不添加新恶行、追逐或二次结局选择。展品真实，删裁与结案形成含义。",
  "scenes": [
    {
      "kind": "exploration",
      "speaker": "",
      "text": "数月后 · 借你的声音",
      "backdrop": "black",
      "hold": 6500
    }
  ],
  "epilogue": {
    "variant": "museum-20261010",
    "title": "纪念馆 · 借你的声音",
    "background": "images/maps/ending-bad-memorial-hall.png",
    "dialogueBackground": "images/maps/ending-bad-memorial-hall.png",
    "finalImage": "images/maps/ending-bad-memorial-hall.png",
    "width": 1672,
    "height": 941,
    "spawn": {
      "x": 800,
      "y": 740
    },
    "departure": {
      "x": 800,
      "y": 740,
      "endY": 800
    },
    "purposeId": "testimony",
    "requiredIds": [
      "relic",
      "records",
      "testimony"
    ],
    "objective": "在闭馆前，看看三个展柜。",
    "afterObjective": "管理员正在等你确认展陈。也可以继续停留。",
    "exitLabel": "确认展陈",
    "stayLabel": "继续参观",
    "intro": [
      {
        "speaker": "",
        "text": "数月后。\n旧设施被改成了纪念馆。",
        "mapView": true,
        "minHold": 1800
      },
      {
        "speaker": "",
        "text": "教会公开承认“个别人员滥用职权”。\n莱纳成为揭露事件的英雄。",
        "mapView": true
      },
      {
        "speaker": "",
        "text": "他的画像挂在大厅正面。\n闭馆前，管理员请他来看看展陈。",
        "mapView": true
      }
    ],
    "beforeExit": [
      {
        "speaker": "管理员",
        "text": "请先看看三个展柜。\n您亲历过这些事，我们希望得到您的确认。",
        "mapView": true
      }
    ],
    "school": [
      {
        "speaker": "孩子",
        "text": "以后还会发生这样的事吗？",
        "mapView": true,
        "minHold": 1500
      },
      {
        "speaker": "",
        "text": "带队老师指着莱纳的照片。",
        "mapView": true
      },
      {
        "speaker": "老师",
        "text": "不会了。有人替我们查清楚了。",
        "mapView": true,
        "minHold": 2200
      }
    ],
    "points": [
      {
        "id": "relic",
        "name": "遗物柜",
        "prompt": "查看遗物柜",
        "x": 418,
        "y": 635,
        "dialogue": [
          {
            "speaker": "",
            "text": "绳索、药瓶，还有受害者留下的衣物。\n玻璃擦得很干净。",
            "mapView": true
          },
          {
            "speaker": "",
            "text": "这些东西都是真的。",
            "mapView": true
          }
        ],
        "repeat": [
          {
            "speaker": "",
            "text": "衣物平整地铺在柜中。\n绳索被摆成了完整的一圈。",
            "mapView": true
          }
        ]
      },
      {
        "id": "records",
        "name": "证据柜",
        "prompt": "查看运输记录",
        "x": 820,
        "y": 635,
        "dialogue": [
          {
            "speaker": "",
            "text": "运输记录也是真的。\n日期、编号、被运走的人数，都能在这里找到。",
            "mapView": true
          },
          {
            "speaker": "",
            "text": "涉及上级命令的那一页没有展出。\n说明写着：“尚无法核实”。",
            "mapView": true,
            "minHold": 2400
          }
        ],
        "repeat": [
          {
            "speaker": "",
            "text": "“尚无法核实”。\n那一页的位置，被说明牌填满了。",
            "mapView": true
          }
        ]
      },
      {
        "id": "testimony",
        "name": "证词柜",
        "prompt": "听取证词录音",
        "x": 1260,
        "y": 635,
        "dialogue": [
          {
            "speaker": "",
            "text": "展柜里的录音开始播放。",
            "mapView": true,
            "sound": "testimony",
            "minHold": 3500
          },
          {
            "speaker": "录音",
            "text": "我亲眼见到他们被释放。",
            "mapView": true,
            "minHold": 1800
          },
          {
            "speaker": "",
            "text": "这是莱纳当时说过的话。",
            "mapView": true
          }
        ],
        "repeat": [
          {
            "speaker": "录音",
            "text": "我亲眼见到他们被释放。",
            "mapView": true,
            "sound": "testimony",
            "minHold": 4200
          }
        ]
      },
      {
        "id": "curator",
        "type": "exit",
        "name": "管理员",
        "prompt": "确认展陈",
        "x": 1235,
        "y": 383,
        "sprite": "images/explore/npc/civilian_b.png",
        "dialogue": [
          {
            "speaker": "管理员",
            "text": "闭馆前，请您确认展陈。",
            "mapView": true
          }
        ],
        "repeat": [
          {
            "speaker": "管理员",
            "text": "我在这里等您。",
            "mapView": true
          }
        ]
      }
    ],
    "residents": [
      {
        "x": 566,
        "y": 680,
        "sprite": "images/explore/npc/civilian_a.png",
        "scale": 0.62
      },
      {
        "x": 615,
        "y": 675,
        "sprite": "images/explore/npc/civilian_b.png"
      }
    ],
    "collisions": [
      {
        "x": 0,
        "y": 0,
        "width": 1672,
        "height": 350
      },
      {
        "x": 0,
        "y": 350,
        "width": 200,
        "height": 300
      },
      {
        "x": 1500,
        "y": 350,
        "width": 172,
        "height": 591
      },
      {
        "x": 280,
        "y": 450,
        "width": 305,
        "height": 180
      },
      {
        "x": 710,
        "y": 455,
        "width": 279,
        "height": 175
      },
      {
        "x": 1115,
        "y": 452,
        "width": 303,
        "height": 178
      },
      {
        "x": 1230,
        "y": 350,
        "width": 190,
        "height": 65
      },
      {
        "x": 0,
        "y": 800,
        "width": 600,
        "height": 141
      },
      {
        "x": 1050,
        "y": 840,
        "width": 622,
        "height": 101
      },
      {
        "x": 25,
        "y": 650,
        "width": 154,
        "height": 130
      }
    ],
    "closing": [
      {
        "speaker": "",
        "text": "闭馆前，管理员请莱纳签名确认展陈。",
        "mapView": true
      },
      {
        "speaker": "",
        "text": "他发现最后一行写着：\n“经幸存者及调查参与者确认，本事件调查结束。”",
        "mapView": true,
        "minHold": 3000
      },
      {
        "speaker": "",
        "text": "笔尖停在纸面上方。\n他迟迟没有落笔。",
        "mapView": true,
        "minHold": 2500
      },
      {
        "speaker": "管理员",
        "text": "您可以继续考虑。孩子们明天还会来。",
        "mapView": true,
        "minHold": 2200
      },
      {
        "speaker": "",
        "text": "最后，莱纳站在自己的巨幅照片下面。",
        "mapView": true,
        "cinematicView": true,
        "minHold": 2200
      },
      {
        "speaker": "",
        "text": "展柜里的录音再次响起。",
        "mapView": true
      },
      {
        "speaker": "录音",
        "text": "我亲眼见到他们被释放。",
        "mapView": true,
        "sound": "testimony",
        "minHold": 4500
      }
    ]
  }
};
