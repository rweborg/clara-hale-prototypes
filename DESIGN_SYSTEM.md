# Clara Hale journey — design system

This is the reuse guide for the journey prototype (`journey/`). The visual specimens live in [`journey/design-system/index.html`](journey/design-system/index.html). Open that page when you want to see a pattern. Read this file when you are adding another case.

The live game still draws itself from `journey/index.html`. This pass extracts the language those screens already use so the next case file can follow it. Portrait and prop images are graded elsewhere. Do not regenerate them as part of adopting this system. Point at the files. Let that other pass replace the pixels.

## Where things live

| Path | Role |
| --- | --- |
| `journey/design-system/tokens.css` | Color, type, space, elevation, materials, photo spec. The player links this. |
| `journey/design-system/patterns.css` | Specimens (`ds-` classes). The game does not link this file, so the guide cannot restyle the desk. |
| `journey/design-system/index.html` | Style guide. Each pattern is named, shown, and paired with the markup the player uses. |
| `journey/design-system/case.contract.js` | The case-file shape. Copy `CASE_CONTRACT_BLANK`. The player does not load this file. |
| `journey/index.html` | The game. Component CSS and the Clara content tables still live here. |

Serve the repo (or `journey/`) over HTTP before opening the style guide, so `assets/` portraits resolve.

## Visual language

Ordinary players should be able to read this as a case file, not as a poster and not as a dashboard. UI chrome (the side column, buttons, the top bar) is calm and rounded. Case objects (folder, prints, envelopes, pins) look like things on a desk.

### Image treatment

Characters are real photographs. The locked look is rough and natural: a little grain, a little softness, desaturated, with color still recognizable (hair, a coat, a flannel). Not illustration, and not a beauty-retouched studio shot.

- Crop head and shoulders. When a frame is taller than the face, use `object-position: center 16%` (`--ds-portrait-position`).
- Radius stays at 4px (`--ds-portrait-radius`) so a print looks cut, not like an app avatar.
- On the board, tilt the print a few degrees, add the red pushpin, and a name plate.
- Props (closed folder, newspaper, dock photo, ledger) are photographs of physical things. Ragged paper and uneven edges belong in the file. Do not mask them into perfect cards.
- A mild prop grade is `--ds-prop-filter` (`saturate(.88) contrast(1.04)`). It must not wash out newsprint.

The player shows a portrait as stored. It does not run a CSS filter over the face, so a finished file is not graded twice. `--ds-photo-filter` (`grayscale(.22) saturate(.7) contrast(1.05)`) and the grain overlay (`.ds-photo-frame.is-treated`, opacity `--ds-photo-grain`) are the stand-in for a file that is still being graded. Use them on the style guide and on a temporary asset. Take them off once the file itself carries the look.

### Typography

Four families, already embedded in the player. The style guide loads the same outlines from `journey/design-system/fonts/`.

| Token | Family | Use |
| --- | --- | --- |
| `--ds-font-ui` | Atkinson | Buttons, the side column, hints, transcripts, labels. |
| `--ds-font-display` | Archivo Black | Case title, folder heading, newspaper mast, breakthrough title. |
| `--ds-font-mono` | Courier Prime (`CourierP`) | Folder inventory, cold open, case number. |
| `--ds-font-hand` | Caveat | The player’s notes and pinned index cards. |

Kickers are 12px, bold, uppercase, tracked out (`--ds-track-kicker`), in copper. The case title is about 44px (`--ds-fs-display`) with a tight line height. Body copy in the side column is 15px.

A newline in `CASE.title` is a real line break on the album cover. Clara’s title is `The Vanishing of\nClara Hale`.

### Card layout

Two kinds of card, on purpose.

**Chrome cards** hold the interface: the next-step card, progress, notes. White (or `--ds-wood-card` on the kitchen desk), 14px radius, padding 16px, shadow `--ds-elev-card`. The side column is 340px (`--ds-side-w`) on a paper or wood ground. On a narrow window it becomes the bottom sheet in [Phones and tablets](#phones-and-tablets).

**Evidence cards** are paper. Inside the folder (`.it`) they are small tiles: 10px radius, a 74px thumb, the name, and desk / board buttons. A person thumb (`.th.face`) is positioned at `center 12%`, not the vertical middle, so a short wide tile keeps the eyes and forehead instead of the chin. Taller frames (a tape face, a pin, the talk portrait) still use `--ds-portrait-position` (`center 16%`). A document or prop thumb (`.th.doc`: the briefing, the newspaper, an index card, the police report, the map, the ledger, a sticky) is `center top`, so the tile shows the masthead or the heading instead of the middle of the page. The background shorthand on `.it .th` must not reset either position to `center`. The suggested-next tile (`.it.up`) gets a warm outline (`#C4A15A`) and a cream fill. On the cork (`.cardx`) a note is lined paper, a red rule on top, Caveat handwriting, tilted.

The number on a tile is its place in the review order, not a score.

### Folder and evidence

**Closed folder.** A photograph of a stuffed manila folder (`assets/evidence/folder-closed.webp` for Clara): label, a clipped print, pages sticking out. It sits on the desk, slightly askew. Clicking it opens the spread. There is no 3D open animation.

**Open folder** (`.fold`). A manila gradient (`--ds-manila-0` to `--ds-manila-1`) with a narrow spine (`--ds-spine`). Left page (`--ds-folder-left`) is the inventory: a guide sentence (`.guide` on `--ds-guide`), the ordered steps (`.order`), and a typewriter list. Right page (`--ds-folder-right`) is the tiles still inside. Taken items stay on the left, struck through, with a pine check.

**Envelopes** (`.envw`). One physical envelope. A is the photograph. B is `hue-rotate(195deg) saturate(.9)` (`--ds-env-b-filter`). C is `hue-rotate(110deg)` (`--ds-env-c-filter`). The player tears along a dashed line. A and B then open as folders with their own review order. C is the wrap-up (the paper and Ortiz’s note), not another stack of pins.

Progress chips use flat colors when the side column needs a swatch: A `--ds-env-a`, B `--ds-env-b`, C `--ds-env-c`.

### Board thread

The cork is a photograph. Do not replace it with a flat brown. The style guide uses a cork-colored stand-in only so the pin and the thread can be seen without the desk image.

A pin (`.pin`) is the print, a red pushpin (radial highlight, `--ds-alarm` body), and a name plate. A missing-person plate uses the alarm fill (`.nm.x`). Pins drag. A new pin drops in with a small rotate-and-settle.

Yarn (`#strings .yarn`) is `--ds-yarn` (`#B3141B`), 3.5px, round caps, a short drop shadow. The breakthrough thread goes hot (`--ds-yarn-hot`, thicker, drawn on). The thread under the pointer, or the one you have selected, turns gold and thickens (`--ds-gold`).

The clickable part is a wide transparent stroke (`#stringhits`, about 44px in the player). The visible line does not have to catch the click by itself. On a small screen that stroke grows so the finger still has about 48px to hit.

### Desk materials and ambience

| Desk | When | Tokens |
| --- | --- | --- |
| Clean daylight | Default (`body`, theme `b`) | `--ds-paper`, `--ds-side`, `--ds-card`, pine accent |
| Kitchen table | `body.th-d` (theme `d`) | `--ds-wood`, `--ds-wood-side`, `--ds-wood-card`, copper accent |

Buttons stay pine (`--ds-pine` / `--btn`) on both desks. The kitchen accent (`--accent`) is copper, used for progress and for Ortiz’s kicker.

Ambience follows the player’s real clock and never gates the case. It is not saved as progress. The prototype panel can preview a band without writing it.

| Clock | Look |
| --- | --- |
| 5–11 | Morning. Coffee and a cherry danish. |
| 11–5 | Daytime. Same tray. Lamp off. |
| 5–9 | Evening. Chinese takeout. Lamp on. |
| 9–5 | Night. Takeout. Lamp on. |

Sips and bites are cosmetic. They do not unlock evidence. Desk props can be dragged to a new spot on the 1280×800 surface. A short tap still opens the folder, the briefing, a tape, or anything else that was tappable. Dropping the briefing, the newspaper, the evidence bag, or the tape recorder onto the case folder puts that evidence back inside (`S.pulled` cleared, and the newspaper leaves the desk). The mug, the food, the lamp, the notes, and the envelopes stay on the desk. A drop on empty wood only moves the prop. The new spot is `S.place` and is saved with the case. Each prop is only its own pixels, so one can sit on another without either picture leaving the desk. The one you just moved stays in front (`S.stack`). If its hotspot would bury the other, it shifts a little so both can still be grabbed. Sounds are soft procedural cues under the same volume slider: a wood slide when a prop is set down, paper for the folder and the preview, a sip, a bite, and a separate quiet cue for a pin, a tear, a stamp, the drawer, a correct answer, and a wrong one.

## Interaction patterns that stay

These are locked. A new case keeps the behavior and replaces the content.

### Click outside to dismiss

Foreground items (open folder, a photograph, a tape, an envelope, the report) sit in `#ov`: a dim scrim (`--ds-scrim`, blur `--ds-scrim-blur`) over the desk, under the top bar.

- Clicking the dim desk puts the item back. The back button (“Put it back on the desk”) does the same. Escape does the same.
- The pointer-down and the click both have to land outside the item. A drag that starts on a list, a pin, or a tape control does not dismiss.
- The scrollbar of a scrolling panel is not “outside.”
- The style guide demos this on the folder specimen. Live function: `ov()` in `journey/index.html`.
- A look opened from a folder card (`#peek`) sits above that scrim. Escape closes the look first, then the folder. See [Look before you take it out](#look-before-you-take-it-out).

### Look before you take it out

The whole evidence tile (`.it`) opens a preview over the folder (`#peek`), including the thumb, the name, and “Suggested next.” A row in the left list does the same while that item is still inside. **Put on desk** and **Pin to board** (`.bt button`) stay separate, so they take the item out and do not open the preview. The press does not arm the folder’s click-outside dismiss. `#peek` sits above the folder (`z-index: 220`) until **Back to the folder**, the dim margin, or Escape. The page, photo, or note is there to read. An index card also prints its handwritten lines in type. The same two decisions sit on the preview.

- **Back to the folder**, a tap on the dim margin, or Escape closes the preview and leaves the item in the folder.
- Looking does not pull the item, does not mark a page viewed, and does not play a tape. The desk viewer (`viewImg`) is still what marks the briefing, the newspaper, and the ledger as read.
- A tape preview shows the person and says to put it on the desk to play it. The transcript stays on the recorder.
- The preview uses the larger print when the case has one (`news_big`, `ledger_big`, `report_big`). The image is the whole sheet, scrolled from the top, so the masthead is what you see first. A document thumb uses the same top edge (`.th.doc`).

### Volume

One level for interview tapes, the voicemail, and Ortiz’s lines.

- A slim control in the top bar (`.voltop`).
- The same control inside the tape player (`.volrow`).
- Mute and the slider stay in sync through `[data-vol]` and `[data-volmute]`.
- Remembered on this device as `localStorage` key `jp-vol` (`{v, m}`).
- Volume does not gate progress. A missing audio file shows the line as text.

The style guide’s sliders are a specimen. They do not write `jp-vol`.

### Thread deletion

On the board:

1. Click a red thread to select it. It turns gold. The tools say “Click Remove thread, or click the thread again to cancel.”
2. Click the same thread again, or click empty cork, to cancel.
3. **Remove thread** cuts it (`cutThread()`), with a short toast: “Thread removed.”

While nothing is selected and at least one thread is up, the tip is “Click a red thread to remove it.” Connecting two pins tells the player they can remove that thread the same way. Under 900px wide, or with a coarse pointer, those lines say Tap. The gesture is the same.

### Album-cover case opener

The case opens like a record sleeve.

- `CASE.cover` is a path or a URL, for example `assets/covers/clara-hale.jpg`.
- `intro()` builds the title scene, then `paintCaseCover()` adds `album` to `#scene`, plus `.album-bg` and `.album-scrim`.
- The photo is `background-size: cover`, focused around `center 42%`, blurred 2px and scaled up slightly. A dark gradient keeps the title readable.
- The title, kicker, and lead sit in `.sc` on top of that. **Begin** is a gold button.

Do not hard-code the next case’s cover in CSS. Set `CASE.cover`.

### Closed folder, then the review order

At the end of the handoff the folder is on the desk, closed, and the toast says to open it and start with the briefing.

Opening it (`openFolder('folder')`) shows:

- A guide sentence: the order is a suggestion, not a rule.
- `.order`: the group names. The group that holds the next item is `.now`. Finished groups are `.done`.
- Tiles for whatever is still inside. The first item not yet taken out is `.up` and carries “Suggested next.”

The groups for Clara’s folder are: read this first (the briefing), interviews, photos, then places and papers. Envelope A and Envelope B have their own lists (`REVIEW.envA`, `REVIEW.envB`). Players may take items out of order. The highlight follows `nextReviewId()`.

### Next-step hints

Two surfaces, one next step, both filled from `nextStep()` for the current beat.

| Surface | Where | What it says |
| --- | --- | --- |
| `.card.next` | Side column | Kicker “Ortiz”, a short title, one sentence, a button that does the step. |
| `#whisper` | On the desk | A shorter line (`w`). Hidden during the intro and the handoff. Clicking it does the step. |
| Hint button | Top bar | Toasts the whisper line. |

Examples once the folder has landed: title “Open the case folder”, whisper “The file is closed. Open it and start with the briefing.”

Hint sentences are still written inside `nextStep()`, not stored on `CASE`. Keep the two surfaces. Write new lines for the new beats.

## Phones and tablets

The case plays on the same 1280×800 desk and cork. A wide window still fits that whole surface. A phone does not shrink it until the pins and the folder label disappear. It shows a closer slice, and the player drags to look around.

### What changes with the window

| Window | Layout |
| --- | --- |
| Wide (the fit scale is at least 0.7) | Side column, 340px. The whole desk fits. No pan control. |
| Narrow, and tall enough (under 900px wide, over 500px tall) | Bottom sheet. Collapsed, it keeps Ortiz’s next step and the button that does it. **Notes and progress** opens the day line, the objectives, and the notes. |
| Short (under 500px tall, such as a phone on its side) | The sheet is hidden so the desk can use the height. **Case** in the top bar opens it. A tap on the desk puts it away. **Hint** comes back, because the next card is not on screen. |

**Whole desk** / **Whole board** frames the entire surface. **Look closer** returns to the slice (the folder on the desk, the middle of the cork). A pinch does the same zoom. Dragging empty desk pans while the surface is bigger than the stage. A drag that starts on a pin, a thread, or a tape control does not pan. A drag on a desk prop moves that prop and does not open it; a short tap still opens it. The offset is saved on this device in `jp-save-v2` as `place` (hotspot name to `[dx, dy]` in desk pixels). It does not change the case.

The top bar drops the case title and the beat rail. Desk, Board, volume, and Prototype stay. Under 560px the words hide and the icons remain, each at least 44px. The beat rail is still in ⚙ Prototype.

### Reading and touching

- Open folder stacks its two pages under 680px. The list is the top page; the cards scroll underneath. Under 480px the cards are one column, with a taller thumb.
- Tapping a folder card opens the in-folder preview. **Put on desk** and **Pin to board** stay on the card and on the preview, each at least 44px. **Back to the folder** closes the preview without taking the item out.
- Evidence, the tape player, the newspaper, and the report go to one column. Body type stays at least 15px. The album title uses `clamp(30px, 8vw, 40px)`.
- Desk tags scale up so they stay near 13px on the close-up. Name plates on the cork do the same when the slice is below 0.8.
- Ambience tags (the mug, the lamp) show without a hover. Nothing the case needs is hover-only.
- Thread hits stay about 48px under the finger. **Remove thread** is a real button.
- An envelope still tears by a drag. **Or tap here to tear it in one go** is the finger path.
- Click-outside still needs the press to start and end on the dim desk, not on a scrollbar. The back button (“Put it back on the desk”) is the easy target, with scrim padding around the item.
- Volume is the same control: a 44px mute button and a slider in the top bar, and the row inside the tape player. `jp-vol` and `jp-save-v2` are unchanged.

The `?preview=1` scrubber is still a developer tool. On a narrow window it sits under the sheet, a little shorter. It is not part of the case.

## Preview timeline

`?preview=1` fixes a scrubber to the bottom of the journey so someone can walk every beat (intro through the filed record), including the closed folder and the opened folder with its review order. The bar is labeled **Preview only**.

It is a developer tool.

- It does not read or write the real playthrough (`localStorage` key `jp-save-v2`).
- It is absent on the normal player URL.
- The hash (`#accuse` and the rest) is still the old beat jumper. The scrubber uses the query so the two do not collide.

Do not copy the scrubber into a case file, and do not treat it as a player pattern. It stays in `journey/index.html`. The style guide mentions it and does not restyle the game around it. Colors in that bar that already matched the palette now read the same tokens. The bar’s layout is still its own.

## How to add a case file

### The shape

Today the player’s opener is only:

```js
const CASE = {
  title: 'The Vanishing of\nClara Hale',
  kick: 'Pine Hollow Case Files · Case 1',
  lead: 'A woman is missing from a small Montana town. …',
  cover: 'assets/covers/clara-hale.jpg'
};
```

Portraits, evidence, envelopes, the review order, and beats sit next to it as `IT`, `SRC`, `REVIEW`, `BEATS`, `BP`, `FACE`, and `CARDS`.

Write the next case as one object, in the shape of `CASE_CONTRACT_BLANK` in [`journey/design-system/case.contract.js`](journey/design-system/case.contract.js). Then map it onto those tables until the player can load a module directly. Fields:

| Field | What it drives |
| --- | --- |
| `title`, `kick`, `lead` | Album cover. A `\n` in `title` is a line break. |
| `cover` | `CASE.cover`. Path or URL under `assets/covers/`. |
| `portraits` | `id → assets/portraits/<id>.jpg`. Head-and-shoulders, graded as above. |
| `evidence[]` | `id`, `name`, `thumb`, optional `face`, `dest` (`desk`, `board`, or `both`), `source` (`folder`, `envA`, `envB`). Optional `board` (`x`, `y`, `w`, `label`) for the cork. Optional `sprite` if it also sits on the desk. Optional `rec` if it is a tape. |
| `envelopes` | A, B, C. `hue` is `null`, `blue`, or `green`. `items` lists evidence ids. C’s list stays empty. `unlock` is a sentence for authors, not a player string yet. |
| `review` | Per source, ordered groups `{ g, ids }`. The ids are the same set as the evidence in that source. First group is the one Ortiz wants opened first. |
| `beats` | `['id', 'Label']` pairs for the rail. Clara’s ids are `intro`, `handoff`, `build`, `envA`, `realize`, `accuse`, `file`. |

`thumb` may be an art-map key (what Clara uses today) or a path under `assets/evidence/`. Prefer a path for anything new. Do not add another base64 blob to the player.

### Asset folders

Paths are relative to `journey/`.

| Put the file here | Wire it to |
| --- | --- |
| `assets/covers/<case>.jpg` | `CASE.cover` |
| `assets/portraits/<id>.jpg` | `portraits`, and the player’s portrait map |
| `assets/evidence/…` | Evidence thumbs and the closed-folder prop |
| `assets/audio/<id>.mp3` | Interview tapes and the voicemail |
| `assets/audio/ortiz/<line>.mp3` | Ortiz’s lines, when you record them |

Clara’s portraits today: `clara`, `daniel`, `dunn`, `jesse`, `marcy`, `ortiz`, `reed`. Her cover is `assets/covers/clara-hale.jpg`. Her closed folder is `assets/evidence/folder-closed.webp`.

### What to copy

1. Copy `CASE_CONTRACT_BLANK` and fill it. Keep Clara’s object in the player until the new case is ready to replace the tables.
2. Add the cover, portraits, evidence stills, and audio under the folders above. Grade portraits and props to the photo spec. Do not restyle them as flat UI.
3. Set `CASE.title`, `CASE.kick`, `CASE.lead`, and `CASE.cover` in `journey/index.html`.
4. Map evidence into `IT` (name, thumb, face, dest, sprite, rec) and `SRC` (which ids start in the folder, Envelope A, Envelope B).
5. Map `review` into `REVIEW`. Group titles should read like a handoff (“1 · Read this first”), not like a menu.
6. Map `beats` into `BEATS`.
7. Give board items a spot in `BP`: center x, top y, width, label, on the 1280×800 cork.
8. Write `nextStep()` lines for the new beats. Keep the side card, the whisper, and the Hint button.
9. Keep click-outside dismiss, the shared volume control, and click-a-thread-to-remove.
10. Open the style guide and check the new cover against the album specimen, and the new folder against the closed-folder specimen, before calling the case done.

### What to leave alone

- The `?preview=1` scrubber. It is not part of the case.
- `localStorage` keys `jp-save-v2` (the playthrough) and `jp-vol` (volume). A new case that ships inside this same page still uses them. Do not invent a second save from the style guide.
- Desk hotspot coordinates (`HOT`) and the embedded desk and cork photographs, until you are deliberately reskinning a desk.
- Image files another branch is grading.

## What is covered, and what is still one-off

**In this system**

- Tokens for ink, paper, pine, copper, gold, alarm, yarn, envelopes, manila, notes, both desks, type, space, radius, and elevation.
- The photo spec (desaturated real-photo characters, ragged props) and a stand-in CSS grade that the player does not apply.
- Specimens and live markup for the character card, evidence card, closed folder, open folder with review order, envelope, pin and thread, next-step hint, dismiss scrim, album-cover opener, desk ambience, and volume.
- The case-file shape, asset folders, and the copy steps above.
- The player’s existing color variables (`--bg`, `--ink`, `--accent`, `--btn`, `--side`, `--card`, `--dim`, `--bar`, and the repeated palette hexes in its stylesheet) read these tokens, with the previous hex as the fallback.

**Still one-off in `journey/index.html`**

- The component rules themselves. `patterns.css` mirrors them for the guide. It is not a stylesheet the game loads, because loading it would define a second copy of `.fold`, `.pin`, and the rest.
- Tape-player chrome (the phone and the cassette), the accusation report, the reveal, the filing drawer, the stamp, and the rank card.
- Hint sentences inside `nextStep()`, hotspot maps, and pin coordinates.
- Embedded font files and the embedded desk and cork photos.
- The preview scrubber’s layout. Mentioned here so it stays a developer tool.

A later pass can move the shared rules from the player into `patterns.css` once a second case is actually loading them. This pass keeps the running game on the CSS it already has, pointed at the tokens.
