import { describe, expect, it } from 'vitest';
import { addDays, dayOptions, dubaiClock, todayAllowed, windowOptions } from '@/lib/booking/time';
import { readSiteSettings } from '@/lib/content/site';

const cfg = readSiteSettings('en').booking;
const at = (iso: string) => dubaiClock(new Date(iso));
const normal = { emergency: false };
const emergency = { emergency: true };

describe('dubaiClock', () => {
  it('converts UTC to Dubai wall-clock time (UTC+4)', () => {
    expect(at('2026-11-05T05:30:00Z')).toEqual({
      date: '2026-11-05',
      minutes: 9 * 60 + 30,
      weekday: 4,
    });
  });

  it('rolls over to the next day after 20:00 UTC', () => {
    expect(at('2026-11-05T20:30:00Z')).toEqual({ date: '2026-11-06', minutes: 30, weekday: 5 });
  });
});

describe('addDays', () => {
  it('crosses month and year ends', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('dayOptions', () => {
  it('offers today in the morning', () => {
    const days = dayOptions(at('2026-11-05T05:30:00Z'), cfg, normal);
    expect(days.length).toBe(7);
    expect(days[0]).toEqual({ date: '2026-11-05', kind: 'today' });
    expect(days[1]).toEqual({ date: '2026-11-06', kind: 'tomorrow' });
    expect(days[2]?.kind).toBe('date');
  });

  it('drops today after the cut-off, except for emergencies until the line closes', () => {
    const clock = at('2026-11-05T12:30:00Z'); // 16:30 Dubai
    expect(todayAllowed(clock, cfg, normal)).toBe(false);
    expect(dayOptions(clock, cfg, normal)[0]).toEqual({ date: '2026-11-06', kind: 'tomorrow' });
    expect(todayAllowed(clock, cfg, emergency)).toBe(true);
    expect(dayOptions(clock, cfg, emergency)[0]?.kind).toBe('today');
    expect(todayAllowed(at('2026-11-05T18:30:00Z'), cfg, emergency)).toBe(false); // 22:30
  });
});

describe('windowOptions', () => {
  const today = '2026-11-05';

  it('closes windows that cannot fit an hour after the lead time', () => {
    const keys = (iso: string) =>
      windowOptions(today, at(iso), cfg, normal)
        .filter((w) => w.available)
        .map((w) => w.key);
    expect(keys('2026-11-05T05:30:00Z')).toEqual(['morning', 'afternoon', 'evening', 'any']); // 09:30
    expect(keys('2026-11-05T07:00:00Z')).toEqual(['afternoon', 'evening', 'any']); // 11:00 + 90 → 12:30
    expect(keys('2026-11-05T11:59:00Z')).toEqual(['evening', 'any']); // 15:59
  });

  it('marks closed windows with a reason', () => {
    const morning = windowOptions(today, at('2026-11-05T07:00:00Z'), cfg, normal)[0];
    expect(morning).toMatchObject({ key: 'morning', available: false, reason: 'tooLate' });
  });

  it('opens everything for a later day', () => {
    const options = windowOptions('2026-11-06', at('2026-11-05T11:59:00Z'), cfg, normal);
    expect(options.every((w) => w.available)).toBe(true);
    expect(options.map((w) => w.key)).toEqual(['morning', 'afternoon', 'evening', 'any']);
  });

  it('adds "as soon as possible" for emergencies today', () => {
    const options = windowOptions(today, at('2026-11-05T13:00:00Z'), cfg, emergency); // 17:00
    expect(options[0]).toMatchObject({ key: 'asap', available: true });
    expect(options.find((w) => w.key === 'evening')?.available).toBe(true); // 18:30–20:00 fits
    expect(windowOptions('2026-11-06', at('2026-11-05T13:00:00Z'), cfg, emergency)[0]?.key).toBe(
      'morning',
    );
  });
});
