#!/usr/bin/env python3
"""
_build/fix_prop_shadows.py — repair the desk prop sprites.

The props were exported with a pure-black cast shadow (rgb 0,0,0, up to 217
alpha). Two problems:

  1. It was far too large. The mug's shadow covered five times the mug's area.
  2. The player crops each sprite to its opaque area, so the shadow was cut off
     mid-gradient and read as a hard-edged dark rectangle on the desk.

This script does two things:

  * Tames the shadow: every shadow pixel is scaled to 22% alpha. Pixels near the
    prop stay darker, which reads as a contact shadow. Anything the prop itself
    is made of is protected by opacity (alpha >= 240), not colour — the kitchen
    mug is dark, and protecting by colour destroyed it.
  * Bakes the crop box (prop + its now-subtle shadow) and a separate hit box
    (the prop alone) into CFG, so the desk can show the soft shadow without the
    shadow stealing clicks from the next prop.

    python3 _build/fix_prop_shadows.py [--dry-run]

Idempotent-ish: re-running tames an already-tamed shadow further, so restore the
art from git first if you need to start over (`git checkout -- assets/desk`).
"""

import json
import os
import re
import sys

from PIL import Image, ImageFilter
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLAYER = os.path.join(ROOT, 'app', 'player.js')

SCALE = 0.22        # shadow opacity multiplier
PROTECT_PX = 1      # ring of pixels around an opaque core that keeps its alpha
CROP_LO = 6         # alpha floor when measuring the crop box
CROP_FRAC = 0.06    # ignore rows/columns below this fraction of the busiest


def tame(path, dry=False):
    """Scale the black cast shadow down without touching the prop itself."""
    im = Image.open(path).convert('RGBA')
    a = np.array(im).astype(np.int16)
    r, g, b, alpha = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)

    neutral_dark = (mx - mn <= 7) & (mx <= 70) & (alpha > 0)
    core = (alpha >= 240).astype(np.uint8) * 255
    protect = np.array(
        Image.fromarray(core, 'L').filter(ImageFilter.MaxFilter(PROTECT_PX * 2 + 1))
    ) > 0

    shadow = neutral_dark & ~protect
    new_alpha = np.where(shadow, alpha.astype(np.float32) * SCALE, alpha.astype(np.float32))

    out = a.astype(np.uint8).copy()
    out[..., 3] = np.clip(new_alpha, 0, 255).astype(np.uint8)
    if not dry:
        Image.fromarray(out, 'RGBA').save(path, 'WEBP', quality=92, method=6)
    return int(shadow.sum())


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
                total += tame(full, dry)
                done.add(path)
            crop, hit = boxes(full)
            if crop:
                spr['crop'] = crop
                spr['hit'] = hit

    if not dry:
        out = json.dumps(conf, ensure_ascii=False, separators=(',', ':'))
        open(PLAYER, 'w', encoding='utf-8').write(src[:m.start(1)] + out + src[m.end(1):])

    print(f'sprites tamed: {len(done)}  shadow pixels scaled: {total:,}')
    print('CFG crop + hit boxes ' + ('measured (dry run)' if dry else 'written'))


if __name__ == '__main__':
    main()
