'use client';

import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import {
  startTransition,
  useEffect,
  useId,
  useMemo,
  useReducer,
  useRef,
  ViewTransition,
} from 'react';
import { useTranslations } from 'next-intl';
import { Progress } from '@/components/booking/progress';
import { StepCategory } from '@/components/booking/step-category';
import { StepDetails } from '@/components/booking/step-details';
import { StepSend } from '@/components/booking/step-send';
import { StepTime } from '@/components/booking/step-time';
import type { BookingPayload, BookingService } from '@/components/booking/types';
import { Button } from '@/components/ui/button';
import { defaultSelection, initialState, reducer, type BookingState } from '@/lib/booking/state';
import { dayOptions, dubaiClock } from '@/lib/booking/time';
import { formatAED, formatDay, formatNumber } from '@/lib/i18n/format';
import { quote, suggestBundle } from '@/lib/pricing';
import { buildQuoteMessage } from '@/lib/whatsapp';

/**
 * The booking-request wizard (client island). State lives in a pure reducer; the only clock
 * read happens in the handler that enters the time step, so the prerendered first steps are
 * deterministic and never cause a hydration mismatch.
 */
export function BookingWizard({ payload }: { payload: BookingPayload }) {
  const t = useTranslations('Booking');
  const tPrice = useTranslations('Price');
  const { locale, pricing } = payload;
  const initial = useMemo(() => initialState(payload.initial), [payload.initial]);
  const [state, dispatch] = useReducer(reducer, initial);
  // Step changes run inside a React transition so the <ViewTransition> below animates them.
  const go = (action: Parameters<typeof dispatch>[0]) => startTransition(() => dispatch(action));
  const headingId = useId();
  const errorId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const shownStep = useRef(initial.step);

  // Move focus to the step heading on every step change (not on mount). Compared against the
  // step last shown, not a "mounted" flag: Strict Mode re-runs effects, and a flag would scroll
  // the page to the wizard on load in development.
  useEffect(() => {
    if (shownStep.current === state.step) return;
    shownStep.current = state.step;
    const heading = headingRef.current;
    if (!heading) return;
    heading.focus({ preventScroll: true });
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    heading.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
  }, [state.step]);

  const activeService = payload.services.find((s) => s.slug === state.acService) ?? null;
  const emergency = activeService?.emergency ?? false;
  const currentQuote = useMemo(
    () => quote(pricing, state.selection, payload.vat),
    [pricing, state.selection, payload.vat],
  );
  const suggestion = useMemo(
    () =>
      state.category === 'upholstery' || state.category === 'ac'
        ? suggestBundle(pricing, state.selection)
        : null,
    [pricing, state.selection, state.category],
  );

  const chooseService = (service: BookingService) =>
    dispatch({
      type: 'chooseAcService',
      service: { slug: service.slug, defaults: defaultSelection(pricing.lines, service.lines) },
    });

  const next = () => {
    if (state.step === 'details') {
      // The one place the wall clock is read: inside the user's click (see lint allowlist).
      const clock = dubaiClock(new Date());
      const days = dayOptions(clock, payload.booking, { emergency });
      const keep = state.day && days.some((d) => d.date === state.day) ? state.day : null;
      go({ type: 'next', clock, defaultDay: keep ?? days[0]?.date ?? null });
      return;
    }
    go({ type: 'next' });
  };

  const windowLabel = state.window ? t(`time.windows.${state.window}`) : t('time.windows.any');
  const timeLabel = state.day ? `${formatDay(state.day, locale)} · ${windowLabel}` : windowLabel;
  const areaName = payload.areas.find((a) => a.slug === state.area)?.name.text;
  const areaLabel = state.area === 'other' ? t('time.areaOther') : (areaName ?? t('time.areaNone'));

  const message = useMemo(() => {
    const lines = [
      ...currentQuote.lines
        .filter((l) => l.role === 'item')
        .map((l) =>
          t('line', {
            name: payload.lineLabels[l.lineId]?.text ?? l.lineId,
            qty: formatNumber(l.billableQty, locale),
          }),
        ),
      ...(currentQuote.estimate?.fromLines ?? []).map(
        (l) => payload.lineLabels[l.lineId]?.text ?? l.lineId,
      ),
    ];
    const total =
      currentQuote.kind === 'estimate'
        ? `${formatAED(currentQuote.total, locale)} ${tPrice('per.from')}`
        : formatAED(currentQuote.total, locale);
    return buildQuoteMessage({
      template: payload.template,
      brand: payload.brand,
      lines,
      total,
      area: state.area && state.area !== 'other' ? areaName : null,
      time: state.day ? timeLabel : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuote, state.area, state.day, state.window, locale]);

  const stepTitle: Record<BookingState['step'], string> = {
    category: t('category.question'),
    details: state.category === 'ac' ? t('details.acQuestion') : t('details.upholsteryQuestion'),
    time: t('time.question'),
    send: t('send.title'),
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h3
          id={headingId}
          ref={headingRef}
          tabIndex={-1}
          className="text-h3 text-foreground outline-none"
        >
          {stepTitle[state.step]}
        </h3>
        <div className="sm:w-64">
          <Progress step={state.step} locale={locale} />
        </div>
      </div>

      {/* Steps cross-fade through a view transition (styles/motion.css .step-in / .step-out). */}
      <ViewTransition key={state.step} enter="step-in" exit="step-out" default="none">
        <div>
          {state.step === 'category' ? (
            <StepCategory
              payload={payload}
              headingId={headingId}
              onChoose={(category) => {
                const flagship = payload.services.find((s) => s.category === category);
                go({
                  type: 'chooseCategory',
                  category,
                  service:
                    category === 'ac' && flagship
                      ? {
                          slug: flagship.slug,
                          defaults: defaultSelection(pricing.lines, flagship.lines),
                        }
                      : undefined,
                });
              }}
            />
          ) : null}
          {state.step === 'details' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                next();
              }}
              aria-describedby={state.error ? errorId : undefined}
              className="flex flex-col gap-8"
            >
              <StepDetails
                payload={payload}
                state={state}
                quote={currentQuote}
                suggestion={suggestion}
                errorId={errorId}
                onChooseService={chooseService}
                onQty={(lineId, qty) => dispatch({ type: 'setQty', lineId, qty })}
                onAddLines={(add) => dispatch({ type: 'addLines', add })}
              />
              <Nav back={() => go({ type: 'back' })} nextLabel={t('nav.toTime')} submit />
            </form>
          ) : null}
          {state.step === 'time' ? (
            <div className="flex flex-col gap-8">
              <StepTime
                payload={payload}
                state={state}
                emergency={emergency}
                onDay={(day) => dispatch({ type: 'chooseDay', day })}
                onWindow={(window) => dispatch({ type: 'chooseWindow', window })}
                onArea={(area) => dispatch({ type: 'chooseArea', area })}
              />
              <Nav back={() => go({ type: 'back' })} next={next} nextLabel={t('nav.toSend')} />
            </div>
          ) : null}
          {state.step === 'send' ? (
            <div className="flex flex-col gap-8">
              <StepSend
                payload={payload}
                quote={currentQuote}
                message={message}
                timeLabel={timeLabel}
                areaLabel={areaLabel}
                onEdit={(step) => go({ type: 'goTo', step })}
                onReset={() => go({ type: 'reset', initial })}
              />
              <Nav back={() => go({ type: 'back' })} />
            </div>
          ) : null}
        </div>
      </ViewTransition>
    </div>
  );
}

function Nav({
  back,
  next,
  nextLabel,
  submit,
}: {
  back: () => void;
  next?: () => void;
  nextLabel?: string;
  submit?: boolean;
}) {
  const t = useTranslations('Booking');
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
      <Button type="button" variant="ghost" onClick={back}>
        <ArrowLeftIcon className="rtl:-scale-x-100" />
        {t('nav.back')}
      </Button>
      {nextLabel ? (
        <Button type={submit ? 'submit' : 'button'} size="lg" onClick={submit ? undefined : next}>
          {nextLabel}
          <ArrowRightIcon className="rtl:-scale-x-100" />
        </Button>
      ) : null}
    </div>
  );
}
