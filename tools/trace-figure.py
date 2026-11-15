"""Trace a body-figure drawing (grey fill, dark outline, light background) into SVG path data for ui/BodyFigure.tsx.

usage: python trace-figure.py <image> <name> [overlay_dir]   (needs opencv-python-headless, numpy)
Prints JSON {name, outline} in BodyFigure viewBox units: 532 x 362, figure from y 8 to 352, torso centred on x 266.
Both references in ideas/mockups/figure/ share one frame, so traced figures share one scale and the hotspots fit both.
"""
import json
import sys

import cv2
import numpy as np

img_path, name = sys.argv[1], sys.argv[2]
overlay_dir = sys.argv[3] if len(sys.argv) > 3 else None

gray = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
h, w = gray.shape
stroke = (gray < 175).astype(np.uint8)

# Outside = background reachable from the corner without crossing the outline.
barrier = cv2.dilate(stroke, np.ones((3, 3), np.uint8)) * 255
cv2.floodFill(barrier, np.zeros((h + 2, w + 2), np.uint8), (0, 0), 128)
figure = (barrier != 128).astype(np.uint8)
figure = cv2.morphologyEx(figure, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))

# Outline on the stroke centreline: shrink by about half the stroke width.
centre = cv2.erode(figure, np.ones((3, 3), np.uint8))
contours, _ = cv2.findContours(centre, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
outer = max(contours, key=cv2.contourArea)
x0, y0, bw, bh = cv2.boundingRect(outer)

# Torso centre at 30 % of the height (the head is turned, so the bounding box is off-centre).
row = figure[int(y0 + 0.30 * bh)]
cols = np.where(row > 0)[0]
cx = (cols.min() + cols.max()) / 2

TOP, BOTTOM, CX = 8.0, 352.0, 266.0
s = (BOTTOM - TOP) / bh


def to_view(pts):
    return [(round(CX + (x - cx) * s, 1), round(TOP + (y - y0) * s, 1)) for x, y in pts]


def fmt(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")


def smooth_path(p, closed):
    """Catmull-Rom spline through the points, as cubic Béziers."""
    n = len(p)
    get = (lambda i: p[i % n]) if closed else (lambda i: p[max(0, min(n - 1, i))])
    d = [f"M{fmt(p[0][0])} {fmt(p[0][1])}"]
    for i in range(n if closed else n - 1):
        p0, p1, p2, p3 = get(i - 1), get(i), get(i + 1), get(i + 2)
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d.append("C" + " ".join(fmt(v) for v in (*c1, *c2, *p2)))
    return "".join(d) + ("Z" if closed else "")


approx = cv2.approxPolyDP(outer, 1.6, True).reshape(-1, 2)
outline = smooth_path(to_view(approx), True)

if overlay_dir:
    dbg = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
    cv2.polylines(dbg, [approx.reshape(-1, 1, 2)], True, (0, 0, 255), 1)
    cv2.imwrite(f"{overlay_dir}/{name}-overlay.png", dbg)

print(json.dumps({"name": name, "outline": outline, "scale": s, "cx": cx, "y0": y0, "bh": bh}))
