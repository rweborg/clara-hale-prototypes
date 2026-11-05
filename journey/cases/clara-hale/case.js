/* The Vanishing of Clara Hale — case content.
 *
 * Loaded by index.html before app/player.js. Everything specific to this case
 * lives here: the cast, the evidence, the board layout, the report, the
 * transcripts, and the audio. The engine (app/player.js) only reads CASE_PACK.
 *
 * Paths are relative to journey/ (the page), not to this file.
 */
window.CASE_PACK = (function () {
'use strict';

// ---------------- data ----------------
// Progression is the case itself (envelopes -> items -> realizations -> accusation -> file away). There are no in-game days.
// Future cases supply their own cover path on CASE.cover (a path or URL, e.g. assets/covers/their-case.jpg).
const CASE = {
  title: 'The Vanishing of\nClara Hale',
  kick: 'Pine Hollow Case Files · Case 1',
  lead: 'A woman is missing from a small Montana town. Listen to the interviews, look at the evidence, and work out what happened to Clara.',
  cover: 'assets/covers/clara-hale.jpg'};

const BEATS = [['intro', 'Intro'], ['handoff', 'Case handoff'], ['build', 'Case folder'], ['envA', 'Envelope A'], ['realize', 'Realization'], ['accuse', 'Accuse'], ['file', 'File away']];

const IT = {
  briefing: {n: 'Case briefing (start here)', th: 'instructions', face: 'p_ortiz', dest: 'desk', spr: 'briefing'},
  voicemail: {n: "Recording: Clara's voicemail, 9:12 PM", th: 'p_clara', face: 'p_clara', dest: 'desk', spr: 'device', rec: 'voicemail'},
  clara: {n: 'Photo: Clara Hale', th: 'p_clara', face: 'p_clara', dest: 'board'},
  news: {n: 'Newspaper: Pine Hollow Courier', th: 'newspaper', face: 'p_clara', dest: 'both', spr: 'news'},
  daniel: {n: 'Photo: Daniel Hale (husband)', th: 'p_daniel', face: 'p_daniel', dest: 'board'},
  dtape: {n: 'Tape: Daniel Hale interview', th: 'p_daniel', face: 'p_daniel', dest: 'desk', spr: 'device', rec: 'daniel'},
  rtape: {n: 'Tape: Pastor Reed interview', th: 'p_reed', face: 'p_reed', dest: 'desk', spr: 'device', rec: 'reed'},
  utape: {n: 'Tape: Deputy Dunn interview', th: 'p_dunn', face: 'p_dunn', dest: 'desk', spr: 'device', rec: 'dunn'},
  jtape: {n: 'Tape: Jesse Cole interview', th: 'p_jesse', face: 'p_jesse', dest: 'desk', spr: 'device', rec: 'jesse'},
  dock: {n: "Photo: Daniel at the dock, 3:52 PM", th: 'dock_daniel', face: 'p_daniel', dest: 'board'},
  trailhead: {n: 'Index card: Copper Lake trailhead', th: 'card-trailhead', dest: 'board', read: ['Subaru found Sun. 7:00 AM', 'keys inside, phone gone']},
  festival: {n: 'Index card: Harvest Festival', th: 'card-festival', dest: 'board', read: ['Clara seen ~9:00 PM', 'lantern from booth 14']},
  report: {n: 'Police report: the car', th: 'form-report', dest: 'board'},
  bag: {n: 'Evidence bag: bakery ledger', th: 'ledger', dest: 'desk', spr: 'bag'},
  map: {n: 'Map of Pine Hollow', th: 'map', dest: 'board'},
  marcytape: {n: 'Tape: Marcy Tolliver interview', th: 'p_marcy', face: 'p_marcy', dest: 'desk', spr: 'device', rec: 'marcy'},
  marcy: {n: 'Photo: Marcy Tolliver (partner)', th: 'p_marcy', face: 'p_marcy', dest: 'board'},
  seat: {n: 'Sticky: driver seat pulled forward', th: 'sticky-seat', dest: 'board'},
  camera: {n: 'Gas-N-Go camera still, 10:40 PM', th: 'camera_still', face: 'p_marcy', dest: 'board'},
  lantern: {n: 'Smashed lantern, booth 14', th: 'lantern', dest: 'board'},
  ping: {n: "Phone ping record: Clara's phone", th: '📡', dest: 'board'}};

const SRC = {folder: ['briefing', 'voicemail', 'clara', 'news', 'daniel', 'dtape', 'dock', 'trailhead', 'festival', 'rtape', 'report', 'utape', 'bag', 'map', 'jtape'], envA: ['marcytape', 'marcy', 'seat', 'camera', 'lantern'], envB: ['ping']};

// Suggested review order. A nudge, not a lock. Same items as SRC, grouped the way Ortiz would hand them over.
const REVIEW = {
  folder: [
    {g: '1 · Read this first', ids: ['briefing']},
    {g: '2 · Interviews', ids: ['voicemail', 'dtape', 'rtape', 'utape', 'jtape']},
    {g: '3 · Photos', ids: ['clara', 'daniel', 'news', 'dock']},
    {g: '4 · Places and papers', ids: ['festival', 'trailhead', 'report', 'map', 'bag']}],
  envA: [
    {g: '1 · Her interview', ids: ['marcytape']},
    {g: '2 · Photos, then the rest', ids: ['marcy', 'camera', 'seat', 'lantern']}],
  envB: [{g: '1 · The phone record', ids: ['ping']}]};

const FACE = {voicemail: 'p_clara', daniel: 'p_daniel', reed: 'p_reed', dunn: 'p_dunn', jesse: 'p_jesse', marcy: 'p_marcy'};

const CARDS = {camera: ['GAS-N-GO · CAMERA 2', 'Sat 10:40 PM, Route 9. A short figure walks into town alone, from the lake side.'],
  lantern: ['LANTERN · BOOTH 14', 'Smashed on the lake path by the old boathouse. "14" on the base.'],
  ping: ['PHONE PING', "Clara's phone came back on Monday evening for ~4 min. Within 2 blocks of Juniper Lane."]};

// board layout: [center x, top y, width, label, labelClass]
const BP = {clara: [640, 60, 120, 'Clara Hale · MISSING', 'x'], daniel: [385, 85, 95, 'Daniel Hale · husband'], marcy: [900, 85, 95, 'Marcy Tolliver · partner'],
  festival: [235, 330, 190, 'Harvest Festival'], trailhead: [1050, 330, 190, 'Copper Lake trailhead'], dock: [480, 340, 160, "Daniel at the dock, 3:52 PM"],
  report: [140, 520, 135, 'Police report: the car'], map: [640, 450, 280, 'Map of Pine Hollow'], seat: [810, 330, 110, 'Seat pulled forward'],
  camera: [1095, 575, 190, 'Gas-N-Go camera'], lantern: [365, 600, 175, 'Lantern from booth 14'], ping: [880, 615, 175, 'Phone ping'], news: [1170, 60, 120, 'Newspaper']};

const SUS = [['daniel', 'Daniel Hale'], ['jesse', 'Jesse Cole'], ['reed', 'Pastor Reed'], ['dunn', 'Deputy Dunn'], ['marcy', 'Marcy Tolliver']];

const REPORT = [
  {k: 'who', l: 'Who is responsible for what happened to Clara?', o: SUS, a: 'marcy', push: "Daniel's boot print is from four o'clock. He's six-three. Look at that seat again."},
  {k: 'why', l: 'Why?', o: [['divorce', 'Revenge over the divorce and the bakery'], ['embezzle', 'Clara found the skimming and was going to the sheriff Monday'], ['record', "To keep a sealed record buried"], ['romance', 'Jealousy over an old romance']], a: 'embezzle', push: 'Listen to what Clara told Ruth at 9:12. Money. Not the house.'},
  {k: 'how', l: 'What happened on the lake path?', o: [['ambush', 'A planned ambush, then the body was dumped in the lake'], ['shove', 'An argument, a shove, she hit her head on the rocks; hidden in the boathouse'], ['drive', 'She was driven out of town and left']], a: 'shove', push: 'Somebody mentioned the rocks by the boathouse before anyone told them. Who?'},
  {k: 'drove', l: "Who drove Clara's car to the trailhead?", o: SUS, a: 'marcy', push: 'Clara is five-ten. Whoever drove that car needed the seat all the way up.'}];

const RECS = [['voicemail', 'voicemail'], ['daniel', 'dtape'], ['reed', 'rtape'], ['dunn', 'utape'], ['jesse', 'jtape'], ['marcy', 'marcytape']];

const PROOF_OK = ['seat', 'lantern', 'camera', 'ping', 'voicemail'];

const SOL = [["Clara found out her partner had been skimming from the bakery. The September and October ledger pages were torn out.", 'ledger'],
  ['At the festival, Clara told Marcy she was going to the sheriff on Monday. "You\'ll ruin me." That is what the pastor heard.', 'voicemail'],
  ['Clara took a lantern from booth fourteen and walked up the lake path. Marcy followed her.', 'lantern 14'],
  ['They argued. Marcy shoved her. Clara hit her head on the rocks by the old boathouse. Marcy panicked, hid her, took the phone, and drove the Subaru to the trailhead with the seat jammed all the way forward.', 'seat'],
  ['Then she walked back into town along Route 9 at 10:40, right past a gas station camera. On Monday, Clara\'s phone came back on two blocks from Juniper Lane, where Marcy lives.', 'camera · ping']];

const OBJ1 = {q: 'Did Clara drive her own car to the Copper Lake trailhead that night?', o: ['Yes. She drove there, then walked to the lake.', 'No. She walked up the lake path from the festival; someone else drove her car there later.', 'The car was towed there the next morning.'], a: 1};

const AU = {"voicemail": "assets/audio/voicemail.mp3", "marcy": "assets/audio/marcy.mp3", "daniel": "assets/audio/daniel.mp3", "jesse": "assets/audio/jesse.mp3", "reed": "assets/audio/reed.mp3", "dunn": "assets/audio/dunn.mp3", "ortiz/aha": "assets/audio/ortiz/aha.mp3", "ortiz/cold": "assets/audio/ortiz/cold.mp3", "ortiz/found": "assets/audio/ortiz/found.mp3", "ortiz/h1": "assets/audio/ortiz/h1.mp3", "ortiz/h2": "assets/audio/ortiz/h2.mp3", "ortiz/h3": "assets/audio/ortiz/h3.mp3", "ortiz/h4": "assets/audio/ortiz/h4.mp3", "ortiz/h5": "assets/audio/ortiz/h5.mp3", "ortiz/h6": "assets/audio/ortiz/h6.mp3", "ortiz/h7": "assets/audio/ortiz/h7.mp3", "ortiz/obj1_right": "assets/audio/ortiz/obj1_right.mp3", "ortiz/obj1_wrong": "assets/audio/ortiz/obj1_wrong.mp3", "ortiz/push_drove": "assets/audio/ortiz/push_drove.mp3", "ortiz/push_how": "assets/audio/ortiz/push_how.mp3", "ortiz/push_proof": "assets/audio/ortiz/push_proof.mp3", "ortiz/push_who": "assets/audio/ortiz/push_who.mp3", "ortiz/push_why": "assets/audio/ortiz/push_why.mp3", "ortiz/softfail": "assets/audio/ortiz/softfail.mp3", "ortiz/sol1": "assets/audio/ortiz/sol1.mp3", "ortiz/sol2": "assets/audio/ortiz/sol2.mp3", "ortiz/sol3": "assets/audio/ortiz/sol3.mp3", "ortiz/sol4": "assets/audio/ortiz/sol4.mp3", "ortiz/sol5": "assets/audio/ortiz/sol5.mp3", "ortiz/welcome": "assets/audio/ortiz/welcome.mp3"};

const PV_NOTES = [
  ['Objective 1: where did Clara go? Did she drive?', ''],
  ['9:12 PM: Clara is ON FOOT on the lake path', ''],
  ['Clara walked. Someone else drove her car.', 'ink'],
  ['Envelope A: Marcy tape, lantern, seat, camera', ''],
  ["Seat forward + Marcy 5\u20322\u2033 \u2192 MARCY drove the car", 'aha ink'],
  ['Phone ping: Monday, 2 blocks from Juniper Lane', '']];

const MID = {viewed: {briefing: 1}, played: {voicemail: 1}, strings: [['clara', 'festival', false]]};

const TR = {"voicemail":[{"sp":"CLARA","t":0.0,"e":6.88,"tag":"breathless, walking, slightly shaky","x":"Ruth, it's Clara. Sorry, I know it's late, it's Saturday. I'm up on the lake path. I needed air."},{"sp":"CLARA","t":7.38,"e":20.5,"tag":"urgent, lowered","x":"Listen. Forget the house stuff for a second. This isn't about Daniel. The ledger pages are gone. September, October. Just torn out. And the deposits don't match the register tapes. Not by a little."},{"sp":"CLARA","t":21.0,"e":33.16,"tag":"upset, voice tight","x":"I told her tonight. I told her I'm going to the sheriff on Monday. She cried. She said she'd pay it back. Six years, Ruth. I'd have given her the money if she'd just asked."},{"sp":"CLARA","t":33.66,"e":42.14,"tag":"steadying, firm","x":"But I can't. I can't let her keep doing this. Call me back first thing. I need to know what this does to the partnership agreement before I"},{"sp":"CLARA","t":42.64,"e":44.88,"tag":"pause, turning, uneasy","x":"...Hello? Is someone there?"},{"sp":"CLARA","t":45.38,"e":49.78,"tag":"nervous half-laugh, relieved","x":"It's just a lantern. Okay. Call me back, Ruth."}],"marcy":[{"sp":"ORTIZ","t":0.0,"e":2.88,"tag":"steady","x":"Ms. Tolliver. Have a seat."},{"sp":"MARCY","t":3.38,"e":15.86,"tag":"nervous, bright, over-talking","x":"Oh, thank you, yes. Sorry, I'm a mess, I haven't slept. I brought scones, they're with the lady at the front desk. Lemon poppyseed. Clara's recipe, actually, it's it's her recipe. Sorry."},{"sp":"ORTIZ","t":16.36,"e":19.72,"tag":"even","x":"That's kind of you. You and Clara are partners."},{"sp":"MARCY","t":20.22,"e":34.54,"tag":"rapid","x":"Six years. Forty-sixty, her sixty. I do the front, the ordering, the register, the people stuff. Clara's the genius. Clara does the books. I don't even, I'm hopeless with numbers, ask anybody."},{"sp":"ORTIZ","t":35.04,"e":36.88,"tag":"neutral","x":"Tell me about Saturday."},{"sp":"MARCY","t":37.38,"e":57.38,"tag":"chattering","x":"Big day. Biggest day of the year for us. Booth fourteen. I sold out of cider donuts by seven, it was amazing, actually. Jesse was there until, oh, I sent him home early, he looked tired, poor kid. Clara came by around eight-thirty? She was fine. Totally fine. We talked about Christmas orders."},{"sp":"ORTIZ","t":57.88,"e":59.16,"tag":"dry","x":"Christmas orders."},{"sp":"MARCY","t":59.66,"e":64.86,"tag":"laughs nervously","x":"Yule logs. She wanted to do yule logs this year."}],"daniel":[{"sp":"ORTIZ","t":0.0,"e":2.32,"tag":"steady","x":"Daniel Hale. Thanks for coming in."},{"sp":"DANIEL","t":2.82,"e":7.14,"tag":"curt, defensive","x":"Did I have a choice? Your people were on my porch at seven in the morning."},{"sp":"ORTIZ","t":7.64,"e":14.84,"tag":"even","x":"You had a choice. You chose to come. I appreciate it. Your wife has been missing since Saturday night."},{"sp":"DANIEL","t":15.34,"e":20.06,"tag":"bitter","x":"Soon-to-be ex-wife. Go ahead and say it. Everybody else in this town does."},{"sp":"ORTIZ","t":20.56,"e":22.4,"tag":"neutral","x":"Tell me about the divorce."},{"sp":"DANIEL","t":22.9,"e":38.02,"tag":"sighs heavily","x":"It's a divorce. Two people who used to like each other, fighting over the one thing they built. The bakery. My name's on that sign, Detective. I put up half the down payment. I laid the brick around those ovens with my own hands."},{"sp":"ORTIZ","t":38.52,"e":40.44,"tag":"probing","x":"And Clara wanted to keep it."},{"sp":"DANIEL","t":40.94,"e":47.1,"tag":"sharp","x":"Clara wanted to keep everything. Her lawyer, Ruth Kessler, sends me letters with words in them I have to look up."}],"jesse":[{"sp":"ORTIZ","t":0.0,"e":2.64,"tag":"gentle but steady","x":"Jesse. You want some water?"},{"sp":"JESSE","t":3.14,"e":7.62,"tag":"nervous, mumbling","x":"No. I'm good. Am I under arrest?"},{"sp":"ORTIZ","t":8.12,"e":15.88,"tag":"even","x":"No. You're here because you work for Clara, and you left town the night she disappeared. Your cousin's place in Missoula. Two days."},{"sp":"JESSE","t":16.38,"e":18.7,"tag":"defensive, fast","x":"I came back. I came back on my own."},{"sp":"ORTIZ","t":19.2,"e":20.88,"tag":"calm","x":"You did. Why'd you leave?"},{"sp":"JESSE","t":21.38,"e":24.26,"tag":"long pause","x":"...You already know why."},{"sp":"ORTIZ","t":24.76,"e":26.28,"tag":"patient","x":"Tell me anyway."},{"sp":"JESSE","t":26.78,"e":48.62,"tag":"quietly","x":"I've got a record. Juvie. It's sealed, but it's Pine Hollow. Sealed means everybody knows and nobody says. I took a car when I was fifteen. A car. And then Clara's car shows up at the lake with the keys in it? Who do you think Deputy Dunn knocks on first?"}],"reed":[{"sp":"ORTIZ","t":0.0,"e":2.4,"tag":"steady","x":"Pastor Reed. Thank you for your time."},{"sp":"REED","t":2.9,"e":9.46,"tag":"warm, calm","x":"Of course, Detective. Whatever helps bring Clara home. The whole congregation is praying."},{"sp":"ORTIZ","t":9.96,"e":11.72,"tag":"neutral","x":"You were at the festival Saturday."},{"sp":"REED","t":12.22,"e":21.82,"tag":"pleasant","x":"The church runs the pie table every year. Booth two, by the entrance. I'm there from four until close. More or less."},{"sp":"ORTIZ","t":22.32,"e":23.84,"tag":"dry","x":"More or less."},{"sp":"REED","t":24.34,"e":31.22,"tag":"gentle laugh","x":"I wander. A pastor at a festival is half pie-seller, half confessor."},{"sp":"ORTIZ","t":31.72,"e":34.84,"tag":"probing","x":"You told the sheriff's office you saw Clara arguing that evening."},{"sp":"REED","t":35.34,"e":41.74,"tag":"measured","x":"I did. Around nine, near the bakery booth. Clara and Marcy Tolliver."}],"dunn":[{"sp":"ORTIZ","t":0.0,"e":1.36,"tag":"steady","x":"Deputy Dunn."},{"sp":"DUNN","t":1.86,"e":8.26,"tag":"bored, drawling","x":"Detective. Helena sent you all the way up here for a lady who probably drove off to clear her head."},{"sp":"ORTIZ","t":8.76,"e":11.8,"tag":"even","x":"Her car's at the trailhead. She didn't drive anywhere."},{"sp":"DUNN","t":12.3,"e":17.5,"tag":"shrugs","x":"So she walked. People walk. The lake loop's six miles."},{"sp":"ORTIZ","t":18.0,"e":20.08,"tag":"flat","x":"It's been three days."},{"sp":"DUNN","t":20.58,"e":21.46,"tag":"dismissive","x":"Yeah, yeah."},{"sp":"ORTIZ","t":21.96,"e":24.04,"tag":"neutral","x":"You were first on scene Sunday morning."},{"sp":"DUNN","t":24.54,"e":34.06,"tag":"reciting, bored","x":"Seven-ish. Jogger called it in. Keys in the ignition, doors unlocked, no phone. Ran the plate, it came back to Clara."}],"marcy_more":[{"sp":"ORTIZ","tag":"probing","x":"Pastor Reed heard you two arguing near nine. He heard you say, \"You'll ruin me.\""},{"sp":"MARCY","tag":"too quick","x":"Oh, that! No, that was about the yule logs. Clara wanted to order the good chocolate, the Belgian, and I said, \"Clara, you'll ruin me,\" like a joke, you know..."},{"sp":"ORTIZ","tag":"pause","x":"What time did you leave the festival?"},{"sp":"MARCY","tag":"confident","x":"Nine-thirty. I packed up and drove straight home. Watched a cooking show and fell asleep on the couch."},{"sp":"ORTIZ","tag":"calm","x":"Your Corolla was still in the festival lot at six Sunday morning. It's in the cleanup crew's photos."},{"sp":"MARCY","tag":"flustered","x":"Oh. Right, I... I'd had a cider. I didn't want to drive, so I walked. I walked home."},{"sp":"ORTIZ","tag":"","x":"…"},{"sp":"ORTIZ","tag":"casual","x":"How tall are you, Ms. Tolliver?","key":"height"},{"sp":"MARCY","tag":"thrown","x":"What? Five-two. Five-two and a half. Why does that...","key":"height","save":"Marcy is 5′2″"}]};

const ART = {
  "p_clara": "assets/plates/clara.jpg",
  "p_daniel": "assets/plates/daniel.jpg",
  "p_marcy": "assets/plates/marcy.jpg",
  "p_ortiz": "assets/plates/ortiz.jpg",
  "p_reed": "assets/plates/reed.jpg",
  "p_jesse": "assets/plates/jesse.jpg",
  "p_dunn": "assets/plates/dunn.jpg",
  "dock_daniel": "assets/evidence/dock-daniel.jpg",
  "camera_still": "assets/evidence/camera-marcy.jpg",
  "lantern": "assets/evidence/lantern.jpg",
  "sticky-seat": "assets/evidence/sticky-seat.jpg",
  "sticky-vm": "assets/evidence/sticky-vm.jpg",
  "sticky-photo": "assets/evidence/sticky-photo.jpg",
  "card-festival": "assets/evidence/card-festival.jpg",
  "card-trailhead": "assets/evidence/card-trailhead.jpg",
  "card-bakery": "assets/evidence/card-bakery.jpg",
  "map": "assets/evidence/map.jpg",
  "form-report": "assets/evidence/form-report.jpg",
  "newspaper": "assets/evidence/newspaper.jpg",
  "ledger": "assets/evidence/ledger.jpg",
  "instructions": "assets/evidence/instructions.jpg",
  "news_big": "assets/evidence/news-big.jpg",
  "ledger_big": "assets/evidence/ledger_big.jpg",
  "report_big": "assets/evidence/report_big.jpg",
  "bag": "assets/evidence/bag.webp"
};

function steps(G) { const b = G.S.beat;
  const tip = (t, p, w, extra) => Object.assign({t, p, w: w || p, btn: (extra && extra.btn) || 'Go'}, extra || {});
  if (b === 'intro') return tip('Start the game', 'Intro, pick a desk, then meet Det. Ortiz.', 'Begin when you are ready.', {k: 'Welcome', go: () => G.intro()});
  if (b === 'handoff') return tip('Meet Det. Ortiz', 'He is bringing you the case.', 'Listen. He will leave the folder closed.', {go: () => G.handoff()});
  if (b === 'build') {
    if (!G.S.pulled.briefing) return tip('Open the case folder', 'It is closed on the desk. Take the briefing out first.', 'The file is closed. Open it and start with the briefing.', {btn: 'Open the folder', pulse: 'folder', go: () => G.openFolder('folder')});
    if (!G.S.viewed.briefing) return tip('Read the briefing', 'It is on the desk. That page is the job.', 'Read the briefing. It says what to work out first.', {btn: 'Pick up the briefing', pulse: 'briefing', go: () => G.deskClick('briefing')});
    if (!G.S.pulled.voicemail) return tip("Take out Clara's voicemail", 'Interviews come before the photos.', 'Next is Clara\'s voicemail. Interviews, then photos.', {btn: 'Open the folder', pulse: 'folder', go: () => G.openFolder('folder')});
    if (!G.S.played.voicemail) return tip("Listen to Clara's voicemail", 'Saturday, 9:12 PM. Where is she?', 'Play the voicemail. Listen for where she is.', {btn: 'Play it', pulse: 'device', go: () => G.deskClick('device')});
    const photo = ['clara', 'daniel'].find(id => !G.S.pulled[id]);
    if (photo && G.pulledFrom('folder') < 5) return tip('Pin a photo to the board', G.IT[photo].n + '.', 'Pin ' + G.IT[photo].n.replace(/^Photo: /, '') + ' on the board.', {btn: 'Open the folder', pulse: 'folder', go: () => G.openFolder('folder')});
    const place = ['festival', 'trailhead', 'dock', 'news'].find(id => !G.S.pulled[id]);
    if (place && G.pulledFrom('folder') < 5) return tip('Take out one more piece', G.IT[place].n + '.', 'One more piece out of the folder, then you can answer.', {btn: 'Open the folder', pulse: 'folder', go: () => G.openFolder('folder')});
    return tip('Answer Objective 1', G.OBJ1.q, 'You have enough to answer. Did Clara drive?', {btn: 'Answer it', go: G.openObj}); }
  if (b === 'envA') {
    if (G.S.env.A === 'ready') return tip('Open Envelope A', 'You solved Objective 1. Tear it open.', 'Envelope A is ready. Tear it open.', {btn: 'Tear it open', pulse: 'env', go: () => G.openEnv('A')});
    const nxt = G.nextReviewId('envA');
    if (nxt) return tip('Take out the next piece', G.IT[nxt].n + '.', nxt === 'marcytape' ? 'Marcy\'s tape first. Then her photo.' : 'Next out of the envelope: ' + G.IT[nxt].n + '.', {btn: 'See inside', go: () => G.openFolder('envA')});
    return tip('Take out what was inside', 'New tapes and new evidence.', 'Empty the envelope onto the desk and the board.', {btn: 'See inside', go: () => G.openFolder('envA')}); }
  if (b === 'realize') {
    if (!G.S.played.marcy) return tip("Play Marcy's tape", 'Who drove Clara\'s car to the trailhead?', 'Play Marcy. Listen for how tall she is.', {btn: 'Play it', pulse: 'device', go: () => G.openPlayer('marcy')});
    if (!G.S.saved.height) return tip('Save the line about her height', 'Near the end of Marcy\'s tape.', 'Near the end of the tape. Save the line about her height.', {btn: 'Open the tape', pulse: 'device', go: () => G.openPlayer('marcy')});
    if (!G.S.pulled.marcy || !G.S.pulled.seat) return tip('Pin Marcy and the seat', 'Both have to be on the board before the string means anything.', 'Get Marcy\'s photo and the seat note onto the board.', {btn: 'Open Envelope A', go: () => G.openFolder('envA')});
    if (!G.S.real) return tip('Connect two things on the board', 'Tie a string between the seat and Marcy.', 'On the board, string the seat to Marcy\'s photo.', {btn: G.S.view === 'board' ? 'Connect them' : 'Go to the board', go: () => { G.setView('board'); G.S.connect = true; G.renderBoard(); }});
    if (G.S.env.B === 'ready') return tip('Open Envelope B', 'The breakthrough unlocked it.', 'Envelope B is ready. Tear it open.', {btn: 'Tear it open', pulse: 'env', go: () => G.openEnv('B')});
    return tip('Take out the phone ping', 'One page from the phone company.', 'Pin the phone ping. Then you can write the report.', {btn: 'See inside', go: () => G.openFolder('envB')}); }
  if (b === 'accuse') return tip('Write the report', 'Who, why, how, who drove, and three pieces of proof. Three attempts.', 'Write it up for Ortiz. Who, why, how, and who drove.', {btn: 'Write the report', go: G.openReport});
  if (b === 'file') { if (!G.S.packed) return tip('Pack up the case', 'Everything goes back into the folder.', 'Pack it back into the folder.', {btn: 'Pack it up', pulse: 'folder', go: G.fileStep});
    if (!G.S.stamped) return tip('Stamp it closed', 'Tap the folder to stamp it.', 'Stamp the folder closed.', {btn: 'Stamp it', pulse: 'folder', go: G.fileStep});
    if (!G.S.filed) return tip('File it away', 'Into the drawer with the other Pine Hollow cases.', 'File it in the drawer.', {btn: 'File it', pulse: 'folder', go: G.fileStep});
    return tip('Case filed', 'See your case record.', 'The case is filed.', {btn: 'Case record', go: G.rankCard}); }
  return {t: '', p: '', w: ''}; }

function seed(b, G) {
  const pullAll = src => G.SRC[src].forEach(i => { G.S.pulled[i] = 1; if (G.IT[i].dest !== 'desk' && !(i === 'news')) G.S.board[i] = {x: G.BP[i][0], y: G.BP[i][1]}; });
  if (b === 'intro') { G.setView('desk'); G.intro(); G.previewNoteJump(b); return; } if (b === 'handoff') { G.handoff(); G.previewNoteJump(b); return; }
  G.S.folderOnDesk = true; G.S.env = {A: 'sealed', B: 'sealed', C: 'sealed'}; G.S.beat = 'build'; G.note('Objective 1: where did Clara go? Did she drive?');
  if (b !== 'build') { pullAll('folder'); G.S.newsOn = 'desk'; G.S.viewed.briefing = 1; G.S.played.voicemail = 1; G.S.obj1 = 1; G.S.env.A = 'ready'; G.S.beat = 'envA'; G.note('9:12 PM: Clara is ON FOOT on the lake path'); G.note('Clara walked. Someone else drove her car.', 'ink'); }
  if (['realize', 'accuse', 'file'].includes(b)) { G.S.env.A = 'open'; pullAll('envA'); G.S.played.marcy = 1; G.S.saved.height = 1; G.S.beat = 'realize'; G.note('Envelope A: Marcy tape, lantern, seat, camera'); G.note('Marcy is 5′2″'); }
  if (['accuse', 'file'].includes(b)) { G.S.real = true; G.S.strings.push(['seat', 'marcy', true]); G.S.notes = G.S.notes.filter(n => n.t !== 'Marcy is 5′2″'); G.note("Seat forward + Marcy 5′2″ → MARCY drove the car", 'aha ink'); G.S.env.B = 'open'; pullAll('envB'); G.S.beat = 'accuse'; }
  if (b === 'file') { G.S.solved = true; G.S.env.C = 'open'; G.S.beat = 'file'; }
  G.reseed(); G.setView(b === 'realize' ? 'board' : 'desk'); G.render(); G.previewNoteJump(b); }

const TITLES = {
  "voicemail": [
    "Clara's voicemail",
    "Saturday 9:12 PM · to her lawyer Ruth Kessler"
  ],
  "marcy": [
    "Marcy Tolliver",
    "Interview · Clara's business partner"
  ],
  "daniel": [
    "Daniel Hale",
    "Interview · Clara's husband"
  ],
  "reed": [
    "Pastor Ellis Reed",
    "Interview · ran the pie table at the festival"
  ],
  "dunn": [
    "Deputy Ray Dunn",
    "Interview · first on scene Sunday"
  ],
  "jesse": [
    "Jesse Cole",
    "Interview · works at Clara's bakery"
  ]
};

const COPY = {
  "reveal": {
    "kicker": "Case solved · Report accepted",
    "who": "Marcy Tolliver.",
    "lead": "Ortiz reads your report, nods once, and picks up his keys. That night he tells you what happened.",
    "closingTitle": "Clara Hale was found in the old boathouse on Copper Lake. Ruth Kessler and Clara's family have been told.",
    "closingCharge": "Marcy Tolliver has been charged. Envelope C, the wrap-up, is on your desk.",
    "envC": {
      "kicker": "Envelope C · the wrap-up",
      "mast": "The Pine Hollow Courier",
      "headline": "Bakery Partner Charged in Death of Clara Hale",
      "body": "State police say Marcy Tolliver, 40, was charged Wednesday after investigators linked her to the Copper Lake trailhead… (placeholder article)",
      "note": "You saw what the rest of us walked past. The seat.<br>Thank you, Detective.<br><br>— S. Ortiz"
    }
  },
  "softFail": {
    "kicker": "Case closed by Det. Ortiz",
    "who": "It was Marcy.",
    "lead": "“I made the arrest. You got close. Here's what tipped it.”",
    "title": "What you missed",
    "bullets": [
      "The smashed lantern carries booth number 14: Marcy's booth.",
      "The 9:12 voicemail: \"I can't let her keep doing this.\" It was about money, not the divorce.",
      "The 10:40 Route 9 camera shows Marcy walking in from the lake side.",
      "Monday's phone ping came from near Juniper Lane, where Marcy lives."
    ]
  },
  "intro": {
    "hint": "🎧 Headphones help · about 2 hours, at your own pace · your progress saves on this device"
  },
  "cold": {
    "kicker": "Cold open · narrated by Det. Sam Ortiz",
    "cta": "Continue",
    "skip": "Skip intro",
    "lines": [
      "Pine Hollow, Montana. Population eleven hundred and change.",
      "Saturday night was the Harvest Festival. Lanterns strung all along the north field, where the lake path starts into the pines.",
      "Clara Hale, thirty-four, was seen at that festival a little after nine.",
      "By seven the next morning, her Subaru was sitting at the Copper Lake trailhead. Keys in the ignition. Her phone, gone.",
      "Clara, gone."
    ]
  },
  "howTo": {
    "kicker": "How it works · 20 seconds",
    "title": "You're the fresh eyes on this case.",
    "steps": [
      [
        "🎧",
        "Listen",
        "Ortiz recorded every interview. Play them, and save the lines that matter."
      ],
      [
        "🔍",
        "Look",
        "The case folder starts closed. Open it and follow Ortiz's order: interviews, then photos, then the places."
      ],
      [
        "📌",
        "Pin & connect",
        "Pin people and places to the board. Tie string between things. The right connection is a breakthrough."
      ]
    ],
    "note": "Ortiz leaves a quiet note on the desk, and the same next step sits on the right. Sealed envelopes open as you solve things.",
    "cta": "Meet Detective Ortiz →"
  },
  "handoff": {
    "speaker": "Det. Sam Ortiz",
    "role": "Montana State Police",
    "portrait": "p_ortiz",
    "voiceNote": "🔊 ElevenLabs",
    "next": "Next ▸",
    "skip": "Skip",
    "start": "Start investigating →",
    "objective": "Objective 1 of 3 · Where did Clara go, and did she drive?",
    "objectiveNote": "Objective 1: where did Clara go? Did she drive?",
    "toast": "The folder is closed on your desk. Open it. Briefing first.",
    "lines": [
      [
        "You must be the one Helena sent. Sam Ortiz, state police."
      ],
      [
        "Clara Hale. Thirty-four. Owns the bakery on Main Street. Last seen at the Harvest Festival, Saturday, a little after nine."
      ],
      [
        "Her car turned up at the Copper Lake trailhead Sunday morning. Keys in it. Phone gone. Three days now."
      ],
      [
        "I've done the interviews. Everything I have is in this folder.",
        "folder"
      ],
      [
        "These three envelopes stay sealed. Each one opens when you crack a piece of this. Not before.",
        "env"
      ],
      [
        "First question. Where did Clara go Saturday night, and did she drive there herself?",
        "obj"
      ],
      [
        "Start with the folder. Take out what you need. I'll check in."
      ]
    ]
  },
  "objective1": {
    "kicker": "Objective 1 of 3",
    "sub": "Pick one. A wrong answer doesn't end anything. Ortiz pushes back and you get a hint.",
    "demoWrong": "Demo: answer wrong",
    "demoRight": "Demo: answer right",
    "wrong": "Then explain the voicemail. Nine-twelve, she's on the lake path, on foot, out of breath. Listen to her again.",
    "hints": [
      "Clara was on foot at the festival. Listen to what is behind her voice on the voicemail.",
      "Pastor Reed and the 9:12 voicemail place her on the path. The trailhead card says the car showed up at 7 AM.",
      "She walked up the lake path right after 9. Someone else drove the car to the trailhead."
    ],
    "solvedTitle": "✓ Objective 1 solved.",
    "solvedLine": "Her car's at the trailhead. She didn't drive anywhere.",
    "solvedNote": "Envelope A is unlocked on your desk.",
    "solvedCta": "✉️ Open Envelope A →",
    "note": "Clara walked. Someone else drove her car."
  },
  "aha": {
    "kicker": "★ BREAKTHROUGH · 1 OF 3",
    "title": "Someone short drove Clara's car.",
    "body": "Clara is 5′10″ and drives with the seat all the way back. It was jammed all the way forward. Marcy is 5′2″.",
    "line": "Whoever drove her car to that trailhead needed it that way to reach the pedals.",
    "footer": "✓ Objective 2 solved · your note is now in ink · Envelope B unlocked",
    "tag": "Marcy is 5′2″",
    "note": "Seat forward + Marcy 5′2″ → MARCY drove the car",
    "cta": "Ortiz: “Open Envelope B.” →"
  },
  "accuseRecap": "Someone 5′2″ drove Clara's car. And on Monday her phone woke up near Juniper Lane. You have enough to write it up.",
  "envelope": {"notes": {"A": "Envelope A: Marcy tape, lantern, seat, camera", "B": "Envelope B: phone ping"}},
  "report": {
    "title": "Report to Det. Ortiz",
    "sub": "Fill every blank. Ortiz checks it as a whole and tells you how many parts are right, not which ones.",
    "rejected": "Ortiz reads it twice and hands it back.",
    "send": "📨 Send report to Ortiz",
    "closeCase": "Ortiz closes the case himself →",
    "fallbackPush": "Your evidence does not prove it. Pick the things that put Marcy on that path."
  },
  "rank": {
    "kicker": "Case record · filed",
    "solved": "Solved. The folder is stamped and filed in your drawer.",
    "assisted": "Ortiz closed it, but your desk work got him most of the way.",
    "rankAssisted": "Rookie (assisted)",
    "rankClean": "Senior Detective",
    "rankNormal": "Detective",
    "breakthroughTotal": 1,
    "shelf": [
      [
        "📁 Case 1",
        "Clara Hale ✓"
      ],
      [
        "Case 2",
        "coming soon"
      ],
      [
        "Case 3",
        "coming soon"
      ]
    ]
  }
};

const DOCS = {
  "briefing": {
    "img": "instructions",
    "title": "Case briefing",
    "html": "From Det. Sam Ortiz. <b>Objective 1:</b> Where did Clara go Saturday night, and did she drive there herself?",
    "face": "p_ortiz",
    "note": "Objective 1: where did Clara go? Did she drive?"
  },
  "news": {
    "img": "news_big",
    "title": "The Pine Hollow Courier",
    "html": "Monday edition. \"Local Baker Missing After Harvest Festival.\" Clara is on the front page.",
    "face": "p_clara"
  },
  "bag": {
    "img": "ledger_big",
    "title": "Evidence bag: the bakery ledger",
    "html": "Clara's big green ledger. Eleven pages, September and October, have been cut out. Clara kept the books. Who ran the register?",
    "note": "Ledger: 11 pages missing (Sep–Oct)"
  }
};

const FOLDERS = {
  "folder": {
    "title": "Case folder · HALE, Clara",
    "blurb": "A suggested order from Ortiz. Not a rule. Interviews first, then the photos, then places and papers."
  },
  "envA": {
    "title": "Inside Envelope A",
    "blurb": "Play Marcy's interview first. Then her photo and the camera still."
  },
  "envB": {
    "title": "Inside Envelope B",
    "blurb": "One page. Take the phone ping out and pin it."
  }
};

const NOTES = {
  "pulled": {
    "voicemail": "Clara left a voicemail at 9:12 PM"
  },
  "played": {
    "voicemail": "9:12 PM: Clara is ON FOOT on the lake path"
  }
};

const ONPULL = {
  "ping": {
    "beat": "accuse",
    "note": "Phone ping: Monday, 2 blocks from Juniper Lane",
    "card": {
      "kick": "Realization",
      "cta": "Back to the desk →"
    }
  }
};

const PREVIEW_TITLES = {
  "intro": 'Album cover. The case has not started.',
  "cold": 'Ortiz narrates Saturday night in Pine Hollow.',
  "desk": 'Choose the Clean Daylight desk or the Kitchen Table.',
  "how": 'Listen, look, and pin. One next step on the right.',
  "handoff": 'Ortiz sets down the folder and three sealed envelopes.',
  "closed": 'The case folder sits closed on the desk. Ortiz says to open it.',
  "review": 'The folder is open. Suggested order: briefing, interviews, photos, then places.',
  "folder": 'Briefing read, voicemail heard, a few pins up. Objective 1 is next.',
  "envA": 'Objective 1 is solved. Marcy, the seat, and the lantern are on the board. The camera still is still inside.',
  "realize": 'String between the seat and Marcy. The breakthrough card is up and Envelope B is ready.',
  "envB": 'The phone ping is on the board. Enough to write the report.',
  "wrong": 'The report names Daniel. Ortiz hands it back. The case stays open.',
  "right": 'The report is accepted. Ortiz walks through what happened.',
  "envC": 'The wrap-up: the Courier story and Ortiz\u2019s note.',
  "file": 'Packed and stamped. The drawer is open.',
  "filed": 'The case record is on the shelf.'
};

const FACE_THUMBS = [
  "p_clara",
  "p_daniel",
  "p_marcy",
  "p_ortiz",
  "p_reed",
  "p_jesse",
  "p_dunn",
  "dock_daniel",
  "camera_still"
];

const PORTRAITS = {
  "p_clara": {
    "type": "snapshot",
    "name": "Clara Hale",
    "source": "her sister's album",
    "note": "Harvest Festival booth, September",
    "look": "woman, 34, dark wavy shoulder-length hair, no makeup, cream knit sweater, tired"
  },
  "p_daniel": {
    "type": "phone",
    "name": "Daniel Hale",
    "source": "texted to Ortiz",
    "note": "phone candid, Saturday night",
    "look": "man, 42, short dark hair, full beard, blue-and-red plaid flannel over a t-shirt"
  },
  "p_marcy": {
    "type": "phone",
    "name": "Marcy Tolliver",
    "source": "texted to Ortiz",
    "note": "phone candid, at the bakery",
    "look": "woman, 40, dark hair pulled back, navy cardigan over a grey tee, watchful"
  },
  "p_reed": {
    "type": "directory",
    "name": "Ellis Reed",
    "source": "church directory",
    "note": "Pine Hollow Lutheran, 2019",
    "look": "man, late 60s, thinning grey hair, clean-shaven, grey cardigan over a pale shirt"
  },
  "p_jesse": {
    "type": "school",
    "name": "Jesse Cole",
    "source": "high school yearbook",
    "note": "junior year",
    "look": "young man, 22, dark wavy hair, thin moustache, plain dark t-shirt"
  },
  "p_dunn": {
    "type": "id",
    "name": "Ray Dunn",
    "source": "county sheriff",
    "note": "county ID, 2024",
    "look": "man, 55, receding grey-brown hair, heavy moustache, tan uniform shirt"
  },
  "p_ortiz": {
    "type": "id",
    "name": "Sam Ortiz",
    "source": "Montana state police",
    "note": "state police ID, 2023",
    "look": "man, 52, thick dark hair going grey, deep-set eyes, dark open-collar shirt"
  }
};

const DETECTIVE = 'Det. Ortiz';
const TAILS = {marcy: 'marcy_more'};
const PLAYFIRST = 'marcy';

const BREAKTHROUGH = {
  "pair": [
    "marcy",
    "seat"
  ],
  "requiresSaved": "height",
  "locked": "🤔 Something's there… but you don't know enough about Marcy yet. Play her tape to the end.",
  "near": [
    {
      "pair": [
        "camera",
        "seat"
      ],
      "hint": "🧶 Close. The seat matters. Who was short enough to need it there?"
    },
    {
      "pair": [
        "clara",
        "seat"
      ],
      "hint": "🧶 Close. The seat matters. Who was short enough to need it there?"
    }
  ]
};

const PIN_TAGS = {
  "marcy": {
    "text": "5′2″",
    "saved": "height"
  },
  "clara": {
    "text": "5′10″"
  }
};

const REPORT_DEMOS = {
  "wrong": {
    "who": "daniel",
    "why": "divorce",
    "how": "shove",
    "drove": "daniel",
    "proof": [
      "dock",
      "trailhead",
      "daniel",
      "clara",
      "seat"
    ]
  },
  "right": {
    "who": "marcy",
    "why": "embezzle",
    "how": "shove",
    "drove": "marcy",
    "proof": [
      "seat",
      "lantern",
      "ping"
    ]
  }
};

return {
  breakthrough: BREAKTHROUGH,
  pinTags: PIN_TAGS,
  reportDemos: REPORT_DEMOS,
  onPull: ONPULL,
  detective: DETECTIVE,
  portraits: PORTRAITS,
  faceThumbs: FACE_THUMBS,
  previewTitles: PREVIEW_TITLES,
  tails: TAILS,
  playFirst: PLAYFIRST,
  docs: DOCS,
  folders: FOLDERS,
  notes: NOTES,
  titles: TITLES,
  copy: COPY,
  seed: seed,
  steps: steps,
  id: 'clara-hale',
  number: '25-0412',
  case: CASE,
  beats: BEATS,
  evidence: IT,
  sources: SRC,
  review: REVIEW,
  faces: FACE,
  cards: CARDS,
  board: BP,
  suspects: SUS,
  report: REPORT,
  recordings: RECS,
  proof: PROOF_OK,
  solution: SOL,
  objective1: OBJ1,
  transcripts: TR,
  audio: AU,
  art: ART,
  previewNotes: PV_NOTES,
  previewMid: MID
};
})();
