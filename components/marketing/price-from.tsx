import type { ReactNode } from 'react';
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
  /** One fixed price: «AED 199 per visit», without "from". */
  exact?: boolean;
  size?: 'sm' | 'lg';
  /** The owner's own wording of the unit («per diagnostic visit») in place of the standard one. */
  unitLabel?: string;
  className?: string;
};

/** «from AED 149 per unit», the amount in tabular figures and always LTR. */
export async function PriceFrom({
  amount,
  unit,
  locale,
  exact,
  size = 'sm',
  unitLabel,
  className,
}: Props) {
  const t = await getTranslations('Price');
  const figure = (chunks: ReactNode) => (
    <Ltr
      className={cn(
        'font-medium text-foreground tabular-nums',
        size === 'lg' ? 'text-h3 font-light' : 'text-body',
      )}
    >
      {chunks}
    </Ltr>
  );
  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-1.5', className)}>
      <span className={cn('text-muted-foreground', size === 'lg' ? 'text-body' : 'text-small')}>
        {exact
          ? figure(formatAED(amount, locale))
          : t.rich('from', { amount: formatAED(amount, locale), price: figure })}
      </span>
      <span className={cn('text-muted-foreground', size === 'lg' ? 'text-body' : 'text-small')}>
        {unitLabel ?? t(`per.${unit}`)}
      </span>
    </span>
  );
}
