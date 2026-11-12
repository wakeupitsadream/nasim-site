import { ClockIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { WhatsAppIcon } from '@/components/icons/brand';
import { LocalizedText } from '@/components/localized-text';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { CtaLink } from '@/components/marketing/cta-link';
import { Eyebrow } from '@/components/marketing/eyebrow';
import { MediaFrame } from '@/components/marketing/media-frame';
import { PriceFrom } from '@/components/marketing/price-from';
import { Section } from '@/components/marketing/section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Photo } from '@/lib/content/queries';
import type { CtaTarget } from '@/lib/cta';
import { formatMinutes } from '@/lib/i18n/format';
import type { Locale } from '@/lib/i18n/routing';
import { pickLocalized } from '@/lib/i18n/text';
import { stagger } from '@/lib/motion';
import type { PriceUnit, Service } from '@/lib/validation/content';

type Props = {
  service: Service;
  locale: Locale;
  priceFrom: { amount: number; unit: PriceUnit } | null;
  whatsapp: CtaTarget;
  /** Service pages host the wizard; the primary CTA scrolls to it. */
  bookHref?: string;
  /** The service photo (`getPhoto({ kind: 'service', serviceSlug })`); null keeps the placeholder. */
  photo?: Photo | null;
};

/** Service page opener: breadcrumbs, category, name, summary, facts, CTAs, photo slot. */
export async function ServiceHero({
  service,
  locale,
  priceFrom,
  whatsapp,
  bookHref = '#book',
  photo,
}: Props) {
  const [t, tServices, tCta, tCommon] = await Promise.all([
    getTranslations('Service'),
    getTranslations('Services'),
    getTranslations('Cta'),
    getTranslations('Common'),
  ]);
  const name = pickLocalized(service.name, locale);
  const short = pickLocalized(service.short, locale);
  const estimate = service.pricing_unit === 'from';
  // Priced on request: no price list yet, the section below asks for a quote (DECISIONS №61).
  const onRequest = service.pricing_unit === 'quote';
  const category = service.category === 'ac' ? 'ac' : 'upholstery';

  return (
    <Section tone="sand" aria-labelledby="service-title" className="pt-6 lg:pt-10">
      <Breadcrumbs
        items={[
          { label: tServices(`category.${category}`), href: '/services' },
          { label: name.text },
        ]}
        className="mb-8"
      />
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col gap-6 lg:col-span-7 lg:pe-8">
          <Eyebrow className="enter" style={stagger(0)}>
            {tServices(`category.${category}`)}
          </Eyebrow>
          <h1
            id="service-title"
            lang={name.lang !== locale ? name.lang : undefined}
            dir={name.lang !== locale ? 'auto' : undefined}
            className="enter text-h1 text-balance text-primary"
            style={stagger(1)}
          >
            {name.text}
          </h1>
          <p
            className="enter max-w-[38rem] text-lead text-pretty text-muted-foreground"
            style={stagger(2)}
          >
            <LocalizedText value={short} locale={locale} />
          </p>
          <div
            className="enter flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-border py-4"
            style={stagger(3)}
          >
            {priceFrom ? (
              <PriceFrom
                amount={priceFrom.amount}
                unit={priceFrom.unit}
                locale={locale}
                size="lg"
              />
            ) : null}
            {service.duration_min ? (
              <span className="flex items-center gap-1.5 text-body text-muted-foreground">
                <ClockIcon aria-hidden="true" strokeWidth={1.5} className="size-4" />
                {formatMinutes(service.duration_min, locale)}
              </span>
            ) : null}
            <Badge variant={estimate || onRequest ? 'outline' : 'highlight'} size="lg">
              {onRequest
                ? tServices('onRequest')
                : estimate
                  ? tServices('badge.estimate')
                  : t('fixedChip')}
            </Badge>
          </div>
          <div className="enter flex flex-col gap-3 sm:flex-row sm:flex-wrap" style={stagger(4)}>
            <Button size="lg" asChild className="sm:min-w-56">
              <a href={bookHref}>{onRequest ? t('quote.title') : t('book')}</a>
            </Button>
            <CtaLink
              target={whatsapp}
              newTabHint={tCommon('opensInNewTab')}
              variant="outline"
              size="lg"
            >
              <WhatsAppIcon className="text-whatsapp" />
              {tCta('whatsapp')}
            </CtaLink>
          </div>
        </div>
        <div className="enter lg:col-span-5" style={stagger(3)}>
          <MediaFrame
            media={photo}
            ratio="4/5"
            art={category}
            sizes="(min-width: 1024px) 40vw, 100vw"
            mobile="hideWhenEmpty"
            rounded="panel"
            priority
          />
        </div>
      </div>
    </Section>
  );
}
