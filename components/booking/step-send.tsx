'use client';

import { CopyIcon, MessageSquareIcon, RotateCcwIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { WhatsAppIcon } from '@/components/icons/brand';
import { PriceSummary } from '@/components/booking/price-summary';
import type { BookingPayload } from '@/components/booking/types';
import { Button } from '@/components/ui/button';
import type { Step } from '@/lib/booking/state';
import { Link } from '@/lib/i18n/navigation';
import type { Quote } from '@/lib/pricing';
import { waMeUrl } from '@/lib/whatsapp';

type Props = {
  payload: BookingPayload;
  quote: Quote;
  message: string;
  timeLabel: string;
  areaLabel: string;
  onEdit: (step: Step) => void;
  onReset: () => void;
};

/** Step 4: the summary, the exact WhatsApp text, and the actions the contacts allow. */
export function StepSend({
  payload,
  quote,
  message,
  timeLabel,
  areaLabel,
  onEdit,
  onReset,
}: Props) {
  const t = useTranslations('Booking');
  const tCommon = useTranslations('Common');
  const [status, setStatus] = useState<'idle' | 'opened' | 'copied'>('idle');
  const href = waMeUrl(payload.whatsapp, message);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setStatus('copied');
    } catch {
      setStatus('idle');
    }
  };

  const editLink = (step: Step) => (
    <button
      type="button"
      onClick={() => onEdit(step)}
      className="rounded-sm text-small font-medium text-highlight-ink underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring"
    >
      {t('send.edit')}
    </button>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:gap-12">
      <div className="flex flex-col gap-6">
        <div className="rounded-card border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h4 className="text-body font-medium text-foreground">{t('send.service')}</h4>
            {editLink('details')}
          </div>
          <PriceSummary payload={payload} quote={quote} compact />
        </div>
        <dl className="grid gap-3 rounded-card border border-border bg-card p-5 text-body">
          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">{t('send.time')}</dt>
            <dd className="flex items-center gap-3 text-end text-foreground">
              <span>{timeLabel}</span>
              {editLink('time')}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">{t('send.area')}</dt>
            <dd className="flex items-center gap-3 text-end text-foreground">
              <span>{areaLabel}</span>
              {editLink('time')}
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-col gap-4">
        <h4 className="text-body font-medium text-foreground">{t('send.preview')}</h4>
        <div className="relative rounded-panel bg-mist p-5">
          <p
            dir="auto"
            className="rounded-card rounded-ss-sm bg-card px-4 py-3 text-body whitespace-pre-line text-foreground shadow-card"
          >
            {message}
          </p>
        </div>

        {href ? (
          <div className="flex flex-col gap-3">
            <Button variant="whatsapp" size="lg" asChild>
              <a href={href} target="_blank" rel="noopener" onClick={() => setStatus('opened')}>
                <WhatsAppIcon />
                {t('send.whatsapp')}
                <span className="sr-only">{tCommon('opensInNewTab')}</span>
              </a>
            </Button>
            <p aria-live="polite" className="text-small text-muted-foreground">
              {status === 'opened'
                ? t('send.opened')
                : status === 'copied'
                  ? t('send.copied')
                  : null}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-card border border-warning/40 bg-warning-soft p-4 text-small text-warning-ink">
            <p>{t('send.pending')}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button variant={href ? 'outline' : 'primary'} onClick={copy}>
            <CopyIcon />
            {t('send.copy')}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/contact">
              <MessageSquareIcon />
              {t('send.contact')}
            </Link>
          </Button>
          <Button variant="ghost" onClick={onReset}>
            <RotateCcwIcon className="rtl:-scale-x-100" />
            {t('send.startOver')}
          </Button>
        </div>
        {!href ? (
          <p aria-live="polite" className="text-small text-muted-foreground">
            {status === 'copied' ? t('send.copied') : null}
          </p>
        ) : null}
      </div>
    </div>
  );
}
