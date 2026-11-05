import './env.js';
import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { getPool } from '../src/db.js';
import { call, jar, resetDb, signIn, start, stop } from './helpers.js';

describe('entitlements', { concurrency: 1 }, () => {
  let started;
  before(async () => { started = await start(); });
  beforeEach(async () => {
    await resetDb();
    await getPool().query(`
      INSERT INTO cases (slug, title, status, access, price_cents, etsy_sku, content_version)
      VALUES
        ('lighthouse', 'The Lighthouse Keeper', 'live', 'paid', 1200, 'MOCK-LIGHTHOUSE', '1'),
        ('draft-case', 'Still in the drawer', 'draft', 'paid', 500, 'MOCK-DRAFT', '1')
    `);
  });
  after(async () => { await stop(started); });

  it('blocks a paid case until a code is redeemed, including saves', async () => {
    const player = jar();
    await signIn(started.base, player, 'player@example.com');
    const blocked = await call(started.base, player, 'POST', '/api/cases/lighthouse/sessions');
    assert.equal(blocked.status, 403);

    const rating = await call(started.base, player, 'PUT', '/api/cases/lighthouse/rating', { stars: 5 });
    assert.equal(rating.status, 403);

    const list = await call(started.base, null, 'GET', '/api/cases');
    assert.equal(list.json.cases.some((c) => c.slug === 'draft-case'), false);
    const draft = await call(started.base, player, 'POST', '/api/cases/draft-case/sessions');
    assert.equal(draft.status, 404);

    const owner = jar();
    await signIn(started.base, owner, 'owner@nextsteps.fun');
    const minted = await call(started.base, owner, 'POST', '/api/admin/codes', {
      slug: 'lighthouse', count: 1, sku: 'MOCK-LIGHTHOUSE',
    });
    const redeemed = await call(started.base, player, 'POST', '/api/redeem', { code: minted.json.codes[0] });
    assert.equal(redeemed.status, 200);
    const purchase = await getPool().query(`SELECT amount_cents, channel, mock FROM purchases`);
    assert.equal(purchase.rows[0].amount_cents, 1200);
    assert.equal(purchase.rows[0].mock, true);

    const opened = await call(started.base, player, 'POST', '/api/cases/lighthouse/sessions');
    assert.equal(opened.status, 201);
    const stranger = jar();
    await signIn(started.base, stranger, 'stranger@example.com');
    const peek = await call(started.base, stranger, 'GET', '/api/sessions/' + opened.json.session.id);
    assert.equal(peek.status, 404);
    const write = await call(started.base, stranger, 'POST', '/api/sessions/' + opened.json.session.id + '/events', {
      events: [{ kind: 'beat', payload: { beat: 'build' }, clientEventId: 'abcdefgh' }],
    });
    assert.equal(write.status, 404);
  });

  it('lets a free case save without a purchase', async () => {
    const player = jar();
    await signIn(started.base, player, 'player@example.com');
    const opened = await call(started.base, player, 'POST', '/api/cases/clara-hale/sessions');
    assert.equal(opened.status, 201);
    assert.equal(opened.json.session.caseSlug, 'clara-hale');
    assert.equal(opened.json.participants[0].role, 'host');
    const owned = await getPool().query('SELECT count(*)::int AS n FROM entitlements');
    assert.equal(owned.rows[0].n, 0);
  });

  it('keeps one rating per player on a case they can open', async () => {
    const player = jar();
    await signIn(started.base, player, 'player@example.com');
    const bad = await call(started.base, player, 'PUT', '/api/cases/clara-hale/rating', { stars: 6 });
    assert.equal(bad.status, 400);
    const saved = await call(started.base, player, 'PUT', '/api/cases/clara-hale/rating', {
      stars: 4, body: 'I liked the tapes.',
    });
    assert.equal(saved.status, 200);
    const changed = await call(started.base, player, 'PUT', '/api/cases/clara-hale/rating', { stars: 5, body: '' });
    assert.equal(changed.status, 200);
    assert.equal(changed.json.rating.stars, 5);
    assert.equal(changed.json.case.ratingCount, 1);
    assert.equal(changed.json.case.ratingAvg, 5);
    const rows = await getPool().query('SELECT count(*)::int AS n FROM ratings');
    assert.equal(rows.rows[0].n, 1);
  });
});
