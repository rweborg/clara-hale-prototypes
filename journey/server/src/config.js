import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** Fill process.env from a dotenv-style file. Existing variables win. */
export function loadEnvFile(file) {
  if (!file || !fs.existsSync(file)) return;
  const text = fs.readFileSync(file, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

export const defaultEnvPath = path.resolve(here, '../.env');

function flag(value) {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === '1' || raw === 'true' || raw === 'yes') return true;
  if (raw === '0' || raw === 'false' || raw === 'no') return false;
  return null;
}

/**
 * @param {object} [overrides]
 */
export function loadConfig(overrides = {}) {
  const nodeEnv = overrides.nodeEnv ?? process.env.NODE_ENV ?? 'development';
  const production = nodeEnv === 'production';
  const sessionSecret = overrides.sessionSecret ?? process.env.SESSION_SECRET ?? '';
  if (production && !sessionSecret) {
    throw new Error('SESSION_SECRET is required in production');
  }
  const mockFlag = flag(process.env.MOCK_COMMERCE);
  const mockCommerce = overrides.mockCommerce ?? (mockFlag === null ? !production : mockFlag);
  const adminEmails = (overrides.adminEmails ?? process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  return {
    nodeEnv,
    production,
    sessionSecret: sessionSecret || 'dev-only-not-for-production',
    databaseUrl: overrides.databaseUrl ?? process.env.DATABASE_URL ?? '',
    port: Number(overrides.port ?? process.env.PORT ?? 8080),
    publicBaseUrl: String(overrides.publicBaseUrl ?? process.env.PUBLIC_BASE_URL ?? 'http://127.0.0.1:8080').replace(/\/$/, ''),
    emailFrom: process.env.EMAIL_FROM || 'The Case Desk <no-reply@nextsteps.fun>',
    emailReplyTo: process.env.EMAIL_REPLY_TO || '',
    resendApiKey: overrides.resendApiKey ?? process.env.RESEND_API_KEY ?? '',
    adminEmails,
    mockCommerce: !!mockCommerce,
    etsyListingUrl: process.env.ETSY_LISTING_URL || '',
    staticRoot: overrides.staticRoot ?? process.env.STATIC_ROOT ?? path.resolve(here, '../..'),
    authRateLimit: overrides.authRateLimit ?? 5,
    redeemRateLimit: overrides.redeemRateLimit ?? 8,
    mockRateLimit: overrides.mockRateLimit ?? 5,
    rateWindowMs: overrides.rateWindowMs ?? 15 * 60 * 1000,
    magicLinkTtlMs: overrides.magicLinkTtlMs ?? 15 * 60 * 1000,
    sessionTtlMs: overrides.sessionTtlMs ?? 30 * 24 * 60 * 60 * 1000,
  };
}
