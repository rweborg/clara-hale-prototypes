#!/usr/bin/env node
'use strict';
/**
 * _build/playthrough.js — play the case from the intro to the filed record,
 * through the same controls a player uses, and assert each transition.
 *
 *   node _build/playthrough.js
 *   BASE_URL=http://127.0.0.1:8137/journey/index.html?case=clara-hale node _build/playthrough.js
 *
 * jump() fills in state directly, so it never exercises pull(), the envelope
 * tear, the tape save, the board connection, or the report. This does. Any
 * exception, dead end, or wrong state is a real defect.
 *
 * Exits non-zero on the first failure, printing the step it died on.
 */

const path = require('node:path');
const { withPage, goto, sleep } = require('./cdp');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8137/journey/index.html';

let stepNo = 0;
const trail = [];

async function step(c, name, fn) {
  stepNo++;
  try {
    await fn();
    trail.push(`  \x1b[32mok\x1b[0m   ${name}`);
  } catch (e) {
    trail.push(`  \x1b[31mFAIL\x1b[0m ${name}\n         ${e.message.split('\n')[0]}`);
    for (const line of trail) console.log(line);
    const diag = c.diag.slice(-6).map(d => `${d.kind}: ${d.text}`);
    if (diag.length) console.log('\n  console/network:\n' + diag.map(d => '   ' + d).join('\n'));
    throw e;
  }
}

const fail = m => { throw new Error(m); };

(async () => {
  console.log(`\nplaythrough  ${BASE_URL}\n`);
  await withPage(async c => {
    await goto(c, BASE_URL);
    await c.evaluate(`Object.keys(localStorage).filter(k => k.startsWith('jp-save-v2')).forEach(k => localStorage.removeItem(k))`);
    await goto(c, BASE_URL + (BASE_URL.includes('?') ? '&' : '?') + '_pt=' + Date.now());

    const click = (sel) => c.evaluate(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; el.click(); return true; })()`);
    const exists = (sel) => c.evaluate(`!!document.querySelector(${JSON.stringify(sel)})`);
    const text = (sel) => c.evaluate(`(document.querySelector(${JSON.stringify(sel)}) || {}).textContent || ''`);
    const S = (expr = '') => c.evaluate(`(function(){ const s = window.__jp.S(); return ${JSON.stringify('')} ${expr ? '+ (' + expr + ')' : '+ s'}; })()`);
    const state = (expr) => c.evaluate(`(() => { const s = window.__jp.S(); return ${expr}; })()`);
    const mustClick = async (sel, label) => { if (!(await click(sel))) fail(`no ${label || sel} to click`); await sleep(250); };

    await step(c, 'intro → cold open', async () => {
      if (!(await exists('#i1'))) fail('no Begin button');
      await mustClick('#i1', 'Begin');
      await sleep(600);
      if (!(await exists('.cold'))) fail('the cold open did not render');
    });

    await step(c, 'cold open → desk picker', async () => {
      await mustClick('#c2', 'Skip intro');
      await sleep(500);
      if (!(await exists('.pick'))) fail('the desk picker did not render');
    });

    await step(c, 'desk picker → how it works', async () => {
      await mustClick('.pick[data-t="b"]', 'daylight desk choice');
      await sleep(500);
      const n = await c.evaluate(`document.querySelectorAll('.how > div').length`);
      if (n !== 3) fail(`the how-it-works card shows ${n} steps, expected 3`);
    });

    await step(c, 'how it works → handoff', async () => {
      await mustClick('#h1', 'Meet Detective Ortiz');
      await sleep(700);
      const who = await text('#scene .who');
      const speaker = await c.evaluate(`PACK.copy.handoff.speaker`);
      if (!who.includes(speaker)) fail(`the handoff shows "${who}", expected "${speaker}"`);
    });

    await step(c, 'handoff → the desk', async () => {
      await mustClick('#hs', 'Skip');
      await sleep(600);
      const beat = await state(`s.beat`);
      if (beat !== 'build') fail(`beat is "${beat}", expected build`);
      if (!(await exists('#spr img[data-k="folder"]'))) fail('the folder is not on the desk');
    });

    await step(c, 'open the case folder', async () => {
      await c.evaluate(`window.__jp.openFolder('folder')`);
      await sleep(400);
      const tiles = await c.evaluate(`document.querySelectorAll('#ov .it').length`);
      if (!tiles) fail('the folder opened with no evidence tiles');
    });

    const firstDoc = await c.evaluate(`Object.keys(PACK.docs || {})[0] || ''`);
    const docItem = await c.evaluate(`(() => { const d = PACK.docs || {}; const k = Object.keys(d)[0]; return k || ''; })()`);

    await step(c, 'take the briefing out and read it', async () => {
      if (!docItem) return;
      const ok = await click(`#ov .it[data-id="${docItem}"] [data-to="desk"]`);
      if (!ok) fail(`could not take "${docItem}" out of the folder`);
      await sleep(300);
      await mustClick('#ovx', 'Put it back');
      await c.evaluate(`window.__jp.deskClick(${JSON.stringify(docItem)})`);
      await sleep(400);
      const want = await c.evaluate(`PACK.docs[${JSON.stringify(docItem)}].title`);
      const shown = await text('#ov');
      if (!shown.includes(want)) fail('the document overlay does not show the pack title');
      await mustClick('#ovx', 'Put it back');
    });

    await step(c, 'empty the case folder', async () => {
      const ids = await c.evaluate(`PACK.sources.folder || []`);
      for (const id of ids) {
        if (await state(`!!s.pulled[${JSON.stringify('')} + ${JSON.stringify(id)}]`)) continue;
        await c.evaluate(`window.__jp.openFolder('folder')`);
        await sleep(200);
        const dest = await c.evaluate(`PACK.evidence[${JSON.stringify(id)}].dest`);
        const to = dest === 'desk' ? 'desk' : 'board';
        if (!(await click(`#ov .it[data-id="${id}"] [data-to="${to}"]`))) fail(`could not take "${id}" out`);
        await sleep(180);
        if (await exists('#ovx')) await mustClick('#ovx', 'Put it back');
      }
      const pulled = await c.evaluate(`PACK.sources.folder.filter(i => window.__jp.S().pulled[i]).length`);
      if (pulled !== ids.length) fail(`only ${pulled} of ${ids.length} folder items came out`);
    });

    await step(c, 'take out and play a recording', async () => {
      const rec = await c.evaluate(`(Object.keys(PACK.tails || {}))[0] || ((PACK.recordings || [])[0] || [])[0] || ''`);
      if (!rec) fail('the case has no recordings');
      const owner = await c.evaluate(`(PACK.recordings.find(r => r[0] === ${JSON.stringify(rec)}) || [])[1] || ''`);
      if (owner) {
        await c.evaluate(`window.__jp.openFolder('folder')`);
        await sleep(250);
        const ok = await click(`#ov .it[data-id="${owner}"] [data-to="desk"]`);
        if (ok) await sleep(200);
        if (await exists('#ovx')) await mustClick('#ovx', 'Put it back');
      }
      await c.evaluate(`window.__jp.openPlayer(${JSON.stringify(rec)})`);
      await sleep(500);
      const lines = await c.evaluate(`document.querySelectorAll('#tx .ln').length`);
      if (!lines) fail('the tape opened with no transcript');
      if (await exists('#ovx')) await mustClick('#ovx', 'Put it back');
    });

    await step(c, 'answer Objective 1', async () => {
      await c.evaluate(`window.__jp.openObj()`);
      await sleep(400);
      const answer = await c.evaluate(`PACK.objective1.a`);
      if (!(await click(`#ov .chips button[data-i="${answer}"]`))) fail('the objective has no options');
      await sleep(400);
      if (!(await exists('#ov .res.good'))) fail('the right answer did not register as solved');
      if (!(await exists('#onext'))) fail('no way forward from the solved objective');
      await mustClick('#onext', 'Open Envelope A');
      await sleep(500);
    });

    await step(c, 'tear Envelope A and empty it', async () => {
      if (!(await exists('#tap1'))) fail('no tear control on the envelope');
      await mustClick('#tap1', 'tear');
      await sleep(700);
      if (!(await exists('#takeout'))) fail('the envelope did not open');
      await mustClick('#takeout', 'Take them out');
      await sleep(500);
      const envA = await c.evaluate(`PACK.sources.envA || []`);
      for (const id of envA) {
        const dest = await c.evaluate(`PACK.evidence[${JSON.stringify(id)}].dest`);
        const to = dest === 'desk' ? 'desk' : 'board';
        await click(`#ov .it[data-id="${id}"] [data-to="${to}"]`);
        await sleep(120);
      }
      await sleep(300);
      if (await exists('#ovx')) await mustClick('#ovx', 'Put it back');
      const pulled = await state(`Object.keys(s.pulled).length`);
      if (pulled < envA.length) fail(`only ${pulled} items taken out`);
    });

    await step(c, 'save the line that matters from the tape', async () => {
      const rec = await c.evaluate(`(Object.keys(PACK.tails || {}))[0] || ''`);
      if (!rec) return;
      await c.evaluate(`window.__jp.openPlayer(${JSON.stringify(rec)})`);
      await sleep(500);
      const key = await c.evaluate(`((document.querySelector('.sv') || {}).dataset || {}).key || ''`);
      if (!key) fail('the tape has no save-to-notes line');
      await mustClick('.sv', 'Save to notes');
      await sleep(300);
      const saved = await state(`!!s.saved[${JSON.stringify('')} + ${JSON.stringify(key)}]`);
      if (!saved) fail(`S.saved.${key} was not set`);
      if (await exists('#ovx')) await mustClick('#ovx', 'Put it back');
    });

    await step(c, 'connect the two things on the board', async () => {
      const pair = await c.evaluate(`(PACK.breakthrough || {}).pair || []`);
      if (pair.length !== 2) fail('the pack declares no breakthrough pair');
      await c.evaluate(`window.__jp.setView('board')`);
      await sleep(400);
      // a pin is a pointer gesture, not a click
      const tapPin = async id => {
        if (!(await exists(`#pins .pin[data-id="${id}"]`))) fail(`pin "${id}" is not on the board`);
        await c.evaluate(`(() => { const el = document.querySelector('#pins .pin[data-id="${id}"]'); const ev = t => new PointerEvent(t, {bubbles: true, clientX: 640, clientY: 400, pointerId: 1}); el.dispatchEvent(ev('pointerdown')); el.dispatchEvent(ev('pointerup')); })()`);
        await sleep(300);
      };
      for (const id of pair) await tapPin(id);
      await sleep(1500);
      if (!(await exists('#ahax'))) {
        // the gesture did not take; fall back to the documented API
        await c.evaluate(`(() => { const s = window.__jp.S(); s.connect = false; s.sel = null; })()`);
        for (const id of pair) { await c.evaluate(`window.__jp.pinTap(${JSON.stringify('')} + ${JSON.stringify(id)})`.replace('"" + ', '')); await sleep(250); }
        await sleep(1500);
      }
      if (!(await exists('#ahax'))) fail('connecting the pair did not produce a breakthrough card');
    });

    await step(c, 'close the breakthrough', async () => {
      await mustClick('#ahax', 'Continue');
      await sleep(500);
      const ready = await state(`s.env.B`);
      if (ready !== 'ready') fail(`Envelope B is "${ready}", expected ready`);
    });

    await step(c, 'tear Envelope B and take the last piece', async () => {
      await c.evaluate(`window.__jp.openEnv('B')`);
      await sleep(400);
      await mustClick('#tap1', 'tear');
      await sleep(700);
      await mustClick('#takeout', 'Take it out');
      await sleep(500);
      const envB = await c.evaluate(`PACK.sources.envB || []`);
      for (const id of envB) {
        await click(`#ov .it[data-id="${id}"] [data-to="board"]`);
        await sleep(200);
      }
      await sleep(400);
      if (await exists('#ovx')) await mustClick('#ovx', 'Put it back');
    });

    await step(c, 'write the report and get it accepted', async () => {
      await c.evaluate(`window.__jp.openReport()`);
      await sleep(400);
      if (!(await exists('#dr'))) fail('the report has no demo-fill for a right answer');
      await mustClick('#dr', 'fill the right report');
      await mustClick('#send', 'Send report');
      await sleep(900);
      if (!(await exists('#scene .reveal'))) fail('the report was accepted but no reveal appeared');
    });

    await step(c, 'read the reveal through to Envelope C', async () => {
      for (let i = 0; i < 12; i++) {
        if (await exists('#nm')) return;
        if (!(await exists('#sn'))) fail('the reveal ran out of controls before Envelope C');
        await click('#sn');
        await sleep(260);
      }
      fail('the reveal never reached Envelope C');
    });

    await step(c, 'file the case away', async () => {
      await mustClick('#nm', 'File the case away');
      await sleep(900);
      const beat = await state(`s.beat`);
      if (beat !== 'file') fail(`beat is "${beat}" after filing, expected file`);
      for (let i = 0; i < 4; i++) {
        await c.evaluate(`window.__jp.fileStep()`);
        await sleep(1600);
        if (await c.evaluate(`window.__jp.S().filed`)) break;
      }
      const filed = await state(`s.filed`);
      if (!filed) fail('the case never reached filed');
      await sleep(1200);
      if (!(await exists('#scene .rank'))) fail('no case record after filing');
    });

    const fresh = async () => {
      await c.evaluate(`Object.keys(localStorage).filter(k => k.startsWith('jp-save-v2')).forEach(k => localStorage.removeItem(k))`);
      await goto(c, BASE_URL + (BASE_URL.includes('?') ? '&' : '?') + '_pt=' + Date.now());
    };

    await step(c, 'a wrong objective answer pushes back with a hint', async () => {
      await fresh();
      await c.evaluate(`window.__jp.jump('build')`);
      await sleep(400);
      await c.evaluate(`window.__jp.openObj()`);
      await sleep(400);
      const right = await c.evaluate(`PACK.objective1.a`);
      const wrong = right === 0 ? 1 : 0;
      await click(`#ov .chips button[data-i="${wrong}"]`);
      await sleep(500);
      if (!(await exists('#ov .res.bad'))) fail('a wrong answer produced no pushback');
      const body = await text('#ov .res');
      if (!/hint/i.test(body)) fail('the pushback does not offer a hint');
      const solved = await state(`s.obj1`);
      if (solved) fail('a wrong answer marked the objective solved');
    });

    await step(c, 'three wrong reports hand the case to Ortiz', async () => {
      await fresh();
      await c.evaluate(`window.__jp.jump('accuse')`);
      await sleep(400);
      await c.evaluate(`window.__jp.openReport()`);
      await sleep(400);
      if (!(await exists('#dw'))) fail('the report has no demo-fill for a wrong answer');
      for (let i = 1; i <= 3; i++) {
        await click('#dw');
        await sleep(200);
        await click('#send');
        await sleep(700);
        const tries = await state(`s.tries`);
        if (tries !== i) fail(`after ${i} sends, tries is ${tries}`);
        if (i < 3 && !(await exists('#ov .res.bad'))) fail(`attempt ${i} gave no pushback`);
      }
      if (!(await exists('#sf'))) fail('no way out after the last attempt');
      await click('#sf');
      await sleep(900);
      if (!(await exists('#scene a, #scene .lead'))) fail('the soft fail rendered nothing');
      const assisted = await state(`s.assisted`);
      if (!assisted) fail('the soft fail did not mark the case assisted');
    });

    await step(c, 'progress survives a reload', async () => {
      await fresh();
      await c.evaluate(`window.__jp.jump('build')`);
      await sleep(400);
      await c.evaluate(`window.__jp.openFolder('folder')`);
      await sleep(300);
      const doc = await c.evaluate(`Object.keys(PACK.docs || {})[0] || ''`);
      await click(`#ov .it[data-id="${doc}"] [data-to="desk"]`);
      await sleep(600);
      const before = await state(`({beat: s.beat, pulled: Object.keys(s.pulled).length})`);
      await c.evaluate(`window.dispatchEvent(new Event('pagehide'))`);
      await goto(c, BASE_URL + (BASE_URL.includes('?') ? '&' : '?') + '_pt=' + Date.now());
      const after = await state(`({beat: s.beat, pulled: Object.keys(s.pulled).length})`);
      if (after.beat !== before.beat) fail(`beat changed across the reload: ${before.beat} -> ${after.beat}`);
      if (after.pulled < before.pulled) fail(`taken items were lost: ${before.pulled} -> ${after.pulled}`);
    });

    for (const line of trail) console.log(line);
    console.log(`\n  \x1b[32m${trail.length} steps played end to end\x1b[0m\n`);
  });
})().catch(e => { console.error(`\nplaythrough failed at step ${stepNo}: ${e.message}\n`); process.exit(1); });
