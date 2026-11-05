import Image from 'next/image';
import type { ComponentProps } from 'react';
import { AcUnitArt, ContourRings } from '@/components/marketing/illustrations';
import { ReportMockup } from '@/components/marketing/report-mockup';
import type { Photo } from '@/lib/content/queries';
import { stagger } from '@/lib/motion';

type Props = {
  /** The hero photo (`getPhoto({ kind: 'hero' })`); null keeps the brand-art placeholder. */
  photo: Photo | null;
  alt?: never;
  caption: string;
  mockup: Omit<ComponentProps<typeof ReportMockup>, 'caption' | 'compact' | 'className' | 'style'>;
  className?: string;
};

/**
 * The hero visual: a photo of a home we would work in, framed, with the WhatsApp report card
 * floating over its lower corner. One image for every viewport (4:3 on phones, square from lg),
 * preloaded as the LCP. The panel tilts after the pointer (`data-tilt`, tilt-layer.tsx).
 */
export function HeroScene({ photo, caption, mockup, className }: Props) {
  return (
    <figure className={className}>
      <div className="relative lg:pb-6">
        <div
          data-tilt=""
          className="tilt enter relative aspect-4/3 overflow-clip rounded-panel bg-mist shadow-mockup ring-1 ring-foreground/10 lg:aspect-square"
          style={stagger(3)}
        >
          {photo ? (
            <Image
              src={photo.url}
              alt={photo.alt}
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          ) : (
            <div aria-hidden="true" className="nasim-placeholder absolute inset-0">
              <ContourRings className="absolute -inset-e-1/4 -bottom-1/4 w-3/4" />
              <AcUnitArt className="absolute inset-s-1/2 top-1/2 w-[46%] -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2" />
            </div>
          )}
          {/* A quiet shade along the bottom edge keeps the card legible over the photo. */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-teal-ink/60 to-transparent"
          />
        </div>
        <ReportMockup
          {...mockup}
          compact
          className="enter float relative ms-4 -mt-16 w-[min(20rem,calc(100%-2rem))] lg:absolute lg:inset-s-6 lg:bottom-0 lg:ms-0 lg:mt-0"
          style={stagger(6)}
        />
      </div>
      <figcaption className="mt-4 text-small text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}
