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
import { pickLocalized } from '@/lib/i18n/text';
import type { PriceItem, Service } from '@/lib/validation/content';
import { cn } from '@/lib/utils';

export type PriceGroup = { service: Service; items: PriceItem[] };

type Props = {
  groups: PriceGroup[];
  locale: Locale;
  caption: string;
  captionId: string;
  /** Link each group heading to its service page (off on the service page itself). */
  linkServices?: boolean;
  className?: string;
};

/** Two columns always (item + note, price + unit), one body per service: no horizontal scroll. */
export async function PriceTable({
  groups,
  locale,
  caption,
  captionId,
  linkServices = true,
  className,
}: Props) {
  const [t, tPrice] = await Promise.all([getTranslations('Pricing'), getTranslations('Price')]);

  // `className` goes on a wrapper: the Table component puts its className on <table>, which would
  // leave a grid cell sized to the scroll container instead.
  return (
    <div className={cn('min-w-0', className)}>
      <Table labelledBy={captionId} className="text-body">
        <TableCaption id={captionId} className="text-start">
          {caption}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>{t('table.item')}</TableHead>
            <TableHead className="text-end">{t('table.price')}</TableHead>
          </TableRow>
        </TableHeader>
        {groups.map(({ service, items }) => (
          <TableBody key={service.slug} className="border-b border-border last:border-0">
            <TableRow className="hover:bg-transparent">
              <TableHead
                scope="rowgroup"
                colSpan={2}
                className="h-auto pt-6 pb-2 text-lead font-medium whitespace-normal text-primary"
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
            {items.map((item) => {
              const note = pickLocalized(item.note, locale);
              return (
                <TableRow key={item.key}>
                  <TableCell className="whitespace-normal">
                    <span className="block text-foreground">
                      <LocalizedText value={pickLocalized(item.name, locale)} locale={locale} />
                    </span>
                    {note.text ? (
                      <span className="block text-small text-muted-foreground">
                        <LocalizedText value={note} locale={locale} />
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-end align-top">
                    <span className="flex flex-col items-end gap-0.5">
                      <Ltr className="font-medium text-foreground tabular-nums">
                        {formatAED(item.price, locale)}
                      </Ltr>
                      <span className="text-small text-muted-foreground">
                        {tPrice(`per.${item.unit}`)}
                      </span>
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        ))}
      </Table>
    </div>
  );
}
