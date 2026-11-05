'use client';

import { useTranslations } from 'next-intl';
import { STEPS, type Step } from '@/lib/booking/state';
import { formatNumber } from '@/lib/i18n/format';
import type { Locale } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

export function Progress({ step, locale }: { step: Step; locale: Locale }) {
  const t = useTranslations('Booking');
  const index = STEPS.indexOf(step);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-small text-muted-foreground">
        {t('progress', {
          step: formatNumber(index + 1, locale),
          total: formatNumber(STEPS.length, locale),
        })}
      </p>
      <ol aria-label={t('progressLabel')} className="flex gap-1.5">
        {STEPS.map((s, i) => (
          <li
            key={s}
            aria-current={s === step ? 'step' : undefined}
            className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-line-strong"
          >
            {/* The fill grows from the inline start as the step is reached (`.grow-x`). */}
            <span
              aria-hidden="true"
              className={cn(
                'grow-x absolute inset-0 rounded-full bg-primary transition-transform duration-(--nasim-dur-slow) ease-brand-out',
                i <= index ? 'scale-x-100' : 'scale-x-0',
              )}
            />
            <span className="sr-only">{t(`steps.${s}`)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
