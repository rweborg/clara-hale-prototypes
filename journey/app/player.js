'use strict';
/* The Case Desk — player engine.
   Loaded by index.html as a classic script (not a module) so the
   prototype still opens straight off the filesystem.
   Case content lives in cases/<id>/case.js. */

const CFG = {"desk":{"b":{"bare":"assets/desk/b-bare.jpg","spr":{"folder":{"x":45,"y":113,"w":340,"h":255,"src":"assets/evidence/folder-closed.webp"},"news":{"x":2,"y":0,"w":1278,"h":800,"src":"assets/desk/b-news.webp","crop":[627,431,277,348],"hit":[13,10,237,309]},"briefing":{"x":2,"y":0,"w":1278,"h":800,"src":"assets/desk/b-briefing.webp","crop":[394,87,262,326],"hit":[13,10,223,287]},"device":{"x":2,"y":0,"w":1278,"h":800,"src":"assets/desk/b-device.webp","crop":[704,155,122,189],"hit":[11,7,86,155]},"bag":{"x":2,"y":0,"w":1278,"h":800,"src":"assets/desk/b-bag.webp","crop":[76,446,240,328],"hit":[12,10,203,289]},"pad":{"x":3,"y":0,"w":1277,"h":800,"src":"assets/desk/b-pad.webp","crop":[323,436,298,347],"hit":[13,10,263,309]},"envC":{"x":2,"y":0,"w":1278,"h":800,"src":"assets/desk/b-envC.webp","crop":[977,456,288,194],"hit":[13,10,248,155]},"envB":{"x":2,"y":0,"w":1278,"h":800,"src":"assets/desk/b-envB.webp","crop":[977,512,288,195],"hit":[13,10,249,156]},"envA":{"x":2,"y":0,"w":1278,"h":800,"src":"assets/desk/b-envA.webp","crop":[977,568,289,196],"hit":[13,10,249,157]},"mug_full":{"x":2,"y":0,"w":1278,"h":800,"src":"assets/desk/b-mug_full.webp","crop":[954,344,146,122],"hit":[11,8,119,87]},"mug_half":{"x":2,"y":0,"w":1278,"h":800,"src":"assets/desk/b-mug_half.webp","crop":[954,344,146,122],"hit":[11,8,119,87]},"mug_empty":{"x":2,"y":0,"w":1278,"h":800,"src":"assets/desk/b-mug_empty.webp","crop":[954,344,146,122],"hit":[11,8,119,87]},"lamp":{"x":0,"y":0,"w":1280,"h":799,"src":"assets/desk/b-lamp.webp","crop":[1129,0,145,252],"hit":[11,0,111,221]},"danish":{"x":2,"y":0,"w":1278,"h":800,"src":"assets/desk/b-danish.webp","crop":[1106,270,140,140],"hit":[11,9,104,104]},"takeout_full":{"x":2,"y":0,"w":1278,"h":799,"src":"assets/desk/b-takeout_full.webp","crop":[836,121,268,208],"hit":[9,7,248,175]},"takeout_half":{"x":2,"y":0,"w":1278,"h":799,"src":"assets/desk/b-takeout_half.webp","crop":[836,121,268,208],"hit":[9,7,248,175]},"takeout_empty":{"x":2,"y":0,"w":1278,"h":799,"src":"assets/desk/b-takeout_empty.webp","crop":[836,121,268,208],"hit":[9,7,248,175]}}},"d":{"bare":"assets/desk/d-bare.jpg","spr":{"folder":{"x":70,"y":133,"w":340,"h":255,"rot":6,"src":"assets/evidence/folder-closed.webp"},"news":{"x":2,"y":0,"w":1278,"h":800,"src":"assets/desk/d-news.webp","crop":[384,6,372,460],"hit":[11,6,336,426]},"briefing":{"x":2,"y":0,"w":1278,"h":800,"src":"assets/desk/d-briefing.webp","crop":[399,160,302,360],"hit":[9,7,269,327]},"device":{"x":2,"y":0,"w":1278,"h":800,"src":"assets/desk/d-device.webp","crop":[733,107,279,394],"hit":[8,3,250,367]},"bag":{"x":2,"y":0,"w":1278,"h":800,"src":"assets/desk/d-bag.webp","crop":[195,451,275,353],"hit":[9,7,247,324]},"pad":{"x":2,"y":0,"w":1278,"h":800,"src":"assets/desk/d-pad.webp","crop":[480,457,279,347],"hit":[11,9,243,327]},"envC":{"x":2,"y":0,"w":1278,"h":800,"src":"assets/desk/d-envC.webp","crop":[749,444,310,231],"hit":[9,6,278,198]},"envB":{"x":2,"y":0,"w":1278,"h":800,"src":"assets/desk/d-envB.webp","crop":[760,509,304,217],"hit":[11,7,268,183]},"envA":{"x":2,"y":0,"w":1278,"h":800,"src":"assets/desk/d-envA.webp","crop":[772,575,296,202],"hit":[13,10,256,163]},"mug_full":{"x":2,"y":0,"w":1278,"h":800,"src":"assets/desk/d-mug_full.webp","crop":[1007,367,151,127],"hit":[10,8,125,91]},"mug_half":{"x":2,"y":0,"w":1278,"h":800,"src":"assets/desk/d-mug_half.webp","crop":[1007,367,151,127],"hit":[11,8,124,91]},"mug_empty":{"x":2,"y":0,"w":1278,"h":800,"src":"assets/desk/d-mug_empty.webp","crop":[1006,367,152,126],"hit":[11,8,125,91]},"lamp":{"x":2,"y":0,"w":1278,"h":799,"src":"assets/desk/d-lamp.webp","crop":[1124,0,148,258],"hit":[10,0,115,226]},"danish":{"x":2,"y":0,"w":1278,"h":800,"src":"assets/desk/d-danish.webp","crop":[38,549,144,144],"hit":[11,8,107,107]},"takeout_full":{"x":0,"y":0,"w":1280,"h":800,"src":"assets/desk/d-takeout_full.webp","crop":[0,556,230,219],"hit":[0,5,206,189]},"takeout_half":{"x":0,"y":0,"w":1280,"h":800,"src":"assets/desk/d-takeout_half.webp","crop":[0,556,230,219],"hit":[0,5,206,189]},"takeout_empty":{"x":0,"y":0,"w":1280,"h":800,"src":"assets/desk/d-takeout_empty.webp","crop":[0,556,230,219],"hit":[0,5,206,189]}}}},"A":{"cork":"assets/evidence/cork.jpg","folder_open":"assets/evidence/folder_open.webp","env":"assets/evidence/env.jpg","env_open":"assets/evidence/env_open.webp","env_strip":"assets/evidence/env_strip.webp","thumb_b":"assets/evidence/thumb_b.jpg","thumb_d":"assets/evidence/thumb_d.jpg"}};



const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const PACK = window.CASE_PACK;
const CASE = PACK.case, BEATS = PACK.beats, IT = PACK.evidence, SRC = PACK.sources,
      REVIEW = PACK.review, FACE = PACK.faces, CARDS = PACK.cards, BP = PACK.board,
      SUS = PACK.suspects, REPORT = PACK.report, RECS = PACK.recordings,
      PROOF_OK = PACK.proof, SOL = PACK.solution, OBJ1 = PACK.objective1,
      PV_NOTES = PACK.previewNotes, MID = PACK.previewMid, AU = PACK.audio;
const COPY = PACK.copy || {}, TITLES = PACK.titles || {};
const REVEAL = COPY.reveal || {}, ENVC = REVEAL.envC || {}, SOFT = COPY.softFail || {};
const RANK = COPY.rank || {}, REPORTC = COPY.report || {};
const DET = PACK.detective || 'Detective';
const A = Object.assign({}, CFG.A, PACK.art), TR = PACK.transcripts, esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

// Art is served with a one-year immutable cache, so its URL has to change when
// the art does. Every local path gets the build version appended once, here.
{
  const V = (window.APP_BUILD && window.APP_BUILD.version) || '0';
  const bust = u => (typeof u === 'string' && u && !u.startsWith('data:') && !/^https?:/.test(u))
    ? u + (u.includes('?') ? '&' : '?') + 'v=' + encodeURIComponent(V) : u;
  for (const theme of Object.values(CFG.desk)) {
    theme.bare = bust(theme.bare);
    for (const spr of Object.values(theme.spr || {})) spr.src = bust(spr.src);
  }
  for (const k of Object.keys(A)) A[k] = bust(A[k]);
  for (const k of Object.keys(AU)) AU[k] = bust(AU[k]);
}

// Fill the page chrome from the brand and the case, so neither needs an edit here.
const BRAND = window.PRODUCT || {name: 'The Case Desk', company: ''};
{
  const oneLine = CASE.title.replace(/\n/g, ' ');
  document.title = BRAND.name + ' · ' + oneLine;
  const tb = document.getElementById('title');
  if (tb) tb.textContent = oneLine;
  const sb = document.getElementById('subtitle');
  if (sb) sb.textContent = BRAND.name + ' · Case # ' + (PACK.number || '');
}

// The (i) chip says which build this is. Stamped by _build/stamp.js.
{
  const btn = document.getElementById('ver'), pop = document.getElementById('verpop');
  if (btn && pop) {
    const B = window.APP_BUILD || {};
    const when = B.built ? new Date(B.built) : null;
    const stamp = when && !isNaN(when) ? when.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'not stamped';
    pop.innerHTML = `<b>${esc(BRAND.name)}</b><dl>`
      + `<dt>Version</dt><dd>${esc(B.version || 'dev')}</dd>`
      + `<dt>Built</dt><dd>${esc(stamp)}</dd>`
      + `<dt>Case</dt><dd>${esc(PACK.number || '')}</dd>`
      + `<dt>Company</dt><dd>${esc(BRAND.company || '')}</dd></dl>`;
    const line = document.getElementById('verline');
    if (line) line.textContent = `${BRAND.name} ${B.version || 'dev'} · built ${stamp}`;
    const toggle = on => { pop.hidden = !on; btn.setAttribute('aria-expanded', String(on)); };
    btn.onclick = e => { e.stopPropagation(); toggle(pop.hidden); };
    document.addEventListener('click', e => { if (!pop.hidden && !pop.contains(e.target) && e.target !== btn) toggle(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !pop.hidden) toggle(false); });
  }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));


// Desk ambience follows the player's REAL clock. Cosmetic only: it never gates progress and never marks game time.
const AMB = {morning: ['🌤', 'Morning'], day: ['☀️', 'Daytime'], evening: ['🌇', 'Evening'], night: ['🌙', 'Night']};
const clockAmb = (h = new Date().getHours()) => h >= 5 && h < 11 ? 'morning' : h >= 11 && h < 17 ? 'day' : h >= 17 && h < 21 ? 'evening' : 'night';
let AMB_PREVIEW = null; const amb = () => AMB_PREVIEW || clockAmb();
const mealFor = a => a === 'evening' || a === 'night' ? 'takeout' : 'danish';   // morning/day: coffee + danish · evening/night: Chinese takeout
const HOT = {
  b: {folder: [215, 240, 340, 255, 0], briefing: [520, 240, 216, 279, 0], device: [760, 240, 110, 190, 6], bag: [190, 600, 196, 280, 0], pad: [450, 600, 216, 297, 0],
      news: [760, 595, 230, 300, 0], env: [1115, 600, 240, 265, 0], mug: [1015, 395, 120, 100, 0], danish: [1170, 330, 120, 110, 0], takeout: [935, 215, 190, 185, 8], lamp: [1222, 90, 110, 150, 0]},
  d: {folder: [240, 260, 340, 255, 6], briefing: [545, 330, 216, 279, 8], news: [565, 105, 290, 140, -4], device: [860, 300, 230, 290, -14], bag: [330, 620, 196, 280, -8],
      pad: [615, 630, 216, 297, -2], env: [925, 610, 250, 265, -4], mug: [1065, 420, 120, 100, 0], danish: [105, 610, 120, 110, 0], takeout: [105, 665, 190, 190, 0], lamp: [1222, 90, 110, 150, 0]}};
const ZORD = {b: ['folder', 'briefing', 'device', 'bag', 'pad', 'news', 'mug', 'danish', 'takeout', 'envC', 'envB', 'envA', 'lamp'],
              d: ['news', 'folder', 'briefing', 'device', 'bag', 'pad', 'envC', 'envB', 'envA', 'mug', 'danish', 'takeout', 'lamp']};




function reviewOf(src) {
  const groups = REVIEW[src] || [{g: '', ids: SRC[src] || []}];
  const ids = groups.flatMap(g => g.ids), meta = {};
  let n = 0;
  for (const g of groups) for (const id of g.ids) meta[id] = {n: ++n, g: g.g};
  return {groups, ids, meta};
}
function nextReviewId(src) { for (const id of reviewOf(src).ids) if (!S.pulled[id]) return id; return null; }








// ---------------- state ----------------
let S; const T0 = Date.now();
function fresh() { return {theme: localStorage.getItem('jp-theme') || 'b', beat: 'intro', meal: null, pulled: {}, board: {}, place: {}, stack: [], strings: [], notes: [], viewed: {}, played: {}, saved: {},
  obj1: 0, obj1wrong: 0, env: {A: 'hidden', B: 'hidden', C: 'hidden'}, real: false, tries: 0, hints: 0, mug: 0, bites: 0, lampOff: false, solved: false, assisted: false,
  folderOnDesk: false, packed: false, stamped: false, filed: false, fresh: {}, voice: S ? S.voice : true, view: 'desk', sel: null, connect: false, strSel: null, rep: {}, t0: Date.now()}; }
S = fresh();
// ---------------- save / resume ----------------
// The whole case state is saved on this device; reopening the page lands you back at the desk, mid-case.
const SAVE = PACK.id === 'clara-hale' ? 'jp-save-v2' : 'jp-save-v2:' + PACK.id, TRANSIENT = ['sel', 'connect', 'strSel', 'fresh', '_sc'];
// ?preview=1 is the developer journey scrubber (initPreview). It must not touch a real playthrough.
const PREVIEW = new URLSearchParams(location.search).get('preview') === '1';
function save() { if (PREVIEW || !S || S.beat === 'intro') return; try { const o = {}; for (const k in S) if (!TRANSIENT.includes(k)) o[k] = S[k]; o.savedAt = Date.now(); localStorage.setItem(SAVE, JSON.stringify(o)); } catch (e) {} }
function loadSave() { try { const o = JSON.parse(localStorage.getItem(SAVE) || 'null'); if (!o || !o.beat || o.beat === 'intro' || !BEATS.some(b => b[0] === o.beat)) return null; return Object.assign(fresh(), o, {sel: null, connect: false, fresh: {}}); } catch (e) { return null; } }
function clearSave() { if (PREVIEW) return; try { localStorage.removeItem(SAVE); } catch (e) {} }
// ---------------- sound ----------------
let AC, MASTER; const ac = () => AC || (AC = new (window.AudioContext || window.webkitAudioContext)());
let VOL = 1, MUTED = false;
try { const o = JSON.parse(localStorage.getItem('jp-vol') || 'null'); if (o && typeof o.v === 'number') { VOL = Math.max(0, Math.min(1, o.v)); MUTED = !!o.m || VOL === 0; } } catch (e) {}
function master() { const c = ac(); if (!MASTER) { MASTER = c.createGain(); MASTER.connect(c.destination); } MASTER.gain.value = MUTED ? 0 : VOL; return MASTER; }
function softNoise(dur, freq, peak, attack) { try { const c = ac(), n = c.createBufferSource(), len = Math.max(1, Math.ceil(c.sampleRate * dur)), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; n.buffer = b; const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = freq; fl.Q.value = .6;
  const g = c.createGain(), t = c.currentTime, pk = Math.max(.0002, peak); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(pk, t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  n.connect(fl).connect(g).connect(master()); n.start(t); n.stop(t + dur + .02); } catch (e) {} }
function softTone(freq, dur, peak, attack, type) { try { const c = ac(), o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine'; o.frequency.value = freq; const t = c.currentTime, pk = Math.max(.0002, peak);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(pk, t + Math.max(.008, attack)); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(g).connect(master()); o.start(t); o.stop(t + dur + .02); } catch (e) {} }
function volIcon() { if (MUTED || VOL <= 0) return '🔇'; if (VOL < .4) return '🔈'; if (VOL < .75) return '🔉'; return '🔊'; }
function applyVol(a) { if (!a) return; try { a.volume = MUTED ? 0 : VOL; } catch (e) {} }
function paintVol() { $$('[data-vol]').forEach(el => { el.value = String(Math.round(VOL * 100)); }); $$('[data-volmute]').forEach(b => { b.textContent = volIcon(); b.setAttribute('aria-pressed', MUTED ? 'true' : 'false'); b.setAttribute('aria-label', MUTED ? 'Unmute' : 'Mute'); }); }
function setVol(v, muted) { VOL = Math.max(0, Math.min(1, Number.isFinite(v) ? v : 1)); MUTED = !!muted || VOL === 0; if (MASTER) MASTER.gain.value = MUTED ? 0 : VOL; applyVol(CUR_AUD); applyVol(LINE); try { localStorage.setItem('jp-vol', JSON.stringify({v: VOL, m: MUTED})); } catch (e) {} paintVol(); }
document.addEventListener('input', e => { const el = e.target; if (!el.matches || !el.matches('[data-vol]')) return; const v = Number(el.value) / 100; setVol(v, v <= 0); });
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-volmute]'); if (!b) return; if (MUTED) setVol(VOL > 0 ? VOL : .8, false); else setVol(VOL > 0 ? VOL : .8, true); });
const SFX = {
  paper: () => { softNoise(.24, 720, .05, .035); softTone(170, .18, .028, .025); },
  slide: () => { softNoise(.3, 340, .045, .05); softTone(110, .22, .022, .04); },
  pin: () => { softTone(230, .14, .035, .01); softNoise(.1, 480, .028, .015); },
  tear: () => softNoise(.48, 620, .04, .06),
  sting: () => { [196, 247, 311, 392].forEach((f, i) => softTone(f, 1.15, .03, .05, 'triangle')); softTone(98, 1.25, .032, .06); },
  ding: () => { softTone(392, .5, .034, .025); softTone(523, .62, .03, .04); },
  stamp: () => { softTone(88, .24, .05, .012); softNoise(.18, 260, .035, .015); },
  drawer: () => { softNoise(.75, 220, .042, .07); softTone(78, .42, .026, .09); },
  sip: () => { softNoise(.3, 400, .04, .045); softTone(210, .2, .018, .035); },
  bite: () => { softTone(140, .14, .036, .012); softNoise(.12, 460, .03, .018); softTone(96, .16, .024, .03); },
  click: () => softTone(200, .1, .026, .01),
  buzz: () => softTone(146, .32, .03, .035)
};
// ---------------- voice: ElevenLabs samples only ----------------
// Every spoken character line is a bundled ElevenLabs MP3 (assets/audio/, see AU) played with an HTMLAudioElement.
// There is deliberately no device text-to-speech fallback: a line without a sample is shown as text only.
let LINE = null;
function voice(k) { hush(); if (!S.voice || !k || !AU[k]) return null; const a = new Audio(AU[k]); a.preload = 'auto'; applyVol(a); LINE = a; a.play().catch(() => {}); return a; }
function hush() { if (LINE) { try { LINE.pause(); } catch (e) {} LINE = null; } }
const ortiz = k => voice('ortiz/' + k);
// ---------------- helpers ----------------
function toast(t, ms = 2600) { const e = $('#toast'); e.innerHTML = t; e.hidden = false; clearTimeout(e._t); e._t = setTimeout(() => e.hidden = true, ms); }
function note(t, cls = '') { if (S.notes.some(n => n.t === t)) return; S.notes.push({t, cls, isnew: true}); renderSide(); }
const pulledFrom = src => SRC[src].filter(i => S.pulled[i]).length;
function setAmb(a) { AMB_PREVIEW = a || null; render(); }   // prototype preview only; never saved, never affects the case
function syncMeal() { const m = mealFor(amb()); if (S.meal !== m) { S.meal = m; S.bites = 0; S.mug = 0; } }
// Each surface keeps its own camera. z = 1 is the close-up slice; a smaller z fits the whole 1280×800.
const viewCam = {desk: {x: null, y: null, z: 1, user: false}, board: {x: null, y: null, z: 1, user: false}};
function finger() { return window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(max-width: 900px)').matches; }
function viewKey() { return S.view === 'board' ? 'board' : 'desk'; }
function fitScale(st) { return Math.min(st.width / 1280, st.height / 800) || 1; }
function baseScale(st, view) {
  const fit = fitScale(st);
  if (!isFinite(fit) || fit <= 0) return 1;
  if (fit >= 0.7) return fit;
  const phone = st.width < 560;
  const want = view === 'board' ? (phone ? 0.9 : 0.78) : (phone ? 0.66 : 0.62);
  const heightLimit = st.height / (view === 'board' ? 640 : 520);
  return Math.min(1, Math.max(fit, Math.min(want, Math.max(heightLimit, fit))));
}
function clampCam(st, sc, cam) {
  const bw = 1280 * sc, bh = 800 * sc;
  if (bw <= st.width + 1) cam.x = (st.width - bw) / 2;
  else cam.x = Math.max(st.width - bw, Math.min(0, cam.x));
  if (bh <= st.height + 1) cam.y = (st.height - bh) / 2;
  else cam.y = Math.max(st.height - bh, Math.min(0, cam.y));
  return cam;
}
function framePan(st, sc, view) {
  const fx = view === 'board' ? 640 : 300, fy = view === 'board' ? 360 : 320;
  return clampCam(st, sc, {x: st.width / 2 - fx * sc, y: st.height / 2 - fy * sc});
}
function sheetOverlay() { return window.matchMedia('(max-height: 500px) and (max-width: 1100px)').matches; }
function sheetOpen(force) {
  const on = typeof force === 'boolean' ? force : !document.body.classList.contains('sheet-open');
  document.body.classList.toggle('sheet-open', on);
  const exp = on ? 'true' : 'false';
  const b = $('#sheetb'); if (b) { b.setAttribute('aria-expanded', exp); b.textContent = on ? 'Hide notes' : 'Notes and progress'; }
  const c = $('#caseb'); if (c) c.setAttribute('aria-expanded', exp);
  requestAnimationFrame(fitAll);
}
function reframeView() {
  const view = viewKey(), cam = viewCam[view], st = $('#stage').getBoundingClientRect();
  const base = baseScale(st, view), fit = fitScale(st), sc = base * (cam.z || 1);
  const fitted = 1280 * sc <= st.width + 20 && 800 * sc <= st.height + 20;
  cam.z = (fitted && base > fit + 0.04) ? 1 : Math.min(1, fit / base);
  cam.user = false; cam.x = null;
  fitAll();
}
function fitAll() {
  const stage = $('#stage'); if (!stage || typeof S === 'undefined') return;
  const st = stage.getBoundingClientRect();
  if (st.width < 8 || st.height < 8) return;
  const active = viewKey();
  let activeSc = 1;
  for (const id of ['desk', 'board']) {
    const cam = viewCam[id], base = baseScale(st, id), sc = base * (cam.z || 1);
    if (cam.x == null || !cam.user) { const framed = framePan(st, sc, id); cam.x = framed.x; cam.y = framed.y; }
    clampCam(st, sc, cam);
    const el = $('#' + id);
    el.style.transform = `translate(${cam.x}px,${cam.y}px) scale(${sc})`;
    const tagSc = sc >= 0.8 ? 1 : Math.min(1.5, Math.max(1, 13.5 / (15 * sc)));
    el.style.setProperty('--tag-sc', tagSc.toFixed(3));
    if (id === active) activeSc = sc;
  }
  S._sc = activeSc || 1;
  const base = baseScale(st, active), fit = fitScale(st);
  const fitted = 1280 * activeSc <= st.width + 20 && 800 * activeSc <= st.height + 20;
  const canZoom = base > fit + 0.04;
  if (typeof seatTags === 'function') seatTags();
  document.documentElement.classList.toggle('can-pan', canZoom && !fitted);
  const rf = $('#reframe');
  if (rf) {
    const board = active === 'board';
    rf.hidden = !canZoom;
    rf.textContent = fitted ? 'Look closer' : (board ? 'Whole board' : 'Whole desk');
    rf.setAttribute('aria-label', fitted ? (board ? 'Look closer at the corkboard' : 'Look closer at the desk') : (board ? 'Show the whole corkboard' : 'Show the whole desk'));
    rf.title = fitted ? 'Back to a closer view' : 'Drag with a finger to look around. This shows the whole surface.';
  }
  let dock = 0;
  const side = $('#side');
  if (side && ((window.matchMedia('(max-width: 900px) and (min-height: 501px)').matches) || (sheetOverlay() && document.body.classList.contains('sheet-open')))) dock = side.getBoundingClientRect().height;
  document.documentElement.style.setProperty('--dock', Math.round(dock) + 'px');
}
function bindStagePan() {
  const stage = $('#stage'); if (!stage || stage._pan) return; stage._pan = 1;
  const pts = new Map(); let drag = null, pinch = null;
  stage.addEventListener('pointerdown', e => {
    if (e.button != null && e.button !== 0) return;
    if (e.target.closest('.pin, .thread, .btools, #whisper, #reframe, .hot, #spr img, a, input, textarea')) return;
    if (sheetOverlay() && document.body.classList.contains('sheet-open')) { sheetOpen(false); stage.dataset.dismiss = '1'; return; }
    pts.set(e.pointerId, {x: e.clientX, y: e.clientY});
    const cam = viewCam[viewKey()];
    drag = {id: e.pointerId, x: e.clientX, y: e.clientY, ox: cam.x, oy: cam.y, moved: false, hot: e.target.closest('.hot')};
    pinch = null;
  });
  stage.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, {x: e.clientX, y: e.clientY});
    if (pts.size >= 2) { doPinch(); return; }
    if (!drag || drag.id !== e.pointerId || !document.documentElement.classList.contains('can-pan')) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 8) return;
    drag.moved = true;
    const cam = viewCam[viewKey()];
    cam.user = true; cam.x = drag.ox + dx; cam.y = drag.oy + dy;
    fitAll();
  }, {passive: true});
  const end = e => {
    const was = drag && drag.id === e.pointerId ? drag : null;
    pts.delete(e.pointerId);
    if (pts.size < 2) pinch = null;
    if (was && was.moved) { window.__jpPan = true; if (was.hot) was.hot.dataset.panlock = '1'; setTimeout(() => { window.__jpPan = false; }, 50); }
    if (was) drag = null;
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
  stage.addEventListener('click', e => {
    const hot = e.target.closest('.hot');
    if (stage.dataset.dismiss === '1' || (hot && hot.dataset.panlock === '1') || window.__jpPan) {
      stage.dataset.dismiss = '';
      if (hot) hot.dataset.panlock = '';
      e.preventDefault(); e.stopPropagation();
    }
  }, true);
  function doPinch() {
    const arr = [...pts.values()]; if (arr.length < 2) return;
    const a = arr[0], b = arr[1], dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2, view = viewKey(), cam = viewCam[view];
    const st = stage.getBoundingClientRect(), base = baseScale(st, view), fit = fitScale(st);
    if (!pinch) { pinch = {dist, z: cam.z || 1, cx, cy, x: cam.x, y: cam.y}; return; }
    let z = pinch.z * (dist / pinch.dist);
    const minZ = Math.min(1, fit / base), maxZ = Math.min(2.5, 1.15 / Math.max(base, 0.2));
    z = Math.max(minZ, Math.min(maxZ, z));
    const sc0 = base * pinch.z, sc1 = base * z;
    const sx = pinch.cx - st.left, sy = pinch.cy - st.top;
    cam.z = z; cam.user = true;
    cam.x = sx - ((sx - pinch.x) / sc0) * sc1;
    cam.y = sy - ((sy - pinch.y) / sc0) * sc1;
    window.__jpPan = true;
    fitAll();
  }
}
window.addEventListener('resize', fitAll);
window.addEventListener('orientationchange', () => setTimeout(fitAll, 80));
if (window.visualViewport) visualViewport.addEventListener('resize', fitAll);
bindStagePan();
const _sheetb = $('#sheetb'); if (_sheetb) _sheetb.onclick = () => sheetOpen();
const _caseb = $('#caseb'); if (_caseb) _caseb.onclick = () => sheetOpen();
const _reframe = $('#reframe'); if (_reframe) _reframe.onclick = () => reframeView();
// ---------------- desk ----------------
function deskSet() { const s = new Set(); if (S.beat === 'intro') return s;
  s.add('pad'); if (S.folderOnDesk && !S.filed) s.add('folder');
  if (!S.packed) { if (S.pulled.briefing) s.add('briefing'); if (recs().length) s.add('device'); if (S.pulled.bag) s.add('bag'); if (S.pulled.news && S.newsOn !== 'board') s.add('news'); }
  for (const L of 'ABC') if (S.env[L] === 'sealed' || S.env[L] === 'ready') s.add('env' + L);
  const a = amb(); s.add(['mug_full', 'mug_half', 'mug_empty'][S.mug]);
  if (mealFor(a) === 'danish') { if (S.bites < 3) s.add('danish'); } else s.add(takeoutKey());
  if (a === 'evening' || a === 'night') s.add('lamp');
  return s; }
const takeoutKey = () => S.bites < 2 ? 'takeout_full' : S.bites < 4 ? 'takeout_half' : 'takeout_empty';
const MUGS = ['mug_full', 'mug_half', 'mug_empty'], TAKEOUTS = ['takeout_full', 'takeout_half', 'takeout_empty'];
let prevSet = new Set();
function hotForSprite(k) { if (k === 'envA' || k === 'envB' || k === 'envC') return 'env'; if (MUGS.includes(k)) return 'mug'; if (TAKEOUTS.includes(k)) return 'takeout'; return k; }
function placeOff(name) { const p = S.place && S.place[name]; return p ? [p[0] || 0, p[1] || 0] : [0, 0]; }
const CROP = {};
function stackZ(name) { const i = (S.stack || []).indexOf(name); return i < 0 ? 1 : 2 + i; }
function bringFront(name) { if (!S.stack) S.stack = []; S.stack = S.stack.filter(n => n !== name); S.stack.push(name); }
function propBox(name) { const D = CFG.desk[S.theme], keys = name === 'mug' ? MUGS : name === 'takeout' ? TAKEOUTS : name === 'env' ? ['envA', 'envB', 'envC'] : [name];
  for (const k of keys) { const im = $(`#spr img[data-spr="${k}"]`); const crop = CROP[S.theme + ':' + k], d = D.spr[k]; if (!d) continue; if (crop && !crop.full) return {x: d.x + crop.x, y: d.y + crop.y, w: crop.w, h: crop.h}; if (im || crop) return {x: d.x, y: d.y, w: d.w, h: d.h}; }
  const H = HOT[S.theme][name]; return H ? {x: H[0] - H[2] / 2, y: H[1] - H[3] / 2, w: H[2], h: H[3]} : {x: 0, y: 0, w: 80, h: 80}; }
function clampOff(name, dx, dy) { const b = propBox(name); const x = Math.max(12 - b.w + 56, Math.min(1280 - 56, b.x + dx)), y = Math.max(12 - b.h + 40, Math.min(800 - 40, b.y + dy)); return [x - b.x, y - b.y]; }
function cropId(im) { const key = im && (im.dataset.spr || im.dataset.k); return key ? (im.dataset.theme || S.theme) + ':' + key : ''; }
function measureCrop(im) { if (!im.isConnected || (im.dataset.theme && im.dataset.theme !== S.theme)) return; const key = im.dataset.spr || im.dataset.k, id = cropId(im); if (!id || CROP[id] || !im.naturalWidth) return;
  const d = CFG.desk[S.theme].spr[key]; if (!d || d.w < 900) { CROP[id] = {full: true}; return; }
  if (d.crop) { CROP[id] = {x: d.crop[0], y: d.crop[1], w: d.crop[2], h: d.crop[3]}; return; }
  try { const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const g = c.getContext('2d', {willReadFrequently: true}); g.drawImage(im, 0, 0);
    const {data, width, height} = g.getImageData(0, 0, c.width, c.height); let minx = width, miny = height, maxx = 0, maxy = 0, any = false;
    for (let i = 3; i < data.length; i += 16) { if (data[i] > 128) { const p = (i - 3) / 4, x = p % width, y = (p / width) | 0; any = true; if (x < minx) minx = x; if (y < miny) miny = y; if (x > maxx) maxx = x; if (y > maxy) maxy = y; } }
    CROP[id] = any ? {x: Math.max(0, minx - 2), y: Math.max(0, miny - 2), w: Math.min(width, maxx - minx + 8), h: Math.min(height, maxy - miny + 8)} : {full: true};
  } catch (e) { CROP[id] = {full: true}; } }
function layoutSprite(im) { const key = im.dataset.spr || im.dataset.k, hot = im.dataset.hot || hotForSprite(key), d = CFG.desk[S.theme].spr[key]; if (!d) return; const off = placeOff(hot), crop = CROP[cropId(im)];
  im.style.zIndex = String(2 + stackZ(hot)); im.style.position = 'absolute'; im.style.maxWidth = 'none';
  if (crop && !crop.full) { im.style.objectFit = 'none'; im.style.objectPosition = `${-crop.x}px ${-crop.y}px`; im.style.width = crop.w + 'px'; im.style.height = crop.h + 'px'; im.style.left = (d.x + crop.x + off[0]) + 'px'; im.style.top = (d.y + crop.y + off[1]) + 'px'; im.style.visibility = 'visible'; return; }
  im.style.objectFit = ''; im.style.objectPosition = ''; im.style.visibility = crop ? 'visible' : 'hidden'; im.style.left = (d.x + off[0]) + 'px'; im.style.top = (d.y + off[1]) + 'px'; im.style.width = d.w + 'px'; im.style.height = d.h + 'px'; }
function prepSprite(im) { if (!im.isConnected || !im.complete || !im.naturalWidth) return; measureCrop(im); layoutSprite(im); fitHot(im.dataset.hot || hotForSprite(im.dataset.spr || im.dataset.k)); }
function applyPlace(name) { const off = placeOff(name), H = HOT[S.theme][name], b = $(`.hot[data-name="${name}"]`);
  if (b && H) { b.style.left = (H[0] + off[0] - H[2] / 2) + 'px'; b.style.top = (H[1] + off[1] - H[3] / 2) + 'px'; b.style.width = H[2] + 'px'; b.style.height = H[3] + 'px'; b.style.zIndex = String(40 + stackZ(name)); }
  $$('#spr img').forEach(im => { if ((im.dataset.hot || hotForSprite(im.dataset.k)) !== name) return; layoutSprite(im); });
  fitHot(name); }
function fitHot(name) { const b = $(`.hot[data-name="${name}"]`); if (!b) return;
  const imgs = $$('#spr img').filter(im => (im.dataset.hot || hotForSprite(im.dataset.k)) === name && im.style.visibility !== 'hidden');
  let L = Infinity, T = Infinity, R = -Infinity, B = -Infinity, deg = null;
  for (const im of imgs) {
    const x = parseFloat(im.style.left), y = parseFloat(im.style.top), w = parseFloat(im.style.width), h = parseFloat(im.style.height);
    if (!isFinite(x) || !(w > 0) || !(h > 0)) continue;
    const d = CFG.desk[S.theme].spr[im.dataset.spr || im.dataset.k] || {};
    // the crop includes the prop's shadow; d.hit is the prop itself, so a
    // shadow cannot steal a click from the thing next to it
    const hx = d.hit ? x + d.hit[0] : x, hy = d.hit ? y + d.hit[1] : y;
    const hw = d.hit ? d.hit[2] : w, hh = d.hit ? d.hit[3] : h;
    L = Math.min(L, hx); T = Math.min(T, hy); R = Math.max(R, hx + hw); B = Math.max(B, hy + hh);
    const m = /rotate\(([-\d.]+)deg\)/.exec(im.style.transform || ''); if (m && deg == null) deg = parseFloat(m[1]); }
  if (!isFinite(L) || R - L > 900 || B - T > 700) { seatTags(); return; }
  b.style.left = L + 'px'; b.style.top = T + 'px'; b.style.width = (R - L) + 'px'; b.style.height = (B - T) + 'px';
  b.style.transform = `rotate(${deg || 0}deg)`;
  const tag = b.querySelector('.tag'); if (tag) tag.dataset.rot = String(-(deg || 0));
  seatTags(); }
function seatTags() { const desk = $('#desk'); if (!desk || seatTags.busy) return; seatTags.busy = true; try { seatTagsNow(); } finally { seatTags.busy = false; } }
function seatTagsNow() { const desk = $('#desk');
  const sc = S._sc || 1, dr = desk.getBoundingClientRect(), tagSc = parseFloat(getComputedStyle(desk).getPropertyValue('--tag-sc')) || 1;
  const toD = r => ({l: (r.left - dr.left) / sc, t: (r.top - dr.top) / sc, r: (r.right - dr.left) / sc, b: (r.bottom - dr.top) / sc});
  const sprites = $$('#spr img').filter(im => im.style.visibility !== 'hidden' && im.offsetWidth > 0 && im.offsetWidth < 900).map(im => Object.assign(toD(im.getBoundingClientRect()), {hot: im.dataset.hot}));
  const items = $$('.hot').map(b => { const tag = b.querySelector('.tag'); if (!tag || !(b.offsetWidth > 0)) return null; const box = toD(b.getBoundingClientRect()); return {b, tag, box, name: b.dataset.name, rot: tag.dataset.rot || '0'}; }).filter(Boolean).sort((a, c) => a.box.t - c.box.t);
  const placed = [];
  const area = box => Math.max(1, (box.r - box.l) * (box.b - box.t));
  const overlap = (a, b) => { const ox = Math.min(a.r, b.r) - Math.max(a.l, b.l), oy = Math.min(a.b, b.b) - Math.max(a.t, b.t); return ox > 1 && oy > 1 ? ox * oy : 0; };
  for (const it of items) {
    const tagW = (it.tag.offsetWidth || 120) * tagSc, tagH = (it.tag.offsetHeight || 32) * tagSc, gap = 6;
    let best = null;
    for (let dy = -tagH - gap; dy <= (it.box.b - it.box.t) + tagH + gap; dy += 16) for (let dx = -tagW - gap; dx <= (it.box.r - it.box.l) + tagW + gap; dx += 24) {
      const box = {l: Math.max(8, Math.min(1272 - tagW, it.box.l + dx)), t: it.box.t + dy, r: 0, b: 0}; box.r = box.l + tagW; box.b = box.t + tagH;
      const cx = Math.max(it.box.l, Math.min(it.box.r, (box.l + box.r) / 2)), cy = Math.max(it.box.t, Math.min(it.box.b, (box.t + box.b) / 2));
      let score = Math.hypot((box.l + box.r) / 2 - cx, (box.t + box.b) / 2 - cy) * 0.35;
      if (box.t < 4 || box.b > 796 || box.l < 4 || box.r > 1276) score += 5000;
      for (const sp of sprites) { const o = overlap(box, sp); if (o) score += (sp.hot === it.name ? 9000 : 5000) * o / area(box); }
      for (const p of placed) { const o = overlap(box, p); if (o) score += 900 * o / area(box); }
      if (!best || score < best.score) best = {box, score};
    }
    placed.push(best.box); it.tagW = tagW;
  }
  for (let pass = 0; pass < 6; pass++) for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const A = placed[i], B = placed[j], ox = Math.min(A.r, B.r) - Math.max(A.l, B.l), oy = Math.min(A.b, B.b) - Math.max(A.t, B.t);
    if (ox <= 2 || oy <= 2) continue;
    for (const [idx, other, dir] of [[j, A, 1], [j, A, -1], [i, B, -1], [i, B, 1]]) {
      const src = placed[idx], delta = dir > 0 ? other.r - src.l + 8 : src.r - other.l + 8;
      const box = {l: src.l + dir * delta, t: src.t, r: src.r + dir * delta, b: src.b};
      if (box.l < 8 || box.r > 1272) continue;
      if (sprites.some(sp => overlap(box, sp) > 0)) continue;
      if (placed.some((p, k) => k !== idx && overlap(box, p) > 0)) continue;
      placed[idx] = box; break;
    }
  }
  items.forEach((it, i) => {
    const box = placed[i], cx = (it.box.l + it.box.r) / 2, dx = (box.l + it.tagW / 2) - cx;
    it.tag.style.transform = `translateX(calc(-50% + ${dx.toFixed(1)}px)) rotate(${it.rot}deg) scale(var(--tag-sc,1))`;
    it.tag.style.top = (box.t - it.box.t).toFixed(1) + 'px';
    it.tag.style.bottom = 'auto';
    it.tag.style.transformOrigin = 'center top';
  }); }
function shiftedBox(name) { const b = propBox(name), o = placeOff(name); return {x: b.x + o[0], y: b.y + o[1], w: b.w, h: b.h}; }
function separateProp(name) { if (!S.place) return; for (let n = 0; n < 3; n++) { const a = shiftedBox(name); let hit = false;
  for (const other of Object.keys(HOT[S.theme])) { if (other === name) continue; if (!$(`.hot[data-name="${other}"]`) && !$(`#spr img[data-hot="${other}"]`)) continue; const b = shiftedBox(other);
    const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)), iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    if (ix * iy > .4 * Math.min(a.w * a.h, b.w * b.h)) { hit = true; break; } }
  if (!hit) return; const cur = placeOff(name), b = shiftedBox(otherOf(name, a)); const pushX = a.x + a.w / 2 >= (b ? b.x + b.w / 2 : a.x) ? 48 : -48;
  S.place[name] = clampOff(name, cur[0] + pushX, cur[1] + (a.y >= (b ? b.y : a.y) ? 28 : -28)); } }
function otherOf(name, a) { let best = null, bestA = 0; for (const other of Object.keys(HOT[S.theme])) { if (other === name) continue; if (!$(`.hot[data-name="${other}"]`) && !$(`#spr img[data-hot="${other}"]`)) continue; const b = shiftedBox(other);
  const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)), iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)); const area = ix * iy; if (area > bestA) { bestA = area; best = b; } } return best; }
function renderDesk() {
  const th = S.theme, D = CFG.desk[th], set = deskSet(); $('#bare').src = D.bare;
  const spr = $('#spr'); spr.innerHTML = '';
  for (const k of ZORD[th]) { const key = k === 'mug' ? MUGS[S.mug] : k === 'takeout' ? takeoutKey() : k; if (!set.has(key)) continue; const d = D.spr[key]; const im = document.createElement('img');
    im.draggable = false; im.src = d.src; im.dataset.k = k; im.dataset.spr = key; im.dataset.theme = th; im.dataset.hot = hotForSprite(k); im.addEventListener('load', () => prepSprite(im)); layoutSprite(im); if (im.complete) prepSprite(im);
    if (d.rot) im.style.transform = `rotate(${d.rot}deg)`;
    if (!prevSet.has(key) && !MUGS.includes(key) && !(TAKEOUTS.includes(key) && TAKEOUTS.some(t => prevSet.has(t))) && S.beat !== 'intro') im.classList.add('in');
    if (k === 'danish' && S.bites) biteMask(im, k, S.bites);
    if (k === 'lamp' && S.lampOff) im.style.opacity = .85;
    spr.appendChild(im); }
  prevSet = set;
  // ambience from the player's real clock (cosmetic)
  const A0 = amb(), lampOn = (A0 === 'evening' || A0 === 'night') && !S.lampOff; const tod = $('#tod'), gl = $('#glow');
  const TOD = {morning: ['linear-gradient(115deg,#FFE3BD 0%,#FFF4E4 45%,#F3EEE8 100%)', 'radial-gradient(circle at 12% 0%,rgba(255,225,170,.35),rgba(255,225,170,0) 55%)'],
    day: ['linear-gradient(#FFFFFF,#FFFFFF)', 'none'],
    evening: [lampOn ? 'radial-gradient(circle at 1060px 250px,#FFE2B8 0,#C79A72 38%,#6E4F3E 80%,#4A3730 100%)' : 'linear-gradient(#8C6E5E,#5E4A42)', lampOn ? 'radial-gradient(circle at 1060px 250px,rgba(255,180,90,.32),rgba(255,180,90,0) 45%)' : 'none'],
    night: [lampOn ? 'radial-gradient(circle at 1040px 270px,#FFE0B0 0,#8E7C86 30%,#2C3050 70%,#1A1C30 100%)' : 'linear-gradient(#2A2E4A,#181A2C)', lampOn ? 'radial-gradient(circle at 1040px 270px,rgba(255,190,110,.35),rgba(255,190,110,0) 38%)' : 'none'],
  }[A0];
  tod.style.background = TOD[0]; gl.style.background = TOD[1];
  // hotspots
  const hots = $('#hots'); hots.innerHTML = ''; const H = HOT[th], ns = nextStep();
  const add = (name, label, em, amb) => { const h = H[name]; if (!h) return; const b = document.createElement('button'); b.className = 'hot' + (amb ? ' amb' : ''); b.dataset.name = name; const hoff = placeOff(name);
    Object.assign(b.style, {left: (h[0] + hoff[0] - h[2] / 2) + 'px', top: (h[1] + hoff[1] - h[3] / 2) + 'px', width: h[2] + 'px', height: h[3] + 'px', transform: `rotate(${h[4]}deg)`, zIndex: String(40 + stackZ(name))});
    if (ns.pulse === name) b.classList.add('pulse');
    b.innerHTML = `<span class="tag${ns.pulse === name ? ' go' : ''}${amb ? ' sm' : ''}" style="transform:translateX(-50%) rotate(${-h[4]}deg) scale(var(--tag-sc,1))">${label}${em ? `<em>${em}</em>` : ''}</span>`;
    b.onclick = () => { if (b.dataset.draglock === '1') { b.dataset.draglock = ''; return; } deskClick(name); }; hots.appendChild(b); };
  if (set.has('folder')) { const left = SRC.folder.length - pulledFrom('folder'); const shut = S.beat === 'build' && !S.pulled.briefing; add('folder', '📁 Case folder', S.stamped ? 'CLOSED' : shut ? 'closed' : left ? left + ' inside' : 'empty'); }
  if (set.has('briefing')) add('briefing', '📄 Case briefing'); if (set.has('device')) add('device', th === 'b' ? '📱 Phone · recordings' : '📼 Tape recorder', recs().length + (recs().length > 1 ? ' tapes' : ' tape'));
  if (set.has('bag')) add('bag', '🔍 Evidence bag'); if (set.has('news')) add('news', '📰 Newspaper'); if (set.has('pad')) add('pad', '✏️ My notes', null, !S.notes.length);
  if (set.has('envA') || set.has('envB') || set.has('envC')) { const r = 'ABC'.split('').find(L => S.env[L] === 'ready'); add('env', '✉️ Envelopes', r ? `${r} is ready!` : 'sealed 🔒'); }
  const mk = ['mug_full', 'mug_half', 'mug_empty'].find(k => set.has(k)); if (mk) add('mug', S.mug === 2 ? '☕ Refill' : '☕ Take a sip', null, true);
  if (set.has('danish')) add('danish', '🥐 Take a bite', null, true);
  if (TAKEOUTS.some(t => set.has(t))) add('takeout', S.bites >= 4 ? '🥠 Fortune cookie' : '🥡 Take a bite', null, true);
  if (S.stamped && !S.filed && set.has('folder') && !$('#stampel')) drawStamp(true);
  if (set.has('lamp')) add('lamp', S.lampOff ? '💡 Lamp on' : '💡 Lamp off', null, true);
  $$('.hot').forEach(b => fitHot(b.dataset.name));
}
function dragTarget(e) { const el = e.target && e.target.closest && (e.target.closest('#spr img') || e.target.closest('.hot')); if (!el) return null; const name = el.dataset.hot || el.dataset.name; if (!name) return null; const hot = el.classList && el.classList.contains('hot') ? el : $(`.hot[data-name="${name}"]`); return {name, hot, el}; }
function deskBackIds(name) { if (name === 'briefing' || name === 'bag' || name === 'news') return S.pulled[name] ? [name] : []; if (name === 'device') return Object.keys(IT).filter(id => IT[id].spr === 'device' && S.pulled[id]); return []; }
function overFolder(e, name) { if (name === 'folder' || !S.folderOnDesk || S.filed || S.packed || S.beat === 'file') return false; const hot = $(`.hot[data-name="folder"]`); return [hot, $(`#spr img[data-hot="folder"]`), hot && $('.tag', hot)].filter(Boolean).some(el => { const r = el.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; }); }
function returnToFolder(name) { const ids = deskBackIds(name); if (!ids.length) return false; for (const id of ids) { delete S.pulled[id]; if (S.fresh) delete S.fresh[id]; if (S.board) delete S.board[id]; if (id === 'news') S.newsOn = ''; } if (S.strings) S.strings = S.strings.filter(s => !ids.includes(s[0]) && !ids.includes(s[1])); if (S.place) delete S.place[name]; if (S.stack) S.stack = S.stack.filter(n => n !== name); const bb = $('#bbadge'), n = Object.keys(S.board || {}).length; if (bb) { bb.hidden = !n; if (n) bb.textContent = n; } const label = ids.length === 1 ? IT[ids[0]].n.replace(/^[^:]*: /, '') : ids.length + ' tapes'; SFX.paper(); toast('📁 Back in the folder: ' + label, 2000); render(); save(); return true; }
function bindDeskDrag() { if (bindDeskDrag.done) return; bindDeskDrag.done = true; const desk = $('#desk'); if (!desk) return; let st = null, swallowClick = false, tapToken = 0;
  desk.addEventListener('pointerdown', e => { tapToken++; swallowClick = false; const hit = dragTarget(e); if (!hit || (e.button != null && e.button !== 0)) return; if (hit.hot && hit.hot.dataset.draglock === '1') hit.hot.dataset.draglock = ''; bringFront(hit.name); applyPlace(hit.name); st = {id: e.pointerId, x: e.clientX, y: e.clientY, name: hit.name, moved: false, hot: hit.hot, el: hit.el}; try { hit.el.setPointerCapture(e.pointerId); } catch (err) {} });
  const same = e => st && (e.pointerType === 'mouse' || e.pointerId == null || e.pointerId === st.id);
  const move = e => { if (!same(e)) return; const sdx = e.clientX - st.x, sdy = e.clientY - st.y; if (!st.moved && Math.hypot(sdx, sdy) < 10) return; if (!st.moved) { st.moved = true; const o = placeOff(st.name); st.ox = o[0]; st.oy = o[1]; } const sc = S._sc || 1; if (!S.place) S.place = {}; S.place[st.name] = clampOff(st.name, st.ox + sdx / sc, st.oy + sdy / sc); applyPlace(st.name); };
  const commit = e => { const moved = st.moved, hot = st.hot, name = st.name, el = st.el, pid = st.id, touch = e.pointerType === 'touch'; st = null; try { if (el && el.releasePointerCapture) el.releasePointerCapture(pid); } catch (err) {} if (!moved) { if (touch && e.type !== 'pointercancel') { const token = ++tapToken; setTimeout(() => { if (token === tapToken) deskClick(name); }, 0); } return; } if (overFolder(e, name) && deskBackIds(name).length) { swallowClick = true; if (hot) hot.dataset.draglock = '1'; setTimeout(() => returnToFolder(name), 0); return; } if (overFolder(e, name)) swallowClick = true; separateProp(name); applyPlace(name); SFX.slide(); save(); if (hot) hot.dataset.draglock = '1'; };
  const end = e => { if (!same(e)) return; if (e.type === 'pointercancel' && st.moved && !e.clientX && !e.clientY) { st.hold = true; return; } commit(e); };
  document.addEventListener('pointermove', move, true);
  document.addEventListener('pointerup', end, true);
  document.addEventListener('pointercancel', end, true);
  // A desktop drag that starts on a photograph becomes a native image drag. The pointer is then cancelled at 0,0 and the real release arrives on dragend, so the folder test never sees the drop.
  document.addEventListener('dragstart', e => { if (e.target.closest && e.target.closest('#desk')) e.preventDefault(); }, true);
  document.addEventListener('dragend', e => { if (!st || !st.hold) return; commit({clientX: e.clientX, clientY: e.clientY, pointerType: 'mouse', pointerId: st.id, type: 'dragend'}); }, true);
  desk.addEventListener('click', e => { tapToken++; if (swallowClick) { swallowClick = false; e.preventDefault(); e.stopPropagation(); return; } const hit = dragTarget(e); if (!hit) return; const locked = hit.hot && hit.hot.dataset.draglock === '1'; if (locked) { e.preventDefault(); e.stopPropagation(); hit.hot.dataset.draglock = ''; return; } if (e.target.closest && e.target.closest('#spr img')) { e.preventDefault(); e.stopPropagation(); deskClick(hit.name); } }, true);
}
bindDeskDrag();
function biteMask(im, k, n) { const spots = [[92, 32], [88, 70], [55, 96]]; const g = spots.slice(0, n).map(([x, y]) => `radial-gradient(circle at ${x}% ${y}%, transparent 17%, #000 17.5%)`).join(',');
  im.style.webkitMaskImage = im.style.maskImage = g; im.style.webkitMaskComposite = 'source-in'; im.style.maskComposite = 'intersect'; }
function recs() { return RECS.filter(([, it]) => S.pulled[it]).map(([r]) => r); }
function deskClick(n) {
  if (n === 'folder') { if (S.beat === 'file') return fileStep(); return openFolder('folder'); }
  const D = (PACK.docs || {})[n];
  if (D) return viewImg(D.img, D.title, D.html, () => { S.viewed[n] = 1; if (D.note) note(D.note); render(); }, D.face ? A[D.face] : undefined);
  if (n === 'device') { SFX.click(); const rs = recs(), pref = PACK.playFirst; return openPlayer(pref && rs.includes(pref) && !S.played[pref] ? pref : rs.find(r => !S.played[r]) || rs[0]); }
  if (n === 'pad') return openNotes();
  if (n === 'env') { const r = 'ABC'.split('').find(L => S.env[L] === 'ready'); if (r) return openEnv(r); SFX.buzz(); const s = 'ABC'.split('').find(L => S.env[L] === 'sealed');
    return toast(`🔒 Envelope ${s} is sealed. ${s === 'A' ? 'It opens when you solve Objective 1.' : s === 'B' ? 'It opens after your first breakthrough.' : 'It holds the wrap-up. It opens when the case is solved.'}`); }
  if (n === 'mug') { if (S.mug === 2) { S.mug = 0; SFX.sip(); toast('☕ Fresh cup. ' + esc(DET) + ' would approve.'); } else { S.mug++; SFX.sip(); toast(S.mug === 1 ? (amb() === 'night' ? '☕ Cold. You drink it anyway.' : '☕ Still warm.') : '☕ Last sip. Tap the mug to refill.'); } return render(); }
  if (n === 'danish') { S.bites++; SFX.bite(); toast(S.bites >= 3 ? '🥐 Gone. Crumbs on the case file.' : S.bites === 1 ? "🥐 Cherry danish. Hale's Bakery, probably." : '🥐 Still flaky.'); return render(); }
  if (n === 'takeout') { if (S.bites >= 4) { SFX.paper(); return toast('🥠 Empty carton. The fortune cookie says: “The answer is closer than it looks.”', 3600); }
    S.bites++; SFX.bite(); toast(['🥡 Lo mein from the Golden Dragon on Main.', '🥡 Still warm.', '🥡 Chopsticks in one hand, case notes in the other.', '🥡 Last bite. There\'s a fortune cookie in the bag.'][S.bites - 1]); return render(); }
  if (n === 'lamp') { S.lampOff = !S.lampOff; SFX.click(); return render(); } }
// ---------------- overlays ----------------
function ov(html, onclose) { closePeek(); const o = $('#ov'); o.innerHTML = `<div class="back"><button class="btn2" id="ovx">← Put it back on the desk</button></div><div class="box">${html}</div>`; o.hidden = false;
  const close = () => { closePeek(); o.hidden = true; o.innerHTML = ''; o.onpointerdown = o.onclick = null; if (CUR_AUD) { CUR_AUD.pause(); CUR_AUD = null; } hush(); onclose && onclose(); render(); }; $('#ovx').onclick = close; o._close = close;
  // Click the dimmed desk around the item to put it back. The press has to start and end out there,
  // so a drag that begins on a list, pin, or tape control does not dismiss, and neither does the button.
  const outside = e => { const raw = e.target; const t = raw && raw.nodeType === 1 ? raw : raw && raw.parentElement; if (!t || !t.closest || t.closest('.back, .it, #peek, .peekbox, .inv')) return false; const box = o.querySelector('.box'); if (!box) return t === o;
    if ([...box.children].some(el => el.contains(t))) return false; const r = box.getBoundingClientRect();
    const gutter = 28;
    const onY = box.scrollHeight > box.clientHeight + 2 && e.clientY >= r.top && e.clientY <= r.bottom && e.clientX >= r.right - gutter && e.clientX <= r.right + 1;
    const onX = box.scrollWidth > box.clientWidth + 2 && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.bottom - gutter && e.clientY <= r.bottom + 1;
    return !(onY || onX); };
  let arm = false; o.onpointerdown = e => { arm = outside(e); }; o.onclick = e => { const go = arm && outside(e); arm = false; if (go) close(); }; return o; }
const closeOv = () => $('#ov')._close && !$('#ov').hidden && $('#ov')._close();
document.addEventListener('keydown', e => { if (e.key !== 'Escape') return; if ($('#peek') && !$('#peek').hidden) { closePeek(); return; } closeOv(); });
function viewImg(key, title, text, after, face) { SFX.paper(); const shot = face ? `<img class="vface" src="${face}" alt="">` : ''; ov(`<div class="viewer"><img src="${A[key]}" alt=""><div class="panel">${shot}<h2>${title}</h2><p class="sub">${text}</p><button class="btn" id="vx">Done</button></div></div>`); $('#vx').onclick = closeOv; after && after(); }
const FACE_TH = new Set(PACK.faceThumbs || []);

// Where the face sits in each portrait. A wide photograph cannot be cropped from
// a fixed centre: the subject is usually below and to one side, so the case says
// where to look and every surface honours it.
const FOCUS = {};
for (const [k, v] of Object.entries(PACK.portraits || {})) if (v && v.focus) FOCUS[k] = v.focus;
const focusOf = a => FOCUS[a] || null;
const fStyle = a => { const f = focusOf(a); return f ? ` style="--ds-portrait-position:${f}"` : ''; };
// Larger print for the in-folder look, when the case has one. The thumb stays the small file.
const PEEK_BIG = {news: 'news_big', bag: 'ledger_big', report: 'report_big'};
function thumb(id) { const it = IT[id], t = it.th; const inset = it.face && A[it.face] && it.face !== t ? `<img class="inset" src="${A[it.face]}" alt="">` : ''; const face = FACE_TH.has(t) ? ' face' : ''; const doc = !face && A[t] ? ' doc' : ''; const fpos = focusOf(t); return A[t] ? `<div class="th${face}${doc}" style="background-image:url(${A[t]})${fpos && face ? `;background-position:${fpos}` : ''}">${inset}</div>` : `<div class="th">${inset || t}</div>`; }
function closePeek() { const el = $('#peek'); if (!el) return; el.hidden = true; el.style.display = 'none'; el.removeAttribute('data-open'); el.innerHTML = ''; el.onclick = el.onpointerdown = null; }
function showPeek(el) { document.body.appendChild(el); el.hidden = false; el.style.display = 'flex'; el.style.zIndex = '220'; el.dataset.open = '1'; el._opened = Date.now(); }
function peekItem(id, onTake) { const it = IT[id]; if (!it) return; SFX.paper(); const key = PEEK_BIG[id] && A[PEEK_BIG[id]] ? PEEK_BIG[id] : it.th; const src = A[key]; const portrait = /^p_/.test(String(key || ''));
  const lines = it.read ? `<div class="read">${it.read.map(l => `<p>${esc(l)}</p>`).join('')}</div>` : '';
  let shot = '';
  if (!src && CARDS[id]) shot = `<div class="peekcard"><b>${esc(CARDS[id][0])}</b><p>${esc(CARDS[id][1])}</p></div>`;
  else if (!src) shot = `<div class="peekemoji">${esc(it.th)}</div>`;
  const cap = src && CARDS[id] ? `<p class="cap"><b>${esc(CARDS[id][0])}</b> ${esc(CARDS[id][1])}</p>` : '';
  const tape = it.rec ? '<p class="sub">Put it on the desk to play the tape.</p>' : '';
  const desk = it.dest !== 'board' ? '<button type="button" data-to="desk">🗂 Put on desk</button>' : '';
  const board = it.dest !== 'desk' ? `<button type="button" data-to="board" class="${it.dest === 'both' ? 'alt' : ''}">📌 Pin to board</button>` : '';
  const el = $('#peek'); if (!el) return;
  el.dataset.item = id;
  el.innerHTML = `<div class="peekbox" role="dialog" aria-modal="true" aria-label="${esc(it.n)}"><div class="peekbar"><button type="button" class="btn2" id="peekx">← Back to the folder</button><h2>${esc(it.n)}</h2></div><div class="peekscroll">${lines}${shot}</div><div class="peekfoot">${cap}${tape}<div class="bt">${desk}${board}</div></div></div>`;
  if (src) { const img = document.createElement('img'); img.className = 'shot ' + (portrait ? 'face' : 'doc'); img.alt = it.n; img.src = src; el.querySelector('.peekscroll').appendChild(img); }
  showPeek(el);
  const sc = el.querySelector('.peekscroll'); if (sc) sc.scrollTop = 0;
  $('#peekx').onclick = e => { e.stopPropagation(); closePeek(); };
  $$('.peekfoot button', el).forEach(b => b.onclick = e => { e.stopPropagation(); onTake(id, b.dataset.to); });
  el.onpointerdown = e => { el._arm = e.target === el; e.stopPropagation(); };
  el.onclick = e => { if (el._arm && e.target === el && Date.now() - el._opened > 450) closePeek(); }; }
function openFolder(src) { SFX.paper(); const F = (PACK.folders || {})[src] || {}, title = F.title || src, blurb = F.blurb || '';
  const draw = () => { const rev = reviewOf(src), left = rev.ids.filter(i => !S.pulled[i]), nxt = left[0];
    const steps = rev.groups.map(g => { const done = g.ids.every(i => S.pulled[i]), now = nxt && g.ids.includes(nxt); return `<li class="${done ? 'done' : now ? 'now' : ''}">${esc(g.g.replace(/^\d+ · /, ''))}</li>`; }).join('');
    let items = '', lastG = '';
    for (const i of left) { const m = rev.meta[i]; if (m.g !== lastG) { lastG = m.g; items += `<div class="grp">${esc(m.g)}</div>`; }
      items += `<div class="it${i === nxt ? ' up' : ''}" data-id="${i}"><button type="button" class="look"><span class="ord">${m.n}</span>${thumb(i)}<b>${esc(IT[i].n)}</b>${i === nxt ? '<em class="why">Suggested next</em>' : ''}</button><div class="bt">${IT[i].dest !== 'board' ? '<button type="button" data-to="desk">🗂 Put on desk</button>' : ''}${IT[i].dest !== 'desk' ? `<button type="button" data-to="board" class="${IT[i].dest === 'both' ? 'alt' : ''}">📌 Pin to board</button>` : ''}</div></div>`; }
    const fold = o.querySelector('.fold'); if (!fold) return;   // the folder was closed while a redraw was queued
  fold.innerHTML = `<div class="lp"><h3>${title}</h3><p class="guide">${blurb}</p><ol class="order">${steps}</ol><p style="font-size:12.5px;color:#6B645B;margin-bottom:6px">${pulledFrom(src)} of ${rev.ids.length} taken out.</p><ul class="inv">${rev.ids.map(i => `<li data-id="${i}" class="${S.pulled[i] ? 'out' : i === nxt ? 'now' : ''}"><span class="n">${rev.meta[i].n}</span>${esc(IT[i].n)}</li>`).join('')}</ul></div>
    <div class="rp"><div class="items">${items || '<div class="allout">✓ Everything is out of here.<br><br><button class="btn" id="fdone">Back to the desk</button></div>'}</div></div>`;
    const take = (id, to) => { const card = $(`.it[data-id="${id}"]`, o); if (card && card.classList.contains('gone')) return; closePeek(); if (card) card.classList.add('gone');
    pull(id, to);   // take it now: closing the folder must not lose the action
    setTimeout(() => draw(), card ? 320 : 0); };
    o._take = take;
    $$('.it .bt button', o).forEach(b => b.onclick = e => { e.stopPropagation(); take(b.closest('.it').dataset.id, b.dataset.to); });
    const fd = $('#fdone'); if (fd) fd.onclick = closeOv; };
  const o = ov(`<div class="fold"></div>`); draw(); }
function eventEl(t) { return t && t.nodeType === 1 ? t : t && t.parentElement; }
function folderHit(e) { const el = eventEl(e.target); if (!el || !el.closest || !el.closest('#ov')) return null; if (el.closest('.bt, #peek, .back')) return null;
  const card = el.closest('#ov .it'); if (card && !card.classList.contains('gone')) return card.dataset.id;
  const li = el.closest('#ov .inv li'); if (li && !li.classList.contains('out') && li.dataset.id) return li.dataset.id; return null; }
function openFolderCard(id) { const ov = $('#ov'); if (!id || !ov || ov.hidden || !ov._take) return; const peek = $('#peek');
  if (peek && peek.dataset.open === '1' && peek.dataset.item === id && Date.now() - (peek._opened || 0) < 450) return; peekItem(id, ov._take); }
function bindFolderPeek() { if (bindFolderPeek.done) return; bindFolderPeek.done = true; let press = null, skipClick = false;
  document.addEventListener('pointerdown', e => { const id = folderHit(e); if (!id) { press = null; return; } e.stopPropagation(); press = {id: e.pointerId, x: e.clientX, y: e.clientY, item: id, moved: false}; }, true);
  document.addEventListener('pointermove', e => { if (!press || press.id !== e.pointerId || press.moved) return; if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > 22) press.moved = true; }, true);
  document.addEventListener('pointerup', e => { if (!press || press.id !== e.pointerId) return; const p = press; press = null; if (p.moved) { skipClick = true; return; } e.stopPropagation(); openFolderCard(p.item); }, true);
  document.addEventListener('pointercancel', () => { if (press && press.moved) skipClick = true; press = null; }, true);
  document.addEventListener('click', e => { const id = folderHit(e); if (!id) return; e.preventDefault(); e.stopPropagation(); if (skipClick) { skipClick = false; return; } openFolderCard(id); }, true); }
bindFolderPeek();
function pull(id, to) { if (!IT[id]) return; S.pulled[id] = 1; S.fresh[id] = 1;
  if (to === 'board') { if (id === 'news') S.newsOn = 'board'; S.board[id] = {x: BP[id][0], y: BP[id][1]}; SFX.pin(); const bb = $('#bbadge'); bb.hidden = false; bb.textContent = Object.keys(S.board).length; bb.classList.remove('pop'); void bb.offsetWidth; bb.classList.add('pop'); toast(`📌 Pinned to the board: ${IT[id].n.replace(/^[^:]*: /, '')}`, 1800); }
  else { if (id === 'news') S.newsOn = 'desk'; SFX.paper(); toast(`🗂 On your desk: ${IT[id].n.replace(/^[^:]*: /, '')}`, 1800); }
  const pulledNote = ((PACK.notes || {}).pulled || {})[id]; if (pulledNote) note(pulledNote);
  if (S.beat === 'envA' && pulledFrom('envA') === SRC.envA.length) S.beat = 'realize';
  const hook = (PACK.onPull || {})[id];
  if (hook) { if (hook.beat) S.beat = hook.beat; if (hook.note) note(hook.note);
    if (hook.card) setTimeout(() => { closeOv(); caseCard(hook.card.kick || 'Realization', COPY.accuseRecap || '', hook.card.cta || 'Back to the desk →', () => render()); }, 700); }
  renderSide(); }
// ---------------- player ----------------
let CUR_AUD = null;
function openPlayer(rid) { const L = recs(); if (!rid) return; const isB = S.theme === 'b';
  const TAIL = (PACK.tails || {})[rid];
  const META = r => TITLES[r] || [r, ''];
  const meta = META;
  const av = r => A[FACE[r]] ? `<img class="av" src="${A[FACE[r]]}" alt=""${fStyle(FACE[r])}>` : (isB ? '🎙️' : '📼');
  const o = ov(`<div class="player ${isB ? 'ph' : 'tp'}"><div><div class="recs">${L.map(r => `<button data-r="${r}" class="${r === rid ? 'on' : ''}">${av(r)} ${meta(r)[0]}</button>`).join('')}</div>
    <div class="whohead">${A[FACE[rid]] ? `<img class="avbig" src="${A[FACE[rid]]}" alt=""${fStyle(FACE[rid])}>` : ''}<div><h3>${meta(rid)[0]}</h3><div class="s">${meta(rid)[1]}</div></div></div><div class="wave" id="wave">${Array.from({length: 48}, (_, i) => `<i style="height:${15 + Math.abs(Math.sin(i * 1.7 + rid.length)) * 70 + (i * 37 % 13)}%"></i>`).join('')}</div>
    <div class="keys"><button id="pp">▶ Play</button><button id="st">⏹ Stop</button><button id="rw">↺ 10s</button>${TAIL ? '<button id="end">⏭ End</button>' : ''}</div><div class="volrow"><span class="vollab">Volume</span><button type="button" data-volmute aria-label="Mute">🔊</button><input type="range" data-vol min="0" max="100" step="1" value="100" aria-label="Volume"></div><div class="cred" id="cred">🔊 ElevenLabs voices (real audio). ${TAIL ? 'After the voiced excerpt the tape continues as text.' : 'Voiced excerpt of the interview.'}</div></div>
    <div class="tx" id="tx">${TR[rid].map((l, i) => `<div class="ln" data-i="${i}"><span class="who">${l.sp}</span><span>${l.tag ? `<em>[${esc(l.tag)}]</em> ` : ''}${esc(l.x)}</span></div>`).join('')}
    ${TAIL ? `<div class="ln txt"><span class="who"></span><em>— voiced excerpt ends; transcript continues —</em></div>` + (TR[TAIL] || []).map((l, i) => `<div class="ln txt${l.key ? ' key' : ''}"><span class="who">${l.sp}</span><span>${l.tag ? `<em>[${esc(l.tag)}]</em> ` : ''}${esc(l.x)}</span>${l.save ? `<button class="sv${S.saved[l.key] ? ' done' : ''}" data-save="${esc(l.save)}" data-key="${esc(l.key || '')}">${S.saved[l.key] ? '✓ In notes' : '☆ Save to notes'}</button>` : ''}</div>`).join('') : ''}</div></div>`);
  $$('[data-r]', o).forEach(b => b.onclick = () => { closeOv(); openPlayer(b.dataset.r); });
  const au = new Audio(AU[rid]); au.preload = 'auto'; applyVol(au); CUR_AUD = au; hush(); paintVol();
  au.onerror = () => { $('#cred') && ($('#cred').textContent = '⚠️ Audio file not found next to index.html (assets/audio/). Transcript only.'); }; const pp = $('#pp'), lines = $$('#tx .ln[data-i]'), bars = $$('#wave i');
  pp.onclick = () => { if (au.paused) { au.play().catch(() => {}); S.played[rid] = 1; renderSide(); } else au.pause(); };
  au.onplay = () => pp.textContent = '❚❚ Pause'; au.onpause = () => pp.textContent = '▶ Play';
  $('#rw').onclick = () => au.currentTime = Math.max(0, au.currentTime - 10); $('#st').onclick = () => { au.pause(); au.currentTime = 0; };
  au.ontimeupdate = () => { const t = au.currentTime; lines.forEach((e, i) => e.classList.toggle('cur', t >= TR[rid][i].t && t < TR[rid][i].e + .4)); const p = t / (au.duration || 60); bars.forEach((b, i) => b.classList.toggle('p', i / bars.length < p));
    const c = lines.find(e => e.classList.contains('cur')); if (c && c._s !== 1) { lines.forEach(e => e._s = 0); c._s = 1; c.scrollIntoView({block: 'nearest', behavior: 'smooth'}); } };
  au.onended = () => { S.played[rid] = 1; const playedNote = ((PACK.notes || {}).played || {})[rid]; if (playedNote) note(playedNote); if (TAIL) $('#tx .key').scrollIntoView({block: 'center', behavior: 'smooth'}); renderSide(); };
  const en = $('#end'); if (en) en.onclick = () => { au.pause(); S.played[rid] = 1; $('#tx .key').scrollIntoView({block: 'center', behavior: 'smooth'}); renderSide(); };
  $$('.sv', o).forEach(b => b.onclick = () => { if (b.dataset.key) S.saved[b.dataset.key] = 1; $$('.sv', o).forEach(x => { x.textContent = '✓ In notes'; x.classList.add('done'); }); note(b.dataset.save); SFX.paper(); toast('✏️ Saved: ' + b.dataset.save); renderSide(); });
  setTimeout(() => pp.click(), 250); }
function openNotes() { SFX.paper(); const o = ov(`<div class="panel" style="max-width:560px;margin:0 auto;background:#FFF6B8"><h2>✏️ My notes</h2><p class="sub">Starred lines and breakthroughs land here automatically. Write your own too.</p>
  <ul style="list-style:none;font:26px/1.3 Caveat,cursive;color:#2B3A67">${S.notes.map(n => `<li class="${n.cls}">${n.cls === 'aha' ? '★ ' : ''}${esc(n.t)}</li>`).join('') || '<li style="opacity:.6">(nothing yet)</li>'}</ul>
  <div style="display:flex;gap:8px;margin-top:12px"><input id="nin" placeholder="Write a note…" style="flex:1;font:22px Caveat;padding:8px 10px;border-radius:8px;border:1px solid #D9CF8A"><button class="btn" style="width:auto;margin:0" id="nadd">Add</button></div></div>`);
  $('#nadd').onclick = () => { const v = $('#nin').value.trim(); if (v) { note(v); closeOv(); openNotes(); } }; }
// ---------------- envelopes ----------------
function openEnv(L) { const items = (SRC['env' + L] || []).length; const o = ov(`<div class="envw"><div class="e ${L === 'B' ? 'blue' : ''}" id="env" style="background-image:url(${A.env})"><div class="line"></div><div class="tear" id="tear"></div><div class="hand">👆</div></div>
  <p>Drag along the dotted line to tear Envelope ${L} open.</p><button class="btn2" id="tap1" style="margin-top:10px">Or tap here to tear it in one go</button></div>`);
  const e = $('#env'), tr = $('#tear'); let x0 = null, done = false;
  const fin = async () => { if (done) return; done = true; SFX.tear(); tr.style.width = '100%'; await sleep(350); S.env[L] = 'open';
    $('.envw', o).innerHTML = `<img class="opened" src="${A.env_open}" style="${L === 'B' ? 'filter:hue-rotate(195deg)' : ''}" alt=""><p>Envelope ${L} is open. ${items} new ${items > 1 ? 'items' : 'item'} inside.</p><button class="btn gold" id="takeout" style="max-width:320px;margin:14px auto 0">Take ${items > 1 ? 'them' : 'it'} out →</button>`;
    const envNote = ((COPY.envelope || {}).notes || {})[L]; if (envNote) note(envNote); $('#takeout').onclick = () => { closeOv(); openFolder('env' + L); }; renderSide(); };
  e.onpointerdown = ev => { x0 = ev.clientX; e.setPointerCapture(ev.pointerId); };
  e.onpointermove = ev => { if (x0 == null) return; const p = Math.max(0, (ev.clientX - x0) / e.clientWidth); tr.style.width = Math.min(100, p * 100) + '%'; if (p > .03 && !e._s) { e._s = 1; softNoise(.18, 520, .03, .02); } if (p > .8) fin(); };
  e.onpointerup = () => { x0 = null; e._s = 0; if (!done) tr.style.width = '0'; }; $('#tap1').onclick = fin; }
// ---------------- objective 1 ----------------
function openObj() { const O = COPY.objective1 || {}; const o = ov(`<div class="panel" style="max-width:720px;margin:0 auto"><div class="next"><span class="k">${esc(O.kicker || 'Objective')}</span></div><h2>${esc(OBJ1.q)}</h2><p class="sub">${esc(O.sub || '')}</p>
  <div class="chips" style="flex-direction:column;align-items:stretch">${OBJ1.o.map((t, i) => `<button data-i="${i}" style="text-align:left;border-radius:12px;padding:12px 14px;font-size:16px">${esc(t)}</button>`).join('')}</div><div id="ores"></div>
  <p style="margin-top:12px"><button class="demo" id="owrong">${esc(O.demoWrong || 'Demo: answer wrong')}</button> · <button class="demo" id="oright">${esc(O.demoRight || 'Demo: answer right')}</button></p></div>`);
  const ans = i => { const r = $('#ores');
    if (i !== OBJ1.a) { S.obj1wrong++; SFX.buzz(); const t = O.wrong || '', hint = (O.hints || [])[Math.min(2, S.obj1wrong - 1)] || '';
      r.innerHTML = `<div class="res bad"><b>${esc(DET)}:</b> “${esc(t)}”<br><br>💡 <b>Hint ${Math.min(3, S.obj1wrong)} unlocked:</b> ${esc(hint)}</div>`; ortiz('obj1_wrong'); return; }
    S.obj1 = 1; SFX.ding(); ortiz('obj1_right'); if (O.note) note(O.note, 'ink');
    r.innerHTML = `<div class="res good"><b>${esc(O.solvedTitle || 'Solved.')}</b><br><b>${esc(DET)}</b> <span class="real" style="background:#1F5E4E;color:#fff;border-radius:999px;padding:2px 8px;font-size:11px">real voice sample</span>: “${esc(O.solvedLine || '')}”<br><br>${esc(O.solvedNote || '')}</div><button class="btn gold" id="onext">${esc(O.solvedCta || 'Continue →')}</button>`;
    S.env.A = 'ready'; S.beat = 'envA'; renderSide(); $('#onext').onclick = () => { closeOv(); openEnv('A'); }; };
  $$('.chips button', o).forEach(b => b.onclick = () => { $$('.chips button', o).forEach(x => x.classList.toggle('on', x === b)); ans(+b.dataset.i); });
  $('#owrong').onclick = () => ans(0); $('#oright').onclick = () => ans(1); }
// ---------------- board ----------------
const PIN_TAGS = PACK.pinTags || {};
function pinTag(id) { const t = PIN_TAGS[id]; if (!t) return ''; if (t.saved && !S.saved[t.saved]) return ''; return `<span class="tag2">${esc(t.text)}</span>`; }
function renderBoard() { $('#cork').src = A.cork; const P = $('#pins'); P.innerHTML = ''; const ids = Object.keys(S.board); $('#bempty').style.display = ids.length ? 'none' : 'block';
  for (const id of ids) { const [cx, cy, w, lab, lc] = BP[id]; const p = S.board[id]; const d = document.createElement('div'); d.className = 'pin' + (S.fresh[id] ? ' in' : '') + (S.sel === id ? ' sel' : ''); d.dataset.id = id;
    Object.assign(d.style, {left: p.x - w / 2 + 'px', top: p.y + 'px', width: w + 'px', transform: `rotate(${(id.length * 7 % 7) - 3}deg)`});
    const th = IT[id].th; const pinface = IT[id].face && IT[id].face !== th && A[IT[id].face] ? `<img class="pinface" src="${A[IT[id].face]}" alt=""${fStyle(IT[id].face)}>` : ''; const snap = CARDS[id] && A[th] ? `<img class="snap" src="${A[th]}" alt="">` : ''; d.innerHTML = (CARDS[id] ? `<div class="cardx">${snap}<b>${CARDS[id][0]}</b>${CARDS[id][1]}</div>` : `<img src="${A[th]}" alt="">`) + pinface + `<span class="nm ${lc || ''}">${esc(lab)}</span>` + pinTag(id);
    P.appendChild(d); dragPin(d); }
  S.fresh = {}; drawStrings(); $('#connectb').classList.toggle('on', S.connect); $('#connectb').textContent = S.connect ? '✕ Stop connecting' : '🧶 Connect two things';
  const cut = $('#cutb'); if (cut) cut.hidden = !S.strSel; const nStr = S.strings.filter(([a, b]) => S.board[a] && S.board[b]).length;
  const act = finger() ? 'Tap' : 'Click';
  $('#ctip').textContent = S.connect ? (S.sel ? 'Now tap the second thing.' : 'Tap the first thing.') : S.strSel ? `${act} Remove thread, or ${act.toLowerCase()} the thread again to cancel.` : (nStr && !$('#boardV').classList.contains('ahaing')) ? `${act} a red thread to remove it.` : ''; }
function pinPt(id) { const [, , w] = BP[id], p = S.board[id]; return [p.x, p.y + 4]; }
function drawStrings() { const sv = $('#strings'), hits = $('#stringhits'); const live = S.strings.filter(([a, b]) => S.board[a] && S.board[b]); if (S.strSel && !live.some(s => [s[0], s[1]].sort().join('+') === S.strSel)) S.strSel = null;
  const bits = live.map(([a, b, aha]) => { const [x1, y1] = pinPt(a), [x2, y2] = pinPt(b); const key = [a, b].sort().join('+'); const sel = S.strSel === key; const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1; const pad = Math.min(96, Math.max(0, (len - 70) / 2));
    const act = finger() ? 'Tap' : 'Click';
    const lab = `Thread between ${BP[a][3]} and ${BP[b][3]}. ${act} to remove it.`;
    const hitW = (S._sc && S._sc < 0.92) ? Math.max(44, Math.round(48 / S._sc)) : 0;
    return {key, a, b, yarn: `<g class="thread${aha ? ' aha' : ''}${sel ? ' sel' : ''}" data-key="${key}"><line class="yarn${aha ? ' aha' : ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/></g>`,
      hit: `<g class="thread${sel ? ' sel' : ''}" data-a="${a}" data-b="${b}" data-key="${key}" role="button" aria-label="${esc(lab)}"><line class="hit"${hitW ? ` style="stroke-width:${hitW}"` : ''} x1="${x1 + dx / len * pad}" y1="${y1 + dy / len * pad}" x2="${x2 - dx / len * pad}" y2="${y2 - dy / len * pad}"/></g>`}; });
  sv.innerHTML = bits.map(p => p.yarn).join(''); hits.innerHTML = bits.map(p => p.hit).join('');
  $$('#stringhits .thread').forEach(g => { g.onclick = e => { e.stopPropagation(); pickThread(g.dataset.a, g.dataset.b); };
    g.onmouseenter = () => { const y = sv.querySelector(`[data-key="${g.dataset.key}"]`); if (y) y.classList.add('hot'); };
    g.onmouseleave = () => { const y = sv.querySelector(`[data-key="${g.dataset.key}"]`); if (y) y.classList.remove('hot'); }; }); }
function pickThread(a, b) { const key = [a, b].sort().join('+'); S.strSel = S.strSel === key ? null : key; S.connect = false; S.sel = null; SFX.click(); renderBoard(); }
function cutThread() { if (!S.strSel) return; const key = S.strSel; S.strings = S.strings.filter(s => [s[0], s[1]].sort().join('+') !== key); S.strSel = null; SFX.paper(); save(); renderBoard(); toast('✂ Thread removed.'); }
function dragPin(d) { let st = null; d.onpointerdown = e => { st = {x: e.clientX, y: e.clientY, ox: S.board[d.dataset.id].x, oy: S.board[d.dataset.id].y, moved: false}; d.setPointerCapture(e.pointerId); d.style.zIndex = 5; };
  d.onpointermove = e => { if (!st) return; const sdx = e.clientX - st.x, sdy = e.clientY - st.y; if (!st.moved && Math.hypot(sdx, sdy) < 10) return; st.moved = true; const dx = sdx / (S._sc || 1), dy = sdy / (S._sc || 1);
    const id = d.dataset.id, w = BP[id][2]; S.board[id].x = Math.max(w / 2, Math.min(1280 - w / 2, st.ox + dx)); S.board[id].y = Math.max(10, Math.min(700, st.oy + dy)); d.style.left = S.board[id].x - w / 2 + 'px'; d.style.top = S.board[id].y + 'px'; drawStrings(); };
  d.onpointerup = () => { const m = st && st.moved; st = null; d.style.zIndex = ''; if (!m) pinTap(d.dataset.id); else save(); }; }
function pinTap(id) { S.strSel = null; if (!S.connect) { S.connect = true; S.sel = id; SFX.click(); return renderBoard(); }
  if (!S.sel) { S.sel = id; return renderBoard(); } if (S.sel === id) { S.sel = null; return renderBoard(); }
  const a = S.sel, b = id; S.sel = null; S.connect = false; const pair = [a, b].sort().join('+');
  const tied = S.strings.some(s => [s[0], s[1]].sort().join('+') === pair); if (!tied) S.strings.push([a, b, false]); SFX.pin();
  const BT = PACK.breakthrough || {};
  if (BT.pair && pair === [...BT.pair].sort().join('+') && !S.real) {
    if (BT.requiresSaved && !S.saved[BT.requiresSaved]) { renderBoard(); return toast(BT.locked || '', 3600); }
    return aha(a, b);
  }
  const near = (BT.near || []).find(n => [...n.pair].sort().join('+') === pair);
  if (near && !S.real) { renderBoard(); return toast(near.hint || '', 3200); }
  renderBoard(); toast(tied ? 'Those two are already tied.' : `🧶 String tied. ${finger() ? 'Tap' : 'Click'} that red thread to remove it.`, tied ? 1800 : 2800); }
async function aha(a, b) { S.real = true; const s = S.strings.find(s => [s[0], s[1]].sort().join('+') === [a, b].sort().join('+')); s[2] = true; setView('board'); renderBoard();
  const bv = $('#boardV'); bv.classList.add('ahaing'); $$('.pin').forEach(p => p.classList.toggle('hero', p.dataset.id === a || p.dataset.id === b));
  SFX.sting(); const f = document.createElement('div'); f.className = 'flash'; document.body.appendChild(f); setTimeout(() => f.remove(), 1200); await sleep(1100);
  const H = COPY.aha || {};
  const c = document.createElement('div'); c.className = 'aha-card'; c.innerHTML = `<div class="k">${esc(H.kicker || 'Breakthrough')}</div><h2>${esc(H.title || '')}</h2><p>${esc(H.body || '')}</p><div class="q"><b>${esc(DET)}:</b> “${esc(H.line || '')}”</div><p style="font-size:13px;color:#7A7268">${esc(H.footer || '')}</p><button class="btn gold" id="ahax">${esc(H.cta || 'Continue →')}</button>`;
  S.env.B = 'ready'; document.body.appendChild(c); ortiz('aha'); if (H.tag) S.notes = S.notes.filter(n => n.t !== H.tag); if (H.note) note(H.note, 'aha ink'); S.env.B = 'ready';
  $('#ahax').onclick = () => { c.remove(); bv.classList.remove('ahaing'); $$('.pin').forEach(p => p.classList.remove('hero')); hush(); setView('desk'); render(); }; }
// ---------------- accusation ----------------
const REPORT_PARTS = (PACK.report || []).length + 1;   // every question, plus the proof pick
function openReport() { const pins = Object.keys(S.board).concat(Object.keys(S.pulled).filter(id => IT[id] && IT[id].rec && !S.board[id])); S.rep.proof = S.rep.proof || [];
  const draw = () => { const left = 3 - S.tries;
    o.querySelector('.report').innerHTML = `<h2>${esc(REPORTC.title || 'Report')}</h2><div class="sub">${esc(REPORTC.sub || '')}</div>
    <div class="tries">Report attempts: ${[0, 1, 2].map(i => `<i class="${i < S.tries ? 'x' : ''}"></i>`).join('')} <span style="font-weight:400;color:#7A7268">${left} left</span></div>
    ${REPORT.map(q => `<div class="q"><b>${q.l}</b><div class="chips" data-k="${q.k}">${q.o.map(([v, t]) => `<button data-v="${v}" class="${S.rep[q.k] === v ? 'on' : ''}">${q.o === SUS ? `<img src="${A['p_' + v]}" alt="">` : ''}${esc(t)}</button>`).join('')}</div></div>`).join('')}
    <div class="q"><b>Pick the 3 pieces of evidence that prove it</b><div class="chips" data-k="proof">${pins.map(v => { const face = IT[v] && IT[v].face && A[IT[v].face]; return `<button data-v="${v}" class="${S.rep.proof.includes(v) ? 'on' : ''}">${face ? `<img src="${A[IT[v].face]}" alt="">` : ''}${esc((BP[v] || [0, 0, 0, IT[v].n])[3])}</button>`; }).join('')}</div></div>
    <div id="rres"></div><div class="rfoot"><button class="btn" id="send">${esc(REPORTC.send || '📨 Send report')}</button><button class="demo" id="dw">Demo: fill a wrong report</button><button class="demo" id="dr">Demo: fill the right report</button>${S.tries ? '<button class="demo" id="d3">Demo: use up all attempts</button>' : ''}</div>`;
    $$('.chips', o).forEach(ch => ch.onclick = e => { const b = e.target.closest('button'); if (!b) return; const k = ch.dataset.k, v = b.dataset.v; SFX.click();
      if (k === 'proof') { const p = S.rep.proof; p.includes(v) ? p.splice(p.indexOf(v), 1) : (p.length < 3 ? p.push(v) : toast('Pick 3. Tap one to remove it first.')); } else S.rep[k] = v; draw(); });
    const DEMO = PACK.reportDemos || {};
    const fill = spec => { if (!spec) return; const c = Object.assign({}, spec, {proof: (spec.proof || []).filter(x => pins.includes(x)).slice(0, 3)}); Object.assign(S.rep, c); draw(); };
    $('#send').onclick = send; $('#dw').onclick = () => fill(DEMO.wrong);
    $('#dr').onclick = () => fill(DEMO.right);
    const d3 = $('#d3'); if (d3) d3.onclick = () => { S.tries = 3; closeOv(); softFail(); }; };
  const send = () => { const miss = REPORT.filter(q => !S.rep[q.k]); if (miss.length || S.rep.proof.length < 3) { SFX.buzz(); return toast('Fill every blank and pick 3 pieces of evidence first.'); }
    const okProof = S.rep.proof.filter(p => PROOF_OK.includes(p)).length >= 2; const right = REPORT.filter(q => S.rep[q.k] === q.a).length + (okProof ? 1 : 0);
    if (right === REPORT_PARTS) { S.solved = true; SFX.ding(); closeOv(); return reveal(); }
    S.tries++; S.hints++; SFX.buzz(); const first = REPORT.find(q => S.rep[q.k] !== q.a); const push = first ? first.push : (REPORTC.fallbackPush || 'Your evidence does not prove it.');
    draw(); $('#rres').innerHTML = `<div class="res bad"><b>${right} of ${REPORT_PARTS} parts are right.</b> ${esc(REPORTC.rejected || '')}<br><b>${esc(DET)}:</b> “${esc(push)}”${S.tries >= 3 ? '<br><br>That was your last attempt.' : '<br>💡 That line is your hint. The case stays open.'}</div>${S.tries >= 3 ? `<button class="btn red" id="sf">${esc(REPORTC.closeCase || 'Close the case →')}</button>` : ''}`;
    ortiz(first ? 'push_' + first.k : 'push_proof'); const sf = $('#sf'); if (sf) sf.onclick = () => { closeOv(); softFail(); }; };
  const o = ov(`<div class="report"></div>`); draw(); }
function scene(html, lite) { const s = $('#scene'); s.className = lite ? 'lite' : ''; s.innerHTML = `<div class="sc">${html}</div>`; s.hidden = false; return s; }
const unscene = () => { $('#scene').hidden = true; $('#scene').innerHTML = ''; hush(); };
async function reveal() { const R = COPY.reveal || {};
  const s = scene(`<div class="reveal"><div class="kick">${esc(R.kicker || 'Case solved')}</div><h1>${esc(R.who || '')}</h1><p class="lead">${esc(R.lead || '')}</p><div id="sols"></div><div class="row"><button class="btn gold" id="sn">Next ▸</button></div></div>`);
  let i = 0; const sols = $('#sols');
  const step = () => { if (i < SOL.length) { const p = document.createElement('p'); p.className = 'sol'; p.innerHTML = `${esc(SOL[i][0])}<span class="ev">${esc(SOL[i][1])}</span>`; sols.appendChild(p); requestAnimationFrame(() => p.classList.add('on')); ortiz('sol' + (i + 1)); i++; return; }
    if (i === SOL.length) { i++; sols.innerHTML = `<p class="sol on" style="font-size:22px">${esc(R.closingTitle || '')}</p><p class="sol on" style="opacity:.75">${esc(R.closingCharge || '')}</p>`; ortiz('found'); $('#sn').textContent = '✉️ Open Envelope C'; return; }
    const C = R.envC || {};
    S.env.C = 'open'; hush(); SFX.tear(); save(); s.querySelector('.sc').innerHTML = `<div class="kick">${esc(C.kicker || 'The wrap-up')}</div><div class="wrap"><div class="paper"><div class="mast">${esc(C.mast || '')}</div><h3>${esc(C.headline || '')}</h3><p>${esc(C.body || '')}</p></div>
      <div class="paper note">${C.note || ''}</div></div><div class="row" style="margin-top:24px"><button class="btn gold" id="nm">📁 File the case away →</button></div>`;
    $('#nm').onclick = () => { unscene(); S.beat = 'file'; render(); toast('📁 One last thing: pack it up and file it away.', 3000); }; };
  $('#sn').onclick = step; step(); }
function softFail() { const F = COPY.softFail || {}; S.assisted = true; S.solved = true; save(); setTimeout(() => ortiz('softfail'), 300);
  scene(`<div class="kick" style="color:#FF8A80">${esc(F.kicker || 'Case closed')}</div><h1>${esc(F.who || '')}</h1><p class="lead">${esc(F.lead || '')}</p>
  <div class="card" style="background:#1E1C1A;color:#F3EEE6;max-width:720px"><b>${esc(F.title || 'What you missed')}</b><ul style="margin:10px 0 0 18px;line-height:1.7">${(F.bullets || []).map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
  <div class="row" style="margin-top:22px"><button class="btn gold" id="nm">📁 File the case away →</button><button class="skip" id="rt">Rewind and try the report again</button></div>`);
  $('#nm').onclick = () => { unscene(); S.beat = 'file'; render(); toast('📁 ' + esc(DET) + ' closed it. You still have to file it away.', 3000); };
  $('#rt').onclick = () => { S.tries = 0; S.assisted = false; S.solved = false; unscene(); openReport(); }; }
// ---------------- file away ----------------
function drawStamp(instant) { const fol = HOT[S.theme].folder, off = placeOff('folder'), st = document.createElement('div'); st.className = 'stamp'; st.textContent = S.assisted ? 'CLOSED · ASSISTED' : 'CASE CLOSED'; st.style.left = fol[0] + off[0] - (S.assisted ? 190 : 150) + 'px'; st.style.top = fol[1] + off[1] - 40 + 'px'; st.id = 'stampel';
  if (instant) st.style.opacity = .9; $('#desk').appendChild(st); if (!instant) requestAnimationFrame(() => st.classList.add('on')); }
async function fileStep() { const fol = HOT[S.theme].folder, foff = placeOff('folder'), fx = fol[0] + foff[0], fy = fol[1] + foff[1];
  if (!S.packed) { closeOv(); setView('desk'); const D = CFG.desk[S.theme]; const ks = ['briefing', 'device', 'bag', 'news'].filter(k => $(`#spr img[data-k="${k}"]`));
    for (const k of ks) { const im = $(`#spr img[data-k="${k}"]`); const d = D.spr[k], soff = placeOff(hotForSprite(k)), x = d.x + soff[0], y = d.y + soff[1]; im.style.transition = 'transform .6s cubic-bezier(.5,0,.3,1),opacity .6s'; im.style.transform = `translate(${fx - x - d.w / 2}px,${fy - y - d.h / 2}px) scale(.3) rotate(8deg)`; im.style.opacity = 0; SFX.paper(); await sleep(300); }
    const nb = Object.keys(S.board).length; await sleep(400); S.packed = true; S.board = {}; S.strings = []; $('#bbadge').hidden = true; render(); toast(`📁 Everything's back in the folder: ${ks.length} desk items and ${nb} pins.`, 2800); return; }
  if (!S.stamped) { S.stamped = true; drawStamp(false); setTimeout(SFX.stamp, 300); setTimeout(render, 700); return; }
  if (!S.filed) { const dr = $('#drawer'); dr.hidden = false; await sleep(30); dr.classList.add('up'); SFX.drawer(); await sleep(800);
    const im = $('#spr img[data-k="folder"]'), st = $('#stampel'); for (const e of [im, st]) if (e) { e.style.transition = 'transform .9s cubic-bezier(.5,0,.4,1),opacity .9s'; e.style.transform = `translate(${640 - fx}px,${720 - fy}px) scale(.5) ${e === st ? 'rotate(-14deg)' : ''}`; e.style.opacity = 0; }
    await sleep(1000); S.filed = true; SFX.drawer(); dr.classList.remove('up'); if (st) st.remove(); render(); await sleep(900); dr.hidden = true; return rankCard(); }
  rankCard(); }
function rankCard() { const K = COPY.rank || {};
  const mins = Math.max(1, Math.round((Date.now() - S.t0) / 60000));
  const rank = S.assisted ? (K.rankAssisted || 'Rookie (assisted)') : S.tries === 0 && S.obj1wrong === 0 ? (K.rankClean || 'Senior Detective') : (K.rankNormal || 'Detective');
  const total = Object.values(SRC).reduce((n, a) => n + a.length, 0), got = Object.keys(S.pulled).length;
  const shelf = (K.shelf || []).map((s, i) => `<div${i === 0 ? ' class="f"' : ''}>${esc(s[0])}<br>${esc(s[1])}</div>`).join('');
  scene(`<div class="kick">${esc(K.kicker || 'Case record · filed')}</div><div class="rank"><div><h1>${esc(CASE.title.replace(/\n/g, ' '))}</h1><p class="lead">${esc(S.assisted ? (K.assisted || '') : (K.solved || ''))}</p>
    <div class="shelf">${shelf}</div></div>
    <div><div class="stat"><span>Rank</span><b>${esc(rank)}</b></div><div class="stat"><span>Time since you opened the case</span><b>${mins} min</b></div><div class="stat"><span>Wrong answers / reports</span><b>${S.obj1wrong} / ${S.tries}</b></div><div class="stat"><span>Breakthroughs</span><b>${S.real ? 1 : 0} of ${K.breakthroughTotal || 1}</b></div><div class="stat"><span>Evidence taken out</span><b>${got} of ${total}</b></div>
    <div class="row" style="margin-top:20px"><button class="btn gold" id="bk">Back to my desk</button><button class="btn" id="again" style="background:#3A3632">↺ Play the journey again</button></div></div></div>`);
  $('#bk').onclick = () => { unscene(); toast(mealFor(amb()) === 'takeout' ? '🥡 A clean desk. The takeout\'s still warm.' : '☕ A clean desk. Coffee\'s still hot.'); }; $('#again').onclick = () => { unscene(); clearSave(); jump('intro'); }; }
// ---------------- next step / side ----------------

// Progression hints are written by the case, not the engine: see cases/<id>/case.js
// -> steps(G). G exposes only what a hint needs, so a case cannot reach inside
// the player.
const CASE_API = {
  get S() { return S; }, get IT() { return IT; }, get OBJ1() { return OBJ1; }, get SRC() { return SRC; },
  openFolder, deskClick, openPlayer, openObj, openEnv, openReport, fileStep, rankCard,
  setView, renderBoard, pulledFrom, nextReviewId
};
function nextStep() { return PACK.steps(CASE_API); }
function renderSide() { const ns = nextStep(); const a = amb(), ph = AMB[a];
  const st = S.filed ? 'Filed' : S.solved ? 'Solved' : S.beat === 'intro' ? 'New' : 'Open';
  $('#day').innerHTML = `<span class="ic">${ph[0]}</span>Case ${PACK.number || ''} · ${st}<small title="Desk ambience follows your real clock">${ph[1]} · ${new Date().toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})}${AMB_PREVIEW ? ' (preview)' : ''}</small>`;
  $('#next').innerHTML = `<span class="k">${esc(DET)}</span><h3>${esc(ns.t)}</h3><p>${esc(ns.p)}</p>${ns.go ? `<button class="btn" id="nsb">${esc(ns.btn || 'Go')}</button>` : ''}`; const nb = $('#nsb'); if (nb) nb.onclick = ns.go; renderWhisper(ns);
  const tot = Object.values(SRC).reduce((n, a) => n + a.length, 0), got = Object.keys(S.pulled).length;
  const ob = [S.obj1, S.real, S.solved]; const E = {A: '#B83A2E', B: '#2E5C9A', C: '#2F7A4A'};
  $('#prog').innerHTML = `<h5>Case progress</h5><div class="r">Objectives <span class="envs" style="flex:1;margin-left:8px">${ob.map((o, i) => `<span style="background:${o ? 'var(--accent)' : '#9A9187'};opacity:${o ? 1 : .35}">${o ? '✓' : i + 1}</span>`).join('')}</span></div>
    <div class="r">Envelopes <span class="envs" style="flex:1;margin-left:8px">${'ABC'.split('').map(L => `<span class="${S.env[L]}" style="background:${E[L]}">${L}${S.env[L] === 'sealed' || S.env[L] === 'hidden' ? ' 🔒' : ''}</span>`).join('')}</span></div>
    <div class="r">Evidence out <span class="bar"><i style="width:${got / tot * 100}%"></i></span><b>${got}/${tot}</b></div>
    <div class="r">Breakthroughs <b>${S.real ? '★' : '☆'}☆☆</b></div>${S.beat === 'accuse' || S.tries ? `<div class="r">Report attempts left <b>${3 - S.tries}</b></div>` : ''}`;
  $('#notelist').innerHTML = S.notes.map(n => `<li class="${n.cls}${n.isnew ? ' new' : ''}">${esc(n.t)}</li>`).join('') || '<li style="opacity:.5">(nothing yet)</li>'; S.notes.forEach(n => n.isnew = false);
  const bi = BEATS.findIndex(x => x[0] === S.beat);
  $('#rail').innerHTML = BEATS.map(([k, l], i) => `${i ? '<b class="sep"></b>' : ''}<button data-j="${k}" class="${i < bi ? 'done' : i === bi ? 'cur' : ''}"><i>${i < bi ? '✓' : i + 1}</i>${l}</button>`).join('');
  $$('#rail button').forEach(b => b.onclick = () => jump(b.dataset.j));
  const n = Object.keys(S.board).length, bb = $('#bbadge'); bb.hidden = !n; bb.textContent = n;
  $$('#dz [data-theme]').forEach(b => b.classList.toggle('on', b.dataset.theme === S.theme)); $$('#todrow button').forEach(b => b.classList.toggle('on', (b.dataset.p || null) === AMB_PREVIEW)); $('#voiceb').textContent = S.voice ? '🔊 On' : '🔇 Off'; save(); }
function renderWhisper(ns) { const el = $('#whisper'); if (!el) return; const show = !!(ns && ns.w && S.beat !== 'intro' && S.beat !== 'handoff'); el.hidden = !show; if (!show) return;
  el.innerHTML = `<span class="who">${esc(DET)}</span><span class="line">${esc(ns.w)}</span>`; el.onclick = () => { if (ns.go) ns.go(); }; }
function render() { document.body.classList.remove('th-b', 'th-d'); document.body.classList.add('th-' + S.theme); document.body.classList.toggle('preview', !!PREVIEW); syncMeal(); renderDesk(); if (S.view === 'board') renderBoard(); renderSide(); fitAll(); }
function setView(v) { S.view = v; $$('#seg button').forEach(b => b.classList.toggle('on', b.dataset.v === v)); $('#deskV').classList.toggle('on', v === 'desk'); $('#boardV').classList.toggle('on', v === 'board'); if (v === 'board') renderBoard(); if (v !== 'board') { S.connect = false; S.sel = null; } fitAll(); }
$$('#seg button').forEach(b => b.onclick = () => setView(b.dataset.v));
$('#connectb').onclick = () => { S.connect = !S.connect; S.sel = null; S.strSel = null; renderBoard(); };
$('#cutb').onclick = () => cutThread();
$('#board').onclick = e => { if (window.__jpPan) return; if (e.target.closest('.pin') || e.target.closest('.thread')) return; if (!S.strSel) return; S.strSel = null; renderBoard(); };
paintVol();
$('#hintb').onclick = () => { S.hints++; const ns = nextStep(); toast(esc(DET) + ': ' + (ns.w || ns.p), 4200); };
$('#dzb').onclick = () => { $('#dz').hidden = !$('#dz').hidden; };
$$('#dz [data-theme]').forEach(b => b.onclick = () => { S.theme = b.dataset.theme; localStorage.setItem('jp-theme', S.theme); prevSet = new Set(deskSet()); render(); });
$('#todrow').innerHTML = `<button data-p="">🕰 My clock</button>` + Object.keys(AMB).map(p => `<button data-p="${p}">${AMB[p][0]} ${AMB[p][1]}</button>`).join(''); $$('#todrow button').forEach(b => b.onclick = () => setAmb(b.dataset.p));
$('#newb').onclick = () => {
  if (PREVIEW) { if (!confirm('Restart the preview from the intro? Your real saved game on this device is left alone.')) return; $('#dz').hidden = true; previewGoto(0, {user: true}); return; }
  if (!confirm('Start the case over? Your saved progress on this device will be erased.')) return; $('#dz').hidden = true; clearSave(); jump('intro'); };
$('#voiceb').onclick = () => { S.voice = !S.voice; hush(); renderSide(); };
$('#jumprow').innerHTML = BEATS.map(([k, l]) => `<button data-j="${k}">${l}</button>`).join(''); $$('#jumprow button').forEach(b => b.onclick = () => { $('#dz').hidden = true; jump(b.dataset.j); });
// ---------------- scenes: intro, handoff, day card ----------------
function caseCard(kick, recap, btn, then) { SFX.paper(); const s = scene(`<div class="dcard"><div class="kick">${kick}</div><div class="big" style="font-size:44px">★</div><p class="recap">${esc(recap)}</p><button class="btn gold" id="dc">${btn}</button></div>`);
  $('#dc').onclick = () => { unscene(); then(); }; }
function paintCaseCover(s) { if (!CASE.cover) return; s.classList.add('album');
  const bg = document.createElement('div'); bg.className = 'album-bg'; bg.setAttribute('aria-hidden', 'true');
  bg.style.backgroundImage = `url("${String(CASE.cover).replace(/["\\]/g, '')}")`;
  const scrim = document.createElement('div'); scrim.className = 'album-scrim'; scrim.setAttribute('aria-hidden', 'true');
  s.prepend(bg, scrim); }
function intro() { clearSave(); S.beat = 'intro'; render();
  const s = scene(`<div class="kick">${esc(CASE.kick)}</div><h1>${esc(CASE.title).replace(/\n/g, '<br>')}</h1><p class="lead">${esc(CASE.lead)}</p>
    <div class="row"><button class="btn gold" id="i1">▶ Begin</button><span style="opacity:.78;font-size:14px">${esc((COPY.intro && COPY.intro.hint) || '')}</span></div>`);
  paintCaseCover(s); $('#i1').onclick = cold; }
async function cold() { const C = COPY.cold || {}, L = C.lines || [];
  scene(`<div class="kick">${esc(C.kicker || 'Cold open')}</div><div class="cold">${L.map(l => `<span>${esc(l)} </span>`).join('<br>')}</div><div class="row" style="margin-top:26px"><button class="btn gold" id="c1">${esc(C.cta || 'Continue')}</button><button class="skip" id="c2">${esc(C.skip || 'Skip')}</button></div>`);
  let stop = false; $('#c1').onclick = () => { stop = true; pickDesk(); }; $('#c2').onclick = () => { stop = true; pickDesk(); };
  if (!L.length) return;
  ortiz('cold'); const sp = $$('.cold span'), tot = L.join('').length; for (const [k, e] of sp.entries()) { if (stop) break; e.classList.add('on'); await sleep(Math.max(1200, L[k].length / tot * 27000)); } }
function pickDesk() { hush(); scene(`<div class="kick">Choose your desk</div><h1 style="font-size:34px">Where do you want to work this case?</h1><p class="lead">Same case, same evidence. Change it any time under ⚙ Prototype.</p>
  <div class="picks"><button class="pick ${S.theme === 'b' ? 'on' : ''}" data-t="b"><img src="${A.thumb_b}" alt=""><div><h3>☀️ Clean Daylight desk</h3><p>Bright, calm and tidy. Recordings play on a phone.</p></div></button>
  <button class="pick ${S.theme === 'd' ? 'on' : ''}" data-t="d"><img src="${A.thumb_d}" alt=""><div><h3>🍳 Kitchen Table</h3><p>Warm and homey, with morning sun. Recordings play on a tape recorder.</p></div></button></div>`);
  $$('.pick').forEach(b => b.onclick = () => { S.theme = b.dataset.t; localStorage.setItem('jp-theme', S.theme); render(); howTo(); }); }
function howTo() { const H = COPY.howTo || {};
  scene(`<div class="kick">${esc(H.kicker || 'How it works')}</div><h1 style="font-size:34px">${esc(H.title || '')}</h1>
  <div class="how">${(H.steps || []).map(([icon, head, body]) => `<div><b>${icon}</b><h3>${esc(head)}</h3><p>${esc(body)}</p></div>`).join('')}</div>
  <p class="lead" style="margin-top:0">${esc(H.note || '')}</p><button class="btn gold" id="h1">${esc(H.cta || 'Continue →')}</button>`);
  $('#h1').onclick = handoff; }
async function handoff() { const H = COPY.handoff || {}, L = H.lines || [];
  S = Object.assign(fresh(), {theme: S.theme, voice: S.voice, beat: 'handoff', t0: S.t0}); prevSet = new Set(); setView('desk'); render();
  const face = A[H.portrait] || '';
  const s = scene(`<div class="talk">${face ? `<img src="${face}" alt="">` : ''}<div class="bub"><div class="who">${esc(H.speaker || '')}${H.role ? ' · ' + esc(H.role) : ''}</div><div class="t" id="ht"></div><div class="ctl"><button class="btn" id="hn">${esc(H.next || 'Next ▸')}</button><button class="skip" id="hs" style="color:#7A7268">${esc(H.skip || 'Skip')}</button><small id="hc"></small></div></div></div>`, true);
  let i = -1, typing = null; const T = $('#ht');
  const show = async () => { i++; if (i >= L.length) return done(); const [t, ev] = L[i]; $('#hc').textContent = `${i + 1} / ${L.length}${H.voiceNote ? ' · ' + H.voiceNote : ''}`; ortiz('h' + (i + 1));
    if (ev === 'folder') { S.folderOnDesk = true; render(); SFX.paper(); } if (ev === 'env') { S.env = {A: 'sealed', B: 'sealed', C: 'sealed'}; render(); SFX.paper(); }
    T.innerHTML = ''; const my = typing = {}; for (let k = 0; k <= t.length; k += 2) { if (typing !== my) return; T.textContent = t.slice(0, k); await sleep(14); } T.textContent = t;
    if (ev === 'obj' && H.objective) T.innerHTML += `<div style="margin-top:10px;background:#F2C14E;border-radius:10px;padding:8px 12px;font:700 15px Atkinson">${esc(H.objective)}</div>`;
    if (i === L.length - 1) $('#hn').textContent = H.start || 'Continue →'; };
  const done = () => { typing = null; hush(); S.folderOnDesk = true; if (S.env.A === 'hidden') S.env = {A: 'sealed', B: 'sealed', C: 'sealed'}; S.beat = 'build'; note(H.objectiveNote || H.objective || ''); unscene(); render(); const f = $('.hot[data-name="folder"]'); if (f) f.focus({preventScroll: true}); if (H.toast) toast(esc(H.toast), 3400); };
  $('#hn').onclick = show; $('#hs').onclick = done; show(); }
// ---------------- jump presets ----------------

// Jumping to a beat fills in state "as if you had played up to it". That shape is
// the case's, not the engine's: see cases/<id>/case.js -> seed(beat, G).
const JUMP_API = {
  get S() { return S; }, SRC, IT, BP, note, setView, intro, handoff, render, previewNoteJump,
  reseed() { S.fresh = {}; prevSet = new Set(deskSet()); }
};
function jump(b) {
  unscene(); closeOv();
  const th = S.theme, v = S.voice;
  S = fresh(); S.theme = th; S.voice = v;
  prevSet = new Set();
  $('#drawer').hidden = true; $('#drawer').classList.remove('up');
  const st = $('#stampel'); if (st) st.remove();
  PACK.seed(b, JUMP_API);
}
// ---------------- preview timeline (?preview=1 only) ----------------
// Developer scrubber so someone can walk the whole journey and feel where it is rough.
// Not a player feature. The hash is already the beat jumper (#accuse and the rest), so the
// gate is the query string preview=1. save() and clearSave() no-op while PREVIEW is set,
// and boot does not call loadSave(), so the real playthrough in jp-save-v2 is left alone.
// Reload without the query and the saved game behaves as before.
const PREVIEW_DWELL = 4000;

let previewApplying = false,
    previewIndex = 0, previewPlaying = false, previewTimer = null, previewReady = false, previewDragging = false, pvPointer = false;
function addNote(t, cls) { if (!t || S.notes.some(n => n.t === t)) return; S.notes.push({t: t, cls: cls || '', isnew: false}); }
function previewResetChrome() {
  hush();
  if (CUR_AUD) { try { CUR_AUD.pause(); } catch (e) {} CUR_AUD = null; }
  closePeek(); const o = $('#ov'); if (o) { o.hidden = true; o.innerHTML = ''; o._close = null; }
  unscene();
  $$('.aha-card, .flash').forEach(e => e.remove());
  const bv = $('#boardV'); if (bv) bv.classList.remove('ahaing');
  const dr = $('#drawer'); if (dr) { dr.hidden = true; dr.classList.remove('up'); }
  const st = $('#stampel'); if (st) st.remove();
  const dz = $('#dz'); if (dz) dz.hidden = true;
}
function previewBlank() {
  const th = S.theme, v = S.voice;
  previewResetChrome();
  S = fresh(); S.theme = th; S.voice = v; prevSet = new Set();
}
function previewFinish(view) {
  S.fresh = {}; prevSet = new Set(deskSet()); setView(view || 'desk'); render();
}
function showAha() {
  const bv = $('#boardV'); bv.classList.add('ahaing');
  const btPair = (PACK.breakthrough || {}).pair || [];
  $$('.pin').forEach(p => p.classList.toggle('hero', btPair.includes(p.dataset.id)));
  const c = document.createElement('div'); c.className = 'aha-card';
  const HA = COPY.aha || {};
  c.innerHTML = `<div class="k">${esc(HA.kicker || '')}</div><h2>${esc(HA.title || '')}</h2><p>${esc(HA.body || '')}</p><div class="q"><b>${esc(DET)}:</b> \u201c${esc(HA.line || '')}\u201d</div><p style="font-size:13px;color:#7A7268">${esc(HA.footer || '')}</p><button class="btn gold" id="ahax" type="button">${esc(HA.cta || 'Continue →')}</button>`;
  document.body.appendChild(c);
  $('#ahax').onclick = () => previewGoto(idIndex('envB'), {user: true});
}

function stageIntro() {
  previewBlank(); S.beat = 'intro';
  intro();
  const b = $('#i1'); if (b) b.onclick = () => previewGoto(idIndex('cold'), {user: true});
}
function stageCold() {
  previewBlank(); S.beat = 'intro'; previewFinish('desk');
  const L = (COPY.cold && COPY.cold.lines) || [];
  scene(`<div class="kick">${esc((COPY.cold && COPY.cold.kicker) || 'Cold open')}</div><div class="cold">${L.map(l => `<span class="on">${esc(l)} </span>`).join('<br>')}</div><div class="row" style="margin-top:26px"><button class="btn gold" id="c1" type="button">Continue</button><button class="skip" id="c2" type="button">Skip intro</button></div>`);
  const go = () => previewGoto(idIndex('desk'), {user: true});
  $('#c1').onclick = go; $('#c2').onclick = go;
}
function stageDesk() {
  previewBlank(); S.beat = 'intro'; previewFinish('desk');
  pickDesk();
  $$('.pick').forEach(b => b.onclick = () => { S.theme = b.dataset.t; previewGoto(idIndex('how'), {user: true}); });
}
function stageHow() {
  previewBlank(); S.beat = 'intro'; previewFinish('desk');
  howTo();
  const b = $('#h1'); if (b) b.onclick = () => previewGoto(idIndex('handoff'), {user: true});
}
function stageHandoff() {
  previewBlank();
  S.beat = 'handoff'; S.folderOnDesk = true; S.env = {A: 'sealed', B: 'sealed', C: 'sealed'};
  previewFinish('desk');
  const HF = COPY.handoff || {}, HL = HF.lines || [];
  const line = HL[4] ? HL[4][0] : '';
  const face = A[HF.portrait] || '';
  scene(`<div class="talk">${face ? `<img src="${face}" alt="">` : ''}<div class="bub"><div class="who">${esc(HF.speaker || '')}${HF.role ? ' \u00b7 ' + esc(HF.role) : ''}</div><div class="t">${esc(line)}</div><div class="ctl"><button class="btn" id="hn" type="button">${esc(HF.next || 'Next \u25b8')}</button><button class="skip" id="hs" type="button" style="color:#7A7268">${esc(HF.skip || 'Skip')}</button><small>5 / ${HL.length}</small></div></div></div>`, true);
  const go = () => previewGoto(idIndex('folder'), {user: true});
  $('#hn').onclick = go; $('#hs').onclick = go;
}
function stageClosed() {
  jump('build');
  previewFinish('desk');
}
function stageReview() {
  jump('build');
  previewFinish('desk');
  openFolder('folder');
}
function stageFolder() {
  jump('build');
  previewFinish('desk');
  const ids = reviewOf('folder').ids.slice(0, 5);
  for (const id of ids) pull(id, IT[id] && IT[id].dest === 'board' ? 'board' : 'desk');
  if (ids.includes('briefing')) S.viewed.briefing = 1;
  render();
}
function stageEnvA() {
  jump('envA');
  previewFinish('board');
}
function stageRealize() {
  jump('realize');
  previewFinish('board');
  showAha();
}
function stageEnvB() {
  jump('realize');
  S.env.B = 'ready';
  previewFinish('board');
  const recap = COPY.accuseRecap || '';
  scene(`<div class="dcard"><div class="kick">Realization</div><div class="big" style="font-size:44px">\u2605</div><p class="recap">${esc(recap)}</p><button class="btn gold" id="dc" type="button">Back to the desk \u2192</button></div>`);
  $('#dc').onclick = () => { unscene(); setView('desk'); };
}
function stageWrong() {
  // the real path: fill the wrong report and send it, so the preview shows
  // exactly what a player would see
  jump('accuse');
  previewFinish('desk');
  openReport();
  const fill = $('#dw'); if (fill) fill.click();
  const send = $('#send'); if (send) send.click();
}
function stageRight() {
  jump('accuse');
  previewFinish('desk');
  openReport();
  const fill = $('#dr'); if (fill) fill.click();
  const send = $('#send'); if (send) send.click();
}
function stageEnvC() {
  jump('file');
  previewFinish('desk');
  scene(`<div class="kick">${esc(ENVC.kicker || '')}</div><p class="lead">${esc(REVEAL.closingTitle || '')}</p><div class="wrap"><div class="paper"><div class="mast">${esc(ENVC.mast || '')}</div><h3>${esc(ENVC.headline || '')}</h3><p>${esc(ENVC.body || '')}</p></div><div class="paper note">${ENVC.note || ''}</div></div><div class="row" style="margin-top:24px"><button class="btn gold" id="nm" type="button">File the case away \u2192</button></div>`);
  $('#nm').onclick = () => previewGoto(idIndex('file'), {user: true});
}
function stageFile() {
  jump('file');
  S.packed = true;
  S.board = {};
  S.strings = [];
  previewFinish('desk');
  const dr = $('#drawer'); dr.hidden = false; dr.classList.add('up');
}
function stageFiled() {
  jump('file');
  S.packed = true;
  S.stamped = true;
  S.board = {};
  S.strings = [];
  previewFinish('desk');
  rankCard();
  const bk = $('#bk'); if (bk) bk.onclick = () => { unscene(); };
  const again = $('#again'); if (again) again.onclick = () => previewGoto(idIndex('intro'), {user: true});
}
const STAGES = [
  {id: 'intro', label: 'Intro', title: '', apply: stageIntro},
  {id: 'cold', label: 'Cold open', title: '', apply: stageCold},
  {id: 'desk', label: 'Desk pick', title: '', apply: stageDesk},
  {id: 'how', label: 'How it works', title: '', apply: stageHow},
  {id: 'handoff', label: 'Handoff', title: '', apply: stageHandoff},
  {id: 'closed', label: 'Closed file', title: '', apply: stageClosed},
  {id: 'review', label: 'Review order', title: '', apply: stageReview},
  {id: 'folder', label: 'Case folder', title: '', apply: stageFolder},
  {id: 'envA', label: 'Envelope A', title: '', apply: stageEnvA},
  {id: 'realize', label: 'Realization', title: '', apply: stageRealize},
  {id: 'envB', label: 'Envelope B', title: '', apply: stageEnvB},
  {id: 'wrong', label: 'Wrong report', title: '', apply: stageWrong},
  {id: 'right', label: 'Right report', title: '', apply: stageRight},
  {id: 'envC', label: 'Envelope C', title: '', apply: stageEnvC},
  {id: 'file', label: 'File away', title: '', apply: stageFile},
  {id: 'filed', label: 'Filed', title: '', apply: stageFiled}];
function idIndex(id) { const i = STAGES.findIndex(s => s.id === id); return i < 0 ? 0 : i; }
function pvFrac(i) { return STAGES.length <= 1 ? 0 : i / (STAGES.length - 1); }
function pvLeftCSS(i) { return `calc(52px + (100% - 104px) * ${pvFrac(i)})`; }
function previewPaint() {
  const n = STAGES.length, i = previewIndex, s = STAGES[i];
  $$('#pvticks .pv-tick').forEach(el => { const k = +el.dataset.i; el.classList.toggle('done', k < i); el.classList.toggle('cur', k === i); });
  const head = $('#pvhead'), done = $('#pvdone');
  if (head) head.style.left = pvLeftCSS(i);
  if (done) done.style.width = `calc((100% - 104px) * ${pvFrac(i)})`;
  const now = $('#pvnow'); if (now) now.innerHTML = `${esc(s.label)}<small>${i + 1} of ${n}</small>`;
  const play = $('#pvplay');
  if (play) { play.textContent = previewPlaying ? 'Pause' : 'Play'; play.classList.toggle('on', previewPlaying); play.setAttribute('aria-pressed', previewPlaying ? 'true' : 'false'); play.setAttribute('aria-label', previewPlaying ? 'Pause preview' : 'Play preview'); }
  const prev = $('#pvprev'), next = $('#pvnext');
  if (prev) prev.disabled = i <= 0;
  if (next) next.disabled = i >= n - 1;
  const scrub = $('#pvscrub');
  if (scrub) { scrub.setAttribute('aria-valuenow', String(i)); scrub.setAttribute('aria-valuemax', String(n - 1)); scrub.setAttribute('aria-valuetext', s.label); }
  document.body.dataset.previewStage = s.id;
  const bar = $('#pv'); if (bar) bar.classList.toggle('playing', previewPlaying);
  if (!previewDragging) {
    const tick = $(`#pvticks .pv-tick[data-i="${i}"]`), sc = $('#pvscrub');
    if (tick && sc) { const sr = sc.getBoundingClientRect(), tr = tick.getBoundingClientRect();
      if (tr.left < sr.left + 4) sc.scrollLeft -= sr.left - tr.left + 12;
      else if (tr.right > sr.right - 4) sc.scrollLeft += tr.right - sr.right + 12; }
  }
}
function previewPause() {
  previewPlaying = false; clearTimeout(previewTimer); previewTimer = null;
  if (PREVIEW && previewReady) previewPaint();
}
function previewArm() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    if (!previewPlaying) return;
    if (previewIndex >= STAGES.length - 1) { previewPause(); return; }
    previewGoto(previewIndex + 1);
    previewArm();
  }, PREVIEW_DWELL);
}
function previewToggle() {
  if (previewPlaying) { previewPause(); return; }
  if (previewIndex >= STAGES.length - 1) previewGoto(0);
  previewPlaying = true; previewPaint(); previewArm();
}
function previewStop() {
  const rewind = previewPlaying || previewIndex !== 0;
  previewPause();
  if (rewind) previewGoto(0);
}
function previewGoto(i, opt) {
  opt = opt || {};
  if (opt.user) previewPause();
  i = Math.max(0, Math.min(STAGES.length - 1, i | 0));
  previewIndex = i; previewDragging = !!opt.drag;
  previewApplying = true;
  try { STAGES[i].apply(); }
  finally { previewApplying = false; previewIndex = i; previewDragging = false; previewPaint(); }
}
function indexFromClientX(clientX) {
  const inner = $('#pvinner'); if (!inner) return 0;
  const r = inner.getBoundingClientRect(), inset = 52, span = Math.max(1, r.width - inset * 2);
  const t = Math.max(0, Math.min(1, (clientX - r.left - inset) / span));
  return Math.round(t * (STAGES.length - 1));
}
function previewNoteJump(b) {
  // a stage seeding itself through jump() must not move the scrubber or pause it
  if (!PREVIEW || !previewReady || previewApplying) return;
  previewPause();
  const map = {intro: 'intro', handoff: 'handoff', build: 'folder', envA: 'envA', realize: 'realize', accuse: 'envB', file: 'file'};
  const i = STAGES.findIndex(s => s.id === map[b]);
  if (i >= 0) { previewIndex = i; previewPaint(); }
}
function initPreview() {
  const bar = $('#pv'); if (!bar) return;
  bar.hidden = false;
  document.body.classList.add('pv-on');   // lifts the version chip clear of the scrubber
  const hint = $('#dz .small');
  if (hint) hint.textContent = 'Preview mode does not read or write your saved game. Scrub the bar along the bottom. Reload without ?preview=1 and a real playthrough resumes as usual.';
  const inner = $('#pvinner'); if (inner) inner.style.setProperty('--slots', String(STAGES.length - 1));
  const ticks = $('#pvticks');
  if (ticks) ticks.innerHTML = STAGES.map((s, i) => `<button type="button" class="pv-tick" data-i="${i}" style="left:${pvLeftCSS(i)}" title="${esc((PACK.previewTitles || {})[s.id] || s.title || '')}"><i></i><span>${esc(s.label)}</span></button>`).join('');
  const scrub = $('#pvscrub');
  if (scrub) {
    scrub.addEventListener('pointerdown', e => {
      pvPointer = true;
      try { scrub.setPointerCapture(e.pointerId); } catch (err) {}
      const tick = e.target.closest && e.target.closest('.pv-tick');
      previewGoto(tick ? +tick.dataset.i : indexFromClientX(e.clientX), {user: true, drag: true});
    });
    scrub.addEventListener('pointermove', e => {
      if (!pvPointer) return;
      const i = indexFromClientX(e.clientX);
      if (i !== previewIndex) previewGoto(i, {user: true, drag: true});
    });
    const end = () => { pvPointer = false; };
    scrub.addEventListener('pointerup', end); scrub.addEventListener('pointercancel', end);
    scrub.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); previewGoto(previewIndex + 1, {user: true}); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); previewGoto(previewIndex - 1, {user: true}); }
      else if (e.key === 'Home') { e.preventDefault(); previewGoto(0, {user: true}); }
      else if (e.key === 'End') { e.preventDefault(); previewGoto(STAGES.length - 1, {user: true}); }
    });
  }
  $('#pvprev').onclick = () => previewGoto(previewIndex - 1, {user: true});
  $('#pvnext').onclick = () => previewGoto(previewIndex + 1, {user: true});
  $('#pvplay').onclick = () => previewToggle();
  $('#pvstop').onclick = () => previewStop();
  document.addEventListener('keydown', e => {
    if (!PREVIEW || !previewReady) return;
    if (e.target && e.target.closest && e.target.closest('#pv')) return;
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'ArrowRight') { e.preventDefault(); previewGoto(previewIndex + 1, {user: true}); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); previewGoto(previewIndex - 1, {user: true}); }
    else if (e.key === ' ' && (e.target === document.body || e.target.id === 'pvscrub')) { e.preventDefault(); previewToggle(); }
  });
  previewReady = true;
  const hashStage = {intro: 'intro', cold: 'cold', desk: 'desk', how: 'how', handoff: 'handoff', closed: 'closed', review: 'review', build: 'folder', folder: 'folder', envA: 'envA', realize: 'realize', accuse: 'envB', envB: 'envB', wrong: 'wrong', right: 'right', envC: 'envC', file: 'file', filed: 'filed'};
  const mapped = hashStage[location.hash.slice(1)];
  previewGoto(mapped ? idIndex(mapped) : 0);
}
window.__jp = {jump, S: () => S, openFolder, openPlayer, openEnv, openObj, openReport, aha, pinTap, fileStep, setAmb, setView, deskClick, save, loadSave, clearSave, amb, clockAmb, AU: () => AU, preview: () => PREVIEW, previewGoto: (i) => previewGoto(typeof i === 'number' ? i : idIndex(i), {user: true}), previewPlay: () => { if (!previewPlaying) previewToggle(); }, previewPause: () => previewPause(), previewStop: () => previewStop(), previewState: () => ({index: previewIndex, id: STAGES[previewIndex] && STAGES[previewIndex].id, playing: previewPlaying, n: STAGES.length})};
// ---------------- resume ----------------
function resume(o) { S = o; prevSet = new Set(deskSet()); setView(S.view === 'board' ? 'board' : 'desk'); render();
  if (S.beat === 'handoff') return handoff();
  toast('🗂 Welcome back, Detective. Your desk is just how you left it.', 3600); ortiz('welcome'); }
// real clock: refresh the desk ambience when the tab comes back or the hour bucket changes
let lastAmb = clockAmb();
document.addEventListener('visibilitychange', () => { if (document.hidden) { save(); hush(); previewPause(); } else { lastAmb = clockAmb(); render(); } });
window.addEventListener('pagehide', save);
setInterval(() => { const a = clockAmb(); if (a !== lastAmb) { lastAmb = a; if (!AMB_PREVIEW) render(); } else if (!document.hidden) renderSide(); }, 60000);
// boot: ?preview=1 is the developer scrubber and does not resume jp-save-v2.
// Otherwise a #beat hash jumps (prototype), else resume a save, else start fresh.
render();
if (PREVIEW) initPreview();
else { const h = location.hash.slice(1), saved = loadSave(); if (h && BEATS.some(x => x[0] === h)) jump(h); else if (saved) resume(saved); else intro(); }
