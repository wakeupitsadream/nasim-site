'use client';

import { useTranslations } from 'next-intl';
import { Ltr } from '@/components/ltr';
import type { BookingPayload } from '@/components/booking/types';
import type { BookingState } from '@/lib/booking/state';
import { dayOptions, windowOptions, type WindowKey } from '@/lib/booking/time';
import { formatDay, formatTimeRange } from '@/lib/i18n/format';
import { cn } from '@/lib/utils';

type Props = {
  payload: BookingPayload;
  state: BookingState;
  emergency: boolean;
  onDay: (day: string) => void;
  onWindow: (window: WindowKey) => void;
  onArea: (area: string | null) => void;
};

const chip =
  'inline-flex min-h-tap cursor-pointer items-center justify-center rounded-full border px-4 text-body transition-colors duration-(--nasim-dur-fast) has-focus-visible:ring-3 has-focus-visible:ring-ring has-focus-visible:ring-offset-2 has-disabled:cursor-not-allowed has-disabled:opacity-50 has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground border-border bg-card text-foreground hover:border-line-strong';

/** Step 3: preferred day and time window (optional area). The clock came in with `next`. */
export function StepTime({ payload, state, emergency, onDay, onWindow, onArea }: Props) {
  const t = useTranslations('Booking');
  const { locale, booking } = payload;
  const clock = state.clock!;
  const days = dayOptions(clock, booking, { emergency });
  const day = state.day ?? days[0]?.date ?? clock.date;
  const windows = windowOptions(day, clock, booking, { emergency });

  return (
    <div className="flex flex-col gap-8">
      <fieldset>
        <legend className="mb-3 text-body font-medium text-foreground">{t('time.day')}</legend>
        <div className="-mx-gutter flex snap-x gap-2 overflow-x-auto px-gutter pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
          {days.map((option) => (
            <label
              key={option.date}
              className={cn(chip, 'shrink-0 snap-start flex-col gap-0 py-2 leading-tight')}
            >
              <input
                type="radio"
                name="booking-day"
                value={option.date}
                checked={day === option.date}
                onChange={() => onDay(option.date)}
                className="sr-only"
              />
              {option.kind !== 'date' ? (
                <span className="text-small font-medium">{t(`time.${option.kind}`)}</span>
              ) : null}
              <span className={cn(option.kind !== 'date' && 'text-small opacity-80')}>
                <Ltr>{formatDay(option.date, locale)}</Ltr>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-body font-medium text-foreground">{t('time.window')}</legend>
        <div className="flex flex-wrap gap-2">
          {windows.map((option) => (
            <label key={option.key} className={cn(chip, 'flex-col gap-0 py-2 leading-tight')}>
              <input
                type="radio"
                name="booking-window"
                value={option.key}
                checked={(state.window ?? 'any') === option.key}
                disabled={!option.available}
                onChange={() => onWindow(option.key)}
                className="sr-only"
              />
              <span className="font-medium">{t(`time.windows.${option.key}`)}</span>
              {option.from && option.to ? (
                <span className="text-small opacity-80">
                  <Ltr>{formatTimeRange(option.from, option.to)}</Ltr>
                </span>
              ) : null}
              {!option.available ? (
                <span className="text-small opacity-80">{t('time.tooLate')}</span>
              ) : null}
            </label>
          ))}
        </div>
        <p className="mt-3 text-small text-muted-foreground">{t('time.confirmNote')}</p>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-body font-medium text-foreground">{t('time.area')}</legend>
        <div className="flex flex-wrap gap-2">
          {payload.areas.map((area) => (
            <label key={area.slug} className={cn(chip, 'min-h-10 text-small')}>
              <input
                type="radio"
                name="booking-area"
                value={area.slug}
                checked={state.area === area.slug}
                onChange={() => onArea(area.slug)}
                className="sr-only"
              />
              <span lang={area.name.lang !== locale ? area.name.lang : undefined}>
                {area.name.text}
              </span>
            </label>
          ))}
          <label className={cn(chip, 'min-h-10 text-small')}>
            <input
              type="radio"
              name="booking-area"
              value="other"
              checked={state.area === 'other'}
              onChange={() => onArea('other')}
              className="sr-only"
            />
            {t('time.areaOther')}
          </label>
        </div>
      </fieldset>
    </div>
  );
}
