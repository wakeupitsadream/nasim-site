import { createHash } from 'node:crypto';

// TEMPORARY (until phase 4 adds the `rate_limits` table): a per-instance sliding window. On
// serverless it only bounds abuse per warm instance, which is enough for the AI triage before
// launch; the caps on request size and model effort bound the cost of a single call.

type Bucket = number[];
const buckets = new Map<string, Bucket>();

export type RateLimitRule = { limit: number; windowMs: number };

/** True when `key` may proceed; records the hit. `now` is injectable for tests. */
export function allow(key: string, rule: RateLimitRule, now = Date.now()): boolean {
  const since = now - rule.windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > since);
  if (hits.length >= rule.limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 10_000) buckets.clear(); // memory guard on long-lived instances
  return true;
}

/** Visible for tests. */
export const resetRateLimits = (): void => buckets.clear();

/** Never store or log a raw IP (CLAUDE.md rule 7): keys are salted hashes. */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? 'dev-salt';
  return createHash('sha256').update(`${ip}|${salt}`).digest('hex').slice(0, 32);
}

/** First client IP from the proxy chain, or 'unknown'. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  return first || headers.get('x-real-ip') || 'unknown';
}
