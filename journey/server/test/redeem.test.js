import './env.js';
import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { getPool } from '../src/db.js';
import { call, jar, resetDb, signIn, start, stop } from './helpers.js';

async function codeIsStoredHashed(code) {
  const rows = await getPool().query('SELECT * FROM redeem_codes');
  const purchases = await getPool().query('SELECT * FROM purchases');
  const blob = JSON.stringify(rows.rows) + JSON.stringify(purchases.rows);
  assert.equal(blob.includes(code), false);
  assert.equal(rows.rows[0].code_hash.length, 64);
  assert.notEqual(rows.rows[0].code_hash, code);
  assert.match(rows.rows[0].code_hint, /····/);
}

describe('redeem', { concurrency: 1 }, () => {
  let started;
  before(async () => { started = await start(); });
  beforeEach(async () => { await resetDb(); });
  after(async () => { await stop(started); });

  it('mints a mock code and redeems it once into an entitlement', async () => {
    const owner = jar();
    await signIn(started.base, owner, 'owner@nextsteps.fun');
    const logs = [];
    const orig = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    let minted;
    try {
      minted = await call(started.base, owner, 'POST', '/api/admin/codes', {
        slug: 'clara-hale', count: 1, sku: 'MOCK-CLARA-HALE',
      });
    } finally {
      console.log = orig;
    }
    assert.equal(minted.status, 201);
    assert.equal(minted.json.mock, true);
    assert.match(minted.json.label, /not real Etsy/i);
    const code = minted.json.codes[0];
    assert.match(code, /^CD-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    assert.equal(logs.some((line) => line.includes(code)), false);
    await codeIsStoredHashed(code);

    const player = jar();
    await signIn(started.base, player, 'player@example.com');
    const first = await call(started.base, player, 'POST', '/api/redeem', { code: code.toLowerCase() });
    assert.equal(first.status, 200, JSON.stringify(first.json));
    assert.equal(first.json.entitlement.slug, 'clara-hale');
    assert.equal(first.json.entitlement.source, 'etsy_mock');
    assert.equal(first.json.mock, true);

    const purchase = await getPool().query(`SELECT channel, mock, redeemed_code, sku FROM purchases`);
    assert.equal(purchase.rows[0].channel, 'etsy_mock');
    assert.equal(purchase.rows[0].mock, true);
    assert.equal(purchase.rows[0].sku, 'MOCK-CLARA-HALE');
    assert.equal(purchase.rows[0].redeemed_code.includes(code), false);

    const me = await call(started.base, player, 'GET', '/api/me');
    assert.equal(me.json.entitlements.length, 1);

    const second = await call(started.base, player, 'POST', '/api/redeem', { code });
    assert.equal(second.status, 409);

    const stranger = jar();
    await signIn(started.base, stranger, 'stranger@example.com');
    const stolen = await call(started.base, stranger, 'POST', '/api/redeem', { code });
    assert.equal(stolen.status, 409);
  });

  it('does not consume a second code when the case is already owned', async () => {
    const owner = jar();
    await signIn(started.base, owner, 'owner@nextsteps.fun');
    const minted = await call(started.base, owner, 'POST', '/api/admin/codes', { slug: 'clara-hale', count: 2 });
    const [first, second] = minted.json.codes;
    const player = jar();
    await signIn(started.base, player, 'player@example.com');
    assert.equal((await call(started.base, player, 'POST', '/api/redeem', { code: first })).status, 200);
    const again = await call(started.base, player, 'POST', '/api/redeem', { code: second });
    assert.equal(again.status, 409);
    assert.match(again.json.error, /already on your desk/i);
    const row = await getPool().query(
      `SELECT redeemed_at FROM redeem_codes WHERE code_hint LIKE $1`,
      ['%' + second.slice(-4)],
    );
    assert.equal(row.rows[0].redeemed_at, null);
  });

  it('rejects an unknown code and rate limits guesses', async () => {
    const player = jar();
    await signIn(started.base, player, 'player@example.com');
    const bad = await call(started.base, player, 'POST', '/api/redeem', { code: 'CD-AAAA-AAAA-AAAA' });
    assert.equal(bad.status, 400);

    const limited = await start({ redeemRateLimit: 2 });
    try {
      const cookies = jar();
      await signIn(limited.base, cookies, 'player@example.com');
      assert.equal((await call(limited.base, cookies, 'POST', '/api/redeem', { code: 'CD-AAAA-AAAA-AAAA' })).status, 400);
      assert.equal((await call(limited.base, cookies, 'POST', '/api/redeem', { code: 'CD-BBBB-BBBB-BBBB' })).status, 400);
      const blocked = await call(limited.base, cookies, 'POST', '/api/redeem', { code: 'CD-CCCC-CCCC-CCCC' });
      assert.equal(blocked.status, 429);
    } finally {
      await new Promise((resolve) => limited.server.close(resolve));
    }
  });

  it('offers a mock buy path that still has to be redeemed', async () => {
    const player = jar();
    await signIn(started.base, player, 'player@example.com');
    const shop = await call(started.base, player, 'GET', '/api/commerce/etsy?slug=clara-hale');
    assert.equal(shop.json.mock, true);
    assert.equal(shop.json.practice, true);
    assert.equal(shop.json.sku, 'MOCK-CLARA-HALE');
    assert.equal(shop.json.listingUrl, null);

    const bought = await call(started.base, player, 'POST', '/api/commerce/mock-purchase', { slug: 'clara-hale' });
    assert.equal(bought.status, 200);
    assert.match(bought.json.label, /not a real Etsy/i);
    const owned = await getPool().query('SELECT count(*)::int AS n FROM entitlements');
    assert.equal(owned.rows[0].n, 0);
    const redeemed = await call(started.base, player, 'POST', '/api/redeem', { code: bought.json.code });
    assert.equal(redeemed.status, 200);

    const off = await start({ mockCommerce: false });
    try {
      const cookies = jar();
      await signIn(off.base, cookies, 'player@example.com');
      const hidden = await call(off.base, cookies, 'POST', '/api/commerce/mock-purchase', { slug: 'clara-hale' });
      assert.equal(hidden.status, 404);
    } finally {
      await new Promise((resolve) => off.server.close(resolve));
    }
  });

  it('requires a sign-in to redeem', async () => {
    const res = await call(started.base, jar(), 'POST', '/api/redeem', { code: 'CD-AAAA-AAAA-AAAA' });
    assert.equal(res.status, 401);
  });
});
