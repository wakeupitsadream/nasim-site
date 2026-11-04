import { describe, expect, it } from 'vitest';
import { hasAny, readSiteSettings } from '@/lib/content/site';
import blocks from '@/content/seed/blocks.json';
import { settingsDefaultsSchema } from '@/lib/validation/settings';

describe('readSiteSettings', () => {
  it('uses the locale value when present', () => {
    expect(readSiteSettings('ru').hours).toEqual({ text: 'Ежедневно 8:00–20:00', lang: 'ru' });
  });

  it('falls back to EN and says so', () => {
    expect(readSiteSettings('ar').hours).toEqual({ text: 'Daily 8:00–20:00', lang: 'en' });
  });

  it('reads the Arabic brand name', () => {
    expect(readSiteSettings('ar').brandName).toEqual({ text: 'نسيم للعناية بالمنزل', lang: 'ar' });
  });

  it('takes flags from EN', () => {
    const { flags } = readSiteSettings('ru');
    expect(flags.telegramCtaRu).toBe(false);
    expect(flags.arNoindex).toBe(true);
  });

  it('keeps contacts, socials and legal details empty until the owner provides them', () => {
    const s = readSiteSettings('en');
    expect(hasAny(s.contacts)).toBe(false);
    expect(hasAny(s.social)).toBe(false);
    expect(hasAny(s.legal)).toBe(false);
  });
});

describe('settings seed', () => {
  it('matches the schema', () => {
    const block = blocks.blocks.find((b) => b.key === 'settings.defaults');
    expect(settingsDefaultsSchema.safeParse(block?.value).success).toBe(true);
  });

  it('rejects a seed without flags', () => {
    const broken = {
      en: {
        brand_name: 'x',
        hours: '',
        emergency_hours: '',
        service_area_note: '',
        response_time_note: '',
      },
    };
    expect(settingsDefaultsSchema.safeParse(broken).success).toBe(false);
  });
});

describe('hasAny', () => {
  it('ignores blanks', () => {
    expect(hasAny({ a: ' ', b: '' })).toBe(false);
    expect(hasAny({ a: '', b: 'x' })).toBe(true);
  });
});
