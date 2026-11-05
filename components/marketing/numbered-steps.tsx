import { Ltr } from '@/components/ltr';
import { formatNumber } from '@/lib/i18n/format';
import type { Locale } from '@/lib/i18n/routing';
import { stagger } from '@/lib/motion';
import { cn } from '@/lib/utils';

type Props = {
  steps: { title: string; text: string }[];
  locale: Locale;
  className?: string;
};

/** Numbered steps from UI strings — the same drawing as VisitSteps, which takes seeded text. */
export function NumberedSteps({ steps, locale, className }: Props) {
  return (
    <ol className={cn('grid gap-8 md:grid-cols-3 lg:gap-8', className)}>
      {steps.map((step, i) => (
        <li
          key={step.title}
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
          <h3 className="text-lead font-medium text-foreground in-[.tone-deep]:text-on-deep">
            {step.title}
          </h3>
          <p className="text-body text-pretty text-muted-foreground in-[.tone-deep]:text-on-deep-muted">
            {step.text}
          </p>
        </li>
      ))}
    </ol>
  );
}
