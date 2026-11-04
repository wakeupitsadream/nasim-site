import { describe, expect, it } from 'vitest';
import { pick } from '@/lib/i18n/text';

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
