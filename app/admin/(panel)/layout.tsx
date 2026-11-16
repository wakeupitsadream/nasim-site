import { LayoutDashboard, ListChecks, Settings, Tags } from 'lucide-react';
import type { ReactNode } from 'react';
import { AccountActions } from '@/components/admin/account-actions';
import { AdminBrand } from '@/components/admin/admin-brand';
import { AdminNav, type NavItem } from '@/components/admin/admin-nav';
import { Ltr } from '@/components/ltr';
import { adminI18n } from '@/lib/admin/i18n';
import { requireRole } from '@/lib/auth';

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const user = await requireRole();
  const { locale, m } = await adminI18n();
  const nav: NavItem[] = [
    { href: '/admin', label: m.app.nav.home, icon: <LayoutDashboard aria-hidden="true" /> },
    { href: '/admin/prices', label: m.app.nav.prices, icon: <Tags aria-hidden="true" /> },
    { href: '/admin/services', label: m.app.nav.services, icon: <ListChecks aria-hidden="true" /> },
    // Contacts, legal details and VAT are the owner's (BRIEF §10).
    ...(user.role === 'owner'
      ? [
          {
            href: '/admin/settings',
            label: m.app.nav.settings,
            icon: <Settings aria-hidden="true" />,
          },
        ]
      : []),
  ];
  return (
    <div lang={locale} className="min-h-dvh lg:ps-64">
      {/* Desktop: the graphite sidebar. */}
      <aside className="tone-deep fixed inset-y-0 inset-s-0 z-30 hidden w-64 flex-col lg:flex">
        <div className="px-6 pt-7 pb-6">
          <AdminBrand label={m.app.adminLabel} title={m.app.title} onDark />
        </div>
        <AdminNav variant="side" items={nav} label={m.app.menu} className="px-3" />
        <div className="mt-auto grid gap-3 border-t border-border p-3">
          <p className="grid gap-0.5 px-3 pt-1">
            <span className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {m.app.roles[user.role]}
            </span>
            <Ltr className="truncate text-small font-medium">{user.email}</Ltr>
          </p>
          <AccountActions locale={locale} m={m} />
        </div>
      </aside>

      {/* Phone and tablet: a slim header, the sections are tabs at the bottom. */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-card/95 px-4 backdrop-blur lg:hidden">
        <AdminBrand label={m.app.adminLabel} title={m.app.title} />
        <AccountActions locale={locale} m={m} compact />
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-6 pb-28 lg:px-10 lg:pt-10 lg:pb-16">
        {children}
      </main>

      <AdminNav
        variant="tabs"
        items={nav}
        label={m.app.menu}
        className="fixed inset-x-0 bottom-0 z-30 lg:hidden"
      />
    </div>
  );
}
