import { getPool } from './db.js';
import { listCodeHints, mintCodes } from './commerce.js';

export async function adminSummary() {
  const counts = await getPool().query(`
    SELECT
      (SELECT count(*)::int FROM users) AS users,
      (SELECT count(*)::int FROM entitlements) AS entitlements,
      (SELECT count(*)::int FROM redeem_codes) AS codes,
      (SELECT count(*)::int FROM redeem_codes WHERE redeemed_at IS NULL) AS codes_open,
      (SELECT count(*)::int FROM case_sessions) AS sessions,
      (SELECT count(*)::int FROM ratings) AS ratings,
      (SELECT coalesce(sum(amount_cents), 0)::int FROM purchases WHERE NOT mock) AS paid_cents,
      (SELECT coalesce(sum(amount_cents), 0)::int FROM purchases WHERE mock) AS mock_cents
  `);
  const cases = await getPool().query(
    `SELECT slug, title, status, access, owners, purchases, mock_purchases, avg_stars, rating_count
     FROM ops_case_counts ORDER BY title`,
  );
  const row = counts.rows[0];
  return {
    users: row.users,
    entitlements: row.entitlements,
    codes: row.codes,
    codesOpen: row.codes_open,
    sessions: row.sessions,
    ratings: row.ratings,
    paidCents: row.paid_cents,
    mockCents: row.mock_cents,
    cases: cases.rows.map((c) => ({
      slug: c.slug,
      title: c.title,
      status: c.status,
      access: c.access,
      owners: Number(c.owners),
      purchases: Number(c.purchases),
      mockPurchases: Number(c.mock_purchases),
      ratingAvg: c.avg_stars === null ? null : Number(c.avg_stars),
      ratingCount: Number(c.rating_count),
    })),
    note: 'Counts only. Revenue charts are Phase 2. Mock purchases are not real Etsy sales.',
  };
}

export { listCodeHints, mintCodes };
