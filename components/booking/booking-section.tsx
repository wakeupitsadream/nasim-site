import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { BookingWizard } from '@/components/booking/wizard';
import type { BookingPayload, BookingService } from '@/components/booking/types';
import {
  getAreas,
  getBlock,
  getPackages,
  getPhoto,
  getPricingConfig,
  getServices,
} from '@/lib/content/queries';
import { getSiteSettings } from '@/lib/content/site';
import { pickLocalized } from '@/lib/i18n/text';
import { defaultSelection } from '@/lib/booking/state';
import { linesForService, priceFrom } from '@/lib/pricing';

type Props = {
  /** Preselect a service (service pages); the wizard then starts at the details step. */
  initialService?: string;
};

/**
 * Server half of the booking-request wizard: loads content, builds a serializable payload and
 * scopes the client messages to what the wizard reads (DECISIONS: client bundle). Reads no
 * cookies, headers or clock, so pages with `ensureStatic` stay static.
 */
export async function BookingSection({ initialService }: Props) {
  const locale = await getLocale();
  const [settings, pricing, services, areas, template, bundles, messages, acPhoto, sofaPhoto] =
    await Promise.all([
      getSiteSettings(locale),
      getPricingConfig(),
      getServices({ status: ['active'] }),
      getAreas(),
      getBlock('wa.template.quote'),
      getPackages({ type: 'bundle' }),
      getMessages(),
      getPhoto({ kind: 'category', category: 'ac' }, locale),
      getPhoto({ kind: 'category', category: 'upholstery' }, locale),
    ]);

  const bookable: BookingService[] = services
    // Services priced on request have no price lines: they are booked by message, not here.
    .filter(
      (s) =>
        (s.category === 'ac' || s.category === 'upholstery') &&
        linesForService(pricing, s.slug).length > 0,
    )
    .map((s) => ({
      slug: s.slug,
      category: s.category as BookingService['category'],
      name: pickLocalized(s.name, locale),
      priceFrom: priceFrom(pricing, s.slug),
      durationMin: s.duration_min,
      lines: linesForService(pricing, s.slug).map((l) => l.id),
      emergency: s.slug === 'emergency-ac-repair',
    }));

  const lineLabels: BookingPayload['lineLabels'] = {};
  for (const service of bookable) {
    for (const id of service.lines) {
      const line = pricing.lines.find((l) => l.id === id)!;
      lineLabels[id] = service.lines.length === 1 ? service.name : pickLocalized(line.name, locale);
    }
  }

  const preselected = bookable.find((s) => s.slug === initialService);
  const payload: BookingPayload = {
    locale,
    brand: settings.brandName.text,
    pricing,
    vat: settings.vat,
    booking: settings.booking,
    services: bookable,
    lineLabels,
    bundleNames: Object.fromEntries(bundles.map((b) => [b.slug, pickLocalized(b.name, locale)])),
    areas: areas.map((a) => ({ slug: a.slug, name: pickLocalized(a.name, locale) })),
    categoryPhotos: {
      ...(acPhoto ? { ac: acPhoto } : {}),
      ...(sofaPhoto ? { upholstery: sofaPhoto } : {}),
    },
    whatsapp: settings.contacts.whatsapp,
    template: pickLocalized(template, locale).text,
    initial: preselected
      ? {
          category: preselected.category,
          service: {
            slug: preselected.slug,
            defaults: defaultSelection(pricing.lines, preselected.lines),
          },
        }
      : undefined,
  };

  return (
    <NextIntlClientProvider
      messages={{ Booking: messages.Booking, Common: messages.Common, Price: messages.Price }}
    >
      <BookingWizard payload={payload} />
    </NextIntlClientProvider>
  );
}
