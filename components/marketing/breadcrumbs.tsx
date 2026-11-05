import { getTranslations } from 'next-intl/server';
import { Fragment } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Link } from '@/lib/i18n/navigation';

export type Crumb = { label: string; href?: string };

/** Home › … › current page. BreadcrumbList JSON-LD is added in phase 3 together with the SEO layer. */
export async function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  const [t, tNav] = await Promise.all([getTranslations('Common'), getTranslations('Nav')]);
  const trail: Crumb[] = [{ label: tNav('home'), href: '/' }, ...items];

  return (
    <Breadcrumb label={t('breadcrumbLabel')} className={className}>
      <BreadcrumbList>
        {trail.map((crumb, index) => {
          const last = index === trail.length - 1;
          return (
            <Fragment key={`${crumb.href ?? ''}-${crumb.label}`}>
              <BreadcrumbItem>
                {last || !crumb.href ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href} transitionTypes={['nav-back']}>
                      {crumb.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {last ? null : <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
