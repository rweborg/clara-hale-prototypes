#!/usr/bin/env python3
"""
_build/fix_prop_shadows.py — strip the baked cast shadow from the desk props.

The props were exported with a pure-black cast shadow (rgb 0,0,0, up to 217
alpha), far larger than the prop itself — the mug's covered five times its own
area. The player crops each sprite to its opaque bounds, so that shadow was cut
mid-gradient and read as a hard-edged dark rectangle on the desk. Softening it
only made a lighter rectangle.

So this removes it outright:

  * Anything neutral (no chroma) and dark, at less than full opacity, is shadow.
    Full opacity is never shadow: the kitchen mug's coffee is dark and neutral
    but opaque, and an earlier colour-based pass destroyed it.
  * One boundary layer around the removed area goes too, which takes the hard
    edge where the shadow met the prop.
  * The crop box and a matching hit box are measured and written into CFG.

The props have no shadow of their own after this; the soft shadow is a CSS
drop-shadow on #spr > img, which follows the cutout's silhouette and is not
clipped by the crop.

    python3 _build/fix_prop_shadows.py [--dry-run]

Restore the art first if you need to start over: git checkout -- assets/desk
"""

import json
import os
import re
import sys

from PIL import Image, ImageFilter
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLAYER = os.path.join(ROOT, 'app', 'player.js')

CROP_LO = 6         # alpha floor when measuring the crop box
CROP_FRAC = 0.06    # ignore rows/columns below this fraction of the busiest


def strip(path, dry=False, grow_px=2):
    """Remove the black cast shadow, including the hard edge against the prop."""
    im = Image.open(path).convert('RGBA')
    a = np.array(im).astype(np.int16)
    r, g, b, alpha = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)

    blackish = (mx - mn <= 7) & (mx <= 70) & (alpha > 0)
    shadow = blackish & (alpha < 240)          # opaque dark pixels are the prop
    grown = np.array(
        Image.fromarray((shadow * 255).astype(np.uint8), 'L')
        .filter(ImageFilter.MaxFilter(grow_px * 2 + 1))
    ) > 0
    remove = grown & blackish

    out = a.astype(np.uint8).copy()
    out[..., 3] = np.where(remove, 0, alpha)
    if not dry:
        Image.fromarray(out, 'RGBA').save(path, 'WEBP', quality=92, method=6)
    return int(remove.sum())


def boxes(path):
    """Crop box (prop + shadow) and hit box (prop alone, relative to the crop)."""
    a = np.array(Image.open(path).convert('RGBA'))[..., 3]
    m = a >= CROP_LO
    if not m.any():
        return None, None
    cols, rows = m.sum(0), m.sum(1)
    xs = np.where(cols >= max(4, CROP_FRAC * cols.max()))[0]
    ys = np.where(rows >= max(4, CROP_FRAC * rows.max()))[0]
    cx0, cx1, cy0, cy1 = int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())
    ys2, xs2 = np.where(a >= 128)
    ox0, ox1, oy0, oy1 = int(xs2.min()), int(xs2.max()), int(ys2.min()), int(ys2.max())
    crop = [cx0, cy0, cx1 - cx0 + 1, cy1 - cy0 + 1]
    hit = [ox0 - cx0, oy0 - cy0, ox1 - ox0 + 1, oy1 - oy0 + 1]
    return crop, hit


def main():
    dry = '--dry-run' in sys.argv
    src = open(PLAYER, encoding='utf-8').read()
    m = re.search(r'^const CFG = (.*);$', src, re.M)
    if not m:
        raise SystemExit('could not find CFG in app/player.js')
    conf = json.loads(m.group(1))

    done = set()
    total = 0
    for theme in conf['desk'].values():
        for key, spr in theme['spr'].items():
            path = spr['src']
            if path.startswith('data:') or spr['w'] < 900:
                continue
            full = os.path.join(ROOT, path)
            if path.startswith('assets/desk/') and path not in done:
                total += strip(full, dry)
                done.add(path)
            crop, hit = boxes(full)
            if crop:
                spr['crop'] = crop
                spr['hit'] = hit

    if not dry:
        out = json.dumps(conf, ensure_ascii=False, separators=(',', ':'))
        open(PLAYER, 'w', encoding='utf-8').write(src[:m.start(1)] + out + src[m.end(1):])

    print(f'sprites stripped: {len(done)}  shadow pixels removed: {total:,}')
    print('CFG crop + hit boxes ' + ('measured (dry run)' if dry else 'written'))


if __name__ == '__main__':
    main()
