import type { Locale } from './routing';

// Arabic uses Latin digits (BRIEF §8). Currency codes and symbols are formatting constants, not UI strings.
const INTL_LOCALE: Record<Locale, string> = {
  en: 'en-AE',
  ar: 'ar-AE-u-nu-latn',
  ru: 'ru',
  fr: 'fr-FR',
  de: 'de-DE',
  zh: 'zh-CN',
  hi: 'hi-IN',
};
const AED_LABEL: Record<Locale, string> = {
  en: 'AED',
  ar: 'د.إ',
  ru: 'AED',
  fr: 'AED',
  de: 'AED',
  zh: 'AED',
  hi: 'AED',
};
/** Where the code goes before the number («AED 199»); elsewhere it follows («199 AED»). */
const CODE_FIRST: ReadonlySet<Locale> = new Set(['en', 'zh', 'hi']);
const NBSP = '\u00a0';

export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale], options).format(value);
}

/**
 * Whole dirhams: EN/ZH/HI «AED 199», AR «199 د.إ», RU/FR/DE «199 AED».
 * The label is built by hand: ICU's Arabic currency format adds RLM marks and a trailing dot.
 */
export function formatAED(amount: number, locale: Locale): string {
  const n = formatNumber(amount, locale, { maximumFractionDigits: 0 });
  return CODE_FIRST.has(locale)
    ? `${AED_LABEL[locale]}${NBSP}${n}`
    : `${n}${NBSP}${AED_LABEL[locale]}`;
}

const DATE_LOCALE: Record<Locale, string> = INTL_LOCALE;

/** Parses 'YYYY-MM-DD' as a UTC date so formatting never depends on the server time zone. */
function utcDate(isoDay: string): Date {
  const [y, m, d] = isoDay.split('-').map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
}

/** «Fri, 6 Nov» / «пт, 6 нояб.» / «الجمعة، 6 نوفمبر» for a 'YYYY-MM-DD' day. */
export function formatDay(isoDay: string, locale: Locale): string {
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(utcDate(isoDay));
}

/** «July 2027» / «июль 2027» / «يوليو 2027» for a 'YYYY-MM-DD' day. */
export function formatMonthYear(isoDay: string, locale: Locale): string {
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(utcDate(isoDay));
}

/** «08:00–12:00». Wall-clock 24h times are the same in every locale (Latin digits). */
export function formatTimeRange(from: string, to: string): string {
  return `${from}–${to}`;
}

/** «45 min» / «45 мин» / «45 د»; whole hours as «2 hr». Unit names come from ICU, not messages. */
export function formatMinutes(minutes: number, locale: Locale): string {
  const wholeHours = minutes >= 60 && minutes % 60 === 0;
  return formatNumber(wholeHours ? minutes / 60 : minutes, locale, {
    style: 'unit',
    unit: wholeHours ? 'hour' : 'minute',
    unitDisplay: 'short',
  });
}
