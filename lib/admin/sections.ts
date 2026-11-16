import type { AdminMessages } from '@/lib/admin/i18n';
import type { Service } from '@/lib/validation/content';

/** The admin's sections of the catalogue, in the order of the site's price list. */
export const SECTIONS = [
  'ac:service',
  'ac:cleaning',
  'ac:other',
  'upholstery',
  'coming_soon',
] as const;
export type SectionKey = (typeof SECTIONS)[number];

/** A service's section: its category, and for AC also the owner's sub-section. */
export const sectionKey = (service: Service): SectionKey =>
  service.category === 'ac' ? `ac:${service.group ?? 'other'}` : service.category;

export const sectionTitle = (m: AdminMessages, key: SectionKey): string => m.services.sections[key];

/** «Кондиционеры · чистка» for a service. */
export const sectionLabel = (m: AdminMessages, service: Service): string =>
  sectionTitle(m, sectionKey(service));
