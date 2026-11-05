import { CheckIcon, MinusIcon } from 'lucide-react';
import { LocalizedText } from '@/components/localized-text';
import type { Locale } from '@/lib/i18n/routing';
import { pickLocalized, type I18nText } from '@/lib/i18n/text';
import { cn } from '@/lib/utils';

type Props = {
  items: I18nText[];
  locale: Locale;
  variant?: 'include' | 'exclude';
  className?: string;
};

/** "What's included" (check marks) and "Not included" (muted dashes). */
export function CheckList({ items, locale, variant = 'include', className }: Props) {
  const Icon = variant === 'include' ? CheckIcon : MinusIcon;
  return (
    <ul className={cn('flex flex-col gap-3', className)}>
      {items.map((item) => (
        <li key={item.en} className="flex items-start gap-3 text-body">
          <span
            aria-hidden="true"
            className={cn(
              'mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full',
              variant === 'include'
                ? 'bg-mist text-highlight-ink'
                : 'bg-surface-2 text-muted-foreground',
            )}
          >
            <Icon strokeWidth={2} className="size-3.5" />
          </span>
          <span className={variant === 'exclude' ? 'text-muted-foreground' : undefined}>
            <LocalizedText value={pickLocalized(item, locale)} locale={locale} />
          </span>
        </li>
      ))}
    </ul>
  );
}
