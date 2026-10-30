# Clara Hale: full-journey clickthrough prototype
Open `index.html` in a browser. Keep the `assets/` folder next to it: all voices are ElevenLabs MP3s in `assets/audio/`. Works offline.

## Preview timeline (developers only)
Not a player feature. Open `index.html?preview=1`. A **Preview only** bar fixes to the bottom. Drag the playhead, click a stage, or use ‹ › (and the left and right arrow keys) to walk the journey: intro, cold open, desk pick, how it works, handoff, the closed case folder, the opened folder with a suggested review order, case folder (mid-investigation), Envelope A, the realization, Envelope B, a wrong accusation, a right accusation, Envelope C, file away, and the filed record. Each stop is a mid-journey snapshot, so the desk, board, or scene looks like someone is already there.

**Play** advances through those stages with a short pause on each. **Pause** holds. **Stop** ends the walk and returns to the intro.

Preview mode does not read or write the real playthrough (`localStorage` key `jp-save-v2`). Reload without `?preview=1` and a saved game is unchanged. The hash is still the old beat jumper (`#accuse` and the rest); the scrubber uses the query so the two do not collide. A hash on a preview URL (`?preview=1#realize` or `?preview=1#file`) opens that stop. The bar is absent on the normal player URL.

## Rules this build follows
- **No in-game days.** The case moves forward only through play: Ortiz hands over the case → take items out of the folder onto the desk or the corkboard → solve Objective 1 → tear open Envelope A → realization on the board (seat + Marcy's height) → Envelope B → write the accusation report (3 attempts, a wrong answer gets Ortiz's pushback) → reveal / Envelope C → pack up, stamp, and file the case in the drawer.
- **Save and resume.** Progress saves automatically to this device (`localStorage` key `jp-save-v2`). That covers the current beat, items taken out, board pin positions and strings, notes, objectives, envelopes, played tapes, report attempts, and file-away steps. Reopen the page and you land back at your desk where you left off. To start over: ⚙ Prototype → ↺ Start the case over.
- **Desk ambience follows the player's real clock and is cosmetic only.** 5–11 AM morning and 11 AM–5 PM daytime get coffee and a cherry danish. 5–9 PM evening and 9 PM–5 AM night get Chinese takeout, and the lamp comes on. The coffee, danish, and takeout respond to sips and bites, and that's all they do: they never gate progress. The ⚙ Prototype panel can preview each look without saving it.
- **Voices are ElevenLabs only.** Clara's voicemail, the interview tapes (Daniel, Reed, Dunn, Jesse, Marcy), and all of Det. Ortiz's lines (cold open, handoff, pushbacks, breakthrough, reveal, welcome back) play bundled MP3s. The game never uses device or Mac text-to-speech. If a line has no sample, it shows as text only.

Jump to any beat from the top rail (prototype). Research: `../research/journey-research.md`. Screenshots: `shots/` (`v2-*` = this revision). Build: `python3 _build/gen.py` rebuilds `index.html` and copies the audio. `_build/ortiz_lines.py` regenerates the Ortiz lines (it needs `ELEVENLABS_API_KEY`). `_build/smoke.js` runs the headless smoke test.
