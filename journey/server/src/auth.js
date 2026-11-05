import { getPool, withTx } from './db.js';
import { EMAIL_UNAVAILABLE, sendMagicLink } from './email.js';
import {
  HttpError,
  clearCookie,
  clientIp,
  cookieHeader,
  escapeHtml,
  hashSecret,
  normalizeEmail,
  randomToken,
  readCookie,
  timingEqual,
  wantsJson,
} from './http.js';

const SESSION_COOKIE = 'cd_session';
const DEVICE_COOKIE = 'cd_device';

function displayNameFromEmail(email) {
  const local = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
  if (!local) return 'Detective';
  return local.slice(0, 80);
}

export async function loadUser(req, config) {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token) return null;
  const tokenHash = hashSecret(token, config.sessionSecret);
  const found = await getPool().query(
    `SELECT u.id, u.email, u.display_name, u.created_at, u.last_seen_at
     FROM auth_sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [tokenHash],
  );
  const user = found.rows[0];
  if (!user) return null;
  await getPool().query(
    `UPDATE auth_sessions SET last_seen_at = now()
     WHERE token_hash = $1 AND last_seen_at < now() - interval '60 seconds'`,
    [tokenHash],
  );
  await getPool().query(
    `UPDATE users SET last_seen_at = now()
     WHERE id = $1 AND (last_seen_at IS NULL OR last_seen_at < now() - interval '60 seconds')`,
    [user.id],
  );
  return user;
}

export function requireUser(config) {
  return async (req, res, next) => {
    try {
      const user = await loadUser(req, config);
      if (!user) return res.status(401).json({ error: 'Sign in required.' });
      req.user = user;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requireAdmin(config) {
  const inner = requireUser(config);
  return (req, res, next) => {
    inner(req, res, (err) => {
      if (err) return next(err);
      if (!req.user) return;
      if (!config.adminEmails.includes(req.user.email)) {
        return res.status(403).json({ error: 'This desk is for operators only.' });
      }
      next();
    });
  };
}

function setDeviceCookie(res, config, secret) {
  res.append('Set-Cookie', cookieHeader(DEVICE_COOKIE, secret, {
    production: config.production,
    maxAge: 30 * 60,
  }));
}

function setSessionCookie(res, config, secret) {
  res.append('Set-Cookie', cookieHeader(SESSION_COOKIE, secret, {
    production: config.production,
    maxAge: Math.floor(config.sessionTtlMs / 1000),
  }));
}

export async function requestMagicLink(req, res, config, limitBy) {
  const email = normalizeEmail(req.body?.email);
  if (!email) throw new HttpError(400, 'Enter the email address you want to use.');

  limitBy(`ip:${clientIp(req)}`);
  limitBy(`email:${email}`);

  if (config.production && !config.resendApiKey) {
    throw new HttpError(503, EMAIL_UNAVAILABLE);
  }

  let device = readCookie(req, DEVICE_COOKIE);
  if (!device || device.length < 20) device = randomToken();
  setDeviceCookie(res, config, device);

  const token = randomToken();
  const expiresAt = new Date(Date.now() + config.magicLinkTtlMs);
  await getPool().query(
    `INSERT INTO magic_link_tokens (email, token_hash, device_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [
      email,
      hashSecret(token, config.sessionSecret),
      hashSecret(device, config.sessionSecret),
      expiresAt,
    ],
  );

  const url = `${config.publicBaseUrl}/api/auth/verify?token=${encodeURIComponent(token)}`;
  const sent = await sendMagicLink({ to: email, url, config, fetchImpl: config.fetchImpl });
  const body = { ok: true };
  if (sent.devLink) body.devLink = sent.devLink;
  res.json(body);
}

function verifyFailure(req, res, message) {
  if (wantsJson(req)) return res.status(400).json({ error: message });
  const safe = escapeHtml(message);
  res.status(400).type('html').send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sign-in link · The Case Desk</title></head>
<body style="margin:0;background:#ECE7DF;color:#1D1B18;font-family:Georgia,serif">
<main style="max-width:440px;margin:12vh auto;padding:24px">
<p style="letter-spacing:.14em;text-transform:uppercase;font-size:12px;color:#1F5E4E">The Case Desk</p>
<h1 style="font-size:32px;margin:8px 0">That link did not work</h1>
<p style="font-size:18px;line-height:1.45">${safe}</p>
<p><a href="/library" style="color:#1F5E4E;font-weight:700">Ask for a new one</a></p>
</main></body></html>`);
}

export async function verifyMagicLink(req, res, config) {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  const device = readCookie(req, DEVICE_COOKIE);
  if (!token || token.length < 20 || token.length > 200) {
    return verifyFailure(req, res, 'This sign-in link is not valid. Ask for a new one.');
  }
  if (!device) {
    return verifyFailure(req, res, 'Open the sign-in link in the same browser where you entered your email.');
  }

  const tokenHash = hashSecret(token, config.sessionSecret);
  const deviceHash = hashSecret(device, config.sessionSecret);

  let user;
  let sessionToken;
  try {
    sessionToken = await withTx(async (client) => {
      const found = await client.query(
        `SELECT id, email, device_hash, expires_at, used_at
         FROM magic_link_tokens WHERE token_hash = $1 FOR UPDATE`,
        [tokenHash],
      );
      const row = found.rows[0];
      if (!row || row.used_at) {
        throw new HttpError(400, 'This sign-in link was already used or is not valid. Ask for a new one.');
      }
      if (new Date(row.expires_at).getTime() <= Date.now()) {
        throw new HttpError(400, 'This sign-in link has expired. Ask for a new one.');
      }
      if (!timingEqual(row.device_hash, deviceHash)) {
        throw new HttpError(400, 'Open the sign-in link in the same browser where you entered your email.');
      }
      const used = await client.query(
        `UPDATE magic_link_tokens SET used_at = now() WHERE id = $1 AND used_at IS NULL RETURNING id`,
        [row.id],
      );
      if (!used.rowCount) throw new HttpError(400, 'This sign-in link was already used. Ask for a new one.');

      const saved = await client.query(
        `INSERT INTO users (email, display_name, last_seen_at)
         VALUES ($1, $2, now())
         ON CONFLICT (email) DO UPDATE SET last_seen_at = now()
         RETURNING id, email, display_name`,
        [row.email, displayNameFromEmail(row.email)],
      );
      user = saved.rows[0];
      const secret = randomToken();
      await client.query(
        `INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
        [user.id, hashSecret(secret, config.sessionSecret), new Date(Date.now() + config.sessionTtlMs)],
      );
      return secret;
    });
  } catch (err) {
    if (err instanceof HttpError) return verifyFailure(req, res, err.message);
    throw err;
  }

  setSessionCookie(res, config, sessionToken);
  if (wantsJson(req)) return res.json({ ok: true, redirect: '/library' });
  res.redirect(303, '/library');
}

export async function logout(req, res, config) {
  const token = readCookie(req, SESSION_COOKIE);
  if (token) {
    await getPool().query('DELETE FROM auth_sessions WHERE token_hash = $1', [hashSecret(token, config.sessionSecret)]);
  }
  res.append('Set-Cookie', clearCookie(SESSION_COOKIE, config));
  res.json({ ok: true });
}

export async function me(req, config) {
  const user = req.user;
  const entitlements = await getPool().query(
    `SELECT c.slug, c.title, e.source, e.unlocked_at, e.external_order_id
     FROM entitlements e
     JOIN cases c ON c.id = e.case_id
     WHERE e.user_id = $1
     ORDER BY e.unlocked_at DESC`,
    [user.id],
  );
  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
    },
    entitlements: entitlements.rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      source: row.source,
      unlockedAt: row.unlocked_at,
      externalOrderId: row.external_order_id,
    })),
    admin: config.adminEmails.includes(user.email),
  };
}

export async function updateMe(req) {
  const raw = req.body?.displayName;
  if (typeof raw !== 'string') throw new HttpError(400, 'Enter a name to show on your desk.');
  const displayName = raw.replace(/[\u0000-\u001f]/g, '').trim();
  if (!displayName || displayName.length > 80) {
    throw new HttpError(400, 'Use a name up to 80 characters.');
  }
  const saved = await getPool().query(
    `UPDATE users SET display_name = $1 WHERE id = $2 RETURNING id, email, display_name`,
    [displayName, req.user.id],
  );
  req.user.display_name = saved.rows[0].display_name;
  return { user: { id: saved.rows[0].id, email: saved.rows[0].email, displayName: saved.rows[0].display_name } };
}
