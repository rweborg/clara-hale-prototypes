#!/usr/bin/env python3
"""
_build/fix_prop_shadows.py — recomposite the desk props.

The props were exported as rough cutouts carrying a pure-black cast shadow
(rgb 0,0,0, up to 217 alpha) that was larger than the prop itself. The player
crops each sprite to its opaque bounds, so the shadow was sliced mid-gradient
and read as a hard dark rectangle on the desk.

This script rebuilds each prop as a clean composite:

  1. Silhouette. The raw alpha has a ragged, speckled edge. It is re-derived
     from a solid mask (alpha > 0.5), closed to fill notches, then feathered
     one pixel.
  2. Shadow. Two layers baked into the file: a tight contact shadow (2.5px
     blur, 2px right / 3px down) and a wider ambient one (13px blur, 7/10),
     both from the silhouette, so the prop sits on the desk instead of floating.
  3. Boxes. The crop includes the shadow; a separate hit box marks the prop
     itself so a shadow cannot steal a click from its neighbour.

Baking rather than using a CSS filter means the shadow is not clipped by the
crop, and it costs nothing at runtime.

    python3 _build/fix_prop_shadows.py [--dry-run]

Not idempotent — it re-shadows whatever it is given. Restore first:

    git checkout -- assets/desk
"""

import json
import os
import re
import sys

from PIL import Image, ImageFilter
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLAYER = os.path.join(ROOT, 'app', 'player.js')

CLOSE_PX = 2                    # morphological closing on the silhouette mask
FEATHER = 1.0                   # px of blur on the silhouette edge
CONTACT = (2.5, 2, 3, 0.46)     # blur, dx, dy, strength
AMBIENT = (13, 7, 10, 0.20)


def silhouette(arr):
    alpha = arr[..., 3].astype(np.float32) / 255.0
    m = Image.fromarray(((alpha > 0.5) * 255).astype(np.uint8), 'L')
    m = m.filter(ImageFilter.MaxFilter(CLOSE_PX * 2 + 1)).filter(ImageFilter.MinFilter(CLOSE_PX * 2 + 1))
    m = m.filter(ImageFilter.GaussianBlur(FEATHER))
    mask = np.array(m).astype(np.float32) / 255.0
    out = arr.copy()
    out[..., 3] = np.clip(alpha * mask * 255, 0, 255).astype(np.uint8)
    return out


def with_shadow(arr):
    im = Image.fromarray(arr, 'RGBA')
    alpha = arr[..., 3].astype(np.float32) / 255.0
    sil = Image.fromarray(((alpha > 0.15) * 255).astype(np.uint8), 'L')

    def layer(spec):
        blur, dx, dy, strength = spec
        s = sil.filter(ImageFilter.GaussianBlur(blur))
        shifted = Image.new('L', im.size, 0)
        shifted.paste(s, (dx, dy))
        return (np.array(shifted).astype(np.float32) / 255.0) * strength

    shadow = 1 - (1 - layer(CONTACT)) * (1 - layer(AMBIENT))
    out_a = alpha + shadow * (1 - alpha)
    rgb = np.where(alpha[..., None] > 0, arr[..., :3], 0)
    return np.dstack([rgb, np.clip(out_a * 255, 0, 255)]).astype(np.uint8)


def boxes(path):
    a = np.array(Image.open(path).convert('RGBA'))[..., 3]
    m = a >= 6
    if not m.any():
        return None, None
    cols, rows = m.sum(0), m.sum(1)
    xs = np.where(cols >= max(4, 0.06 * cols.max()))[0]
    ys = np.where(rows >= max(4, 0.06 * rows.max()))[0]
    x0, x1, y0, y1 = int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())
    crop = [max(0, x0 - 4), max(0, y0 - 4), x1 - x0 + 1 + 8, y1 - y0 + 1 + 8]
    ys2, xs2 = np.where(a >= 128)
    ox0, oy0 = int(xs2.min()), int(ys2.min())
    hit = [ox0 - crop[0], oy0 - crop[1], int(xs2.max()) - ox0 + 1, int(ys2.max()) - oy0 + 1]
    return crop, hit


def main():
    dry = '--dry-run' in sys.argv
    src = open(PLAYER, encoding='utf-8').read()
    m = re.search(r'^const CFG = (.*);$', src, re.M)
    if not m:
        raise SystemExit('could not find CFG in app/player.js')
    conf = json.loads(m.group(1))

    done = set()
    for theme in conf['desk'].values():
        for spr in theme['spr'].values():
            path = spr['src']
            if path.startswith('data:') or spr['w'] < 900:
                continue
            full = os.path.join(ROOT, path)
            if path.startswith('assets/desk/') and path not in done:
                arr = with_shadow(silhouette(np.array(Image.open(full).convert('RGBA'))))
                if not dry:
                    Image.fromarray(arr, 'RGBA').save(full, 'WEBP', quality=92, method=6)
                done.add(path)
            crop, hit = boxes(full)
            if crop:
                spr['crop'], spr['hit'] = crop, hit

    if not dry:
        out = json.dumps(conf, ensure_ascii=False, separators=(',', ':'))
        open(PLAYER, 'w', encoding='utf-8').write(src[:m.start(1)] + out + src[m.end(1):])

    print(f'sprites recomposited: {len(done)}')
    print('CFG crop + hit boxes ' + ('measured (dry run)' if dry else 'written'))


if __name__ == '__main__':
    main()
