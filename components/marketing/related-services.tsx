import { ServiceCard, type ServiceBadge } from '@/components/marketing/service-card';
import type { Locale } from '@/lib/i18n/routing';
import { priceFrom, type PricingConfig } from '@/lib/pricing';
import type { Service } from '@/lib/validation/content';
import { cn } from '@/lib/utils';

type Props = {
  services: Service[];
  pricing: PricingConfig;
  locale: Locale;
  emergencyEnabled: boolean;
  className?: string;
};

export function badgesFor(service: Service, emergencyEnabled: boolean): ServiceBadge[] {
  const badges: ServiceBadge[] = [];
  if (service.slug === 'emergency-ac-repair' && emergencyEnabled) badges.push('sameDay');
  if (service.pricing_unit === 'from') badges.push('estimate');
  return badges;
}

/** A grid of catalogue cards (catalogue sections, "usually booked together"). */
export function ServiceGrid({ services, pricing, locale, emergencyEnabled, className }: Props) {
  return (
    <ul className={cn('grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6', className)}>
      {services.map((service) => (
        <li key={service.slug} className="h-full">
          <ServiceCard
            service={service}
            priceFrom={priceFrom(pricing, service.slug)}
            locale={locale}
            badges={badgesFor(service, emergencyEnabled)}
          />
        </li>
      ))}
    </ul>
  );
}
