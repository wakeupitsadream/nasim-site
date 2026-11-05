import { describe, expect, it } from 'vitest';
import {
  formatAED,
  formatDay,
  formatMinutes,
  formatMonthYear,
  formatNumber,
  formatTimeRange,
} from '@/lib/i18n/format';
import { routing } from '@/lib/i18n/routing';

// ICU's grouping and spacing characters (NBSP vs narrow NBSP) differ between Node versions.
const norm = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ');
const ARABIC_INDIC_DIGITS = /[\u0660-\u0669\u06f0-\u06f9]/;

describe('formatAED', () => {
  it('follows BRIEF §8 per locale', () => {
    expect(norm(formatAED(199, 'en'))).toBe('AED 199');
    expect(norm(formatAED(199, 'ar'))).toBe('199 د.إ');
    expect(norm(formatAED(199, 'ru'))).toBe('199 AED');
  });

  it('groups thousands per locale', () => {
    expect(norm(formatAED(1499, 'en'))).toBe('AED 1,499');
    expect(norm(formatAED(1499, 'ar'))).toBe('1,499 د.إ');
    expect(norm(formatAED(1499, 'ru'))).toBe('1 499 AED');
  });

  it('rounds to whole dirhams', () => {
    expect(norm(formatAED(149.6, 'en'))).toBe('AED 150');
  });

  it('never emits RLM marks or Arabic-Indic digits', () => {
    for (const locale of routing.locales) {
      const out = formatAED(2499, locale);
      expect(out).not.toMatch(/\u200f/);
      expect(out).not.toMatch(ARABIC_INDIC_DIGITS);
    }
  });
});

describe('formatNumber', () => {
  it('uses Latin digits for Arabic', () => {
    expect(formatNumber(12345.5, 'ar')).toBe('12,345.5');
    expect(formatNumber(1234567, 'ar')).not.toMatch(ARABIC_INDIC_DIGITS);
  });

  it('uses Russian separators', () => {
    expect(norm(formatNumber(12345.5, 'ru'))).toBe('12 345,5');
  });
});

describe('dates and durations', () => {
  it('formats a day with Latin digits in every locale', () => {
    expect(norm(formatDay('2026-11-06', 'en'))).toBe('Fri, 6 Nov');
    expect(norm(formatDay('2026-11-06', 'ru'))).toBe('пт, 6 нояб.');
    expect(formatDay('2026-11-06', 'ar')).toContain('6');
    expect(formatDay('2026-11-06', 'ar')).not.toMatch(ARABIC_INDIC_DIGITS);
  });

  it('formats month and year', () => {
    expect(formatMonthYear('2027-07-01', 'en')).toBe('July 2027');
    expect(formatMonthYear('2027-07-01', 'ru')).toBe('июль 2027 г.');
    expect(formatMonthYear('2027-07-01', 'ar')).toBe('يوليو 2027');
  });

  it('formats time ranges and durations', () => {
    expect(formatTimeRange('08:00', '12:00')).toBe('08:00–12:00');
    expect(norm(formatMinutes(45, 'en'))).toBe('45 min');
    expect(norm(formatMinutes(45, 'ru'))).toBe('45 мин');
    expect(norm(formatMinutes(120, 'en'))).toBe('2 hr');
    expect(formatMinutes(90, 'ar')).not.toMatch(ARABIC_INDIC_DIGITS);
  });
});
