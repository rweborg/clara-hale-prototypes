import './env.js';
import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { cookieHeader } from '../src/http.js';
import { getPool } from '../src/db.js';
import { loadConfig } from '../src/config.js';
import { call, jar, resetDb, signIn, start, stop } from './helpers.js';

describe('auth', { concurrency: 1 }, () => {
  let started;
  before(async () => { started = await start(); });
  beforeEach(async () => { await resetDb(); });
  after(async () => { await stop(started); });

  it('rejects a bad email', async () => {
    const res = await call(started.base, jar(), 'POST', '/api/auth/request', { email: 'not-an-email' });
    assert.equal(res.status, 400);
  });

  it('signs in with a single-use link bound to this browser', async () => {
    const cookies = jar();
    const requested = await call(started.base, cookies, 'POST', '/api/auth/request', { email: 'Ada@Example.com' });
    assert.equal(requested.status, 200);
    assert.match(requested.json.devLink, /^http:\/\/127\.0\.0\.1:9\/api\/auth\/verify\?token=/);
    assert.ok(cookies.get('cd_device'));
    const setCookie = requested.headers.getSetCookie().join('\n');
    assert.match(setCookie, /HttpOnly/);
    assert.match(setCookie, /SameSite=Lax/);
    assert.doesNotMatch(setCookie, /Secure/);

    const token = new URL(requested.json.devLink).searchParams.get('token');
    const verified = await call(started.base, cookies, 'GET', '/api/auth/verify?token=' + encodeURIComponent(token));
    assert.equal(verified.status, 200);
    assert.match(verified.headers.getSetCookie().join('\n'), /cd_session=/);
    const sessionCookie = verified.headers.getSetCookie().find((line) => line.startsWith('cd_session='));
    assert.match(sessionCookie, /HttpOnly/);
    assert.match(sessionCookie, /SameSite=Lax/);

    const me = await call(started.base, cookies, 'GET', '/api/me');
    assert.equal(me.status, 200);
    assert.equal(me.json.user.email, 'ada@example.com');
    assert.equal(me.json.admin, false);

    const again = await call(started.base, cookies, 'GET', '/api/auth/verify?token=' + encodeURIComponent(token));
    assert.equal(again.status, 400);

    const out = await call(started.base, cookies, 'POST', '/api/auth/logout');
    assert.equal(out.status, 200);
    const afterOut = await call(started.base, cookies, 'GET', '/api/me');
    assert.equal(afterOut.status, 200);
    assert.equal(afterOut.json.user, null);
  });

  it('refuses the link in a different browser', async () => {
    const cookies = jar();
    const requested = await call(started.base, cookies, 'POST', '/api/auth/request', { email: 'ada@example.com' });
    const token = new URL(requested.json.devLink).searchParams.get('token');
    const other = jar();
    const verified = await call(started.base, other, 'GET', '/api/auth/verify?token=' + encodeURIComponent(token));
    assert.equal(verified.status, 400);
    assert.match(verified.json.error, /same browser/i);
  });

  it('refuses an expired link', async () => {
    const cookies = jar();
    const requested = await call(started.base, cookies, 'POST', '/api/auth/request', { email: 'ada@example.com' });
    await getPool().query(`UPDATE magic_link_tokens SET expires_at = now() - interval '1 minute'`);
    const token = new URL(requested.json.devLink).searchParams.get('token');
    const verified = await call(started.base, cookies, 'GET', '/api/auth/verify?token=' + encodeURIComponent(token));
    assert.equal(verified.status, 400);
    assert.match(verified.json.error, /expired/i);
  });

  it('rate limits sign-in requests', async () => {
    const limited = await start({ authRateLimit: 2, rateWindowMs: 60_000 });
    try {
      const cookies = jar();
      assert.equal((await call(limited.base, cookies, 'POST', '/api/auth/request', { email: 'ada@example.com' })).status, 200);
      assert.equal((await call(limited.base, cookies, 'POST', '/api/auth/request', { email: 'ada@example.com' })).status, 200);
      const blocked = await call(limited.base, cookies, 'POST', '/api/auth/request', { email: 'ada@example.com' });
      assert.equal(blocked.status, 429);
      assert.ok(blocked.headers.get('retry-after'));
    } finally {
      await new Promise((resolve) => limited.server.close(resolve));
    }
  });

  it('does not reveal a link in production when email is not configured', async () => {
    const prod = await start({ nodeEnv: 'production', sessionSecret: 'prod-secret-value', resendApiKey: '' });
    try {
      const before = await getPool().query('SELECT count(*)::int AS n FROM magic_link_tokens');
      const res = await call(prod.base, jar(), 'POST', '/api/auth/request', { email: 'ada@example.com' });
      assert.equal(res.status, 503);
      assert.equal(res.json.devLink, undefined);
      assert.doesNotMatch(JSON.stringify(res.json), /token=/);
      assert.match(res.headers.get('strict-transport-security'), /max-age=/);
      const after = await getPool().query('SELECT count(*)::int AS n FROM magic_link_tokens');
      assert.equal(after.rows[0].n, before.rows[0].n);
    } finally {
      await new Promise((resolve) => prod.server.close(resolve));
    }
  });

  it('sends through Resend without logging the link', async () => {
    let captured;
    const config = loadConfig({ resendApiKey: 're_test_key' });
    config.fetchImpl = async (url, init) => {
      captured = { url, init };
      return { ok: true, status: 200 };
    };
    const appServer = await start();
    // The shared app from before() has no key. Hit a dedicated app.
    await new Promise((resolve) => appServer.server.close(resolve));
    const { createApp } = await import('../src/app.js');
    const app = createApp(config);
    const server = await new Promise((resolve) => {
      const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
    });
    const logs = [];
    const orig = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    try {
      const cookies = jar();
      const res = await call(`http://127.0.0.1:${server.address().port}`, cookies, 'POST', '/api/auth/request', { email: 'ada@example.com' });
      assert.equal(res.status, 200);
      assert.equal(res.json.devLink, undefined);
      assert.equal(captured.url, 'https://api.resend.com/emails');
      assert.match(captured.init.headers.Authorization, /^Bearer re_test_key$/);
      const payload = JSON.parse(captured.init.body);
      assert.equal(payload.to[0], 'ada@example.com');
      assert.match(payload.from, /no-reply@nextsteps\.fun/);
      assert.equal(logs.some((line) => line.includes('token=')), false);
      assert.equal(logs.some((line) => line.includes('magic link sent')), true);
    } finally {
      console.log = orig;
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('keeps the operator page behind the allowlist', async () => {
    const player = jar();
    await signIn(started.base, player, 'player@example.com');
    const denied = await call(started.base, player, 'GET', '/api/admin/summary');
    assert.equal(denied.status, 403);
    const owner = jar();
    await signIn(started.base, owner, 'owner@nextsteps.fun');
    const allowed = await call(started.base, owner, 'GET', '/api/admin/summary');
    assert.equal(allowed.status, 200);
    assert.equal(typeof allowed.json.users, 'number');
  });

  it('sets the Secure flag on production cookies', () => {
    const header = cookieHeader('cd_session', 'abc', { production: true, maxAge: 60 });
    assert.match(header, /HttpOnly/);
    assert.match(header, /Secure/);
    assert.match(header, /SameSite=Lax/);
    const dev = cookieHeader('cd_session', 'abc', { production: false, maxAge: 60 });
    assert.doesNotMatch(dev, /Secure/);
  });
});
