'use client';

import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Ltr } from '@/components/ltr';
import { PriceSummary } from '@/components/booking/price-summary';
import {
  QuantityControls,
  QuantityStepper,
  TierPrices,
} from '@/components/booking/quantity-stepper';
import type { BookingPayload, BookingService } from '@/components/booking/types';
import type { Locale } from '@/lib/i18n/routing';
import type { Localized } from '@/lib/i18n/text';
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
    const key = service.group ?? 'other';
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
  const tPrice = useTranslations('Price');
  const groupId = useId();
  const { locale, pricing } = payload;
  const services = payload.services.filter((s) => s.category === state.category);
  const groups = groupServices(services);
  const tiered = (service: BookingService) =>
    service.lines.some((id) => (findLine(pricing, id)?.tiers.length ?? 0) > 1);
  // "The more units, the lower the price" is said once, above the first section it applies to.
  const hintGroup = groups.find((g) => g.services.some(tiered))?.key;
  // Upholstery services open on a tap; on arrival the first one and those with a choice are open.
  const [openAtMount] = useState(
    () =>
      new Set(
        services
          .filter((s, i) => i === 0 || s.lines.some((id) => (state.selection[id] ?? 0) > 0))
          .map((s) => s.slug),
      ),
  );

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
                      {group.key === hintGroup ? (
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

        {state.category === 'upholstery' ? (
          <div className="flex flex-col gap-3">
            <p className="sr-only">{t('details.upholsteryQuestion')}</p>
            {services.map((service) => {
              const headingId = `${groupId}-${service.slug}`;
              const foreign = service.name.lang !== locale;
              const chosen = service.lines.reduce((n, id) => n + (state.selection[id] ?? 0), 0);
              return (
                // Twenty rows in one list is a long scroll on a phone: each service opens on a
                // tap. Open/closed belongs to the browser after the first render.
                <details
                  key={service.slug}
                  open={openAtMount.has(service.slug)}
                  aria-labelledby={headingId}
                  className="group rounded-card border border-border bg-card"
                >
                  <summary className="flex min-h-tap cursor-pointer list-none items-center justify-between gap-4 rounded-card p-4 outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span
                        id={headingId}
                        lang={foreign ? service.name.lang : undefined}
                        className="text-body font-medium text-foreground"
                      >
                        {service.name.text}
                      </span>
                      {service.priceFrom ? (
                        <span className="text-small text-muted-foreground">
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
                        </span>
                      ) : null}
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      {chosen > 0 ? (
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-small font-medium text-primary-foreground tabular-nums">
                          <Ltr>{formatNumber(chosen, locale)}</Ltr>
                        </span>
                      ) : null}
                      <ChevronDownIcon
                        aria-hidden="true"
                        strokeWidth={1.5}
                        className="size-5 text-muted-foreground transition-transform duration-(--nasim-dur) ease-brand group-open:rotate-180"
                      />
                    </span>
                  </summary>
                  <div className="border-t border-border px-4">
                    {service.short.text ? (
                      <p
                        lang={service.short.lang !== locale ? service.short.lang : undefined}
                        dir={service.short.lang !== locale ? 'auto' : undefined}
                        className="pt-3 text-small text-pretty text-muted-foreground"
                      >
                        {service.short.text}
                      </p>
                    ) : null}
                    <div className="flex flex-col divide-y divide-border">
                      {service.lines.map((id) => {
                        const line = findLine(pricing, id)!;
                        const label = payload.lineLabels[id] ?? { text: id, lang: locale };
                        return line.unit === 'from' ? (
                          <EstimateToggle
                            key={id}
                            line={line}
                            label={label}
                            note={payload.lineNotes[id]}
                            checked={(state.selection[id] ?? 0) > 0}
                            locale={locale}
                            onChange={(on) => onQty(id, on ? 1 : 0)}
                          />
                        ) : (
                          <QuantityStepper
                            key={id}
                            line={line}
                            label={label}
                            note={payload.lineNotes[id]}
                            qty={state.selection[id] ?? 0}
                            locale={locale}
                            onChange={(qty) => onQty(id, qty)}
                          />
                        );
                      })}
                    </div>
                  </div>
                </details>
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
 * 4+: AED 249»). The chosen card opens: first what the service is, then its own quantity row,
 * so the number of units and what it does to the price sit next to the choice, not below the
 * whole list.
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

      {checked && service.short.text ? (
        <p
          lang={service.short.lang !== locale ? service.short.lang : undefined}
          dir={service.short.lang !== locale ? 'auto' : undefined}
          className="border-t border-border px-4 py-3 text-small text-pretty text-muted-foreground"
        >
          {service.short.text}
        </p>
      ) : null}

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

type EstimateToggleProps = {
  line: PriceLine;
  label: Localized;
  note?: string;
  checked: boolean;
  locale: Locale;
  onChange: (checked: boolean) => void;
};

/**
 * A line priced "from" (specialist stain treatment) has no quantity: the customer ticks it, and
 * the booking becomes an estimate confirmed before the visit.
 */
function EstimateToggle({ line, label, note, checked, locale, onChange }: EstimateToggleProps) {
  const tPrice = useTranslations('Price');
  const foreign = label.lang !== locale;
  return (
    <label className="flex min-h-tap cursor-pointer items-center justify-between gap-4 py-4">
      <span className="flex min-w-0 flex-col gap-0.5">
        <span
          lang={foreign ? label.lang : undefined}
          dir={foreign ? 'auto' : undefined}
          className="text-body font-medium text-foreground"
        >
          {label.text}
        </span>
        <span className="text-small text-muted-foreground">
          {tPrice.rich('from', {
            amount: formatAED(line.tiers[0]!.price, locale),
            price: (chunks) => <Ltr className="tabular-nums">{chunks}</Ltr>,
          })}{' '}
          {tPrice('per.from')}
          {note ? ` · ${note}` : null}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-5 shrink-0 accent-primary"
      />
    </label>
  );
}
