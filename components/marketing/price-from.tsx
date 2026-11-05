import { getTranslations } from 'next-intl/server';
import { Ltr } from '@/components/ltr';
import { formatAED } from '@/lib/i18n/format';
import type { Locale } from '@/lib/i18n/routing';
import type { PriceUnit } from '@/lib/validation/content';
import { cn } from '@/lib/utils';

type Props = {
  amount: number;
  unit: PriceUnit;
  locale: Locale;
  size?: 'sm' | 'lg';
  className?: string;
};

/** «from AED 149 per unit», the amount in tabular figures and always LTR. */
export async function PriceFrom({ amount, unit, locale, size = 'sm', className }: Props) {
  const t = await getTranslations('Price');
  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-1.5', className)}>
      <span className={cn('text-muted-foreground', size === 'lg' ? 'text-body' : 'text-small')}>
        {t.rich('from', {
          amount: formatAED(amount, locale),
          price: (chunks) => (
            <Ltr
              className={cn(
                'font-medium text-foreground tabular-nums',
                size === 'lg' ? 'text-h3 font-light' : 'text-body',
              )}
            >
              {chunks}
            </Ltr>
          ),
        })}
      </span>
      <span className={cn('text-muted-foreground', size === 'lg' ? 'text-body' : 'text-small')}>
        {t(`per.${unit}`)}
      </span>
    </span>
  );
}
