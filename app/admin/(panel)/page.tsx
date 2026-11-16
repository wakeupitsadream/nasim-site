import {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  ListChecks,
  Package,
  Settings,
  Tags,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { PageHeader, Panel } from '@/components/admin/fields';
import { Ltr } from '@/components/ltr';
import { describeChange } from '@/lib/admin/changes';
import { adminI18n, fill } from '@/lib/admin/i18n';
import { requireRole } from '@/lib/auth';
import { allPackages, allPriceItems, allServices } from '@/lib/content/queries';
import { seedPackages, seedPriceItems, seedServices } from '@/lib/content/seed';
import { getEditableSettings } from '@/lib/content/site';
import { recentChanges } from '@/lib/db/queries/audit';
import { pick } from '@/lib/i18n/text';

const KIND_ICON: Record<string, ReactNode> = {
  settings: <Settings aria-hidden="true" />,
  service: <ListChecks aria-hidden="true" />,
  price_item: <Tags aria-hidden="true" />,
  package: <Package aria-hidden="true" />,
};

function Stat({
  href,
  icon,
  value,
  label,
  note,
}: {
  href: string;
  icon: ReactNode;
  value: number;
  label: string;
  note?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-card border border-border bg-card p-5 shadow-card transition-shadow outline-none hover:shadow-lift focus-visible:ring-3 focus-visible:ring-ring"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-surface-2 [&_svg]:size-5.5">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-wordmark text-h2 leading-none font-bold tabular-nums">
          {value}
        </span>
        <span className="mt-1.5 block text-small text-muted-foreground">{label}</span>
        {note ? <span className="block text-xs text-muted-foreground">{note}</span> : null}
      </span>
      <ArrowRight
        aria-hidden="true"
        className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
      />
    </Link>
  );
}

export default async function AdminHome() {
  const user = await requireRole();
  const [{ locale, m }, settings, services, items, packages, log] = await Promise.all([
    adminI18n(),
    getEditableSettings(),
    allServices(),
    allPriceItems(),
    allPackages(),
    recentChanges(12),
  ]);
  const t = m.home;
  const ready = settings.contacts.phone !== '' && settings.contacts.whatsapp !== '';
  const hidden = services.filter((s) => s.status === 'hidden').length;

  // «Цена · Стандартная чистка, 1 блок» instead of a bare key, and the seed value a first edit
  // is compared with.
  const names = new Map<string, string>([
    ...services.map((s) => [`service:${s.slug}`, pick(s.name, locale)] as const),
    ...items.map((i) => [`price_item:${i.key}`, pick(i.name, locale)] as const),
    ...packages.map((p) => [`package:${p.slug}`, pick(p.name, locale)] as const),
  ]);
  const seeds = new Map<string, Record<string, unknown>>([
    ...seedServices().map((s) => [`service:${s.slug}`, s] as const),
    ...seedPriceItems().map((i) => [`price_item:${i.key}`, i] as const),
    ...seedPackages().map((p) => [`package:${p.slug}`, p] as const),
  ]);
  const kinds = m.kinds as Record<string, string>;
  const when = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Dubai',
  });

  return (
    <>
      <PageHeader title={t.title} lead={t.lead} />

      <div
        className={`mb-5 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-card border p-4 ps-5 ${
          ready
            ? 'border-transparent bg-success-soft text-success-ink'
            : 'border-transparent bg-warning-soft text-warning-ink'
        }`}
      >
        {ready ? (
          <CircleCheck aria-hidden="true" className="size-5.5 shrink-0" />
        ) : (
          <CircleAlert aria-hidden="true" className="size-5.5 shrink-0" />
        )}
        <p className="min-w-0 flex-1 basis-64 font-medium text-pretty">
          {ready ? t.contacts.ready : t.contacts.missing}
        </p>
        {user.role === 'owner' && !ready ? (
          <Link
            href="/admin/settings"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-small font-medium text-primary-foreground outline-none hover:bg-primary-hover focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {t.contacts.action}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat
          href="/admin/prices"
          icon={<Tags aria-hidden="true" />}
          value={items.length}
          label={t.stats.items}
        />
        <Stat
          href="/admin/prices#packages"
          icon={<Package aria-hidden="true" />}
          value={packages.length}
          label={t.stats.packages}
        />
        <Stat
          href="/admin/services"
          icon={<ListChecks aria-hidden="true" />}
          value={services.length - hidden}
          label={t.stats.active}
          note={hidden > 0 ? fill(t.stats.hidden, { n: hidden }) : undefined}
        />
      </div>

      <Panel title={t.log.title} className="mt-5">
        {log.length === 0 ? (
          <p className="text-muted-foreground">{t.log.empty}</p>
        ) : (
          <ol className="grid">
            {log.map((entry) => {
              const id = `${entry.kind}:${entry.key}`;
              const detail = describeChange(m, entry, (field) => seeds.get(id)?.[field]);
              return (
                <li
                  key={entry.id}
                  className="flex items-start gap-3 border-t border-border py-3 first:border-0 first:pt-0 last:pb-0"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-2 [&_svg]:size-4.5">
                    {KIND_ICON[entry.kind]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-pretty">
                      {names.get(id) ?? kinds[entry.kind] ?? entry.kind}
                    </p>
                    <p className="text-small text-pretty text-muted-foreground">
                      {[names.has(id) ? kinds[entry.kind] : '', detail].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <p className="shrink-0 text-end text-small text-muted-foreground">
                    <Ltr className="block tabular-nums">{when.format(entry.at)}</Ltr>
                    <Ltr className="block max-w-40 truncate max-sm:hidden">{entry.userEmail}</Ltr>
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </Panel>
    </>
  );
}
