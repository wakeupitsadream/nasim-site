import type { SVGProps } from 'react';

/** The brand mark: three breeze strokes in a soft circle (BRIEF §3). Same drawing as app/icon.svg. */
export function BreezeMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}>
      <circle cx="12" cy="12" r="11" fill="currentColor" opacity="0.14" />
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M6 9.5c2-1.6 4-1.6 6 0s4 1.6 6 0" />
        <path d="M6 13c2-1.6 4-1.6 6 0s4 1.6 6 0" />
        <path d="M8 16.5c1.4-1.1 2.8-1.1 4.2 0s2.8 1.1 4.2 0" />
      </g>
    </svg>
  );
}
