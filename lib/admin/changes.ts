// What one audit entry changed, in words, for the overview's list. Pure: the caller supplies
// the seed-plus-edits values that a first edit is compared with.
import { fill, type AdminMessages } from '@/lib/admin/i18n';
import type { AuditEntry } from '@/lib/db/queries/audit';

type Values = Record<string, unknown>;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Fields whose stored value differs between `before` and `after`. */
export function changedKeys(entry: Pick<AuditEntry, 'before' | 'after'>): string[] {
  const before = entry.before ?? {};
  const after = entry.after ?? {};
  return Object.keys(after).filter((k) => !same(before[k], after[k]));
}

/**
 * «299 → 305» for a price, «На сайте → Скрыта» for a status, the names of the changed groups
 * for settings and texts. `seedValue(field)` is what the site showed before the first edit.
 */
export function describeChange(
  m: AdminMessages,
  entry: Pick<AuditEntry, 'kind' | 'before' | 'after'>,
  seedValue: (field: string) => unknown,
): string {
  const after: Values = entry.after ?? {};
  const before: Values = entry.before ?? {};
  const was = (field: string) => (field in before ? before[field] : seedValue(field));
  const arrow = (a: unknown, b: unknown) =>
    fill(m.home.log.change, { before: String(a ?? '—'), after: String(b ?? '—') });

  const parts = changedKeys(entry).map((field) => {
    if (field === 'price') return arrow(was(field), after[field]);
    if (field === 'status') {
      const label = (v: unknown) => (m.services.statuses as Record<string, string>)[String(v)] ?? v;
      return arrow(label(was(field)), label(after[field]));
    }
    if (entry.kind === 'settings') {
      const group = (m.settings as Record<string, { title?: string } | string>)[field];
      return typeof group === 'object' && group.title ? group.title : field;
    }
    if (field === 'name') return m.services.nameField;
    if (field === 'short') return m.services.shortField;
    return field;
  });
  return parts.join(' · ');
}
