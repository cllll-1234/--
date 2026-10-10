# 步行交替修正

使用内置 image_gen 重绘四个方向的第二步帧；保留第一步、待机和控制代码。左右方向同时同步 legacy `_2.png`，实际配置读取 `_2_clear.png`。

before：替换前备份。generated：透明高分辨率源图。ready：与原帧画布及脚底锚点匹配的128×128生产图。

## 最终提示词

### left

Edit this game sprite. KEEP the head and torso, direction facing LEFT, costume and pixel style. Correct ONLY the legs and stride. The large visible foreground leg is STILL WRONG: it currently slopes down-left to the forward boot. REPLACE THAT ENTIRE FOREGROUND LEG: from the near hip directly below the big right-side equipment, draw the visible foreground thigh sloping DOWN-RIGHT, then foreground knee at screen RIGHT, then near brown boot at LOWER RIGHT. This foreground leg must be the REAR leg. Make the left forward boot belong to the FAR leg, which is partially OCCLUDED behind the foreground thigh at their crossing. Foreground trouser harness must now clearly run diagonally down-right, not down-left. Pose is a scissor stride with two thighs crossing, NOT both separated at pelvis. Far leg extends screen-left, near leg extends screen-right. Face still LEFT. Keep arms as in input (near arm forward). Transparent background, full body, same palette, no labels.

### right

Use case: precise-object-edit. Asset: transparent pixel-art game walk-cycle sprite, opposite foot contact pose.
Input image is the edit target and exact character/style reference. Character faces right and MUST CONTINUE FACING right. Keep his head, face, hair, jacket, body proportions, equipment, muted colors and pixel rendering unchanged.
CRITICAL anatomical correction: in the input the NEAR leg (closest to viewer, visibly overlapping the other thigh) is in front in the direction of travel. Draw the OPPOSITE contact phase: NEAR thigh and knee swing BACK toward screen left, near boot is behind his hips toward screen left; FAR leg reaches FORWARD toward screen right, with far heel contacting ground. The near thigh must visibly overlap the far thigh and slope backward, with near boot at rear. Do not just change toe angles: reverse actual thigh/knee/boot positions and overlapping order. Near arm swings FORWARD toward screen right, opposite its old backward swing; far arm swings backward. Natural moderate walking stride, not running. Same head position and scale, ground baseline. Exactly one full body character, no panels, no text, no shadow, genuinely transparent background. Do not mirror the whole character or change facing.

### down

Use case: precise-object-edit. Edit target: supplied transparent pixel-art walking game sprite. Keep exact character appearance, pixel style, muted cold colors, head, jacket, equipment, facing front toward viewer and body proportions. Change only gait into the OPPOSITE FOOT phase. Current screen-left leg is the long low reaching leg, the other foot is high/retracted. Reverse them: screen-right leg now extends with its boot LOW at ground baseline; screen-left knee bends and its boot is visibly HIGH and retracted by roughly one boot-length. Swap thigh angles and bent knee, not only toe direction. Opposite arm swing. Same head position, scale, padding. Single full-body sprite, no shadow, text, panels or background. Genuine transparent alpha.

### up

Use case: precise-object-edit. Edit target: supplied transparent pixel-art walking game sprite. Keep exact character appearance, pixel style, muted cold colors, head, jacket, equipment, facing away from viewer showing back and body proportions. Change only gait into the OPPOSITE FOOT phase. Current screen-right leg is the long low reaching leg, the other foot is high/retracted. Reverse them: screen-left leg now extends with its boot LOW at ground baseline; screen-right knee bends and its boot is visibly HIGH and retracted by roughly one boot-length. Swap thigh angles and bent knee, not only toe direction. Opposite arm swing. Same head position, scale, padding. Single full-body sprite, no shadow, text, panels or background. Genuine transparent alpha.

