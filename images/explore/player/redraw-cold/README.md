# 主角冷灰版重绘

以用户选定的 A 冷灰版为人物与配色参考，用内置 imagegen 逐帧重绘 `v2` 的14张图片。每次生成同时提供原帧作为姿态参考、A版作为外观参考，保留四方向站立与迈步动作，要求透明背景、去掉粗黑描边和蓝色边缘杂色。

- `original-v2/`：替换前的14帧备份。
- `generated/`：各帧的生成原图。
- `ready/`：整理为128×128画布的最终帧。
- `../v2/`：游戏使用的替换后素材，保持原文件名。
- `preview.html`：四方向动画与全部帧的对比页。

画布整理只做尺寸和位置适配，使用最近邻采样，按对应原帧的人物范围对齐，保留透明通道。

## 共同生成提示词

Use case: style-transfer. Asset type: transparent game animation sprite, a single full-body frame. Input image 1 is the EDIT TARGET and exact pose/composition reference. Input image 2 is the user-selected character design/color/style reference. Redraw the character in image 1 using the cold grey desaturated design of image 2: muted ash-blond hair, charcoal grey shirt and trousers, dark weathered brown cropped uniform jacket, brown harness straps and boots, steel-grey maneuver equipment. Preserve image 1's EXACT facing direction, head tilt, arm and leg positions, body proportions, foot placement, equipment silhouette and perspective. This is frame-specific animation art: do NOT substitute the front-facing standing pose from image 2. Match the original target's margins and placement in a square canvas, full body completely visible. Detailed crisp low-resolution pixel sprite aesthetic, no blur. Remove heavy black outline/black halo and stray colored edge pixels: use clean object-colored edges, no outer dark stroke, no blue rim-light contour. Genuine transparent alpha everywhere outside the character, including gaps between limbs and equipment. No black background, no ground/shadow, no text or borders. Consistent lighting and identical character clothing/colors across all frames. Final frame target name: [原帧文件名].
