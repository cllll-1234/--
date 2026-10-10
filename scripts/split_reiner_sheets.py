"""Split existing Reiner contact sheets into aligned transparent PNG frames.

The script does not generate or mirror artwork. It uses broad cells only as search
areas, detects the actual foreground with GrabCut, then crops the detected bounds.
Pillow handles image I/O, canvas layout and final PNG export; OpenCV is used only
for foreground segmentation and connected-component cleanup.
"""

from __future__ import annotations

import argparse
import shutil
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PLAYER_DIR = ROOT / "images" / "explore" / "player"
SOURCE_DIR = PLAYER_DIR / "source"


@dataclass(frozen=True)
class SheetJob:
    source: Path
    names: tuple[str, ...]
    row: str


LEFT_RIGHT_JOB = SheetJob(
    source=PLAYER_DIR / "reiner_left_right_sheet.png",
    names=(
        "reiner_idle_left.png",
        "reiner_walk_left_1.png",
        "reiner_walk_left_2.png",
        "reiner_idle_right.png",
        "reiner_walk_right_1.png",
        "reiner_walk_right_2.png",
    ),
    row="bottom",
)

DOWN_UP_JOB = SheetJob(
    source=PLAYER_DIR / "reiner_down_up_sheet.png",
    names=(
        "reiner_idle_down.png",
        "reiner_walk_down_1.png",
        "reiner_walk_down_2.png",
        "reiner_idle_up.png",
        "reiner_walk_up_1.png",
        "reiner_walk_up_2.png",
    ),
    row="auto",
)


def detect_content_rows(rgb: np.ndarray, row: str) -> tuple[int, int]:
    """Find the illustrated row while excluding the dark filename-label strip."""
    height = rgb.shape[0]
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    edges = cv2.Canny(gray, 35, 105)
    edge_density = (edges > 0).mean(axis=1)

    search_start = height // 2 if row == "bottom" else 0
    active = np.flatnonzero(edge_density[search_start:] > 0.004)
    if active.size == 0:
        raise RuntimeError("未检测到角色轮廓。")
    top = max(search_start, search_start + int(active[0]) - 8)

    # The supplied sheets fade to nearly black before their filename captions.
    medians = np.median(gray, axis=1)
    bottom = height
    for y in range(max(top + 64, int(height * 0.78)), height - 10):
        if np.all(medians[y : y + 10] < 10):
            bottom = y
            break
    if bottom <= top + 64:
        bottom = height
    return top, bottom


def segment_character(cell_rgb: np.ndarray) -> tuple[Image.Image, tuple[int, int, int, int]]:
    """Detect the character inside a broad cell and return a tight RGBA crop."""
    bgr = cv2.cvtColor(cell_rgb, cv2.COLOR_RGB2BGR)
    height, width = bgr.shape[:2]
    mask = np.zeros((height, width), np.uint8)
    margin_x = max(4, int(width * 0.035))
    margin_y = max(3, int(height * 0.015))
    rect = (margin_x, margin_y, width - margin_x * 2, height - margin_y * 2)
    background_model = np.zeros((1, 65), np.float64)
    foreground_model = np.zeros((1, 65), np.float64)
    cv2.grabCut(bgr, mask, rect, background_model, foreground_model, 8, cv2.GC_INIT_WITH_RECT)
    binary = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)

    # Remove small label/noise fragments, keeping the main connected figure.
    count, labels, stats, _ = cv2.connectedComponentsWithStats(binary, 8)
    candidates = []
    for index in range(1, count):
        x, y, w, h, area = stats[index]
        if area > 250 and h > height * 0.28:
            candidates.append((area, index))
    if not candidates:
        raise RuntimeError("前景分离失败：没有检测到完整人物。")
    main_label = max(candidates)[1]
    binary = np.where(labels == main_label, 255, 0).astype(np.uint8)

    # Close tiny holes and retain a one-pixel soft edge for transparent PNGs.
    kernel = np.ones((3, 3), np.uint8)
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=1)
    alpha = cv2.GaussianBlur(binary, (3, 3), 0.45)
    ys, xs = np.nonzero(binary)
    pad = 3
    left = max(0, int(xs.min()) - pad)
    top = max(0, int(ys.min()) - pad)
    right = min(width, int(xs.max()) + pad + 1)
    bottom = min(height, int(ys.max()) + pad + 1)

    rgba = np.dstack((cell_rgb, alpha))[top:bottom, left:right]
    return Image.fromarray(rgba, "RGBA"), (left, top, right, bottom)


def choose_canvas(frames: list[Image.Image]) -> int:
    # Preserve source detail when a 96px canvas would make the figure too small.
    max_ratio = max(max(frame.size) / max(1, min(frame.size)) for frame in frames)
    return 128 if max_ratio > 1.55 else 96


def normalize_frames(frames: list[Image.Image], canvas_size: int) -> list[Image.Image]:
    usable_width = canvas_size - 8
    usable_height = canvas_size - 8
    scales = [min(usable_width / frame.width, usable_height / frame.height) for frame in frames]
    common_scale = min(scales)
    normalized = []
    for frame in frames:
        size = (max(1, round(frame.width * common_scale)), max(1, round(frame.height * common_scale)))
        resized = frame.resize(size, Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
        # Align every frame to the same bottom baseline and horizontal center.
        x = (canvas_size - resized.width) // 2
        y = canvas_size - 4 - resized.height
        canvas.alpha_composite(resized, (x, y))
        normalized.append(canvas)
    return normalized


def normalize_all_direction_frames() -> list[Path]:
    """Give all 12 directional files the same visible height and foot baseline."""
    names = (
        "reiner_idle_down.png", "reiner_walk_down_1.png", "reiner_walk_down_2.png",
        "reiner_idle_up.png", "reiner_walk_up_1.png", "reiner_walk_up_2.png",
        "reiner_idle_left.png", "reiner_walk_left_1.png", "reiner_walk_left_2.png",
        "reiner_idle_right.png", "reiner_walk_right_1.png", "reiner_walk_right_2.png",
    )
    missing = [name for name in names if not (PLAYER_DIR / name).exists()]
    if missing:
        print("未统一四方向尺寸，缺少：" + "、".join(missing))
        return []

    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    outputs = []
    for name in names:
        path = PLAYER_DIR / name
        source_path = path
        if name.endswith(("down.png", "down_1.png", "down_2.png", "up.png", "up_1.png", "up_2.png")):
            backup = SOURCE_DIR / name
            if not backup.exists():
                shutil.copy2(path, backup)
            source_path = backup

        image = Image.open(source_path).convert("RGBA")
        # Ignore nearly invisible alpha noise around the supplied large PNGs.
        robust_alpha = image.getchannel("A").point(lambda value: 255 if value >= 8 else 0)
        alpha_box = robust_alpha.getbbox()
        if not alpha_box:
            raise RuntimeError(f"{name} 没有可见人物像素。")
        figure = image.crop(alpha_box)
        target_height = 120
        scale = target_height / figure.height
        target_width = max(1, round(figure.width * scale))
        if target_width > 120:
            scale = 120 / figure.width
            target_width = 120
            target_height_for_frame = max(1, round(figure.height * scale))
        else:
            target_height_for_frame = target_height
        figure = figure.resize((target_width, target_height_for_frame), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
        canvas.alpha_composite(figure, ((128 - target_width) // 2, 124 - target_height_for_frame))
        canvas.save(path, "PNG", optimize=True)
        outputs.append(path)
        print(f"  统一四方向: {path.relative_to(ROOT)} 128x128，人物高 {target_height_for_frame}px，脚底 y=124")
    return outputs


def process_job(job: SheetJob) -> list[Path]:
    source_image = Image.open(job.source).convert("RGB")
    rgb = np.asarray(source_image)
    top, bottom = detect_content_rows(rgb, job.row)
    row_rgb = rgb[top:bottom]
    count = len(job.names)
    cell_width = rgb.shape[1] / count
    frames = []

    print(f"源文件: {job.source.relative_to(ROOT)} ({source_image.width}x{source_image.height})")
    print(f"检测到角色内容行: y={top}..{bottom - 1}；已排除其下方标签区域")
    for index, name in enumerate(job.names):
        # Cells are search regions only; final crops come from detected foreground bounds.
        cell_left = round(index * cell_width)
        cell_right = round((index + 1) * cell_width)
        frame, bounds = segment_character(row_rgb[:, cell_left:cell_right])
        frames.append(frame)
        absolute_bounds = (cell_left + bounds[0], top + bounds[1], cell_left + bounds[2], top + bounds[3])
        print(f"  {name}: 检测边界 {absolute_bounds}，原始裁片 {frame.width}x{frame.height}")

    canvas_size = choose_canvas(frames)
    outputs = []
    for name, frame in zip(job.names, normalize_frames(frames, canvas_size)):
        destination = PLAYER_DIR / name
        frame.save(destination, "PNG", optimize=True)
        outputs.append(destination)
        print(f"  输出: {destination.relative_to(ROOT)} {frame.width}x{frame.height} RGBA")
    return outputs


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--include-down-up", action="store_true", help="存在 down/up 合图时同时处理")
    args = parser.parse_args()

    if not LEFT_RIGHT_JOB.source.exists():
        print(f"缺失: {LEFT_RIGHT_JOB.source.relative_to(ROOT)}")
        return 1
    process_job(LEFT_RIGHT_JOB)

    if args.include_down_up:
        if DOWN_UP_JOB.source.exists():
            process_job(DOWN_UP_JOB)
        else:
            print(f"缺失（未处理）: {DOWN_UP_JOB.source.relative_to(ROOT)}")
    normalize_all_direction_frames()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
