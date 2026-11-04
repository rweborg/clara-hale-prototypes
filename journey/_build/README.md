# Authoring a case

Everything specific to a case lives in `cases/<id>/case.js`. The engine
(`app/player.js`) never mentions Clara. Adding a case should not require
editing the engine; if it does, that is a bug in the contract.

## The loop

```bash
# 1. from journey/
node _build/new-case.js my-case --title "The Lighthouse Keeper"

# 2. edit cases/my-case/case.js until it validates
node _build/validate.js my-case

# 3. play it
open "http://127.0.0.1:8137/journey/index.html?case=my-case"
open "http://127.0.0.1:8137/journey/index.html?case=my-case&preview=1"

# 4. prove the whole experience still works
node _build/smoke.js
```

Serve the repo over HTTP first (`python3 -m http.server 8137` at the repo root).
Opening `journey/index.html` straight off disk also works, but the style guide
needs the server so its portraits resolve.

## What belongs where

| Path | Role |
| --- | --- |
| `journey/index.html` | Shell: markup, the case loader, script order. Case-neutral. |
| `journey/app/player.js` | Engine: desk, board, tapes, envelopes, report, save. |
| `journey/app/player.css` | Component CSS. |
| `journey/app/brand.js` | The product name and company. The only place the shipped name lives. |
| `journey/cases/<id>/case.js` | One case: cast, evidence, board, report, transcripts, hints, seeds. |
| `journey/assets/desk/` | The two desk photographs and their layered props. Engine-level. |
| `journey/assets/evidence/`, `portraits/`, `covers/`, `audio/` | Case art and voices. |
| `journey/design-system/` | Tokens, specimens, style guide, fonts. |
| `journey/_build/` | Tooling: validate, smoke, probe, scaffold. Not shipped behaviour. |

## The pack

`cases/<id>/case.js` sets `window.CASE_PACK`. Required keys, all checked by
`validate.js`:

| Key | What it drives |
| --- | --- |
| `id` | Must match the folder name. Also namespaces the save key. |
| `number` | The case number in the top bar (`Case ${number}`). |
| `case` | `title` (a `\n` is a line break), `kick`, `lead`, `cover`. |
| `beats` | The rail. Must include `intro`. |
| `evidence` | One entry per movable item: `n`, `th`, `dest`, optional `face`, `spr`, `rec`, `read`. |
| `sources` | `folder`, `envA`, `envB`. Every evidence id is in exactly one. An empty source is skipped. |
| `review` | Per source, ordered groups `{g, ids}`. Must list the same ids as `sources`. |
| `faces` | Recording id → portrait key, when the thumb is not the person. |
| `cards` | Board index-card heading and body, by evidence id. |
| `board` | Cork layout: `[center x, top y, width, label]` on the 1280×800 surface. |
| `suspects` | `[[id, name]]`. Each needs `art.p_<id>`. |
| `report` | `{k, l, o, a, push}`. `a` must be one of `o`. `push` is Ortiz's pushback. |
| `proof` | Evidence ids that count as real proof. |
| `recordings` | `[[recordingId, evidenceId]]` for the tape player. |
| `solution` | `[text, evidenceTag]` steps for the reveal. |
| `objective1` | `{q, o, a}` — the one gate before Envelope A. |
| `transcripts` | Recording id → `[{sp, x, t?, e?, tag?}]`. Audio is optional; text-only is fine. |
| `audio` | Recording id → mp3 path. |
| `art` | Art key → path. Merged over the engine's shared art. |
| `titles` | Recording id → `[name, subtitle]` for the tape list. |
| `copy` | The words the engine prints in the closing scenes: `reveal`, `softFail`, `rank`. |
| `detective` | Short label for the detective in UI, e.g. "Det. Ortiz". |
| `faceThumbs` | Art keys that are people, so the tile crops to the face. |
| `docs` | Desk documents: what opens for the briefing, the newspaper, the ledger. |
| `folders` | Folder heading and the line above each review order. |
| `notes` | `pulled` / `played` notes, by evidence id and recording id. |
| `onPull` | What happens when a specific item comes out: a note, a beat change, a card. |
| `tails` | Recording id → a transcript key that continues after the audio excerpt. |
| `playFirst` | The recording the desk recorder opens first while it is unplayed. |
| `breakthrough` | `pair`, `requiresSaved`, `locked`, `near[]` — the board connection that matters. |
| `pinTags` | Short tag printed on a pin, optionally gated on a saved line. |
| `reportDemos` | `wrong` / `right` specs behind the report's demo buttons. |
| `previewTitles` | Scrubber tooltips, by stage id. |
| `steps(G)` | The side card, whisper, and Hint button. |
| `seed(beat, G)` | State "as if you had played up to this beat", for jump and preview. |

`G` is a small API, not the engine. In `steps`: `S`, `IT`, `OBJ1`, `SRC`,
`openFolder`, `deskClick`, `openPlayer`, `openObj`, `openEnv`, `openReport`,
`fileStep`, `rankCard`, `setView`, `renderBoard`, `pulledFrom`, `nextReviewId`.
In `seed`: `S`, `SRC`, `IT`, `BP`, `note`, `setView`, `intro`, `handoff`,
`render`, `previewNoteJump`, `reseed`.

## What the engine still owns

The validator scans `app/player.js` for the case's detective, its suspects, and
its title, and finds none. It also no longer holds any of Clara's evidence ids:
the preview timeline drives itself through `jump(beat)`, which runs the case's
own `seed()`.

What remains in the engine is deliberate:

- **Generic chrome.** Buttons and hints in English — "Put it back on the desk",
  "Connect two things", "Whole desk". Shared by every case, not yet localised.
- **Shared furniture.** The two desk photographs and their layered props, the
  cork, the envelope photographs, the tape-player chrome, the filing drawer.
- **The desk-screen geometry** (`HOT`, `CFG.desk`) — where a folder sits on a
  desk, not what is in it.

A case can rely on all of that. It should never need to edit it.
