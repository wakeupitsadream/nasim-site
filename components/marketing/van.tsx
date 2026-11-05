import type { ComponentProps } from 'react';
import { BrandMark } from '@/components/marketing/brand-mark';
import { cn } from '@/lib/utils';

/**
 * The Brigada van — our own drawing (the AI reference carried a third-party maker's badge,
 * DECISIONS №52). Side view, driving towards inline-end, the mark on its flank. `.van-drive`
 * rolls it into the closing band as the band scrolls in and spins the wheels off the same view
 * timeline (styles/motion.css). Mirrored in RTL; the mark is mirrored back so the B stays a B.
 */
export function Van({ className, ...props }: ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 360 150"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn(
        'van overflow-visible [--brand-mark-streak:#fff] [--brand-mark-surface:var(--nasim-red)] rtl:-scale-x-100',
        className,
      )}
      {...props}
    >
      {/* Speed lines trailing behind (the current colour: white on the dark band). */}
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.4">
        <path d="M4 62h58" />
        <path d="M-14 84h42" />
        <path d="M12 104h56" />
      </g>
      <ellipse cx="196" cy="139" rx="152" ry="6" fill="#000" opacity="0.35" />
      {/* Body: cargo box with a sloped cab. */}
      <path
        fill="var(--nasim-red)"
        d="M82 28h160c10 0 18 3 24 10l36 40c4 5 6 10 6 16v22c0 6-4 10-10 10H82c-6 0-10-4-10-10V38c0-6 4-10 10-10Z"
      />
      <path fill="var(--nasim-red-hover)" d="M72 110h236v6c0 6-4 10-10 10H82c-6 0-10-4-10-10Z" />
      {/* Windscreen and the door window. */}
      <path fill="var(--nasim-teal-ink)" opacity="0.92" d="M244 40c6 0 11 2 15 7l26 29h-47V40Z" />
      <path fill="var(--nasim-teal-ink)" opacity="0.92" d="M232 40h6v36h-6Z" />
      {/* Lights and a door line. */}
      <rect x="296" y="90" width="10" height="14" rx="2" fill="#fff" />
      <rect x="72" y="92" width="6" height="12" rx="1.5" fill="var(--nasim-on-deep-accent)" />
      <path stroke="var(--nasim-red-hover)" strokeWidth="2" d="M228 42v66" />
      {/* The mark on the flank (nested svg: BrandMark passes x/y/width/height through). The <g>
          is what RTL mirrors back — CSS transforms on a nested <svg> ignore transform-box. */}
      <g className="van__label">
        <BrandMark x={104} y={44} width={96} height={80} className="text-white" />
      </g>
      {/* Wheels: hubs with four spokes so the spin reads. */}
      <g className="van__wheel">
        <circle cx="120" cy="118" r="21" fill="var(--nasim-teal-ink)" />
        <circle cx="120" cy="118" r="11" fill="#d9d9d4" />
        <path stroke="var(--nasim-teal-ink)" strokeWidth="3" d="M120 108v20M110 118h20" />
      </g>
      <g className="van__wheel">
        <circle cx="266" cy="118" r="21" fill="var(--nasim-teal-ink)" />
        <circle cx="266" cy="118" r="11" fill="#d9d9d4" />
        <path stroke="var(--nasim-teal-ink)" strokeWidth="3" d="M266 108v20M256 118h20" />
      </g>
    </svg>
  );
}
