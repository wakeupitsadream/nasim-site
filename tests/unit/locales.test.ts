import { describe, expect, it } from 'vitest';
import { getDirection, routing } from '@/lib/i18n/routing';
import { formatAED, formatDay, formatNumber } from '@/lib/i18n/format';
import { i18nText, i18nValue } from '@/lib/validation/content';
import { settingsDefaultsSchema } from '@/lib/validation/settings';
import { z } from 'zod';

const translated = routing.locales.filter((l) => l !== 'en');

describe('locales', () => {
  it('lists the seven site languages, EN first, Arabic the only RTL one', () => {
    expect(routing.locales).toEqual(['en', 'ar', 'ru', 'fr', 'de', 'zh', 'hi']);
    expect(routing.locales.filter((l) => getDirection(l) === 'rtl')).toEqual(['ar']);
  });

  it('content schemas carry a key for every locale', () => {
    expect(Object.keys(i18nText.shape)).toEqual(['en', ...translated]);
    expect(Object.keys(i18nValue(z.string()).shape)).toEqual(['en', ...translated]);
    const settingsShape = settingsDefaultsSchema.shape as Record<string, unknown>;
    for (const l of routing.locales) expect(settingsShape[l]).toBeDefined();
  });

  it('formats dirhams and dates in every locale with Latin digits', () => {
    const norm = (s: string) => s.replace(/[  ]/g, ' ');
    expect(norm(formatAED(1499, 'fr'))).toBe('1 499 AED');
    expect(norm(formatAED(1499, 'de'))).toBe('1.499 AED');
    expect(norm(formatAED(1499, 'zh'))).toBe('AED 1,499');
    expect(norm(formatAED(1499, 'hi'))).toBe('AED 1,499');
    for (const l of routing.locales) {
      expect(formatNumber(149999, l)).toMatch(/^[0-9.,\s  ]+$/u);
      expect(formatDay('2026-11-06', l)).toContain('6');
    }
  });
});
