import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

// Monoline brand art used where photos will go later (BRIEF §15.6). 1.5px strokes in the
// current colour plus one turquoise accent. Decorative: always aria-hidden.
const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/** A wall-mounted split unit breathing three breeze waves. */
export function AcUnitArt({ className, ...props }: ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 200 120"
      aria-hidden="true"
      focusable="false"
      className={cn('text-primary', className)}
      {...props}
    >
      <g {...stroke}>
        <rect x="22" y="18" width="156" height="54" rx="14" />
        <path d="M38 58h124" />
        <path d="M46 48h60" strokeOpacity="0.35" />
        <circle cx="158" cy="34" r="2.5" fill="currentColor" stroke="none" />
      </g>
      <g {...stroke} className="text-highlight">
        <path d="M56 88c10-7 20-7 30 0s20 7 30 0s20-7 30 0" />
        <path d="M68 100c8-6 16-6 24 0s16 6 24 0s16-6 24 0" strokeOpacity="0.7" />
        <path d="M82 112c6-5 12-5 18 0s12 5 18 0" strokeOpacity="0.4" />
      </g>
    </svg>
  );
}

/** A three-seat sofa in rounded geometry. */
export function SofaArt({ className, ...props }: ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 200 120"
      aria-hidden="true"
      focusable="false"
      className={cn('text-primary', className)}
      {...props}
    >
      <g {...stroke}>
        <path d="M44 56V36a10 10 0 0 1 10-10h92a10 10 0 0 1 10 10v20" />
        <path d="M28 60a8 8 0 0 1 8-8h128a8 8 0 0 1 8 8v24a6 6 0 0 1-6 6H34a6 6 0 0 1-6-6z" />
        <path d="M44 52v38M156 52v38" />
        <path d="M82 60v30M118 60v30" strokeOpacity="0.5" />
        <path d="M40 90v10M160 90v10" />
      </g>
      <g {...stroke} className="text-highlight">
        <path d="M60 44c6-4 12-4 18 0s12 4 18 0" strokeOpacity="0.8" />
      </g>
    </svg>
  );
}

/** Concentric arcs from the mark's circle, for the corners of media slots and emblems. */
export function ContourRings({ className, ...props }: ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden="true"
      focusable="false"
      className={cn('text-primary', className)}
      {...props}
    >
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <circle cx="100" cy="100" r="40" strokeOpacity="0.12" />
        <circle cx="100" cy="100" r="64" strokeOpacity="0.09" />
        <circle cx="100" cy="100" r="88" strokeOpacity="0.06" />
      </g>
    </svg>
  );
}
