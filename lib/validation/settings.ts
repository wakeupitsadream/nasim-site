import { z } from 'zod';

// Shape of `settings.defaults` in content/seed/blocks.json (snake_case, as stored).
// Phase 2 reuses it for the `settings` table seed; unknown keys (glossary, VAT) pass through.
const localeFields = z.object({
  brand_name: z.string(),
  hours: z.string(),
  emergency_hours: z.string(),
  service_area_note: z.string(),
  response_time_note: z.string(),
});

export const settingsFlagsSchema = z.object({
  ar_noindex: z.boolean(),
  show_reviews: z.boolean(),
  emergency_enabled: z.boolean(),
  telegram_cta_ru: z.boolean(),
});

const hhmm = z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM');

/** Booking-request windows (BRIEF §6.1, phase 3a). Times are Asia/Dubai wall-clock. */
export const bookingSettingsSchema = z.object({
  days_ahead: z.number().int().min(1).max(30),
  lead_minutes: z.number().int().nonnegative(),
  same_day_cutoff: hhmm,
  emergency_until: hhmm,
  windows: z
    .array(z.object({ key: z.enum(['morning', 'afternoon', 'evening']), from: hhmm, to: hhmm }))
    .min(1),
});

export const settingsDefaultsSchema = z.looseObject({
  en: z.looseObject({
    ...localeFields.shape,
    flags: settingsFlagsSchema,
    booking: bookingSettingsSchema,
    vat_registered: z.boolean(),
    vat_included: z.boolean(),
  }),
  ar: localeFields.partial().optional(),
  ru: localeFields.partial().optional(),
  fr: localeFields.partial().optional(),
  de: localeFields.partial().optional(),
  es: localeFields.partial().optional(),
  zh: localeFields.partial().optional(),
  hi: localeFields.partial().optional(),
});

export type SettingsDefaults = z.infer<typeof settingsDefaultsSchema>;
export type SettingsLocaleFields = z.infer<typeof localeFields>;
export type BookingSettings = z.infer<typeof bookingSettingsSchema>;

// ---- What the owner edits in /admin → Settings (stored as the `settings/site` content override) ----

const text = (max: number) => z.string().trim().max(max);
/** E.164 (`+971501234567`) or empty: an empty contact is hidden on the site, never invented. */
const e164OrEmpty = text(20).refine((v) => v === '' || /^\+[1-9]\d{7,14}$/.test(v), 'phone');
const emailOrEmpty = z.union([z.literal(''), z.email().max(120)]);
const urlOrEmpty = z.union([z.literal(''), z.url({ protocol: /^https$/ }).max(200)]);

export const siteOverrideSchema = z.object({
  contacts: z.object({
    phone: e164OrEmpty,
    whatsapp: e164OrEmpty,
    /** A handle without @ or a t.me link; lib/cta.ts accepts both. */
    telegram: text(64),
    email: emailOrEmpty,
  }),
  social: z.object({ instagram: urlOrEmpty, facebook: urlOrEmpty, tiktok: urlOrEmpty }),
  legal: z.object({
    legalName: text(120),
    licenseNo: text(60),
    trn: text(30),
    address: text(200),
  }),
  vat: z.object({ registered: z.boolean(), included: z.boolean() }),
  flags: z.object({
    emergencyEnabled: z.boolean(),
    showReviews: z.boolean(),
    telegramCtaRu: z.boolean(),
  }),
});
export type SiteOverride = z.infer<typeof siteOverrideSchema>;
