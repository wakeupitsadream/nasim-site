import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { LocalizedText } from '@/components/localized-text';
import { Ltr } from '@/components/ltr';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { ContactChannels } from '@/components/marketing/contact-channels';
import { ContactsPending } from '@/components/marketing/contacts-pending';
import { FinalCta } from '@/components/marketing/final-cta';
import { HoursCard } from '@/components/marketing/hours-card';
import { Section } from '@/components/marketing/section';
import { SectionHeader } from '@/components/marketing/section-header';
import { getAreas } from '@/lib/content/queries';
import { getSiteSettings, hasAny } from '@/lib/content/site';
import { whatsappTarget } from '@/lib/cta';
import { alternatesFor } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations('Pages');
  return {
    title: t('contact.title'),
    description: t('contact.description'),
    alternates: alternatesFor(locale, '/contact'),
  };
}

export default async function ContactPage() {
  const locale = await getLocale();
  const [t, tPages, tNav, tHome, tCta, tFooter, settings, areas] = await Promise.all([
    getTranslations('Contact'),
    getTranslations('Pages'),
    getTranslations('Nav'),
    getTranslations('Home'),
    getTranslations('Cta'),
    getTranslations('Footer'),
    getSiteSettings(locale),
    getAreas(),
  ]);
  const whatsapp = whatsappTarget(settings.contacts);
  const contactsKnown = hasAny(settings.contacts);
  const legalRows = (
    [
      ['legalName', settings.legal.legalName],
      ['licenseNo', settings.legal.licenseNo],
      ['trn', settings.legal.trn],
      ['address', settings.legal.address],
    ] as const
  ).filter(([, value]) => value.trim() !== '');

  return (
    <>
      <Section tone="sand" aria-labelledby="contact-title" className="pt-6 lg:pt-10" size="compact">
        <Breadcrumbs items={[{ label: tNav('contact') }]} className="mb-8" />
        <SectionHeader
          id="contact-title"
          as="h1"
          eyebrow={tNav('contact')}
          title={tPages('contact.title')}
          lead={
            <>
              {t('lead')} <LocalizedText value={settings.responseTimeNote} locale={locale} />
            </>
          }
          className="mb-0"
        />
      </Section>

      <Section tone="surface" aria-label={tPages('contact.title')}>
        {contactsKnown ? (
          <ContactChannels settings={settings} locale={locale} />
        ) : (
          <ContactsPending />
        )}
      </Section>

      <Section tone="sand" aria-labelledby="hours-title">
        <SectionHeader id="hours-title" title={t('hours')} className="mb-8" />
        <HoursCard settings={settings} areas={areas} locale={locale} />
      </Section>

      {legalRows.length > 0 ? (
        <Section tone="surface" aria-labelledby="legal-title" size="compact">
          <SectionHeader id="legal-title" title={t('legal')} className="mb-6" />
          <dl className="grid gap-4 sm:grid-cols-2">
            {legalRows.map(([key, value]) => (
              <div
                key={key}
                className="flex flex-col gap-1 rounded-card border border-border bg-card p-5"
              >
                <dt className="text-small text-muted-foreground">{tFooter(key)}</dt>
                <dd className="text-body text-foreground">
                  {key === 'address' ? value : <Ltr>{value}</Ltr>}
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      ) : null}

      <FinalCta
        title={tHome('finalCta.title')}
        lead={tHome('finalCta.lead')}
        primary={{ href: '/pricing#book', label: t('getPrice') }}
        whatsapp={{ target: whatsapp, label: tCta('whatsapp') }}
      />
    </>
  );
}
