import type { Locale } from './routing';

/** A localized content field as stored in the database (JSONB). EN is always present. */
export type I18nText = { en: string } & Partial<Record<Exclude<Locale, 'en'>, string>>;

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

/** A localized structured value (array or object) with its source locale. */
export type LocalizedValue<T> = { value: T; lang: Locale };

/**
 * `pickLocalized` for structured content (`{ en: T; ar?: T; ru?: T; … }`). A missing locale, an
 * empty array or an empty object counts as untranslated and falls back to EN.
 */
export function pickLocalizedValue<T>(
  field: { en: T } & Partial<Record<Exclude<Locale, 'en'>, unknown>>,
  locale: Locale,
): LocalizedValue<T> {
  const candidate = locale === 'en' ? field.en : field[locale];
  if (isPresent(candidate)) return { value: candidate as T, lang: locale };
  return { value: field.en, lang: 'en' };
}

function isPresent(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  if (typeof value === 'string') return value.trim() !== '';
  return true;
}
