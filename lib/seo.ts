import type { Metadata } from 'next';
import { getPathname } from '@/lib/i18n/navigation';
import { routing, type Locale } from '@/lib/i18n/routing';

/** canonical + hreflang for every locale and x-default (EN). Relative URLs resolve against metadataBase. */
export function alternatesFor(locale: Locale, href: string): Metadata['alternates'] {
  return {
    canonical: getPathname({ locale, href }),
    languages: {
      ...Object.fromEntries(routing.locales.map((l) => [l, getPathname({ locale: l, href })])),
      'x-default': getPathname({ locale: routing.defaultLocale, href }),
    },
  };
}

export function siteUrl(): URL {
  return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000');
}
