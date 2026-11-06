import { getTranslations } from 'next-intl/server';
import { Ltr } from '@/components/ltr';
import { MediaFrame } from '@/components/marketing/media-frame';
import { Section, type SectionTone } from '@/components/marketing/section';
import { SectionHeader } from '@/components/marketing/section-header';
import { getBlock, getPhoto } from '@/lib/content/queries';
import { formatNumber } from '@/lib/i18n/format';
import type { Locale } from '@/lib/i18n/routing';
import { pickLocalized, pickLocalizedValue } from '@/lib/i18n/text';
import { stagger } from '@/lib/motion';

/**
 * "Why every 4–6 months in Dubai": a wide photo of a crew at work in a Dubai living room (media
 * kind `why`, DECISIONS №57) over three short facts (blocks `home.why.*`).
 */
export async function WhyCadence({
  locale,
  tone = 'surface',
}: {
  locale: Locale;
  tone?: SectionTone;
}) {
  const [t, title, block, photo] = await Promise.all([
    getTranslations('Home'),
    getBlock('home.why.title'),
    getBlock('home.why.items'),
    getPhoto({ kind: 'why' }, locale),
  ]);
  const heading = pickLocalized(title, locale);
  const items = pickLocalizedValue(block, locale);
  const fallback = items.lang !== locale;

  return (
    <Section tone={tone} aria-labelledby="why-title">
      <SectionHeader
        id="why-title"
        eyebrow={t('why.eyebrow')}
        title={heading.text}
        titleLang={heading.lang !== locale ? heading.lang : undefined}
      />
      {/* The panel tilts after a fine pointer (data-tilt, components/motion/tilt-layer.tsx). */}
      <div data-tilt="" className="tilt reveal mb-10 lg:mb-14">
        <MediaFrame
          media={photo}
          ratio="16/9"
          art="ac"
          rounded="panel"
          sizes="(min-width: 1280px) 1200px, 100vw"
          className="shadow-lift"
        />
      </div>
      <ol
        lang={fallback ? items.lang : undefined}
        dir={fallback ? 'auto' : undefined}
        className="grid gap-8 md:grid-cols-3 md:gap-0 md:divide-x md:divide-border"
      >
        {items.value.map((item, i) => (
          <li
            key={item.title}
            className="reveal flex flex-col gap-3 md:px-8 md:first:ps-0 md:last:pe-0"
            style={stagger(i)}
          >
            <span aria-hidden="true" className="text-small text-highlight-ink tabular-nums">
              <Ltr>{formatNumber(i + 1, locale, { minimumIntegerDigits: 2 })}</Ltr>
            </span>
            <h3 className="text-h3 text-primary">{item.title}</h3>
            <p className="text-body text-pretty text-muted-foreground">{item.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
