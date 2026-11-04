import type { Locale } from './routing';

// Arabic uses Latin digits (BRIEF §8). Currency codes and symbols are formatting constants, not UI strings.
const INTL_LOCALE: Record<Locale, string> = { en: 'en-AE', ar: 'ar-AE-u-nu-latn', ru: 'ru' };
const AED_LABEL: Record<Locale, string> = { en: 'AED', ar: 'د.إ', ru: 'AED' };
const NBSP = '\u00a0';

export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale], options).format(value);
}

/**
 * Whole dirhams: EN «AED 199», AR «199 د.إ», RU «199 AED».
 * The label is built by hand: ICU's Arabic currency format adds RLM marks and a trailing dot.
 */
export function formatAED(amount: number, locale: Locale): string {
  const n = formatNumber(amount, locale, { maximumFractionDigits: 0 });
  return locale === 'en' ? `${AED_LABEL.en}${NBSP}${n}` : `${n}${NBSP}${AED_LABEL[locale]}`;
}
