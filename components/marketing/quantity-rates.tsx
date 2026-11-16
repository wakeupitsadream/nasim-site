import { getTranslations } from 'next-intl/server';
import { LocalizedText } from '@/components/localized-text';
import { Ltr } from '@/components/ltr';
import { tierLabel } from '@/components/marketing/price-table';
import { formatAED } from '@/lib/i18n/format';
import type { Locale } from '@/lib/i18n/routing';
import { pickLocalized } from '@/lib/i18n/text';
import type { PriceItem } from '@/lib/validation/content';
import { cn } from '@/lib/utils';

type Props = { items: PriceItem[]; locale: Locale; className?: string };

/**
 * «2–3 units · AED 279 per unit» rows: the lower rates of a service priced by quantity, shown
 * under its one-unit price. Renders nothing for a service without quantity rates.
 */
export async function QuantityRates({ items, locale, className }: Props) {
  const rates = items
    .filter((i) => i.tier_group && i.tier_from_qty > 1 && !i.on_request)
    .sort((a, b) => a.tier_from_qty - b.tier_from_qty);
  if (rates.length === 0) return null;
  const tPrice = await getTranslations('Price');

  return (
    <ul className={cn('flex flex-col gap-1.5 text-small text-muted-foreground', className)}>
      {rates.map((item) => (
        <li key={item.key} className="flex items-baseline justify-between gap-4">
          <LocalizedText value={tierLabel(pickLocalized(item.name, locale))} locale={locale} />
          <span className="shrink-0">
            <Ltr className="text-body font-medium text-foreground tabular-nums">
              {formatAED(item.price, locale)}
            </Ltr>{' '}
            {tPrice(`per.${item.unit}`)}
          </span>
        </li>
      ))}
    </ul>
  );
}
