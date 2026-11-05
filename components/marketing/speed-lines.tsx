import type { ComponentProps } from 'react';
import { stagger } from '@/lib/motion';
import { cn } from '@/lib/utils';

// Five slanted dashes, shortening towards the back — the eyebrow glyph at banner size.
const BARS = [
  { x: 0, w: 72 },
  { x: 96, w: 56 },
  { x: 176, w: 40 },
  { x: 240, w: 28 },
  { x: 292, w: 16 },
];

/**
 * Decorative speed lines for dividers and corners (current colour). Each bar grows from its own
 * start as the drawing scrolls into view (`.speed-lines`, styles/motion.css); mirrored in RTL.
 */
export function SpeedLines({ className, ...props }: ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 320 40"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={cn('speed-lines block rtl:-scale-x-100', className)}
      {...props}
    >
      {BARS.map(({ x, w }, i) => (
        <path
          key={x}
          style={stagger(i)}
          opacity={1 - i * 0.18}
          d={`M${x + 12} 36 l10-32 h${w} l-10 32 Z`}
        />
      ))}
    </svg>
  );
}
