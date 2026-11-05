import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

/** The signature detail: three short breeze arcs before every overline. */
export function BreezeGlyph({ className, ...props }: ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 16 10"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn('size-3.5 shrink-0 rtl:-scale-x-100', className)}
      {...props}
    >
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <path d="M1 2.2c2-1.6 4-1.6 6 0s4 1.6 6 0" />
        <path d="M1 5.4c2-1.6 4-1.6 6 0s4 1.6 6 0" />
        <path d="M3 8.6c1.4-1.1 2.8-1.1 4.2 0s2.8 1.1 4.2 0" />
      </g>
    </svg>
  );
}

/** Overline above a heading: small caps on Latin, plain on Arabic (styles/design-tokens.css).
 * Extra props (className, style) pass through, so it can join an entrance stagger. */
export function Eyebrow({ className, children, ...props }: ComponentProps<'p'>) {
  return (
    <p
      className={cn(
        'flex items-center gap-2 text-eyebrow text-highlight-ink in-[.tone-deep]:text-on-deep-accent',
        className,
      )}
      {...props}
    >
      <BreezeGlyph />
      <span>{children}</span>
    </p>
  );
}
