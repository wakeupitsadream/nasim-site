import Link from 'next/link';
import { PageHeader } from '@/components/admin/fields';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { adminI18n } from '@/lib/admin/i18n';
import { sectionLabel } from '@/lib/admin/sections';
import { requireRole } from '@/lib/auth';
import { allServices } from '@/lib/content/queries';
import { pick } from '@/lib/i18n/text';
import { cn } from '@/lib/utils';

const TONE = {
  active: 'bg-success-soft text-success-ink',
  coming_soon: 'bg-warning-soft text-warning-ink',
  hidden: 'bg-muted text-muted-foreground',
} as const;

export default async function ServicesPage() {
  await requireRole();
  const [{ locale, m }, services] = await Promise.all([adminI18n(), allServices()]);
  const t = m.services;
  return (
    <>
      <PageHeader title={t.title} lead={t.lead} />
      <div className="rounded-card border border-border bg-card p-2 shadow-card">
        <Table label={t.title} className="text-body">
          <TableHeader>
            <TableRow>
              <TableHead>{t.name}</TableHead>
              <TableHead>{t.section}</TableHead>
              <TableHead>{t.status}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.slug}>
                <TableCell className="whitespace-normal">
                  <Link
                    href={`/admin/services/${service.slug}`}
                    className="rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
                  >
                    {pick(service.name, locale)}
                  </Link>
                </TableCell>
                <TableCell className="text-small whitespace-normal text-muted-foreground">
                  {sectionLabel(m, service)}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'inline-block rounded-full px-2.5 py-1 text-small font-medium',
                      TONE[service.status],
                    )}
                  >
                    {t.statuses[service.status]}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
