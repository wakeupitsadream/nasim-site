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

export const settingsDefaultsSchema = z.looseObject({
  en: z.looseObject({ ...localeFields.shape, flags: settingsFlagsSchema }),
  ar: localeFields.partial().optional(),
  ru: localeFields.partial().optional(),
});

export type SettingsDefaults = z.infer<typeof settingsDefaultsSchema>;
export type SettingsLocaleFields = z.infer<typeof localeFields>;
