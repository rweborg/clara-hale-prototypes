#!/usr/bin/env python3
"""
_build/reality.py — ruin a generated image the way reality ruins a photograph.

A model gives you a well-exposed, sharp, symmetrical, evenly lit picture. That
is the tell, and no prompt removes it, because the model has no idea what a bad
photo looks like. So we apply what actually goes wrong when a person takes a
photo in a hurry:

    tilt and a lazy crop        the horizon is never level, heads get cut
    missed focus                soft overall, softer at the edges
    motion blur                 a hand moved during a slow shutter
    high-ISO noise              colour noise worst in the shadows
    clipped highlights          the flash blew out the forehead
    colour cast                 tungsten, fluorescent, or overcast daylight
    vignetting                  the lens is not great
    heavy JPEG                  it has been sent, saved and sent again

Each preset is a different bad camera in a different bad room.

    python3 _build/reality.py in.jpg out.jpg --preset tungsten
"""

import argparse
import io

import numpy as np
from PIL import Image, ImageFilter

# cast: channel multipliers.  blur: gaussian radius.  motion: (len, angle deg).
# clip: highlight clip point.  noise: sigma.  q: jpeg quality.
PRESETS = {
    'tungsten':   dict(cast=(1.16, 1.0, 0.78), blur=0.9, motion=(3, 4),  clip=224, noise=0.055, q=62, tilt=1.6),
    'fluorescent': dict(cast=(0.94, 1.06, 0.92), blur=0.7, motion=(2, -6), clip=232, noise=0.045, q=66, tilt=-1.1),
    'overcast':   dict(cast=(1.02, 1.03, 1.10), blur=0.8, motion=(2, 2),  clip=238, noise=0.035, q=70, tilt=0.8),
    'flash':      dict(cast=(1.04, 1.0, 0.96),  blur=0.4, motion=(1, 0),  clip=204, noise=0.060, q=58, tilt=2.2),
    'cctv':       dict(cast=(0.82, 1.02, 0.86),  blur=1.6, motion=(0, 0),  clip=246, noise=0.090, q=48, tilt=0.0),
    'clean':      dict(cast=(1.0, 1.0, 1.0),     blur=0.3, motion=(0, 0),  clip=248, noise=0.018, q=88, tilt=0.0),
}


def motion_blur(im, length, angle):
    if length < 2:
        return im
    # a one-pixel line dragged along, then rotated
    kernel = Image.new('L', (length, 1), 255)
    k = kernel.rotate(angle, expand=True, resample=Image.BICUBIC)
    k = k.filter(ImageFilter.GaussianBlur(0.4))
    a = np.asarray(k).astype(np.float32) / 255.0
    a /= a.sum()
    from PIL import ImageFilter as IF
    # PIL only ships square kernels; use a small convolution via numpy
    h, w = a.shape
    out = np.asarray(im).astype(np.float32)
    pad = np.pad(out, ((h // 2, h // 2), (w // 2, w // 2), (0, 0)), mode='edge')
    acc = np.zeros_like(out)
    for dy in range(h):
        for dx in range(w):
            if a[dy, dx] > 0.001:
                acc += pad[dy:dy + out.shape[0], dx:dx + out.shape[1]] * a[dy, dx]
    return Image.fromarray(np.clip(acc, 0, 255).astype(np.uint8))


# How much worse the camera was, on top of whichever bad camera it was.
QUALITY = {
    'poor':  dict(blur=1.8, noise=1.7, q=-14, down=520),
    'soft':  dict(blur=1.5, noise=0.9, q=-6, down=680),
    'ok':    dict(blur=1.0, noise=1.0, q=0, down=0),
    'sharp': dict(blur=0.4, noise=0.5, q=10, down=0),
}


def degrade(im, preset='tungsten', tilt=None, vignette=0.22, seed=3, quality='ok'):
    p = dict(PRESETS[preset])
    q = QUALITY.get(quality, QUALITY['ok'])
    p['blur'] = p['blur'] * q['blur']
    p['noise'] = p['noise'] * q['noise']
    p['q'] = max(35, min(92, p['q'] + q['q']))

    # a bad camera also throws resolution away before it is saved
    if q['down'] and im.width > q['down']:
        im = im.resize((q['down'], max(1, int(im.height * q['down'] / im.width))), Image.LANCZOS)
        im = im.resize((im.width * 2, im.height * 2), Image.LANCZOS)
    rng = np.random.default_rng(seed)
    im = im.convert('RGB')

    # the horizon is never level, and levelling it eats the edges
    angle = p['tilt'] if tilt is None else tilt
    if abs(angle) > 0.05:
        im = im.rotate(angle, resample=Image.BICUBIC, expand=False)
        inset = int(min(im.size) * abs(np.sin(np.radians(angle))) + 2)
        im = im.crop((inset, inset, im.width - inset, im.height - inset))

    im = im.filter(ImageFilter.GaussianBlur(p['blur']))
    im = motion_blur(im, *p['motion'])

    a = np.asarray(im).astype(np.float32)

    # colour cast, then the white balance never quite recovers
    a = a * np.array(p['cast'], dtype=np.float32)

    # blown highlights: anything near white is simply gone
    a = np.clip(a * (255.0 / max(p['clip'], 1)), 0, 255)
    a = np.clip(a * (p['clip'] / 255.0) + (255 - p['clip']) * 0.55, 0, 255)

    # high-ISO noise, worse in the shadows where the sensor struggles
    lum = a.mean(2, keepdims=True) / 255.0
    weight = (1.0 - lum) ** 1.5 * 0.7 + 0.3
    noise = rng.normal(0, 255 * p['noise'], a.shape[:2])[..., None] * weight
    chroma = rng.normal(0, 255 * p['noise'] * 0.45, (a.shape[0], a.shape[1], 3))
    a = a + noise + chroma

    # vignetting
    h, w = a.shape[:2]
    y, x = np.ogrid[:h, :w]
    d = np.sqrt(((x - w / 2) / (w / 2)) ** 2 + ((y - h / 2) / (h / 2)) ** 2)
    a = a * np.clip(1 - vignette * np.clip(d - 0.45, 0, 1) ** 1.7, 0, 1)[..., None]

    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

    # it has been saved, sent, and saved again
    buf = io.BytesIO()
    im.save(buf, 'JPEG', quality=p['q'], subsampling=2)
    buf.seek(0)
    return Image.open(buf).convert('RGB')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('dst')
    ap.add_argument('--preset', default='tungsten', choices=sorted(PRESETS))
    ap.add_argument('--tilt', type=float)
    ap.add_argument('--seed', type=int, default=3)
    a = ap.parse_args()
    out = degrade(Image.open(a.src), a.preset, tilt=a.tilt, seed=a.seed)
    out.save(a.dst, 'JPEG', quality=PRESETS[a.preset]['q'])
    print(f'{a.dst}  {out.size}  preset={a.preset}')


if __name__ == '__main__':
    main()
