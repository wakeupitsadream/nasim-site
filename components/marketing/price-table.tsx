import { getTranslations } from 'next-intl/server';
import { LocalizedText } from '@/components/localized-text';
import { Ltr } from '@/components/ltr';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatAED } from '@/lib/i18n/format';
import { Link } from '@/lib/i18n/navigation';
import type { Locale } from '@/lib/i18n/routing';
import { pickLocalized, type Localized } from '@/lib/i18n/text';
import type { PriceItem, Service } from '@/lib/validation/content';
import { cn } from '@/lib/utils';

/** A service and its price rows; no rows means the service is priced on request. */
export type PriceGroup = { service: Service; items: PriceItem[] };

/** «Standard clean, 2–3 units» → «2–3 units»: under the service heading the quantity is enough. */
const LAST_SEPARATOR = /[,،，](?=[^,،，]*$)/;
function tierLabel(name: Localized): Localized {
  const at = name.text.search(LAST_SEPARATOR);
  return at === -1 ? name : { ...name, text: name.text.slice(at + 1).trim() };
}

type Props = {
  groups: PriceGroup[];
  locale: Locale;
  /** Visible caption under the table; without one, `captionId` names an outside heading. */
  caption?: string;
  captionId: string;
  /** Link each group heading to its service page (off on the service page itself). */
  linkServices?: boolean;
  /** Show each service's short description under its name. */
  descriptions?: boolean;
  className?: string;
};

/** Two columns always (item + note, price + unit), one body per service: no horizontal scroll. */
export async function PriceTable({
  groups,
  locale,
  caption,
  captionId,
  linkServices = true,
  descriptions = false,
  className,
}: Props) {
  const [t, tPrice, tServices] = await Promise.all([
    getTranslations('Pricing'),
    getTranslations('Price'),
    getTranslations('Services'),
  ]);

  // `className` goes on a wrapper: the Table component puts its className on <table>, which would
  // leave a grid cell sized to the scroll container instead.
  return (
    <div className={cn('min-w-0', className)}>
      <Table labelledBy={captionId} className="text-body">
        {caption ? (
          <TableCaption id={captionId} className="text-start">
            {caption}
          </TableCaption>
        ) : null}
        <TableHeader>
          <TableRow>
            <TableHead>{t('table.item')}</TableHead>
            <TableHead className="text-end">{t('table.price')}</TableHead>
          </TableRow>
        </TableHeader>
        {groups.map(({ service, items }) => {
          const short = descriptions ? pickLocalized(service.short, locale) : null;
          const priceNote = service.price_note ? pickLocalized(service.price_note, locale) : null;
          return (
            <TableBody key={service.slug} className="border-b border-border last:border-0">
              <TableRow className={cn('hover:bg-transparent', short?.text && 'border-0')}>
                <TableHead
                  scope="rowgroup"
                  colSpan={2}
                  className={cn(
                    'h-auto pt-6 text-lead font-medium whitespace-normal text-primary',
                    short?.text ? 'pb-1' : 'pb-2',
                  )}
                >
                  {linkServices ? (
                    <Link
                      href={`/services/${service.slug}`}
                      className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
                    >
                      <LocalizedText value={pickLocalized(service.name, locale)} locale={locale} />
                    </Link>
                  ) : (
                    <LocalizedText value={pickLocalized(service.name, locale)} locale={locale} />
                  )}
                </TableHead>
              </TableRow>
              {/* Its own row, not part of the heading: the heading stays a short header name. */}
              {short?.text ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={2}
                    className="pt-0 pb-3 text-small text-pretty whitespace-normal text-muted-foreground"
                  >
                    <LocalizedText value={short} locale={locale} />
                  </TableCell>
                </TableRow>
              ) : null}
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-end font-medium text-foreground">
                    {service.on_request_label?.[locale] ?? tServices('onRequest')}
                  </TableCell>
                </TableRow>
              ) : null}
              {items.map((item) => {
                const note = pickLocalized(item.note, locale);
                const name = pickLocalized(item.name, locale);
                return (
                  <TableRow key={item.key}>
                    <TableCell className="whitespace-normal">
                      <span className="block text-foreground">
                        <LocalizedText
                          value={item.tier_group ? tierLabel(name) : name}
                          locale={locale}
                        />
                      </span>
                      {note.text ? (
                        <span className="block text-small text-muted-foreground">
                          <LocalizedText value={note} locale={locale} />
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-end align-top">
                      {item.on_request ? (
                        <span className="font-medium text-foreground">
                          {tServices('onRequest')}
                        </span>
                      ) : (
                        <span className="flex flex-col items-end gap-0.5">
                          {/* An estimate starts "from": «from AED 249» over «+ estimate». */}
                          {item.unit === 'from' ? (
                            <span className="text-muted-foreground">
                              {tPrice.rich('from', {
                                amount: formatAED(item.price, locale),
                                price: (chunks) => (
                                  <Ltr className="font-medium text-foreground tabular-nums">
                                    {chunks}
                                  </Ltr>
                                ),
                              })}
                            </span>
                          ) : (
                            <Ltr className="font-medium text-foreground tabular-nums">
                              {formatAED(item.price, locale)}
                            </Ltr>
                          )}
                          <span className="text-small text-muted-foreground">
                            {tPrice(`per.${item.unit}`)}
                          </span>
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {priceNote?.text ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={2}
                    className="pt-3 text-small text-pretty whitespace-normal text-muted-foreground"
                  >
                    <LocalizedText value={priceNote} locale={locale} />
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          );
        })}
      </Table>
    </div>
  );
}
