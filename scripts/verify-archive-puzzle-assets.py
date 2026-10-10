from pathlib import Path

import numpy as np
from PIL import Image


ASSET_DIR = Path(__file__).resolve().parents[1] / "images" / "minigames" / "archive-puzzle"
ORIGINS = [(-20, -20), (380, -20), (780, -20), (-20, 380), (380, 380), (780, 380)]

master = np.array(Image.open(ASSET_DIR / "archive_full.webp").convert("RGBA"))
merged = np.zeros_like(master)
coverage = np.zeros(master.shape[:2], dtype=np.uint8)

for index, (origin_x, origin_y) in enumerate(ORIGINS, 1):
    piece = np.array(Image.open(ASSET_DIR / f"archive_piece_{index:02}.png").convert("RGBA"))
    x0, y0 = max(0, origin_x), max(0, origin_y)
    x1, y1 = min(1200, origin_x + 440), min(800, origin_y + 440)
    source = piece[y0 - origin_y:y1 - origin_y, x0 - origin_x:x1 - origin_x]
    opaque = source[:, :, 3] > 0
    coverage[y0:y1, x0:x1][opaque] += 1
    merged[y0:y1, x0:x1][opaque] = source[opaque]

paper = master[:, :, 3] > 0
missing = int(np.count_nonzero(paper & (coverage == 0)))
overlap = int(np.count_nonzero(coverage > 1))
outside = int(np.count_nonzero((coverage > 0) & ~paper))
alpha_difference = np.abs(merged[:, :, 3].astype(np.int16) - master[:, :, 3].astype(np.int16))
opaque_paper = master[:, :, 3] == 255
rgb_difference = np.abs(merged[:, :, :3].astype(np.int16) - master[:, :, :3].astype(np.int16))
max_opaque_rgb_difference = int(rgb_difference[opaque_paper].max())
master_premultiplied = master[:, :, :3].astype(np.int32) * master[:, :, 3:4].astype(np.int32)
merged_premultiplied = merged[:, :, :3].astype(np.int32) * merged[:, :, 3:4].astype(np.int32)
max_premultiplied_difference = int(np.abs(master_premultiplied - merged_premultiplied)[paper].max())

assert missing == 0, f"母版有 {missing} 个像素未被任何碎片覆盖"
assert overlap == 0, f"碎片之间存在 {overlap} 个重复像素"
assert outside == 0, f"碎片包含 {outside} 个母版外像素"
assert int(alpha_difference.max()) == 0, "拼合结果与母版的透明度不一致"
assert max_opaque_rgb_difference == 0, f"不透明纸面与母版的最大RGB差值为 {max_opaque_rgb_difference}"
assert max_premultiplied_difference <= 512, f"半透明纸边的预乘色差过大：{max_premultiplied_difference}"

print("Archive assets verified: no gaps, no overlaps, exact opaque-paper match.")
