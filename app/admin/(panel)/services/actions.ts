'use server';

import { updateTag } from 'next/cache';
import { rejected, saved, unchanged, type FormState } from '@/lib/admin/form-state';
import { fieldsOf, serviceFromForm } from '@/lib/admin/forms';
import { adminI18n, fill, type AdminMessages } from '@/lib/admin/i18n';
import { requireRole } from '@/lib/auth';
import { allServices } from '@/lib/content/queries';
import { saveOverrides } from '@/lib/db/mutations';
import { formFieldsSchema } from '@/lib/validation/admin';

/** `short.ru` → «Краткое описание (RU)». */
function label(m: AdminMessages, field: string): string {
  const [name, locale] = field.split('.');
  const base =
    name === 'name' ? m.services.nameField : name === 'short' ? m.services.shortField : field;
  return locale ? `${base} (${locale.toUpperCase()})` : base;
}

/** Bound to the service's slug by the edit page. */
export async function saveService(
  slug: string,
  prev: FormState,
  data: FormData,
): Promise<FormState> {
  const fields = formFieldsSchema.safeParse(fieldsOf(data));
  const user = await requireRole();
  const { m } = await adminI18n();
  const service = (await allServices()).find((s) => s.slug === slug);
  if (!fields.success || !service) return rejected(prev, m.form.failed);

  const patch = serviceFromForm(fields.data, service);
  if (!patch.ok) {
    const names = patch.fields.map((f) => label(m, f)).join(', ');
    return rejected(prev, fill(m.form.invalid, { fields: names }), patch.fields);
  }
  if (Object.keys(patch.data).length === 0) return unchanged(prev, m.form.unchanged);
  try {
    await saveOverrides([{ kind: 'service', key: slug, patch: patch.data }], user.email);
  } catch (error) {
    console.error('[admin] the service was not saved', error instanceof Error ? error.name : '');
    return rejected(prev, m.form.failed);
  }
  updateTag('content');
  return saved(prev, m.form.saved);
}
