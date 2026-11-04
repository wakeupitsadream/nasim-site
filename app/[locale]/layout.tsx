import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Sans_Arabic } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { DirectionProvider } from '@/components/ui/direction';
import { getDirection, routing } from '@/lib/i18n/routing';
import { siteUrl } from '@/lib/seo';
import '../globals.css';

// Both fonts are declared here because a root layout cannot pick fonts per locale without
// becoming dynamic. The Arabic one is not preloaded, so /en and /ru never download it;
// html[lang="ar"] switches --nasim-font to it (styles/design-tokens.css).
const plexSans = IBM_Plex_Sans({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-plex',
  display: 'swap',
});
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-arabic',
  display: 'swap',
  preload: false,
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  return {
    metadataBase: siteUrl(),
    title: { default: t('siteName'), template: t('titleTemplate') },
    description: t('description'),
    applicationName: t('siteName'),
  };
}

// The only root layout of the public site: app/layout.tsx must not exist (next/root-params).
export default async function LocaleLayout({ children }: LayoutProps<'/[locale]'>) {
  const locale = await getLocale();
  const dir = getDirection(locale);

  return (
    <html lang={locale} dir={dir} className={`${plexSans.variable} ${plexArabic.variable}`}>
      <body>
        <DirectionProvider dir={dir}>
          <NextIntlClientProvider>{children}</NextIntlClientProvider>
        </DirectionProvider>
      </body>
    </html>
  );
}
