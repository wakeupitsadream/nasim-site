import { BellRingIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { LocalizedText } from '@/components/localized-text';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { CtaLink } from '@/components/marketing/cta-link';
import { Eyebrow } from '@/components/marketing/eyebrow';
import { MediaFrame } from '@/components/marketing/media-frame';
import { Section } from '@/components/marketing/section';
import { Badge } from '@/components/ui/badge';
import type { CtaTarget } from '@/lib/cta';
import { formatMonthYear } from '@/lib/i18n/format';
import type { Locale } from '@/lib/i18n/routing';
import { pickLocalized } from '@/lib/i18n/text';
import type { Service } from '@/lib/validation/content';

type Props = { service: Service; locale: Locale; waitlist: CtaTarget };

/** Opener for a service that is not available yet: honest date, waitlist, no prices or wizard. */
export async function ComingSoonHero({ service, locale, waitlist }: Props) {
  const [t, tServices, tCommon] = await Promise.all([
    getTranslations('Service'),
    getTranslations('Services'),
    getTranslations('Common'),
  ]);
  const name = pickLocalized(service.name, locale);

  return (
    <Section tone="sand" aria-labelledby="service-title" className="pt-6 lg:pt-10">
      <Breadcrumbs
        items={[
          { label: tServices('category.comingSoon'), href: '/services#soon' },
          { label: name.text },
        ]}
        className="mb-8"
      />
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col gap-6 lg:col-span-7 lg:pe-8">
          <Eyebrow>{tServices('category.comingSoon')}</Eyebrow>
          <h1
            id="service-title"
            lang={name.lang !== locale ? name.lang : undefined}
            dir={name.lang !== locale ? 'auto' : undefined}
            className="text-h1 text-balance text-primary"
          >
            {name.text}
          </h1>
          <p className="max-w-[38rem] text-lead text-pretty text-muted-foreground">
            <LocalizedText value={pickLocalized(service.short, locale)} locale={locale} />
          </p>
          <div>
            <Badge variant="warning" size="lg">
              {service.available_from
                ? t('comingSoon.from', { date: formatMonthYear(service.available_from, locale) })
                : t('comingSoon.badge')}
            </Badge>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <CtaLink target={waitlist} newTabHint={tCommon('opensInNewTab')} size="lg">
              <BellRingIcon />
              {t('comingSoon.waitlist')}
            </CtaLink>
            <p className="text-small text-muted-foreground">{t('comingSoon.note')}</p>
          </div>
        </div>
        <div className="lg:col-span-5">
          <MediaFrame
            ratio="4/5"
            art="none"
            sizes="(min-width: 1024px) 40vw, 100vw"
            mobile="hideWhenEmpty"
            rounded="panel"
          />
        </div>
      </div>
    </Section>
  );
}
