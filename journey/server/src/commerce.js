import { getPool, withTx } from './db.js';
import {
  HttpError,
  clientIp,
  codeHint,
  generateRedeemCode,
  hashSecret,
  normalizeRedeemCode,
  normalizeSlug,
} from './http.js';
import { getCaseBySlug, presentCase } from './catalog.js';

/**
 * Phase 1 commerce is a redeem code, not an Etsy API.
 * A future listing link and receipt match drop into purchases.etsy_order_id
 * and cases.etsy_listing_url. Nothing here calls Etsy.
 */

export async function etsyBridge(slug, config) {
  const normalized = slug ? normalizeSlug(slug) : null;
  const caseRow = normalized ? await getCaseBySlug(normalized, { liveOnly: false }) : null;
  const listingUrl = (caseRow && caseRow.etsy_listing_url) || config.etsyListingUrl || null;
  return {
    provider: 'etsy',
    // Practice codes stay available until a real listing URL is set and
    // MOCK_COMMERCE is turned off. Nothing in this process calls Etsy.
    mode: listingUrl && !config.mockCommerce ? 'listing' : 'mock',
    mock: true,
    practice: !!config.mockCommerce,
    listingUrl,
    sku: caseRow?.etsy_sku || (normalized ? `MOCK-${normalized.toUpperCase()}` : null),
    case: caseRow && caseRow.status === 'live' ? presentCase(caseRow) : null,
    note: 'Purchases will be completed on Etsy. The thank-you note includes a one-time code. There is no Etsy checkout inside The Case Desk, and this build does not call Etsy.',
  };
}

async function insertCode(client, { caseRow, sku, config }) {
  const code = generateRedeemCode();
  await client.query(
    `INSERT INTO redeem_codes (code_hash, code_hint, case_id, sku, channel, mock)
     VALUES ($1, $2, $3, $4, 'etsy_mock', true)`,
    [hashSecret(code, config.sessionSecret), codeHint(code), caseRow.id, sku],
  );
  return code;
}

export async function mintCodes({ slug, count, sku, config }) {
  const normalized = normalizeSlug(slug);
  if (!normalized) throw new HttpError(400, 'Name the case to mint codes for.');
  const caseRow = await getCaseBySlug(normalized, { liveOnly: false });
  if (!caseRow) throw new HttpError(404, 'No case by that name.');
  const n = Number(count ?? 1);
  if (!Number.isInteger(n) || n < 1 || n > 50) throw new HttpError(400, 'Mint between 1 and 50 codes.');
  const resolvedSku = (typeof sku === 'string' && sku.trim())
    ? sku.trim().slice(0, 64)
    : (caseRow.etsy_sku || `MOCK-${normalized.toUpperCase()}`);
  if (!/^[\w.-]{1,64}$/.test(resolvedSku)) throw new HttpError(400, 'That SKU does not look usable.');

  const codes = await withTx(async (client) => {
    const minted = [];
    for (let i = 0; i < n; i += 1) {
      minted.push(await insertCode(client, { caseRow, sku: resolvedSku, config }));
    }
    return minted;
  });
  console.log(`[case-desk] minted ${codes.length} mock codes for ${normalized} sku ${resolvedSku}`);
  return {
    mock: true,
    label: 'Practice codes — not real Etsy orders',
    slug: normalized,
    sku: resolvedSku,
    codes,
    note: 'Copy these now. Only a hint is stored. When Etsy fulfillment exists, the same table accepts a real order id.',
  };
}

export async function listCodeHints(slug) {
  const params = [];
  let where = '';
  if (slug) {
    const normalized = normalizeSlug(slug);
    if (!normalized) throw new HttpError(400, 'That case name is not valid.');
    params.push(normalized);
    where = 'WHERE c.slug = $1';
  }
  const result = await getPool().query(
    `SELECT r.code_hint, r.sku, r.channel, r.mock, r.redeemed_at, r.expires_at, r.created_at, c.slug
     FROM redeem_codes r
     JOIN cases c ON c.id = r.case_id
     ${where}
     ORDER BY r.created_at DESC
     LIMIT 100`,
    params,
  );
  return result.rows.map((row) => ({
    hint: row.code_hint,
    slug: row.slug,
    sku: row.sku,
    channel: row.channel,
    mock: row.mock,
    redeemed: !!row.redeemed_at,
    redeemedAt: row.redeemed_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }));
}

export async function redeemCode(user, rawCode, config, limitBy) {
  limitBy(`ip:${user.ip || 'unknown'}`);
  limitBy(`user:${user.id}`);
  const code = normalizeRedeemCode(rawCode);
  if (!code) throw new HttpError(400, 'Enter the code from your purchase. It looks like CD-XXXX-XXXX-XXXX.');

  return withTx(async (client) => {
    const found = await client.query(
      `SELECT r.id, r.case_id, r.channel, r.mock, r.sku, r.redeemed_at, r.expires_at, c.slug, c.title, c.price_cents
       FROM redeem_codes r
       JOIN cases c ON c.id = r.case_id
       WHERE r.code_hash = $1
       FOR UPDATE`,
      [hashSecret(code, config.sessionSecret)],
    );
    const row = found.rows[0];
    if (!row) throw new HttpError(400, 'That code does not work. Check the characters and try again.');
    if (row.redeemed_at) throw new HttpError(409, 'That code has already been used.');
    if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) {
      throw new HttpError(400, 'That code has expired.');
    }

    const owned = await client.query(
      'SELECT 1 FROM entitlements WHERE user_id = $1 AND case_id = $2',
      [user.id, row.case_id],
    );
    if (owned.rowCount) {
      throw new HttpError(409, 'This case is already on your desk. The code was not used.');
    }

    const source = row.channel === 'etsy' ? 'etsy' : row.channel;
    const purchase = await client.query(
      `INSERT INTO purchases (user_id, case_id, channel, amount_cents, currency, redeemed_code, sku, mock)
       VALUES ($1, $2, $3, $4, 'usd', $5, $6, $7)
       RETURNING id`,
      [user.id, row.case_id, row.channel, row.price_cents, codeHint(code), row.sku, row.mock],
    );
    const entitlement = await client.query(
      `INSERT INTO entitlements (user_id, case_id, source, purchase_id)
       VALUES ($1, $2, $3, $4)
       RETURNING unlocked_at`,
      [user.id, row.case_id, source, purchase.rows[0].id],
    );
    const marked = await client.query(
      `UPDATE redeem_codes
       SET redeemed_by = $1, redeemed_at = now(), purchase_id = $2
       WHERE id = $3 AND redeemed_at IS NULL
       RETURNING id`,
      [user.id, purchase.rows[0].id, row.id],
    );
    if (!marked.rowCount) throw new HttpError(409, 'That code has already been used.');

    return {
      ok: true,
      mock: row.mock,
      entitlement: {
        slug: row.slug,
        title: row.title,
        source,
        unlockedAt: entitlement.rows[0].unlocked_at,
      },
    };
  });
}

/**
 * Player-facing stand-in for "Buy on Etsy". Mints one mock code and returns it
 * the way a digital delivery note would. Does not create the entitlement —
 * the player still redeems, which is the path a real code will use.
 */
export async function mockPurchase(user, slug, config, limitBy) {
  if (!config.mockCommerce) {
    throw new HttpError(404, 'Practice purchases are turned off.');
  }
  limitBy(`mock:${user.id}`);
  const normalized = normalizeSlug(slug);
  if (!normalized) throw new HttpError(400, 'Name the case.');
  const caseRow = await getCaseBySlug(normalized, { liveOnly: true });
  if (!caseRow) throw new HttpError(404, 'No case by that name.');
  const sku = caseRow.etsy_sku || `MOCK-${normalized.toUpperCase()}`;
  const code = await withTx(async (client) => insertCode(client, { caseRow, sku, config }));
  console.log(`[case-desk] mock purchase code minted for ${normalized}`);
  return {
    mock: true,
    label: 'Practice code — not a real Etsy order',
    sku,
    listingUrl: caseRow.etsy_listing_url || config.etsyListingUrl || null,
    code,
    note: 'When the Etsy shop is open, a code like this arrives with the digital download instead of on this screen. Enter it below to put the case on your desk.',
  };
}

export function redeemLimiterKey(req, user) {
  return { ip: clientIp(req), id: user.id };
}
