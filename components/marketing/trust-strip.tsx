import { CheckIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { Locale } from '@/lib/i18n/routing';
import type { LocalizedValue } from '@/lib/i18n/text';
import { stagger } from '@/lib/motion';
import { cn } from '@/lib/utils';

type Props = {
  items: LocalizedValue<string[]>;
  locale: Locale;
  className?: string;
  style?: CSSProperties;
};

/** The four promises under the hero CTAs (block `home.trust.items`); the ticks draw themselves in. */
export function TrustStrip({ items, locale, className, style }: Props) {
  const fallback = items.lang !== locale;
  return (
    <ul
      lang={fallback ? items.lang : undefined}
      dir={fallback ? 'auto' : undefined}
      style={style}
      className={cn(
        'grid grid-cols-2 gap-x-6 gap-y-3 text-small text-muted-foreground sm:flex sm:flex-wrap sm:gap-x-8',
        className,
      )}
    >
      {items.value.map((item, i) => (
        <li key={item} className="flex items-start gap-2">
          <CheckIcon
            aria-hidden="true"
            strokeWidth={2}
            className="draw-check mt-0.5 size-4 shrink-0 text-highlight"
            style={stagger(i)}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
