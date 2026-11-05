import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Sans_Arabic, Unbounded } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { Footer } from '@/components/marketing/footer';
import { Header } from '@/components/marketing/header';
import { StickyBar } from '@/components/marketing/sticky-bar';
import { TiltLayer } from '@/components/motion/tilt-layer';
import { DirectionProvider } from '@/components/ui/direction';
import { getSiteSettings } from '@/lib/content/site';
import { hasCanonicalDomain } from '@/lib/env';
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
  weight: ['400', '500', '600'], // no 700: headings and strong stop at 600 on /ar (one file less)
  variable: '--font-plex-arabic',
  display: 'swap',
  preload: false,
});
// Display face of the Brigada wordmark and h1/h2 (variable 200–900, Latin + Cyrillic; /ar keeps Plex).
const unbounded = Unbounded({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-unbounded',
  display: 'swap',
});

/** Namespaces read by client components (LangSwitcher, Sonner). Everything else stays on the server. */
const CLIENT_NAMESPACES = ['LangSwitcher', 'Common'] as const;

export const viewport: Viewport = { viewportFit: 'cover', themeColor: '#d4262a' };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const [t, settings] = await Promise.all([getTranslations('Meta'), getSiteSettings(locale)]);
  // Out of search until the own domain is set (*.vercel.app must not compete with it), and /ar
  // while the Arabic texts are drafts (settings flag ar_noindex).
  const noindex = !hasCanonicalDomain() || (locale === 'ar' && settings.flags.arNoindex);
  return {
    metadataBase: siteUrl(),
    title: { default: t('siteName'), template: t('titleTemplate') },
    description: t('description'),
    applicationName: t('siteName'),
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

// The only root layout of the public site: app/layout.tsx must not exist (next/root-params).
export default async function LocaleLayout({ children }: LayoutProps<'/[locale]'>) {
  const locale = await getLocale();
  const dir = getDirection(locale);
  const [t, messages] = await Promise.all([getTranslations('Common'), getMessages()]);
  const clientMessages = Object.fromEntries(CLIENT_NAMESPACES.map((ns) => [ns, messages[ns]]));

  return (
    // data-scroll-behavior: Next 16 then resets the smooth anchor scrolling (styles/motion.css)
    // to an instant jump during SPA navigations, so page transitions start from the top.
    <html
      lang={locale}
      dir={dir}
      data-scroll-behavior="smooth"
      className={`${plexSans.variable} ${plexArabic.variable} ${unbounded.variable}`}
    >
      <body className="flex min-h-dvh flex-col pb-[calc(var(--nasim-sticky-bar-h)+env(safe-area-inset-bottom))] md:pb-0">
        <DirectionProvider dir={dir}>
          <NextIntlClientProvider messages={clientMessages}>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:inset-s-3 focus:top-3 focus:z-60 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-3 focus:text-primary-foreground focus:outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {t('skipToContent')}
            </a>
            <Header />
            <main id="main" tabIndex={-1} className="flex-1 outline-none">
              {children}
            </main>
            <Footer />
            <StickyBar />
            {/* The red curtain of page transitions: parked off-screen, its view-transition group
                sweeps across on link navigations (styles/motion.css, DECISIONS №52). */}
            <div
              aria-hidden="true"
              className="page-curtain"
              style={{ viewTransitionName: 'page-curtain' }}
            />
            <TiltLayer />
          </NextIntlClientProvider>
        </DirectionProvider>
      </body>
    </html>
  );
}
