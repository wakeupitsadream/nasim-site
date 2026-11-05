import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { WhatsAppIcon } from '@/components/icons/brand';
import { CtaLink } from '@/components/marketing/cta-link';
import { LangMenu, LangMenuFor } from '@/components/marketing/lang-switcher';
import { Logo } from '@/components/marketing/logo';
import { MobileMenu } from '@/components/marketing/mobile-menu';
import { getSiteSettings } from '@/lib/content/site';
import { whatsappTarget } from '@/lib/cta';
import { Link } from '@/lib/i18n/navigation';
import { MAIN_NAV } from '@/lib/nav';

// Server component. Reads no cookies/headers, so [slug] pages stay fully static (DECISIONS №17).
// Desktop navigation from xl: at 1024px the RU/AR labels do not fit next to the logo and CTA.
export async function Header() {
  const locale = await getLocale();
  const [t, tNav, tCta, tCommon, settings] = await Promise.all([
    getTranslations('Header'),
    getTranslations('Nav'),
    getTranslations('Cta'),
    getTranslations('Common'),
    getSiteSettings(locale),
  ]);
  const nav = MAIN_NAV.map(({ key, href }) => ({ href, label: tNav(key) }));
  const whatsapp = whatsappTarget(settings.contacts);
  const newTabHint = tCommon('opensInNewTab');

  return (
    // header-scroll: hairline and shadow appear only once the page scrolls (styles/motion.css).
    // viewTransitionName: the header stays put while page content slides underneath it.
    <header
      style={{ viewTransitionName: 'site-header' }}
      className="header-scroll sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80"
    >
      <div className="mx-auto flex h-header max-w-page items-center gap-2 px-gutter lg:px-gutter-lg">
        <Logo brandName={settings.brandName} />

        <nav aria-label={tNav('label')} className="ms-auto hidden xl:block">
          <ul className="flex items-center">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="underline-grow inline-flex min-h-tap items-center rounded-lg px-3 text-body text-foreground transition-colors duration-(--nasim-dur-fast) outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ms-auto flex items-center gap-1 xl:ms-2">
          {/* One language button on every screen size (DECISIONS №57). */}
          <Suspense fallback={<LangMenuFor pathname="/" />}>
            <LangMenu />
          </Suspense>
          <CtaLink
            target={whatsapp}
            newTabHint={newTabHint}
            variant="whatsapp"
            aria-label={tCta('whatsapp')}
            className="hidden sm:inline-flex"
          >
            <WhatsAppIcon />
            {tCta('whatsappShort')}
          </CtaLink>
          <CtaLink
            target={whatsapp}
            newTabHint={newTabHint}
            variant="whatsapp"
            size="icon"
            aria-label={tCta('whatsapp')}
            className="sm:hidden"
          >
            <WhatsAppIcon />
          </CtaLink>
          <MobileMenu
            className="xl:hidden"
            items={nav}
            labels={{
              open: t('openMenu'),
              close: t('closeMenu'),
              title: t('menuTitle'),
              nav: tNav('label'),
            }}
            cta={
              <CtaLink
                target={whatsapp}
                newTabHint={newTabHint}
                variant="whatsapp"
                className="w-full"
              >
                <WhatsAppIcon />
                {tCta('whatsapp')}
              </CtaLink>
            }
          />
        </div>
      </div>
    </header>
  );
}
