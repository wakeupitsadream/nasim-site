// Site settings: `settings.defaults` from content/seed/blocks.json (EN defaults + locale
// overrides) with what the owner saved in /admin → Settings on top (contacts, legal details,
// VAT, flags). The stored part is cached under the `settings` tag.
import blocks from '@/content/seed/blocks.json';
import type { Locale } from '@/lib/i18n/routing';
import { pickLocalized, type I18nText, type Localized } from '@/lib/i18n/text';
import { getOverrides } from '@/lib/db/queries/overrides';
import {
  settingsDefaultsSchema,
  siteOverrideSchema,
  type BookingSettings,
  type SiteOverride,
  type SettingsDefaults,
  type SettingsLocaleFields,
} from '@/lib/validation/settings';

export type SiteFlags = {
  arNoindex: boolean;
  showReviews: boolean;
  emergencyEnabled: boolean;
  telegramCtaRu: boolean;
};
/** Phone and WhatsApp in E.164, Telegram as a handle. Empty string = not known yet → hidden. */
export type SiteContacts = { phone: string; whatsapp: string; telegram: string; email: string };
export type SiteSocial = { instagram: string; facebook: string; tiktok: string };
export type SiteLegal = { legalName: string; licenseNo: string; trn: string; address: string };
/** `registered` false → prices show no VAT line at all (BRIEF §6.3). */
export type SiteVat = { registered: boolean; included: boolean };

export type SiteSettings = {
  brandName: Localized;
  hours: Localized;
  emergencyHours: Localized;
  serviceAreaNote: Localized;
  responseTimeNote: Localized;
  flags: SiteFlags;
  booking: BookingSettings;
  vat: SiteVat;
  contacts: SiteContacts;
  social: SiteSocial;
  legal: SiteLegal;
};

// The owner has not answered the questionnaire yet (contacts, socials, legal details).
// Empty = hidden in the UI and CTAs lead to /contact. Never put invented values here.
const PENDING_CONTACTS: SiteContacts = { phone: '', whatsapp: '', telegram: '', email: '' };
const PENDING_SOCIAL: SiteSocial = { instagram: '', facebook: '', tiktok: '' };
const PENDING_LEGAL: SiteLegal = { legalName: '', licenseNo: '', trn: '', address: '' };

let parsed: SettingsDefaults | undefined;

function defaults(): SettingsDefaults {
  if (parsed) return parsed;
  const block = blocks.blocks.find((b) => b.key === 'settings.defaults');
  if (!block) throw new Error('content/seed/blocks.json: settings.defaults is missing');
  parsed = settingsDefaultsSchema.parse(block.value);
  return parsed;
}

type FieldKey = keyof SettingsLocaleFields;

function field(d: SettingsDefaults, key: FieldKey): I18nText {
  return {
    en: d.en[key],
    ar: d.ar?.[key],
    ru: d.ru?.[key],
    fr: d.fr?.[key],
    de: d.de?.[key],
    zh: d.zh?.[key],
    hi: d.hi?.[key],
  };
}

export function readSiteSettings(locale: Locale): SiteSettings {
  const d = defaults();
  const f = d.en.flags;
  return {
    brandName: pickLocalized(field(d, 'brand_name'), locale),
    hours: pickLocalized(field(d, 'hours'), locale),
    emergencyHours: pickLocalized(field(d, 'emergency_hours'), locale),
    serviceAreaNote: pickLocalized(field(d, 'service_area_note'), locale),
    responseTimeNote: pickLocalized(field(d, 'response_time_note'), locale),
    flags: {
      arNoindex: f.ar_noindex,
      showReviews: f.show_reviews,
      emergencyEnabled: f.emergency_enabled,
      telegramCtaRu: f.telegram_cta_ru,
    },
    booking: d.en.booking,
    vat: { registered: d.en.vat_registered, included: d.en.vat_included },
    contacts: PENDING_CONTACTS,
    social: PENDING_SOCIAL,
    legal: PENDING_LEGAL,
  };
}

/** The owner's stored settings (admin → Settings), or null: no database, nothing saved, or a
 * stored value that no longer fits the schema (logged, the defaults are shown). */
async function storedOverride(): Promise<Partial<SiteOverride> | null> {
  const stored = (await getOverrides('settings')).site;
  if (!stored) return null;
  const parsed = siteOverrideSchema.partial().safeParse(stored);
  if (parsed.success) return parsed.data;
  console.error('[settings] stored settings do not match the schema; defaults are shown');
  return null;
}

export async function getSiteSettings(locale: Locale): Promise<SiteSettings> {
  const base = readSiteSettings(locale);
  const o = await storedOverride();
  if (!o) return base;
  return {
    ...base,
    contacts: { ...base.contacts, ...o.contacts },
    social: { ...base.social, ...o.social },
    legal: { ...base.legal, ...o.legal },
    vat: o.vat ?? base.vat,
    flags: { ...base.flags, ...o.flags },
  };
}

/** The editable settings as the admin form shows them: stored values over the defaults. */
export async function getEditableSettings(): Promise<SiteOverride> {
  const s = await getSiteSettings('en');
  return {
    contacts: s.contacts,
    social: s.social,
    legal: s.legal,
    vat: s.vat,
    flags: {
      emergencyEnabled: s.flags.emergencyEnabled,
      showReviews: s.flags.showReviews,
      telegramCtaRu: s.flags.telegramCtaRu,
    },
  };
}

/** True when at least one value is filled in. */
export const hasAny = (o: Record<string, string>): boolean =>
  Object.values(o).some((v) => v.trim() !== '');
