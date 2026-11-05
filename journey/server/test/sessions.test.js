import './env.js';
import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { getPool } from '../src/db.js';
import { call, jar, resetDb, signIn, start, stop } from './helpers.js';

const summary = (beat) => ({
  beat,
  theme: 'b',
  pulled: {},
  board: {},
  notes: [],
  env: { A: 'sealed', B: 'sealed', C: 'sealed' },
  savedAt: Date.now(),
});

describe('sessions', { concurrency: 1 }, () => {
  let started;
  before(async () => { started = await start(); });
  beforeEach(async () => { await resetDb(); });
  after(async () => { await stop(started); });

  it('stores a solo host, discrete events, and a resume checkpoint', async () => {
    const cookies = jar();
    await signIn(started.base, cookies, 'player@example.com');
    const opened = await call(started.base, cookies, 'POST', '/api/cases/clara-hale/sessions');
    assert.equal(opened.status, 201);
    const id = opened.json.session.id;
    const again = await call(started.base, cookies, 'POST', '/api/cases/clara-hale/sessions');
    assert.equal(again.status, 200);
    assert.equal(again.json.session.id, id);
    assert.equal(again.json.resumed, true);

    const host = await getPool().query(
      `SELECT role FROM session_participants WHERE session_id = $1`,
      [id],
    );
    assert.deepEqual(host.rows.map((r) => r.role), ['host']);

    const posted = await call(started.base, cookies, 'POST', `/api/sessions/${id}/events`, {
      events: [
        { kind: 'beat', payload: { beat: 'build', from: 'handoff' }, clientEventId: 'event-beat-1' },
        { kind: 'evidence', payload: { pulled: ['briefing'] }, clientEventId: 'event-ev-1' },
      ],
    });
    assert.equal(posted.status, 200);
    assert.equal(posted.json.inserted, 2);

    const replay = await call(started.base, cookies, 'POST', `/api/sessions/${id}/events`, {
      events: [{ kind: 'beat', payload: { beat: 'build' }, clientEventId: 'event-beat-1' }],
    });
    assert.equal(replay.json.inserted, 0);
    assert.equal(replay.json.skipped, 1);
    const count = await getPool().query('SELECT count(*)::int AS n FROM desk_events');
    assert.equal(count.rows[0].n, 2);

    const point = await call(started.base, cookies, 'PUT', `/api/sessions/${id}/checkpoints/resume`, {
      summary: summary('build'),
    });
    assert.equal(point.status, 200);
    const pointAgain = await call(started.base, cookies, 'PUT', `/api/sessions/${id}/checkpoints/resume`, {
      summary: summary('envA'),
    });
    assert.equal(pointAgain.status, 200);
    const points = await getPool().query('SELECT count(*)::int AS n FROM progress_checkpoints');
    assert.equal(points.rows[0].n, 1);

    const read = await call(started.base, cookies, 'GET', `/api/sessions/${id}`);
    assert.equal(read.status, 200);
    assert.equal(read.json.events.length, 2);
    assert.equal(read.json.events[0].kind, 'beat');
    assert.equal(read.json.checkpoint.summary.beat, 'envA');
    assert.equal(read.json.participants.length, 1);

    const current = await call(started.base, cookies, 'GET', '/api/cases/clara-hale/sessions/current');
    assert.equal(current.json.session.id, id);

    const anon = await call(started.base, jar(), 'POST', `/api/sessions/${id}/events`, {
      events: [{ kind: 'beat', payload: { beat: 'build' }, clientEventId: 'event-nope-1' }],
    });
    assert.equal(anon.status, 401);
  });

  it('rejects oversized or unknown desk writes and closes an abandoned session', async () => {
    const cookies = jar();
    await signIn(started.base, cookies, 'player@example.com');
    const opened = await call(started.base, cookies, 'POST', '/api/cases/clara-hale/sessions');
    const id = opened.json.session.id;
    const huge = { beat: 'build', notes: 'x'.repeat(120_000) };
    const tooBig = await call(started.base, cookies, 'PUT', `/api/sessions/${id}/checkpoints/resume`, { summary: huge });
    assert.equal(tooBig.status, 400);
    const badKind = await call(started.base, cookies, 'POST', `/api/sessions/${id}/events`, {
      events: [{ kind: 'drop-table', payload: {}, clientEventId: 'event-bad-1' }],
    });
    assert.equal(badKind.status, 400);

    const done = await call(started.base, cookies, 'POST', `/api/sessions/${id}/complete`);
    assert.equal(done.json.status, 'completed');
    const afterDone = await call(started.base, cookies, 'PUT', `/api/sessions/${id}/checkpoints/resume`, {
      summary: summary('file'),
    });
    assert.equal(afterDone.status, 200);

    const abandoned = await call(started.base, cookies, 'POST', `/api/sessions/${id}/abandon`);
    assert.equal(abandoned.status, 200);
    const late = await call(started.base, cookies, 'POST', `/api/sessions/${id}/events`, {
      events: [{ kind: 'desk', payload: { changed: ['beat'] }, clientEventId: 'event-late-1' }],
    });
    assert.equal(late.status, 409);
    const current = await call(started.base, cookies, 'GET', '/api/cases/clara-hale/sessions/current');
    assert.equal(current.json.session, null);
  });

  it('serves the game without an account and keeps asset caching', async () => {
    const home = await call(started.base, null, 'GET', '/');
    assert.equal(home.status, 200);
    assert.match(home.text, /The Vanishing of Clara Hale/);
    assert.match(home.text, /name="case-desk"/);
    assert.match(home.text, /app\/account\.js/);
    const engine = await call(started.base, null, 'GET', '/app/player.js');
    assert.equal(engine.status, 200);
    assert.match(engine.headers.get('cache-control'), /max-age=300/);
    const art = await call(started.base, null, 'GET', '/assets/covers/clara-hale.jpg');
    assert.equal(art.status, 200);
    assert.match(art.headers.get('cache-control'), /immutable/);
    const missing = await call(started.base, null, 'GET', '/assets/no-such-file.jpg');
    assert.equal(missing.status, 404);
    const leaked = await call(started.base, null, 'GET', '/server/package.json');
    assert.equal(leaked.status, 404);
    const health = await call(started.base, null, 'GET', '/health');
    assert.equal(health.status, 200);
    assert.equal(health.json.ok, true);
    const library = await call(started.base, null, 'GET', '/library');
    assert.equal(library.status, 200);
    assert.match(library.text, /Your desk/);
  });
});
