import type { Locale } from './routing';

/** A localized content field as stored in the database (JSONB). EN is always present. */
export type I18nText = { en: string; ar?: string; ru?: string };

/** The value for `locale`, or EN when it is missing or blank. */
export function pick(field: I18nText | null | undefined, locale: Locale): string {
  if (!field) return '';
  const value = field[locale];
  return value && value.trim() !== '' ? value : field.en;
}
