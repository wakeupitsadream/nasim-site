'use client';

import { ArrowRightIcon, MessageSquareIcon, RotateCcwIcon, TriangleAlertIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { RefObject } from 'react';
import { Ltr } from '@/components/ltr';
import { ServiceIcon } from '@/components/marketing/service-icon';
import { Button } from '@/components/ui/button';
import { formatAED } from '@/lib/i18n/format';
import { Link } from '@/lib/i18n/navigation';
import type { Locale } from '@/lib/i18n/routing';
import type { DiagnoseResponse } from '@/lib/validation/diagnose';
import { cn } from '@/lib/utils';

type Props = {
  result: DiagnoseResponse;
  locale: Locale;
  /** Where "know what you need" sends people: `#book` on the home page, `/pricing#book` elsewhere. */
  calculatorHref: string;
  headingRef?: RefObject<HTMLHeadingElement | null>;
  onReset?: () => void;
  className?: string;
};

const URGENCY: Record<DiagnoseResponse['urgency'], string> = {
  routine: 'bg-mist text-primary',
  soon: 'bg-warning-soft text-warning-ink',
  today: 'bg-danger-soft text-danger-ink',
};

const LIKELIHOOD: Record<DiagnoseResponse['causes'][number]['likelihood'], string> = {
  likely: 'bg-mist text-primary',
  possible: 'bg-surface-2 text-foreground',
  unlikely: 'bg-surface-2 text-muted-foreground',
};

/**
 * The verdict card: summary, urgency, safety, the matched service with its price and a booking
 * link, likely causes, the technician's questions. Prices come from the server, never from the
 * model. Also rendered with a fixed sample in the UI kit (dev/ui), so the design is reviewable
 * without an API key.
 */
export function DiagnoseResult({
  result,
  locale,
  calculatorHref,
  headingRef,
  onReset,
  className,
}: Props) {
  const t = useTranslations('Diagnose');
  const tPrice = useTranslations('Price');
  const { service } = result;
  const price =
    service?.priceFrom && !service.comingSoon
      ? tPrice.rich('from', {
          amount: formatAED(service.priceFrom.amount, locale),
          price: (chunks) => (
            <Ltr className="text-h3 font-light text-foreground tabular-nums">{chunks}</Ltr>
          ),
        })
      : null;
  const priceUnit = service?.priceFrom ? tPrice(`per.${service.priceFrom.unit}`) : null;

  return (
    <article
      aria-labelledby="diagnose-result-title"
      data-testid="diagnose-result"
      className={cn(
        'flex flex-col gap-6 rounded-panel border border-border bg-card p-5 shadow-lift sm:p-6 lg:p-8',
        className,
      )}
    >
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-small">
          <span className="text-eyebrow text-highlight-ink">{t('result.title')}</span>
          <span
            className={cn(
              'inline-flex h-7 items-center rounded-full px-3 font-medium',
              URGENCY[result.urgency],
            )}
          >
            {t(`result.urgency.${result.urgency}`)}
          </span>
          <span className="text-muted-foreground">
            {t('result.confidence.label', { level: t(`result.confidence.${result.confidence}`) })}
          </span>
        </div>
        <h3
          id="diagnose-result-title"
          ref={headingRef}
          tabIndex={-1}
          dir="auto"
          className="text-lead font-medium text-pretty text-foreground outline-none"
        >
          {result.summary}
        </h3>
      </header>

      {result.safety ? (
        <div
          role="note"
          className="flex gap-3 rounded-card border border-danger-ink/20 bg-danger-soft p-4 text-small text-danger-ink"
        >
          <TriangleAlertIcon
            aria-hidden="true"
            strokeWidth={1.5}
            className="mt-0.5 size-5 shrink-0"
          />
          <div className="flex flex-col gap-1">
            <p className="font-medium">{t('result.safety')}</p>
            <p dir="auto">{result.safety}</p>
          </div>
        </div>
      ) : null}

      {service ? (
        <div className="flex flex-col gap-5 rounded-card bg-mist p-5">
          <p className="text-small font-medium text-muted-foreground">{t('result.recommended')}</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <ServiceIcon slug={service.slug} className="bg-card" />
              <div className="flex flex-col gap-0.5">
                <p className="text-lead font-medium text-foreground">{service.name}</p>
                <p className="text-small text-muted-foreground">
                  {service.comingSoon
                    ? t('result.comingSoon')
                    : service.estimate
                      ? t('result.estimate')
                      : null}
                </p>
              </div>
            </div>
            {price ? (
              <p className="flex flex-wrap items-baseline gap-x-1.5 text-small text-muted-foreground sm:text-end">
                <span>{price}</span>
                <span>{priceUnit}</span>
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button size="lg" asChild>
              <Link href={service.comingSoon ? service.href : `${service.href}#book`}>
                {service.comingSoon ? t('result.waitlist') : t('result.book')}
                <ArrowRightIcon className="rtl:-scale-x-100" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href={service.href}>{t('result.details')}</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-card bg-mist p-5">
          <div className="flex flex-col gap-1">
            <p className="text-lead font-medium text-foreground">
              {result.outOfScope ? t('result.outOfScope') : t('result.noService')}
            </p>
            <p className="text-body text-muted-foreground">
              {result.outOfScope ? t('result.outOfScopeText') : t('result.noServiceText')}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button variant="outline" asChild>
              <Link href="/contact">
                <MessageSquareIcon />
                {t('result.contact')}
              </Link>
            </Button>
            {!result.outOfScope ? (
              <Button variant="ghost" asChild>
                {calculatorHref.startsWith('#') ? (
                  <a href={calculatorHref}>{t('calculatorCta')}</a>
                ) : (
                  <Link href={calculatorHref}>{t('calculatorCta')}</Link>
                )}
              </Button>
            ) : null}
          </div>
        </div>
      )}

      {result.causes.length > 0 ? (
        <section aria-labelledby="diagnose-causes-title" className="flex flex-col gap-2">
          <h4 id="diagnose-causes-title" className="text-small font-medium text-muted-foreground">
            {t('result.causes')}
          </h4>
          <ol className="flex flex-col divide-y divide-border">
            {result.causes.map((cause, i) => (
              <li key={`${i}-${cause.title}`} className="flex items-start gap-3 py-3">
                <span
                  className={cn(
                    'mt-0.5 inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-xs font-medium',
                    LIKELIHOOD[cause.likelihood],
                  )}
                >
                  {t(`result.likelihood.${cause.likelihood}`)}
                </span>
                {/* Model text keeps its own bidi direction, whatever language it came back in. */}
                <div dir="auto" className="flex flex-col gap-0.5">
                  <p className="text-body font-medium text-foreground">{cause.title}</p>
                  <p className="text-small text-muted-foreground">{cause.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {result.questions.length > 0 ? (
        <section aria-labelledby="diagnose-questions-title" className="flex flex-col gap-2">
          <h4
            id="diagnose-questions-title"
            className="text-small font-medium text-muted-foreground"
          >
            {t('result.questions')}
          </h4>
          <ul className="flex flex-col gap-1.5 ps-5 text-body text-foreground [list-style:disc]">
            {result.questions.map((q, i) => (
              <li key={`${i}-${q}`} dir="auto">
                {q}
              </li>
            ))}
          </ul>
          <p className="text-small text-muted-foreground">{t('result.questionsHint')}</p>
        </section>
      ) : null}

      <footer className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-small text-muted-foreground">{t('form.disclaimer')}</p>
        {onReset ? (
          <Button variant="ghost" onClick={onReset} className="sm:shrink-0">
            <RotateCcwIcon className="rtl:-scale-x-100" />
            {t('result.again')}
          </Button>
        ) : null}
      </footer>
    </article>
  );
}
