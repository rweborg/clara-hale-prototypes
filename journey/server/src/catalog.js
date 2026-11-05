import { getPool } from './db.js';
import { HttpError, normalizeSlug } from './http.js';

const CASE_FIELDS = `
  c.id, c.slug, c.title, c.blurb, c.difficulty, c.genres, c.status, c.access,
  c.cover_url, c.content_version, c.price_cents, c.etsy_sku, c.etsy_listing_url,
  (SELECT round(avg(r.stars)::numeric, 2) FROM ratings r WHERE r.case_id = c.id) AS rating_avg,
  (SELECT count(*)::int FROM ratings r WHERE r.case_id = c.id) AS rating_count
`;

export function presentCase(row, { includeId = false } = {}) {
  if (!row) return null;
  const out = {
    slug: row.slug,
    title: row.title,
    blurb: row.blurb,
    difficulty: row.difficulty,
    genres: row.genres || [],
    status: row.status,
    access: row.access,
    coverUrl: row.cover_url,
    contentVersion: row.content_version,
    priceCents: row.price_cents,
    etsySku: row.etsy_sku,
    etsyListingUrl: row.etsy_listing_url,
    ratingAvg: row.rating_avg === null || row.rating_avg === undefined ? null : Number(row.rating_avg),
    ratingCount: Number(row.rating_count || 0),
  };
  if (includeId) out.id = row.id;
  return out;
}

export async function listPublicCases() {
  const result = await getPool().query(
    `SELECT ${CASE_FIELDS} FROM cases c WHERE c.status = 'live' ORDER BY c.title`,
  );
  return result.rows.map((row) => presentCase(row));
}

export async function getCaseBySlug(slug, { liveOnly = true } = {}) {
  const result = await getPool().query(
    `SELECT ${CASE_FIELDS} FROM cases c WHERE c.slug = $1`,
    [slug],
  );
  const row = result.rows[0];
  if (!row) return null;
  if (liveOnly && row.status !== 'live') return null;
  return row;
}

/** Free/demo cases open without a purchase. Paid cases need an entitlement row. */
export async function userCanPlay(userId, caseRow) {
  if (!caseRow || caseRow.status !== 'live') return false;
  if (caseRow.access === 'free') return true;
  const owned = await getPool().query(
    'SELECT 1 FROM entitlements WHERE user_id = $1 AND case_id = $2',
    [userId, caseRow.id],
  );
  return owned.rowCount > 0;
}

export async function requirePlayable(userId, slug) {
  const normalized = normalizeSlug(slug);
  if (!normalized) throw new HttpError(404, 'No case by that name.');
  const caseRow = await getCaseBySlug(normalized, { liveOnly: false });
  if (!caseRow || caseRow.status !== 'live') throw new HttpError(404, 'No case by that name.');
  const allowed = await userCanPlay(userId, caseRow);
  if (!allowed) {
    throw new HttpError(403, 'This case is not on your desk yet. Redeem the code from your purchase.');
  }
  return caseRow;
}

export async function upsertRating(userId, slug, body) {
  const caseRow = await requirePlayable(userId, slug);
  const stars = Number(body?.stars);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    throw new HttpError(400, 'Choose a rating from 1 to 5.');
  }
  let note = null;
  if (body?.body !== undefined && body?.body !== null && body.body !== '') {
    if (typeof body.body !== 'string') throw new HttpError(400, 'Keep the note short.');
    note = body.body.replace(/[\u0000-\u001f]/g, '').trim();
    if (note.length > 500) throw new HttpError(400, 'Keep the note under 500 characters.');
    if (!note) note = null;
  }
  const saved = await getPool().query(
    `INSERT INTO ratings (user_id, case_id, stars, body)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, case_id)
     DO UPDATE SET stars = EXCLUDED.stars, body = EXCLUDED.body, updated_at = now()
     RETURNING stars, body, updated_at`,
    [userId, caseRow.id, stars, note],
  );
  const fresh = await getCaseBySlug(caseRow.slug, { liveOnly: false });
  return {
    rating: {
      stars: saved.rows[0].stars,
      body: saved.rows[0].body,
      updatedAt: saved.rows[0].updated_at,
    },
    case: presentCase(fresh),
  };
}

export async function ratingFor(userId, slug) {
  const normalized = normalizeSlug(slug);
  if (!normalized) throw new HttpError(404, 'No case by that name.');
  const caseRow = await getCaseBySlug(normalized, { liveOnly: true });
  if (!caseRow) throw new HttpError(404, 'No case by that name.');
  const mine = userId
    ? await getPool().query(
      'SELECT stars, body, updated_at FROM ratings WHERE user_id = $1 AND case_id = $2',
      [userId, caseRow.id],
    )
    : { rows: [] };
  return {
    case: presentCase(caseRow),
    mine: mine.rows[0]
      ? { stars: mine.rows[0].stars, body: mine.rows[0].body, updatedAt: mine.rows[0].updated_at }
      : null,
  };
}
