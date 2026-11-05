import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { BookingSection } from '@/components/booking/booking-section';
import { DiagnoseSection } from '@/components/diagnose/diagnose-section';
import { WhatsAppIcon } from '@/components/icons/brand';
import { AreaChips } from '@/components/marketing/area-chips';
import { CtaLink } from '@/components/marketing/cta-link';
import { FaqList } from '@/components/marketing/faq-list';
import { FinalCta } from '@/components/marketing/final-cta';
import { Guarantee } from '@/components/marketing/guarantee';
import { HomeHero } from '@/components/marketing/hero';
import { HowItWorks } from '@/components/marketing/how-it-works';
import { PackagesTeaser } from '@/components/marketing/packages-teaser';
import { Section } from '@/components/marketing/section';
import { SectionHeader } from '@/components/marketing/section-header';
import { ServiceMenu } from '@/components/marketing/service-menu';
import { WhyCadence } from '@/components/marketing/why-cadence';
import { getAreas, getFaqs } from '@/lib/content/queries';
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

// Section tones alternate (sand / surface / deep) so no two neighbours share a background.
export default async function HomePage() {
  const locale = await getLocale();
  const [t, tCta, tCommon, settings, faqs, areas] = await Promise.all([
    getTranslations('Home'),
    getTranslations('Cta'),
    getTranslations('Common'),
    getSiteSettings(locale),
    getFaqs('global'),
    getAreas(),
  ]);
  const whatsapp = whatsappTarget(settings.contacts);

  return (
    <>
      <HomeHero locale={locale} />

      <DiagnoseSection tone="surface" calculatorHref="#book" />

      <Section id="book" tone="sand" aria-labelledby="book-title">
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

      <HowItWorks locale={locale} />
      <ServiceMenu locale={locale} />
      <WhyCadence locale={locale} />
      <Guarantee locale={locale} />
      <PackagesTeaser locale={locale} />

      <Section tone="sand" aria-labelledby="areas-title" size="compact">
        <SectionHeader id="areas-title" eyebrow={t('areas.eyebrow')} title={t('areas.title')} />
        <AreaChips
          areas={areas}
          locale={locale}
          all={{ label: t('areas.all') }}
          label={t('areas.title')}
        />
      </Section>

      <Section tone="surface" aria-labelledby="faq-title">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <SectionHeader
            id="faq-title"
            eyebrow={t('faq.eyebrow')}
            title={t('faq.title')}
            className="mb-0 lg:col-span-4"
          />
          <FaqList faqs={faqs} locale={locale} name="home-faq" className="lg:col-span-8" />
        </div>
      </Section>

      <FinalCta
        title={t('finalCta.title')}
        lead={t('finalCta.lead')}
        primary={{ href: '/pricing#book', label: t('finalCta.primary') }}
        whatsapp={{ target: whatsapp, label: tCta('whatsapp') }}
      />
    </>
  );
}
