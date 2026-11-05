import Image from 'next/image';
import type { ComponentProps } from 'react';
import { ReportMockup } from '@/components/marketing/report-mockup';
import { stagger } from '@/lib/motion';
import scene from '@/public/brand/crew-scene.jpg';

type Props = {
  alt: string;
  caption: string;
  mockup: Omit<ComponentProps<typeof ReportMockup>, 'caption' | 'compact' | 'className' | 'style'>;
  className?: string;
};

/**
 * The hero visual: the crew at work in a framed panel (Misha's illustration, a stand-in until real
 * photos — DECISIONS №52) with the WhatsApp report card floating over its lower corner. One image
 * for every viewport (4:3 on phones, square from lg), so it is preloaded once. The panel tilts
 * after the pointer (`data-tilt`, components/motion/tilt-layer.tsx).
 */
export function HeroScene({ alt, caption, mockup, className }: Props) {
  return (
    <figure className={className}>
      <div className="relative lg:pb-6">
        <div
          data-tilt=""
          className="tilt enter relative aspect-4/3 overflow-clip rounded-panel bg-mist shadow-mockup ring-1 ring-foreground/10 lg:aspect-square"
          style={stagger(3)}
        >
          <Image
            src={scene}
            alt={alt}
            fill
            priority
            placeholder="blur"
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
          />
          {/* A quiet shade along the bottom edge keeps the card legible over the busy scene. */}
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
