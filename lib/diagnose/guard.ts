// How much of the paid model one visitor, and the whole site, may use (DECISIONS №84). Server-only.
// Every number here bounds money: a request costs at most `maxTokens` of output plus the prompt,
// so requests per day × that is the worst bill. Tighten here, not in the route.
import {
  allow,
  consumeQuotas,
  sharedCounters,
  type CounterStore,
  type QuotaRule,
} from '@/lib/ratelimit';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const DIAGNOSE_LIMITS = {
  /** Back-to-back questions from one address (per instance, instant). */
  burst: { limit: 4, windowMs: MINUTE },
  /** Everything one instance will send to the model in a minute. */
  instance: { limit: 40, windowMs: MINUTE },
  /** One address across all instances. Generous: UAE mobile carriers put many people behind one IP. */
  visitorHour: { limit: 10, windowMs: HOUR },
  visitorDay: { limit: 25, windowMs: DAY },
  /** The whole site per day: the ceiling of the daily bill whatever the traffic or the attack. */
  siteDay: { limit: 400, windowMs: DAY },
} as const;

/** `AI_DAILY_LIMIT` overrides the site-wide daily ceiling (a positive integer). */
export function siteDayLimit(env: NodeJS.ProcessEnv = process.env): number {
  const value = Number(env.AI_DAILY_LIMIT);
  return Number.isInteger(value) && value > 0 ? value : DIAGNOSE_LIMITS.siteDay.limit;
}

/** Per-instance burst check: call before reading the body, so a flood costs nothing. */
export const allowBurst = (visitor: string, now?: number): boolean =>
  allow(`diagnose:${visitor}`, DIAGNOSE_LIMITS.burst, now) &&
  allow('diagnose:all', DIAGNOSE_LIMITS.instance, now);

/**
 * Hour and day quotas, counted only for requests that are about to reach the model. Returns the
 * exhausted quota's name, or null to proceed.
 */
export function consumeDiagnoseQuota(
  visitor: string,
  store: CounterStore = sharedCounters(),
  now?: number,
): Promise<string | null> {
  const rules: QuotaRule[] = [
    { name: 'visitor_hour', key: `diagnose:v:${visitor}`, ...DIAGNOSE_LIMITS.visitorHour },
    { name: 'visitor_day', key: `diagnose:v:${visitor}`, ...DIAGNOSE_LIMITS.visitorDay },
    { name: 'site_day', key: 'diagnose:site', windowMs: DAY, limit: siteDayLimit() },
  ];
  return consumeQuotas(store, rules, now);
}
