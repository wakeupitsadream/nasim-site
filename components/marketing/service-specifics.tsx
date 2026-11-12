import { InfoIcon, SirenIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { LocalizedText } from '@/components/localized-text';
import { Ltr } from '@/components/ltr';
import { CheckList } from '@/components/marketing/check-list';
import { PriceFrom } from '@/components/marketing/price-from';
import { RichText } from '@/components/marketing/rich-text';
import { Section, type SectionTone } from '@/components/marketing/section';
import { SectionHeader } from '@/components/marketing/section-header';
import { getBlock, getServiceBySlug } from '@/lib/content/queries';
import type { SiteSettings } from '@/lib/content/site';
import { formatAED, formatNumber } from '@/lib/i18n/format';
import type { Locale } from '@/lib/i18n/routing';
import { pickLocalized, pickLocalizedValue } from '@/lib/i18n/text';
import { findLine, type PricingConfig } from '@/lib/pricing';
import type { Service } from '@/lib/validation/content';

type Props = {
  service: Service;
  locale: Locale;
  tone: SectionTone;
  settings: SiteSettings;
  pricing: PricingConfig;
};

/** Does this service have a specifics section? (Lets the page keep its tone alternation.) */
export const hasSpecifics = (slug: string): boolean =>
  [
    'ac-deep-cleaning',
    'emergency-ac-repair',
    'refrigerant-leak-detection',
    'ducted-ac-fcu-service',
  ].includes(slug);

/** Per-service explanations from BRIEF §6.2, each built from seed data and typed blocks. */
export async function ServiceSpecifics({ service, locale, tone, settings, pricing }: Props) {
  const t = await getTranslations('Service');

  if (service.slug === 'ac-deep-cleaning') {
    const [standard, note] = await Promise.all([
      getServiceBySlug('ac-cleaning'),
      getBlock('service.ac-deep-cleaning.age_note'),
    ]);
    return (
      <Section tone={tone} aria-labelledby="specifics-title">
        <SectionHeader id="specifics-title" title={t('specifics.deepVsStandard')} />
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {standard ? (
            <div className="flex flex-col gap-4">
              <h3 className="text-lead font-medium text-foreground">{t('specifics.standard')}</h3>
              <CheckList items={standard.includes} locale={locale} />
            </div>
          ) : null}
          <div className="flex flex-col gap-4 rounded-panel bg-mist p-6 lg:p-8">
            <h3 className="text-lead font-medium text-foreground">{t('specifics.deep')}</h3>
            <CheckList items={service.includes} locale={locale} />
          </div>
        </div>
        <Callout title={t('specifics.ageNote')}>
          <LocalizedText value={pickLocalized(note, locale)} locale={locale} />
        </Callout>
      </Section>
    );
  }

  if (service.slug === 'emergency-ac-repair') {
    if (!settings.flags.emergencyEnabled) return null;
    const callout = pricing.lines.find((l) =>
      l.tiers.some((tier) => tier.itemKey === pricing.rules.diagnosticsItemKey),
    );
    return (
      <Section tone={tone} aria-labelledby="specifics-title">
        <div className="grid gap-8 rounded-panel border border-border bg-card p-6 shadow-card lg:grid-cols-2 lg:gap-12 lg:p-10">
          <div className="flex flex-col gap-4">
            <span
              aria-hidden="true"
              className="inline-flex size-12 items-center justify-center rounded-xl bg-mist text-highlight-ink"
            >
              <SirenIcon strokeWidth={1.5} className="size-6" />
            </span>
            <h2 id="specifics-title" className="text-h2 text-balance text-primary">
              {t('specifics.sameDay')}
            </h2>
            <p className="text-lead text-pretty text-muted-foreground">
              <LocalizedText value={settings.emergencyHours} locale={locale} />
            </p>
          </div>
          {callout ? (
            <div className="flex flex-col gap-4 self-center rounded-card bg-background p-6">
              <div className="flex flex-col gap-1">
                <p className="text-small text-muted-foreground">{t('specifics.callout')}</p>
                <PriceFrom
                  amount={callout.tiers[0]!.price}
                  unit={callout.unit}
                  locale={locale}
                  size="lg"
                />
              </div>
              {pricing.rules.diagnosticsCreditedToRepair ? (
                <p className="flex items-start gap-2 text-small text-foreground">
                  <InfoIcon
                    aria-hidden="true"
                    strokeWidth={1.5}
                    className="mt-0.5 size-4 shrink-0 text-highlight-ink"
                  />
                  {t('specifics.credited')}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </Section>
    );
  }

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

function Callout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-10 flex items-start gap-4 rounded-card border border-warning/30 bg-warning-soft p-5 text-warning-ink">
      <InfoIcon aria-hidden="true" strokeWidth={1.5} className="mt-0.5 size-5 shrink-0" />
      <div className="flex flex-col gap-1">
        <p className="text-body font-medium">{title}</p>
        <p className="text-body">{children}</p>
      </div>
    </div>
  );
}
