import { defineRouting } from 'next-intl/routing';

// Order = order in the language menu. EN is the source language of every content field.
export const routing = defineRouting({
  locales: ['en', 'ar', 'ru', 'fr', 'de', 'zh', 'hi'],
  defaultLocale: 'en',
  localePrefix: 'always',
  // hreflang comes from generateMetadata + sitemap (BRIEF §9.6), not from a Link header.
  alternateLinks: false,
});

export type Locale = (typeof routing.locales)[number];

/** Hardcoded on purpose: Intl.Locale#getTextInfo is missing on Node 22. */
export function getDirection(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}
