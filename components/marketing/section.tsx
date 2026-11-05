import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type SectionTone = 'sand' | 'surface' | 'deep';

const TONE: Record<SectionTone, string> = {
  sand: 'bg-background',
  surface: 'bg-card',
  // .tone-deep (app/globals.css) remaps foreground, border and ring for the dark brand band.
  deep: 'tone-deep',
};

type Props = ComponentProps<'section'> & {
  tone?: SectionTone;
  size?: 'default' | 'compact';
  /** Decorative layer (airflow lines, glows) painted behind the content. */
  decoration?: ReactNode;
};

/**
 * One band of a marketing page: full-width tone, page-wide rhythm (`py-section`), centred
 * container. Adjacent sections should never share a tone.
 */
export function Section({
  tone = 'sand',
  size = 'default',
  decoration,
  className,
  children,
  ...props
}: Props) {
  return (
    <section
      data-tone={tone}
      className={cn(
        'relative scroll-mt-header',
        TONE[tone],
        // `overflow-clip`, not hidden: hidden would make the band a scroll container and freeze the
        // scroll-driven `.reveal` animations inside it (styles/motion.css).
        decoration && 'isolate overflow-clip',
        size === 'compact' ? 'py-section-sm' : 'py-section',
        className,
      )}
      {...props}
    >
      {decoration}
      <div className="relative mx-auto w-full max-w-page px-gutter lg:px-gutter-lg">{children}</div>
    </section>
  );
}
