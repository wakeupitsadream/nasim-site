import { LocalizedText } from '@/components/localized-text';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/lib/i18n/navigation';
import type { Locale } from '@/lib/i18n/routing';
import { pickLocalized } from '@/lib/i18n/text';
import type { Area } from '@/lib/validation/content';
import { stagger } from '@/lib/motion';
import { cn } from '@/lib/utils';

type Props = {
  areas: Area[];
  locale: Locale;
  all?: { label: string };
  className?: string;
  label: string;
};

/** Tappable area pills (published areas only) plus an optional "All areas" link. */
export function AreaChips({ areas, locale, all, className, label }: Props) {
  return (
    <ul aria-label={label} className={cn('flex flex-wrap gap-2', className)}>
      {areas.map((area, i) => (
        <li key={area.slug} className="reveal-fade" style={stagger(Math.min(i, 6))}>
          <Badge variant="chip" asChild>
            <Link href={`/areas/${area.slug}`}>
              <LocalizedText value={pickLocalized(area.name, locale)} locale={locale} />
            </Link>
          </Badge>
        </li>
      ))}
      {all ? (
        <li className="reveal-fade" style={stagger(6)}>
          <Badge variant="chip" asChild className="bg-transparent ring-1 ring-line-strong">
            <Link href="/areas">{all.label}</Link>
          </Badge>
        </li>
      ) : null}
    </ul>
  );
}
