import { getTranslations } from 'next-intl/server';
import { Ltr } from '@/components/ltr';
import { Section } from '@/components/marketing/section';
import { SectionHeader } from '@/components/marketing/section-header';
import { getBlock } from '@/lib/content/queries';
import { formatNumber } from '@/lib/i18n/format';
import type { Locale } from '@/lib/i18n/routing';
import { pickLocalized, pickLocalizedValue } from '@/lib/i18n/text';

/** "Why every 4–6 months in Dubai": three short facts (blocks `home.why.*`). */
export async function WhyCadence({ locale }: { locale: Locale }) {
  const [t, title, block] = await Promise.all([
    getTranslations('Home'),
    getBlock('home.why.title'),
    getBlock('home.why.items'),
  ]);
  const heading = pickLocalized(title, locale);
  const items = pickLocalizedValue(block, locale);
  const fallback = items.lang !== locale;

  return (
    <Section tone="surface" aria-labelledby="why-title">
      <SectionHeader
        id="why-title"
        eyebrow={t('why.eyebrow')}
        title={heading.text}
        titleLang={heading.lang !== locale ? heading.lang : undefined}
      />
      <ul
        lang={fallback ? items.lang : undefined}
        dir={fallback ? 'auto' : undefined}
        className="grid gap-8 md:grid-cols-3 md:gap-0 md:divide-x md:divide-border"
      >
        {items.value.map((item, i) => (
          <li key={item.title} className="flex flex-col gap-3 md:px-8 md:first:ps-0 md:last:pe-0">
            <span aria-hidden="true" className="text-small text-highlight-ink tabular-nums">
              <Ltr>{formatNumber(i + 1, locale, { minimumIntegerDigits: 2 })}</Ltr>
            </span>
            <h3 className="text-h3 text-primary">{item.title}</h3>
            <p className="text-body text-pretty text-muted-foreground">{item.text}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
