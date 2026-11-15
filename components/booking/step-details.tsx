'use client';

import { CheckIcon } from 'lucide-react';
import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { Ltr } from '@/components/ltr';
import { PriceSummary } from '@/components/booking/price-summary';
import {
  QuantityControls,
  QuantityStepper,
  TierPrices,
} from '@/components/booking/quantity-stepper';
import type { BookingPayload, BookingService } from '@/components/booking/types';
import type { BookingState } from '@/lib/booking/state';
import { formatAED, formatMinutes, formatNumber } from '@/lib/i18n/format';
import { findLine, type BundleSuggestion, type PriceLine, type Quote } from '@/lib/pricing';
import { cn } from '@/lib/utils';
import type { PriceUnit } from '@/lib/validation/content';

type Props = {
  payload: BookingPayload;
  state: BookingState;
  quote: Quote;
  suggestion: BundleSuggestion | null;
  errorId: string;
  onChooseService: (service: BookingService) => void;
  onQty: (lineId: string, qty: number) => void;
  onAddLines: (add: Record<string, number>) => void;
  onFirstBooking: (value: boolean) => void;
};

/** A line the customer sets a quantity for; estimates ("from") have none. */
type CountableLine = PriceLine & { unit: Exclude<PriceUnit, 'from'> };
const isCountable = (line: PriceLine | undefined): line is CountableLine =>
  line !== undefined && line.unit !== 'from';

/** Services in their catalogue groups, in the order they first appear. */
function groupServices(services: BookingService[]) {
  const groups: { key: string; services: BookingService[] }[] = [];
  for (const service of services) {
    const key = service.group ?? 'service';
    const group = groups.find((g) => g.key === key);
    if (group) group.services.push(service);
    else groups.push({ key, services: [service] });
  }
  return groups;
}

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
  onFirstBooking,
}: Props) {
  const t = useTranslations('Booking');
  const groupId = useId();
  const { locale, pricing } = payload;
  const services = payload.services.filter((s) => s.category === state.category);
  const groups = groupServices(services);
  const tiered = (service: BookingService) =>
    service.lines.some((id) => (findLine(pricing, id)?.tiers.length ?? 0) > 1);

  const upholsteryLines =
    state.category === 'upholstery'
      ? services.flatMap((s) => s.lines).filter((id, i, arr) => arr.indexOf(id) === i)
      : [];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
      <div className="flex flex-col gap-6">
        {state.category === 'ac' ? (
          <fieldset className="flex flex-col gap-6">
            <legend className="sr-only">{t('details.acQuestion')}</legend>
            {groups.map((group) => {
              const label = payload.groupLabels[group.key as keyof typeof payload.groupLabels];
              const headingId = `${groupId}-${group.key}`;
              return (
                <div
                  key={group.key}
                  role="group"
                  aria-labelledby={label && groups.length > 1 ? headingId : undefined}
                  className="flex flex-col gap-2"
                >
                  {label && groups.length > 1 ? (
                    <div className="flex flex-col gap-1 pb-1">
                      <p id={headingId} className="text-eyebrow text-highlight-ink">
                        {label}
                      </p>
                      {group.services.some(tiered) ? (
                        <p className="text-small text-muted-foreground">{t('details.tiersHint')}</p>
                      ) : null}
                    </div>
                  ) : null}
                  {group.services.map((service) => (
                    <AcService
                      key={service.slug}
                      service={service}
                      checked={service.slug === state.acService}
                      payload={payload}
                      state={state}
                      quote={quote}
                      onChoose={onChooseService}
                      onQty={onQty}
                    />
                  ))}
                </div>
              );
            })}
          </fieldset>
        ) : null}

        {upholsteryLines.length > 0 ? (
          <div className="flex flex-col divide-y divide-border rounded-card border border-border bg-card px-5">
            <p className="sr-only">{t('details.upholsteryQuestion')}</p>
            {upholsteryLines.map((id) => {
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
          firstBooking={state.firstBooking}
          onFirstBooking={onFirstBooking}
        />
      </aside>
    </div>
  );
}

type AcServiceProps = {
  service: BookingService;
  checked: boolean;
  payload: BookingPayload;
  state: BookingState;
  quote: Quote;
  onChoose: (service: BookingService) => void;
  onQty: (lineId: string, qty: number) => void;
};

/**
 * One AC service: a radio card with its price at every quantity («1: AED 299 · 2–3: AED 279 ·
 * 4+: AED 249»). The chosen card opens its own quantity row, so the number of units and what it
 * does to the price sit next to the choice, not below the whole list.
 */
function AcService({ service, checked, payload, state, quote, onChoose, onQty }: AcServiceProps) {
  const t = useTranslations('Booking');
  const tPrice = useTranslations('Price');
  const id = useId();
  const { locale, pricing } = payload;
  const line = service.lines.map((lineId) => findLine(pricing, lineId)).find(isCountable);
  const qty = checked && line ? (state.selection[line.id] ?? 0) : 0;
  const quoted =
    checked && line
      ? quote.lines.find((l) => l.lineId === line.id && l.role === 'item')
      : undefined;
  const duration = service.durationMin ? ` · ${formatMinutes(service.durationMin, locale)}` : null;

  return (
    <div
      className={cn(
        'rounded-card border bg-card transition-colors duration-(--nasim-dur-fast)',
        checked ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-line-strong',
      )}
    >
      <label className="relative flex cursor-pointer items-center gap-4 rounded-card p-4 has-focus-visible:ring-3 has-focus-visible:ring-ring has-focus-visible:ring-offset-2">
        <input
          type="radio"
          name="ac-service"
          value={service.slug}
          checked={checked}
          onChange={() => onChoose(service)}
          className="sr-only"
        />
        <span
          aria-hidden="true"
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-full border',
            checked ? 'border-primary bg-primary text-primary-foreground' : 'border-line-strong',
          )}
        >
          {checked ? (
            <CheckIcon
              strokeWidth={2.5}
              className="size-3.5 motion-safe:animate-in motion-safe:duration-(--nasim-dur-fast) motion-safe:zoom-in-50"
            />
          ) : null}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span
            lang={service.name.lang !== locale ? service.name.lang : undefined}
            className="text-body font-medium text-foreground"
          >
            {service.name.text}
          </span>
          <span id={`${id}-price`} className="flex flex-col text-small text-muted-foreground">
            {line && line.tiers.length > 1 ? (
              <>
                <TierPrices line={line} qty={qty} locale={locale} />
                <span>
                  {tPrice(`per.${line.unit}`)}
                  {duration}
                </span>
              </>
            ) : (
              <span>
                {service.priceFrom ? (
                  <>
                    {service.priceFrom.exact ? (
                      <Ltr className="tabular-nums">
                        {formatAED(service.priceFrom.amount, locale)}
                      </Ltr>
                    ) : (
                      tPrice.rich('from', {
                        amount: formatAED(service.priceFrom.amount, locale),
                        price: (chunks) => <Ltr className="tabular-nums">{chunks}</Ltr>,
                      })
                    )}{' '}
                    {tPrice(`per.${service.priceFrom.unit}`)}
                  </>
                ) : null}
                {duration}
              </span>
            )}
          </span>
        </span>
      </label>

      {checked && line ? (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-t border-border px-4 py-3">
          <label htmlFor={id} className="text-small font-medium text-foreground">
            {t(`details.qty.${line.unit}`)}
          </label>
          <QuantityControls
            id={id}
            line={line}
            item={service.name.text}
            qty={qty}
            describedBy={`${id}-price`}
            onChange={(next) => onQty(line.id, next)}
          />
          {quoted ? (
            <>
              <span className="text-small text-muted-foreground">
                <Ltr className="tabular-nums">
                  {t('summary.line', {
                    qty: formatNumber(quoted.billableQty, locale),
                    price: formatAED(quoted.unitPrice, locale),
                  })}
                </Ltr>
                {quoted.minApplied ? ` · ${t('summary.minApplied')}` : null}
              </span>
              <Ltr className="text-end text-body font-medium text-foreground tabular-nums">
                {formatAED(quoted.total, locale)}
              </Ltr>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
