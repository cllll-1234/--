# 现有美术素材接入说明

## 已接入素材

- HQ 正式地图：`images/maps/hq.webp`，1672×941，作为总部 Explore Mode 背景。
- HQ 碰撞参考图：`images/maps/hq_collision_reference.png`，1672×941，仅用于开发调试。
- 莱纳上/下方向：原始六张大图保存在 `images/explore/player/source/`，运行时版本统一为 128×128 透明 PNG。
- 莱纳左/右方向：由 `reiner_left_right_sheet.png` 检测人物边界后切分为六张 128×128 透明 PNG。
- 四方向运行时图片的人物可见高度统一为 120 像素，脚底统一在画布 `y=124`，避免切换方向时大小变化和上下抖动。
- HQ NPC：`images/explore/npc/` 下的韩吉、利威尔、驻地士兵和祭司原始透明 PNG，运行时等比缩放显示。
- HQ 公告栏和出口直接使用总部地图中已经绘制的画面；`images/explore/objects/` 下的独立透明 PNG 仅作为备用素材保留，不再叠加显示。

角色切图可以重新执行：

```powershell
python scripts/split_reiner_sheets.py
```

如果以后补入 `images/explore/player/reiner_down_up_sheet.png`，可以执行：

```powershell
python scripts/split_reiner_sheets.py --include-down-up
```

脚本不会镜像或重新生成角色，只做标签区域排除、前景检测、透明化、等比例缩放和脚底基准线对齐。

## HQ 碰撞数据

碰撞数据由 `scripts/extract_hq_collisions.py` 直接读取现有 `hq_collision_reference.png`：红色墙体、蓝色家具和黄色公告栏进入碰撞，紫色出口、绿色 NPC 标记和白色出生点被排除。执行：

```powershell
python scripts/extract_hq_collisions.py
```

脚本以 12 像素网格分析标注轮廓并合并连续区域，输出 `js/explore/hq-collisions.js`。当前生成 186 个小型 AABB 区域，避免用一个大矩形堵住家具附近的正常通道。玩家碰撞盒只使用脚底区域，人物上半身靠近桌沿时不会被错误阻挡。

参考图右侧办公桌与门洞墙体的标注互相连接，会完全封住紫色出口。生成脚本通过 `WALKABLE_OVERRIDES` 只裁掉两者相接处的一条窄通道，桌子和墙体的其他区域仍然保持碰撞，玩家可以实际走到出口后再互动。

## 碰撞调试开关

正式运行默认不显示碰撞参考图。开发时直接打开：

```text
game.html?debug=collisions
```

需要同时强制新游戏时使用：

```text
game.html?mode=new&debug=collisions
```

开关位于 `js/explore/explore-manager.js`，读取 URL 参数 `debug=collisions`；参考图路径配置在 `js/explore/map-data.js` 的 `collisionReferenceAsset`。
