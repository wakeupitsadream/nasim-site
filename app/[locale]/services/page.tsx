import { ArrowRightIcon, CalendarCheckIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { DiagnoseSection } from '@/components/diagnose/diagnose-section';
import { Ltr } from '@/components/ltr';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { FinalCta } from '@/components/marketing/final-cta';
import { ServiceGrid } from '@/components/marketing/related-services';
import { Section } from '@/components/marketing/section';
import { SectionHeader } from '@/components/marketing/section-header';
import { SpeedLines } from '@/components/marketing/speed-lines';
import { PageTransition } from '@/components/page-transition';
import { Button } from '@/components/ui/button';
import { getPackages, getPricingConfig, getServices } from '@/lib/content/queries';
import { getSiteSettings } from '@/lib/content/site';
import { whatsappTarget } from '@/lib/cta';
import { formatAED } from '@/lib/i18n/format';
import { Link } from '@/lib/i18n/navigation';
import { alternatesFor } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations('Pages');
  return {
    title: t('services.title'),
    description: t('services.description'),
    alternates: alternatesFor(locale, '/services'),
  };
}

export default async function ServicesPage() {
  const locale = await getLocale();
  const [t, tPages, tNav, tCta, tHome, tPrice, settings, pricing, ac, upholstery, soon, annual] =
    await Promise.all([
      getTranslations('Services'),
      getTranslations('Pages'),
      getTranslations('Nav'),
      getTranslations('Cta'),
      getTranslations('Home'),
      getTranslations('Price'),
      getSiteSettings(locale),
      getPricingConfig(),
      getServices({ status: ['active'], category: 'ac' }),
      getServices({ status: ['active'], category: 'upholstery' }),
      getServices({ status: ['coming_soon'] }),
      getPackages({ type: 'annual' }),
    ]);
  const whatsapp = whatsappTarget(settings.contacts);
  const emergencyEnabled = settings.flags.emergencyEnabled;
  const cheapestPlan = annual.reduce<number | null>(
    (min, p) => (min === null || p.price < min ? p.price : min),
    null,
  );

  return (
    <PageTransition>
      <Section
        tone="sand"
        aria-labelledby="services-title"
        className="pt-6 lg:pt-10"
        size="compact"
        decoration={
          <div className="absolute inset-e-[4%] bottom-10 hidden w-64 text-brand opacity-50 md:block lg:w-80">
            <SpeedLines />
          </div>
        }
      >
        <Breadcrumbs items={[{ label: tNav('services') }]} className="mb-8" />
        <SectionHeader
          id="services-title"
          as="h1"
          eyebrow={tNav('services')}
          title={tPages('services.title')}
          lead={t('lead')}
          className="mb-0"
        />
      </Section>

      <Section id="ac" tone="surface" aria-labelledby="ac-title">
        <SectionHeader id="ac-title" title={t('category.ac')} lead={t('summary.ac')} />
        <ServiceGrid
          services={ac}
          pricing={pricing}
          locale={locale}
          emergencyEnabled={emergencyEnabled}
        />
        <div className="reveal mt-6 flex flex-col gap-4 rounded-card border border-border bg-background p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-mist text-highlight-ink"
            >
              <CalendarCheckIcon strokeWidth={1.5} className="size-6" />
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="text-lead font-medium text-foreground">{t('contract.title')}</h3>
              <p className="text-body text-muted-foreground">
                {t('contract.text')}
                {cheapestPlan !== null ? (
                  <>
                    {' '}
                    {tPrice.rich('perYearRich', {
                      amount: formatAED(cheapestPlan, locale),
                      a: (chunks) => <Ltr className="font-medium text-foreground">{chunks}</Ltr>,
                    })}
                  </>
                ) : null}
              </p>
            </div>
          </div>
          <Button variant="outline" asChild className="shrink-0">
            <Link href="/annual-contracts">
              {t('contract.cta')}
              <ArrowRightIcon className="rtl:-scale-x-100" />
            </Link>
          </Button>
        </div>
      </Section>

      <Section id="upholstery" tone="sand" aria-labelledby="upholstery-title">
        <SectionHeader
          id="upholstery-title"
          title={t('category.upholstery')}
          lead={t('summary.upholstery')}
        />
        <ServiceGrid
          services={upholstery}
          pricing={pricing}
          locale={locale}
          emergencyEnabled={emergencyEnabled}
        />
      </Section>

      {soon.length > 0 ? (
        <Section id="soon" tone="surface" aria-labelledby="soon-title">
          <SectionHeader
            id="soon-title"
            title={t('category.comingSoon')}
            lead={t('summary.comingSoon')}
          />
          <ServiceGrid
            services={soon}
            pricing={pricing}
            locale={locale}
            emergencyEnabled={emergencyEnabled}
          />
        </Section>
      ) : null}

      {/* "Not sure which one?" — the AI triage answers it; its tone follows the optional #soon band. */}
      <DiagnoseSection tone={soon.length > 0 ? 'sand' : 'surface'} calculatorHref="/pricing#book" />

      <FinalCta
        title={tHome('finalCta.title')}
        lead={tHome('finalCta.lead')}
        primary={{ href: '/pricing#book', label: tHome('finalCta.primary') }}
        whatsapp={{ target: whatsapp, label: tCta('whatsapp') }}
      />
    </PageTransition>
  );
}
