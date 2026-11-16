import Link from 'next/link';
import { PageHeader, Panel } from '@/components/admin/fields';
import { Ltr } from '@/components/ltr';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { adminI18n, fill, type AdminMessages } from '@/lib/admin/i18n';
import { requireRole } from '@/lib/auth';
import { allPackages, allPriceItems, allServices } from '@/lib/content/queries';
import { getEditableSettings } from '@/lib/content/site';
import { recentChanges } from '@/lib/db/queries/audit';
import { pick } from '@/lib/i18n/text';

const action =
  'rounded-sm text-small font-medium underline underline-offset-4 outline-none hover:no-underline focus-visible:ring-3 focus-visible:ring-ring';

export default async function AdminHome() {
  const user = await requireRole();
  const [{ locale, m }, settings, services, items, packages, log] = await Promise.all([
    adminI18n(),
    getEditableSettings(),
    allServices(),
    allPriceItems(),
    allPackages(),
    recentChanges(10),
  ]);
  const t = m.home;
  const ready = settings.contacts.phone !== '' && settings.contacts.whatsapp !== '';
  const hidden = services.filter((s) => s.status === 'hidden').length;

  // «Цена · Стандартная чистка, 1 блок» instead of a bare key.
  const names = new Map<string, string>([
    ...services.map((s) => [`service:${s.slug}`, pick(s.name, locale)] as const),
    ...items.map((i) => [`price_item:${i.key}`, pick(i.name, locale)] as const),
    ...packages.map((p) => [`package:${p.slug}`, pick(p.name, locale)] as const),
  ]);
  const kinds = m.kinds as AdminMessages['kinds'] & Record<string, string>;
  const when = new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Dubai',
  });

  return (
    <>
      <PageHeader title={t.title} lead={t.lead} />
      <div className="grid gap-5 md:grid-cols-3">
        <Panel title={t.contacts.title}>
          <p className="text-pretty">{ready ? t.contacts.ready : t.contacts.missing}</p>
          {user.role === 'owner' ? (
            <Link href="/admin/settings" className={action}>
              {t.contacts.action}
            </Link>
          ) : null}
        </Panel>
        <Panel title={t.prices.title}>
          <p>{fill(t.prices.text, { items: items.length, packages: packages.length })}</p>
          <Link href="/admin/prices" className={action}>
            {t.prices.action}
          </Link>
        </Panel>
        <Panel title={t.services.title}>
          <p>{fill(t.services.text, { active: services.length - hidden, hidden })}</p>
          <Link href="/admin/services" className={action}>
            {t.services.action}
          </Link>
        </Panel>
      </div>
      <Panel title={t.log.title} className="mt-5">
        {log.length === 0 ? (
          <p className="text-muted-foreground">{t.log.empty}</p>
        ) : (
          <Table label={t.log.title} className="text-small">
            <TableHeader>
              <TableRow>
                <TableHead>{t.log.when}</TableHead>
                <TableHead>{t.log.who}</TableHead>
                <TableHead>{t.log.what}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {log.map((entry) => {
                const name = names.get(`${entry.kind}:${entry.key}`);
                return (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Ltr>{when.format(entry.at)}</Ltr>
                    </TableCell>
                    <TableCell>
                      <Ltr>{entry.userEmail}</Ltr>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      {[kinds[entry.kind] ?? entry.kind, name].filter(Boolean).join(' · ')}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Panel>
    </>
  );
}
