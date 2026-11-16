import type { ReactNode } from 'react';
import { signOut, switchLanguage } from '@/app/admin/actions';
import { AdminNav } from '@/components/admin/admin-nav';
import { Ltr } from '@/components/ltr';
import { adminI18n } from '@/lib/admin/i18n';
import { requireRole } from '@/lib/auth';

const quiet =
  'rounded-sm text-small text-muted-foreground underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring';

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const user = await requireRole();
  const { locale, m } = await adminI18n();
  const nav = [
    { href: '/admin', label: m.app.nav.home },
    { href: '/admin/prices', label: m.app.nav.prices },
    { href: '/admin/services', label: m.app.nav.services },
    // Contacts, legal details and VAT are the owner's (BRIEF §10).
    ...(user.role === 'owner' ? [{ href: '/admin/settings', label: m.app.nav.settings }] : []),
  ];
  const [before, after] = m.app.signedInAs.split('{email}');
  return (
    <div lang={locale} className="min-h-dvh">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <p className="font-wordmark text-logo font-bold">{m.app.title}</p>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-x-4 gap-y-1 text-small text-muted-foreground">
            <span>
              {before}
              <Ltr>{user.email}</Ltr>
              {after}
            </span>
            <a href={`/${locale}`} target="_blank" rel="noopener" className={quiet}>
              {m.app.viewSite}
            </a>
            <form action={switchLanguage}>
              <input type="hidden" name="locale" value={locale === 'ru' ? 'en' : 'ru'} />
              <button type="submit" className={quiet}>
                {m.app.switchLanguage}
              </button>
            </form>
            <form action={signOut}>
              <button type="submit" className={quiet}>
                {m.app.signOut}
              </button>
            </form>
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-4 pb-3">
          <AdminNav items={nav} label={m.app.title} />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
