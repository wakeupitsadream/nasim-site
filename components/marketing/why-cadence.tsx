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
 * "Why every 4–6 months in Dubai": three short facts (blocks `home.why.*`) beside the home we
 * would work in (the `why` photo — the former hero picture, DECISIONS №55).
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
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          {/* The panel tilts after a fine pointer (data-tilt, components/motion/tilt-layer.tsx). */}
          <div data-tilt="" className="tilt reveal">
            <MediaFrame
              media={photo}
              ratio="4/3"
              art="ac"
              rounded="panel"
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="shadow-lift"
            />
          </div>
        </div>
        <div className="flex flex-col lg:col-span-7">
          <SectionHeader
            id="why-title"
            eyebrow={t('why.eyebrow')}
            title={heading.text}
            titleLang={heading.lang !== locale ? heading.lang : undefined}
            className="mb-8"
          />
          <ol
            lang={fallback ? items.lang : undefined}
            dir={fallback ? 'auto' : undefined}
            className="flex flex-col divide-y divide-border border-t border-border"
          >
            {items.value.map((item, i) => (
              <li
                key={item.title}
                className="reveal grid gap-x-6 gap-y-2 py-6 sm:grid-cols-[3rem_1fr]"
                style={stagger(i)}
              >
                <span
                  aria-hidden="true"
                  className="text-h3 font-light text-highlight-ink tabular-nums"
                >
                  <Ltr>{formatNumber(i + 1, locale, { minimumIntegerDigits: 2 })}</Ltr>
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="text-h3 text-primary">{item.title}</h3>
                  <p className="max-w-[36rem] text-body text-pretty text-muted-foreground">
                    {item.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Section>
  );
}
