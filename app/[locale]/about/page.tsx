import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { Ltr } from '@/components/ltr';
import { AreaChips } from '@/components/marketing/area-chips';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { CheckList } from '@/components/marketing/check-list';
import { CrewPortrait } from '@/components/marketing/crew-portrait';
import { Eyebrow } from '@/components/marketing/eyebrow';
import { FinalCta } from '@/components/marketing/final-cta';
import { RichText } from '@/components/marketing/rich-text';
import { Section } from '@/components/marketing/section';
import { SectionHeader } from '@/components/marketing/section-header';
import { TrustStrip } from '@/components/marketing/trust-strip';
import { PageTransition } from '@/components/page-transition';
import { getAreas, getBlock } from '@/lib/content/queries';
import { getSiteSettings } from '@/lib/content/site';
import { whatsappTarget } from '@/lib/cta';
import { pickLocalized, pickLocalizedValue } from '@/lib/i18n/text';
import { stagger } from '@/lib/motion';
import { alternatesFor } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations('Pages');
  return {
    title: t('about.title'),
    description: t('about.description'),
    alternates: alternatesFor(locale, '/about'),
  };
}

const STANDARD_KEYS = ['one', 'two', 'three', 'four', 'five'] as const;

// About (BRIEF §6.6) without invented facts: what we do and how (blocks `about.body`,
// `about.not_doing`), the technician's checklist, company details only once the owner fills
// them in, areas. Team photos and partners arrive with real media (kind `team`).
export default async function AboutPage() {
  const locale = await getLocale();
  const [t, tPages, tNav, tHome, tCta, tFooter, settings, body, notDoing, trust, areas] =
    await Promise.all([
      getTranslations('About'),
      getTranslations('Pages'),
      getTranslations('Nav'),
      getTranslations('Home'),
      getTranslations('Cta'),
      getTranslations('Footer'),
      getSiteSettings(locale),
      getBlock('about.body'),
      getBlock('about.not_doing'),
      getBlock('home.trust.items'),
      getAreas(),
    ]);
  const whatsapp = whatsappTarget(settings.contacts);
  const legalRows = (
    [
      ['legalName', settings.legal.legalName],
      ['licenseNo', settings.legal.licenseNo],
      ['trn', settings.legal.trn],
      ['address', settings.legal.address],
    ] as const
  ).filter(([, value]) => value.trim() !== '');

  return (
    <PageTransition>
      <Section tone="sand" aria-labelledby="about-title" className="pt-6 lg:pt-10">
        <Breadcrumbs items={[{ label: tNav('about') }]} className="mb-8" />
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-8">
          <div className="flex flex-col gap-6 lg:col-span-7 lg:pe-8">
            <Eyebrow className="enter" style={stagger(0)}>
              {tNav('about')}
            </Eyebrow>
            <h1
              id="about-title"
              className="enter max-w-[14ch] text-h1 text-balance text-primary"
              style={stagger(1)}
            >
              {tPages('about.title')}
            </h1>
            <p
              className="enter max-w-[38rem] text-lead text-pretty text-muted-foreground"
              style={stagger(2)}
            >
              {t('lead')}
            </p>
            <TrustStrip
              items={pickLocalizedValue(trust, locale)}
              locale={locale}
              className="enter"
              style={stagger(3)}
            />
          </div>
          <CrewPortrait
            alt={tHome('team.alt')}
            caption={tHome('team.caption')}
            sizes="(min-width: 1024px) 36vw, 100vw"
            priority
            className="enter mx-auto w-full max-w-[24rem] lg:col-span-5 lg:max-w-none"
          />
        </div>
      </Section>

      <Section tone="surface" aria-labelledby="story-title">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <SectionHeader
            id="story-title"
            eyebrow={t('story.eyebrow')}
            title={t('story.title')}
            className="mb-0 lg:col-span-5"
          />
          <RichText
            value={pickLocalized(body, locale)}
            locale={locale}
            className="reveal text-lead text-muted-foreground lg:col-span-7"
          />
        </div>
      </Section>

      <Section tone="sand" aria-labelledby="standards-title">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <SectionHeader
            id="standards-title"
            eyebrow={t('standards.eyebrow')}
            title={t('standards.title')}
            lead={t('standards.lead')}
            className="mb-0 lg:col-span-5"
          />
          <CheckList
            items={STANDARD_KEYS.map((key) => t(`standards.items.${key}`))}
            locale={locale}
            className="lg:col-span-7 lg:pt-2"
          />
        </div>
      </Section>

      <Section tone="surface" aria-labelledby="not-doing-title">
        <div className="reveal grid gap-6 rounded-panel border border-border bg-background p-6 sm:p-8 lg:grid-cols-12 lg:gap-12 lg:p-12">
          <SectionHeader
            id="not-doing-title"
            eyebrow={t('notDoing.eyebrow')}
            title={t('notDoing.title')}
            motion={false}
            className="mb-0 lg:col-span-5"
          />
          <RichText
            value={pickLocalized(notDoing, locale)}
            locale={locale}
            className="text-body text-muted-foreground lg:col-span-7"
          />
        </div>
        {legalRows.length > 0 ? (
          <section aria-labelledby="legal-title" className="mt-10">
            <h2 id="legal-title" className="text-eyebrow text-foreground">
              {t('legal.title')}
            </h2>
            <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-small text-muted-foreground">
              {legalRows.map(([key, value]) => (
                <div key={key} className="flex gap-1">
                  <dt>{tFooter(key)}:</dt>
                  <dd>{key === 'address' ? value : <Ltr>{value}</Ltr>}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
      </Section>

      <Section tone="sand" aria-labelledby="areas-title" size="compact">
        <SectionHeader id="areas-title" eyebrow={t('areas.eyebrow')} title={t('areas.title')} />
        <AreaChips
          areas={areas}
          locale={locale}
          all={{ label: tHome('areas.all') }}
          label={t('areas.title')}
        />
      </Section>

      <FinalCta
        title={tHome('finalCta.title')}
        lead={tHome('finalCta.lead')}
        primary={{ href: '/pricing#book', label: tHome('finalCta.primary') }}
        whatsapp={{ target: whatsapp, label: tCta('whatsapp') }}
      />
    </PageTransition>
  );
}
