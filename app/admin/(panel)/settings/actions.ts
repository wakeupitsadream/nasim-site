'use server';

import { updateTag } from 'next/cache';
import { rejected, saved, unchanged, type FormState } from '@/lib/admin/form-state';
import { changedSettings, fieldsOf, settingsFromForm } from '@/lib/admin/forms';
import { adminI18n, fill, type AdminMessages } from '@/lib/admin/i18n';
import { requireRole } from '@/lib/auth';
import { getEditableSettings } from '@/lib/content/site';
import { saveOverrides } from '@/lib/db/mutations';
import { formFieldsSchema } from '@/lib/validation/admin';

/** `contacts.phone` → «Телефон для звонков». */
function label(m: AdminMessages, field: string): string {
  const [group, name] = field.split('.');
  const labels = (m.settings as Record<string, Record<string, string> | string>)[group ?? ''];
  return (typeof labels === 'object' && name && labels[name]) || field;
}

export async function saveSettings(prev: FormState, data: FormData): Promise<FormState> {
  const fields = formFieldsSchema.safeParse(fieldsOf(data));
  const user = await requireRole('owner');
  const { m } = await adminI18n();
  if (!fields.success) return rejected(prev, m.form.failed);

  const next = settingsFromForm(fields.data);
  if (!next.ok) {
    const names = next.fields.map((f) => label(m, f)).join(', ');
    return rejected(prev, fill(m.form.invalid, { fields: names }), next.fields);
  }
  const patch = changedSettings(await getEditableSettings(), next.data);
  if (Object.keys(patch).length === 0) return unchanged(prev, m.form.unchanged);
  try {
    await saveOverrides([{ kind: 'settings', key: 'site', patch }], user.email);
  } catch (error) {
    console.error('[admin] settings were not saved', error instanceof Error ? error.name : '');
    return rejected(prev, m.form.failed);
  }
  updateTag('settings');
  return saved(prev, m.form.saved);
}
