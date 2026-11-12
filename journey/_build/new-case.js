#!/usr/bin/env node
'use strict';
/**
 * _build/new-case.js — scaffold a new case.
 *
 *   node _build/new-case.js <case-id> [--title "Case title"]
 *   node _build/new-case.js the-lighthouse --title "The Lighthouse Keeper"
 *
 * Writes cases/<case-id>/case.js: a complete, valid pack wired to the shared
 * placeholders. It loads at once (?case=<id>) and passes the validator, so you
 * start from something that runs instead of from a blank page.
 *
 * Next: node _build/validate.js <case-id>   then open ?case=<case-id>
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith('--'));
const titleFlag = args.indexOf('--title');
const title = titleFlag >= 0 ? args[titleFlag + 1] : null;

if (!id || !/^[a-z0-9][a-z0-9-]*$/.test(id)) {
  console.error('usage: node _build/new-case.js <case-id> [--title "Case title"]');
  console.error('  case-id must be lowercase letters, digits, and hyphens');
  process.exit(2);
}

const dir = path.join(ROOT, 'cases', id);
if (fs.existsSync(dir)) {
  console.error(`cases/${id} already exists — pick another id`);
  process.exit(2);
}

const headline = (title || 'Untitled Case').replace(/"/g, '\\"');
const number = args.indexOf('--number') >= 0 ? args[args.indexOf('--number') + 1] : '00-0000';

const source = `/* cases/${id}/case.js — scaffolded by _build/new-case.js
 *
 * Replace every TODO. Paths are relative to journey/ (the page), not to this file.
 *
 * What the ENGINE still owns for every case, and this file cannot change yet:
 *   - the intro, handoff, how-it-works, reveal, soft-fail and rank-card prose
 *   - the envelope tearing copy and the report's demo buttons
 * Those live in app/player.js. Extracting them into the pack is the next refactor;
 * until then a new case reuses Clara's framing sentences in those moments.
 */
window.CASE_PACK = (function () {
'use strict';

const CASE = {
  title: '${headline}',
  kick: 'Case files · Case ${number}',
  lead: 'TODO one sentence: what the player is looking into and why it matters.',
  cover: 'assets/covers/_placeholder.jpg'
};

const BEATS = [['intro', 'Intro'], ['handoff', 'Case handoff'], ['build', 'Case folder'],
               ['envA', 'Envelope A'], ['realize', 'Realization'], ['accuse', 'Accuse'], ['file', 'File away']];

// One row per thing that can come out of a folder or an envelope.
// dest: desk | board | both. source is set by SRC below.
const IT = {
  briefing: {n: 'Case briefing (start here)', th: '_doc', face: 'p_detective', dest: 'desk', spr: 'briefing'},
  witness:  {n: 'Photo: TODO witness', th: 'p_witness', dest: 'board'},
  note:     {n: 'Index card: TODO lead', th: '_card', dest: 'board', read: ['TODO line one', 'TODO line two']},
  tape:     {n: 'Tape: TODO first interview', th: 'p_witness', face: 'p_witness', dest: 'desk', spr: 'device', rec: 'witness'},
  second:   {n: 'Photo: TODO second lead', th: 'p_second', dest: 'both'}
};

const SRC = {
  folder: ['briefing', 'witness', 'tape', 'note'],
  envA: ['second'],
  envB: []
};

// The suggested order. A nudge, not a lock. Same ids as SRC, grouped the way a
// detective would hand them over.
const REVIEW = {
  folder: [
    {g: '1 · Read this first', ids: ['briefing']},
    {g: '2 · Interviews', ids: ['tape']},
    {g: '3 · Photos and papers', ids: ['witness', 'note']}],
  envA: [{g: '1 · What was inside', ids: ['second']}]
};

const FACE = {witness: 'p_witness'};
const CARDS = {note: ['TODO CARD HEADING', 'TODO what the index card says.']};

// board layout: [center x, top y, width, label, optional label class]
const BP = {
  witness: [420, 120, 160, 'TODO witness'],
  note: [760, 300, 180, 'TODO lead'],
  second: [940, 120, 150, 'TODO second lead']
};

const SUS = [['witness', 'TODO witness'], ['second', 'TODO second lead']];

const REPORT = [
  {k: 'who', l: 'Who is responsible?', o: SUS, a: 'second', push: 'TODO Ortiz pushback for this question.'},
  {k: 'why', l: 'Why did they do it?', o: [['money', 'Money'], ['anger', 'Anger'], ['fear', 'Fear']], a: 'money', push: 'TODO Ortiz pushback.'}
];

const RECS = [['witness', 'tape']];
const PROOF_OK = ['note', 'second'];

const SOL = [
  ['TODO: what actually happened, in one step.', 'note'],
  ['TODO: how the player proves it.', 'second']
];

const OBJ1 = {q: 'TODO the first question the player has to answer?', o: ['TODO option A', 'TODO option B', 'TODO option C'], a: 1};

const AU = {};
const TR = {witness: [{sp: 'WITNESS', x: 'TODO first line of the interview.'}]};

const ART = {
  _doc: 'assets/evidence/_placeholder.jpg',
  _card: 'assets/evidence/_placeholder.jpg',
  p_witness: 'assets/portraits/_placeholder.jpg',
  p_second: 'assets/portraits/_placeholder.jpg',
  p_detective: 'assets/portraits/_placeholder.jpg'
};

const PV_NOTES = [];
const MID = {viewed: {}, played: {}, strings: []};

// Desk documents: what opens when the player taps briefing / news / bag.
const DOCS = {
  briefing: {img: '_doc', title: 'Case briefing', face: 'p_detective',
             html: 'TODO the briefing text. This is the first thing the player reads.',
             note: 'Objective 1: TODO the question'}
};

// Folder headings and the one-line nudge above each review order.
const FOLDERS = {
  folder: {title: 'Case folder · TODO NAME', blurb: 'TODO the suggested order, in one line.'},
  envA: {title: 'Inside Envelope A', blurb: 'TODO what to open first.'},
  envB: {title: 'Inside Envelope B', blurb: ''}
};

// Notes the player earns: by evidence id when it is taken out, by recording id
// when a tape finishes.
const NOTES = {pulled: {}, played: {}};

// What happens when a specific piece of evidence comes out of a folder.
const ONPULL = {};

// The two things whose connection is the breakthrough, and the pairs that are
// close but not it. requiresSaved names a transcript line that must be saved first.
const BREAKTHROUGH = {pair: ['second', 'note'], requiresSaved: '', locked: '', near: []};

// Short tags printed on a pin, e.g. a height once the player knows it.
const PIN_TAGS = {};

// The report's demo buttons. right must satisfy every question and pick 3 proof.
const REPORT_DEMOS = {
  wrong: {who: 'witness', why: 'anger', proof: ['witness', 'note', 'second']},
  right: {who: 'second', why: 'money', proof: ['note', 'second', 'witness']}
};

// Tape list titles: recording id -> [name, subtitle].
const TITLES = {witness: ['TODO witness', 'Interview · TODO where it came from']};

// The opening act: cold open narration, the how-it-works card, and the handoff
// conversation. The handoff lines carry an optional hook: 'folder' drops the
// folder on the desk, 'env' seals the envelopes, 'obj' posts the objective.
const OPENING = {
  cold: {kicker: 'Cold open', cta: 'Continue', skip: 'Skip intro',
         lines: ['TODO where and when this is.', 'TODO what happened.']},
  howTo: {kicker: 'How it works', title: 'TODO the one-line pitch',
          steps: [['🎧', 'Listen', 'TODO'], ['🔍', 'Look', 'TODO'], ['📌', 'Pin & connect', 'TODO']],
          note: 'TODO the quiet hint about the side column.', cta: 'Meet the detective →'},
  handoff: {speaker: 'TODO Detective', role: 'TODO department', portrait: 'p_detective',
            voiceNote: '', next: 'Next ▸', skip: 'Skip', start: 'Start investigating →',
            objective: 'Objective 1 of 3 · TODO the question',
            objectiveNote: 'Objective 1: TODO the question',
            toast: 'The folder is closed on your desk. Open it. Briefing first.',
            lines: [['TODO the detective introduces the case.', 'folder']]}
};

// The engine reads these for the closing scenes, so a new case never inherits
// another case's ending.
const COPY = {
  ...OPENING,
  reveal: {
    kicker: 'Case solved', who: 'TODO who.', lead: 'TODO the closing beat.',
    closingTitle: 'TODO what happened to close it.', closingCharge: 'TODO who was charged.',
    envC: {kicker: 'The wrap-up', mast: 'TODO paper', headline: 'TODO headline',
           body: 'TODO the article.', note: 'TODO the note left on your desk.'}
  },
  objective1: {
    kicker: 'Objective 1 of 3', sub: 'Pick one. A wrong answer does not end anything.',
    demoWrong: 'Demo: answer wrong', demoRight: 'Demo: answer right',
    wrong: 'TODO what the detective says when the player is wrong.',
    hints: ['TODO hint one.', 'TODO hint two.', 'TODO hint three.'],
    solvedTitle: '✓ Objective 1 solved.', solvedLine: 'TODO what the detective confirms.',
    solvedNote: 'TODO what just unlocked.', solvedCta: '✉️ Open Envelope A →',
    note: 'TODO the note that goes into the notes in ink.'
  },
  aha: {
    kicker: '★ BREAKTHROUGH · 1 OF 1', title: 'TODO the breakthrough',
    body: 'TODO why the two things you connected prove it.',
    line: 'TODO what the detective says out loud.',
    footer: 'TODO the reward line.', tag: 'TODO the short pin tag',
    note: 'TODO the note that goes into the notes in ink.', cta: 'Continue →'
  },
  softFail: {
    kicker: 'Case closed', who: 'TODO who.', lead: 'TODO line.', title: 'What you missed',
    bullets: ['TODO what the player missed.', 'TODO the second tell.']
  },
  rank: {
    kicker: 'Case record · filed', solved: 'Solved. The folder is stamped and filed.',
    assisted: 'Closed with help.', shelf: [['📁 Case 1', 'TODO ✓'], ['Case 2', 'coming soon']]
  }
};

// Hints: the side card, the desk whisper, and the Hint button all read this.
// G gives you the live state and the moves the player can make.
function steps(G) {
  const b = G.S.beat;
  const tip = (t, p, w, extra) => Object.assign({t, p, w: w || p, btn: (extra && extra.btn) || 'Go'}, extra || {});
  if (b === 'intro') return tip('Start the case', 'Intro, then the handoff.', 'Begin when you are ready.', {k: 'Welcome', go: () => G.intro()});
  if (b === 'handoff') return tip('Meet the detective', 'The folder is about to land on your desk.', 'Listen to the handoff.', {go: () => G.handoff()});
  if (b === 'build') {
    if (!G.S.pulled.briefing) return tip('Open the case folder', 'Start with the briefing.', 'Open the folder and read the briefing.', {btn: 'Open the folder', pulse: 'folder', go: () => G.openFolder('folder')});
    if (!G.S.viewed.briefing) return tip('Read the briefing', 'That page is the job.', 'Read the briefing.', {btn: 'Pick it up', pulse: 'briefing', go: () => G.deskClick('briefing')});
    if (!G.S.pulled.tape) return tip('Take out the interview', 'Interviews before photos.', 'Take out the tape.', {btn: 'Open the folder', pulse: 'folder', go: () => G.openFolder('folder')});
    if (!G.S.played.witness) return tip('Play the interview', 'Listen for the first lead.', 'Play the tape.', {btn: 'Play it', pulse: 'device', go: () => G.deskClick('device')});
    return tip('Answer Objective 1', G.OBJ1.q, 'You can answer now.', {btn: 'Answer it', go: G.openObj});
  }
  if (b === 'envA') {
    if (G.S.env.A === 'ready') return tip('Open Envelope A', 'Tear it open.', 'Envelope A is ready.', {btn: 'Tear it open', pulse: 'env', go: () => G.openEnv('A')});
    return tip('See what was inside', 'One more piece.', 'Empty the envelope.', {btn: 'See inside', go: () => G.openFolder('envA')});
  }
  if (b === 'realize') return tip('Connect the proof', 'Put what you know on the board.', 'String the evidence together.', {btn: 'Go to the board', go: () => G.setView('board')});
  if (b === 'accuse') return tip('Write the report', 'Who, why, and the proof.', 'Write it up.', {btn: 'Write the report', go: G.openReport});
  if (b === 'file') {
    if (!G.S.packed) return tip('Pack up the case', 'Everything goes back in the folder.', 'Pack it up.', {btn: 'Pack it up', pulse: 'folder', go: G.fileStep});
    if (!G.S.stamped) return tip('Stamp it', 'Tap the folder.', 'Stamp it closed.', {btn: 'Stamp it', pulse: 'folder', go: G.fileStep});
    if (!G.S.filed) return tip('File it away', 'Into the drawer.', 'File it.', {btn: 'File it', pulse: 'folder', go: G.fileStep});
    return tip('Case filed', 'See the record.', 'Filed.', {btn: 'Case record', go: G.rankCard});
  }
  return {t: '', p: '', w: ''};
}

// Fill in state as if the player had reached this beat. ?preview=1 and the
// Dev mode's jump buttons call this.
function seed(b, G) {
  const pullAll = src => G.SRC[src].forEach(i => {
    G.S.pulled[i] = 1;
    if (G.IT[i].dest !== 'desk') G.S.board[i] = {x: G.BP[i][0], y: G.BP[i][1]};
  });
  if (b === 'intro') { G.setView('desk'); G.intro(); G.previewNoteJump(b); return; }
  if (b === 'handoff') { G.handoff(); G.previewNoteJump(b); return; }
  G.S.folderOnDesk = true;
  G.S.env = {A: 'sealed', B: 'sealed', C: 'sealed'};
  G.S.beat = 'build';
  if (b !== 'build') { pullAll('folder'); G.S.viewed.briefing = 1; G.S.played.witness = 1; G.S.obj1 = 1; G.S.env.A = 'ready'; G.S.beat = 'envA'; }
  if (b === 'realize' || b === 'accuse' || b === 'file') { G.S.env.A = 'open'; pullAll('envA'); G.S.beat = 'realize'; }
  if (b === 'accuse' || b === 'file') { G.S.env.B = 'open'; G.S.beat = 'accuse'; }
  if (b === 'file') { G.S.solved = true; G.S.env.C = 'open'; G.S.beat = 'file'; }
  G.reseed();
  G.setView(b === 'realize' ? 'board' : 'desk');
  G.render();
  G.previewNoteJump(b);
}

return {
  id: '${id}',
  number: '${number}',
  case: CASE, beats: BEATS, evidence: IT, sources: SRC, review: REVIEW, faces: FACE,
  cards: CARDS, board: BP, suspects: SUS, report: REPORT, recordings: RECS,
  difficulty: {preset: 'standard', overrides: {}},
  proof: PROOF_OK, solution: SOL, objective1: OBJ1, transcripts: TR, audio: AU,
  art: ART, previewNotes: PV_NOTES, previewMid: MID, titles: TITLES, copy: COPY,
  docs: DOCS, folders: FOLDERS, notes: NOTES, onPull: ONPULL,
  breakthrough: BREAKTHROUGH, pinTags: PIN_TAGS, reportDemos: REPORT_DEMOS,
  steps: steps, seed: seed
};
})();
`;

fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'case.js'), source);
fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });
fs.writeFileSync(path.join(dir, 'assets', 'README.md'),
  `# ${id} assets\n\nDrop this case's photographs here, then point cases/${id}/case.js at them\nrelative to journey/, for example \`cases/${id}/assets/portrait-wren.jpg\`.\n\nEvery portrait needs a provenance: who gave it to the detective, and how.\nSee DESIGN_SYSTEM.md, "Image treatment".\n`);

console.log(`created cases/${id}/case.js`);
console.log(`\nnext:`);
console.log(`  node _build/validate.js ${id}`);
console.log(`  open  http://127.0.0.1:8137/journey/index.html?case=${id}`);
console.log(`\nReplace every TODO, then swap the _placeholder art.`);
console.log(`Still engine-owned (not in this file yet): intro, handoff, reveal,`);
console.log(`soft-fail and rank-card prose, envelope copy, and the report demos.`);
