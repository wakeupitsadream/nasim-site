'use client';

import { MinusIcon, PlusIcon } from 'lucide-react';
import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { Ltr } from '@/components/ltr';
import { formatAED, formatNumber } from '@/lib/i18n/format';
import type { Locale } from '@/lib/i18n/routing';
import type { Localized } from '@/lib/i18n/text';
import { sanitizeQty, tierRanges, type PriceLine } from '@/lib/pricing';
import { cn } from '@/lib/utils';

type Props = {
  line: PriceLine;
  label: Localized;
  qty: number;
  locale: Locale;
  /** The line's note, shown after its price («Where suitable and accessible»). */
  note?: string;
  onChange: (qty: number) => void;
};

/**
 * −/+ with a typed number in the middle. The first + jumps to the minimum charge; − below it
 * removes the line. Tier prices are shown as a ladder with the current step highlighted.
 */
export function QuantityStepper({ line, label, qty, locale, note, onChange }: Props) {
  const tPrice = useTranslations('Price');
  const id = useId();
  const fallback = label.lang !== locale;
  const tiered = line.tiers.length > 1;

  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-0.5">
        <label
          htmlFor={id}
          lang={fallback ? label.lang : undefined}
          dir={fallback ? 'auto' : undefined}
          className="text-body font-medium text-foreground"
        >
          {label.text}
        </label>
        <p id={`${id}-hint`} className="text-small text-muted-foreground">
          {tiered ? (
            <TierPrices line={line} qty={qty} locale={locale} />
          ) : (
            <>
              <Ltr>{formatAED(line.tiers[0]!.price, locale)}</Ltr> {tPrice(`per.${line.unit}`)}
              {line.minQty > 1 ? (
                <>
                  {' · '}
                  {tPrice('minimum', { qty: formatNumber(line.minQty, locale) })}
                </>
              ) : null}
              {note ? ` · ${note}` : null}
            </>
          )}
        </p>
      </div>
      <QuantityControls
        id={id}
        line={line}
        item={label.text}
        qty={qty}
        describedBy={`${id}-hint`}
        onChange={onChange}
      />
    </div>
  );
}

type TierPricesProps = { line: PriceLine; qty: number; locale: Locale; className?: string };

/** «1: AED 299 · 2–3: AED 279 · 4+: AED 249»: the price per unit at each quantity; the step
 * the current quantity falls on is highlighted. */
export function TierPrices({ line, qty, locale, className }: TierPricesProps) {
  const tPrice = useTranslations('Price');
  const ranges = tierRanges(line);
  const current = ranges.reduce((acc, r) => (qty >= r.from ? r : acc), ranges[0]!);

  return (
    <span className={cn('flex flex-wrap gap-x-3', className)}>
      {ranges.map((r) => (
        <span
          key={r.from}
          className={cn(r === current && qty > 0 && 'font-medium text-foreground')}
        >
          <Ltr>
            {r.to === null
              ? tPrice('tierPlus', { n: formatNumber(r.from, locale) })
              : r.to === r.from
                ? formatNumber(r.from, locale)
                : tPrice('tierRange', {
                    from: formatNumber(r.from, locale),
                    to: formatNumber(r.to, locale),
                  })}
            : {formatAED(r.price, locale)}
          </Ltr>
        </span>
      ))}
    </span>
  );
}

type QuantityControlsProps = {
  /** Id of the number input: the caller's <label htmlFor> points at it. */
  id: string;
  line: PriceLine;
  /** What is counted, for the −/+ button names («Add one: Sofa»). */
  item: string;
  qty: number;
  describedBy?: string;
  onChange: (qty: number) => void;
};

/** The −/number/+ trio on its own. The first + jumps to the minimum charge; − below it removes
 * the line. */
export function QuantityControls({
  id,
  line,
  item,
  qty,
  describedBy,
  onChange,
}: QuantityControlsProps) {
  const t = useTranslations('Booking');
  const set = (next: number) => {
    const n = sanitizeQty(next);
    if (n === 0) return onChange(0);
    onChange(n < line.minQty ? (qty === 0 || next > qty ? line.minQty : 0) : n);
  };

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        aria-label={t('details.dec', { item })}
        onClick={() => set(qty - 1)}
        disabled={qty === 0}
        className="inline-flex size-tap items-center justify-center rounded-lg border border-input bg-card text-foreground transition-[background-color,scale] duration-(--nasim-dur-fast) outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring disabled:opacity-40 motion-safe:active:scale-90"
      >
        <MinusIcon aria-hidden="true" strokeWidth={1.5} className="size-5" />
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        max={999}
        value={qty}
        aria-describedby={describedBy}
        onChange={(e) => set(Number(e.target.value))}
        className="h-tap w-16 [appearance:textfield] rounded-lg border border-input bg-card text-center text-body tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label={t('details.inc', { item })}
        onClick={() => set(qty + 1)}
        className="inline-flex size-tap items-center justify-center rounded-lg border border-input bg-card text-foreground transition-[background-color,scale] duration-(--nasim-dur-fast) outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring motion-safe:active:scale-90"
      >
        <PlusIcon aria-hidden="true" strokeWidth={1.5} className="size-5" />
      </button>
    </div>
  );
}
