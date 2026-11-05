import { ArrowRightIcon, ClockIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { LocalizedText } from '@/components/localized-text';
import { PriceFrom } from '@/components/marketing/price-from';
import { Section } from '@/components/marketing/section';
import { SectionHeader } from '@/components/marketing/section-header';
import { ServiceIcon } from '@/components/marketing/service-icon';
import { Button } from '@/components/ui/button';
import { getPricingConfig, getServices } from '@/lib/content/queries';
import { formatMinutes } from '@/lib/i18n/format';
import { Link } from '@/lib/i18n/navigation';
import type { Locale } from '@/lib/i18n/routing';
import { pickLocalized } from '@/lib/i18n/text';
import { stagger } from '@/lib/motion';
import { priceFrom } from '@/lib/pricing';
import type { Service } from '@/lib/validation/content';

/** Home services block: two panels of hairline rows (name, duration, from-price). */
export async function ServiceMenu({ locale }: { locale: Locale }) {
  const [t, pricing, ac, upholstery] = await Promise.all([
    getTranslations('Home'),
    getPricingConfig(),
    getServices({ status: ['active'], category: 'ac' }),
    getServices({ status: ['active'], category: 'upholstery' }),
  ]);

  const panel = (key: 'ac' | 'upholstery', services: Service[], index: number) => (
    <div
      className="reveal-fade rounded-panel border border-border bg-card p-2 shadow-card"
      style={stagger(index)}
    >
      <h3 className="px-4 pt-4 pb-2 text-small font-medium tracking-wide text-muted-foreground uppercase">
        {t(`services.${key}`)}
      </h3>
      <ul className="divide-y divide-border">
        {services.map((service) => {
          const from = priceFrom(pricing, service.slug);
          return (
            <li key={service.slug}>
              <Link
                href={`/services/${service.slug}`}
                transitionTypes={['nav-forward']}
                className="group flex min-h-tap items-center gap-4 rounded-card px-4 py-3 transition-colors duration-(--nasim-dur-fast) outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring"
              >
                <ServiceIcon slug={service.slug} className="size-10 rounded-lg" />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-body font-medium text-foreground">
                    <LocalizedText value={pickLocalized(service.name, locale)} locale={locale} />
                  </span>
                  {service.duration_min ? (
                    <span className="flex items-center gap-1.5 text-small text-muted-foreground">
                      <ClockIcon aria-hidden="true" strokeWidth={1.5} className="size-3.5" />
                      {formatMinutes(service.duration_min, locale)}
                    </span>
                  ) : null}
                </span>
                {from ? (
                  <PriceFrom
                    amount={from.amount}
                    unit={from.unit}
                    locale={locale}
                    className="hidden shrink-0 justify-end text-end sm:inline-flex"
                  />
                ) : null}
                <ArrowRightIcon
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="size-5 shrink-0 text-primary transition-transform duration-(--nasim-dur-fast) group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <Section tone="sand" aria-labelledby="services-title">
      <SectionHeader
        id="services-title"
        eyebrow={t('services.eyebrow')}
        title={t('services.title')}
        lead={t('services.lead')}
        actions={
          <Button variant="outline" size="lg" asChild>
            <Link href="/services" transitionTypes={['nav-forward']}>
              {t('services.all')}
              <ArrowRightIcon className="rtl:-scale-x-100" />
            </Link>
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        {panel('ac', ac, 0)}
        {panel('upholstery', upholstery, 1)}
      </div>
    </Section>
  );
}
