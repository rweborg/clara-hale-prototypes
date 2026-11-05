# Deploying The Case Desk to nextsteps.fun

Railway runs `journey/` as one Node container. It serves the same static game
and a JSON API (accounts, redeem codes, saved playthroughs) backed by Postgres.
The domain is registered at GoDaddy; GoDaddy's DNS cannot point an apex/root
domain at Railway, so there is one decision to make (Step 4) before touching
records. Do not change mail DNS in the same visit until the paused window
described in the repo README.

---

## 1. Push the code

Nothing is committed yet. From the repo root:

```bash
git add -A
git commit -m "Split engine from case, add authoring pipeline, rename to The Case Desk"
git push origin main
```

`.gitignore` already excludes `journey/_build/out/`, which is 25 MB of smoke-test
screenshots.

## 2. Point Railway at the right directory

The Dockerfile and `railway.toml` live in `journey/`, not the repo root.

1. Railway → **New Project → Deploy from GitHub repo** → pick the repo.
2. Open the service → **Settings → Source**.
3. Set **Root Directory** to `journey`.
4. Confirm **Builder** is `Dockerfile` (Railway reads `journey/railway.toml`).

If the root directory is left at `/`, the build fails because there is no
Dockerfile at the repo root.

## 3. Prove the deploy before touching DNS

1. **Settings → Networking → Public Networking → Generate Domain**.
2. Open the `*.up.railway.app` URL.

Checklist:

- [ ] The desk loads, the intro card shows **The Case Desk** in the header line.
- [ ] `?preview=1` shows the scrubber.
- [ ] `?case=clara-hale` still loads the same case.
- [ ] DevTools console is clean; no 404s on `/app/`, `/cases/`, or `/assets/`.
- [ ] Progress saves and survives a reload.

The container listens on `$PORT`, which Railway injects. The image command is
`node server/src/index.js` (do not set a custom start command). Migrations run
before it listens. Health check is `GET /health`. Art, engine, and case-pack
cache headers match the old nginx policy (`nginx.conf` is kept as that reference).

### Postgres and variables

In the same Railway project: **New → Database → Postgres**. On the game service,
add a variable reference so `DATABASE_URL` is the plugin’s connection string.

Set these on the game service:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `PUBLIC_BASE_URL` | `https://www.nextsteps.fun` |
| `SESSION_SECRET` | a long random string (see `journey/server/.env.example`) |
| `EMAIL_FROM` | `The Case Desk <no-reply@nextsteps.fun>` |
| `ADMIN_EMAILS` | operator emails, comma-separated |
| `RESEND_API_KEY` | leave empty until Resend DNS is verified |
| `MOCK_COMMERCE` | leave unset (off in production) |
| `ETSY_LISTING_URL` | leave empty — there is no Etsy listing yet |

`RESEND_API_KEY` empty means sign-in email is off. The game still plays without
an account, and the server does not print magic links in production. When the
domain is verified at Resend, set the key. Sending is Resend’s HTTPS API, not
SMTP (Railway blocks SMTP on Hobby).

Redeploy and confirm `GET /health` returns `"db": true`. Anonymous reload of
the desk should behave as before. Turn on backups under the Postgres plugin.
A restore drill on a copy is still to do once. Full local steps are in the
repo README under Platform.

---

## 4. Choose how the apex resolves

Railway hands you a **CNAME** and a **TXT** record. Both are mandatory: with only
the CNAME, every request returns 404 because Railway uses the TXT to verify you
own the domain. Railway supports CNAME flattening and dynamic ALIAS records at
the root — and GoDaddy supports **neither** ([Railway docs][rw-domains] list
GoDaddy explicitly). So:

| | Path A — Cloudflare for DNS (recommended) | Path B — stay on GoDaddy |
|---|---|---|
| Canonical URL | `https://nextsteps.fun` | `https://www.nextsteps.fun` |
| Apex | CNAME flattening at Cloudflare | GoDaddy forwarding → `www` |
| Nameservers | changed to Cloudflare | untouched |
| Moving parts | one extra free account | one extra redirect hop |
| Cost | free | free |

Pick **A** for a product domain you will keep. Pick **B** if you do not want to
touch nameservers today; it works, but the canonical address keeps the `www`.

---

## 5. Add the custom domain in Railway

**Settings → Networking → Public Networking → + Custom Domain.**

- Path A: enter `nextsteps.fun`, and add `www.nextsteps.fun` as a second custom
  domain (Hobby plan allows 2).
- Path B: enter `www.nextsteps.fun` only.

Railway now shows the two values you need. Copy them exactly — do not retype the
TXT:

| Type | Name | Value |
|---|---|---|
| CNAME | `@` (Path A) or `www` (Path B) | `<target>.up.railway.app` |
| TXT | `<verification name shown>` | `<verification value shown>` |

---

## 6a. DNS for Path A (Cloudflare)

1. Cloudflare → **Add a site** → `nextsteps.fun` → Free plan.
2. Cloudflare gives you two nameservers, e.g. `ada.ns.cloudflare.com`.
3. GoDaddy → **My Products → Domains → nextsteps.fun → DNS** →
   **Nameservers → Change → I'll use my own nameservers** → enter both.
4. Wait for Cloudflare to report the zone as **Active** (minutes to a few hours).
   **Before this, copy any existing MX or TXT records into Cloudflare** or email
   on the domain stops working. A brand-new domain usually has none.
5. In Cloudflare → **DNS → Records**, add:

   | Type | Name | Content | Proxy |
   |---|---|---|---|
   | CNAME | `@` | `<target>.up.railway.app` | **DNS only** (grey cloud) |
   | TXT | `<verification name>` | `<verification value>` | — |
   | CNAME | `www` | `nextsteps.fun` | DNS only |

   Keep the proxy **off** to start. Railway issues its own Let's Encrypt
   certificate directly; if you turn the orange cloud on later, Cloudflare's
   SSL mode must be **Full**, not Full (strict), or you get redirect loops.

6. Delete GoDaddy's parked records if any survive the nameserver change.

## 6b. DNS for Path B (GoDaddy)

GoDaddy → **My Products → Domains → nextsteps.fun → DNS → Manage Zones**.

1. Delete the parked **A** record on `@` and the parked **CNAME** on `www` if they
   are there. GoDaddy adds these for its own parking page.
2. Add:

   | Type | Name | Value | TTL |
   |---|---|---|---|
   | CNAME | `www` | `<target>.up.railway.app` | 600 |
   | TXT | `<verification name>` | `<verification value>` | 600 |

3. Then **Domain Settings → Forwarding → Add Forwarding**:
   - Forward `nextsteps.fun` → `https://www.nextsteps.fun`
   - **Permanent (301)**, forward only.

## 7. Verify

DNS is usually live in minutes and can take up to 72 hours.

```bash
# nameservers (Path A should show Cloudflare's)
dig +short NS nextsteps.fun

# the verify record is present and correct
dig +short TXT nextsteps.fun

# the host resolves
dig +short nextsteps.fun

# the site answers over HTTPS with a valid certificate
curl -sI https://nextsteps.fun | head -5

# gzip is actually on for the engine
curl -sI -H 'Accept-Encoding: gzip' https://www.nextsteps.fun/app/player.js | grep -i content-encoding

# the platform is up (after Postgres is attached)
curl -s https://www.nextsteps.fun/health

# the case pack is served from the right path
curl -s -o /dev/null -w '%{http_code}\n' https://nextsteps.fun/cases/clara-hale/case.js
```

Railway shows a green check next to the domain once verified, and issues the
certificate within about an hour of DNS being correct.

Flush a stale local cache with `sudo dscacheutil -flushcache` on macOS.

## Troubleshooting

| Symptom | Cause |
|---|---|
| Domain verifies but every request 404s | The **TXT** record is missing or has a typo. It is not optional. |
| Domain never turns green | Records at the wrong name, or still GoDaddy's parked A record on `@`. |
| `ERR_TOO_MANY_REDIRECTS` | Cloudflare proxy on with SSL mode Full (strict), or a Page Rule forcing HTTPS. Set **Full**, or use DNS only. |
| Certificate not issued | Proxy enabled before Railway could validate, or CAA records blocking Let's Encrypt. |
| Apex works, `www` does not | You added only one custom domain. Both are separate domains to Railway. |
| Build fails, "Dockerfile not found" | **Root Directory** is not set to `journey`. |
| Deploy healthy but the desk is broken | Check `/app/player.js` and `/cases/clara-hale/case.js` return 200. A missing asset is a 404, not the HTML shell. |
| `/health` is 503 | `DATABASE_URL` is missing or Postgres is still starting. The game process exits if migrations cannot run. |
| Sign-in says email is not on | `RESEND_API_KEY` is empty, on purpose, until DNS. Anonymous play still works. |

## Rollback

A failed deploy does not replace the running one: Railway only promotes a
deployment that passes the health check. To undo the server config alone:

```bash
git revert --no-edit HEAD
git push
```

## Known state (4 Nov 2026)

| Host | Behaviour |
| --- | --- |
| `https://www.nextsteps.fun` | 200, serves the app, Let's Encrypt cert valid to Feb 2027 |
| `https://nextsteps.fun` (apex) | 301 → `http://journey-production-fddc.up.railway.app/` |

The apex is attached to the Railway service but sits at "Waiting for DNS
update" because Railway wants `CNAME @ → qyz9zwf6.up.railway.app`, and GoDaddy
cannot CNAME an apex. The apex is instead answered by GoDaddy's own forwarding,
pointed at the Railway hostname rather than at `www`.

**Pending fix.** GoDaddy → Domain Settings → Forwarding → edit the
`nextsteps.fun` row → destination `https://www.nextsteps.fun`, type Permanent
(301), masking off. Then delete the `nextsteps.fun` custom domain in Railway
(it can never verify; it also occupies one of the two domain slots on the
current plan).

Blocked on 4 Nov by a GoDaddy throttle: more than five one-time passwords for
this action in seven days, so editing that forward is locked for a week. Either
wait it out or ask GoDaddy support to clear the throttle.

The alternative — making the apex the canonical host — needs the nameservers
moved to Cloudflare so the apex CNAME can be flattened (Path A above). That
also needs an OTP, so it is blocked by the same window.

Until then `www.nextsteps.fun` is the URL to share. `index.html` carries
`<link rel="canonical" href="https://www.nextsteps.fun/">` so crawlers and link
previews treat that as the address even when a page is served from the Railway
hostname.

## After launch

- Add the `nextsteps.fun` URL to the GitHub repo's About panel.
- Railway's service URL (`*.up.railway.app`) keeps working; leave it as a
  fallback and keep it out of public links.
- On the Hobby plan you get 2 custom domains per service. Apex + `www` fills
  both, so a staging domain needs a second service.

[rw-domains]: https://docs.railway.com/networking/domains/working-with-domains
