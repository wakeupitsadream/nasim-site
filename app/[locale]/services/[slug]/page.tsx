import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { BookingSection } from '@/components/booking/booking-section';
import { CheckList } from '@/components/marketing/check-list';
import { ComingSoonHero } from '@/components/marketing/coming-soon';
import { FaqList } from '@/components/marketing/faq-list';
import { FinalCta } from '@/components/marketing/final-cta';
import { Guarantee } from '@/components/marketing/guarantee';
import { MeasurementCompare } from '@/components/marketing/measurement-compare';
import { PriceFrom } from '@/components/marketing/price-from';
import { PriceTable } from '@/components/marketing/price-table';
import { ServiceGrid } from '@/components/marketing/related-services';
import { RichText } from '@/components/marketing/rich-text';
import { Section, type SectionTone } from '@/components/marketing/section';
import { SectionHeader } from '@/components/marketing/section-header';
import { ServiceHero } from '@/components/marketing/service-hero';
import { ServiceSpecifics, hasSpecifics } from '@/components/marketing/service-specifics';
import { SymptomList } from '@/components/marketing/symptom-list';
import { TierLadder } from '@/components/marketing/tier-ladder';
import { VisitSteps } from '@/components/marketing/visit-steps';
import { LocalizedText } from '@/components/localized-text';
import { PageTransition } from '@/components/page-transition';
import {
  getBlock,
  getFaqs,
  getPhoto,
  getPriceItems,
  getPricingConfig,
  getRelatedServices,
  getServiceBySlug,
  getServices,
} from '@/lib/content/queries';
import { getSiteSettings } from '@/lib/content/site';
import { whatsappTarget } from '@/lib/cta';
import { formatMinutes } from '@/lib/i18n/format';
import { pick, pickLocalized } from '@/lib/i18n/text';
import { linesForService, priceFrom } from '@/lib/pricing';
import { alternatesFor } from '@/lib/seo';
import { fillTemplate } from '@/lib/whatsapp';

// The whole route must be static. For a slug missing from generateStaticParams the first request
// waits for the full render instead of streaming the App Shell, so notFound() below returns a real
// 404 status rather than a soft 404 with status 200 (DECISIONS №17). Nothing here reads cookies,
// headers or the clock.
export const ensureStatic = 'navigation';

const MEASURED = new Set(['ac-cleaning', 'ac-deep-cleaning', 'ducted-ac-fcu-service']);

export async function generateStaticParams() {
  return (await getServices()).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/services/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return {};
  const locale = await getLocale();
  return {
    title: pick(service.seo_title, locale) || pick(service.name, locale),
    description: pick(service.seo_description, locale) || undefined,
    alternates: alternatesFor(locale, `/services/${slug}`),
  };
}

export default async function ServicePage({ params }: PageProps<'/[locale]/services/[slug]'>) {
  // Existence check before any <Suspense>: an unknown slug gets a real 404 status,
  // not a streamed soft 404 (Next docs, streaming guide → Status codes).
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();
  const locale = await getLocale();

  const [
    t,
    tServices,
    tHome,
    tCta,
    settings,
    pricing,
    items,
    faqsOwn,
    faqsGlobal,
    related,
    readings,
    photo,
  ] = await Promise.all([
    getTranslations('Service'),
    getTranslations('Services'),
    getTranslations('Home'),
    getTranslations('Cta'),
    getSiteSettings(locale),
    getPricingConfig(),
    getPriceItems({ serviceSlug: slug }),
    getFaqs('service', slug),
    getFaqs('global'),
    getRelatedServices(slug),
    getBlock('report.readings'),
    getPhoto({ kind: 'service', serviceSlug: slug }, locale),
  ]);
  const name = pickLocalized(service.name, locale);
  const templateKey =
    slug === 'emergency-ac-repair' ? 'wa.template.emergency' : 'wa.template.generic';
  const template = pickLocalized(await getBlock(templateKey), locale).text;
  const whatsappText = fillTemplate(template, {
    brand: settings.brandName.text,
    service: name.text,
    page: `services/${slug}`,
  });
  const whatsapp = whatsappTarget(settings.contacts, whatsappText);

  if (service.status === 'coming_soon') {
    const waitlistTemplate = pickLocalized(await getBlock('wa.template.waitlist'), locale).text;
    const waitlist = whatsappTarget(
      settings.contacts,
      fillTemplate(waitlistTemplate, {
        brand: settings.brandName.text,
        service: name.text,
        page: `services/${slug}`,
      }),
    );
    return (
      <PageTransition>
        <ComingSoonHero service={service} locale={locale} waitlist={waitlist} />
        <Section tone="surface" aria-labelledby="description-title">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
            <SectionHeader
              id="description-title"
              eyebrow={tServices('category.comingSoon')}
              title={t('comingSoon.badge')}
              className="mb-0 lg:col-span-4"
            />
            <RichText
              value={pickLocalized(service.description_html, locale)}
              locale={locale}
              className="text-lead text-muted-foreground lg:col-span-8"
            />
          </div>
        </Section>
        <Section tone="sand" aria-labelledby="related-title">
          <SectionHeader id="related-title" title={t('related')} />
          <ServiceGrid
            services={related}
            pricing={pricing}
            locale={locale}
            emergencyEnabled={settings.flags.emergencyEnabled}
          />
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

  const from = priceFrom(pricing, slug);
  const lines = linesForService(pricing, slug);
  const tiered = lines.filter((l) => l.tiers.length > 1);
  const faqs = faqsOwn.length > 0 ? faqsOwn : faqsGlobal.slice(0, 4);
  const note = items[0] ? pickLocalized(items[0].note, locale) : null;

  // Sections in order; light tones alternate automatically around the fixed dark bands.
  const blocks: { key: string; deep?: boolean; render: (tone: SectionTone) => ReactNode }[] = [
    {
      key: 'description',
      render: (tone) => (
        <Section tone={tone} aria-labelledby="description-title">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <h2 id="description-title" className="sr-only">
                {name.text}
              </h2>
              <RichText
                value={pickLocalized(service.description_html, locale)}
                locale={locale}
                className="text-lead text-muted-foreground"
              />
            </div>
            <div className="flex h-fit flex-col gap-4 rounded-panel border border-border bg-card p-6 shadow-card lg:col-span-5">
              <p className="text-eyebrow text-highlight-ink">{t('glance')}</p>
              <dl className="flex flex-col gap-4">
                {from ? (
                  <div className="flex flex-col gap-1">
                    <dt className="text-small text-muted-foreground">{t('prices')}</dt>
                    <dd>
                      <PriceFrom amount={from.amount} unit={from.unit} locale={locale} size="lg" />
                    </dd>
                  </div>
                ) : null}
                {service.duration_min ? (
                  <div className="flex flex-col gap-1 border-t border-border pt-4">
                    <dt className="text-small text-muted-foreground">{t('duration')}</dt>
                    <dd className="text-body text-foreground">
                      {formatMinutes(service.duration_min, locale)}
                    </dd>
                  </div>
                ) : null}
                {note?.text ? (
                  <div className="flex flex-col gap-1 border-t border-border pt-4">
                    <dt className="text-small text-muted-foreground">{t('note')}</dt>
                    <dd className="text-body text-foreground">
                      <LocalizedText value={note} locale={locale} />
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </div>
        </Section>
      ),
    },
    {
      key: 'included',
      render: (tone) => (
        <Section tone={tone} aria-labelledby="included-title">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col gap-5">
              <h2 id="included-title" className="text-h3 text-primary">
                {t('included')}
              </h2>
              <CheckList items={service.includes} locale={locale} />
            </div>
            {service.excludes.length > 0 ? (
              <div className="flex flex-col gap-5">
                <h2 className="text-h3 text-primary">{t('excluded')}</h2>
                <CheckList items={service.excludes} locale={locale} variant="exclude" />
              </div>
            ) : null}
          </div>
        </Section>
      ),
    },
    ...(service.symptoms.length > 0
      ? [
          {
            key: 'symptoms',
            render: (tone: SectionTone) => (
              <Section tone={tone} aria-labelledby="symptoms-title">
                <SectionHeader
                  id="symptoms-title"
                  title={slug === 'emergency-ac-repair' ? t('causes') : t('symptoms')}
                />
                <SymptomList items={service.symptoms} locale={locale} />
              </Section>
            ),
          },
        ]
      : []),
    ...(hasSpecifics(slug) && (slug !== 'emergency-ac-repair' || settings.flags.emergencyEnabled)
      ? [
          {
            key: 'specifics',
            render: (tone: SectionTone) => (
              <ServiceSpecifics
                service={service}
                locale={locale}
                tone={tone}
                settings={settings}
                pricing={pricing}
              />
            ),
          },
        ]
      : []),
    ...(items.length > 0
      ? [
          {
            key: 'prices',
            render: (tone: SectionTone) => (
              <Section tone={tone} aria-labelledby="prices-title">
                <SectionHeader id="prices-title" title={t('prices')} />
                <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
                  <PriceTable
                    groups={[{ service, items }]}
                    locale={locale}
                    caption={name.text}
                    captionId="prices-caption"
                    linkServices={false}
                    className="lg:col-span-7"
                  />
                  {tiered.length > 0 ? (
                    <div className="flex flex-col gap-6 lg:col-span-5">
                      {tiered.map((line) => (
                        <TierLadder key={line.id} line={line} locale={locale} label={name.text} />
                      ))}
                    </div>
                  ) : null}
                </div>
              </Section>
            ),
          },
        ]
      : []),
    ...(service.visit_steps.length > 0
      ? [
          {
            key: 'visit',
            deep: true,
            render: () => (
              <Section tone="deep" aria-labelledby="visit-title">
                <SectionHeader
                  id="visit-title"
                  title={t('visit')}
                  lead={
                    service.duration_min
                      ? t('visitDuration', {
                          duration: formatMinutes(service.duration_min, locale),
                        })
                      : undefined
                  }
                />
                <VisitSteps steps={service.visit_steps} locale={locale} />
              </Section>
            ),
          },
        ]
      : []),
    ...(MEASURED.has(slug)
      ? [
          {
            key: 'measurement',
            render: (tone: SectionTone) => (
              <Section tone={tone} aria-labelledby="measurement-title">
                <SectionHeader id="measurement-title" title={t('beforeAfter')} />
                <MeasurementCompare readings={readings} locale={locale} />
              </Section>
            ),
          },
        ]
      : []),
    {
      key: 'book',
      render: (tone) => (
        <Section id="book" tone={tone} aria-labelledby="book-title">
          <SectionHeader
            id="book-title"
            eyebrow={tHome('book.eyebrow')}
            title={t('book')}
            lead={tHome('book.lead')}
          />
          <BookingSection initialService={slug} />
        </Section>
      ),
    },
    { key: 'guarantee', render: (tone) => <Guarantee locale={locale} tone={tone} /> },
    {
      key: 'faq',
      render: (tone) => (
        <Section tone={tone} aria-labelledby="faq-title">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
            <SectionHeader
              id="faq-title"
              eyebrow={tHome('faq.eyebrow')}
              title={t('faq')}
              className="mb-0 lg:col-span-4"
            />
            <FaqList faqs={faqs} locale={locale} name="service-faq" className="lg:col-span-8" />
          </div>
        </Section>
      ),
    },
    {
      key: 'related',
      render: (tone) => (
        <Section tone={tone} aria-labelledby="related-title">
          <SectionHeader id="related-title" title={t('related')} />
          <ServiceGrid
            services={related}
            pricing={pricing}
            locale={locale}
            emergencyEnabled={settings.flags.emergencyEnabled}
          />
        </Section>
      ),
    },
  ];

  let next: SectionTone = 'surface'; // the hero is sand
  const rendered = blocks.map((block) => {
    if (block.deep) {
      next = 'sand';
      return <div key={block.key}>{block.render('deep')}</div>;
    }
    const tone = next;
    next = tone === 'sand' ? 'surface' : 'sand';
    return <div key={block.key}>{block.render(tone)}</div>;
  });

  return (
    <PageTransition>
      <ServiceHero
        service={service}
        locale={locale}
        priceFrom={from}
        whatsapp={whatsapp}
        photo={photo}
      />
      {rendered}
      <FinalCta
        title={tHome('finalCta.title')}
        lead={tHome('finalCta.lead')}
        primary={{ href: '#book', label: tHome('finalCta.primary') }}
        whatsapp={{ target: whatsapp, label: tCta('whatsapp') }}
      />
    </PageTransition>
  );
}
