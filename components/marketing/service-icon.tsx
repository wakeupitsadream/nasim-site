import {
  AirVent,
  BedDouble,
  ClipboardCheck,
  CloudFog,
  Cylinder,
  Droplet,
  Droplets,
  Fan,
  Gauge,
  Grid3x3,
  Layers,
  LayoutGrid,
  Pipette,
  RectangleHorizontal,
  Siren,
  Snowflake,
  Sofa,
  Sparkles,
  SprayCan,
  Stethoscope,
  Thermometer,
  Wind,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { BrandMark } from '@/components/marketing/brand-mark';
import { ICON_MOTION } from '@/lib/motion';
import { cn } from '@/lib/utils';

const ICONS: Record<string, LucideIcon> = {
  'ac-cleaning': AirVent,
  'ac-deep-cleaning': Layers,
  'ducted-ac-fcu-service': Fan,
  'emergency-ac-repair': Siren,
  'ac-repair': Wrench,
  'refrigerant-leak-detection': Gauge,
  'refrigerant-leak-repair': Pipette,
  'refrigerant-recharge': Snowflake,
  'fcu-deep-coil-cleaning': LayoutGrid,
  'ac-duct-cleaning': Wind,
  'full-ac-system-cleaning': Sparkles,
  'ac-filter-grille-cleaning': Grid3x3,
  'ac-outdoor-unit-cleaning': Fan,
  'ac-sanitisation': SprayCan,
  'preventive-ac-maintenance': ClipboardCheck,
  'ac-inspection-diagnostics': Stethoscope,
  'ac-water-leak-drain-repair': Droplet,
  'thermostat-installation': Thermometer,
  'sofa-cleaning': Sofa,
  'mattress-cleaning': BedDouble,
  'carpet-cleaning': RectangleHorizontal,
  'stain-odour-removal': Droplets,
  'humidity-mould-check': CloudFog,
  'water-tank-cleaning': Cylinder,
};

type Props = { slug: string; tile?: boolean; className?: string };

/**
 * Line icon for a service slug (lucide, 1.5px), optionally in a 48px soft tile. Decorative.
 * `data-motion` lets the icon move when its card or row (`.group`) is hovered (styles/motion.css).
 */
export function ServiceIcon({ slug, tile = true, className }: Props) {
  const Icon = ICONS[slug];
  const motion = ICON_MOTION[slug];
  const glyph = Icon ? (
    <Icon aria-hidden="true" strokeWidth={1.5} className="size-[22px]" />
  ) : (
    <BrandMark
      className={cn('h-5 w-6 text-brand', tile && '[--brand-mark-surface:var(--color-surface-2)]')}
    />
  );
  if (!tile) {
    return (
      <span data-motion={motion} className={cn('inline-flex text-primary', className)}>
        {glyph}
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      data-motion={motion}
      className={cn(
        'inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-primary',
        className,
      )}
    >
      {glyph}
    </span>
  );
}
