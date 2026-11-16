import type { AdminMessages } from '@/lib/admin/i18n';
import type { Service } from '@/lib/validation/content';

/** «Кондиционеры · чистка» for a service: its category, and for AC also the owner's section. */
export function sectionLabel(m: AdminMessages, service: Service): string {
  const key = service.category === 'ac' ? `ac:${service.group ?? 'other'}` : service.category;
  return (m.services.sections as Record<string, string>)[key] ?? key;
}
