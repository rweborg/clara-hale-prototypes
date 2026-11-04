#!/usr/bin/env python3
"""
_build/extract_assets.py — one-time migration: pull the inline base64 out of
journey/index.html and write real files.

Before: index.html was ~2.4 MB, of which ~2.2 MB was base64 in the stylesheet
(7 font faces) and in CFG (2 desk photographs, 32 layered desk props, and the
evidence/paper art). Browsers cannot cache any of it, and it made the file
impossible to diffs.

After: the same bytes live under assets/, referenced by path, so they cache,
and the document is the size of its actual code.

Idempotent: if there are no data URIs left, it does nothing.

    python3 _build/extract_assets.py [--dry-run]
"""

import base64
import hashlib
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = os.path.join(ROOT, 'index.html')
ASSETS = os.path.join(ROOT, 'assets')
DS_FONTS = os.path.join(ROOT, 'design-system', 'fonts')

FAMILIES = {'Atkinson': 'atkinson', 'Caveat': 'caveat', 'CourierP': 'courierp', 'ArchivoBlack': 'archivoblack'}
EXT = {'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'font/woff2': 'woff2'}

FONT_RE = re.compile(
    r"@font-face\{font-family:'([^']+)';src:url\(data:font/woff2;base64,([A-Za-z0-9+/=]+)\) "
    r"format\('woff2'\);font-weight:([^;]+);font-style:([^;]+);font-display:block\}"
)
DATA_RE = re.compile(r'data:(image|font)/([a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)')


def sha(b):
    return hashlib.sha256(b).hexdigest()


def write(path, data, dry):
    rel = os.path.relpath(path, ROOT)
    if not dry:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'wb') as f:
            f.write(data)
    print(f'  {rel:<46} {len(data):>9,} bytes')


def font_name(family, weight, style):
    base = FAMILIES.get(family, family.lower())
    tag = weight.replace(' ', '')
    if style == 'italic':
        tag += '-italic'
    return f'{base}-{tag}.woff2'


def extract_fonts(html, dry):
    """Replace inline @font-face base64 with a path, reusing design-system/fonts."""
    count = 0

    def repl(m):
        nonlocal count
        family, b64, weight, style = m.group(1), m.group(2), m.group(3), m.group(4)
        data = base64.b64decode(b64)
        name = font_name(family, weight, style)
        existing = os.path.join(DS_FONTS, name)
        if os.path.exists(existing) and sha(open(existing, 'rb').read()) == sha(data):
            count += 1
            print(f'  reuse design-system/fonts/{name}')
            return (f"@font-face{{font-family:'{family}';src:url('design-system/fonts/{name}') "
                    f"format('woff2');font-weight:{weight};font-style:{style};font-display:swap}}")
        target = os.path.join(ASSETS, 'fonts', name)
        write(target, data, dry)
        count += 1
        return (f"@font-face{{font-family:'{family}';src:url('assets/fonts/{name}') "
                f"format('woff2');font-weight:{weight};font-style:{style};font-display:swap}}")

    html = FONT_RE.sub(repl, html)
    print(f'fonts: {count} faces extracted')
    return html


def extract_cfg(html, dry):
    """Tokenize data URIs inside CFG, parse it, write files, re-emit with paths."""
    m = re.search(r'<script>const CFG=(.*?);const AU=(.*?);</script>', html, re.S)
    if not m:
        raise SystemExit('could not find the CFG/AU script block')
    cfg_src, au_src = m.group(1), m.group(2)

    blobs = []

    def tok(mo):
        kind, sub, b64 = mo.group(1), mo.group(2), mo.group(3)
        data = base64.b64decode(b64)
        idx = len(blobs)
        blobs.append({'mime': f'{kind}/{sub}', 'data': data})
        return f'__DATA_{idx}__'

    tokenized = DATA_RE.sub(tok, cfg_src)
    if not blobs:
        print('cfg: no data URIs left')
        return html
    cfg = json.loads(tokenized)

    written = {}

    def resolve(s, target_rel):
        if not isinstance(s, str):
            return s
        mo = re.fullmatch(r'__DATA_(\d+)__', s)
        if not mo:
            return s
        blob = blobs[int(mo.group(1))]
        ext = EXT.get(blob['mime'], blob['mime'].split('/')[-1])
        rel = target_rel + '.' + ext
        path = os.path.join(ROOT, rel)
        if rel not in written:
            write(path, blob['data'], dry)
            written[rel] = True
        return rel

    for theme in ('b', 'd'):
        desk = cfg['desk'][theme]
        desk['bare'] = resolve(desk['bare'], f'assets/desk/{theme}-bare')
        for key, spr in desk['spr'].items():
            spr['src'] = resolve(spr['src'], f'assets/desk/{theme}-{key}')

    for key in list(cfg['A'].keys()):
        cfg['A'][key] = resolve(cfg['A'][key], f'assets/evidence/{key}')

    new_cfg = json.dumps(cfg, ensure_ascii=False, separators=(',', ':'))
    leftover = DATA_RE.search(au_src)
    if leftover:
        raise SystemExit('AU still has inline data; extend this script')
    print(f'cfg: {len(blobs)} blobs -> {len(written)} files')
    print(f'cfg: {len(cfg_src):,} -> {len(new_cfg):,} chars')
    return html[:m.start()] + f'<script>const CFG={new_cfg};const AU={au_src};</script>' + html[m.end():]


def main():
    dry = '--dry-run' in sys.argv
    with open(HTML, encoding='utf-8') as f:
        html = f.read()
    before = len(html.encode('utf-8'))
    if not DATA_RE.search(html):
        print('nothing to do: index.html has no inline data URIs')
        return
    html = extract_fonts(html, dry)
    html = extract_cfg(html, dry)
    remaining = DATA_RE.findall(html)
    if remaining:
        raise SystemExit(f'{len(remaining)} data URIs still embedded')
    after = len(html.encode('utf-8'))
    if not dry:
        with open(HTML, 'w', encoding='utf-8') as f:
            f.write(html)
    print(f'\nindex.html: {before:,} -> {after:,} bytes  ({before / after:.1f}x smaller)')


if __name__ == '__main__':
    main()
