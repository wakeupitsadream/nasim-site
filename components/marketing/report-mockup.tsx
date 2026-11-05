import { getTranslations } from 'next-intl/server';
import { WhatsAppIcon } from '@/components/icons/brand';
import { BreezeMark } from '@/components/marketing/breeze-mark';
import { MediaFrame } from '@/components/marketing/media-frame';
import type { Locale } from '@/lib/i18n/routing';
import type { LocalizedValue } from '@/lib/i18n/text';
import { cn } from '@/lib/utils';

type Props = {
  brand: string;
  data: LocalizedValue<{ header: string; lines: string[] }>;
  locale: Locale;
  caption: string;
  /** Phones: no photo bubble, less padding. */
  compact?: boolean;
  className?: string;
};

/**
 * The hero's "what you get": a chat card with the report we send after a visit. Honest by
 * design — no timestamps, no "online", and the caption says it is an example.
 */
export async function ReportMockup({ brand, data, locale, caption, compact, className }: Props) {
  const t = await getTranslations('Report');
  const fallback = data.lang !== locale;
  const bubble =
    'rounded-card rounded-ss-sm bg-card px-4 py-3 text-body text-foreground shadow-card';

  return (
    <figure className={cn('relative', className)}>
      <div
        aria-hidden="true"
        className="absolute -inset-x-10 -top-10 bottom-0 -z-10 rounded-full bg-mist blur-3xl"
      />
      <div
        lang={fallback ? data.lang : undefined}
        dir={fallback ? 'auto' : undefined}
        className="overflow-hidden rounded-panel bg-card shadow-mockup ring-1 ring-foreground/5"
      >
        <div className="flex items-center gap-3 bg-teal-ink px-5 py-3 text-on-deep">
          <BreezeMark className="size-7" />
          <span className="text-body font-medium">{brand}</span>
          <WhatsAppIcon className="ms-auto size-4 opacity-70" />
        </div>
        <div className={cn('flex flex-col gap-3 bg-mist/50', compact ? 'p-3' : 'p-4 sm:p-5')}>
          {!compact ? (
            <div className={cn(bubble, 'me-6 p-2')}>
              <div className="grid grid-cols-2 gap-2">
                {(['before', 'after'] as const).map((key) => (
                  <div key={key} className="relative">
                    <MediaFrame ratio="1/1" sizes="160px" rounded="card" className="rounded-lg" />
                    <span className="absolute inset-s-2 bottom-2 rounded-full bg-teal-ink/85 px-2 py-0.5 text-xs font-medium text-on-deep">
                      {t(key)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className={cn(bubble, 'me-6')}>
            <p className="font-medium">{data.value.header}</p>
            <ul className="mt-2 flex flex-col gap-1 text-small text-muted-foreground">
              {data.value.lines.map((line) => (
                <li key={line} className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-highlight"
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="ms-auto rounded-full bg-card/70 px-3 py-1 text-xs text-muted-foreground">
            {t('sent')}
          </p>
        </div>
      </div>
      <figcaption className="mt-3 text-small text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}
