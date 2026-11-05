import { ChevronDownIcon } from 'lucide-react';
import { LocalizedText } from '@/components/localized-text';
import { RichText } from '@/components/marketing/rich-text';
import type { Locale } from '@/lib/i18n/routing';
import { pickLocalized } from '@/lib/i18n/text';
import type { Faq } from '@/lib/validation/content';
import { cn } from '@/lib/utils';

type Props = { faqs: Faq[]; locale: Locale; name: string; className?: string };

/**
 * Native <details>: no JS, every answer is in the HTML (Radix unmounts closed panels, which
 * would hide them from search and reader modes). `name` makes the group exclusive.
 */
export function FaqList({ faqs, locale, name, className }: Props) {
  return (
    <div className={cn('divide-y divide-border border-y border-border', className)}>
      {faqs.map((faq) => (
        <details key={faq.question.en} name={name} className="group">
          <summary className="flex min-h-tap cursor-pointer list-none items-center justify-between gap-4 rounded-md py-4 text-body font-medium text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden">
            <LocalizedText value={pickLocalized(faq.question, locale)} locale={locale} />
            <ChevronDownIcon
              aria-hidden="true"
              strokeWidth={1.5}
              className="size-5 shrink-0 text-muted-foreground transition-transform duration-(--nasim-dur) ease-brand group-open:rotate-180"
            />
          </summary>
          <div className="pb-5 text-muted-foreground">
            <RichText value={pickLocalized(faq.answer_html, locale)} locale={locale} />
          </div>
        </details>
      ))}
    </div>
  );
}
