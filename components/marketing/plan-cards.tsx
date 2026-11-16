import { CheckIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { WhatsAppIcon } from '@/components/icons/brand';
import { LocalizedText } from '@/components/localized-text';
import { Ltr } from '@/components/ltr';
import { CtaLink } from '@/components/marketing/cta-link';
import { Badge } from '@/components/ui/badge';
import type { CtaTarget } from '@/lib/cta';
import { formatAED, formatNumber } from '@/lib/i18n/format';
import type { Locale } from '@/lib/i18n/routing';
import { pickLocalized } from '@/lib/i18n/text';
import { stagger } from '@/lib/motion';
import { annualPlanComparison, type PricingConfig } from '@/lib/pricing';
import { cn } from '@/lib/utils';
import type { AnnualPackage } from '@/lib/validation/content';

type Props = {
  plans: AnnualPackage[];
  pricing: PricingConfig;
  locale: Locale;
  /** The CTA target per plan slug: WhatsApp with the contract template, or /contact (№22). */
  targets: Record<string, CtaTarget>;
};

/**
 * The three annual plans as cards (BRIEF §6.4): what each includes, the price per year and what
 * the same visits cost one by one — the saving is computed by lib/pricing, never typed in.
 */
export async function PlanCards({ plans, pricing, locale, targets }: Props) {
  const [t, tPrice, tCommon] = await Promise.all([
    getTranslations('Contracts'),
    getTranslations('Price'),
    getTranslations('Common'),
  ]);

  return (
    <ul className="grid gap-6 lg:grid-cols-3 lg:gap-8">
      {plans.map((plan, i) => {
        const inc = plan.includes;
        const cmp = annualPlanComparison(pricing, plan);
        const features = [
          ...(inc.units_max !== null
            ? [t('includes.units', { n: formatNumber(inc.units_max, locale) })]
            : []),
          t('includes.visits', { n: formatNumber(inc.visits, locale) }),
          // Sized at the inspection: no unit count to show.
          ...(inc.units_max === null ? [t('includes.custom')] : []),
          ...(inc.deep_units > 0 ? [t('includes.deep')] : []),
          ...(inc.priority ? [t('includes.priority')] : []),
          ...(inc.repair_discount_pct > 0
            ? [t('includes.repairDiscount', { n: formatNumber(inc.repair_discount_pct, locale) })]
            : []),
        ];
        const target = targets[plan.slug];
        return (
          <li
            key={plan.slug}
            data-tilt=""
            className={cn(
              'tilt reveal relative flex flex-col gap-5 rounded-panel border bg-card p-6 shadow-card lg:p-8',
              plan.highlighted ? 'border-brand ring-1 ring-brand' : 'border-border',
            )}
            style={stagger(i)}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-h3 text-primary">
                <LocalizedText value={pickLocalized(plan.name, locale)} locale={locale} />
              </h3>
              {plan.highlighted ? <Badge variant="highlight">{tPrice('recommended')}</Badge> : null}
            </div>
            {plan.price !== null ? (
              <p className="text-muted-foreground">
                {tPrice.rich('perYearRich', {
                  amount: formatAED(plan.price, locale),
                  a: (chunks) => (
                    <Ltr className="text-h2 font-semibold text-primary tabular-nums">{chunks}</Ltr>
                  ),
                })}
              </p>
            ) : (
              <p className="text-h3 font-medium text-primary">{t('card.quote')}</p>
            )}
            <p className="text-body text-muted-foreground">
              <LocalizedText value={pickLocalized(plan.description, locale)} locale={locale} />
            </p>
            <ul className="flex flex-col gap-2.5">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-body">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-ink"
                  >
                    <CheckIcon strokeWidth={2.5} className="size-3" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            {cmp && cmp.saving > 0 ? (
              <p className="rounded-card bg-mist px-4 py-3 text-small text-muted-foreground">
                {t.rich('card.saving', {
                  separate: formatAED(cmp.separate, locale),
                  saving: formatAED(cmp.saving, locale),
                  pct: formatNumber(cmp.savingPct, locale),
                  s: (chunks) => <Ltr className="font-medium text-foreground">{chunks}</Ltr>,
                })}
              </p>
            ) : null}
            {target ? (
              <CtaLink
                target={target}
                newTabHint={tCommon('opensInNewTab')}
                variant={plan.highlighted ? 'primary' : 'outline'}
                size="lg"
                className="mt-auto"
              >
                <WhatsAppIcon className={plan.highlighted ? undefined : 'text-whatsapp'} />
                {t('card.cta')}
              </CtaLink>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
