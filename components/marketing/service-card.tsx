import { ArrowRightIcon, ClockIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { LocalizedText } from '@/components/localized-text';
import { PriceFrom } from '@/components/marketing/price-from';
import { ServiceIcon } from '@/components/marketing/service-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatMinutes, formatMonthYear } from '@/lib/i18n/format';
import { Link } from '@/lib/i18n/navigation';
import type { Locale } from '@/lib/i18n/routing';
import { pickLocalized } from '@/lib/i18n/text';
import type { PriceUnit, Service } from '@/lib/validation/content';
import { cn } from '@/lib/utils';

export type ServiceBadge = 'sameDay' | 'estimate' | 'comingSoon';

type Props = {
  service: Service;
  priceFrom: { amount: number; unit: PriceUnit; exact?: boolean } | null;
  locale: Locale;
  badges?: ServiceBadge[];
  className?: string;
};

/**
 * Catalogue card: a stretched link around the name, badges, summary, price and duration. A
 * service with its own `card` wording (a visit that is booked, DECISIONS №82) ends with the price,
 * a line under it, a booking button and a link to its price table instead of the arrow.
 */
export async function ServiceCard({ service, priceFrom, locale, badges = [], className }: Props) {
  const t = await getTranslations('Services');
  const name = pickLocalized(service.name, locale);
  const short = pickLocalized(service.short, locale);
  const comingSoon = service.status === 'coming_soon';
  const card = service.card;
  const text = (field?: Parameters<typeof pickLocalized>[0]) => {
    const value = field ? pickLocalized(field, locale) : null;
    return value?.text ? value : null;
  };
  const unit = text(card?.unit);
  const note = text(card?.note);
  const cta = text(card?.cta);
  const more = text(card?.link);

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
        {/* A card with the owner's own wording says everything itself: no badges beside it. */}
        {(badges.length > 0 && !card) || comingSoon ? (
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
        <p className="text-body text-pretty text-muted-foreground">
          <LocalizedText value={short} locale={locale} />
        </p>
      </div>

      {card && cta && priceFrom ? (
        <div className="flex flex-col gap-4 border-t border-border pt-4">
          <div className="flex flex-col gap-1">
            <PriceFrom
              amount={priceFrom.amount}
              unit={priceFrom.unit}
              exact={priceFrom.exact}
              unitLabel={unit?.text}
              locale={locale}
            />
            {note ? (
              <span className="text-small text-pretty text-muted-foreground">
                <LocalizedText value={note} locale={locale} />
              </span>
            ) : null}
          </div>
          {/* Above the stretched link: the button books, the link opens the price table. */}
          <div className="relative z-10 flex flex-col items-start gap-2">
            <Button asChild className="w-full">
              <Link href={`/services/${service.slug}#book`} transitionTypes={['nav-forward']}>
                <LocalizedText value={cta} locale={locale} />
                <ArrowRightIcon className="rtl:-scale-x-100" />
              </Link>
            </Button>
            {more ? (
              <Link
                href={`/services/${service.slug}#prices`}
                transitionTypes={['nav-forward']}
                className="inline-flex min-h-tap items-center rounded-sm text-small font-medium text-primary underline underline-offset-4 outline-none hover:no-underline focus-visible:ring-3 focus-visible:ring-ring"
              >
                <LocalizedText value={more} locale={locale} />
              </Link>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex items-end justify-between gap-3 border-t border-border pt-4">
          <div className="flex flex-col gap-1">
            {priceFrom ? (
              <PriceFrom
                amount={priceFrom.amount}
                unit={priceFrom.unit}
                exact={priceFrom.exact}
                locale={locale}
              />
            ) : !comingSoon ? (
              <span className="text-small font-medium text-foreground">
                {service.on_request_label?.[locale] ?? t('onRequest')}
              </span>
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
      )}
    </article>
  );
}
