/* 隐藏结局演出，不定义或更改前置条件。 */
window.TitanEndingScripts=window.TitanEndingScripts||{};
window.TitanEndingScripts.hidden={
  "title": "自由的诅咒",
  "subtitle": "先让他们说吧。",
  "note": "《没有空席》：进入隐藏结局后的听证厅演出。严格保留单地图、三个查看点、卡尔母亲留座、韩吉交材料、暂不宣布结论、他人不同回应、莱纳坐下接受听证。不添加免责结论或触发条件。",
  "scenes": [
    {
      "kind": "exploration",
      "speaker": "",
      "text": "没有空席 · 旧学校听证厅",
      "backdrop": "black",
      "hold": 6500
    }
  ],
  "epilogue": {
    "variant": "hearing-20261010",
    "title": "旧学校听证厅 · 没有空席",
    "background": "images/maps/ending-hidden-hearing-school.png",
    "dialogueBackground": "images/maps/ending-hidden-hearing-school.png",
    "finalImage": "images/maps/ending-hidden-hearing-school.png",
    "width": 1672,
    "height": 941,
    "spawn": {
      "x": 810,
      "y": 725
    },
    "departure": {
      "x": 812,
      "y": 595,
      "endY": 600
    },
    "purposeId": "reiner-seat",
    "requiredIds": [
      "evidence",
      "witness-seats",
      "reiner-seat"
    ],
    "objective": "听证开始前，看看证据桌与双方的座位。",
    "afterObjective": "准备好后，与听证员交谈。可以继续停留。",
    "exitLabel": "开始听证",
    "stayLabel": "再停留一会",
    "intro": [
      {
        "speaker": "",
        "text": "矛盾被公开核实后，一场听证会即将开始。\n莱纳提前来到会场。",
        "mapView": true,
        "minHold": 2000
      },
      {
        "speaker": "",
        "text": "旧学校被改成了听证厅。\n桌子两侧摆着椅子，有几张姓名牌前面还没有人。",
        "mapView": true
      }
    ],
    "beforeExit": [
      {
        "speaker": "听证员",
        "text": "还有一点时间。\n你可以先看看桌上的材料和座位。",
        "mapView": true
      }
    ],
    "points": [
      {
        "id": "evidence",
        "name": "证据桌",
        "prompt": "查看并排的材料",
        "x": 374,
        "y": 607,
        "dialogue": [
          {
            "speaker": "",
            "text": "运输记录、档案和证词并排摆放。",
            "mapView": true
          },
          {
            "speaker": "",
            "text": "彼此对不上的地方没有被删掉。\n核实过的内容与仍需追问的地方，都留在这里。",
            "mapView": true
          }
        ],
        "repeat": [
          {
            "speaker": "",
            "text": "几份材料各自保留着原来的日期。\n不同的笔迹没有被誊成一份整齐的结论。",
            "mapView": true
          }
        ]
      },
      {
        "id": "witness-seats",
        "name": "证人席",
        "prompt": "查看证人姓名牌",
        "x": 1252,
        "y": 387,
        "dialogue": [
          {
            "speaker": "",
            "text": "每张椅子都放着姓名牌。\n有几张注明：“去向未明”。",
            "mapView": true,
            "minHold": 2000
          },
          {
            "speaker": "",
            "text": "这些位置没有被撤走。",
            "mapView": true
          }
        ],
        "repeat": [
          {
            "speaker": "",
            "text": "“去向未明”。\n姓名牌仍在，椅子仍在。",
            "mapView": true
          }
        ]
      },
      {
        "id": "reiner-seat",
        "name": "莱纳的座位",
        "prompt": "查看自己的座位",
        "x": 812,
        "y": 588,
        "dialogue": [
          {
            "speaker": "",
            "text": "莱纳的名字放在证人席。",
            "mapView": true
          },
          {
            "speaker": "",
            "text": "没有英雄称号，也没有事先写好的免责结论。",
            "mapView": true,
            "minHold": 2000
          }
        ],
        "repeat": [
          {
            "speaker": "",
            "text": "姓名牌上只有他的名字。",
            "mapView": true
          }
        ]
      },
      {
        "id": "officer",
        "type": "exit",
        "name": "听证员",
        "prompt": "与听证员交谈",
        "x": 1100,
        "y": 438,
        "sprite": "images/explore/npc/civilian_a.png",
        "dialogue": [
          {
            "speaker": "听证员",
            "text": "准备好了吗？",
            "mapView": true
          }
        ],
        "repeat": [
          {
            "speaker": "听证员",
            "text": "还有一点时间。",
            "mapView": true
          }
        ]
      }
    ],
    "residents": [
      {
        "x": 566,
        "y": 397,
        "sprite": "images/explore/npc/karl_mother.png"
      },
      {
        "x": 431,
        "y": 583,
        "sprite": "images/explore/npc/hange.png"
      }
    ],
    "collisions": [
      {
        "x": 0,
        "y": 0,
        "width": 1672,
        "height": 265
      },
      {
        "x": 400,
        "y": 278,
        "width": 912,
        "height": 110
      },
      {
        "x": 0,
        "y": 265,
        "width": 120,
        "height": 430
      },
      {
        "x": 1430,
        "y": 265,
        "width": 242,
        "height": 430
      },
      {
        "x": 90,
        "y": 447,
        "width": 250,
        "height": 208
      },
      {
        "x": 776,
        "y": 422,
        "width": 163,
        "height": 155
      },
      {
        "x": 0,
        "y": 705,
        "width": 643,
        "height": 236
      },
      {
        "x": 1088,
        "y": 705,
        "width": 584,
        "height": 236
      }
    ],
    "preHearing": [
      {
        "speaker": "",
        "text": "卡尔的母亲正在摆放椅子。\n莱纳伸手帮忙。",
        "mapView": true
      },
      {
        "speaker": "卡尔的母亲",
        "text": "那张留着。他不能来，不代表这里没有他的位置。",
        "mapView": true,
        "minHold": 2600
      },
      {
        "speaker": "",
        "text": "韩吉把一份核对完成的材料交给莱纳。",
        "mapView": true
      },
      {
        "speaker": "韩吉",
        "text": "这些能证明你后来做过什么。\n不能替你回答以前的事。",
        "mapView": true,
        "minHold": 2800
      }
    ],
    "closing": [
      {
        "speaker": "",
        "text": "听证员过来，问是否可以宣布调查结论。",
        "mapView": true
      },
      {
        "speaker": "",
        "text": "莱纳看着那些无人入座的姓名牌。",
        "mapView": true
      },
      {
        "speaker": "莱纳",
        "text": "先让他们说吧。",
        "mapView": true,
        "minHold": 2200
      },
      {
        "speaker": "",
        "text": "人们陆续进来。\n一个获救者向莱纳点头，另一个看见他，换到了更远的座位。",
        "mapView": true,
        "cinematicView": true,
        "stage": "arrivals",
        "sound": "chairs",
        "minHold": 4000
      },
      {
        "speaker": "听证员",
        "text": "莱纳。",
        "mapView": true,
        "stage": "called",
        "minHold": 2200
      },
      {
        "speaker": "",
        "text": "他坐下，将自己的证词放在桌上。\n对面的椅子有人坐，也有人一直空着。",
        "mapView": true,
        "stage": "seated",
        "sound": "chair",
        "minHold": 3500
      }
    ]
  }
};
