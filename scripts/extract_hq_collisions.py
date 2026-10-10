"""Extract AABB collision regions from the existing HQ reference overlay."""

from __future__ import annotations

import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "images" / "maps" / "hq_collision_reference.png"
OUTPUT = ROOT / "js" / "explore" / "hq-collisions.js"
GRID = 12
CELL_THRESHOLD = 0.28
# The reference artwork's right desk and doorway wall touch each other, sealing
# the only route to the purple exit. This narrow gameplay corridor trims only
# their shared corner; the remainder of both marked obstacles stays solid.
WALKABLE_OVERRIDES = ((1380, 445, 150, 190),)


def retain_components(mask: np.ndarray, minimum_area: int, largest_only: bool = False) -> np.ndarray:
    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8), 8)
    indices = list(range(1, count))
    if largest_only and indices:
        indices = [max(indices, key=lambda index: int(stats[index, cv2.CC_STAT_AREA]))]
    else:
        indices = [index for index in indices if stats[index, cv2.CC_STAT_AREA] >= minimum_area]
    return np.isin(labels, indices)


def extract_color_mask(rgb: np.ndarray) -> np.ndarray:
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    hue, saturation = hsv[:, :, 0], hsv[:, :, 1]
    red = (((hue < 10) | (hue > 170)) & (saturation > 100) & (rgb[:, :, 0] > rgb[:, :, 2] * 1.25))
    blue = ((hue > 95) & (hue < 125) & (saturation > 110) & (rgb[:, :, 2] > rgb[:, :, 0] * 1.15))
    yellow = ((hue > 20) & (hue < 38) & (saturation > 120) & (rgb[:, :, 0] > 120))

    # Red is one connected perimeter overlay. Blue furniture and the yellow
    # noticeboard are retained only when they form intentionally large regions.
    red = retain_components(red, minimum_area=0, largest_only=True)
    blue = retain_components(blue, minimum_area=5_000)
    yellow = retain_components(yellow, minimum_area=5_000)
    collision_mask = red | blue | yellow
    for x, y, width, height in WALKABLE_OVERRIDES:
        collision_mask[y : y + height, x : x + width] = False
    return collision_mask


def occupied_runs(mask: np.ndarray) -> list[tuple[int, list[tuple[int, int]]]]:
    height, width = mask.shape
    rows = []
    for y in range(0, height, GRID):
        runs = []
        start = None
        for x in range(0, width, GRID):
            cell = mask[y : min(y + GRID, height), x : min(x + GRID, width)]
            occupied = float(cell.mean()) >= CELL_THRESHOLD
            if occupied and start is None:
                start = x
            elif not occupied and start is not None:
                runs.append((start, x))
                start = None
        if start is not None:
            runs.append((start, width))
        rows.append((y, runs))
    return rows


def merge_runs(mask: np.ndarray) -> list[dict[str, int | str]]:
    active: dict[tuple[int, int], int] = {}
    rectangles: list[tuple[int, int, int, int]] = []
    for y, runs in occupied_runs(mask):
        current = {run: active.get(run, y) for run in runs}
        for run, start_y in active.items():
            if run not in current:
                rectangles.append((run[0], start_y, run[1] - run[0], y - start_y))
        active = current
    height = mask.shape[0]
    for run, start_y in active.items():
        rectangles.append((run[0], start_y, run[1] - run[0], height - start_y))

    rectangles.sort(key=lambda value: (value[1], value[0]))
    return [
        {"id": f"hq-mask-{index:03d}", "label": "参考图碰撞", "x": x, "y": y, "width": width, "height": height}
        for index, (x, y, width, height) in enumerate(rectangles, 1)
    ]


def main() -> int:
    if not SOURCE.exists():
        print(f"缺失：{SOURCE.relative_to(ROOT)}")
        return 1
    rgb = np.asarray(Image.open(SOURCE).convert("RGB"))
    mask = extract_color_mask(rgb)
    rectangles = merge_runs(mask)
    source_pixels = int(mask.sum())

    body = json.dumps(rectangles, ensure_ascii=False, indent=2)
    output = (
        "/* 由 scripts/extract_hq_collisions.py 从 hq_collision_reference.png 生成。 */\n"
        "(function () {\n"
        '  "use strict";\n'
        f"  window.TitanHqCollisions = Object.freeze({body});\n"
        "}());\n"
    )
    OUTPUT.write_text(output, encoding="utf-8")
    print(f"参考图：{SOURCE.relative_to(ROOT)}，尺寸 {rgb.shape[1]}x{rgb.shape[0]}")
    print(f"标注碰撞像素：{source_pixels}；生成 AABB：{len(rectangles)} 个")
    print(f"输出：{OUTPUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
