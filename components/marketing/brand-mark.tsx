import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

type Props = SVGProps<SVGSVGElement> & {
  /** The streak draws itself and the letter lands (styles/motion.css `.brand-mark--enter`). */
  animated?: boolean;
};

/**
 * The Brigada mark (DECISIONS №52–53): a bold italic "B" in the current colour (brand red in the
 * lock-up, as on the crew's shirts) with a speed streak cutting through its waist and running out
 * to the end — the same drawing as app/icon.svg. Decorative: always aria-hidden. The streak
 * follows `--brand-mark-streak`: graphite on light surfaces by default, white on dark bands
 * (`.tone-deep`, `.tone-brand`) and on the red van.
 */
export function BrandMark({ animated = false, className, ...props }: Props) {
  return (
    <svg
      viewBox="0 0 120 100"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn('brand-mark', animated && 'brand-mark--enter', className)}
      {...props}
    >
      <g transform="skewX(-10) translate(14 0)">
        <path
          className="brand-mark__letter"
          fill="currentColor"
          fillRule="evenodd"
          d="M12 6h40c19 0 31 9 31 23 0 9-5 16-13 19 11 3 19 11 19 22 0 16-13 24-33 24H12Zm21 16v18h19c7 0 11-3.5 11-9s-4-9-11-9Zm0 34v20h23c8 0 12-4 12-10s-4-10-12-10Z"
        />
        {/* The waist gap: drawn in the surface colour so the streak reads as a cut. */}
        <path
          className="brand-mark__gap"
          fill="var(--brand-mark-surface, transparent)"
          d="M-6 63c25-5 60-13 118-29v-7C54 42 19 50-6 55Z"
        />
        <path
          className="brand-mark__streak"
          fill="var(--brand-mark-streak, var(--nasim-ink))"
          d="M-2 61c26-5 60-13 114-28l1-4C59 44 24 52-2 57Z"
        />
      </g>
    </svg>
  );
}
