import { Package } from 'lucide-react';
import { ActionForm } from '@/components/admin/action-form';
import { dirtyMark, formLabels, PageHeader, Panel, StatusChip } from '@/components/admin/fields';
import { Ltr } from '@/components/ltr';
import { Input } from '@/components/ui/input';
import { itemEditable, itemField, packageEditable, packageField } from '@/lib/admin/forms';
import { adminI18n, fill } from '@/lib/admin/i18n';
import { SECTIONS, sectionKey, sectionTitle } from '@/lib/admin/sections';
import { requireRole } from '@/lib/auth';
import { allPackages, allPriceItems, allServices, getPricingRules } from '@/lib/content/queries';
import { pick } from '@/lib/i18n/text';
import { cn } from '@/lib/utils';
import { savePrices } from './actions';

const row = 'flex min-h-tap items-center justify-between gap-4';

/** «Standard clean, 2–3 units» → «2–3 units»: under the service's own heading the tier is enough. */
const tierLabel = (name: string) => name.slice(name.search(/[,،，](?=[^,،，]*$)/) + 1).trim();

function PriceInput({
  name,
  value,
  label,
  currency,
}: {
  name: string;
  value: number;
  label: string;
  currency: string;
}) {
  return (
    <span className="relative shrink-0">
      <Input
        name={name}
        defaultValue={String(value)}
        aria-label={label}
        inputMode="decimal"
        autoComplete="off"
        dir="ltr"
        className={cn('w-32 pe-12 text-end font-medium tabular-nums', dirtyMark)}
      />
      <Ltr
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 inset-e-3 flex items-center text-xs font-medium text-muted-foreground"
      >
        {currency}
      </Ltr>
    </span>
  );
}

export default async function PricesPage() {
  await requireRole();
  const [{ locale, m }, services, items, packages, rules] = await Promise.all([
    adminI18n(),
    allServices(),
    allPriceItems(),
    allPackages(),
    getPricingRules(),
  ]);
  const t = m.prices;
  const groups = services
    .map((service) => ({
      service,
      items: items.filter((i) => i.service_slug === service.slug).sort((a, b) => a.sort - b.sort),
    }))
    .filter((g) => g.items.length > 0);
  const sections = SECTIONS.map((key) => ({
    key,
    title: sectionTitle(m, key),
    groups: groups.filter((g) => sectionKey(g.service) === key),
  })).filter((s) => s.groups.length > 0);
  const quiet = <span className="text-small text-muted-foreground">{t.onRequest}</span>;

  return (
    <>
      <PageHeader title={t.title} lead={t.lead} />
      <nav
        aria-label={t.jump}
        className="sticky top-14 z-10 -mx-4 mb-6 flex gap-2 overflow-x-auto bg-background/95 px-4 py-2.5 backdrop-blur lg:top-0 lg:-mx-10 lg:px-10"
      >
        {[
          ...sections.map((s) => ({ id: s.key, title: s.title })),
          { id: 'packages', title: t.packages },
        ].map(({ id, title }) => (
          <a
            key={id}
            href={`#${id.replace(':', '-')}`}
            className="rounded-full border border-border bg-card px-3.5 py-1.5 text-small font-medium whitespace-nowrap outline-none hover:border-line-strong hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring"
          >
            {title}
          </a>
        ))}
      </nav>
      <ActionForm action={savePrices} labels={formLabels(m)}>
        <div className="grid gap-9">
          {sections.map((section) => (
            <section
              key={section.key}
              id={section.key.replace(':', '-')}
              aria-labelledby={`h-${section.key.replace(':', '-')}`}
              className="scroll-mt-28 lg:scroll-mt-16"
            >
              <h2
                id={`h-${section.key.replace(':', '-')}`}
                className="mb-3 font-sans text-eyebrow text-muted-foreground uppercase"
              >
                {section.title}
              </h2>
              <div className="grid items-start gap-4 md:grid-cols-2">
                {section.groups.map(({ service, items: rows }) => (
                  <Panel
                    key={service.slug}
                    title={pick(service.name, locale)}
                    aside={
                      service.status === 'active' ? null : (
                        <StatusChip tone={service.status === 'hidden' ? 'muted' : 'warning'}>
                          {m.services.statuses[service.status]}
                        </StatusChip>
                      )
                    }
                  >
                    <ul className="grid divide-y divide-border">
                      {rows.map((item) => {
                        const name = pick(item.name, locale);
                        const note = [
                          item.tier_from_qty > 1 ? fill(t.tier, { n: item.tier_from_qty }) : '',
                          item.unit === 'from' ? t.estimate : '',
                        ]
                          .filter(Boolean)
                          .join(' · ');
                        return (
                          <li key={item.key} className={cn(row, 'py-1.5')}>
                            <span className="min-w-0 flex-1 text-pretty">
                              {item.tier_group ? tierLabel(name) : name}
                              {note ? (
                                <span className="block text-small text-muted-foreground">
                                  {note}
                                </span>
                              ) : null}
                            </span>
                            {itemEditable(item) ? (
                              <PriceInput
                                name={itemField(item.key)}
                                value={item.price}
                                label={name}
                                currency={rules.currency}
                              />
                            ) : (
                              quiet
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </Panel>
                ))}
              </div>
            </section>
          ))}
          <Panel
            id="packages"
            title={t.packages}
            icon={<Package aria-hidden="true" />}
            className="lg:scroll-mt-16"
          >
            <ul className="grid gap-x-10 md:grid-cols-2">
              {packages.map((p) => {
                const name = pick(p.name, locale);
                return (
                  <li key={p.slug} className={cn(row, 'border-b border-border py-1.5')}>
                    <span className="min-w-0 flex-1">
                      {name}
                      <span className="block text-small text-muted-foreground">
                        {p.type === 'bundle' ? t.bundle : t.annual}
                      </span>
                    </span>
                    {packageEditable(p) ? (
                      <PriceInput
                        name={packageField(p.slug)}
                        value={p.price ?? 0}
                        label={name}
                        currency={rules.currency}
                      />
                    ) : (
                      <span className="text-small text-muted-foreground">{t.quoteOnly}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
        <p className="mt-5 max-w-2xl text-small text-pretty text-muted-foreground">{t.seoNote}</p>
      </ActionForm>
    </>
  );
}
