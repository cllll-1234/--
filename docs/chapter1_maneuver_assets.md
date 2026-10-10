# 第一章立体机动剧情素材清单

新版旧城区正式地图已接入 `images/maps/oldtown.png`。地图中的儿童涂鸦和升起太阳图案直接使用背景画面，不再叠加额外图片。

| 素材 | 用途 | 建议尺寸 | 透明 | 格式与文件名 | 存放目录 | 建议 AI 生成 |
|---|---|---:|---|---|---|---|
| 玛利亚旧城区正式地图 | 第一章探索与 Galgame 背景 | 1672×941 | 否 | `oldtown.png` | `images/maps/` | 已提供 |
| 倒下的巨人 | 小游戏完成后动态生成 | 约 512×320 | 是 | `fallen_titan.png` | `images/explore/objects/` | 待提供 |
| 统一升起太阳标志 | 后续需要独立显示时使用 | 1024×1024 | 是 | `dawn_symbol.png` | `images/symbols/` | 待提供 |
| 太阳十字架正面 | 发现证物时的近景叠图 | 1024×1024 | 是 | `dawnbreaker_cross_front.png` | `images/items/` | 待提供 |
| 太阳十字架背面 | 使用统一太阳标志的简化雕刻版 | 1024×1024 | 是 | `dawnbreaker_cross_back.png` | `images/items/` | 待提供 |

目前倒下的巨人使用代码生成的明显临时占位物。正式透明 PNG 补齐后，只需给 `fallen-titan-visual` 配置素材并替换占位样式；小游戏桥接与存档逻辑无需修改。
