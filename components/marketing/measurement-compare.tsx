import { getTranslations } from 'next-intl/server';
import { Ltr } from '@/components/ltr';
import { formatNumber } from '@/lib/i18n/format';
import type { Locale } from '@/lib/i18n/routing';
import type { BlockValue } from '@/lib/validation/content';
import { cn } from '@/lib/utils';

type Props = { readings: BlockValue<'report.readings'>; locale: Locale; className?: string };

/** Before/after without photos: the outlet temperature from an example report. */
export async function MeasurementCompare({ readings, locale, className }: Props) {
  const t = await getTranslations('Report');
  const label = readings[locale]?.label ?? readings.en.label;
  const labelLang = readings[locale]?.label ? locale : 'en';
  const temp = (value: number) =>
    `${formatNumber(value, locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} °C`;

  return (
    <figure
      className={cn(
        'grid gap-6 rounded-panel border border-border bg-card p-6 shadow-card lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-10 lg:p-10',
        className,
      )}
    >
      <div className="flex flex-col gap-2 lg:col-span-3">
        <p
          lang={labelLang !== locale ? labelLang : undefined}
          dir={labelLang !== locale ? 'auto' : undefined}
          className="text-eyebrow text-highlight-ink"
        >
          {label}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-small text-muted-foreground">{t('before')}</span>
        <Ltr className="text-display font-light text-muted-foreground tabular-nums">
          {temp(readings.en.before_c)}
        </Ltr>
      </div>
      <div
        aria-hidden="true"
        className="h-12 w-1.5 rounded-full bg-linear-to-b from-line-strong via-highlight-soft to-highlight lg:h-32"
      />
      <div className="flex flex-col gap-1">
        <span className="text-small text-muted-foreground">{t('after')}</span>
        <Ltr className="text-display font-light text-primary tabular-nums">
          {temp(readings.en.after_c)}
        </Ltr>
      </div>
      <figcaption className="text-small text-muted-foreground lg:col-span-3">
        {t('example')}
      </figcaption>
    </figure>
  );
}
