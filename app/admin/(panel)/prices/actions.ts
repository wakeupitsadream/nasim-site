'use server';

import { updateTag } from 'next/cache';
import { rejected, saved, unchanged, type FormState } from '@/lib/admin/form-state';
import { fieldsOf, itemField, packageField, pricesFromForm } from '@/lib/admin/forms';
import { adminI18n, fill } from '@/lib/admin/i18n';
import { requireRole } from '@/lib/auth';
import { allPackages, allPriceItems, getPricingRules } from '@/lib/content/queries';
import { saveOverrides } from '@/lib/db/mutations';
import { pick } from '@/lib/i18n/text';
import { formFieldsSchema } from '@/lib/validation/admin';

export async function savePrices(prev: FormState, data: FormData): Promise<FormState> {
  const fields = formFieldsSchema.safeParse(fieldsOf(data));
  const user = await requireRole();
  const { locale, m } = await adminI18n();
  if (!fields.success) return rejected(prev, m.form.failed);

  const [items, packages, rules] = await Promise.all([
    allPriceItems(),
    allPackages(),
    getPricingRules(),
  ]);
  const edits = pricesFromForm(fields.data, items, packages, rules);
  if (!edits.ok) {
    if (edits.fields.length === 0) return rejected(prev, m.form.failed);
    const names = new Map([
      ...items.map((i) => [itemField(i.key), pick(i.name, locale)] as const),
      ...packages.map((p) => [packageField(p.slug), pick(p.name, locale)] as const),
    ]);
    const list = edits.fields.map((f) => names.get(f) ?? f).join(', ');
    return rejected(prev, fill(m.form.invalid, { fields: list }), edits.fields);
  }
  const writes = [
    ...edits.data.items.map((e) => ({ kind: 'price_item' as const, ...e })),
    ...edits.data.packages.map((e) => ({ kind: 'package' as const, ...e })),
  ];
  if (writes.length === 0) return unchanged(prev, m.form.unchanged);
  try {
    await saveOverrides(writes, user.email);
  } catch (error) {
    console.error('[admin] prices were not saved', error instanceof Error ? error.name : '');
    return rejected(prev, m.form.failed);
  }
  // Price tables, "from" prices on cards, the calculator and the assistant all read `content`.
  updateTag('content');
  return saved(prev, m.form.saved);
}
