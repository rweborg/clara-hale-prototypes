import crypto from 'node:crypto';

export class HttpError extends Error {
  /**
   * @param {number} status
   * @param {string} message
   * @param {Record<string, unknown>} [extra]
   */
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    Object.assign(this, extra);
  }
}

export const wrap = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

/** Peppered hash. The pepper is SESSION_SECRET, so a database copy is not the token. */
export function hashSecret(value, secret) {
  return crypto.createHash('sha256').update(String(secret)).update('\0').update(String(value)).digest('hex');
}

export function timingEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function readCookie(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) {
      try { return decodeURIComponent(part.slice(i + 1).trim()); }
      catch { return ''; }
    }
  }
  return '';
}

/**
 * @param {string} name
 * @param {string} value
 * @param {{ production: boolean, maxAge: number }} config
 */
export function cookieHeader(name, value, config) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${Math.max(0, Math.floor(config.maxAge))}`,
  ];
  if (config.production) parts.push('Secure');
  return parts.join('; ');
}

export function clearCookie(name, config) {
  return cookieHeader(name, '', { production: config.production, maxAge: 0 });
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function normalizeEmail(input) {
  if (typeof input !== 'string') return null;
  const email = input.trim().toLowerCase();
  if (email.length < 3 || email.length > 254 || !EMAIL.test(email)) return null;
  return email;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function normalizeSlug(input) {
  if (typeof input !== 'string') return null;
  const slug = input.trim().toLowerCase();
  if (!SLUG.test(slug) || slug.length > 64) return null;
  return slug;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(value) {
  return typeof value === 'string' && UUID.test(value);
}

/** CD-XXXX-XXXX-XXXX from a 32-character alphabet (unbiased). */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function generateRedeemCode() {
  const chars = [];
  while (chars.length < 12) {
    const buf = crypto.randomBytes(12);
    for (const byte of buf) {
      if (chars.length === 12) break;
      // 256 / 32 = 8, so every byte maps evenly.
      chars.push(CODE_ALPHABET[byte % CODE_ALPHABET.length]);
    }
  }
  const body = chars.join('');
  return `CD-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}`;
}

export function normalizeRedeemCode(input) {
  if (typeof input !== 'string') return null;
  const raw = input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!raw.startsWith('CD') || raw.length !== 14) return null;
  const body = raw.slice(2);
  if (![...body].every((ch) => CODE_ALPHABET.includes(ch))) return null;
  return `CD-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}`;
}

export function codeHint(code) {
  return `CD-····-····-${code.slice(-4)}`;
}

const EVENT_KINDS = new Set(['beat', 'evidence', 'board', 'note', 'envelope', 'progress', 'desk', 'report', 'reset']);

export function assertJsonObject(value, { maxBytes, label }) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, `${label} must be an object.`);
  }
  let text;
  try { text = JSON.stringify(value); }
  catch { throw new HttpError(400, `${label} must be an object.`); }
  if (text.includes('__proto__') || text.includes('"constructor"')) {
    throw new HttpError(400, `${label} has a field that is not allowed.`);
  }
  if (Buffer.byteLength(text) > maxBytes) {
    throw new HttpError(400, `${label} is too large.`);
  }
  return value;
}

export function assertEventKind(kind) {
  if (typeof kind !== 'string' || !EVENT_KINDS.has(kind)) {
    throw new HttpError(400, 'That desk event is not a kind we keep.');
  }
  return kind;
}

const CLIENT_EVENT = /^[A-Za-z0-9_-]{8,80}$/;
export function assertClientEventId(id) {
  if (typeof id !== 'string' || !CLIENT_EVENT.test(id)) {
    throw new HttpError(400, 'Each desk event needs a client id.');
  }
  return id;
}

const CHECKPOINT = /^[a-z][a-z0-9_-]{0,40}$/;
export function assertCheckpointName(name) {
  if (typeof name !== 'string' || !CHECKPOINT.test(name)) {
    throw new HttpError(400, 'That checkpoint name is not valid.');
  }
  return name;
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"]/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
  }[ch]));
}

export function wantsJson(req) {
  const accept = String(req.headers.accept || '');
  return accept.includes('application/json') && !accept.includes('text/html');
}

export function clientIp(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}
