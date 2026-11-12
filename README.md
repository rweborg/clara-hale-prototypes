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
- Dev tools (jump to a beat, demo answers) show on a local host, in preview, and
  for a signed-in admin on the live site. `?dev=0` shows exactly what players see.
- Progress saves on the device and resumes. `⚙ Settings → ↺ Start the case over`
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

`check.js` is the gate: the design-system lint and the contract (no browser, fast), the experience suite in
headless Chromium (21 checks), then a full playthrough of the case from the intro
to the filed record — including a wrong objective answer, three rejected reports,
and a reload. `validate.js` checks the case pack and every file it points at. It
needs no npm install; it finds Chromium from `CHROME_BIN`, the Playwright cache,
or `/Applications`.

See [`journey/_build/README.md`](journey/_build/README.md) for the full contract
and for the list of prose the engine still owns.

## Deploy

`journey/` is one container on Railway, via
[`journey/Dockerfile`](journey/Dockerfile) and
[`journey/railway.toml`](journey/railway.toml). It serves the same static game
(the desk, the case pack, the art) and a small JSON API for accounts, redeem
codes, and saved playthroughs. Root directory on Railway stays `journey`.
Anonymous play still uses this device only. See **Platform** below for env vars
and the Postgres steps, and [`DEPLOY.md`](DEPLOY.md) for the domain.

## Platform (Phase 1)

The Case Desk API lives in [`journey/server`](journey/server). Clara Hale stays
free to play. Signing in saves that playthrough to Postgres. A purchase, when
the Etsy shop exists, is a one-time code the player types in. This build does
not call Etsy. Practice codes are labeled mock.

### Run it locally

Postgres 16. Either Docker:

```bash
docker compose -f journey/server/docker-compose.yml up -d
```

or any local Postgres with two databases, `casedesk` and `casedesk_test`, owned
by a user that can create extensions. The test suite refuses to touch a
database whose name does not contain `casedesk_test`.

```bash
cd journey/server
cp .env.example .env
npm install
npm test
npm start
```

Open <http://127.0.0.1:8080/> for the case, <http://127.0.0.1:8080/library> for
the desk, and <http://127.0.0.1:8080/admin> for the operator page. With
`RESEND_API_KEY` empty and `NODE_ENV` not `production`, the sign-in link is
shown on screen and written to the server log. Copy it in the same browser.

Mint practice codes (printed once, stored only as a hash):

```bash
cd journey/server
npm run mint -- --slug clara-hale --sku MOCK-CLARA-HALE --count 5
```

`python3 -m http.server` still opens the game with no API. Progress stays in
`localStorage`. The sign-in button appears only when this Node server is the
one serving the page.

### Env vars

| Variable | Required | What it does |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string. Railway injects this from the Postgres plugin. |
| `SESSION_SECRET` | yes in production | Long random string. Peppers token hashes and is required before the process will boot in production. |
| `NODE_ENV` | yes | `production` on Railway. Turns on Secure cookies and HSTS, and hides magic links. |
| `PUBLIC_BASE_URL` | yes | Origin baked into the email link, e.g. `https://www.nextsteps.fun`. No trailing slash. |
| `PORT` | set by Railway | Listen port. Local default `8080`. |
| `RESEND_API_KEY` | when email DNS is ready | Resend HTTPS API key. Not SMTP. If it is empty in production, sign-in email is off and the link is never shown. |
| `EMAIL_FROM` | no | Defaults to `The Case Desk <no-reply@nextsteps.fun>`. |
| `EMAIL_REPLY_TO` | no | Optional human inbox, e.g. `hello@nextsteps.fun`. |
| `ADMIN_EMAILS` | for `/admin` | Comma-separated. Same sign-in as players. Anyone else gets a refusal. |
| `MOCK_COMMERCE` | no | `1` shows “Get a practice code”. `0` hides it. Defaults on outside production, off in production. |
| `ETSY_LISTING_URL` | later | Real Etsy listing. Empty until the shop exists. No Etsy API is called either way. |

### Railway, after merge

The service already deploys `journey/` with the Dockerfile. This replaces the
nginx image with Node. Do not set a custom start command; the image runs
`node server/src/index.js`. Migrations run on boot. Health check is `GET /health`
(from `railway.toml`).

1. In the same Railway project, **New → Database → Postgres**.
2. On the game service, **Variables → Add reference** and set `DATABASE_URL` to
   the Postgres plugin’s `DATABASE_URL` (`${{Postgres.DATABASE_URL}}`, using the
   plugin’s real name).
3. Set `NODE_ENV=production`, `PUBLIC_BASE_URL=https://www.nextsteps.fun`,
   `EMAIL_FROM=The Case Desk <no-reply@nextsteps.fun>`, and a new
   `SESSION_SECRET` (see the one-liner in `.env.example`).
4. Set `ADMIN_EMAILS` to the operator addresses. Leave `RESEND_API_KEY` empty
   until Resend DNS is verified (next week, with the other DNS). Until then
   players keep playing; the sign-in button says email is not on yet.
5. Leave `MOCK_COMMERCE` unset (off in production) unless you want the public
   practice-code button. Leave `ETSY_LISTING_URL` empty.
6. Redeploy. `GET /health` should be `{ "ok": true, "db": true }`. The desk at
   `/` should load as before for someone who is not signed in.
7. Turn on Railway Postgres backups (the plugin’s Backups tab). A restore drill
   is still to do once, on a copy — not from this repo.

Mint codes against production from a laptop that has the production
`DATABASE_URL` in the environment (not committed):

```bash
cd journey/server
DATABASE_URL='postgres://…' node scripts/mint-codes.js --slug clara-hale --count 5
```

Company mail, not done here: one GoDaddy Microsoft 365 mailbox for `hello@`
(with a `support@` alias) and Resend for `no-reply@`. Add Resend’s SPF and
DKIM, and a DMARC `p=none`, in the same DNS visit as the other paused records.
Do not change GoDaddy DNS until that window. Railway blocks outbound SMTP on
Hobby, which is why mail is Resend’s HTTP API only.

## Status

The engine is case-neutral: it contains no case names, no case ids, and no case
prose. Everything a player reads comes from `journey/cases/<id>/case.js`, and
`validate.js` fails the build if that stops being true.

`node _build/check.js` runs the whole gate: the contract, 22 browser checks, and
a 21-step playthrough from the intro to the filed record. A freshly scaffolded
case passes all of it.

Still to do: design polish on the copy and pacing, and then new cases.
