import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { BookingSection } from '@/components/booking/booking-section';
import { Ltr } from '@/components/ltr';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { CheckList } from '@/components/marketing/check-list';
import { FinalCta } from '@/components/marketing/final-cta';
import { MediaFrame } from '@/components/marketing/media-frame';
import { PackagesTeaser } from '@/components/marketing/packages-teaser';
import { PriceTable, type PriceGroup } from '@/components/marketing/price-table';
import { Section } from '@/components/marketing/section';
import { SectionHeader } from '@/components/marketing/section-header';
import { TierLadder } from '@/components/marketing/tier-ladder';
import { PageTransition } from '@/components/page-transition';
import { Badge } from '@/components/ui/badge';
import {
  getBlock,
  getPhoto,
  getPriceItems,
  getPricingConfig,
  getServices,
} from '@/lib/content/queries';
import { getSiteSettings } from '@/lib/content/site';
import { whatsappTarget } from '@/lib/cta';
import { formatAED } from '@/lib/i18n/format';
import { pick, pickLocalizedValue } from '@/lib/i18n/text';
import { stagger } from '@/lib/motion';
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
  const [
    t,
    tPages,
    tNav,
    tPrice,
    tHome,
    tCta,
    settings,
    pricing,
    items,
    ac,
    upholstery,
    details,
    art,
  ] = await Promise.all([
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
    getBlock('pricing.details'),
    getPhoto({ kind: 'pricing' }, locale),
  ]);
  const whatsapp = whatsappTarget(settings.contacts);
  const tiered = pricing.lines.filter((l) => l.tiers.length > 1);
  const detailList = pickLocalizedValue(details, locale);
  const offer = pricing.rules.firstBookingOffer;
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
    <PageTransition>
      <Section tone="sand" aria-labelledby="pricing-title" className="pt-6 lg:pt-10" size="compact">
        <Breadcrumbs items={[{ label: tNav('pricing') }]} className="mb-8" />
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-8">
            <SectionHeader
              id="pricing-title"
              as="h1"
              eyebrow={tNav('pricing')}
              title={tPages('pricing.title')}
              lead={t('lead')}
              className="mb-8"
            />
            <ul className="flex flex-wrap gap-2">
              {jumps.map((jump, i) => (
                <li key={jump.href} className="enter" style={stagger(i + 2)}>
                  <Badge variant="chip" asChild>
                    <a href={jump.href}>{jump.label}</a>
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
          {/* The owner's illustration on wide screens only: phones go straight to the prices. */}
          {art ? (
            <div
              data-tilt=""
              className="tilt enter hidden lg:col-span-4 lg:block"
              style={stagger(3)}
            >
              <MediaFrame
                media={art}
                ratio="4/5"
                rounded="panel"
                sizes="(min-width: 1024px) 30vw, 100vw"
                className="shadow-lift"
              />
            </div>
          ) : null}
        </div>
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
        <p className="mt-8 max-w-3xl text-small text-pretty text-muted-foreground">{t('acNote')}</p>
        {vatNote ? <p className="mt-2 text-small text-muted-foreground">{vatNote}</p> : null}
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

      <Section id="details" tone="surface" aria-labelledby="details-title">
        <SectionHeader id="details-title" title={t('details.title')} />
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div
            lang={detailList.lang !== locale ? detailList.lang : undefined}
            dir={detailList.lang !== locale ? 'auto' : undefined}
            className="lg:col-span-7"
          >
            <CheckList items={detailList.value} locale={locale} />
          </div>
          {offer ? (
            <aside
              aria-labelledby="first-booking-title"
              className="reveal-fade flex h-fit flex-col gap-3 rounded-panel border border-border bg-mist p-6 lg:col-span-5 lg:p-8"
            >
              <h3 id="first-booking-title" className="text-eyebrow text-highlight-ink">
                {tPrice('firstBooking.title')}
              </h3>
              <p className="text-h3 text-balance text-foreground">
                {tPrice.rich('firstBooking.text', {
                  discount: formatAED(offer.discount, locale),
                  min: formatAED(offer.minTotal, locale),
                  price: (chunks) => <Ltr className="tabular-nums">{chunks}</Ltr>,
                })}
              </p>
              <p className="text-small text-pretty text-muted-foreground">
                {tPrice('firstBooking.terms')}
              </p>
            </aside>
          ) : null}
        </div>
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
    </PageTransition>
  );
}
