import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { BookingSection } from '@/components/booking/booking-section';
import { Ltr } from '@/components/ltr';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { FinalCta } from '@/components/marketing/final-cta';
import { PackagesTeaser } from '@/components/marketing/packages-teaser';
import { PriceTable, type PriceGroup } from '@/components/marketing/price-table';
import { Section } from '@/components/marketing/section';
import { SectionHeader } from '@/components/marketing/section-header';
import { TierLadder } from '@/components/marketing/tier-ladder';
import { Badge } from '@/components/ui/badge';
import { getBlock, getPriceItems, getPricingConfig, getServices } from '@/lib/content/queries';
import { getSiteSettings } from '@/lib/content/site';
import { whatsappTarget } from '@/lib/cta';
import { formatNumber } from '@/lib/i18n/format';
import { pick, pickLocalizedValue } from '@/lib/i18n/text';
import { alternatesFor } from '@/lib/seo';
import type { Service, PriceItem } from '@/lib/validation/content';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations('Pages');
  return {
    title: t('pricing.title'),
    description: t('pricing.description'),
    alternates: alternatesFor(locale, '/pricing'),
  };
}

const groupsFor = (services: Service[], items: PriceItem[]): PriceGroup[] =>
  services
    .map((service) => ({ service, items: items.filter((i) => i.service_slug === service.slug) }))
    .filter((g) => g.items.length > 0);

export default async function PricingPage() {
  const locale = await getLocale();
  const [t, tPages, tNav, tPrice, tHome, tCta, settings, pricing, items, ac, upholstery, factors] =
    await Promise.all([
      getTranslations('Pricing'),
      getTranslations('Pages'),
      getTranslations('Nav'),
      getTranslations('Price'),
      getTranslations('Home'),
      getTranslations('Cta'),
      getSiteSettings(locale),
      getPricingConfig(),
      getPriceItems(),
      getServices({ status: ['active'], category: 'ac' }),
      getServices({ status: ['active'], category: 'upholstery' }),
      getBlock('pricing.factors'),
    ]);
  const whatsapp = whatsappTarget(settings.contacts);
  const tiered = pricing.lines.filter((l) => l.tiers.length > 1);
  const factorList = pickLocalizedValue(factors, locale);
  const vatNote = settings.vat.registered
    ? settings.vat.included
      ? tPrice('vatIncluded')
      : tPrice('vatAdded')
    : null;
  const jumps = [
    { href: '#ac', label: t('jump.ac') },
    { href: '#upholstery', label: t('jump.upholstery') },
    { href: '#packages', label: t('jump.packages') },
    { href: '#book', label: t('jump.calculator') },
  ];

  return (
    <>
      <Section tone="sand" aria-labelledby="pricing-title" className="pt-6 lg:pt-10" size="compact">
        <Breadcrumbs items={[{ label: tNav('pricing') }]} className="mb-8" />
        <SectionHeader
          id="pricing-title"
          as="h1"
          eyebrow={tNav('pricing')}
          title={tPages('pricing.title')}
          lead={t('lead')}
          className="mb-8"
        />
        <ul className="flex flex-wrap gap-2">
          {jumps.map((jump) => (
            <li key={jump.href}>
              <Badge variant="chip" asChild>
                <a href={jump.href}>{jump.label}</a>
              </Badge>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="ac" tone="surface" aria-labelledby="ac-title">
        <SectionHeader id="ac-title" title={t('jump.ac')} />
        <div className="grid gap-12 lg:grid-cols-12">
          <PriceTable
            groups={groupsFor(ac, items)}
            locale={locale}
            caption={t('captions.ac')}
            captionId="ac-caption"
            className="lg:col-span-7"
          />
          <div className="flex flex-col gap-8 lg:col-span-5">
            <h3 className="text-h3 text-primary">{t('tiers.title')}</h3>
            {tiered.map((line) => {
              const service = ac.find((s) => s.slug === line.serviceSlug);
              return (
                <TierLadder
                  key={line.id}
                  line={line}
                  locale={locale}
                  label={service ? pick(service.name, locale) : line.id}
                />
              );
            })}
          </div>
        </div>
        {vatNote ? <p className="mt-6 text-small text-muted-foreground">{vatNote}</p> : null}
      </Section>

      <Section id="upholstery" tone="sand" aria-labelledby="upholstery-title">
        <SectionHeader id="upholstery-title" title={t('jump.upholstery')} />
        <PriceTable
          groups={groupsFor(upholstery, items)}
          locale={locale}
          caption={t('captions.upholstery')}
          captionId="upholstery-caption"
          className="lg:max-w-3xl"
        />
        {vatNote ? <p className="mt-6 text-small text-muted-foreground">{vatNote}</p> : null}
      </Section>

      <Section tone="surface" aria-labelledby="factors-title">
        <SectionHeader id="factors-title" title={t('factors.title')} />
        <ol
          lang={factorList.lang !== locale ? factorList.lang : undefined}
          dir={factorList.lang !== locale ? 'auto' : undefined}
          className="grid gap-8 sm:grid-cols-2 lg:gap-x-12"
        >
          {factorList.value.map((factor, i) => (
            <li key={factor.title} className="flex gap-5 border-t border-border pt-5">
              <span
                aria-hidden="true"
                className="text-h2 leading-none font-light text-highlight-ink tabular-nums"
              >
                <Ltr>{formatNumber(i + 1, locale, { minimumIntegerDigits: 2 })}</Ltr>
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="text-lead font-medium text-foreground">{factor.title}</h3>
                <p className="text-body text-pretty text-muted-foreground">{factor.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <PackagesTeaser locale={locale} tone="sand" id="packages" />

      <Section id="book" tone="surface" aria-labelledby="book-title">
        <SectionHeader
          id="book-title"
          eyebrow={tHome('book.eyebrow')}
          title={tHome('book.title')}
          lead={tHome('book.lead')}
        />
        <BookingSection />
      </Section>

      <FinalCta
        title={tHome('finalCta.title')}
        lead={tHome('finalCta.lead')}
        primary={{ href: '#book', label: tHome('finalCta.primary') }}
        whatsapp={{ target: whatsapp, label: tCta('whatsapp') }}
      />
    </>
  );
}
