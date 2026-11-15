'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Ltr } from '@/components/ltr';
import type { BookingPayload } from '@/components/booking/types';
import { formatAED, formatNumber } from '@/lib/i18n/format';
import { estimateFloor, type BundleSuggestion, type Quote } from '@/lib/pricing';
import { cn } from '@/lib/utils';

type Props = {
  payload: BookingPayload;
  quote: Quote;
  suggestion?: BundleSuggestion | null;
  onAddSuggestion?: (add: Record<string, number>) => void;
  /** The "this is my first booking" checkbox; without a handler only the applied row shows. */
  firstBooking?: boolean;
  onFirstBooking?: (value: boolean) => void;
  compact?: boolean;
};

/** Breakdown, bundle, estimate note and the total; the total alone is announced (debounced). */
export function PriceSummary({
  payload,
  quote,
  suggestion,
  onAddSuggestion,
  firstBooking = false,
  onFirstBooking,
  compact,
}: Props) {
  const t = useTranslations('Booking');
  const tPrice = useTranslations('Price');
  const { locale } = payload;
  const money = (n: number) => formatAED(n, locale);
  const [announced, setAnnounced] = useState('');
  // An estimate with nothing fixed up front (drain unblocking) totals "from AED 299".
  const floor = estimateFloor(quote);
  const totalText =
    floor !== null ? t('summary.fromLine', { amount: money(floor) }) : money(quote.total);

  useEffect(() => {
    const id = setTimeout(() => setAnnounced(t('summary.live', { total: totalText })), 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalText]);

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
        {quote.offer?.applied ? (
          <div className="flex items-baseline justify-between gap-4 text-highlight-ink">
            <dt>{tPrice('firstBooking.title')}</dt>
            <dd className="shrink-0 tabular-nums">
              <Ltr>−{money(quote.offer.discount)}</Ltr>
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
        <span className="font-medium text-foreground">{t('summary.total')}</span>
        <span className="text-h3 font-light text-primary tabular-nums">
          {/* Remounted on every change, so the total "pops" once (styles/motion.css `.pop`). */}
          <Ltr key={totalText} className="pop inline-block">
            {totalText}
          </Ltr>
          {quote.kind === 'estimate' && floor === null ? (
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

      {quote.offer && !compact ? (
        <div className="flex flex-col gap-2 rounded-card bg-mist p-4 text-small text-foreground">
          <p className="font-medium">{tPrice('firstBooking.title')}</p>
          <p className="text-muted-foreground">
            {tPrice.rich('firstBooking.text', {
              discount: money(quote.offer.discount),
              min: money(quote.offer.minTotal),
              price: (chunks) => <Ltr className="tabular-nums">{chunks}</Ltr>,
            })}
          </p>
          {quote.offer.eligible && onFirstBooking ? (
            <label className="flex min-h-tap cursor-pointer items-center gap-3 font-medium">
              <input
                type="checkbox"
                checked={firstBooking}
                onChange={(event) => onFirstBooking(event.target.checked)}
                className="size-5 shrink-0 accent-primary"
              />
              {t('firstBooking.apply')}
            </label>
          ) : null}
        </div>
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
