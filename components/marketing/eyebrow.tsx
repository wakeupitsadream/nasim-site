import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

/** The signature detail: two short red speed dashes before every overline. */
export function SpeedGlyph({ className, ...props }: ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 20 10"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={cn('h-2.5 w-5 shrink-0 rtl:-scale-x-100', className)}
      {...props}
    >
      <path d="M2 7.5 4.6 2.5h5.2L7.2 7.5Z" />
      <path d="M9.4 7.5l2.6-5h5.2l-2.6 5Z" opacity="0.55" />
    </svg>
  );
}

/** Overline above a heading: small caps on Latin, plain on Arabic (styles/design-tokens.css).
 * Extra props (className, style) pass through, so it can join an entrance stagger. */
export function Eyebrow({ className, children, ...props }: ComponentProps<'p'>) {
  return (
    <p
      className={cn(
        'flex items-center gap-2 text-eyebrow text-highlight-ink in-[.tone-brand]:text-on-deep in-[.tone-deep]:text-on-deep-accent',
        className,
      )}
      {...props}
    >
      <SpeedGlyph />
      <span>{children}</span>
    </p>
  );
}
