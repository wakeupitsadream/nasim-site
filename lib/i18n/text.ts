import type { Locale } from './routing';

/** A localized content field as stored in the database (JSONB). EN is always present. */
export type I18nText = { en: string; ar?: string; ru?: string };

/** The value for `locale`, or EN when it is missing or blank. */
export function pick(field: I18nText | null | undefined, locale: Locale): string {
  if (!field) return '';
  const value = field[locale];
  return value && value.trim() !== '' ? value : field.en;
}

/** A picked value plus the locale it actually came from (EN when the locale fell back). */
export type Localized = { text: string; lang: Locale };

/**
 * Like `pick`, but also says which locale the text is in, so a fallback-EN value on /ar can be
 * rendered with `lang="en" dir="auto"` (screen readers switch voice, bidi stays correct).
 */
export function pickLocalized(field: I18nText | null | undefined, locale: Locale): Localized {
  if (!field) return { text: '', lang: locale };
  const value = field[locale];
  return value && value.trim() !== ''
    ? { text: value, lang: locale }
    : { text: field.en, lang: 'en' };
}
