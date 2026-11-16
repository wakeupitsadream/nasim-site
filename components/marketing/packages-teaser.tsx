import { ArrowRightIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { LocalizedText } from '@/components/localized-text';
import { Ltr } from '@/components/ltr';
import { Section, type SectionTone } from '@/components/marketing/section';
import { SectionHeader } from '@/components/marketing/section-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getPackages } from '@/lib/content/queries';
import { formatAED } from '@/lib/i18n/format';
import { Link } from '@/lib/i18n/navigation';
import type { Locale } from '@/lib/i18n/routing';
import { pickLocalized } from '@/lib/i18n/text';
import { stagger } from '@/lib/motion';
import { cn } from '@/lib/utils';

/** The cleaning bundles (the highlighted one on the dark tone) and the three annual plans. */
export async function PackagesTeaser({
  locale,
  tone = 'surface',
  id,
}: {
  locale: Locale;
  tone?: SectionTone;
  id?: string;
}) {
  const [t, tPrice, tContracts, bundles, annual] = await Promise.all([
    getTranslations('Home'),
    getTranslations('Price'),
    getTranslations('Contracts'),
    getPackages({ type: 'bundle' }),
    getPackages({ type: 'annual' }),
  ]);
  const bundleCards = bundles.filter((b) => b.type === 'bundle');

  return (
    <Section id={id} tone={tone} aria-labelledby="packages-title">
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
      <div className="flex flex-col gap-8">
        {bundleCards.length > 0 ? (
          <div className="flex flex-col gap-5">
            <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {bundleCards.map((bundle, i) => {
                const savings = bundle.compare_price ? bundle.compare_price - bundle.price : null;
                const deep = bundle.highlighted;
                return (
                  <li
                    key={bundle.slug}
                    data-tilt=""
                    className={cn(
                      'tilt reveal flex flex-col gap-4 rounded-panel p-6',
                      deep ? 'tone-deep' : 'border border-border bg-background',
                    )}
                    style={stagger(i)}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className={cn('text-h3', deep ? 'text-on-deep' : 'text-foreground')}>
                        <LocalizedText value={pickLocalized(bundle.name, locale)} locale={locale} />
                      </h3>
                      {savings ? (
                        <Badge variant="highlight">
                          {tPrice('save', { amount: formatAED(savings, locale) })}
                        </Badge>
                      ) : null}
                    </div>
                    <p
                      className={cn(
                        'text-body text-pretty',
                        deep ? 'text-on-deep-muted' : 'text-muted-foreground',
                      )}
                    >
                      <LocalizedText
                        value={pickLocalized(bundle.description, locale)}
                        locale={locale}
                      />
                    </p>
                    <p className="mt-auto flex flex-col gap-1">
                      <Ltr
                        className={cn(
                          'text-h2 font-light tabular-nums',
                          deep ? 'text-on-deep' : 'text-primary',
                        )}
                      >
                        {formatAED(bundle.price, locale)}
                      </Ltr>
                      {bundle.compare_price ? (
                        <span
                          className={cn(
                            'text-small',
                            deep ? 'text-on-deep-muted' : 'text-muted-foreground',
                          )}
                        >
                          {tPrice.rich('insteadRich', {
                            amount: formatAED(bundle.compare_price, locale),
                            s: (chunks) => (
                              <Ltr className="tabular-nums line-through">{chunks}</Ltr>
                            ),
                          })}
                        </span>
                      ) : null}
                    </p>
                  </li>
                );
              })}
            </ul>
            <Button size="lg" asChild className="self-start">
              <Link href="/pricing#book">{t('finalCta.primary')}</Link>
            </Button>
          </div>
        ) : null}
        <ul className="grid gap-4 lg:grid-cols-3">
          {annual.map((plan, i) => (
            <li
              key={plan.slug}
              className="reveal flex flex-col gap-3 rounded-card border border-border bg-background p-5 transition-[border-color,box-shadow] duration-(--nasim-dur) ease-brand hover:border-line-strong hover:shadow-card"
              style={stagger(i + 1)}
            >
              <div className="flex flex-col gap-1">
                <h3 className="flex flex-wrap items-center gap-2 text-lead font-medium text-foreground">
                  <LocalizedText value={pickLocalized(plan.name, locale)} locale={locale} />
                  {plan.highlighted ? (
                    <Badge variant="highlight">{tPrice('recommended')}</Badge>
                  ) : null}
                </h3>
                <p className="text-small text-pretty text-muted-foreground">
                  <LocalizedText value={pickLocalized(plan.description, locale)} locale={locale} />
                </p>
              </div>
              <p className="mt-auto text-small text-muted-foreground">
                {plan.price !== null ? (
                  tPrice.rich('perYearRich', {
                    amount: formatAED(plan.price, locale),
                    a: (chunks) => (
                      <Ltr className="text-h3 font-light text-primary tabular-nums">{chunks}</Ltr>
                    ),
                  })
                ) : (
                  <span className="text-body font-medium text-primary">
                    {tContracts('card.quote')}
                  </span>
                )}
              </p>
            </li>
          ))}
        </ul>
        <p className="text-small text-muted-foreground">{t('packages.plansNote')}</p>
      </div>
    </Section>
  );
}
