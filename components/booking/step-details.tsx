'use client';

import { CheckIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Ltr } from '@/components/ltr';
import { PriceSummary } from '@/components/booking/price-summary';
import { QuantityStepper } from '@/components/booking/quantity-stepper';
import type { BookingPayload, BookingService } from '@/components/booking/types';
import type { BookingState } from '@/lib/booking/state';
import { formatAED, formatMinutes } from '@/lib/i18n/format';
import { findLine, type BundleSuggestion, type Quote } from '@/lib/pricing';
import { cn } from '@/lib/utils';

type Props = {
  payload: BookingPayload;
  state: BookingState;
  quote: Quote;
  suggestion: BundleSuggestion | null;
  errorId: string;
  onChooseService: (service: BookingService) => void;
  onQty: (lineId: string, qty: number) => void;
  onAddLines: (add: Record<string, number>) => void;
};

/** Step 2: the service (AC) or the items (upholstery), quantities and the live price. */
export function StepDetails({
  payload,
  state,
  quote,
  suggestion,
  errorId,
  onChooseService,
  onQty,
  onAddLines,
}: Props) {
  const t = useTranslations('Booking');
  const tPrice = useTranslations('Price');
  const { locale, pricing } = payload;
  const services = payload.services.filter((s) => s.category === state.category);
  const activeService = services.find((s) => s.slug === state.acService) ?? null;

  const stepperLines =
    state.category === 'ac'
      ? (activeService?.lines ?? [])
      : services.flatMap((s) => s.lines).filter((id, i, arr) => arr.indexOf(id) === i);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
      <div className="flex flex-col gap-6">
        {state.category === 'ac' ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">{t('details.acQuestion')}</legend>
            {services.map((service) => {
              const checked = service.slug === state.acService;
              return (
                <label
                  key={service.slug}
                  className={cn(
                    'relative flex cursor-pointer items-center gap-4 rounded-card border bg-card p-4 transition-colors duration-(--nasim-dur-fast) has-focus-visible:ring-3 has-focus-visible:ring-ring has-focus-visible:ring-offset-2',
                    checked
                      ? 'border-primary ring-1 ring-primary'
                      : 'border-border hover:border-line-strong',
                  )}
                >
                  <input
                    type="radio"
                    name="ac-service"
                    value={service.slug}
                    checked={checked}
                    onChange={() => onChooseService(service)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-full border',
                      checked
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-line-strong',
                    )}
                  >
                    {checked ? <CheckIcon strokeWidth={2.5} className="size-3.5" /> : null}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span
                      lang={service.name.lang !== locale ? service.name.lang : undefined}
                      className="text-body font-medium text-foreground"
                    >
                      {service.name.text}
                    </span>
                    <span className="text-small text-muted-foreground">
                      {service.priceFrom ? (
                        <>
                          {tPrice.rich('from', {
                            amount: formatAED(service.priceFrom.amount, locale),
                            price: (chunks) => <Ltr className="tabular-nums">{chunks}</Ltr>,
                          })}{' '}
                          {tPrice(`per.${service.priceFrom.unit}`)}
                        </>
                      ) : null}
                      {service.durationMin
                        ? ` · ${formatMinutes(service.durationMin, locale)}`
                        : null}
                    </span>
                  </span>
                </label>
              );
            })}
          </fieldset>
        ) : null}

        {stepperLines.length > 0 ? (
          <div className="flex flex-col divide-y divide-border rounded-card border border-border bg-card px-5">
            {state.category === 'upholstery' ? (
              <p className="sr-only">{t('details.upholsteryQuestion')}</p>
            ) : null}
            {stepperLines.map((id) => {
              const line = findLine(pricing, id)!;
              if (line.unit === 'from') return null;
              return (
                <QuantityStepper
                  key={id}
                  line={line}
                  label={payload.lineLabels[id] ?? { text: id, lang: locale }}
                  qty={state.selection[id] ?? 0}
                  locale={locale}
                  onChange={(qty) => onQty(id, qty)}
                />
              );
            })}
          </div>
        ) : null}

        {state.error === 'emptySelection' ? (
          <p id={errorId} role="alert" className="text-small font-medium text-danger-ink">
            {t('details.empty')}
          </p>
        ) : null}
      </div>

      <aside className="h-fit rounded-card border border-border bg-background p-5 lg:sticky lg:top-[calc(var(--nasim-header-h)+1rem)]">
        <PriceSummary
          payload={payload}
          quote={quote}
          suggestion={suggestion}
          onAddSuggestion={onAddLines}
        />
      </aside>
    </div>
  );
}
