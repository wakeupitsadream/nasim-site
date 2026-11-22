import { CheckIcon } from 'lucide-react';
import { isValidElement, type ReactNode } from 'react';
import type { Locale } from '@/lib/i18n/routing';
import { pickLocalized, type I18nText } from '@/lib/i18n/text';
import { stagger } from '@/lib/motion';
import { sanitizeInlineHtml } from '@/lib/sanitize';
import { cn } from '@/lib/utils';

type Props = {
  /** Seeded localized items (plain text or a bold lead-in), or already-translated UI nodes. */
  items: (I18nText | ReactNode)[];
  locale: Locale;
  className?: string;
};

const isSeeded = (item: I18nText | ReactNode): item is I18nText =>
  typeof item === 'object' && item !== null && !isValidElement(item) && 'en' in item;

/**
 * "What's included" and other check-marked lists. A seeded item may open with a bold lead-in
 * («<strong>Diagnosis.</strong> Your technician…», the owner's copy, DECISIONS №85): it is
 * sanitised to inline emphasis only (rule 9). Server component — it never ships the sanitiser.
 */
export function CheckList({ items, locale, className }: Props) {
  return (
    <ul className={cn('flex flex-col gap-3', className)}>
      {items.map((item, i) => {
        const seeded = isSeeded(item) ? pickLocalized(item, locale) : null;
        const fallback = seeded !== null && seeded.lang !== locale;
        return (
          <li
            key={i}
            className="reveal flex items-start gap-3 text-body"
            style={stagger(Math.min(i, 5))}
          >
            <span
              aria-hidden="true"
              className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-mist text-highlight-ink"
            >
              <CheckIcon strokeWidth={2} className="size-3.5" />
            </span>
            {seeded ? (
              <span
                lang={fallback ? seeded.lang : undefined}
                dir={fallback ? 'auto' : undefined}
                className="text-pretty [&_strong]:font-semibold [&_strong]:text-foreground"
                dangerouslySetInnerHTML={{ __html: sanitizeInlineHtml(seeded.text) }}
              />
            ) : (
              <span className="text-pretty [&_strong]:font-semibold [&_strong]:text-foreground">
                {item as ReactNode}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
