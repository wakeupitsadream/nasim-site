import { ArrowRightIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { LocalizedText } from '@/components/localized-text';
import { Ltr } from '@/components/ltr';
import { Section } from '@/components/marketing/section';
import { SectionHeader } from '@/components/marketing/section-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getPackages } from '@/lib/content/queries';
import { formatAED } from '@/lib/i18n/format';
import { Link } from '@/lib/i18n/navigation';
import type { Locale } from '@/lib/i18n/routing';
import { pickLocalized } from '@/lib/i18n/text';

/** Fresh Home bundle plus the three annual plans (seed packages). */
export async function PackagesTeaser({ locale }: { locale: Locale }) {
  const [t, tPrice, bundles, annual] = await Promise.all([
    getTranslations('Home'),
    getTranslations('Price'),
    getPackages({ type: 'bundle' }),
    getPackages({ type: 'annual' }),
  ]);
  const bundle = bundles[0];
  const savings =
    bundle?.type === 'bundle' && bundle.compare_price ? bundle.compare_price - bundle.price : null;

  return (
    <Section tone="surface" aria-labelledby="packages-title">
      <SectionHeader
        id="packages-title"
        eyebrow={t('packages.eyebrow')}
        title={t('packages.title')}
        actions={
          <Button variant="outline" size="lg" asChild>
            <Link href="/annual-contracts">
              {t('packages.all')}
              <ArrowRightIcon className="rtl:-scale-x-100" />
            </Link>
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        {bundle && bundle.type === 'bundle' ? (
          <div className="tone-deep flex flex-col gap-5 rounded-panel p-8 lg:col-span-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-h3 text-on-deep">
                <LocalizedText value={pickLocalized(bundle.name, locale)} locale={locale} />
              </h3>
              {savings ? (
                <Badge variant="highlight">
                  {tPrice('save', { amount: formatAED(savings, locale) })}
                </Badge>
              ) : null}
            </div>
            <p className="text-body text-on-deep-muted">
              <LocalizedText value={pickLocalized(bundle.description, locale)} locale={locale} />
            </p>
            <p className="mt-auto flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <Ltr className="text-h1 font-light text-on-deep tabular-nums">
                {formatAED(bundle.price, locale)}
              </Ltr>
              {bundle.compare_price ? (
                <span className="text-body text-on-deep-muted">
                  {tPrice.rich('insteadRich', {
                    amount: formatAED(bundle.compare_price, locale),
                    s: (chunks) => <Ltr className="tabular-nums line-through">{chunks}</Ltr>,
                  })}
                </span>
              ) : null}
            </p>
            <Button variant="inverse" size="lg" asChild className="self-start">
              <Link href="/pricing#book">{t('finalCta.primary')}</Link>
            </Button>
          </div>
        ) : null}
        <ul className="grid gap-4 lg:col-span-7">
          {annual.map((plan) => (
            <li
              key={plan.slug}
              className="flex flex-col gap-3 rounded-card border border-border bg-background p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
            >
              <div className="flex flex-col gap-1">
                <h3 className="flex items-center gap-2 text-lead font-medium text-foreground">
                  <LocalizedText value={pickLocalized(plan.name, locale)} locale={locale} />
                  {plan.highlighted ? (
                    <Badge variant="highlight">{tPrice('recommended')}</Badge>
                  ) : null}
                </h3>
                <p className="text-small text-muted-foreground">
                  <LocalizedText value={pickLocalized(plan.description, locale)} locale={locale} />
                </p>
              </div>
              <p className="shrink-0 text-small text-muted-foreground">
                {tPrice.rich('perYearRich', {
                  amount: formatAED(plan.price, locale),
                  a: (chunks) => (
                    <Ltr className="text-h3 font-light text-primary tabular-nums">{chunks}</Ltr>
                  ),
                })}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
