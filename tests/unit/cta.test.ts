import { describe, expect, it } from 'vitest';
import { readSiteSettings, type SiteContacts } from '@/lib/content/site';
import { callTarget, showTelegramCta, telegramTarget, whatsappTarget } from '@/lib/cta';
import { waMeUrl } from '@/lib/whatsapp';

const empty: SiteContacts = { phone: '', whatsapp: '', telegram: '', email: '' };
const filled: SiteContacts = {
  phone: '+971501234567',
  whatsapp: '+971501234567',
  telegram: '@nasim_care',
  email: 'hello@example.com',
};

describe('CTA targets', () => {
  it('send every CTA to /contact while contacts are empty', () => {
    for (const target of [whatsappTarget(empty), callTarget(empty), telegramTarget(empty)]) {
      expect(target).toEqual({ kind: 'internal', href: '/contact' });
    }
  });

  it('build real links once contacts exist', () => {
    expect(whatsappTarget(filled)).toEqual({
      kind: 'external',
      href: 'https://wa.me/971501234567',
      newTab: true,
    });
    expect(callTarget(filled)).toEqual({
      kind: 'external',
      href: 'tel:+971501234567',
      newTab: false,
    });
    expect(telegramTarget(filled)).toEqual({
      kind: 'external',
      href: 'https://t.me/nasim_care',
      newTab: true,
    });
  });

  it('accepts a t.me URL as the Telegram handle and rejects junk', () => {
    expect(telegramTarget({ ...empty, telegram: 'https://t.me/nasim_care' }).href).toBe(
      'https://t.me/nasim_care',
    );
    expect(telegramTarget({ ...empty, telegram: '@ab' }).href).toBe('/contact');
  });

  it('adds prefilled WhatsApp text', () => {
    expect(waMeUrl('+971501234567', 'Hi & hello')).toBe(
      'https://wa.me/971501234567?text=Hi%20%26%20hello',
    );
  });
});

describe('showTelegramCta', () => {
  it('is off everywhere while the flag is off', () => {
    const s = readSiteSettings('ru');
    expect(showTelegramCta('ru', s)).toBe(false);
  });

  it('is on only for ru when the flag is on', () => {
    const base = readSiteSettings('ru');
    const s = { ...base, flags: { ...base.flags, telegramCtaRu: true } };
    expect(showTelegramCta('ru', s)).toBe(true);
    expect(showTelegramCta('en', s)).toBe(false);
    expect(showTelegramCta('ar', s)).toBe(false);
  });
});
