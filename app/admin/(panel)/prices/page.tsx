import { ActionForm } from '@/components/admin/action-form';
import { PageHeader, Panel } from '@/components/admin/fields';
import { Input } from '@/components/ui/input';
import { itemEditable, itemField, packageEditable, packageField } from '@/lib/admin/forms';
import { adminI18n, fill } from '@/lib/admin/i18n';
import { requireRole } from '@/lib/auth';
import { allPackages, allPriceItems, allServices } from '@/lib/content/queries';
import { pick } from '@/lib/i18n/text';
import { savePrices } from './actions';

const row = 'flex min-h-tap flex-wrap items-center justify-between gap-x-4 gap-y-1';

function PriceInput({ name, value, label }: { name: string; value: number; label: string }) {
  return (
    <Input
      name={name}
      defaultValue={String(value)}
      aria-label={label}
      inputMode="decimal"
      autoComplete="off"
      dir="ltr"
      className="w-28 text-end tabular-nums"
    />
  );
}

export default async function PricesPage() {
  await requireRole();
  const [{ locale, m }, services, items, packages] = await Promise.all([
    adminI18n(),
    allServices(),
    allPriceItems(),
    allPackages(),
  ]);
  const t = m.prices;
  const groups = services
    .map((service) => ({
      service,
      items: items.filter((i) => i.service_slug === service.slug).sort((a, b) => a.sort - b.sort),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      <PageHeader title={t.title} lead={t.lead} />
      <ActionForm action={savePrices} labels={{ save: m.form.save, saving: m.form.saving }}>
        <div className="grid gap-5 md:grid-cols-2">
          {groups.map(({ service, items: rows }) => (
            <Panel
              key={service.slug}
              title={pick(service.name, locale)}
              hint={service.status === 'hidden' ? m.services.statuses.hidden : undefined}
              className="content-start"
            >
              <ul className="grid gap-2">
                {rows.map((item) => {
                  const name = pick(item.name, locale);
                  const notes = [
                    item.tier_from_qty > 1 ? fill(t.tier, { n: item.tier_from_qty }) : '',
                    item.unit === 'from' ? t.estimate : '',
                  ].filter(Boolean);
                  return (
                    <li key={item.key} className={row}>
                      <span className="min-w-0 flex-1">
                        {name}
                        {notes.length > 0 ? (
                          <span className="block text-small text-muted-foreground">
                            {notes.join(' · ')}
                          </span>
                        ) : null}
                      </span>
                      {itemEditable(item) ? (
                        <PriceInput name={itemField(item.key)} value={item.price} label={name} />
                      ) : (
                        <span className="text-small text-muted-foreground">{t.onRequest}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Panel>
          ))}
          <Panel title={t.packages} className="content-start md:col-span-2">
            <ul className="grid gap-2 md:grid-cols-2 md:gap-x-8">
              {packages.map((p) => {
                const name = pick(p.name, locale);
                return (
                  <li key={p.slug} className={row}>
                    <span className="min-w-0 flex-1">
                      {name}
                      <span className="block text-small text-muted-foreground">
                        {p.type === 'bundle' ? t.bundle : t.annual}
                      </span>
                    </span>
                    {packageEditable(p) ? (
                      <PriceInput name={packageField(p.slug)} value={p.price ?? 0} label={name} />
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
