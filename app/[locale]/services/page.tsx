import { ArrowRightIcon, CalendarCheckIcon, SparklesIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { AssistantTrigger } from '@/components/assistant/assistant-trigger';
import { Ltr } from '@/components/ltr';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { FinalCta } from '@/components/marketing/final-cta';
import { MediaFrame } from '@/components/marketing/media-frame';
import { ServiceGrid } from '@/components/marketing/related-services';
import { Section } from '@/components/marketing/section';
import { SectionHeader } from '@/components/marketing/section-header';
import { SpeedLines } from '@/components/marketing/speed-lines';
import { PageTransition } from '@/components/page-transition';
import { Button, buttonVariants } from '@/components/ui/button';
import { getPackages, getPhoto, getPricingConfig, getServices } from '@/lib/content/queries';
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
  const [
    t,
    tPages,
    tNav,
    tCta,
    tHome,
    tPrice,
    settings,
    pricing,
    cleaning,
    addons,
    servicing,
    upholstery,
    soon,
    annual,
    acArt,
    upholsteryArt,
  ] = await Promise.all([
    getTranslations('Services'),
    getTranslations('Pages'),
    getTranslations('Nav'),
    getTranslations('Cta'),
    getTranslations('Home'),
    getTranslations('Price'),
    getSiteSettings(locale),
    getPricingConfig(),
    getServices({ status: ['active'], category: 'ac', group: 'cleaning' }),
    getServices({ status: ['active'], category: 'ac', group: 'addon' }),
    getServices({ status: ['active'], category: 'ac', group: 'service' }),
    getServices({ status: ['active'], category: 'upholstery' }),
    getServices({ status: ['coming_soon'] }),
    getPackages({ type: 'annual' }),
    getPhoto({ kind: 'catalogue', category: 'ac' }, locale),
    getPhoto({ kind: 'catalogue', category: 'upholstery' }, locale),
  ]);
  const whatsapp = whatsappTarget(settings.contacts);
  const emergencyEnabled = settings.flags.emergencyEnabled;
  const cheapestPlan = annual.reduce<number | null>(
    (min, p) => (p.price !== null && (min === null || p.price < min) ? p.price : min),
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

      {/* The AC catalogue in the owner's three groups (DECISIONS №61): cleaning, extra cleaning
          options, servicing and repairs. */}
      <Section id="ac" tone="surface" aria-labelledby="ac-title">
        {/* The crew illustration beside each category header (owner's art, DECISIONS №57). */}
        <div className="mb-stack grid gap-8 lg:grid-cols-12 lg:items-end">
          <SectionHeader
            id="ac-title"
            eyebrow={t('category.ac')}
            title={t('group.cleaning')}
            className="mb-0 lg:col-span-8"
          />
          {acArt ? (
            <div data-tilt="" className="tilt reveal lg:col-span-4">
              <MediaFrame
                media={acArt}
                ratio="1/1"
                rounded="panel"
                sizes="(min-width: 1024px) 30vw, 100vw"
                className="shadow-lift"
              />
            </div>
          ) : null}
        </div>
        <ServiceGrid
          services={cleaning}
          pricing={pricing}
          locale={locale}
          emergencyEnabled={emergencyEnabled}
        />
        {addons.length > 0 ? (
          <>
            <h3
              id="ac-addons"
              className="reveal mt-stack mb-6 scroll-mt-header text-h3 text-primary"
            >
              {t('group.addon')}
            </h3>
            <ServiceGrid
              services={addons}
              pricing={pricing}
              locale={locale}
              emergencyEnabled={emergencyEnabled}
            />
          </>
        ) : null}
      </Section>

      <Section id="ac-service" tone="sand" aria-labelledby="ac-service-title">
        <SectionHeader
          id="ac-service-title"
          eyebrow={t('category.ac')}
          title={t('group.service')}
        />
        <ServiceGrid
          services={servicing}
          pricing={pricing}
          locale={locale}
          emergencyEnabled={emergencyEnabled}
        />
        <div className="reveal mt-6 flex flex-col gap-4 rounded-card border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-mist text-highlight-ink"
            >
              <CalendarCheckIcon strokeWidth={1.5} className="size-6" />
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="text-lead font-medium text-foreground">{t('contract.title')}</h3>
              <p className="text-body text-pretty text-muted-foreground">
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

      <Section id="upholstery" tone="surface" aria-labelledby="upholstery-title">
        <div className="mb-stack grid gap-8 lg:grid-cols-12 lg:items-end">
          <SectionHeader
            id="upholstery-title"
            title={t('category.upholstery')}
            lead={t('summary.upholstery')}
            className="mb-0 lg:col-span-8"
          />
          {upholsteryArt ? (
            <div data-tilt="" className="tilt reveal lg:col-span-4">
              <MediaFrame
                media={upholsteryArt}
                ratio="1/1"
                rounded="panel"
                sizes="(min-width: 1024px) 30vw, 100vw"
                className="shadow-lift"
              />
            </div>
          ) : null}
        </div>
        <ServiceGrid
          services={upholstery}
          pricing={pricing}
          locale={locale}
          emergencyEnabled={emergencyEnabled}
        />
      </Section>

      {soon.length > 0 ? (
        <Section id="soon" tone="sand" aria-labelledby="soon-title">
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

      {/* "Not sure which one?" — opens the floating assistant; the tone follows the optional #soon band. */}
      <Section
        tone={soon.length > 0 ? 'surface' : 'sand'}
        aria-labelledby="not-sure-title"
        size="compact"
      >
        <div className="reveal-fade flex flex-col gap-6 rounded-panel border border-border bg-card p-6 shadow-card sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-mist text-highlight-ink"
            >
              <SparklesIcon strokeWidth={1.5} className="size-6" />
            </span>
            <div className="flex flex-col gap-1">
              <h2 id="not-sure-title" className="text-h3 text-primary">
                {t('notSure.title')}
              </h2>
              <p className="max-w-[40rem] text-body text-pretty text-muted-foreground">
                {t('notSure.text')}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:shrink-0">
            <AssistantTrigger className={buttonVariants({ size: 'lg' })}>
              <SparklesIcon strokeWidth={1.75} />
              {t('notSure.ask')}
            </AssistantTrigger>
            <Button variant="outline" size="lg" asChild>
              <Link href="/pricing#book">{t('notSure.price')}</Link>
            </Button>
          </div>
        </div>
      </Section>

      <FinalCta
        title={tHome('finalCta.title')}
        lead={tHome('finalCta.lead')}
        primary={{ href: '/pricing#book', label: tHome('finalCta.primary') }}
        whatsapp={{ target: whatsapp, label: tCta('whatsapp') }}
      />
    </PageTransition>
  );
}
