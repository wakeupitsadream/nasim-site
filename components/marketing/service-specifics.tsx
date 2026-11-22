import { getTranslations } from 'next-intl/server';
import { LocalizedText } from '@/components/localized-text';
import { Ltr } from '@/components/ltr';
import { PriceFrom } from '@/components/marketing/price-from';
import { RichText } from '@/components/marketing/rich-text';
import { Section, type SectionTone } from '@/components/marketing/section';
import { SectionHeader } from '@/components/marketing/section-header';
import { getBlock } from '@/lib/content/queries';
import { formatAED, formatNumber } from '@/lib/i18n/format';
import type { Locale } from '@/lib/i18n/routing';
import { pickLocalized, pickLocalizedValue } from '@/lib/i18n/text';
import { findLine, type PricingConfig } from '@/lib/pricing';
import type { Service } from '@/lib/validation/content';

type Props = {
  service: Service;
  locale: Locale;
  tone: SectionTone;
  pricing: PricingConfig;
};

/** Does this service have a specifics section? (Lets the page keep its tone alternation.) */
export const hasSpecifics = (slug: string): boolean =>
  ['refrigerant-leak-detection', 'ducted-ac-fcu-service'].includes(slug);

/** Per-service explanations from BRIEF §6.2, each built from seed data and typed blocks. */
export async function ServiceSpecifics({ service, locale, tone, pricing }: Props) {
  const t = await getTranslations('Service');

  if (service.slug === 'refrigerant-leak-detection') {
    const block = await getBlock('service.refrigerant-leak-refill.principle');
    const steps = pickLocalizedValue(block, locale);
    const fallback = steps.lang !== locale;
    const leak = findLine(pricing, 'leak_test');
    const refill = findLine(pricing, 'refill');
    return (
      <Section tone={tone} aria-labelledby="specifics-title">
        <SectionHeader id="specifics-title" title={t('specifics.principle')} />
        <ol
          lang={fallback ? steps.lang : undefined}
          dir={fallback ? 'auto' : undefined}
          className="grid gap-8 lg:grid-cols-3 lg:gap-6"
        >
          {steps.value.map((step, i) => (
            <li key={step.title} className="flex flex-col gap-3 border-t border-border pt-5">
              <span
                aria-hidden="true"
                className="text-h2 leading-none font-light text-highlight-ink tabular-nums"
              >
                <Ltr>{formatNumber(i + 1, locale, { minimumIntegerDigits: 2 })}</Ltr>
              </span>
              <h3 className="text-lead font-medium text-foreground">{step.title}</h3>
              <p className="text-body text-pretty text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
        <dl className="mt-10 grid gap-4 sm:grid-cols-3">
          {leak ? (
            <div className="flex flex-col gap-1 rounded-card border border-border bg-card p-5">
              <dt className="text-small text-muted-foreground">{t('specifics.leakTest')}</dt>
              <dd>
                <Ltr className="text-h3 font-light text-primary tabular-nums">
                  {formatAED(leak.tiers[0]!.price, locale)}
                </Ltr>
              </dd>
            </div>
          ) : null}
          {refill ? (
            <div className="flex flex-col gap-1 rounded-card border border-border bg-card p-5">
              <dt className="text-small text-muted-foreground">{t('specifics.refill')}</dt>
              <dd>
                <PriceFrom amount={refill.tiers[0]!.price} unit="from" locale={locale} size="lg" />
              </dd>
            </div>
          ) : null}
          <div className="flex flex-col gap-1 rounded-card border border-border bg-card p-5">
            <dt className="text-small text-muted-foreground">{t('specifics.repairByEstimate')}</dt>
            <dd className="text-body text-foreground">
              <LocalizedText
                value={pickLocalized(service.excludes[0] ?? { en: '' }, locale)}
                locale={locale}
              />
            </dd>
          </div>
        </dl>
      </Section>
    );
  }

  if (service.slug === 'ducted-ac-fcu-service') {
    const block = await getBlock('service.ducted-ac-fcu-service.vs_split');
    return (
      <Section tone={tone} aria-labelledby="specifics-title">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <SectionHeader
            id="specifics-title"
            title={t('specifics.vsSplit')}
            className="mb-0 lg:col-span-4"
          />
          <RichText
            value={pickLocalized(block, locale)}
            locale={locale}
            className="text-lead text-muted-foreground lg:col-span-8"
          />
        </div>
      </Section>
    );
  }

  return null;
}
