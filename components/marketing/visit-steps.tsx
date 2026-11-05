import { Ltr } from '@/components/ltr';
import { LocalizedText } from '@/components/localized-text';
import { formatNumber } from '@/lib/i18n/format';
import type { Locale } from '@/lib/i18n/routing';
import { pickLocalized, type I18nText } from '@/lib/i18n/text';
import { stagger } from '@/lib/motion';
import { cn } from '@/lib/utils';

type Props = { steps: I18nText[]; locale: Locale; className?: string };

/** Numbered steps of the visit, styled for the dark band (works on light bands too). */
export function VisitSteps({ steps, locale, className }: Props) {
  return (
    <ol className={cn('grid gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-6', className)}>
      {steps.map((step, i) => (
        <li
          key={step.en}
          className="reveal relative flex flex-col gap-3 border-t border-border pt-5"
          style={stagger(i)}
        >
          <span
            aria-hidden="true"
            className="reveal-line absolute inset-x-0 -top-px h-px bg-highlight in-[.tone-deep]:bg-on-deep-accent/70"
            style={stagger(i)}
          />
          <span
            aria-hidden="true"
            className="text-h2 leading-none font-light text-highlight-ink tabular-nums in-[.tone-deep]:text-on-deep-accent"
          >
            <Ltr>{formatNumber(i + 1, locale, { minimumIntegerDigits: 2 })}</Ltr>
          </span>
          <p className="text-body text-pretty text-foreground">
            <LocalizedText value={pickLocalized(step, locale)} locale={locale} />
          </p>
        </li>
      ))}
    </ol>
  );
}
