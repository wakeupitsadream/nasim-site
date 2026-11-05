import Image from 'next/image';
import { AcUnitArt, ContourRings, SofaArt } from '@/components/marketing/illustrations';
import type { MediaItem } from '@/lib/content/queries';
import { cn } from '@/lib/utils';

type Ratio = '4/5' | '4/3' | '16/9' | '1/1';
const RATIO: Record<Ratio, string> = {
  '4/5': 'aspect-4/5',
  '4/3': 'aspect-4/3',
  '16/9': 'aspect-video',
  '1/1': 'aspect-square',
};

type Props = {
  media?: MediaItem | null;
  ratio: Ratio;
  /** Brand line art shown while there is no photo. */
  art?: 'ac' | 'upholstery' | 'none';
  /** `sizes` for next/image, e.g. "(min-width: 1024px) 40vw, 100vw". */
  sizes: string;
  priority?: boolean;
  /** Empty frames are decorative: hide them on phones so nobody scrolls past empty boxes. */
  mobile?: 'show' | 'hideWhenEmpty';
  rounded?: 'card' | 'panel';
  className?: string;
};

/**
 * The photo slot. With a photo it is a plain cover image; without one it is a quiet cool panel
 * with brand art — same frame, same radius, so real photos drop in later with no redesign.
 */
export function MediaFrame({
  media,
  ratio,
  art = 'none',
  sizes,
  priority,
  mobile = 'show',
  rounded = 'card',
  className,
}: Props) {
  const base = cn(
    'relative overflow-hidden',
    RATIO[ratio],
    rounded === 'panel' ? 'rounded-panel' : 'rounded-card',
    className,
  );

  if (media) {
    return (
      <div className={base}>
        <Image
          src={media.url}
          alt={media.alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      data-placeholder="true"
      className={cn(base, 'nasim-placeholder', mobile === 'hideWhenEmpty' && 'hidden lg:block')}
    >
      <ContourRings className="absolute -inset-e-1/4 -bottom-1/4 w-3/4" />
      {art === 'ac' ? (
        <AcUnitArt className="absolute inset-s-1/2 top-1/2 w-[46%] -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2" />
      ) : null}
      {art === 'upholstery' ? (
        <SofaArt className="absolute inset-s-1/2 top-1/2 w-[46%] -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2" />
      ) : null}
    </div>
  );
}
