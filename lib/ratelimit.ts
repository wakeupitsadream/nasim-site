import { createHash } from 'node:crypto';
import { getCache } from '@vercel/functions';

// Two layers (DECISIONS №84). `allow` is a per-instance sliding window: instant, no I/O, stops a
// burst from one address. `consumeQuotas` counts fixed windows (hour, day) in a store every
// instance of the region shares — the Vercel Runtime Cache — so a visitor cannot dodge a quota by
// landing on another instance. The store is a cache, not a ledger: counts are approximate (two
// simultaneous hits may count as one, an entry may be evicted early), which is fine for a cost cap.

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

/** A key-value store with a TTL in seconds: the Vercel Runtime Cache, or memory. */
export type CounterStore = {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown, options: { ttl: number }) => Promise<void>;
};

/** A process-local store: unit tests, local runs, and the fallback when the shared one fails. */
export function memoryStore(clock: () => number = Date.now): CounterStore & { clear: () => void } {
  const items = new Map<string, { value: unknown; expires: number }>();
  return {
    get: async (key) => {
      const item = items.get(key);
      if (!item) return null;
      if (item.expires <= clock()) {
        items.delete(key);
        return null;
      }
      return item.value;
    },
    set: async (key, value, { ttl }) => {
      if (items.size > 10_000) items.clear(); // memory guard on long-lived instances
      items.set(key, { value, expires: clock() + ttl * 1000 });
    },
    clear: () => items.clear(),
  };
}

const local = memoryStore();

/**
 * Counters shared by every instance: the Runtime Cache on Vercel (regional — functions run in
 * one region, fra1; production and previews never share it), process memory anywhere else. On the
 * Hobby plan all projects of the team share one cache, hence the namespace.
 */
export const sharedCounters = (): CounterStore =>
  process.env.VERCEL === '1' ? getCache({ namespace: 'nasim-site:limits' }) : local;

export type QuotaRule = RateLimitRule & {
  /** What the caller is told was exhausted. */
  name: string;
  key: string;
};

const windowKey = (rule: QuotaRule, now: number) =>
  `${rule.key}:${rule.windowMs}:${Math.floor(now / rule.windowMs)}`;

const count = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;

async function consume(store: CounterStore, rules: QuotaRule[], now: number) {
  const used = await Promise.all(rules.map((rule) => store.get(windowKey(rule, now))));
  const exhausted = rules.find((rule, i) => count(used[i]) >= rule.limit);
  if (exhausted) return exhausted.name;
  await Promise.all(
    rules.map((rule, i) =>
      store.set(windowKey(rule, now), count(used[i]) + 1, {
        // Until the window closes, plus a minute for clock skew between instances.
        ttl: Math.ceil((rule.windowMs - (now % rule.windowMs)) / 1000) + 60,
      }),
    ),
  );
  return null;
}

/**
 * Counts one hit against every rule. Returns null when all had room (each counter grows by one),
 * or the name of the first exhausted rule — then nothing is counted. A failing shared store never
 * opens the gate: the same rules are then enforced from this instance's memory.
 */
export async function consumeQuotas(
  store: CounterStore,
  rules: QuotaRule[],
  now = Date.now(),
): Promise<string | null> {
  try {
    return await consume(store, rules, now);
  } catch (error) {
    console.error('[ratelimit] shared store', error instanceof Error ? error.name : typeof error);
    return store === local ? null : consume(local, rules, now);
  }
}

/** Visible for tests. */
export const resetRateLimits = (): void => {
  buckets.clear();
  local.clear();
};

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
