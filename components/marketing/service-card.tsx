import { ArrowRightIcon, ClockIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { LocalizedText } from '@/components/localized-text';
import { PriceFrom } from '@/components/marketing/price-from';
import { ServiceIcon } from '@/components/marketing/service-icon';
import { Badge } from '@/components/ui/badge';
import { formatMinutes, formatMonthYear } from '@/lib/i18n/format';
import { Link } from '@/lib/i18n/navigation';
import type { Locale } from '@/lib/i18n/routing';
import { pickLocalized } from '@/lib/i18n/text';
import type { PriceUnit, Service } from '@/lib/validation/content';
import { cn } from '@/lib/utils';

export type ServiceBadge = 'sameDay' | 'estimate' | 'comingSoon';

type Props = {
  service: Service;
  priceFrom: { amount: number; unit: PriceUnit } | null;
  locale: Locale;
  badges?: ServiceBadge[];
  className?: string;
};

/** Catalogue card: a stretched link around the name, badges, summary, price and duration. */
export async function ServiceCard({ service, priceFrom, locale, badges = [], className }: Props) {
  const t = await getTranslations('Services');
  const name = pickLocalized(service.name, locale);
  const short = pickLocalized(service.short, locale);
  const comingSoon = service.status === 'coming_soon';

  return (
    <article
      data-tilt=""
      className={cn(
        'group tilt relative flex h-full flex-col gap-5 rounded-card border border-border bg-card p-6 shadow-card transition-[transform,box-shadow] duration-(--nasim-dur) ease-brand hover:shadow-lift motion-safe:hover:-translate-y-0.5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <ServiceIcon slug={service.slug} />
        {badges.length > 0 || comingSoon ? (
          <div className="flex flex-wrap justify-end gap-1.5">
            {badges.includes('sameDay') ? (
              <Badge variant="success">{t('badge.sameDay')}</Badge>
            ) : null}
            {badges.includes('estimate') ? (
              <Badge variant="outline">{t('badge.estimate')}</Badge>
            ) : null}
            {comingSoon ? (
              <Badge variant="warning">
                {service.available_from
                  ? t('badge.availableFrom', {
                      date: formatMonthYear(service.available_from, locale),
                    })
                  : t('badge.comingSoon')}
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <h3 className="text-lead font-medium">
          <Link
            href={`/services/${service.slug}`}
            transitionTypes={['nav-forward']}
            className="outline-none after:absolute after:inset-0 after:rounded-card after:content-[''] focus-visible:after:ring-3 focus-visible:after:ring-ring focus-visible:after:ring-offset-2"
          >
            <LocalizedText value={name} locale={locale} />
          </Link>
        </h3>
        <p className="line-clamp-3 text-body text-muted-foreground">
          <LocalizedText value={short} locale={locale} />
        </p>
      </div>

      <div className="flex items-end justify-between gap-3 border-t border-border pt-4">
        <div className="flex flex-col gap-1">
          {priceFrom ? (
            <PriceFrom amount={priceFrom.amount} unit={priceFrom.unit} locale={locale} />
          ) : null}
          {service.duration_min ? (
            <span className="flex items-center gap-1.5 text-small text-muted-foreground">
              <ClockIcon aria-hidden="true" strokeWidth={1.5} className="size-4" />
              {formatMinutes(service.duration_min, locale)}
            </span>
          ) : null}
        </div>
        <span
          aria-hidden="true"
          className="inline-flex size-10 items-center justify-center rounded-full bg-surface-2 text-primary transition-colors duration-(--nasim-dur) group-hover:bg-primary group-hover:text-primary-foreground"
        >
          <ArrowRightIcon strokeWidth={1.5} className="size-5 rtl:-scale-x-100" />
        </span>
      </div>
    </article>
  );
}
