# 街道布道场景素材接口

当前版本在素材缺失时使用纯色地图、NPC 字符占位和文字闪回。下列文件加入后可逐步替换占位表现。

| 素材名称 | 用途 | 建议尺寸 | 透明 | 格式 | 文件名 | 存放目录 | 画面内容建议 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 街道布道地图 | Explore 地图背景 | 1280×720 | 否 | WebP | `street_sermon.webp` | `images/maps/` | 墙内石板街道、两侧民居、中央简易布道台、右侧通往集合点；俯视 RPG 视角 |
| 普通民众 A | 祈祷 NPC | 128×128 | 是 | PNG | `civilian_a.png` | `images/explore/npc/` | 朴素墙内居民，双手合拢祈祷，脚底居中 |
| 普通民众 B | 祈祷 NPC | 128×128 | 是 | PNG | `civilian_b.png` | `images/explore/npc/` | 与 A 的服装和轮廓有明显区别，面向祭司 |
| 老妇人 | 提醒玩家的 NPC | 128×128 | 是 | PNG | `oldwoman.png` | `images/explore/npc/` | 年长墙内居民，深色披肩，略微佝偻，脚底居中 |
| 街道路人 | 余震对白 NPC | 128×128 | 是 | PNG | `passerby.png` | `images/explore/npc/` | 普通成年居民，神情担忧，不与主要角色撞脸 |
| 巨壁教祭司对话立绘 | 布道 Galgame 对话 | 1024×1536 | 是 | PNG | `priest_normal.png` | `images/characters/` | 膝盖以上，深灰与暗红祭司长袍，平静而有压迫感 |
| 莱纳异常立绘 | 闪回后的 Galgame 对话 | 1024×1536 | 是 | PNG | `reiner_trauma.png` | `images/characters/` | 与正常莱纳同服装和比例，失焦、冷汗、痛苦克制 |
| 被按住的人 | 闪回碎片 1 | 1920×1080 | 否 | WebP | `flash_restrained.webp` | `images/flashback/` | 手臂和肩背局部被数只手按住，不展示完整身份 |
| 注射器记忆 | 闪回碎片 2 | 1920×1080 | 否 | WebP | `flash_syringe.webp` | `images/flashback/` | 极近景针筒推进，暗红低照度，不展示完整受害者 |
| 祭司袖袍记忆 | 闪回碎片 3 | 1920×1080 | 否 | WebP | `flash_priest_hand.webp` | `images/flashback/` | 穿祭司袖袍的手和戒指局部，不展示祭司全貌 |
| 高墙铁门记忆 | 闪回碎片 4 | 1920×1080 | 否 | WebP | `flash_gate.webp` | `images/flashback/` | 高墙下沉重铁门开启，强风卷入 |
| 哭泣孩子记忆 | 闪回碎片 5 | 1920×1080 | 否 | WebP | `flash_child.webp` | `images/flashback/` | 逆光孩子剪影，避免清晰身份信息 |
| 墙下巨吼记忆 | 闪回碎片 6 | 1920×1080 | 否 | WebP | `flash_titan_roar.webp` | `images/flashback/` | 近乎黑屏，仅保留墙下巨大轮廓和震动感 |
| 心跳音效 | 闪回开始 | 不适用 | 不适用 | MP3 | `heartbeat.mp3` | `audio/sfx/` | 低沉、逐渐加速、可无缝循环，约 6–10 秒 |
| 耳鸣音效 | 闪回开始 | 不适用 | 不适用 | MP3 | `tinnitus.mp3` | `audio/sfx/` | 短促高频耳鸣，约 2–4 秒 |
| 风声音效 | 铁门片段 | 不适用 | 不适用 | MP3 | `wind.mp3` | `audio/sfx/` | 突然增强的穿堂风，约 3–6 秒 |
| 教堂钟声音效 | 布道或转场 | 不适用 | 不适用 | MP3 | `church_bell.mp3` | `audio/sfx/` | 单次沉重钟声，尾音自然衰减 |

## 音频安全开关

音频路径已登记在 `js/explore/scene-effects.js`。当前文件不存在，因此默认不加载。素材加入后，在初始化代码中调用：

```js
TitanSceneEffects.enableAudio("heartbeat");
TitanSceneEffects.enableAudio("tinnitus");
TitanSceneEffects.enableAudio("wind");
TitanSceneEffects.enableAudio("churchBell");
```

启用前应确认对应文件真实存在，避免浏览器产生 404 请求。
