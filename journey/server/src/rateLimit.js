import { HttpError } from './http.js';

/**
 * In-memory sliding window. One Railway service is the Phase 1 deploy,
 * so a process-local limit is the right size. Move it to Postgres if a
 * second instance ever serves traffic.
 */
export function createRateLimiter({ limit, windowMs }) {
  /** @type {Map<string, number[]>} */
  const hits = new Map();
  return function limitBy(key) {
    const now = Date.now();
    const bucket = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (bucket.length >= limit) {
      const retryAfter = Math.max(1, Math.ceil((windowMs - (now - bucket[0])) / 1000));
      throw new HttpError(429, 'Too many attempts. Please wait a few minutes and try again.', { retryAfter });
    }
    bucket.push(now);
    hits.set(key, bucket);
    if (hits.size > 20000) {
      for (const [k, times] of hits) {
        if (!times.some((t) => now - t < windowMs)) hits.delete(k);
      }
    }
  };
}
