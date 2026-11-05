import { getTranslations } from 'next-intl/server';
import { BreezeMark } from '@/components/marketing/breeze-mark';
import { Eyebrow } from '@/components/marketing/eyebrow';
import { ContourRings } from '@/components/marketing/illustrations';
import { RichText } from '@/components/marketing/rich-text';
import { Section } from '@/components/marketing/section';
import { getBlock } from '@/lib/content/queries';
import type { Locale } from '@/lib/i18n/routing';
import { pickLocalized } from '@/lib/i18n/text';

/** Guarantee panel with the emblem (block `guarantee.text`). */
export async function Guarantee({ locale }: { locale: Locale }) {
  const [t, block] = await Promise.all([getTranslations('Home'), getBlock('guarantee.text')]);

  return (
    <Section tone="sand" aria-labelledby="guarantee-title" size="compact">
      <div className="grid items-center gap-8 overflow-hidden rounded-panel border border-border bg-card p-8 shadow-card lg:grid-cols-[auto_1fr] lg:gap-14 lg:p-12">
        <div aria-hidden="true" className="relative mx-auto size-40 lg:size-48">
          <ContourRings className="absolute inset-0 size-full text-primary" />
          <div className="absolute inset-1/4 flex items-center justify-center rounded-full bg-mist">
            <BreezeMark className="size-12 text-primary" />
          </div>
        </div>
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
