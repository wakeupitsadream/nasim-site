import type { InitialBooking } from '@/lib/booking/state';
import type { Locale } from '@/lib/i18n/routing';
import type { Localized } from '@/lib/i18n/text';
import type { PricingConfig, VatState } from '@/lib/pricing';
import type { BookingSettings } from '@/lib/validation/settings';
import type { PriceUnit } from '@/lib/validation/content';

export type BookingCategory = 'ac' | 'upholstery';

export type BookingService = {
  slug: string;
  category: BookingCategory;
  name: Localized;
  priceFrom: { amount: number; unit: PriceUnit } | null;
  durationMin: number | null;
  /** Price line ids of this service, in display order. */
  lines: string[];
  emergency: boolean;
};

/** Everything the client wizard needs, built once on the server (serializable, no functions). */
export type BookingPayload = {
  locale: Locale;
  brand: string;
  pricing: PricingConfig;
  vat: VatState;
  booking: BookingSettings;
  services: BookingService[];
  /** Human label per price line: the service name for single-line services, else the item name. */
  lineLabels: Record<string, Localized>;
  areas: { slug: string; name: Localized }[];
  /** WhatsApp number in E.164, or '' while the owner has not provided one. */
  whatsapp: string;
  /** `wa.template.quote` in the page locale. */
  template: string;
  initial?: InitialBooking;
};
