#!/usr/bin/env node
'use strict';
/**
 * _build/lint.js — keeps the design system the thing the game actually uses.
 *
 *   node _build/lint.js
 *
 * Fails when:
 *   - app/player.css has a raw hex color, or a px font size outside clamp(). Use a token.
 *   - a var(--ds-…) used by the player is not defined in design-system/tokens.css.
 *   - an @font-face names its family with var() (that silently breaks the font).
 *   - an inline style="…" in app/player.js has a hex color or a px font size.
 *   - app/player.js grows past its inline-style budget (lower the budget as styles move to classes).
 *   - a text pair in the tokens is under WCAG AA (4.5:1).
 *   - index.html stops loading tokens.css before player.css.
 * No npm dependencies.
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const css = read('app/player.css');
const js = read('app/player.js');
const tokens = read('design-system/tokens.css');
const html = read('index.html');

const INLINE_STYLE_BUDGET = 44;   // lower this as inline styles move into player.css; never raise it

const errors = [];
const lineOf = (src, i) => src.slice(0, i).split('\n').length;

// 1. no raw colors or off-scale type in the stylesheet
for (const m of css.matchAll(/#[0-9A-Fa-f]{3,8}\b/g)) errors.push(`player.css:${lineOf(css, m.index)} raw color ${m[0]}: use a --ds- token`);
for (const m of css.matchAll(/font(?:-size)?:([^;}]*)/g)) {
  const v = m[1].replace(/clamp\([^)]*\)/g, '');
  if (/\b[0-9.]+px\b/.test(v.split('/')[0]) && !/^\s*var\(/.test(v)) {
    const px = v.match(/([0-9.]+)px/);
    if (px && !/var\(--ds-fs-/.test(v)) errors.push(`player.css:${lineOf(css, m.index)} font size ${px[0]}: use a --ds-fs- step`);
  }
}
for (const m of css.matchAll(/@font-face\{font-family:\s*var\(/g)) errors.push(`player.css:${lineOf(css, m.index)} @font-face family is a var(): the font will not load`);

// 2. every token the player uses exists
const defined = new Set([...tokens.matchAll(/(--ds-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
for (const src of [['player.css', css], ['player.js', js]]) {
  for (const m of src[1].matchAll(/var\((--ds-[a-z0-9-]+)/g)) {
    if (!defined.has(m[1])) errors.push(`${src[0]}:${lineOf(src[1], m.index)} ${m[1]} is not defined in tokens.css`);
  }
}

// 3. inline styles in the engine stay token-only, and do not grow
let inline = 0;
for (const m of js.matchAll(/style="([^"]*)"/g)) {
  inline++;
  if (/#[0-9A-Fa-f]{3,8}\b/.test(m[1])) errors.push(`player.js:${lineOf(js, m.index)} inline style has a raw color: ${m[1].slice(0, 60)}`);
  if (/font(?:-size)?:\s*(?:[0-9]{3}\s+)?[0-9.]+px/.test(m[1])) errors.push(`player.js:${lineOf(js, m.index)} inline style has a px font size: ${m[1].slice(0, 60)}`);
}
if (inline > INLINE_STYLE_BUDGET) errors.push(`player.js has ${inline} inline style="" attributes; the budget is ${INLINE_STYLE_BUDGET}. Move styles into player.css classes.`);

// 4. text pairs meet AA
const hexOf = (name) => { const m = tokens.match(new RegExp(name + '\\s*:\\s*(#[0-9A-Fa-f]{3,6})')); return m && m[1]; };
const lum = (h) => { h = h.replace('#', ''); if (h.length === 3) h = [...h].map((c) => c + c).join('');
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const PAIRS = [   // [text, background] that players read
  ['--ds-ink', '--ds-paper'], ['--ds-ink-soft', '--ds-side'], ['--ds-dim', '--ds-side'], ['--ds-dim', '--ds-paper'],
  ['--ds-muted', '--ds-paper'], ['--ds-muted', '--ds-side'], ['--ds-muted', '--ds-card'], ['--ds-ink', '--ds-gold'],
  ['--ds-pine', '--ds-card'], ['--ds-copper', '--ds-card'], ['--ds-scene-ink', '--ds-scene'], ['--ds-gold', '--ds-scene'],
  ['--ds-note-ink', '--ds-note-paper'], ['--ds-bad-ink', '--ds-bad-bg'], ['--ds-ok-ink', '--ds-ok-bg'], ['--ds-white', '--ds-navy'],
  ['--ds-white', '--ds-pine'], ['--ds-white', '--ds-ink-soft']];
for (const [fg, bg] of PAIRS) {
  const a = hexOf(fg), b = hexOf(bg);
  if (!a || !b) { errors.push(`contrast pair ${fg} on ${bg}: a token is missing`); continue; }
  const r = ratio(a, b);
  if (r < 4.5) errors.push(`contrast ${fg} (${a}) on ${bg} (${b}) is ${r.toFixed(2)}:1, under AA 4.5:1`);
}

// 5. the tokens load first
const ti = html.indexOf('design-system/tokens.css'), pi = html.indexOf('app/player.css');
if (ti < 0 || pi < 0 || ti > pi) errors.push('index.html must link design-system/tokens.css before app/player.css (the player has no color fallbacks)');

console.log('\nlint  design system\n');
if (errors.length) {
  for (const e of errors) console.log(`  \x1b[31merror\x1b[0m ${e}`);
  console.log(`\n  ${errors.length} error${errors.length === 1 ? '' : 's'}\n`);
  process.exit(1);
}
console.log(`  \x1b[32mok\x1b[0m  no raw colors, type on the scale, ${defined.size} tokens, ${PAIRS.length} text pairs at AA, ${inline}/${INLINE_STYLE_BUDGET} inline styles\n`);
