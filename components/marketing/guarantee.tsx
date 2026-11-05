import { getTranslations } from 'next-intl/server';
import { CrewPortrait } from '@/components/marketing/crew-portrait';
import { Eyebrow } from '@/components/marketing/eyebrow';
import { RichText } from '@/components/marketing/rich-text';
import { Section, type SectionTone } from '@/components/marketing/section';
import { VanDrive } from '@/components/marketing/van-drive';
import { getBlock } from '@/lib/content/queries';
import type { Locale } from '@/lib/i18n/routing';
import { pickLocalized } from '@/lib/i18n/text';

type Props = {
  locale: Locale;
  tone?: SectionTone;
  /**
   * The van parks along the panel's bottom edge: it rolls in as the panel scrolls into view
   * (`.van-drive`, styles/motion.css). On the home page, where the closing band is gone (DECISIONS №55).
   */
  van?: boolean;
};

/** Guarantee panel (block `guarantee.text`): the promise, and the crew who stand behind it. */
export async function Guarantee({ locale, tone = 'sand', van = false }: Props) {
  const [t, block] = await Promise.all([getTranslations('Home'), getBlock('guarantee.text')]);

  return (
    <Section tone={tone} aria-labelledby="guarantee-title" size="compact">
      <div className="reveal overflow-clip rounded-panel border border-border bg-card shadow-card">
        <div className="grid items-center gap-10 p-6 sm:p-8 lg:grid-cols-[20rem_1fr] lg:gap-14 lg:p-12">
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
        {van ? (
          // The road: a strip under the panel, the van drives in from inline-start and stops at the
          // end. Clipped by the panel, so it appears at the panel's edge, not from off-screen.
          <div
            aria-hidden="true"
            className="relative h-16 border-t border-border bg-surface-2/60 sm:h-20 lg:h-24"
          >
            <div className="absolute inset-e-[5%] bottom-1 w-36 text-muted-foreground sm:w-44 lg:w-56">
              <VanDrive />
            </div>
          </div>
        ) : null}
      </div>
    </Section>
  );
}
