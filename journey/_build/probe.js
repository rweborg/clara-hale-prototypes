#!/usr/bin/env node
'use strict';
/**
 * _build/probe.js — poke a running build in a headless browser.
 *
 *   node _build/probe.js "JSON.stringify(window.__jp.S().theme)"
 *   node _build/probe.js --url http://127.0.0.1:8137/journey/index.html?preview=1 "previewState()"
 *   node _build/probe.js --shot out.png --eval "window.__jp.jump('build')" --eval "document.body.className"
 *   node _build/probe.js --set 'jp-theme' 'd' --eval "window.__jp.S().theme"
 *
 * Each argument that is not a flag is evaluated in the page and printed.
 * Nothing here is wired into the player; it is a debugging aid.
 */

const path = require('node:path');
const { withPage, goto, sleep } = require('./cdp');

const argv = process.argv.slice(2);
const ops = [];
const shots = [];
let url = process.env.BASE_URL || 'http://127.0.0.1:8137/journey/index.html';
let view = null;
let setKv = null;
let wait = 250;

for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--url') url = argv[++i];
  else if (a === '--eval') ops.push({ kind: 'eval', src: argv[++i] });
  else if (a === '--exec') ops.push({ kind: 'exec', src: argv[++i] });
  else if (a === '--shot') shots.push(argv[++i]);
  else if (a === '--wait') wait = Number(argv[++i]);
  else if (a === '--viewport') { const [w, h] = argv[++i].split('x').map(Number); view = [w, h]; }
  else if (a === '--set') { setKv = [argv[++i], argv[++i]]; }
  else ops.push({ kind: 'eval', src: a });
}

if (!ops.length && !shots.length) {
  console.log('usage: node _build/probe.js [--url U] [--viewport WxH] [--set key value] [--exec stmt] [--shot f.png] "<expr>" ...');
  process.exit(0);
}

(async () => {
  await withPage(async c => {
    await goto(c, url);
    if (setKv) {
      await c.evaluate(`localStorage.setItem(${JSON.stringify(setKv[0])}, ${JSON.stringify(setKv[1])})`);
      await goto(c, url);
    }
    for (const op of ops) {
      const label = op.src.length > 90 ? op.src.slice(0, 90) + '…' : op.src;
      let out;
      try {
        out = op.kind === 'exec'
          ? await c.evaluate(`(() => { ${op.src} })()`)
          : await c.evaluate(`(async () => { const __v = await (${op.src}); return typeof __v === 'string' ? __v : JSON.stringify(__v); })()`);
      } catch (err) {
        console.log(`\n> ${label}\n  ✗ ${err.message.split('\n')[0]}`);
        continue;
      }
      console.log(`\n> ${label}`);
      console.log(out === undefined ? '  undefined' : String(out));
      await sleep(wait);
    }
    for (const s of shots) console.log(`\nshot -> ${await c.shot(path.resolve(s))}`);
    const diag = c.diag.filter(d => d.kind !== 'log');
    if (diag.length) {
      console.log('\nconsole/network noise:');
      for (const d of diag.slice(0, 20)) console.log(`  ${d.kind}: ${d.text}`);
      if (diag.length > 20) console.log(`  … ${diag.length - 20} more`);
    }
  }, { viewport: view || [1440, 900] });
})();
