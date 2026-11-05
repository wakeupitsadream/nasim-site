'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Ltr } from '@/components/ltr';
import type { BookingPayload } from '@/components/booking/types';
import { formatAED, formatNumber } from '@/lib/i18n/format';
import type { BundleSuggestion, Quote } from '@/lib/pricing';
import { cn } from '@/lib/utils';

type Props = {
  payload: BookingPayload;
  quote: Quote;
  suggestion?: BundleSuggestion | null;
  onAddSuggestion?: (add: Record<string, number>) => void;
  compact?: boolean;
};

/** Breakdown, bundle, estimate note and the total; the total alone is announced (debounced). */
export function PriceSummary({ payload, quote, suggestion, onAddSuggestion, compact }: Props) {
  const t = useTranslations('Booking');
  const tPrice = useTranslations('Price');
  const { locale } = payload;
  const money = (n: number) => formatAED(n, locale);
  const [announced, setAnnounced] = useState('');

  useEffect(() => {
    const id = setTimeout(
      () => setAnnounced(t('summary.live', { total: money(quote.total) })),
      400,
    );
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote.total]);

  const bundleName = (slug: string) => payload.bundleNames[slug]?.text ?? slug;

  return (
    <div className={cn('flex flex-col gap-3', compact ? 'text-small' : 'text-body')}>
      <dl className="flex flex-col gap-2">
        {quote.lines.map((line) => (
          <div key={line.lineId} className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">
              {line.role === 'diagnostics'
                ? t('summary.diagnostics')
                : payload.lineLabels[line.lineId]?.text}
              {line.role === 'item' ? (
                <span className="text-small">
                  {' · '}
                  <Ltr>
                    {t('summary.line', {
                      qty: formatNumber(line.billableQty, locale),
                      price: money(line.unitPrice),
                    })}
                  </Ltr>
                  {line.minApplied ? ` · ${t('summary.minApplied')}` : null}
                </span>
              ) : null}
              {line.role === 'diagnostics' && quote.estimate?.credited ? (
                <span className="text-small">{` · ${t('summary.credited')}`}</span>
              ) : null}
            </dt>
            <dd className="shrink-0 tabular-nums">
              <Ltr>{money(line.total)}</Ltr>
            </dd>
          </div>
        ))}
        {quote.estimate?.fromLines.map((line) => (
          <div key={line.lineId} className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">{payload.lineLabels[line.lineId]?.text}</dt>
            <dd className="shrink-0 tabular-nums">
              <Ltr>{t('summary.fromLine', { amount: money(line.from) })}</Ltr>
            </dd>
          </div>
        ))}
        {quote.bundle ? (
          <div className="flex items-baseline justify-between gap-4 text-highlight-ink">
            <dt>{t('summary.bundle', { name: bundleName(quote.bundle.slug) })}</dt>
            <dd className="shrink-0 tabular-nums">
              <Ltr>−{money(quote.savings)}</Ltr>
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
        <span className="font-medium text-foreground">{t('summary.total')}</span>
        <span className="text-h3 font-light text-primary tabular-nums">
          <Ltr>{money(quote.total)}</Ltr>
          {quote.kind === 'estimate' ? (
            <span className="ms-1 text-small font-normal text-muted-foreground">
              {tPrice('per.from')}
            </span>
          ) : null}
        </span>
      </div>
      {quote.vat.mode === 'added' ? (
        <p className="text-small text-muted-foreground">
          <Ltr>{money(quote.vat.totalWithVat)}</Ltr>
        </p>
      ) : null}
      {quote.kind === 'estimate' ? (
        <p className="text-small text-muted-foreground">{t('summary.estimateNote')}</p>
      ) : null}
      {quote.bundle ? (
        <p className="text-small text-highlight-ink">
          {t('summary.save', { amount: money(quote.savings) })}
        </p>
      ) : null}

      {suggestion && onAddSuggestion ? (
        <div className="flex flex-col gap-3 rounded-card bg-mist p-4 text-small text-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            {t('offer.text', {
              items: Object.entries(suggestion.add)
                .map(
                  (entry) =>
                    `${payload.lineLabels[entry[0]]?.text ?? entry[0]} × ${formatNumber(entry[1], locale)}`,
                )
                .join(', '),
              add: money(suggestion.addCost),
              name: bundleName(suggestion.slug),
              savings: money(suggestion.savings),
            })}
          </p>
          <button
            type="button"
            onClick={() => onAddSuggestion(suggestion.add)}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-primary px-4 text-small font-medium text-primary-foreground outline-none hover:bg-primary-hover focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {t('offer.add')}
          </button>
        </div>
      ) : null}

      <p aria-live="polite" className="sr-only">
        {announced}
      </p>
    </div>
  );
}
