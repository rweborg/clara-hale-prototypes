# Journey design system

Tokens, pattern specimens, and the case-file contract for the Clara Hale journey.

Open `index.html` in this folder for the style guide (serve the repo or the `journey/` folder so the portrait paths resolve). The reuse write-up is [`../../DESIGN_SYSTEM.md`](../../DESIGN_SYSTEM.md).

| File | What it is |
| --- | --- |
| `tokens.css` | Color, type, space, elevation, materials, photo spec. The player links this. |
| `patterns.css` | `ds-` specimens. The game does not link this file. |
| `index.html` | Style guide. Names each pattern and shows the live markup. |
| `case.contract.js` | `CASE` shape to copy for a second case. The player does not load it. |
| `fonts.css` | The same faces the player embeds, for the style guide only. |

The player keeps its component CSS in `journey/index.html`. Its color variables read the tokens and fall back to the same hexes if this folder is missing. Portrait and prop files in `assets/` are not part of this pass.
