import { CircleAlertIcon } from 'lucide-react';
import { LocalizedText } from '@/components/localized-text';
import type { Locale } from '@/lib/i18n/routing';
import { pickLocalized, type I18nText } from '@/lib/i18n/text';
import { stagger } from '@/lib/motion';
import { cn } from '@/lib/utils';

type Props = { items: I18nText[]; locale: Locale; className?: string };

/** "When you need it": the symptoms a customer recognises, as quiet cards. */
export function SymptomList({ items, locale, className }: Props) {
  return (
    <ul className={cn('grid gap-3 sm:grid-cols-2', className)}>
      {items.map((item, i) => (
        <li
          key={item.en}
          className="reveal flex items-start gap-3 rounded-card border border-border bg-card p-4 text-body"
          style={stagger(i % 2)}
        >
          <CircleAlertIcon
            aria-hidden="true"
            strokeWidth={1.5}
            className="mt-0.5 size-5 shrink-0 text-highlight-ink"
          />
          <LocalizedText value={pickLocalized(item, locale)} locale={locale} />
        </li>
      ))}
    </ul>
  );
}
