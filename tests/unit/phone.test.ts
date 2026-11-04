import { describe, expect, it } from 'vitest';
import {
  formatAsYouType,
  formatPhoneForDisplay,
  isValidPhone,
  toE164,
} from '@/lib/validation/phone';

describe('toE164', () => {
  it.each([
    ['050 123 4567', '+971501234567'],
    ['+971 50 123 4567', '+971501234567'],
    ['00971501234567', '+971501234567'],
    ['04 123 4567', '+97141234567'],
    ['+7 916 123-45-67', '+79161234567'],
    ['+44 20 7946 0958', '+442079460958'],
  ])('%s → %s', (input, expected) => {
    expect(toE164(input)).toBe(expected);
  });

  it.each(['', '   ', '123', 'abc', '+971 50 123'])('rejects %j', (input) => {
    expect(toE164(input)).toBeNull();
    expect(isValidPhone(input)).toBe(false);
  });

  it('reads national input with another default country', () => {
    expect(toE164('8 916 123-45-67', 'RU')).toBe('+79161234567');
  });
});

describe('formatAsYouType', () => {
  it('formats a UAE mobile and returns E.164', () => {
    const { text, e164 } = formatAsYouType('0501234567');
    expect(e164).toBe('+971501234567');
    expect(text).toContain(' ');
  });

  it('returns empty E.164 for empty input', () => {
    expect(formatAsYouType('')).toEqual({ text: '', e164: '' });
  });
});

describe('formatPhoneForDisplay', () => {
  it('uses the international format', () => {
    expect(formatPhoneForDisplay('+971501234567')).toBe('+971 50 123 4567');
  });

  it('returns unknown input unchanged', () => {
    expect(formatPhoneForDisplay('nope')).toBe('nope');
  });
});
