import type { CSSProperties } from 'react';

/**
 * Stagger index for the motion classes in styles/motion.css (`.reveal`, `.enter`, `.draw-check`,
 * `.breeze-flow`): each class reads `--i` to offset its delay or scroll range.
 */
export const stagger = (i: number): CSSProperties => ({ '--i': i }) as CSSProperties;

/** Hover motion of a service icon, by slug (styles/motion.css `[data-motion]`). */
export const ICON_MOTION: Record<string, 'spin' | 'wiggle' | 'bob' | 'drip' | 'pulse'> = {
  'ac-cleaning': 'bob',
  'ac-deep-cleaning': 'bob',
  'ducted-ac-fcu-service': 'spin',
  'emergency-ac-repair': 'pulse',
  'ac-repair': 'wiggle',
  'refrigerant-leak-refill': 'wiggle',
  'sofa-cleaning': 'bob',
  'mattress-cleaning': 'bob',
  'carpet-cleaning': 'bob',
  'stain-odour-removal': 'drip',
  'humidity-mould-check': 'drip',
  'water-tank-cleaning': 'bob',
};
