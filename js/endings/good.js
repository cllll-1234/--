/* 海的另一边：保留原好结局开场，数月后海岸探索与共用片尾。
 * 台词、人物位置、海岸碰撞和镜头参数都在 epilogue 内，供后续修改。 */
window.TitanEndingScripts = window.TitanEndingScripts || {};
window.TitanEndingScripts.good = {
  "title": "破晓的黎明",
  "subtitle": "改变已经开始，失去的人不会因此回来。",
  "note": "数月后获准离墙，抵达海岸。按《海的另一边》剧本：穿过崖壁通道看见海，自由走访营地、浅滩与纪念碑，亲手向卡尔的母亲交付记录，最后走向潮水边。走访不计分，母亲不被迫原谅，莱纳仍接受审查。",
  "scenes": [
    {
      "kind": "narration",
      "speaker": "",
      "text": "广播结束后，韩吉没有立刻关掉设备。\n指示灯还亮着。大厅里只剩下机器低低的嗡鸣。",
      "backdrop": "city",
      "hold": 6500
    },
    {
      "kind": "dialogue",
      "speaker": "韩吉",
      "text": "回应已经传回来了。\n有人愿意作证，几个街区也开始帮忙传递材料。",
      "backdrop": "city",
      "hold": 6500
    },
    {
      "kind": "dialogue",
      "speaker": "莱纳",
      "text": "那辆马车呢？",
      "backdrop": "city",
      "hold": 4500
    },
    {
      "kind": "dialogue",
      "speaker": "韩吉",
      "text": "没能把所有人带回来。",
      "backdrop": "city",
      "hold": 5500
    },
    {
      "kind": "narration",
      "speaker": "",
      "text": "莱纳看着摊在桌上的名单。\n他们留住了传播的机会，名单上却有些人再也无法亲口回应。",
      "backdrop": "city",
      "hold": 7500
    },
    {
      "kind": "dialogue",
      "speaker": "韩吉",
      "text": "我当时认为，先让城区知道，就能救更多人。\n这是我的判断。我不能让你一个人承担它。",
      "backdrop": "city",
      "hold": 6500
    },
    {
      "kind": "dialogue",
      "speaker": "莱纳",
      "text": "把我们当时知道什么、做了什么，都写进去。\n也包括845年。",
      "backdrop": "city",
      "hold": 6500
    },
    {
      "kind": "narration",
      "speaker": "",
      "text": "副本和证词被分别保存。调查开始，证据中的疑点也被公开核对。\n教会无法再把所有材料都称为谣言，但争执并没有因此结束。",
      "backdrop": "city",
      "hold": 8500
    },
    {
      "kind": "card",
      "speaker": "",
      "text": "数月后",
      "backdrop": "black",
      "hold": 3500
    },
    {
      "kind": "exploration",
      "speaker": "",
      "text": "海的另一边 · 数月后",
      "backdrop": "black",
      "hold": 6500
    }
  ],
  "epilogue": {
    "variant": "sea-20261009",
    "title": "海的另一边",
    "background": "images/maps/ending-good-coast.png",
    "dialogueBackground": "images/bg/ending-good-sea-dialog.png",
    "finalImage": "images/bg/ending-good-sea-final.png",
    "width": 1672,
    "height": 941,
    "spawn": {
      "x": 225,
      "y": 812
    },
    "entrance": {
      "revealY": 575,
      "zoom": 2.65,
      "hint": "沿岩石通道向前走。",
      "hold": 4200
    },
    "departure": {
      "x": 1168,
      "y": 468,
      "endY": 468
    },
    "purposeId": "mother",
    "exitLabel": "走向潮水边",
    "stayLabel": "再在海岸停留一会",
    "objective": "把一份记录带到海边。可以先在海岸走走。",
    "afterObjective": "记录已经交付。可以继续停留，准备好后走向潮水边。",
    "intro": [
      {
        "speaker": "",
        "text": "第一次获准离墙的调查队，抵达了旧地图的尽头。",
        "background": "black"
      }
    ],
    "beforeExit": [
      {
        "speaker": "",
        "text": "那份补全的记录还在包里，而卡尔的母亲坐在海边。"
      },
      {
        "speaker": "",
        "text": "先把它交到她手里，再决定什么时候走向潮水。"
      }
    ],
    "points": [
      {
        "id": "archive",
        "name": "韩吉",
        "prompt": "与韩吉交谈",
        "x": 658,
        "y": 465,
        "sprite": "images/explore/npc/hange.png",
        "dialogue": [
          {
            "speaker": "",
            "text": "营地的桌上摊着新画的海岸线。韩吉压住被风掀起的纸角，在潮水退去的地方添上一道记号。"
          },
          {
            "speaker": "韩吉",
            "text": "这里的水会升上来，又退下去。刚才露出来的石头，现在已经看不见了。"
          },
          {
            "speaker": "",
            "text": "韩吉说得很快，又转身指向远处。她的眼镜上沾着细小的水珠。"
          },
          {
            "speaker": "韩吉",
            "text": "还要记录潮汐、沿岸的地形……下次我们就不会只带着一张空白的地图过来了。"
          },
          {
            "speaker": "",
            "text": "她翻过一页。下面压着的，仍是那份尚未查完的失踪者名单。"
          },
          {
            "speaker": "莱纳",
            "text": "那剩下的失踪者怎么样了？"
          },
          {
            "speaker": "韩吉",
            "text": "我还在查...今天有人送来了新的证词，但是有几个名字，还是没有下落。"
          },
          {
            "speaker": "韩吉",
            "text": "地图可以继续往外画啊。"
          },
          {
            "speaker": "韩吉",
            "text": "当然，那份名单也得继续往下查。"
          }
        ],
        "repeat": [
          {
            "speaker": "韩吉",
            "text": "潮水又变了。快看啊莱纳，那块石头已经露出来了。"
          },
          {
            "speaker": "",
            "text": "韩吉在地图上写下时间。失踪者名单仍放在她的手边。"
          }
        ]
      },
      {
        "id": "survivor",
        "name": "幸存者",
        "prompt": "陪幸存者走近浅滩",
        "x": 1328,
        "y": 548,
        "sprite": "images/explore/npc/civilian_a.png",
        "afterMove": {
          "x": 1333,
          "y": 521
        },
        "dialogue": [
          {
            "speaker": "",
            "text": "他站在浅滩前。每次浪头靠近，就往后挪一步。"
          },
          {
            "speaker": "幸存者",
            "text": "这么多水……底下会不会突然没有地方站？"
          },
          {
            "speaker": "莱纳",
            "text": "先站在这里吧。等浪过来的时候，我陪你往前走一点。"
          },
          {
            "speaker": "",
            "text": "莱纳在他身旁停下来。两人等着下一道浪线，慢慢靠近被海水浸湿的沙地。"
          },
          {
            "speaker": "",
            "text": "他俯下身，把鞋脱下来，放在干燥的沙上。"
          },
          {
            "speaker": "幸存者",
            "text": "……是凉的。"
          },
          {
            "speaker": "",
            "text": "浪退下去以后，他仍站在那里。没有道谢，也没有再往后退。"
          }
        ],
        "repeat": [
          {
            "speaker": "",
            "text": "浪头还会让他绷紧肩膀。但他已经能赤脚站在浅滩前，等水漫过脚背。"
          }
        ]
      },
      {
        "id": "memorial",
        "name": "纪念碑",
        "prompt": "查看纪念碑上的名字",
        "x": 246,
        "y": 541,
        "sprite": "",
        "range": 110,
        "dialogue": [
          {
            "speaker": "",
            "text": "岩石平台上的碑，朝着海。遇难者的名字一行一行刻在上面。"
          },
          {
            "speaker": "",
            "text": "有些名字后面，补刻了辨认的日期。也有些地方，仍没有足够的证据。"
          },
          {
            "speaker": "",
            "text": "碑的末尾留着一片空白。调查还在继续。"
          },
          {
            "speaker": "",
            "text": "海风吹过石面。莱纳把手里的记录握紧了一些。"
          }
        ],
        "repeat": [
          {
            "speaker": "",
            "text": "名字下方的空白仍留在那里，这份名单还未完成"
          }
        ]
      },
      {
        "id": "mother",
        "name": "卡尔的母亲",
        "prompt": "把补全的记录交给卡尔的母亲",
        "x": 1074,
        "y": 589,
        "sprite": "images/explore/npc/karl-mother-seated.png",
        "range": 125,
        "dialogue": [
          {
            "speaker": "",
            "text": "卡尔的母亲坐在岸边。她跟着调查队来到这里，是因为卡尔生前一直想知道墙外有什么。"
          },
          {
            "speaker": "莱纳啊",
            "text": "这是补全的记录。"
          },
          {
            "speaker": "",
            "text": "她接过纸，慢慢翻到最后一页。风掀起一角，她用手压住。"
          },
          {
            "speaker": "卡尔的母亲",
            "text": "他小时候问过我，墙的外面还有没有墙。"
          },
          {
            "speaker": "卡尔的母亲",
            "text": "我说，我也不知道"
          },
          {
            "speaker": "莱纳",
            "text": "对不起......"
          },
          {
            "speaker": "",
            "text": "她没有回答这句话，只把记录收进包里。"
          },
          {
            "speaker": "卡尔的母亲",
            "text": "起码你把他的名字找回来了。"
          },
          {
            "speaker": "卡尔的母亲",
            "text": "剩下的事还需要时间。"
          },
          {
            "speaker": "",
            "text": "莱纳没有再说什么。她望向海面，布包安静地放在膝上。"
          }
        ],
        "repeat": [
          {
            "speaker": "",
            "text": "她仍坐在岸边。记录已经收好。莱纳在她身旁停了一会，没有请求她再回答什么。"
          }
        ]
      },
      {
        "id": "shore",
        "type": "exit",
        "name": "潮水边",
        "prompt": "走向潮水边",
        "x": 1155,
        "y": 450,
        "sprite": "",
        "range": 110,
        "dialogue": [
          {
            "speaker": "",
            "text": "潮水一次次漫上沙滩，又慢慢退回去。\n可以继续在海岸停留，准备好后再走近。"
          }
        ],
        "repeat": [
          {
            "speaker": "",
            "text": "海岸上还有风声与人声。什么时候走近潮水，由你决定。"
          }
        ]
      }
    ],
    "closing": [
      {
        "speaker": "",
        "text": "莱纳的鞋里进了沙。他抬起脚抖了抖，沙没出来。\n他又把脚放下了。",
        "mapView": true
      },
      {
        "speaker": "",
        "text": "营地里有人喊开饭，喊了两遍。\n他应了一声，才发现自己饿了。",
        "cinematicView": true
      }
    ],
    "residents": [],
    "collisions": [
      {
        "x": 0,
        "y": 0,
        "width": 220,
        "height": 435
      },
      {
        "x": 220,
        "y": 0,
        "width": 210,
        "height": 280
      },
      {
        "x": 430,
        "y": 0,
        "width": 210,
        "height": 310
      },
      {
        "x": 640,
        "y": 0,
        "width": 200,
        "height": 345
      },
      {
        "x": 840,
        "y": 0,
        "width": 200,
        "height": 385
      },
      {
        "x": 1040,
        "y": 0,
        "width": 200,
        "height": 425
      },
      {
        "x": 1240,
        "y": 0,
        "width": 200,
        "height": 476
      },
      {
        "x": 1440,
        "y": 0,
        "width": 232,
        "height": 515
      },
      {
        "x": 0,
        "y": 425,
        "width": 110,
        "height": 516
      },
      {
        "x": 112,
        "y": 700,
        "width": 75,
        "height": 241
      },
      {
        "x": 338,
        "y": 613,
        "width": 215,
        "height": 152
      },
      {
        "x": 362,
        "y": 760,
        "width": 187,
        "height": 181
      },
      {
        "x": 549,
        "y": 795,
        "width": 490,
        "height": 146
      },
      {
        "x": 1039,
        "y": 830,
        "width": 633,
        "height": 111
      },
      {
        "x": 245,
        "y": 363,
        "width": 196,
        "height": 95
      },
      {
        "x": 475,
        "y": 434,
        "width": 157,
        "height": 65
      },
      {
        "x": 213,
        "y": 554,
        "width": 86,
        "height": 50
      },
      {
        "x": 1065,
        "y": 615,
        "width": 108,
        "height": 27
      },
      {
        "x": 1394,
        "y": 625,
        "width": 215,
        "height": 111
      },
      {
        "x": 623,
        "y": 507,
        "width": 66,
        "height": 38
      },
      {
        "x": 930,
        "y": 431,
        "width": 52,
        "height": 25
      },
      {
        "x": 1208,
        "y": 560,
        "width": 50,
        "height": 20
      }
    ]
  }
};
