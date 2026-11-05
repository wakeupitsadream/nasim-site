import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { LocalizedText } from '@/components/localized-text';
import { Ltr } from '@/components/ltr';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { CheckList } from '@/components/marketing/check-list';
import { FaqList } from '@/components/marketing/faq-list';
import { FinalCta } from '@/components/marketing/final-cta';
import { NumberedSteps } from '@/components/marketing/numbered-steps';
import { PlanCards } from '@/components/marketing/plan-cards';
import { Section } from '@/components/marketing/section';
import { SectionHeader } from '@/components/marketing/section-header';
import { PageTransition } from '@/components/page-transition';
import {
  getBlock,
  getFaqs,
  getPackages,
  getPricingConfig,
  getServiceBySlug,
} from '@/lib/content/queries';
import { getSiteSettings } from '@/lib/content/site';
import { whatsappTarget } from '@/lib/cta';
import { formatAED, formatNumber } from '@/lib/i18n/format';
import { pick, pickLocalized } from '@/lib/i18n/text';
import { annualPlanComparison } from '@/lib/pricing';
import { alternatesFor } from '@/lib/seo';
import type { AnnualPackage } from '@/lib/validation/content';
import { fillTemplate } from '@/lib/whatsapp';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations('Pages');
  return {
    title: t('annualContracts.title'),
    description: t('annualContracts.description'),
    alternates: alternatesFor(locale, '/annual-contracts'),
  };
}

// Annual plans (BRIEF §6.4): the cards, the maths behind the saving, what a visit is, how the
// year runs, the contract FAQ. The "request a contract" form is a phase-4 lead type; until then
// the CTA is WhatsApp with the contract template (or /contact while contacts are empty, №22).
export default async function AnnualContractsPage() {
  const locale = await getLocale();
  const [t, tPages, tNav, tCta, settings, pricing, packages, faqs, acCleaning, template] =
    await Promise.all([
      getTranslations('Contracts'),
      getTranslations('Pages'),
      getTranslations('Nav'),
      getTranslations('Cta'),
      getSiteSettings(locale),
      getPricingConfig(),
      getPackages({ type: 'annual' }),
      getFaqs('contracts'),
      getServiceBySlug('ac-cleaning'),
      getBlock('wa.template.contract'),
    ]);
  const plans = packages.filter((p): p is AnnualPackage => p.type === 'annual');
  const contractTemplate = pickLocalized(template, locale).text;
  const targets = Object.fromEntries(
    plans.map((plan) => [
      plan.slug,
      whatsappTarget(
        settings.contacts,
        fillTemplate(contractTemplate, {
          brand: settings.brandName.text,
          service: pick(plan.name, locale),
          units: '',
          area: '',
        }),
      ),
    ]),
  );
  const whatsapp = whatsappTarget(settings.contacts);
  const rows = plans
    .map((plan) => ({ plan, cmp: annualPlanComparison(pricing, plan) }))
    .filter((row): row is { plan: AnnualPackage; cmp: NonNullable<typeof row.cmp> } => !!row.cmp);
  const steps = [
    { title: t('steps.one.title'), text: t('steps.one.text') },
    { title: t('steps.two.title'), text: t('steps.two.text') },
    { title: t('steps.three.title'), text: t('steps.three.text') },
  ];

  return (
    <PageTransition>
      <Section
        tone="sand"
        aria-labelledby="contracts-title"
        className="pt-6 lg:pt-10"
        size="compact"
      >
        <Breadcrumbs items={[{ label: tNav('annualContracts') }]} className="mb-8" />
        <SectionHeader
          id="contracts-title"
          as="h1"
          eyebrow={tNav('annualContracts')}
          title={tPages('annualContracts.title')}
          lead={t('lead')}
          className="mb-0"
        />
      </Section>

      <Section id="plans" tone="surface" aria-labelledby="plans-title">
        <SectionHeader
          id="plans-title"
          eyebrow={t('plans.eyebrow')}
          title={t('plans.title')}
          lead={t('plans.lead')}
        />
        <PlanCards plans={plans} pricing={pricing} locale={locale} targets={targets} />
        <p className="mt-6 max-w-[40rem] text-small text-muted-foreground">{t('plans.note')}</p>
      </Section>

      <Section id="savings" tone="sand" aria-labelledby="savings-title">
        <SectionHeader
          id="savings-title"
          eyebrow={t('savings.eyebrow')}
          title={t('savings.title')}
          lead={t('savings.lead')}
        />
        {/* The table scrolls sideways on phones: a focusable, labelled region so keyboard users can reach it. */}
        <div
          role="region"
          aria-label={t('savings.caption')}
          tabIndex={0}
          className="reveal-fade overflow-x-auto rounded-card border border-border bg-card shadow-card outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <table className="w-full text-body">
            <caption className="sr-only">{t('savings.caption')}</caption>
            <thead className="bg-surface-2 text-small text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 text-start font-medium">
                  {t('savings.cols.plan')}
                </th>
                <th scope="col" className="px-4 py-3 text-start font-medium">
                  {t('savings.cols.visits')}
                </th>
                <th scope="col" className="px-4 py-3 text-end font-medium">
                  {t('savings.cols.separate')}
                </th>
                <th scope="col" className="px-4 py-3 text-end font-medium">
                  {t('savings.cols.price')}
                </th>
                <th scope="col" className="px-4 py-3 text-end font-medium">
                  {t('savings.cols.saving')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(({ plan, cmp }) => (
                <tr key={plan.slug}>
                  <th scope="row" className="px-4 py-3 text-start font-medium text-foreground">
                    <LocalizedText value={pickLocalized(plan.name, locale)} locale={locale} />
                  </th>
                  <td className="px-4 py-3 text-muted-foreground">
                    {cmp.deepVisits > 0
                      ? t('savings.visitsMix', {
                          standard: formatNumber(cmp.standardVisits, locale),
                          deep: formatNumber(cmp.deepVisits, locale),
                          units: formatNumber(cmp.units, locale),
                        })
                      : t('savings.visitsStd', {
                          standard: formatNumber(cmp.standardVisits, locale),
                          units: formatNumber(cmp.units, locale),
                        })}
                  </td>
                  <td className="px-4 py-3 text-end tabular-nums">
                    <Ltr>{formatAED(cmp.separate, locale)}</Ltr>
                  </td>
                  <td className="px-4 py-3 text-end tabular-nums">
                    <Ltr>{formatAED(cmp.plan, locale)}</Ltr>
                  </td>
                  <td className="px-4 py-3 text-end font-medium text-highlight-ink tabular-nums">
                    <Ltr>{formatAED(cmp.saving, locale)}</Ltr>{' '}
                    <span className="text-small font-normal text-muted-foreground">
                      <Ltr>({formatNumber(cmp.savingPct, locale)}%)</Ltr>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 max-w-[40rem] text-small text-muted-foreground">{t('savings.note')}</p>
      </Section>

      <Section tone="surface" aria-labelledby="visit-title">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <SectionHeader
            id="visit-title"
            eyebrow={t('visit.eyebrow')}
            title={t('visit.title')}
            lead={t('visit.lead')}
            className="mb-0 lg:col-span-5"
          />
          <CheckList
            items={acCleaning?.includes ?? []}
            locale={locale}
            className="lg:col-span-7 lg:pt-2"
          />
        </div>
      </Section>

      <Section tone="deep" aria-labelledby="how-title">
        <SectionHeader
          id="how-title"
          eyebrow={t('how.eyebrow')}
          title={t('how.title')}
          lead={t('how.lead')}
        />
        <NumberedSteps steps={steps} locale={locale} />
      </Section>

      <Section tone="sand" aria-labelledby="faq-title">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <SectionHeader
            id="faq-title"
            eyebrow={t('faq.eyebrow')}
            title={t('faq.title')}
            className="mb-0 lg:col-span-4"
          />
          <FaqList faqs={faqs} locale={locale} name="contracts-faq" className="lg:col-span-8" />
        </div>
      </Section>

      <FinalCta
        title={t('cta.title')}
        lead={t('cta.lead')}
        primary={{ href: '/annual-contracts#plans', label: t('cta.primary') }}
        whatsapp={{ target: whatsapp, label: tCta('whatsapp') }}
      />
    </PageTransition>
  );
}
