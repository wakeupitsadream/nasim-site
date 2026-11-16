import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ActionForm } from '@/components/admin/action-form';
import { dirtyMark, formLabels, PageHeader, Panel, TextField } from '@/components/admin/fields';
import { SERVICE_TEXT_MAX, serviceTextField } from '@/lib/admin/forms';
import { adminI18n } from '@/lib/admin/i18n';
import { sectionLabel } from '@/lib/admin/sections';
import { requireRole } from '@/lib/auth';
import { allServices } from '@/lib/content/queries';
import { getDirection, routing } from '@/lib/i18n/routing';
import { pick } from '@/lib/i18n/text';
import { cn } from '@/lib/utils';
import { saveService } from '../actions';

const quiet =
  'inline-flex min-h-10 items-center gap-2 rounded-lg text-small font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring [&_svg]:size-4';

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
  const languageName = new Intl.DisplayNames([locale], { type: 'language' });

  return (
    <>
      <p className="mb-2 flex flex-wrap items-center justify-between gap-x-4">
        <Link href="/admin/services" className={quiet}>
          <ArrowLeft aria-hidden="true" />
          {t.back}
        </Link>
        {service.status === 'hidden' ? null : (
          <a href={`/${locale}/services/${slug}`} target="_blank" rel="noopener" className={quiet}>
            {t.viewPage}
            <ExternalLink aria-hidden="true" />
          </a>
        )}
      </p>
      <PageHeader title={pick(service.name, locale)} eyebrow={sectionLabel(m, service)} />
      <ActionForm action={saveService.bind(null, slug)} labels={formLabels(m)}>
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <Panel title={t.status} className="lg:sticky lg:top-6 lg:order-last">
            <fieldset className="grid gap-2">
              <legend className="sr-only">{t.status}</legend>
              {(['active', 'coming_soon', 'hidden'] as const).map((status) => (
                <label
                  key={status}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 has-checked:border-primary has-checked:bg-surface-2 has-focus-visible:ring-3 has-focus-visible:ring-ring"
                >
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    defaultChecked={service.status === status}
                    className="mt-1 size-4 shrink-0 accent-primary outline-none"
                  />
                  <span className="min-w-0">
                    <span className="block font-medium">{t.statuses[status]}</span>
                    <span className="block text-small text-pretty text-muted-foreground">
                      {t.statusHints[status]}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
          </Panel>

          <Panel title={t.texts} hint={t.localesHint}>
            <div className="grid gap-4">
              {routing.locales.map((l) => {
                const empty = l !== 'en' && !service.name[l];
                return (
                  <fieldset
                    key={l}
                    className="grid gap-3 rounded-xl border border-border p-4 md:grid-cols-[9rem_minmax(0,1fr)]"
                  >
                    <legend className="sr-only">{languageName.of(l)}</legend>
                    <div aria-hidden="true" className="flex items-start gap-2 md:flex-col">
                      <span className="rounded-md bg-primary px-2 py-1 text-xs font-semibold tracking-wide text-primary-foreground uppercase">
                        {l}
                      </span>
                      <span className="text-small font-medium first-letter:uppercase">
                        {languageName.of(l)}
                      </span>
                      {empty ? (
                        <span className="text-xs text-warning-ink">{t.noTranslation}</span>
                      ) : null}
                    </div>
                    <div className="grid gap-3">
                      <TextField
                        label={t.nameField}
                        name={serviceTextField('name', l)}
                        defaultValue={service.name[l] ?? ''}
                        maxLength={SERVICE_TEXT_MAX.name}
                        lang={l}
                        dir={getDirection(l)}
                      />
                      <label className="grid gap-1.5 text-small font-medium">
                        {t.shortField}
                        <textarea
                          name={serviceTextField('short', l)}
                          defaultValue={service.short[l] ?? ''}
                          maxLength={SERVICE_TEXT_MAX.short}
                          rows={3}
                          lang={l}
                          dir={getDirection(l)}
                          className={cn(
                            'field-sizing-content min-h-20 w-full rounded-lg border border-input bg-card px-3 py-2 text-body font-normal outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
                            dirtyMark,
                          )}
                        />
                      </label>
                    </div>
                  </fieldset>
                );
              })}
            </div>
          </Panel>
        </div>
      </ActionForm>
    </>
  );
}
