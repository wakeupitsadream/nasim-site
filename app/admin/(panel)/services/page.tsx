import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { PageHeader, STATUS_TONE, StatusChip } from '@/components/admin/fields';
import { Ltr } from '@/components/ltr';
import { adminI18n, fill } from '@/lib/admin/i18n';
import { SECTIONS, sectionKey, sectionTitle } from '@/lib/admin/sections';
import { requireRole } from '@/lib/auth';
import { allServices, getPricingConfig } from '@/lib/content/queries';
import { formatAED } from '@/lib/i18n/format';
import { pick } from '@/lib/i18n/text';
import { priceFrom } from '@/lib/pricing';

export default async function ServicesPage() {
  await requireRole();
  const [{ locale, m }, services, cfg] = await Promise.all([
    adminI18n(),
    allServices(),
    getPricingConfig(),
  ]);
  const t = m.services;
  const sections = SECTIONS.map((key) => ({
    key,
    title: sectionTitle(m, key),
    services: services.filter((s) => sectionKey(s) === key),
  })).filter((s) => s.services.length > 0);

  return (
    <>
      <PageHeader title={t.title} lead={t.lead} />
      <div className="grid gap-8">
        {sections.map((section) => (
          <section key={section.key} aria-labelledby={`s-${section.key.replace(':', '-')}`}>
            <h2
              id={`s-${section.key.replace(':', '-')}`}
              className="mb-3 font-sans text-eyebrow text-muted-foreground uppercase"
            >
              {section.title}
            </h2>
            <ul className="divide-y divide-border overflow-clip rounded-card border border-border bg-card shadow-card">
              {section.services.map((service) => {
                const from = priceFrom(cfg, service.slug);
                const missing = Object.values(service.name).filter((v) => !v).length;
                return (
                  <li key={service.slug} className="relative">
                    <Link
                      href={`/admin/services/${service.slug}`}
                      className="group flex min-h-16 items-center gap-4 px-5 py-3 outline-none hover:bg-muted focus-visible:bg-muted"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-pretty">
                          {pick(service.name, locale)}
                        </span>
                        <span className="mt-0.5 block text-small text-muted-foreground">
                          {from ? (
                            from.exact ? (
                              <Ltr>{formatAED(from.amount, locale)}</Ltr>
                            ) : (
                              fill(t.from, { price: formatAED(from.amount, locale) })
                            )
                          ) : (
                            m.prices.onRequest
                          )}
                          {missing > 0 ? ` · ${t.noTranslation}` : ''}
                        </span>
                      </span>
                      <StatusChip tone={STATUS_TONE[service.status]}>
                        {t.statuses[service.status]}
                      </StatusChip>
                      <ChevronRight
                        aria-hidden="true"
                        className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground rtl:-scale-x-100"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
