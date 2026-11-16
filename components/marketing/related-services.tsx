import { ServiceCard, type ServiceBadge } from '@/components/marketing/service-card';
import type { Locale } from '@/lib/i18n/routing';
import { priceFrom, type PricingConfig } from '@/lib/pricing';
import type { Service } from '@/lib/validation/content';
import { stagger } from '@/lib/motion';
import { cn } from '@/lib/utils';

type Props = {
  services: Service[];
  pricing: PricingConfig;
  locale: Locale;
  emergencyEnabled: boolean;
  className?: string;
};

export function badgesFor(
  service: Service,
  emergencyEnabled: boolean,
  pricing: PricingConfig,
): ServiceBadge[] {
  const badges: ServiceBadge[] = [];
  if (service.slug === 'emergency-ac-repair' && emergencyEnabled) badges.push('sameDay');
  // "Diagnostics + estimate" only where a diagnostics fee is really charged first (repairs,
  // recharge); a drain or thermostat job is an estimate without one.
  if (service.pricing_unit === 'from' && pricing.rules.quoteOnlyServices.includes(service.slug))
    badges.push('estimate');
  return badges;
}

/** A grid of catalogue cards (catalogue sections, "usually booked together"). */
export function ServiceGrid({ services, pricing, locale, emergencyEnabled, className }: Props) {
  return (
    <ul className={cn('grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6', className)}>
      {services.map((service, i) => (
        // Stagger by column so each row of cards rises together, left to right (mirrored in RTL).
        <li key={service.slug} className="reveal h-full" style={stagger(i % 3)}>
          <ServiceCard
            service={service}
            priceFrom={priceFrom(pricing, service.slug)}
            locale={locale}
            badges={badgesFor(service, emergencyEnabled, pricing)}
          />
        </li>
      ))}
    </ul>
  );
}
