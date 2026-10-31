/**
 * Case-file contract for the Clara Hale journey.
 *
 * The player does not load this file. It is the shape a second case should
 * follow. See DESIGN_SYSTEM.md at the repo root.
 *
 * What the player reads today (journey/index.html):
 *   CASE = { title, kick, lead, cover }
 *   and, beside it: BEATS, IT, SRC, REVIEW, BP, FACE, CARDS
 *
 * Author the next case as one object in the shape of CASE_CONTRACT_BLANK,
 * then map the fields onto those tables until the player reads one module.
 * Leave portrait and prop files to the image pass. Point at paths. Do not
 * embed new base64 art in the player.
 */

/**
 * @typedef {'desk' | 'board' | 'both'} EvidenceDest
 * @typedef {'folder' | 'envA' | 'envB'} EvidenceSource
 */

/**
 * Clara, shortened. The full evidence list is IT / SRC / REVIEW in the player.
 * Paths are relative to journey/.
 */
const CASE_CONTRACT_EXAMPLE = {
  id: 'clara-hale',
  number: '25-0412',
  title: 'The Vanishing of\nClara Hale',
  kick: 'Pine Hollow Case Files · Case 1',
  lead: 'A woman is missing from a small Montana town. Listen to the interviews, look at the evidence, and work out what happened to Clara.',
  /** Path or URL. paintCaseCover() reads this. Not a CSS path. */
  cover: 'assets/covers/clara-hale.jpg',

  portraits: {
    clara: 'assets/portraits/clara.jpg',
    daniel: 'assets/portraits/daniel.jpg',
    dunn: 'assets/portraits/dunn.jpg',
    jesse: 'assets/portraits/jesse.jpg',
    marcy: 'assets/portraits/marcy.jpg',
    ortiz: 'assets/portraits/ortiz.jpg',
    reed: 'assets/portraits/reed.jpg'
  },

  /**
   * One row per thing that can leave a folder or an envelope.
   * thumb: art-map key (today) or a path under assets/evidence/.
   * face: portrait key shown as a small inset, when the thumb is not the person.
   * dest: desk, board, or both.
   * source: which container it starts in. Must match a key in review.
   * board: where it lands on the 1280×800 cork. The player still uses the BP table.
   */
  evidence: [
    {
      id: 'briefing',
      name: 'Case briefing (start here)',
      thumb: 'instructions',
      face: 'p_ortiz',
      dest: 'desk',
      source: 'folder',
      sprite: 'briefing'
    },
    {
      id: 'clara',
      name: 'Photo: Clara Hale',
      thumb: 'p_clara',
      face: 'p_clara',
      dest: 'board',
      source: 'folder',
      board: { x: 640, y: 60, w: 120, label: 'Clara Hale · MISSING', labelClass: 'x' }
    }
  ],

  /**
   * A is the envelope photo. B and C are hue shifts (blue, green).
   * C is the wrap-up. It has no pins.
   */
  envelopes: {
    A: {
      label: 'Envelope A',
      hue: null,
      unlock: 'After Objective 1',
      items: ['marcytape', 'marcy', 'seat', 'camera', 'lantern']
    },
    B: {
      label: 'Envelope B',
      hue: 'blue',
      unlock: 'After the first breakthrough',
      items: ['ping']
    },
    C: {
      label: 'Envelope C',
      hue: 'green',
      unlock: 'After the case is solved',
      items: []
    }
  },

  /**
   * Suggested order. A nudge, not a lock. Group ids must be the same set as
   * the evidence rows for that source. The first id still inside is "Suggested next."
   */
  review: {
    folder: [
      { g: '1 · Read this first', ids: ['briefing'] },
      { g: '2 · Interviews', ids: ['voicemail', 'dtape', 'rtape', 'utape', 'jtape'] },
      { g: '3 · Photos', ids: ['clara', 'daniel', 'news', 'dock'] },
      { g: '4 · Places and papers', ids: ['festival', 'trailhead', 'report', 'map', 'bag'] }
    ],
    envA: [
      { g: '1 · Her interview', ids: ['marcytape'] },
      { g: '2 · Photos, then the rest', ids: ['marcy', 'camera', 'seat', 'lantern'] }
    ],
    envB: [
      { g: '1 · The phone record', ids: ['ping'] }
    ]
  },

  /** Rail order. Ids are the beats nextStep() branches on. */
  beats: [
    ['intro', 'Intro'],
    ['handoff', 'Case handoff'],
    ['build', 'Case folder'],
    ['envA', 'Envelope A'],
    ['realize', 'Realization'],
    ['accuse', 'Accuse'],
    ['file', 'File away']
  ]
};

/** Copy this object for the next Pine Hollow file. Replace every placeholder. */
const CASE_CONTRACT_BLANK = {
  id: 'next-case',
  number: '00-0000',
  title: 'Title of the case\noptional second line',
  kick: 'Pine Hollow Case Files · Case 2',
  lead: 'One or two sentences. This is the paragraph on the album cover.',
  cover: 'assets/covers/next-case.jpg',
  portraits: {
    lead: 'assets/portraits/lead.jpg'
  },
  evidence: [
    {
      id: 'briefing',
      name: 'Case briefing (start here)',
      thumb: 'assets/evidence/briefing.jpg',
      dest: 'desk',
      source: 'folder'
    }
  ],
  envelopes: {
    A: { label: 'Envelope A', hue: null, unlock: 'After the first objective', items: [] },
    B: { label: 'Envelope B', hue: 'blue', unlock: 'After the breakthrough', items: [] },
    C: { label: 'Envelope C', hue: 'green', unlock: 'After the case is solved', items: [] }
  },
  review: {
    folder: [
      { g: '1 · Read this first', ids: ['briefing'] }
    ]
  },
  beats: [
    ['intro', 'Intro'],
    ['handoff', 'Case handoff'],
    ['build', 'Case folder'],
    ['envA', 'Envelope A'],
    ['realize', 'Realization'],
    ['accuse', 'Accuse'],
    ['file', 'File away']
  ]
};
