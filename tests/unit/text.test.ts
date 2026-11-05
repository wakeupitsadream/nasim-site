import { describe, expect, it } from 'vitest';
import { pick, pickLocalized, pickLocalizedValue } from '@/lib/i18n/text';

describe('pick', () => {
  const field = { en: 'AC cleaning', ru: 'Чистка кондиционеров', ar: '' };

  it('returns the requested locale', () => {
    expect(pick(field, 'ru')).toBe('Чистка кондиционеров');
    expect(pick(field, 'en')).toBe('AC cleaning');
  });

  it('falls back to EN when the locale is empty', () => {
    expect(pick(field, 'ar')).toBe('AC cleaning');
  });

  it('falls back to EN when the locale is missing or blank', () => {
    expect(pick({ en: 'x' }, 'ru')).toBe('x');
    expect(pick({ en: 'x', ru: '   ' }, 'ru')).toBe('x');
  });

  it('returns an empty string for no field', () => {
    expect(pick(null, 'en')).toBe('');
    expect(pick(undefined, 'ar')).toBe('');
  });
});

describe('pickLocalized', () => {
  const field = { en: 'Hours', ru: 'Часы', ar: ' ' };

  it('reports the locale the text came from', () => {
    expect(pickLocalized(field, 'ru')).toEqual({ text: 'Часы', lang: 'ru' });
    expect(pickLocalized(field, 'ar')).toEqual({ text: 'Hours', lang: 'en' });
    expect(pickLocalized(field, 'en')).toEqual({ text: 'Hours', lang: 'en' });
  });

  it('keeps the page locale for an empty field', () => {
    expect(pickLocalized(null, 'ar')).toEqual({ text: '', lang: 'ar' });
  });
});

describe('pickLocalizedValue', () => {
  const field = { en: ['a', 'b'], ru: ['а', 'б'], ar: [] as never[] };

  it('returns the locale value when it is present', () => {
    expect(pickLocalizedValue(field, 'ru')).toEqual({ value: ['а', 'б'], lang: 'ru' });
    expect(pickLocalizedValue(field, 'en')).toEqual({ value: ['a', 'b'], lang: 'en' });
  });

  it('treats empty arrays and objects as untranslated', () => {
    expect(pickLocalizedValue(field, 'ar')).toEqual({ value: ['a', 'b'], lang: 'en' });
    expect(pickLocalizedValue({ en: { header: 'x' }, ru: {} }, 'ru')).toEqual({
      value: { header: 'x' },
      lang: 'en',
    });
  });
});
