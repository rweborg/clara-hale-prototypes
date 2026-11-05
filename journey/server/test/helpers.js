import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { closePool, getPool } from '../src/db.js';
import { migrate } from '../src/migrate.js';

export function assertTestDatabase() {
  const url = process.env.DATABASE_URL || '';
  if (!url.includes('casedesk_test')) {
    throw new Error('Refusing to reset a database that is not casedesk_test');
  }
}

export async function resetDb() {
  assertTestDatabase();
  await getPool().query(`
    TRUNCATE TABLE
      desk_events,
      progress_checkpoints,
      session_participants,
      case_sessions,
      ratings,
      entitlements,
      redeem_codes,
      purchases,
      magic_link_tokens,
      auth_sessions,
      users,
      cases
    RESTART IDENTITY CASCADE
  `);
  await getPool().query(`
    INSERT INTO cases (
      slug, title, blurb, difficulty, genres, status, access,
      cover_url, content_version, price_cents, etsy_sku
    ) VALUES (
      'clara-hale',
      'The Vanishing of Clara Hale',
      'A woman is missing from a small Montana town.',
      'standard',
      ARRAY['mystery', 'investigation'],
      'live',
      'free',
      'assets/covers/clara-hale.jpg',
      '1.4.0',
      0,
      'MOCK-CLARA-HALE'
    )
  `);
}

export function jar() {
  const cookies = new Map();
  return {
    store(res) {
      const list = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
      for (const line of list) {
        const [pair] = line.split(';');
        const i = pair.indexOf('=');
        if (i < 0) continue;
        const name = pair.slice(0, i).trim();
        const value = decodeURIComponent(pair.slice(i + 1).trim());
        const drop = /max-age=0/i.test(line) || value === '';
        if (drop) cookies.delete(name);
        else cookies.set(name, value);
      }
    },
    header() {
      return [...cookies].map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('; ');
    },
    get(name) { return cookies.get(name) || ''; },
  };
}

export async function call(base, cookies, method, path, body, headers = {}) {
  const res = await fetch(base + path, {
    method,
    redirect: 'manual',
    headers: {
      accept: 'application/json',
      cookie: cookies ? cookies.header() : '',
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (cookies) cookies.store(res);
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  return { status: res.status, json, text, headers: res.headers };
}

export async function signIn(base, cookies, email) {
  const requested = await call(base, cookies, 'POST', '/api/auth/request', { email });
  assert.equal(requested.status, 200, JSON.stringify(requested.json));
  assert.ok(requested.json.devLink);
  const token = new URL(requested.json.devLink).searchParams.get('token');
  const verified = await call(base, cookies, 'GET', '/api/auth/verify?token=' + encodeURIComponent(token));
  assert.equal(verified.status, 200, verified.text);
  assert.equal(verified.json.ok, true);
  return verified.json;
}

export async function start(overrides = {}) {
  assertTestDatabase();
  await migrate();
  const config = loadConfig({
    authRateLimit: 500,
    redeemRateLimit: 500,
    mockRateLimit: 500,
    ...overrides,
  });
  const app = createApp(config);
  const server = await new Promise((resolve) => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  return { server, base, config };
}

export async function stop(started) {
  if (started?.server) {
    await new Promise((resolve, reject) => started.server.close((err) => err ? reject(err) : resolve()));
  }
  await closePool();
}
