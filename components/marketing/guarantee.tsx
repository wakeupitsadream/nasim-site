import { getTranslations } from 'next-intl/server';
import { CrewPortrait } from '@/components/marketing/crew-portrait';
import { Eyebrow } from '@/components/marketing/eyebrow';
import { RichText } from '@/components/marketing/rich-text';
import { Section, type SectionTone } from '@/components/marketing/section';
import { getBlock } from '@/lib/content/queries';
import type { Locale } from '@/lib/i18n/routing';
import { pickLocalized } from '@/lib/i18n/text';

/** Guarantee panel (block `guarantee.text`): the promise, and the crew who stand behind it. */
export async function Guarantee({ locale, tone = 'sand' }: { locale: Locale; tone?: SectionTone }) {
  const [t, block] = await Promise.all([getTranslations('Home'), getBlock('guarantee.text')]);

  return (
    <Section tone={tone} aria-labelledby="guarantee-title" size="compact">
      <div className="reveal grid items-center gap-10 overflow-clip rounded-panel border border-border bg-card p-6 shadow-card sm:p-8 lg:grid-cols-[20rem_1fr] lg:gap-14 lg:p-12">
        <CrewPortrait
          alt={t('team.alt')}
          caption={t('team.caption')}
          sizes="(min-width: 1024px) 20rem, (min-width: 640px) 24rem, 100vw"
          className="mx-auto w-full max-w-[24rem] lg:max-w-none"
        />
        <div className="flex flex-col gap-4">
          <Eyebrow>{t('guarantee.eyebrow')}</Eyebrow>
          <h2 id="guarantee-title" className="text-h2 text-balance text-primary">
            {t('guarantee.title')}
          </h2>
          <RichText
            value={pickLocalized(block, locale)}
            locale={locale}
            className="max-w-[40rem] text-lead text-muted-foreground"
          />
        </div>
      </div>
    </Section>
  );
}
