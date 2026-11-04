/**
 * The case contract.
 *
 * NOT loaded by the player, and not enforced here. This file is a shape
 * reference for editors and authors.
 *
 *   enforced by : journey/_build/validate.js   (node _build/validate.js)
 *   explained by: journey/_build/README.md
 *   reference   : journey/cases/clara-hale/case.js
 *
 * A case is one file, journey/cases/<id>/case.js, which sets window.CASE_PACK.
 * The engine (journey/app/player.js) reads that object and never mentions a
 * particular case. If a new case needs the engine edited, that is a bug.
 *
 * Paths are relative to journey/ (the page), never to the case file.
 */

/**
 * @typedef {Object} Evidence
 * @property {string} n          Display name, e.g. "Tape: Marcy Tolliver interview"
 * @property {string} th         Thumb key: a key in `art`, or a literal emoji
 * @property {'desk'|'board'|'both'} dest  Where it can live
 * @property {string} [face]     Portrait key shown as an inset
 * @property {string} [spr]      Desk sprite key from CFG.desk[*].spr
 * @property {string} [rec]      Recording id, if it is a tape
 * @property {string[]} [read]   Handwritten lines, for an index card
 */

/**
 * @typedef {Object} Pack
 * @property {string} id                Must equal the folder name; namespaces the save key
 * @property {string} number            Case number shown in the top bar
 * @property {{title:string, kick:string, lead:string, cover:string}} case
 *           title may contain \n. kick is the in-fiction series on the album cover.
 * @property {[string,string][]} beats  Rail entries; must include 'intro'
 * @property {Record<string,Evidence>} evidence
 * @property {Record<string,string[]>} sources   folder | envA | envB. Every id in exactly one.
 * @property {Record<string,{g:string, ids:string[]}[]>} review  Same ids as sources, in order
 * @property {Record<string,string>} faces       Recording id -> portrait key
 * @property {Record<string,[string,string]>} cards  Board card heading and body, by evidence id
 * @property {Record<string,[number,number,number,string,string?]>} board
 *           [center x, top y, width, label, optional label class] on the 1280x800 cork
 * @property {[string,string][]} suspects        Each needs art.p_<id>
 * @property {{k:string,l:string,o:(string|[string,string])[],a:string,push:string}[]} report
 * @property {string[]} proof            Evidence ids that count as proof
 * @property {[string,string][]} recordings  [recordingId, evidenceId]
 * @property {[string,string][]} solution    [step text, evidence tag] for the reveal
 * @property {{q:string,o:string[],a:number}} objective1
 * @property {Record<string,{sp:string,x:string,t?:number,e?:number,tag?:string}[]>} transcripts
 * @property {Record<string,string>} audio       Recording id -> mp3 path. Optional: text-only is fine.
 * @property {Record<string,string>} art         Art key -> path. Merged over the engine's shared art.
 * @property {Record<string,[string,string]>} titles  Recording id -> [name, subtitle]
 * @property {Object} copy               Prose the engine prints for the closing scenes
 * @property {Object[]} [previewNotes]   Labels for the developer scrubber
 * @property {Object} [previewMid]       Mid-journey state for the scrubber
 * @property {(G:Object)=>Object} steps  Side card, desk whisper, and Hint button
 * @property {(beat:string, G:Object)=>void} seed  State as if the player reached this beat
 */

/**
 * copy.reveal     {kicker, who, lead, closingTitle, closingCharge,
 *                  envC:{kicker, mast, headline, body, note}}
 * copy.softFail   {kicker, who, lead, title, bullets[]}
 * copy.rank       {kicker, solved, assisted, rankAssisted?, rankClean?, rankNormal?,
 *                  breakthroughTotal?, shelf:[[line1,line2], ...]}
 *
 * `note` in envC is inserted as HTML so it can carry <br>. Everything else is
 * escaped by the engine.
 */

/**
 * The API a case receives, so it cannot reach into the player.
 *
 * steps(G): S, IT, OBJ1, SRC, openFolder, deskClick, openPlayer, openObj,
 *           openEnv, openReport, fileStep, rankCard, setView, renderBoard,
 *           pulledFrom, nextReviewId
 *
 * seed(beat, G): S, SRC, IT, BP, note, setView, intro, handoff, render,
 *                previewNoteJump, reseed
 */

module.exports = {};
