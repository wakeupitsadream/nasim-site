import { getTranslations } from 'next-intl/server';
import { Ltr } from '@/components/ltr';
import { formatAED, formatNumber } from '@/lib/i18n/format';
import type { Locale } from '@/lib/i18n/routing';
import { stagger } from '@/lib/motion';
import { tierRanges, type PriceLine } from '@/lib/pricing';
import { cn } from '@/lib/utils';

type Props = { line: PriceLine; locale: Locale; label: string; className?: string };

/** «1 · AED 349 — 2–3 · AED 299 — 4+ · AED 269»: the volume tiers of one price line. */
export async function TierLadder({ line, locale, label, className }: Props) {
  const tPrice = await getTranslations('Price');
  const ranges = tierRanges(line);
  if (ranges.length < 2) return null;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <p className="text-body font-medium text-foreground">{label}</p>
      <ol className="flex flex-wrap gap-2">
        {ranges.map((range, i) => (
          <li
            key={range.from}
            className={cn(
              'reveal flex min-w-28 flex-1 flex-col gap-1 rounded-card border border-border p-4 transition-[border-color,box-shadow] duration-(--nasim-dur) ease-brand hover:border-line-strong hover:shadow-card',
              i === ranges.length - 1 ? 'bg-mist' : 'bg-card',
            )}
            style={stagger(i)}
          >
            <span className="text-small text-muted-foreground">
              <Ltr>
                {range.to === null
                  ? tPrice('tierPlus', { n: formatNumber(range.from, locale) })
                  : range.to === range.from
                    ? formatNumber(range.from, locale)
                    : tPrice('tierRange', {
                        from: formatNumber(range.from, locale),
                        to: formatNumber(range.to, locale),
                      })}
              </Ltr>{' '}
              {tPrice(`per.${line.unit}`)}
            </span>
            <Ltr className="text-h3 font-light text-primary tabular-nums">
              {formatAED(range.price, locale)}
            </Ltr>
          </li>
        ))}
      </ol>
    </div>
  );
}
