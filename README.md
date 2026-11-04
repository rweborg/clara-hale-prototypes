# The Case Desk

*The Case Desk* is a case-file mystery series: you work the case yourself — the
folder, the tapes, the corkboard, the report. A NextSteps.llc product.

Two desk explorations and a full-journey case game. Static, no build step, no
package install: open a file or serve the folder.

| Path | What it is |
| --- | --- |
| [`index.html`](index.html) | Gallery of the prototypes |
| [`journey/`](journey/) | The full journey. This is the product. |
| [`b-daylight/`](b-daylight/), [`d-kitchen/`](d-kitchen/) | Two earlier desk explorations |
| [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) | The visual system and the reuse guide |
| [`journey/_build/README.md`](journey/_build/README.md) | How to author a case |

## Play it

```bash
python3 -m http.server 8137
```

Then open <http://127.0.0.1:8137/journey/index.html>.

- `?preview=1` adds the developer scrubber that walks every beat.
- `?case=<id>` loads another case pack from `journey/cases/`.
- Progress saves on the device and resumes. `⚙ Prototype → ↺ Start the case over`
  clears it.

## How the journey is built

`journey/index.html` is a case-neutral shell. It loads one case
(`journey/cases/clara-hale/case.js`) and then the engine
(`journey/app/player.js`), both as classic scripts so the prototype still opens
straight off the filesystem.

Adding a case should not mean editing the engine:

```bash
cd journey
node _build/new-case.js my-case --title "The Lighthouse Keeper"
node _build/validate.js my-case
node _build/check.js
```

`check.js` is the gate: the contract (no browser, fast), the experience suite in
headless Chromium (21 checks), then a full playthrough of the case from the intro
to the filed record — including a wrong objective answer, three rejected reports,
and a reload. `validate.js` checks the case pack and every file it points at. It
needs no npm install; it finds Chromium from `CHROME_BIN`, the Playwright cache,
or `/Applications`.

See [`journey/_build/README.md`](journey/_build/README.md) for the full contract
and for the list of prose the engine still owns.

## Deploy

`journey/` is a single nginx container, deployed on Railway via
[`journey/Dockerfile`](journey/Dockerfile) and
[`journey/railway.toml`](journey/railway.toml). It copies `index.html`, `app/`,
`cases/`, `assets/`, and `design-system/`.

## Status

The engine is case-neutral: it contains no case names, no case ids, and no case
prose. Everything a player reads comes from `journey/cases/<id>/case.js`, and
`validate.js` fails the build if that stops being true.

`node _build/check.js` runs the whole gate: the contract, 22 browser checks, and
a 21-step playthrough from the intro to the filed record. A freshly scaffolded
case passes all of it.

Still to do: design polish on the copy and pacing, and then new cases.
