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

# 3. get the prompts for the image model, then treat whatever comes back
node _build/prompts.js my-case
python3 _build/plates.py

# 4. play it
open "http://127.0.0.1:8137/journey/index.html?case=my-case"
open "http://127.0.0.1:8137/journey/index.html?case=my-case&preview=1"

# 5. prove the whole thing still works
node _build/check.js
```

Serve the repo over HTTP first (`python3 -m http.server 8137` at the repo
root). Opening `journey/index.html` straight off disk also works, but the
style guide needs the server so its portraits resolve.

## What belongs where

| Path | Role |
| --- | --- |
| `journey/index.html` | Shell: markup, the case loader, script order. Case-neutral. |
| `journey/app/player.js` | Engine: desk, board, tapes, envelopes, report, save. |
| `journey/app/player.css` | Component CSS. |
| `journey/app/brand.js` | The product name and company. The only place the shipped name lives. |
| `journey/app/version.js` | Build stamp written by `stamp.js`. Read by the (i) chip. |
| `journey/cases/<id>/case.js` | One case: cast, evidence, board, report, transcripts, hints, seeds. |
| `journey/assets/portraits/` | Raw generated portraits. Source only; never displayed. |
| `journey/assets/plates/` | Treated portraits the game actually shows. Written by `plates.py`. |
| `journey/assets/desk/` | The two desk photographs and their layered props. Engine-level. |
| `journey/assets/evidence/`, `covers/`, `audio/` | Case art and voices. |
| `journey/design-system/` | Tokens, specimens, style guide, fonts. |
| `journey/_build/` | Tooling. Not shipped behaviour. |

## Portraits and plates

No generated image is shown raw. Each portrait declares a provenance, and
`_build/plates.py` renders that provenance into a plate — the grade, the paper,
and the capture artefact that source would carry:

| `type` | Plate |
| --- | --- |
| `snapshot` | Warm, vignette, white print border, film date stamp |
| `id` | Flat and neutral, thin border, name band |
| `directory` | Sepia, double border, serif caption |
| `school` | Warm neutral, thin border, caption strip |
| `phone` | Saturated, faint screen glare, no border |
| `cctv` | Green monochrome, scanlines, timestamp bar |
| `scene` | Plain photographic grade |

Every plate also gets grain and a touch of softness, because a generated face is
too clean and that sheen is what reads as fake. Provenance is mandatory: the
validator fails a portrait with no `type`, no `name`, or no `source`.

## The pack

`cases/<id>/case.js` sets `window.CASE_PACK`. Required keys, all checked by
`validate.js`:

| Key | What it drives |
| --- | --- |
| `id` | Must match the folder name. Also namespaces the save key. |
| `number` | The case number in the top bar. |
| `case` | `title` (a `\n` is a line break), `kick`, `lead`, `cover`. |
| `beats` | The rail. Must include `intro`. |
| `evidence` | One entry per movable item: `n`, `th`, `dest`, optional `face`, `spr`, `rec`, `read`. |
| `sources` | `folder`, `envA`, `envB`. Every evidence id is in exactly one. An empty source is skipped. |
| `review` | Per source, ordered groups `{g, ids}`. Must list the same ids as `sources`. |
| `faces` | Recording id → portrait key, when the thumb is not the person. |
| `cards` | Board index-card heading and body, by evidence id. |
| `board` | Cork layout: `[center x, top y, width, label]` on the 1280×800 surface. |
| `suspects` | `[[id, name]]`. Each needs `art.p_<id>`. |
| `report` | `{k, l, o, a, push}`. `a` must be one of `o`. |
| `proof` | Evidence ids that count as real proof. |
| `recordings` | `[[recordingId, evidenceId]]` for the tape player. |
| `solution` | `[text, evidenceTag]` steps for the reveal. |
| `objective1` | `{q, o, a}` — the one gate before Envelope A. |
| `transcripts` | Recording id → `[{sp, x, t?, e?, tag?}]`. Audio is optional. |
| `audio` | Recording id → mp3 path. |
| `art` | Art key → path. Merged over the engine's shared art. |
| `portraits` | Provenance per portrait: `type`, `name`, `source`, `note`. **Required.** |
| `titles` | Recording id → `[name, subtitle]`. |
| `detective` | Short label for the detective in UI. |
| `docs` | Desk documents: the briefing, the newspaper, the ledger. |
| `folders` | Folder heading and the line above each review order. |
| `notes` | `pulled` / `played` notes, by evidence id and recording id. |
| `onPull` | What happens when a specific item comes out. |
| `tails` | Recording id → a transcript key that continues after the audio. |
| `playFirst` | The recording the desk recorder opens first. |
| `breakthrough` | `pair`, `requiresSaved`, `locked`, `near[]`. |
| `pinTags` | Short tag printed on a pin, optionally gated on a saved line. |
| `reportDemos` | `wrong` / `right` specs behind the report's demo buttons. |
| `copy` | The words for the opening act, objective, breakthrough, report, reveal, soft fail and rank card. |
| `previewTitles` | Scrubber tooltips, by stage id. |
| `steps(G)` | The side card, whisper, and Hint button. |
| `seed(beat, G)` | State "as if you had played up to this beat". |

`G` is a small API, not the engine. In `steps`: `S`, `IT`, `OBJ1`, `SRC`,
`openFolder`, `deskClick`, `openPlayer`, `openObj`, `openEnv`, `openReport`,
`fileStep`, `rankCard`, `setView`, `renderBoard`, `pulledFrom`, `nextReviewId`.
In `seed`: `S`, `SRC`, `IT`, `BP`, `note`, `setView`, `intro`, `handoff`,
`render`, `previewNoteJump`, `reseed`.

## What the engine still owns

The validator scans `app/player.js` for the case's detective, its suspects and
its title, and finds none — and no evidence id either, because the preview
timeline drives itself through `jump(beat)`, which runs the case's own `seed()`.

What remains is deliberate: generic chrome in English ("Put it back on the
desk"), shared furniture (the two desks and their props, the cork, the envelope
photographs, the tape-player chrome, the filing drawer), and the desk geometry
(`HOT`, `CFG.desk`) — where a folder sits on a desk, not what is in it.

## Save data

- `jp-save-v2` — the default case (clara-hale).
- `jp-save-v2:<caseId>` — every other case.
- `jp-vol` — volume, shared. `jp-theme` — desk choice, shared.

Preview mode (`?preview=1`) never reads or writes the real save.

## Tools

| Tool | Use |
| --- | --- |
| `node _build/check.js [id]` | The gate: contract → 22 browser checks → 21-step playthrough. |
| `node _build/validate.js [id]` | Static contract + asset check. No browser. |
| `node _build/smoke.js` | Real browser: every beat, both desks, folder, board, tape, preview, mobile. |
| `node _build/playthrough.js` | Plays the case from the intro to the filed record, plus the failure paths. |
| `node _build/probe.js "<expr>"` | Ad-hoc poking in a loaded page. |
| `node _build/new-case.js <id>` | Scaffold a valid pack. |
| `node _build/prompts.js [id]` | Write `cases/<id>/prompts.md`: a model-ready prompt per portrait. |
| `node _build/gen_portraits.js [id]` | Generate the portraits from those prompts with a hosted model (needs `REPLICATE_API_TOKEN`). |
| `python3 _build/plates.py` | Render portrait provenance into `assets/plates/`. |
| `node _build/stamp.js <version>` | Write `app/version.js` for the (i) chip. |
| `python3 _build/fix_prop_shadows.py` | Recomposite the desk props' shadows. |
| `python3 _build/extract_assets.py` | One-time base64 migration. Already applied. |

There is no assemble step. `index.html` loads `app/brand.js`, one case pack, and
`app/player.js` as real files, so there is nothing to build. The pipeline is
`validate` then `smoke` then `playthrough`, and `check.js` runs all three.

`smoke.js`, `playthrough.js` and `probe.js` need a Chromium binary. They find one
from `CHROME_BIN`, the Playwright cache, or `/Applications`. No npm install.
