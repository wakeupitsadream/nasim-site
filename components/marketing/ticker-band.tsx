import { getTranslations } from 'next-intl/server';
import { SpeedGlyph } from '@/components/marketing/eyebrow';
import { getServices } from '@/lib/content/queries';
import type { Locale } from '@/lib/i18n/routing';
import { pickLocalized } from '@/lib/i18n/text';
import { cn } from '@/lib/utils';

/**
 * The one red band (DECISIONS №52): the active services run past as a marquee. Two copies of the
 * list sit in one track that slides by half its width, so the loop has no seam (styles/motion.css
 * `.ticker`). Pauses on hover and focus. Under reduced motion the track stops, wraps into a plain
 * list and the second copy disappears (motion-reduce:* utilities — they must outrank the
 * component layer). Decorative repetition: only the first copy is exposed to assistive tech.
 */
export async function TickerBand({ locale, className }: { locale: Locale; className?: string }) {
  const [t, services] = await Promise.all([
    getTranslations('Home'),
    getServices({ status: ['active'] }),
  ]);
  const items = services.map((s) => pickLocalized(s.name, locale));

  const list = (hidden: boolean) => (
    <ul
      aria-hidden={hidden || undefined}
      aria-label={hidden ? undefined : t('ticker.label')}
      className={cn(
        'flex shrink-0 items-center motion-reduce:max-w-full motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-2',
        hidden && 'motion-reduce:hidden',
      )}
    >
      {items.map((item) => (
        <li
          key={item.text}
          lang={item.lang !== locale ? item.lang : undefined}
          className="flex items-center gap-5 pe-5"
        >
          <SpeedGlyph className="h-2 w-4 text-foreground/70" />
          {/* A long name (German compounds) may wrap in the static list; the marquee never wraps. */}
          <span className="font-display text-small font-semibold tracking-wider whitespace-nowrap uppercase motion-reduce:whitespace-normal">
            {item.text}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div
      className={cn(
        'ticker-band tone-brand overflow-clip [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] py-3.5',
        className,
      )}
    >
      <div className="ticker motion-reduce:w-auto motion-reduce:px-gutter">
        {list(false)}
        {list(true)}
      </div>
    </div>
  );
}
