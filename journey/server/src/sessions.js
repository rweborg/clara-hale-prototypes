import { getPool, withTx } from './db.js';
import { requirePlayable } from './catalog.js';
import {
  HttpError,
  assertCheckpointName,
  assertClientEventId,
  assertEventKind,
  assertJsonObject,
  isUuid,
} from './http.js';

const MAX_EVENTS = 20;
const EVENT_BYTES = 48 * 1024;
const CHECKPOINT_BYTES = 100 * 1024;

function presentSession(row, role) {
  return {
    id: row.id,
    caseSlug: row.slug,
    status: row.status,
    role: role || row.role || 'host',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function checkpointOf(sessionId) {
  const result = await getPool().query(
    `SELECT checkpoint, summary_json, updated_at
     FROM progress_checkpoints
     WHERE session_id = $1 AND checkpoint = 'resume'`,
    [sessionId],
  );
  const row = result.rows[0];
  if (!row) return null;
  return { name: row.checkpoint, summary: row.summary_json, updatedAt: row.updated_at };
}

async function eventsOf(sessionId, limit = 50) {
  const result = await getPool().query(
    `SELECT id, kind, payload_json, actor_user_id, client_event_id, created_at
     FROM desk_events
     WHERE session_id = $1
     ORDER BY created_at ASC
     LIMIT $2`,
    [sessionId, limit],
  );
  return result.rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    payload: row.payload_json,
    actorUserId: row.actor_user_id,
    clientEventId: row.client_event_id,
    createdAt: row.created_at,
  }));
}

async function participantsOf(sessionId, viewerId) {
  const result = await getPool().query(
    `SELECT user_id, role, joined_at FROM session_participants WHERE session_id = $1 ORDER BY joined_at`,
    [sessionId],
  );
  return result.rows.map((row) => ({
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at,
    you: row.user_id === viewerId,
  }));
}

export async function sessionPayload(row, viewerId) {
  const [checkpoint, events, participants] = await Promise.all([
    checkpointOf(row.id),
    eventsOf(row.id),
    participantsOf(row.id, viewerId),
  ]);
  const me = participants.find((p) => p.you);
  return {
    session: presentSession(row, me?.role),
    participants,
    checkpoint,
    events,
  };
}

async function findSession(userId, caseId, { activeOnly }) {
  const result = await getPool().query(
    `SELECT s.id, s.status, s.created_at, s.updated_at, s.case_id, s.host_user_id, c.slug, p.role
     FROM case_sessions s
     JOIN cases c ON c.id = s.case_id
     JOIN session_participants p ON p.session_id = s.id AND p.user_id = $1
     WHERE s.case_id = $2
       AND ($3::boolean = false OR s.status = 'active')
       AND s.status <> 'abandoned'
     ORDER BY (s.status = 'active') DESC, s.updated_at DESC
     LIMIT 1`,
    [userId, caseId, activeOnly],
  );
  return result.rows[0] || null;
}

export async function openSession(userId, slug) {
  const caseRow = await requirePlayable(userId, slug);
  const existing = await findSession(userId, caseRow.id, { activeOnly: true });
  if (existing) return { resumed: true, row: existing };

  try {
    const row = await withTx(async (client) => {
      const inserted = await client.query(
        `INSERT INTO case_sessions (case_id, host_user_id, status)
         VALUES ($1, $2, 'active')
         RETURNING id, status, created_at, updated_at, case_id, host_user_id`,
        [caseRow.id, userId],
      );
      await client.query(
        `INSERT INTO session_participants (session_id, user_id, role) VALUES ($1, $2, 'host')`,
        [inserted.rows[0].id, userId],
      );
      return { ...inserted.rows[0], slug: caseRow.slug };
    });
    return { resumed: false, row };
  } catch (err) {
    if (err.code === '23505') {
      const again = await findSession(userId, caseRow.id, { activeOnly: true });
      if (again) return { resumed: true, row: again };
    }
    throw err;
  }
}

export async function currentSession(userId, slug) {
  const caseRow = await requirePlayable(userId, slug);
  // Active first, otherwise the latest finished playthrough, so a reload
  // keeps syncing the same session. Abandoned sessions stay closed.
  const row = await findSession(userId, caseRow.id, { activeOnly: false });
  if (!row) return null;
  return sessionPayload(row, userId);
}

async function loadWritable(userId, sessionId) {
  if (!isUuid(sessionId)) throw new HttpError(404, 'No playthrough by that id.');
  const result = await getPool().query(
    `SELECT s.id, s.status, s.created_at, s.updated_at, s.case_id, s.host_user_id, c.slug, c.status AS case_status, c.access, p.role
     FROM case_sessions s
     JOIN cases c ON c.id = s.case_id
     JOIN session_participants p ON p.session_id = s.id AND p.user_id = $2
     WHERE s.id = $1`,
    [sessionId, userId],
  );
  const row = result.rows[0];
  if (!row) throw new HttpError(404, 'No playthrough by that id.');
  if (row.status === 'abandoned') throw new HttpError(409, 'This playthrough was set aside.');
  // Entitlement (or a free case) is checked on every write, not trusted from the client.
  await requirePlayable(userId, row.slug);
  return row;
}

export async function readSession(userId, sessionId) {
  const row = await loadWritable(userId, sessionId);
  return sessionPayload(row, userId);
}

export async function appendEvents(userId, sessionId, body) {
  const row = await loadWritable(userId, sessionId);
  const events = body?.events;
  if (!Array.isArray(events) || events.length < 1 || events.length > MAX_EVENTS) {
    throw new HttpError(400, `Send between 1 and ${MAX_EVENTS} desk events.`);
  }
  const clean = events.map((event) => ({
    kind: assertEventKind(event?.kind),
    payload: assertJsonObject(event?.payload ?? {}, { maxBytes: EVENT_BYTES, label: 'Event' }),
    clientEventId: assertClientEventId(event?.clientEventId),
  }));

  const inserted = await withTx(async (client) => {
    let count = 0;
    for (const event of clean) {
      const result = await client.query(
        `INSERT INTO desk_events (session_id, actor_user_id, kind, payload_json, client_event_id)
         VALUES ($1, $2, $3, $4::jsonb, $5)
         ON CONFLICT (session_id, client_event_id) DO NOTHING
         RETURNING id`,
        [row.id, userId, event.kind, JSON.stringify(event.payload), event.clientEventId],
      );
      if (result.rowCount) count += 1;
    }
    await client.query('UPDATE case_sessions SET updated_at = now() WHERE id = $1', [row.id]);
    return count;
  });
  return { ok: true, inserted, skipped: clean.length - inserted };
}

export async function saveCheckpoint(userId, sessionId, name, body) {
  const row = await loadWritable(userId, sessionId);
  const checkpoint = assertCheckpointName(name);
  const summary = assertJsonObject(body?.summary ?? {}, { maxBytes: CHECKPOINT_BYTES, label: 'Checkpoint' });
  const saved = await getPool().query(
    `INSERT INTO progress_checkpoints (session_id, checkpoint, summary_json, updated_at)
     VALUES ($1, $2, $3::jsonb, now())
     ON CONFLICT (session_id, checkpoint)
     DO UPDATE SET summary_json = EXCLUDED.summary_json, updated_at = now()
     RETURNING checkpoint, updated_at`,
    [row.id, checkpoint, JSON.stringify(summary)],
  );
  await getPool().query('UPDATE case_sessions SET updated_at = now() WHERE id = $1', [row.id]);
  return { ok: true, name: saved.rows[0].checkpoint, updatedAt: saved.rows[0].updated_at };
}

export async function setStatus(userId, sessionId, status) {
  const row = await loadWritable(userId, sessionId);
  if (status !== 'abandoned' && status !== 'completed') throw new HttpError(400, 'Unknown status.');
  // Abandon is terminal. Completed still accepts later desk writes (a filed case can be reopened on the device).
  if (status === 'abandoned') {
    await getPool().query(
      `UPDATE case_sessions SET status = 'abandoned', updated_at = now() WHERE id = $1`,
      [row.id],
    );
  } else if (row.status === 'active') {
    await getPool().query(
      `UPDATE case_sessions SET status = 'completed', updated_at = now() WHERE id = $1 AND status = 'active'`,
      [row.id],
    );
  }
  return { ok: true, status };
}
