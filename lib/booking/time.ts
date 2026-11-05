// Day and time-window options for the booking request (BRIEF §6.1, DECISIONS phase 3a).
// Every function takes the current moment as a value: nothing here reads the clock, so the
// wizard's first steps prerender deterministically and `ensureStatic` pages stay static.
import type { BookingSettings } from '@/lib/validation/settings';

export const DUBAI_TZ = 'Asia/Dubai';

/** Wall-clock moment in Dubai: ISO day, minutes since midnight, weekday (0 = Sunday). */
export type DubaiClock = { date: string; minutes: number; weekday: number };

export type WindowKey = BookingSettings['windows'][number]['key'] | 'any' | 'asap';
export type DayOption = { date: string; kind: 'today' | 'tomorrow' | 'date' };
export type WindowOption = {
  key: WindowKey;
  from: string | null;
  to: string | null;
  available: boolean;
  reason: 'tooLate' | null;
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function dubaiClock(now: Date): DubaiClock {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: DUBAI_TZ,
    hourCycle: 'h23',
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
    weekday: WEEKDAYS.indexOf(get('weekday')),
  };
}

export const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

/** 'YYYY-MM-DD' plus n calendar days (pure UTC arithmetic on the ISO day). */
export function addDays(isoDay: string, n: number): string {
  const [y, m, d] = isoDay.split('-').map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, (d ?? 1) + n)).toISOString().slice(0, 10);
}

/** Can a request for today still be taken? Normal cut-off, or the emergency line's closing time. */
export function todayAllowed(
  clock: DubaiClock,
  cfg: BookingSettings,
  opts: { emergency: boolean },
): boolean {
  const limit = toMinutes(opts.emergency ? cfg.emergency_until : cfg.same_day_cutoff);
  return clock.minutes < limit;
}

/** Days offered: today only while allowed, then tomorrow and the following dates. */
export function dayOptions(
  clock: DubaiClock,
  cfg: BookingSettings,
  opts: { emergency: boolean },
): DayOption[] {
  const days: DayOption[] = [];
  for (let i = 0; i < cfg.days_ahead; i += 1) {
    if (i === 0 && !todayAllowed(clock, cfg, opts)) continue;
    days.push({
      date: addDays(clock.date, i),
      kind: i === 0 ? 'today' : i === 1 ? 'tomorrow' : 'date',
    });
  }
  return days;
}

/**
 * Windows for a day. On the current day a window stays open while at least an hour is left after
 * the lead time; emergencies also get "as soon as possible".
 */
export function windowOptions(
  day: string,
  clock: DubaiClock,
  cfg: BookingSettings,
  opts: { emergency: boolean },
): WindowOption[] {
  const isToday = day === clock.date;
  const earliest = clock.minutes + cfg.lead_minutes;
  const windows: WindowOption[] = cfg.windows.map((w) => {
    const from = toMinutes(w.from);
    const to = toMinutes(w.to);
    const available = !isToday || to - Math.max(from, earliest) >= 60;
    return { key: w.key, from: w.from, to: w.to, available, reason: available ? null : 'tooLate' };
  });
  const anyAvailable = windows.some((w) => w.available);
  const result: WindowOption[] = [];
  if (isToday && opts.emergency && todayAllowed(clock, cfg, opts)) {
    result.push({ key: 'asap', from: null, to: null, available: true, reason: null });
  }
  result.push(...windows);
  result.push({
    key: 'any',
    from: null,
    to: null,
    available: anyAvailable || !isToday,
    reason: null,
  });
  return result;
}
