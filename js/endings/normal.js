/* 沉默者 · 雪线上的灯。这里只定义结局触发后的演出。 */
window.TitanEndingScripts=window.TitanEndingScripts||{};
window.TitanEndingScripts.normal={
  "title": "沉默者",
  "subtitle": "灯还亮着。有人仍在赶来的路上。",
  "note": "《雪线上的灯》：山路撤离，入冬抵达旧驿站，自由走访医护角落、瞭望台、临时教室与通信桌，点亮三盏引路灯。无倒计时；点灯只推进尾声，不更改主线选择或结局判定。玩家主动回到驿站，收好证据，深夜开门接纳迟来的撤离者，随后进入原有共同片尾。",
  "scenes": [
    {
      "kind": "narration",
      "speaker": "",
      "text": "撤离队翻过山口时，城区的灯已经看不见了。\n有人需要搀扶，有人每走一段路，就回头望一眼。",
      "backdrop": "city",
      "hold": 8000,
      "image": "images/bg/ending-normal-mountain-road.png"
    },
    {
      "kind": "narration",
      "speaker": "",
      "text": "路边停着一辆被遗弃的运送马车。\n车里没有人，只剩下绳索与一只鞋。",
      "backdrop": "city",
      "hold": 7500,
      "image": "images/bg/ending-normal-mountain-road.png"
    },
    {
      "kind": "narration",
      "speaker": "",
      "text": "莱纳蹲下，拨开鞋底的泥。\n山路向下延伸，最后消失在树林里。",
      "backdrop": "city",
      "hold": 6500,
      "image": "images/bg/ending-normal-mountain-road.png"
    },
    {
      "kind": "dialogue",
      "speaker": "莱纳",
      "text": "附近可能还有人。",
      "backdrop": "city",
      "hold": 4500,
      "image": "images/bg/ending-normal-mountain-road.png"
    },
    {
      "kind": "narration",
      "speaker": "",
      "text": "身后，一名伤员扶着车轮，试了两次，也没能站起来。",
      "backdrop": "city",
      "hold": 6000,
      "image": "images/bg/ending-normal-mountain-road.png"
    },
    {
      "kind": "dialogue",
      "speaker": "利威尔",
      "text": "你可以记住这里。\n现在，先把活着的人带过去。",
      "backdrop": "city",
      "hold": 7500,
      "image": "images/bg/ending-normal-mountain-road.png"
    },
    {
      "kind": "narration",
      "speaker": "",
      "text": "莱纳把位置记进材料，折好那一页。\n他回到队伍里，扶起了伤员。",
      "backdrop": "city",
      "hold": 7500,
      "image": "images/bg/ending-normal-mountain-road.png"
    },
    {
      "kind": "monologue",
      "speaker": "",
      "text": "这条路，我会记着。",
      "backdrop": "city",
      "hold": 5000,
      "image": "images/bg/ending-normal-mountain-road.png"
    },
    {
      "kind": "card",
      "speaker": "",
      "text": "入冬",
      "backdrop": "black",
      "hold": 4000
    },
    {
      "kind": "exploration",
      "speaker": "",
      "text": "雪线上的灯 · 山口避难站",
      "backdrop": "black",
      "hold": 6500
    }
  ],
  "epilogue": {
    "variant": "snow-20261009",
    "title": "雪线上的灯",
    "background": "images/maps/ending-normal-snow-refuge.png",
    "dialogueBackground": "images/bg/ending-normal-refuge-room.png",
    "finalImage": "images/bg/ending-normal-open-door.png",
    "width": 1672,
    "height": 941,
    "spawn": {
      "x": 868,
      "y": 786
    },
    "departure": {
      "x": 920,
      "y": 270,
      "endY": 270
    },
    "purposeId": "lamp-ridge",
    "requiredIds": [
      "lamp-trail",
      "lamp-courtyard",
      "lamp-ridge"
    ],
    "exitLabel": "回驿站，结束今天的走访",
    "stayLabel": "再在山口停留一会儿",
    "objective": "天黑前，点亮三盏引路灯。也可以先在避难站走走。",
    "afterObjective": "三盏灯已经点亮。可以继续停留，准备好后回到驿站。",
    "intro": [
      {
        "speaker": "",
        "text": "入冬，旧驿站成了山口的避难站。\n窗户里有火光，屋檐下挂着晾不干的衣服。",
        "background": "images/bg/ending-normal-refuge-room.png"
      },
      {
        "speaker": "利威尔",
        "text": "沿路的三盏灯还没点。\n有人可能赶不上天黑前到这里。",
        "background": "images/bg/ending-normal-refuge-room.png"
      },
      {
        "speaker": "",
        "text": "莱纳接过引火盒。\n这里的人已经有了住处。墙内的失踪公告，却还在增加。",
        "background": "images/bg/ending-normal-refuge-room.png"
      },
      {
        "speaker": "",
        "text": "先在这里走走。天黑前，把路上的灯点起来。",
        "mapView": true
      }
    ],
    "beforeExit": [
      {
        "speaker": "利威尔",
        "text": "还有灯没点。\n晚到的人得靠它们认路。",
        "background": "images/bg/ending-normal-refuge-room.png"
      },
      {
        "speaker": "",
        "text": "先沿路把三盏灯点亮。这里不会催你离开。",
        "background": "images/bg/ending-normal-refuge-room.png"
      }
    ],
    "points": [
      {
        "id": "medic",
        "name": "医疗兵",
        "prompt": "看看伤员的情况",
        "x": 588,
        "y": 275,
        "sprite": "images/explore/npc/medic.png",
        "dialogue": [
          {
            "speaker": "医疗兵",
            "text": "他的腿能落地了。\n走远一点还是会疼，不过已经不用别人扶着。",
            "background": "images/bg/ending-normal-refuge-room.png"
          },
          {
            "speaker": "",
            "text": "床边有人把鞋穿好，又脱下来。\n门外落雪的声音很轻，走廊里的脚步声却让他抬起了头。",
            "background": "images/bg/ending-normal-refuge-room.png"
          },
          {
            "speaker": "幸存者",
            "text": "我知道这里没有他们。\n有时候，身体比我先想起来。",
            "background": "images/bg/ending-normal-refuge-room.png"
          },
          {
            "speaker": "",
            "text": "莱纳把水杯放到他够得着的地方。没有催他继续说。",
            "background": "images/bg/ending-normal-refuge-room.png"
          }
        ],
        "repeat": [
          {
            "speaker": "医疗兵",
            "text": "热水在炉子旁。\n你自己也喝一点。",
            "background": "images/bg/ending-normal-refuge-room.png"
          }
        ]
      },
      {
        "id": "lookout",
        "name": "山口瞭望台",
        "prompt": "望向墙内的方向",
        "x": 1420,
        "y": 337,
        "dialogue": [
          {
            "speaker": "",
            "text": "云层下面有一段很淡的城墙。\n从这里看不清城区，也听不到那里的钟声。",
            "mapView": true
          },
          {
            "speaker": "",
            "text": "地图上，莱纳圈出的马车位置仍然留着。\n这一页没有因为撤离而被撕掉。",
            "mapView": true
          },
          {
            "speaker": "",
            "text": "我救下了眼前的人。\n今天没能阻止的事，还在发生。",
            "mapView": true
          }
        ],
        "repeat": [
          {
            "speaker": "",
            "text": "雪一点点盖住来时的脚印。\n远处的城墙还在那里。",
            "mapView": true
          }
        ]
      },
      {
        "id": "school",
        "name": "临时教室",
        "prompt": "看看孩子们的名字",
        "x": 1250,
        "y": 303,
        "dialogue": [
          {
            "speaker": "",
            "text": "长凳不够，两个孩子共用一块木板。\n他们正在学着写自己的名字。",
            "background": "images/bg/ending-normal-refuge-room.png"
          },
          {
            "speaker": "",
            "text": "一个孩子把最后一笔描了三遍。\n写完后，他把那块木板举起来，等着有人看见。",
            "background": "images/bg/ending-normal-refuge-room.png"
          },
          {
            "speaker": "",
            "text": "莱纳蹲下来。\n名字写得歪斜，却能认出来。",
            "background": "images/bg/ending-normal-refuge-room.png"
          },
          {
            "speaker": "莱纳",
            "text": "我看到了。",
            "background": "images/bg/ending-normal-refuge-room.png"
          }
        ],
        "repeat": [
          {
            "speaker": "",
            "text": "木板靠在窗边。\n一个名字旁边，又多了一个。",
            "background": "images/bg/ending-normal-refuge-room.png"
          }
        ]
      },
      {
        "id": "letters",
        "name": "通信桌",
        "prompt": "查看寄往墙内的信",
        "x": 780,
        "y": 302,
        "dialogue": [
          {
            "speaker": "",
            "text": "几封信原封退回。\n收件人的名字还在，信封上的印记却说查无此人。",
            "background": "images/bg/ending-normal-refuge-room.png"
          },
          {
            "speaker": "韩吉",
            "text": "另一个接应点还没有答复。\n我会继续核对手里的记录。",
            "background": "images/bg/ending-normal-refuge-room.png"
          },
          {
            "speaker": "",
            "text": "韩吉没有写下一次行动的日期。\n莱纳把退回的信按地址重新排好，没有把它们丢进炉火。",
            "background": "images/bg/ending-normal-refuge-room.png"
          }
        ],
        "repeat": [
          {
            "speaker": "",
            "text": "纸上的地址没有变。\n等有人能再走一趟时，这些信还要带回去。",
            "background": "images/bg/ending-normal-refuge-room.png"
          }
        ]
      },
      {
        "id": "survivor",
        "name": "幸存者",
        "prompt": "与幸存者交谈",
        "x": 1056,
        "y": 520,
        "sprite": "images/explore/npc/civilian_a.png",
        "dialogue": [
          {
            "speaker": "幸存者",
            "text": "刚下雪的时候，我妹妹跑到门口看了半天。\n她说，今年终于有地方把手烘暖了。",
            "background": "images/bg/ending-normal-refuge-room.png"
          },
          {
            "speaker": "",
            "text": "他把一条围巾搭在臂弯里。\n说起妹妹时，嘴角抬了一下。",
            "background": "images/bg/ending-normal-refuge-room.png"
          },
          {
            "speaker": "幸存者",
            "text": "我想给家里捎个信。\n不是报平安……我想告诉他们，我还在。",
            "background": "images/bg/ending-normal-refuge-room.png"
          },
          {
            "speaker": "莱纳",
            "text": "地址还在。\n有机会，我会带回去。",
            "background": "images/bg/ending-normal-refuge-room.png"
          }
        ],
        "repeat": [
          {
            "speaker": "幸存者",
            "text": "你要去点灯吗？\n山口那边风大，灯罩记得扣紧。",
            "background": "images/bg/ending-normal-refuge-room.png"
          }
        ]
      },
      {
        "id": "lamp-trail",
        "type": "lamp",
        "name": "山道引路灯",
        "prompt": "点亮山道引路灯",
        "x": 310,
        "y": 674,
        "light": {
          "x": 355,
          "y": 610
        },
        "dialogue": [
          {
            "speaker": "",
            "text": "莱纳拢住火苗，等灯芯慢慢亮起来。\n雪地上的路，终于能看见一小段了。",
            "mapView": true
          }
        ],
        "repeat": [
          {
            "speaker": "",
            "text": "第一盏灯亮着。\n风吹过灯罩，火苗没有熄灭。",
            "mapView": true
          }
        ]
      },
      {
        "id": "lamp-courtyard",
        "type": "lamp",
        "name": "庭院引路灯",
        "prompt": "点亮庭院引路灯",
        "x": 494,
        "y": 367,
        "light": {
          "x": 531,
          "y": 352
        },
        "dialogue": [
          {
            "speaker": "",
            "text": "第二盏灯亮起来时，驿站门前的人抬头看了一眼。\n沿着两点暖光，能认出进山的方向。",
            "mapView": true
          }
        ],
        "repeat": [
          {
            "speaker": "",
            "text": "灯罩上落了一层薄雪。\n里面的光仍然透出来。",
            "mapView": true
          }
        ]
      },
      {
        "id": "lamp-ridge",
        "type": "lamp",
        "name": "山口引路灯",
        "prompt": "点亮山口引路灯",
        "x": 1360,
        "y": 312,
        "light": {
          "x": 1404,
          "y": 307
        },
        "dialogue": [
          {
            "speaker": "",
            "text": "山口的老人把灯罩扶稳。\n风很冷，莱纳划亮了最后一根火柴。",
            "mapView": true
          },
          {
            "speaker": "老人",
            "text": "点着灯，他们就能回来吗？",
            "mapView": true
          },
          {
            "speaker": "莱纳",
            "text": "不一定。",
            "mapView": true
          },
          {
            "speaker": "",
            "text": "老人把灯罩递给他。",
            "mapView": true
          },
          {
            "speaker": "老人",
            "text": "那也点上。",
            "mapView": true
          },
          {
            "speaker": "",
            "text": "莱纳扣好灯罩。\n光落在雪上，没有照到很远。",
            "mapView": true
          }
        ],
        "repeat": [
          {
            "speaker": "老人",
            "text": "灯还亮着。\n我再在这儿坐一会儿。",
            "mapView": true
          }
        ]
      },
      {
        "id": "inn",
        "type": "exit",
        "name": "驿站",
        "prompt": "回到驿站",
        "x": 920,
        "y": 268,
        "dialogue": [
          {
            "speaker": "利威尔",
            "text": "灯都亮了。\n热水还在炉子上。",
            "background": "images/bg/ending-normal-refuge-room.png"
          },
          {
            "speaker": "",
            "text": "门内有说话声，也有人已经睡了。\n可以再留一会儿，等准备好，再结束今天的走访。",
            "background": "images/bg/ending-normal-refuge-room.png"
          }
        ],
        "repeat": [
          {
            "speaker": "",
            "text": "三盏灯仍在山口亮着。\n这里没有催促离开的钟声。",
            "background": "images/bg/ending-normal-refuge-room.png"
          }
        ]
      }
    ],
    "residents": [
      {
        "x": 893,
        "y": 317,
        "sprite": "images/explore/npc/levi.png"
      },
      {
        "x": 1308,
        "y": 369,
        "sprite": "images/explore/npc/oldwoman.png"
      }
    ],
    "collisions": [
      {
        "x": 0,
        "y": 0,
        "width": 1672,
        "height": 180
      },
      {
        "x": 590,
        "y": 180,
        "width": 488,
        "height": 82
      },
      {
        "x": 1100,
        "y": 180,
        "width": 207,
        "height": 98
      },
      {
        "x": 0,
        "y": 180,
        "width": 195,
        "height": 500
      },
      {
        "x": 1515,
        "y": 180,
        "width": 157,
        "height": 761
      },
      {
        "x": 881,
        "y": 378,
        "width": 139,
        "height": 61
      },
      {
        "x": 640,
        "y": 426,
        "width": 153,
        "height": 68
      },
      {
        "x": 1157,
        "y": 425,
        "width": 70,
        "height": 102
      },
      {
        "x": 0,
        "y": 820,
        "width": 767,
        "height": 121
      },
      {
        "x": 1025,
        "y": 820,
        "width": 647,
        "height": 121
      }
    ],
    "closing": [
      {
        "speaker": "",
        "text": "莱纳把证据箱放进柜子。\n那些地址、证词和来时的标记，都留在里面。",
        "background": "images/bg/ending-normal-refuge-room.png"
      },
      {
        "speaker": "",
        "text": "锁扣合上。\n钥匙被收进贴身的口袋。",
        "background": "images/bg/ending-normal-refuge-room.png"
      },
      {
        "speaker": "",
        "text": "深夜。",
        "background": "black"
      },
      {
        "speaker": "",
        "text": "炉火低了下去。\n门外，传来敲门声。",
        "background": "images/bg/ending-normal-refuge-room.png",
        "sound": "knock",
        "minHold": 3200
      },
      {
        "speaker": "",
        "text": "莱纳起身开门。\n门槛外，站着两名迟来的撤离者。",
        "background": "images/bg/ending-normal-open-door.png",
        "minHold": 2400
      },
      {
        "speaker": "来人",
        "text": "里面还有位置吗？",
        "background": "images/bg/ending-normal-open-door.png"
      },
      {
        "speaker": "",
        "text": "莱纳侧身让开。\n灯光落在雪地上。",
        "background": "images/bg/ending-normal-open-door.png",
        "cinematicView": true,
        "minHold": 2500
      }
    ]
  }
};
