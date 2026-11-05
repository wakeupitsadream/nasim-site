import { describe, expect, it } from 'vitest';
import { seedBlock } from '@/lib/content/seed';
import { buildQuoteMessage, fillTemplate, waMeUrl } from '@/lib/whatsapp';

describe('waMeUrl', () => {
  it('strips the plus and encodes the text', () => {
    expect(waMeUrl('+971501234567', 'Hi & hello')).toBe(
      'https://wa.me/971501234567?text=Hi%20%26%20hello',
    );
    expect(waMeUrl('')).toBeNull();
  });
});

describe('fillTemplate', () => {
  const generic = seedBlock('wa.template.generic');

  it('fills placeholders and keeps groups whose values are present', () => {
    const text = fillTemplate(generic.en, {
      brand: 'Nasim',
      service: 'AC Cleaning',
      units: 3,
      area: 'JLT',
      time: 'tomorrow morning',
      page: 'services/ac-cleaning',
    });
    expect(text).toBe(
      "Hi Nasim! I'd like to book AC Cleaning — 3 units in JLT. Preferred time: tomorrow morning. — from website/services/ac-cleaning",
    );
  });

  it('drops groups whose placeholders are empty and leaves no braces behind', () => {
    const text = fillTemplate(generic.en, { brand: 'Nasim', service: 'AC Cleaning', page: 'home' });
    expect(text).toBe("Hi Nasim! I'd like to book AC Cleaning. — from website/home");
    expect(text).not.toMatch(/[{}()]/);
  });

  it('works for the Arabic template', () => {
    const text = fillTemplate(generic.ar ?? '', {
      brand: 'نسيم',
      service: 'تنظيف المكيف',
      page: 'home',
    });
    expect(text).toContain('نسيم');
    expect(text).toContain('تنظيف المكيف');
    expect(text).not.toMatch(/[{}()]/);
  });

  it('keeps literal parentheses that hold no placeholders', () => {
    expect(fillTemplate('Call (free) {x}', { x: 'now' })).toBe('Call (free) now');
  });
});

describe('buildQuoteMessage', () => {
  it('joins the quote lines and omits empty area and time', () => {
    const template = seedBlock('wa.template.quote').en;
    const text = buildQuoteMessage({
      template,
      brand: 'Nasim',
      lines: ['AC Cleaning × 3', 'Sofa cleaning × 3 seats'],
      total: 'AED 599',
    });
    expect(text).toBe(
      "Hi Nasim! I'd like to book this: AC Cleaning × 3, Sofa cleaning × 3 seats. Total AED 599. — from website/calculator",
    );
  });
});
