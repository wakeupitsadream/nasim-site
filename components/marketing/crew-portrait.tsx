import Image from 'next/image';
import { BrandMark } from '@/components/marketing/brand-mark';
import { cn } from '@/lib/utils';
import crew from '@/public/brand/crew-night.jpg';

type Props = {
  alt: string;
  caption?: string;
  /** `sizes` for next/image, e.g. "(min-width: 1024px) 20rem, 100vw". */
  sizes: string;
  /** The mark as a small badge on the frame's lower corner. */
  badge?: boolean;
  priority?: boolean;
  className?: string;
};

/**
 * The two mascots (Misha's emblem of 05.11.2026 — black shirts, night Dubai — cropped above its
 * own lettering; the wordmark is ours, DECISIONS №52–53) in a framed panel. Used by the
 * guarantee block and the 404 page.
 */
export function CrewPortrait({ alt, caption, sizes, badge = true, priority, className }: Props) {
  return (
    <figure className={className}>
      <div className="relative">
        <div
          data-tilt=""
          className="tilt overflow-clip rounded-card bg-card shadow-card ring-1 ring-foreground/10"
        >
          <Image
            src={crew}
            alt={alt}
            sizes={sizes}
            priority={priority}
            placeholder="blur"
            className="h-auto w-full"
          />
        </div>
        {badge ? (
          <span
            aria-hidden="true"
            className="absolute inset-e-4 -bottom-4 inline-flex size-12 items-center justify-center rounded-full bg-background shadow-lift ring-1 ring-foreground/10 [--brand-mark-surface:var(--background)]"
          >
            <BrandMark className="h-6 w-[1.8rem] text-brand" />
          </span>
        ) : null}
      </div>
      {caption ? (
        <figcaption className={cn('text-small text-muted-foreground', badge ? 'mt-8' : 'mt-4')}>
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
