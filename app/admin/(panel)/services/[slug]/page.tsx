import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ActionForm } from '@/components/admin/action-form';
import { PageHeader, Panel, TextField } from '@/components/admin/fields';
import { SERVICE_TEXT_MAX, serviceTextField } from '@/lib/admin/forms';
import { adminI18n, fill } from '@/lib/admin/i18n';
import { sectionLabel } from '@/lib/admin/sections';
import { requireRole } from '@/lib/auth';
import { allServices } from '@/lib/content/queries';
import { getDirection, routing } from '@/lib/i18n/routing';
import { pick } from '@/lib/i18n/text';
import { saveService } from '../actions';

const control =
  'w-full rounded-lg border border-input bg-card px-3 text-body outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20';
const quiet =
  'rounded-sm text-small text-muted-foreground underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring';

export default async function ServiceEditPage({ params }: PageProps<'/admin/services/[slug]'>) {
  await requireRole();
  const [{ slug }, { locale, m }, services] = await Promise.all([
    params,
    adminI18n(),
    allServices(),
  ]);
  const service = services.find((s) => s.slug === slug);
  if (!service) notFound();
  const t = m.services;
  return (
    <>
      <p className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
        <Link href="/admin/services" className={quiet}>
          {t.back}
        </Link>
        {service.status === 'hidden' ? null : (
          <a href={`/${locale}/services/${slug}`} target="_blank" rel="noopener" className={quiet}>
            {t.viewPage}
          </a>
        )}
      </p>
      <PageHeader
        title={fill(t.editTitle, { name: pick(service.name, locale) })}
        lead={sectionLabel(m, service)}
      />
      <ActionForm
        action={saveService.bind(null, slug)}
        labels={{ save: m.form.save, saving: m.form.saving }}
      >
        <div className="grid gap-5">
          <Panel title={t.status} hint={t.lead}>
            <select
              name="status"
              defaultValue={service.status}
              aria-label={t.status}
              className={`${control} h-tap max-w-xs`}
            >
              {(['active', 'coming_soon', 'hidden'] as const).map((status) => (
                <option key={status} value={status}>
                  {t.statuses[status]}
                </option>
              ))}
            </select>
          </Panel>
          <Panel title={t.nameField} hint={t.localesHint}>
            <div className="grid gap-4 md:grid-cols-2">
              {routing.locales.map((l) => (
                <TextField
                  key={l}
                  label={l.toUpperCase()}
                  name={serviceTextField('name', l)}
                  defaultValue={service.name[l] ?? ''}
                  maxLength={SERVICE_TEXT_MAX.name}
                  lang={l}
                  dir={getDirection(l)}
                />
              ))}
            </div>
          </Panel>
          <Panel title={t.shortField} hint={t.localesHint}>
            <div className="grid gap-4 md:grid-cols-2">
              {routing.locales.map((l) => (
                <label key={l} className="grid gap-1.5 text-small font-medium">
                  {l.toUpperCase()}
                  <textarea
                    name={serviceTextField('short', l)}
                    defaultValue={service.short[l] ?? ''}
                    maxLength={SERVICE_TEXT_MAX.short}
                    rows={4}
                    lang={l}
                    dir={getDirection(l)}
                    className={`${control} py-2`}
                  />
                </label>
              ))}
            </div>
          </Panel>
        </div>
      </ActionForm>
    </>
  );
}
