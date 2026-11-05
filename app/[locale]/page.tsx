import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { BookingSection } from '@/components/booking/booking-section';
import { WhatsAppIcon } from '@/components/icons/brand';
import { CtaLink } from '@/components/marketing/cta-link';
import { Guarantee } from '@/components/marketing/guarantee';
import { HomeHero } from '@/components/marketing/hero';
import { PackagesTeaser } from '@/components/marketing/packages-teaser';
import { Section } from '@/components/marketing/section';
import { SectionHeader } from '@/components/marketing/section-header';
import { TickerBand } from '@/components/marketing/ticker-band';
import { WhyCadence } from '@/components/marketing/why-cadence';
import { PageTransition } from '@/components/page-transition';
import { getSiteSettings } from '@/lib/content/site';
import { whatsappTarget } from '@/lib/cta';
import { alternatesFor } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations('Pages');
  return {
    title: t('home.title'),
    description: t('home.description'),
    alternates: alternatesFor(locale, '/'),
  };
}

/**
 * Promise → ticker → price in a minute → why → packages → guarantee (DECISIONS №55). Services live
 * in the menu, FAQ and the AI triage in the floating assistant, areas and contacts in the footer.
 * Section tones alternate (sand / surface) so no two neighbours share a background.
 */
export default async function HomePage() {
  const locale = await getLocale();
  const [t, tCta, tCommon, settings] = await Promise.all([
    getTranslations('Home'),
    getTranslations('Cta'),
    getTranslations('Common'),
    getSiteSettings(locale),
  ]);
  const whatsapp = whatsappTarget(settings.contacts);

  return (
    <PageTransition>
      <HomeHero locale={locale} />
      <TickerBand locale={locale} />

      <Section id="book" tone="surface" aria-labelledby="book-title">
        <SectionHeader
          id="book-title"
          eyebrow={t('book.eyebrow')}
          title={t('book.title')}
          lead={t('book.lead')}
        />
        <BookingSection />
        <p className="mt-8 flex flex-wrap items-center gap-x-2 text-body text-muted-foreground">
          {t('book.talk')}
          <CtaLink
            target={whatsapp}
            newTabHint={tCommon('opensInNewTab')}
            variant="link"
            className="px-0"
          >
            <WhatsAppIcon className="size-4" />
            {tCta('whatsapp')}
          </CtaLink>
        </p>
      </Section>

      <WhyCadence locale={locale} tone="sand" />
      <PackagesTeaser locale={locale} tone="surface" />
      <Guarantee locale={locale} tone="sand" van />
    </PageTransition>
  );
}
