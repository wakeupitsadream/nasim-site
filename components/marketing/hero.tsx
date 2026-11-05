import { SparklesIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { AssistantTrigger } from '@/components/assistant/assistant-trigger';
import { WhatsAppIcon } from '@/components/icons/brand';
import { LocalizedText } from '@/components/localized-text';
import { AirflowLines } from '@/components/marketing/airflow-lines';
import { CtaLink } from '@/components/marketing/cta-link';
import { Eyebrow } from '@/components/marketing/eyebrow';
import { Section } from '@/components/marketing/section';
import { SpeedLines } from '@/components/marketing/speed-lines';
import { TrustStrip } from '@/components/marketing/trust-strip';
import { Button } from '@/components/ui/button';
import { getBlock } from '@/lib/content/queries';
import { getSiteSettings } from '@/lib/content/site';
import { whatsappTarget } from '@/lib/cta';
import type { Locale } from '@/lib/i18n/routing';
import { pickLocalized, pickLocalizedValue } from '@/lib/i18n/text';
import { stagger } from '@/lib/motion';

/**
 * The promise (BRIEF §4), two CTAs, the assistant link and the trust strip. Text only: the booking
 * wizard follows straight after the ticker (DECISIONS №55), so nothing competes with the words.
 */
export async function HomeHero({ locale }: { locale: Locale }) {
  const [t, tCommon, settings, title, subtitle, ctaPrimary, ctaSecondary, trust] =
    await Promise.all([
      getTranslations('Home'),
      getTranslations('Common'),
      getSiteSettings(locale),
      getBlock('home.hero.title'),
      getBlock('home.hero.subtitle'),
      getBlock('home.hero.cta_primary'),
      getBlock('home.hero.cta_secondary'),
      getBlock('home.trust.items'),
    ]);
  const whatsapp = whatsappTarget(settings.contacts);
  const heading = pickLocalized(title, locale);
  const lead = pickLocalized(subtitle, locale);

  return (
    <Section
      tone="sand"
      aria-labelledby="hero-title"
      className="pt-10 lg:pt-16"
      decoration={
        <>
          <div className="absolute inset-y-0 inset-e-0 w-[70%] [mask-image:linear-gradient(to_bottom,black,transparent)] opacity-50 lg:w-[55%] lg:opacity-100">
            <AirflowLines drift />
          </div>
          <div className="absolute inset-e-[4%] bottom-12 hidden w-64 text-brand opacity-60 lg:block xl:w-80">
            <SpeedLines />
          </div>
        </>
      }
    >
      {/* Entrance: each row of the stack rises in turn (styles/motion.css `.enter`, stagger --i). */}
      <div className="flex max-w-[52rem] flex-col gap-7">
        <Eyebrow className="enter" style={stagger(0)}>
          {t('hero.eyebrow')}
        </Eyebrow>
        <h1
          id="hero-title"
          lang={heading.lang !== locale ? heading.lang : undefined}
          dir={heading.lang !== locale ? 'auto' : undefined}
          className="enter max-w-[14ch] text-display text-balance text-primary"
          style={stagger(1)}
        >
          {heading.text}
        </h1>
        <p
          className="enter max-w-[38rem] text-lead text-pretty text-muted-foreground"
          style={stagger(2)}
        >
          <LocalizedText value={lead} locale={locale} />
        </p>
        <div className="enter flex flex-col gap-3 sm:flex-row sm:flex-wrap" style={stagger(3)}>
          <Button size="lg" asChild className="sm:min-w-56">
            <a href="#book">
              <LocalizedText value={pickLocalized(ctaSecondary, locale)} locale={locale} />
            </a>
          </Button>
          {/* Outline next to the red button: red and WhatsApp green side by side read as a
              traffic light. The green icon keeps the channel recognisable. */}
          <CtaLink
            target={whatsapp}
            newTabHint={tCommon('opensInNewTab')}
            variant="outline"
            size="lg"
          >
            <WhatsAppIcon className="text-whatsapp" />
            <LocalizedText value={pickLocalized(ctaPrimary, locale)} locale={locale} />
          </CtaLink>
        </div>
        <p
          className="enter flex flex-wrap items-center gap-x-2 gap-y-1 text-body text-muted-foreground"
          style={stagger(4)}
        >
          <SparklesIcon
            aria-hidden="true"
            strokeWidth={1.5}
            className="size-4 text-highlight-ink"
          />
          {t('hero.diagnoseLead')}
          {/* Opens the floating assistant (components/assistant): the triage lives there now. */}
          <AssistantTrigger className="rounded-sm font-medium text-highlight-ink underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring">
            {t('hero.diagnoseCta')}
          </AssistantTrigger>
        </p>
        <TrustStrip
          items={pickLocalizedValue(trust, locale)}
          locale={locale}
          className="enter mt-2"
          style={stagger(5)}
        />
      </div>
    </Section>
  );
}
