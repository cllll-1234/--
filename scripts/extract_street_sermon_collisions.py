"""从街道标注图提取红色建筑和蓝色物件的碰撞矩形。"""
from __future__ import annotations

import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "images" / "maps" / "street_sermon_collision_reference.png"
OUTPUT = ROOT / "js" / "explore" / "street-sermon-collisions.js"
GRID = 12
CELL_THRESHOLD = 0.42


def color_mask(rgb: np.ndarray) -> np.ndarray:
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    hue, saturation = hsv[:, :, 0], hsv[:, :, 1]
    red = ((hue < 8) | (hue > 174)) & (saturation > 105) & (rgb[:, :, 0] > rgb[:, :, 1] * 1.25)
    blue = (hue > 96) & (hue < 122) & (saturation > 120) & (rgb[:, :, 2] > rgb[:, :, 0] * 1.15)
    mask = red | blue
    # 去除零散纹理，只保留标注形成的主体区域。
    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8), 8)
    keep = [index for index in range(1, count) if stats[index, cv2.CC_STAT_AREA] >= 900]
    return np.isin(labels, keep)


def rectangles(mask: np.ndarray) -> list[dict[str, int | str]]:
    height, width = mask.shape
    active: dict[tuple[int, int], int] = {}
    result: list[tuple[int, int, int, int]] = []
    for y in range(0, height, GRID):
        runs, start = [], None
        for x in range(0, width, GRID):
            cell = mask[y:min(y + GRID, height), x:min(x + GRID, width)]
            occupied = float(cell.mean()) >= CELL_THRESHOLD
            if occupied and start is None:
                start = x
            elif not occupied and start is not None:
                runs.append((start, x)); start = None
        if start is not None:
            runs.append((start, width))
        current = {run: active.get(run, y) for run in runs}
        for run, start_y in active.items():
            if run not in current:
                result.append((run[0], start_y, run[1] - run[0], y - start_y))
        active = current
    for run, start_y in active.items():
        result.append((run[0], start_y, run[1] - run[0], height - start_y))
    result.sort(key=lambda value: (value[1], value[0]))
    return [{"id": f"street-mask-{i:03d}", "label": "街道参考图碰撞", "x": x, "y": y,
             "width": w, "height": h} for i, (x, y, w, h) in enumerate(result, 1)]


def main() -> int:
    rgb = np.asarray(Image.open(SOURCE).convert("RGB"))
    blocks = rectangles(color_mask(rgb))
    body = json.dumps(blocks, ensure_ascii=False, indent=2)
    OUTPUT.write_text("/* 由 scripts/extract_street_sermon_collisions.py 自动生成。 */\n"
                      "(function () {\n  \"use strict\";\n"
                      f"  window.TitanStreetSermonCollisions = Object.freeze({body});\n"
                      "}());\n", encoding="utf-8")
    print(f"参考图：{rgb.shape[1]}x{rgb.shape[0]}；生成碰撞矩形：{len(blocks)}；输出：{OUTPUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
