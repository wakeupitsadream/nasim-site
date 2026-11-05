import {
  AirVent,
  BedDouble,
  CloudFog,
  Cylinder,
  Droplets,
  Fan,
  Gauge,
  Layers,
  RectangleHorizontal,
  Siren,
  Sofa,
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
  'refrigerant-leak-refill': Gauge,
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
    <BrandMark className={cn('h-5 w-6', tile && '[--brand-mark-surface:var(--color-surface-2)]')} />
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
