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
import { BreezeMark } from '@/components/marketing/breeze-mark';
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

/** Line icon for a service slug (lucide, 1.5px), optionally in a 48px soft tile. Decorative. */
export function ServiceIcon({ slug, tile = true, className }: Props) {
  const Icon = ICONS[slug];
  const glyph = Icon ? (
    <Icon aria-hidden="true" strokeWidth={1.5} className="size-[22px]" />
  ) : (
    <BreezeMark className="size-6" />
  );
  if (!tile) return <span className={cn('inline-flex text-primary', className)}>{glyph}</span>;
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-primary',
        className,
      )}
    >
      {glyph}
    </span>
  );
}
