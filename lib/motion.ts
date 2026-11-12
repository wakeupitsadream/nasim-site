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
  'refrigerant-leak-detection': 'wiggle',
  'refrigerant-leak-repair': 'wiggle',
  'refrigerant-recharge': 'wiggle',
  'fcu-deep-coil-cleaning': 'spin',
  'ac-duct-cleaning': 'bob',
  'full-ac-system-cleaning': 'bob',
  'ac-filter-grille-cleaning': 'bob',
  'ac-outdoor-unit-cleaning': 'spin',
  'ac-sanitisation': 'drip',
  'preventive-ac-maintenance': 'bob',
  'ac-inspection-diagnostics': 'pulse',
  'ac-water-leak-drain-repair': 'drip',
  'thermostat-installation': 'pulse',
  'sofa-cleaning': 'bob',
  'mattress-cleaning': 'bob',
  'carpet-cleaning': 'bob',
  'stain-odour-removal': 'drip',
  'humidity-mould-check': 'drip',
  'water-tank-cleaning': 'bob',
};
