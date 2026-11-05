import { CheckIcon } from 'lucide-react';
import type { Locale } from '@/lib/i18n/routing';
import type { LocalizedValue } from '@/lib/i18n/text';
import { cn } from '@/lib/utils';

type Props = { items: LocalizedValue<string[]>; locale: Locale; className?: string };

/** The four promises under the hero CTAs (block `home.trust.items`). */
export function TrustStrip({ items, locale, className }: Props) {
  const fallback = items.lang !== locale;
  return (
    <ul
      lang={fallback ? items.lang : undefined}
      dir={fallback ? 'auto' : undefined}
      className={cn(
        'grid grid-cols-2 gap-x-6 gap-y-3 text-small text-muted-foreground sm:flex sm:flex-wrap sm:gap-x-8',
        className,
      )}
    >
      {items.value.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <CheckIcon
            aria-hidden="true"
            strokeWidth={2}
            className="mt-0.5 size-4 shrink-0 text-highlight"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
