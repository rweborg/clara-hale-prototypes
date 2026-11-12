#!/usr/bin/env node
'use strict';
/**
 * _build/smoke.js — headless smoke + consistency suite for the journey player.
 *
 *   node _build/smoke.js                 # http://127.0.0.1:8137/journey/index.html
 *   BASE_URL=… node _build/smoke.js
 *   node _build/smoke.js --shots         # write screenshots to _build/out/
 *   node _build/smoke.js --verbose
 *
 * Exit code 1 on any failure, so it can gate a commit or CI.
 * No npm dependencies; see _build/cdp.js for the browser plumbing.
 */

const fs = require('node:fs');
const path = require('node:path');
const { launch, newPage, goto, reload, viewport, sleep } = require('./cdp');

const OUT = path.join(__dirname, 'out');
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8137/journey/index.html';
const WANT_SHOTS = process.argv.includes('--shots');
const VERBOSE = process.argv.includes('--verbose');

const results = [];
let failures = 0;
let CX = null;

async function step(name, fn) {
  const before = CX.diag.length;
  let problems = [];
  try {
    const r = await fn();
    if (Array.isArray(r)) problems = r;
  } catch (e) {
    problems = [e.message.split('\n')[0]];
  }
  const diag = CX.diag.slice(before);
  if (diag.length) problems = problems.concat(diag.map(d => `${d.kind}: ${d.text}`));
  const ok = problems.length === 0;
  if (!ok) failures++;
  results.push({ name, ok, problems });
  console.log(`  ${ok ? '\x1b[32m ok \x1b[0m' : '\x1b[31mFAIL\x1b[0m'}  ${name}`);
  for (const p of problems.slice(0, 12)) console.log(`        ${p}`);
  if (problems.length > 12) console.log(`        … ${problems.length - 12} more`);
  if (VERBOSE && ok) console.log('        clean');
  return problems;
}

const shot = (c, name) => WANT_SHOTS ? c.shot(path.join(OUT, `${name}.png`)) : null;

/**
 * Reload with a clean save so a previous test cannot leak into this one.
 * A cache-busting query guarantees a real document load: Page.reload races
 * with a stale load event, and Page.navigate to the identical URL does not
 * re-run the page at all. Built with the URL API so an existing ?case= or
 * ?preview= query survives.
 */
const bust = (url) => {
  const u = new URL(url);
  u.searchParams.set('_smoke', Date.now());
  return u.toString();
};

async function freshLoad(c, url = BASE_URL) {
  // clear every case's save, not just the default key
  await c.evaluate(`Object.keys(localStorage).filter(k => k.startsWith('jp-save-v2')).forEach(k => localStorage.removeItem(k))`).catch(() => {});
  await goto(c, bust(url));
}

const withParam = (url, key, value) => {
  const u = new URL(url);
  u.searchParams.set(key, value);
  return u.toString();
};

const MODEL_CHECK = `(() => {
  const errs = [];
  const recIds = Object.keys(TR);

  for (const src of Object.keys(SRC)) {
    for (const id of SRC[src]) if (!IT[id]) errs.push('SRC.' + src + ' lists unknown item "' + id + '"');
    if (new Set(SRC[src]).size !== SRC[src].length) errs.push('SRC.' + src + ' has duplicates');
  }
  for (const id of Object.keys(IT)) {
    if (!Object.values(SRC).some(a => a.includes(id))) errs.push('IT.' + id + ' is in no SRC list');
  }
  for (const src of Object.keys(SRC)) {
    const rv = (REVIEW[src] || []).flatMap(g => g.ids);
    const a = [...rv].sort().join('|'), b = [...SRC[src]].sort().join('|');
    if (a !== b) errs.push('REVIEW.' + src + ' does not match SRC.' + src);
    const dupes = rv.filter((v, i) => rv.indexOf(v) !== i);
    if (dupes.length) errs.push('REVIEW.' + src + ' repeats: ' + [...new Set(dupes)].join(', '));
  }
  for (const k of Object.keys(BP)) if (!IT[k]) errs.push('BP.' + k + ' is not an item');
  for (const [id, it] of Object.entries(IT)) {
    if ((it.dest === 'board' || it.dest === 'both') && !BP[id]) errs.push('item ' + id + ' is board-dest but has no BP position');
    if (it.th && !A[it.th] && !/\\p{Extended_Pictographic}/u.test(it.th)) errs.push('item ' + id + ' thumb "' + it.th + '" has no art');
    if (it.face && !A[it.face]) errs.push('item ' + id + ' face "' + it.face + '" has no art');
  }
  for (const [rid, it] of RECS) {
    if (!IT[it]) errs.push('RECS.' + rid + ' -> unknown item ' + it);
    if (!TR[rid]) errs.push('RECS.' + rid + ' has no transcript in TR');
    // audio is optional: a case without recorded lines plays as text only.
  }
  for (const k of Object.keys(FACE)) {
    if (!recIds.includes(k) && !RECS.some(r => r[0] === k)) errs.push('FACE.' + k + ' is not a recording');
    if (!A[FACE[k]]) errs.push('FACE.' + k + ' -> "' + FACE[k] + '" has no art');
  }
  for (const k of PROOF_OK) if (!IT[k]) errs.push('PROOF_OK.' + k + ' is not an item');
  for (const [id] of SUS) if (!A['p_' + id]) errs.push('SUS.' + id + ' has no portrait');
  for (const q of REPORT) {
    const ids = q.o.map(o => Array.isArray(o) ? o[0] : o);
    if (!ids.includes(q.a)) errs.push('REPORT.' + q.k + ' answer "' + q.a + '" is not one of its options');
    if (!q.push) errs.push('REPORT.' + q.k + ' has no pushback line');
  }
  if (!(OBJ1.a >= 0 && OBJ1.a < OBJ1.o.length)) errs.push('OBJ1.a is out of range');
  if (new Set(BEATS.map(b => b[0])).size !== BEATS.length) errs.push('BEATS ids are not unique');
  if (!BEATS.some(b => b[0] === 'intro')) errs.push('BEATS has no intro');
  if (!CASE.cover) errs.push('CASE.cover is empty');
  for (const [id, v] of Object.entries(BP)) {
    if (v[0] < 0 || v[0] > 1280 || v[1] < 0 || v[1] > 800) errs.push('BP.' + id + ' sits off the 1280x800 cork');
  }
  return errs;
})()`;

const ASSET_PATHS = `(() => {
  const out = new Set();
  const add = v => { if (typeof v === 'string' && v && !v.startsWith('data:') && !/^https?:/.test(v)) out.add(v); };
  for (const v of Object.values(A)) add(v);
  for (const v of Object.values(AU)) add(v);
  add(CASE.cover);
  for (const theme of Object.values(CFG.desk)) {
    add(theme.bare);
    for (const spr of Object.values(theme.spr || {})) add(spr.src);
  }
  return [...out];
})()`;

const BROKEN_IMGS = `[...document.querySelectorAll('img')]
  .filter(i => i.getAttribute('src') && i.complete && i.naturalWidth === 0)
  .map(i => (i.getAttribute('src') || '').slice(0, 100))`;

async function main() {
  if (WANT_SHOTS) fs.mkdirSync(OUT, { recursive: true });
  console.log(`\nsmoke  ${BASE_URL}\n`);

  const browser = await launch();
  const c = await newPage(browser.port);
  CX = c;

  try {
    await viewport(c, 1440, 900);

    await step('boot: loads with no console or network errors', async () => {
      await freshLoad(c);
      const info = await c.evaluate(`({
        title: document.title,
        subtitle: (document.getElementById('subtitle') || {}).textContent || '',
        brand: (window.PRODUCT && window.PRODUCT.name) || '',
        stage: !!document.querySelector('#desk, #scene'),
        jp: typeof window.__jp === 'object'
      })`);
      const bad = [];
      if (!info.stage) bad.push('no #desk or #scene in the document');
      if (!info.jp) bad.push('window.__jp was never published');
      if (!info.brand) bad.push('app/brand.js did not set window.PRODUCT');
      else {
        if (!info.title.startsWith(info.brand)) bad.push(`document.title "${info.title}" does not lead with "${info.brand}"`);
        if (!info.subtitle.includes(info.brand)) bad.push(`the header line "${info.subtitle}" does not include "${info.brand}"`);
      }
      return bad;
    });

    await step('model: case tables agree with each other', async () => {
      return await c.evaluate(MODEL_CHECK);
    });

    await step('assets: every referenced file resolves', async () => {
      const paths = await c.evaluate(ASSET_PATHS);
      const missing = await c.evaluate(`(async () => {
        const out = [];
        for (const p of ${JSON.stringify(paths)}) {
          try {
            const r = await fetch(p, { method: 'HEAD' });
            if (!r.ok) out.push(r.status + ' ' + p);
          } catch (e) { out.push('ERR ' + p); }
        }
        return out;
      })()`);
      if (VERBOSE) console.log(`        ${paths.length} paths checked`);
      return missing;
    });

    const beats = await c.evaluate('BEATS.map(b => b[0])');
    for (const beat of beats) {
      await step(`beat: ${beat} renders`, async () => {
        await c.evaluate(`window.__jp.jump(${JSON.stringify(beat)})`);
        await sleep(350);
        const s = await c.evaluate(`({ beat: window.__jp.S().beat, html: document.querySelector('#scene').innerHTML.length })`);
        const bad = [];
        if (s.beat !== beat) bad.push(`expected beat ${beat}, got ${s.beat}`);
        return bad.concat(await c.evaluate(BROKEN_IMGS));
      });
      await shot(c, `beat-${beat}`);
    }

    await step('desk: kitchen theme switches and paints', async () => {
      await freshLoad(c);
      await c.evaluate(`window.__jp.jump('build')`);
      await sleep(300);
      await c.evaluate(`document.querySelector('#dz [data-theme="d"]').click()`);
      await sleep(800);
      const r = await c.evaluate(`({
        cls: document.body.className,
        ls: localStorage.getItem('jp-theme'),
        sprites: document.querySelectorAll('#spr img').length
      })`);
      const bad = [];
      if (!/\bth-d\b/.test(r.cls)) bad.push(`body class is "${r.cls}", expected th-d`);
      if (r.ls !== 'd') bad.push(`jp-theme is "${r.ls}", expected d`);
      if (!r.sprites) bad.push('the kitchen desk painted no sprites');
      return bad.concat(await c.evaluate(BROKEN_IMGS));
    });
    await shot(c, 'desk-kitchen');

    await step('desk: the chosen theme survives a reload', async () => {
      await goto(c, bust(BASE_URL));
      const r = await c.evaluate(`({ cls: document.body.className, theme: window.__jp.S().theme })`);
      const bad = [];
      if (!/\bth-d\b/.test(r.cls)) bad.push(`after reload the body class is "${r.cls}" (S.theme=${r.theme})`);
      return bad;
    });

    await step('desk: daylight theme switches back', async () => {
      await c.evaluate(`document.querySelector('#dz [data-theme="b"]').click()`);
      await sleep(800);
      const r = await c.evaluate(`({ cls: document.body.className, ls: localStorage.getItem('jp-theme') })`);
      const bad = [];
      if (!/\bth-b\b/.test(r.cls)) bad.push(`body class is "${r.cls}", expected th-b`);
      return bad.concat(await c.evaluate(BROKEN_IMGS));
    });
    await shot(c, 'desk-daylight');

    await step('folder: opens with tiles and a review order', async () => {
      const r = await c.evaluate(`(() => {
        window.__jp.jump('build');
        window.__jp.openFolder('folder');
        return { tiles: document.querySelectorAll('#ov .it').length, order: document.querySelectorAll('#ov .order span, #ov .order b').length };
      })()`);
      await sleep(300);
      const bad = [];
      if (!r.tiles) bad.push('the case folder opened with no evidence tiles');
      return bad;
    });
    await shot(c, 'folder-open');

    await step('board: cork and pins render', async () => {
      await c.evaluate(`window.__jp.setView('board')`);
      await sleep(400);
      const r = await c.evaluate(`({
        pins: document.querySelectorAll('#pins .pin').length,
        cork: document.querySelector('#cork').naturalWidth
      })`);
      const bad = [];
      if (!r.cork) bad.push('the cork photograph did not decode');
      return bad;
    });
    await shot(c, 'board');

    await step('preview: scrubber present and stages exist', async () => {
      await freshLoad(c, withParam(BASE_URL, 'preview', '1'));
      const r = await c.evaluate(`({
        bar: !document.querySelector('#pv').hidden,
        stages: window.__jp.previewState().n
      })`);
      const bad = [];
      if (!r.bar) bad.push('?preview=1 did not show the scrubber');
      if (!r.stages) bad.push('preview has no stages');
      return bad;
    });

    await step('preview: every stage walks clean', async () => {
      const n = await c.evaluate(`window.__jp.previewState().n`);
      const bad = [];
      for (let i = 0; i < n; i++) {
        const before = c.diag.length;
        await c.evaluate(`window.__jp.previewGoto(${i})`);
        await sleep(220);
        const errs = c.diag.slice(before).filter(d => d.kind === 'exception');
        for (const e of errs) bad.push(`stage ${i}: ${e.text.split('\n')[0]}`);
      }
      return bad;
    });
    await shot(c, 'preview');

    await step('tape: transcript renders and save-to-notes works', async () => {
      await freshLoad(c);
      await c.evaluate(`window.__jp.jump('realize')`);
      await sleep(250);
      const bad = [];
      const rid = await c.evaluate(`(Object.keys(PACK.tails || {}))[0] || ((PACK.recordings || [])[0] || [])[0] || ''`);
      if (!rid) return ['the case has no recordings'];
      await c.evaluate(`window.__jp.openPlayer(${JSON.stringify('')} + ${JSON.stringify(rid)})`);
      await sleep(500);
      const lines = await c.evaluate(`document.querySelectorAll('#tx .ln').length`);
      if (!lines) bad.push('the transcript rendered no lines');
      const key = await c.evaluate(`((document.querySelector('.sv') || {}).dataset || {}).key || ''`);
      if (key) {
        await c.evaluate(`document.querySelector('.sv').click()`);
        await sleep(250);
        const saved = await c.evaluate(`!!window.__jp.S().saved[${JSON.stringify('')} + ${JSON.stringify(key)}]`);
        if (!saved) bad.push(`save-to-notes did not record S.saved.${key}`);
        const inNotes = await c.evaluate(`window.__jp.S().notes.some(n => n.t)`);
        if (!inNotes) bad.push('save-to-notes added no note');
      }
      return bad;
    });

    await step('opening and objective read the case copy', async () => {
      await freshLoad(c);
      const bad = [];
      const H = await c.evaluate(`PACK.copy.handoff`);
      await c.evaluate(`window.__jp.jump('handoff')`);
      await sleep(600);
      const who = await c.evaluate(`(document.querySelector('#scene .who') || {}).textContent || ''`);
      if (!who.includes(H.speaker)) bad.push(`the handoff did not print copy.handoff.speaker (saw "${who}")`);

      await c.evaluate(`window.__jp.jump('build')`);
      await sleep(300);
      const D = await c.evaluate(`PACK.docs.briefing`);
      await c.evaluate(`window.__jp.deskClick('briefing')`);
      await sleep(400);
      const docTxt = await c.evaluate(`document.querySelector('#ov').textContent`);
      if (!docTxt.includes(D.title)) bad.push('the briefing did not print docs.briefing.title');

      const O = await c.evaluate(`PACK.copy.objective1`);
      await c.evaluate(`window.__jp.openObj()`);
      await sleep(300);
      const objTxt = await c.evaluate(`document.querySelector('#ov').textContent`);
      if (!objTxt.includes(O.kicker)) bad.push('the objective did not print copy.objective1.kicker');
      if (!objTxt.includes(O.sub)) bad.push('the objective did not print copy.objective1.sub');
      return bad;
    });

    await step('preview: Play advances and keeps playing', async () => {
      await freshLoad(c, withParam(BASE_URL, 'preview', '1'));
      await c.evaluate(`window.__jp.previewGoto(0)`);
      await sleep(300);
      await c.evaluate(`window.__jp.previewPlay()`);
      await sleep(6500);
      const st = await c.evaluate(`window.__jp.previewState()`);
      await c.evaluate(`window.__jp.previewPause()`);
      const bad = [];
      if (st.index === 0) bad.push('Play never advanced past the first stop');
      if (!st.playing) bad.push('a stage stopped the walk instead of letting it play on');
      return bad;
    });

    await step('endgame: reveal, soft-fail, and rank read the case copy', async () => {
      await freshLoad(c);
      const copy = await c.evaluate(`PACK.copy`);
      const bad = [];
      await c.evaluate(`window.__jp.jump('accuse')`);
      await c.evaluate(`reveal()`);
      await sleep(400);
      const revealTxt = await c.evaluate(`document.querySelector('#scene').textContent`);
      if (!revealTxt.includes(copy.reveal.who)) bad.push('the reveal did not print copy.reveal.who');
      if (copy.reveal.lead && !revealTxt.includes(copy.reveal.lead.slice(0, 40))) bad.push('the reveal did not print copy.reveal.lead');
      await c.evaluate(`softFail()`);
      await sleep(250);
      const softTxt = await c.evaluate(`document.querySelector('#scene').textContent`);
      if (!softTxt.includes(copy.softFail.bullets[0].slice(0, 30))) bad.push('the soft fail did not print the pack bullets');
      await c.evaluate(`S.assisted = false`);
      await c.evaluate(`rankCard()`);
      await sleep(250);
      const rankTxt = await c.evaluate(`document.querySelector('#scene').textContent`);
      if (!rankTxt.includes(copy.rank.solved)) bad.push('the rank card did not print copy.rank.solved');
      return bad;
    });

    await step('player view: no dev tools, no way to skip the case', async () => {
      await viewport(c, 1440, 900, false);
      await freshLoad(c, withParam(BASE_URL, 'dev', '0'));
      await c.evaluate(`window.__jp.jump('accuse')`);
      await sleep(400);
      const r = await c.evaluate(`({
        dev: window.__jp.dev(),
        railButtons: document.querySelectorAll('#rail button').length,
        railSteps: document.querySelectorAll('#rail .bt').length,
        devtoolsShown: !!(document.querySelector('#devtools') && document.querySelector('#devtools').offsetParent !== null),
        label: (document.querySelector('#dzb') || {}).textContent || ''
      })`);
      await c.evaluate(`window.__jp.openObj()`); await sleep(250);
      const objDemo = await c.evaluate(`document.querySelectorAll('#ov .demo').length`);
      await c.evaluate(`document.querySelector('#ov') && (document.querySelector('#ov').hidden = true)`);
      await c.evaluate(`window.__jp.openReport()`); await sleep(250);
      const repDemo = await c.evaluate(`document.querySelectorAll('#ov .demo').length`);
      const bad = [];
      if (r.dev) bad.push('?dev=0 still reports dev mode');
      if (r.railButtons) bad.push(`the beat rail has ${r.railButtons} clickable buttons for players`);
      if (!r.railSteps) bad.push('the beat rail shows no progress at all');
      if (r.devtoolsShown) bad.push('dev tools are visible to players');
      if (!/Settings/.test(r.label)) bad.push(`the gear button says "${r.label.trim()}", not Settings`);
      if (objDemo) bad.push('Objective 1 shows demo answer links to players');
      if (repDemo) bad.push('the report shows demo fill links to players');
      return bad;
    });

    await step('images: every image has alt text (empty only when decorative)', async () => {
      await viewport(c, 1440, 900, false);
      await freshLoad(c);
      const bad = [];
      for (const beat of ['build', 'realize', 'accuse']) {
        await c.evaluate(`window.__jp.jump(${JSON.stringify(beat)})`); await sleep(350);
        for (const v of ['desk', 'board']) {
          await c.evaluate(`window.__jp.setView(${JSON.stringify(v)})`); await sleep(250);
          const miss = await c.evaluate(`[...document.querySelectorAll('img')].filter(i => !i.hasAttribute('alt')).map(i => (i.getAttribute('src') || '').split('/').pop().split('?')[0])`);
          for (const m of miss) bad.push(`${beat}/${v}: <img> with no alt attribute (${m})`);
        }
      }
      return [...new Set(bad)];
    });

    await step('folder: both pages are real pages, no stray text', async () => {
      await viewport(c, 1536, 864, false);
      await freshLoad(c);
      await c.evaluate(`window.__jp.jump('build')`); await sleep(300);
      await c.evaluate(`window.__jp.openFolder('folder')`); await sleep(500);
      const r = await c.evaluate(`(() => { const f = document.querySelector('#ov .fold'); if (!f) return null;
        const lp = f.querySelector('.lp').getBoundingClientRect().width, rp = f.querySelector('.rp').getBoundingClientRect().width, w = f.getBoundingClientRect().width;
        const stray = [...f.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim()).map(n => n.textContent.trim().slice(0, 40));
        return { lp: lp / w, rp: rp / w, stray, index: f.querySelectorAll('.lp .inv li').length, cards: f.querySelectorAll('.rp .it').length }; })()`);
      const bad = [];
      if (!r) return ['the folder did not open'];
      if (r.stray.length) bad.push(`stray text inside the folder: ${r.stray.join(' | ')}`);
      if (r.rp < 0.4 || r.lp < 0.3) bad.push(`folder pages are lopsided: left ${(r.lp * 100) | 0}%, right ${(r.rp * 100) | 0}%`);
      if (!r.index) bad.push('the index sheet lists nothing');
      if (!r.cards) bad.push('the evidence page shows no cards');
      return bad;
    });

    await step('desk: labels hide until hover, and the UI has no emoji', async () => {
      await viewport(c, 1440, 900, false);
      await freshLoad(c, withParam(BASE_URL, 'dev', '0'));
      await c.evaluate(`window.__jp.jump('envA')`); await sleep(600);
      const r = await c.evaluate(`(() => {
        const shown = [...document.querySelectorAll('.hot .tag')].filter(t => parseFloat(getComputedStyle(t).opacity) > 0.5).length;
        const emo = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
        const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const hits = [];
        while (walk.nextNode()) { const t = walk.currentNode.textContent.replace(/[\u2713\u2714]/g, ''); const el = walk.currentNode.parentElement;
          if (emo.test(t) && el && el.offsetParent !== null && !el.closest('#pv')) hits.push(t.trim().slice(0, 30)); }
        return { tags: document.querySelectorAll('.hot .tag').length, shown, hits: hits.slice(0, 5) }; })()`);
      const bad = [];
      if (!r.tags) bad.push('the desk has no labels at all');
      if (r.shown) bad.push(`${r.shown} desk labels are visible without hovering`);
      if (r.hits.length) bad.push(`emoji in the UI: ${r.hits.join(' | ')}`);
      return bad;
    });

    await step('help level: Standard is clean, More help adds the nudges', async () => {
      await viewport(c, 1440, 900, false);
      await freshLoad(c);
      await c.evaluate(`window.__jp.jump('build')`); await sleep(400);
      const std = await c.evaluate(`({ level: window.__jp.help().level, whisper: !document.querySelector('#whisper').hidden, tries: window.__jp.help().reportTries,
        btns: document.querySelectorAll('#helprow button').length })`);
      await c.evaluate(`window.__jp.setLevel('beginner')`); await sleep(300);
      const beg = await c.evaluate(`({ level: window.__jp.help().level, whisper: !document.querySelector('#whisper').hidden, tries: window.__jp.help().reportTries, helped: window.__jp.S().helped })`);
      await c.evaluate(`window.__jp.openFolder('folder')`); await sleep(300);
      await c.evaluate(`document.querySelector('#ov [data-to]') && document.querySelector('#ov [data-to]').click()`); await sleep(300);
      await c.evaluate(`window.__jp.setLevel('advanced')`); await sleep(300);
      const after = await c.evaluate(`window.__jp.help().level`);
      const bad = [];
      if (std.level !== 'standard') bad.push(`Clara should play at standard, got ${std.level}`);
      if (std.whisper) bad.push('Standard shows the desk whisper (one guidance voice only)');
      if (std.tries !== 3) bad.push(`Standard report attempts should be 3, got ${std.tries}`);
      if (std.btns !== 3) bad.push(`Settings shows ${std.btns} help buttons, expected 3`);
      if (beg.level !== 'beginner' || !beg.whisper) bad.push('More help did not turn on the desk whisper');
      if (beg.tries !== 5) bad.push(`More help report attempts should be 5, got ${beg.tries}`);
      if (!beg.helped) bad.push('turning on More help is not recorded for the case record');
      if (after !== 'beginner') bad.push('help could be turned down mid-case');
      return bad;
    });

    await step('mobile: 390x844 does not overflow', async () => {
      await viewport(c, 390, 844, true);
      await freshLoad(c);
      await c.evaluate(`window.__jp.jump('build')`);
      await sleep(600);
      const r = await c.evaluate(`({
        scrollW: document.documentElement.scrollWidth,
        innerW: window.innerWidth,
        sheet: !!document.querySelector('#sheetb')
      })`);
      const bad = [];
      if (r.scrollW > r.innerW + 2) bad.push(`horizontal overflow: ${r.scrollW} > ${r.innerW}`);
      if (!r.sheet) bad.push('no bottom-sheet control (#sheetb) at phone width');
      return bad;
    });
    await shot(c, 'mobile');

  } finally {
    c.close();
    browser.proc.kill();
    try { fs.rmSync(browser.profile, { recursive: true, force: true }); } catch (e) {}
  }

  const passed = results.length - failures;
  console.log(`\n  ${passed}/${results.length} checks passed${failures ? `, \x1b[31m${failures} failed\x1b[0m` : ''}`);
  if (WANT_SHOTS) console.log(`  screenshots -> ${path.relative(process.cwd(), OUT)}`);
  console.log('');
  process.exit(failures ? 1 : 0);
}

main().catch(e => { console.error('\nsmoke crashed:', e); process.exit(2); });
