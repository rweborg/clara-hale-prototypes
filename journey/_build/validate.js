#!/usr/bin/env node
'use strict';
/**
 * _build/validate.js — static checks for a case pack.
 *
 *   node _build/validate.js              # every case under cases/
 *   node _build/validate.js clara-hale   # one case
 *
 * No browser and no network: it evaluates the case file in a sandbox, then
 * checks that the tables agree with each other and that every file they point
 * at exists on disk. Exit code 1 on any error, so it works in CI and pre-commit.
 *
 * This is the contract a new case has to satisfy. Read _build/README.md.
 */

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const CASES = path.join(ROOT, 'cases');

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

function loadPack(id) {
  const file = path.join(CASES, id, 'case.js');
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
  const pack = sandbox.window.CASE_PACK;
  if (!pack) throw new Error(`${id}: case.js never set window.CASE_PACK`);
  return pack;
}

function exists(rel) {
  if (!rel || typeof rel !== 'string') return false;
  if (/^(data:|https?:)/.test(rel)) return true;
  return fs.existsSync(path.join(ROOT, rel));
}

function checkAssets(label, map) {
  for (const [k, v] of Object.entries(map || {})) {
    if (!exists(v)) err(`${label}.${k} -> missing file "${v}"`);
  }
}

function validate(id, pack) {
  const fail = (m) => err(`${id}: ${m}`);
  const soft = (m) => warn(`${id}: ${m}`);
  const COPY = pack.copy || {};

  // Unfinished copy must never ship. Player-facing text is checked by the words a writer leaves behind.
  const src = fs.readFileSync(path.join(CASES, id, 'case.js'), 'utf8');
  for (const word of ['placeholder', 'TODO', 'TBD', 'lorem ipsum', 'FIXME']) {
    const re = new RegExp(word.replace(' ', '\\s+'), 'i');
    const hit = src.split('\n').findIndex(line => re.test(line) && !/^\s*(\/\/|\/?\*)/.test(line));
    if (hit >= 0) fail(`case.js line ${hit + 1} still says "${word}": finish the copy before it ships`);
  }

  const DIFF = pack.difficulty || {};
  if (!pack.difficulty) soft('difficulty is unset: the case plays at the Standard help level');
  else if (!['beginner', 'standard', 'advanced'].includes(DIFF.preset)) fail(`difficulty.preset is "${DIFF.preset}": use beginner, standard, or advanced`);
  const KNOBS = ['whisper', 'nextButton', 'idleNudge', 'hintLimit', 'objHints', 'reviewNext', 'boardPulse', 'reportFeedback', 'reportTries', 'evidenceCount'];
  for (const k of Object.keys(DIFF.overrides || {})) if (!KNOBS.includes(k)) fail(`difficulty.overrides.${k} is not a help knob (${KNOBS.join(', ')})`);

  if (pack.id !== id) fail(`pack.id is "${pack.id}" but it lives in cases/${id}`);
  if (typeof pack.steps !== 'function') fail('steps(G) is missing — a case must supply its own hints');

  const C = pack.case || {};
  for (const k of ['title', 'kick', 'lead', 'cover']) {
    if (!C[k]) fail(`case.${k} is empty`);
  }
  if (C.cover && !exists(C.cover)) fail(`case.cover -> missing file "${C.cover}"`);

  const IT = pack.evidence || {};
  const SRC = pack.sources || {};
  const REVIEW = pack.review || {};
  const BP = pack.board || {};
  const ART = pack.art || {};
  const TR = pack.transcripts || {};
  const AU = pack.audio || {};
  const RECS = pack.recordings || [];
  const HAS_ART = (k) => ART[k] || (k && /^\p{Extended_Pictographic}/u.test(k));

  if (!Object.keys(IT).length) fail('evidence is empty');

  const beats = pack.beats || [];
  if (!beats.length) fail('beats is empty');
  if (!beats.some((b) => b[0] === 'intro')) fail('beats has no "intro"');
  if (new Set(beats.map((b) => b[0])).size !== beats.length) fail('beats has duplicate ids');

  const sources = Object.keys(SRC);
  if (!sources.length) fail('sources is empty');
  for (const src of sources) {
    const ids = SRC[src];
    if (!Array.isArray(ids)) fail(`sources.${src} must be an array`);
    else if (!ids.length) warn(`sources.${src} is empty — the engine will skip it`);
    if (new Set(ids).size !== ids.length) fail(`sources.${src} has duplicates`);
    for (const e of ids) if (!IT[e]) fail(`sources.${src} lists unknown evidence "${e}"`);
  }
  for (const e of Object.keys(IT)) {
    const homes = sources.filter((s) => SRC[s].includes(e));
    if (!homes.length) fail(`evidence "${e}" is not in any source`);
    if (homes.length > 1) fail(`evidence "${e}" is in more than one source: ${homes.join(', ')}`);
  }

  for (const [e, it] of Object.entries(IT)) {
    if (!it.n) fail(`evidence.${e}.n (display name) is empty`);
    if (!it.th) fail(`evidence.${e}.th (thumb) is empty`);
    else if (!HAS_ART(it.th)) fail(`evidence.${e}.th "${it.th}" has no art in the pack`);
    if (it.face && !ART[it.face]) fail(`evidence.${e}.face "${it.face}" has no art`);
    if (!['desk', 'board', 'both'].includes(it.dest)) fail(`evidence.${e}.dest must be desk, board, or both`);
    if (it.read && !Array.isArray(it.read)) fail(`evidence.${e}.read must be an array of lines`);
  }

  for (const src of sources) {
    if (!SRC[src].length) continue;          // an empty source needs no review order
    const groups = REVIEW[src];
    if (!Array.isArray(groups)) { fail(`review.${src} is missing`); continue; }
    const listed = groups.flatMap((g) => g.ids || []);
    const missing = SRC[src].filter((e) => !listed.includes(e));
    const extra = listed.filter((e) => !SRC[src].includes(e));
    if (missing.length) fail(`review.${src} never lists: ${missing.join(', ')}`);
    if (extra.length) fail(`review.${src} lists things not in sources.${src}: ${extra.join(', ')}`);
    if (new Set(listed).size !== listed.length) fail(`review.${src} repeats an id`);
    for (const g of groups) {
      if (!g.g) soft(`review.${src} has a group with no title`);
      if (!Array.isArray(g.ids) || !g.ids.length) fail(`review.${src} has an empty group "${g.g}"`);
    }
  }

  for (const [e, box] of Object.entries(BP)) {
    if (!IT[e]) fail(`board.${e} is not evidence`);
    const [x, y, w, label] = box;
    if (typeof x !== 'number' || x < 0 || x > 1280) fail(`board.${e}.x must be 0..1280`);
    if (typeof y !== 'number' || y < 0 || y > 800) fail(`board.${e}.y must be 0..800`);
    if (typeof w !== 'number' || w <= 0) fail(`board.${e}.w must be positive`);
    if (!label) fail(`board.${e} has no label`);
  }
  for (const [e, it] of Object.entries(IT)) {
    if ((it.dest === 'board' || it.dest === 'both') && !BP[e]) fail(`evidence "${e}" is board-dest but board.${e} is missing`);
  }

  const BT = pack.breakthrough || {};
  for (const id of BT.pair || []) if (!IT[id]) fail(`breakthrough.pair lists unknown evidence "${id}"`);
  for (const n of BT.near || []) for (const id of n.pair || []) if (!IT[id]) fail(`breakthrough.near lists unknown evidence "${id}"`);
  for (const [id, t] of Object.entries(pack.pinTags || {})) {
    if (!IT[id]) fail(`pinTags.${id} is not evidence`);
    if (!t.text) fail(`pinTags.${id}.text is empty`);
  }

  const portraitFor = (pid) => ART[pid];
  for (const s of pack.suspects || []) {
    const [key] = Array.isArray(s) ? s : [s.id];
    if (!portraitFor('p_' + key)) fail(`suspects.${key} has no portrait at art.p_${key}`);
  }

  const report = pack.report || [];
  if (report.length < 2) soft('report has fewer than 2 questions');
  for (const q of report) {
    if (!q.k) fail('report question is missing .k');
    if (!q.l) fail(`report.${q.k}.l (label) is empty`);
    if (!Array.isArray(q.o) || q.o.length < 2) fail(`report.${q.k} needs at least 2 options`);
    const ids = (q.o || []).map((o) => Array.isArray(o) ? o[0] : o);
    if (!ids.includes(q.a)) fail(`report.${q.k}.a "${q.a}" is not one of its options (${ids.join(', ')})`);
    if (!q.push) fail(`report.${q.k}.push (Ortiz's pushback) is empty`);
  }

  for (const p of pack.proof || []) if (!IT[p]) fail(`proof.${p} is not evidence`);
  const sol = pack.solution || [];
  if (!sol.length) fail('solution is empty');
  for (const [i, s] of sol.entries()) {
    if (!Array.isArray(s) || s.length < 2) fail(`solution[${i}] must be [text, evidenceTag]`);
  }

  const o1 = pack.objective1;
  if (!o1) fail('objective1 is missing');
  else {
    if (!o1.q) fail('objective1.q is empty');
    if (!Array.isArray(o1.o) || o1.o.length < 2) fail('objective1.o needs at least 2 options');
    if (!(Number.isInteger(o1.a) && o1.a >= 0 && o1.a < (o1.o || []).length)) fail('objective1.a must be a valid option index');
  }

  const O1 = COPY.objective1;
  if (!O1) fail('copy.objective1 is missing — the first gate would have no words');
  else if (!(O1.hints || []).length) fail('copy.objective1.hints is empty');

  if (!COPY.aha) fail('copy.aha is missing — the breakthrough card would be blank');
  else if (!COPY.aha.title || !COPY.aha.line) fail('copy.aha needs a title and a line');

  const DOCS = pack.docs || {};
  if (!DOCS.briefing) fail('docs.briefing is missing: the first thing the player is told to read would do nothing');

  for (const key of ['reveal', 'softFail', 'rank']) {
    if (!COPY[key]) fail(`copy.${key} is missing — the engine reads it for that scene`);
  }
  for (const [key, field] of [['cold', 'lines'], ['howTo', 'steps'], ['handoff', 'lines']]) {
    const block = COPY[key];
    if (!block) fail(`copy.${key} is missing — the opening act would be blank`);
    else if (!(block[field] || []).length) fail(`copy.${key}.${field} is empty`);
  }

  const TITLES = pack.titles || {};
  for (const [rid] of RECS) {
    if (!TITLES[rid]) warn(`titles.${rid} is missing: the tape list will show the raw recording id`);
  }

  for (const [rid, itemId] of RECS) {
    if (!IT[itemId]) fail(`recordings.${rid} -> unknown evidence "${itemId}"`);
    else if (IT[itemId].rec !== rid) fail(`recordings.${rid} -> evidence "${itemId}" has rec "${IT[itemId].rec}"`);
    if (!TR[rid]) fail(`recordings.${rid} has no transcript`);
    if (!AU[rid]) if (TR[rid]) warn(`recordings.${rid} has a transcript but no audio (it will play as text only)`);
  }
  for (const [rid, tail] of Object.entries(pack.tails || {})) {
    if (!RECS.some(r => r[0] === rid)) fail(`tails.${rid} is not a recording`);
    if (!TR[tail]) fail(`tails.${rid} -> transcripts.${tail} is missing`);
  }
  if (pack.playFirst && !RECS.some(r => r[0] === pack.playFirst)) fail(`playFirst "${pack.playFirst}" is not a recording`);

  for (const rid of Object.keys(TR)) {
    if (!Array.isArray(TR[rid]) || !TR[rid].length) fail(`transcripts.${rid} is empty`);
    else for (const [i, line] of TR[rid].entries()) {
      if (!line.sp) fail(`transcripts.${rid}[${i}] has no speaker`);
      if (!line.x) fail(`transcripts.${rid}[${i}] has no text`);
    }
  }

  // The engine should be case-neutral. Count the case's own words still in it.
  const enginePath = path.join(ROOT, 'app', 'player.js');
  if (fs.existsSync(enginePath)) {
    const engine = fs.readFileSync(enginePath, 'utf8');
    const hits = new Set();
    for (const s of pack.suspects || []) {
      const name = Array.isArray(s) ? s[1] : s.name;
      if (name && name.length > 4 && engine.includes(name)) hits.add(name);
    }
    for (const name of [pack.detective, ...((pack.suspects || []).map(s => (Array.isArray(s) ? s[1] : s.name)))]) {
      if (!name) continue;
      for (const token of name.split(/\s+/)) {
        // only proper nouns: a capitalised token, matched against the engine's
        // own capitalisation, so ordinary words like "second" do not trip it
        const proper = token.charAt(0).toUpperCase() + token.slice(1);
        if (token.length > 4 && engine.includes(proper)) hits.add(proper);
      }
    }
    for (const w of String(C.title || '').replace(/\n/g, ' ').split(/\s+/)) {
      if (w.length > 4 && /^[A-Z]/.test(w) && engine.includes(w)) hits.add(w);
    }
    if (hits.size) warn(`${id}: the engine still names ${[...hits].join(', ')} — copy that belongs in the pack`);
  }

  for (const key of pack.faceThumbs || []) {
    if (!ART[key]) fail(`faceThumbs lists "${key}" which has no art`);
  }
  if (!((pack.copy || {}).handoff || {}).portrait) warn('copy.handoff.portrait is unset: the handoff will show no portrait');

  // Every portrait must say who gave it to the detective and how. That
  // provenance is what sets its crop, grade and paper — see _build/plates.py.
  const PROV = pack.portraits || {};
  const TYPES = ['snapshot', 'school', 'phone', 'id', 'directory', 'newspaper', 'flyer', 'cctv', 'scene', 'mugshot'];
  for (const key of Object.keys(ART)) {
    if (!/^p_/.test(key)) continue;
    const rec = PROV[key];
    if (!rec) { fail(`portraits.${key} is missing: every portrait needs a provenance`); continue; }
    if (!TYPES.includes(rec.type)) fail(`portraits.${key}.type "${rec.type}" is not in the taxonomy (${TYPES.join(', ')})`);
    if (!rec.name) fail(`portraits.${key}.name is empty`);
    if (!rec.source) fail(`portraits.${key}.source is empty — who gave it to the detective?`);
  }
  for (const key of Object.keys(PROV)) if (!ART[key]) fail(`portraits.${key} has no art`);

  checkAssets('art', ART);
  checkAssets('audio', AU);

  for (const [rid, lines] of Object.entries(TR)) {
    if (!lines.length) continue;
    const timed = lines.filter((l) => typeof l.t === 'number').length;
    if (timed && timed !== lines.length) warn(`transcripts.${rid}: only ${timed}/${lines.length} lines are timed`);
  }
}

function main() {
  const candidate = process.argv.slice(2).find(a => !a.startsWith('-'));
  const only = candidate && fs.existsSync(path.join(CASES, candidate, 'case.js')) ? candidate : null;
  if (candidate && !only) console.error(`ignoring "${candidate}" — no such case in cases/`);
  if (!fs.existsSync(CASES)) {
    console.error('no cases/ directory');
    process.exit(2);
  }
  const ids = fs.readdirSync(CASES).filter((d) => fs.existsSync(path.join(CASES, d, 'case.js')));
  const targets = only ? [only] : ids;
  if (!targets.length) { console.error('no cases found'); process.exit(2); }

  for (const id of targets) {
    let pack;
    try { pack = loadPack(id); }
    catch (e) { err(`${id}: ${e.message}`); continue; }
    validate(id, pack);
  }

  const n = targets.length;
  console.log(`\nvalidate  ${targets.join(', ')}  (${n} case${n === 1 ? '' : 's'})\n`);
  for (const w of warnings) console.log(`  \x1b[33mwarn\x1b[0m  ${w}`);
  for (const e of errors) console.log(`  \x1b[31merror\x1b[0m ${e}`);
  if (!errors.length && !warnings.length) console.log('  \x1b[32mok\x1b[0m  every table agrees and every file exists');
  console.log(`\n  ${errors.length} error${errors.length === 1 ? '' : 's'}, ${warnings.length} warning${warnings.length === 1 ? '' : 's'}\n`);
  process.exit(errors.length ? 1 : 0);
}

main();
