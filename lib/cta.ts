import type { SiteContacts, SiteSettings } from '@/lib/content/site';
import type { Locale } from '@/lib/i18n/routing';
import { waMeUrl } from '@/lib/whatsapp';

// Where a contact CTA leads. A missing contact never produces a dead or invented link:
// the CTA falls back to the /contact page (DECISIONS: empty contacts → /contact).
export type CtaTarget =
  { kind: 'internal'; href: '/contact' } | { kind: 'external'; href: string; newTab: boolean };

const CONTACT: CtaTarget = { kind: 'internal', href: '/contact' };

export function whatsappTarget(c: SiteContacts, text?: string): CtaTarget {
  const url = waMeUrl(c.whatsapp, text);
  return url ? { kind: 'external', href: url, newTab: true } : CONTACT;
}

/** Ordinary phone call (WhatsApp/Telegram calls are blocked in the UAE — rule 16). */
export function callTarget(c: SiteContacts): CtaTarget {
  const number = c.phone.replace(/[^\d+]/g, '');
  return number.replace(/\D/g, '').length >= 8
    ? { kind: 'external', href: `tel:${number}`, newTab: false }
    : CONTACT;
}

export function telegramTarget(c: SiteContacts): CtaTarget {
  const handle = c.telegram.trim().replace(/^@|^https?:\/\/t\.me\//, '');
  return /^[A-Za-z0-9_]{5,32}$/.test(handle)
    ? { kind: 'external', href: `https://t.me/${handle}`, newTab: true }
    : CONTACT;
}

/** Telegram CTA is shown only on /ru and only when the owner turned it on. */
export const showTelegramCta = (locale: Locale, s: SiteSettings): boolean =>
  locale === 'ru' && s.flags.telegramCtaRu;
