import { SparklesIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { WhatsAppIcon } from '@/components/icons/brand';
import { LocalizedText } from '@/components/localized-text';
import { AirflowLines } from '@/components/marketing/airflow-lines';
import { CtaLink } from '@/components/marketing/cta-link';
import { Eyebrow } from '@/components/marketing/eyebrow';
import { ReportMockup } from '@/components/marketing/report-mockup';
import { Section } from '@/components/marketing/section';
import { TrustStrip } from '@/components/marketing/trust-strip';
import { Button } from '@/components/ui/button';
import { getBlock } from '@/lib/content/queries';
import { getSiteSettings } from '@/lib/content/site';
import { whatsappTarget } from '@/lib/cta';
import type { Locale } from '@/lib/i18n/routing';
import { pickLocalized, pickLocalizedValue } from '@/lib/i18n/text';

/** The promise (BRIEF §4), two CTAs, the trust strip and the report mockup. */
export async function HomeHero({ locale }: { locale: Locale }) {
  const [t, tCommon, settings, title, subtitle, ctaPrimary, ctaSecondary, trust, report] =
    await Promise.all([
      getTranslations('Home'),
      getTranslations('Common'),
      getSiteSettings(locale),
      getBlock('home.hero.title'),
      getBlock('home.hero.subtitle'),
      getBlock('home.hero.cta_primary'),
      getBlock('home.hero.cta_secondary'),
      getBlock('home.trust.items'),
      getBlock('report.mockup'),
    ]);
  const whatsapp = whatsappTarget(settings.contacts);
  const heading = pickLocalized(title, locale);
  const lead = pickLocalized(subtitle, locale);
  const mockup = {
    brand: settings.brandName.text,
    data: pickLocalizedValue(report, locale),
    locale,
    caption: t('hero.reportCaption'),
  };

  return (
    <Section
      tone="sand"
      aria-labelledby="hero-title"
      className="pt-10 lg:pt-16"
      decoration={
        <div className="absolute inset-y-0 inset-e-0 w-[70%] [mask-image:linear-gradient(to_bottom,black,transparent)] opacity-50 lg:w-[55%] lg:opacity-100">
          <AirflowLines drift />
        </div>
      }
    >
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col gap-7 lg:col-span-7 lg:pe-8">
          <Eyebrow>{t('hero.eyebrow')}</Eyebrow>
          <h1
            id="hero-title"
            lang={heading.lang !== locale ? heading.lang : undefined}
            dir={heading.lang !== locale ? 'auto' : undefined}
            className="max-w-[14ch] text-display text-balance text-primary"
          >
            {heading.text}
          </h1>
          <p className="max-w-[38rem] text-lead text-pretty text-muted-foreground">
            <LocalizedText value={lead} locale={locale} />
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button size="lg" asChild className="sm:min-w-56">
              <a href="#book">
                <LocalizedText value={pickLocalized(ctaSecondary, locale)} locale={locale} />
              </a>
            </Button>
            <CtaLink
              target={whatsapp}
              newTabHint={tCommon('opensInNewTab')}
              variant="whatsapp"
              size="lg"
            >
              <WhatsAppIcon />
              <LocalizedText value={pickLocalized(ctaPrimary, locale)} locale={locale} />
            </CtaLink>
          </div>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-body text-muted-foreground">
            <SparklesIcon
              aria-hidden="true"
              strokeWidth={1.5}
              className="size-4 text-highlight-ink"
            />
            {t('hero.diagnoseLead')}
            <a
              href="#diagnose"
              className="rounded-sm font-medium text-highlight-ink underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring"
            >
              {t('hero.diagnoseCta')}
            </a>
          </p>
          <TrustStrip items={pickLocalizedValue(trust, locale)} locale={locale} className="mt-2" />
          <ReportMockup {...mockup} compact className="mt-4 max-w-sm lg:hidden" />
        </div>
        <div className="hidden lg:col-span-5 lg:block lg:ps-4">
          <ReportMockup {...mockup} />
        </div>
      </div>
    </Section>
  );
}
