import { Languages } from 'lucide-react';
import { redirect } from 'next/navigation';
import { signIn, switchLanguage } from '@/app/admin/actions';
import { AdminBrand } from '@/components/admin/admin-brand';
import { LoginForm } from '@/components/admin/login-form';
import { Ltr } from '@/components/ltr';
import { SpeedLines } from '@/components/marketing/speed-lines';
import { adminI18n } from '@/lib/admin/i18n';
import { currentUser } from '@/lib/auth';
import { siteUrl } from '@/lib/seo';

export default async function LoginPage() {
  if (await currentUser()) redirect('/admin');
  const { locale, m } = await adminI18n();
  const host = siteUrl().host;
  return (
    <main lang={locale} className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* The graphite half: the lock-up and one line about what this place is for. */}
      <div className="tone-deep relative flex flex-col justify-between gap-10 overflow-clip px-6 py-8 lg:px-12 lg:py-12">
        <AdminBrand label={m.app.adminLabel} title={m.app.title} onDark />
        <div className="grid gap-7 max-lg:hidden">
          <SpeedLines className="h-7 w-56 text-brand" />
          <p className="max-w-md font-wordmark text-h2 leading-tight font-bold tracking-tight text-balance">
            {m.login.lead}
          </p>
        </div>
        <p className="text-small text-muted-foreground max-lg:hidden">
          <Ltr>{host}</Ltr>
        </p>
      </div>
      <div className="flex flex-col items-center justify-center px-4 py-10 max-lg:justify-start">
        <div className="w-full max-w-sm">
          <h1 className="font-wordmark text-h3 font-bold tracking-tight">{m.login.title}</h1>
          <p className="mt-2 mb-7 text-pretty text-muted-foreground lg:hidden">{m.login.lead}</p>
          <div className="mt-6 rounded-card border border-border bg-card p-6 shadow-card">
            <LoginForm
              action={signIn}
              labels={{
                email: m.login.email,
                password: m.login.password,
                submit: m.login.submit,
                pending: m.login.pending,
              }}
            />
          </div>
          <form action={switchLanguage} className="mt-5 flex justify-center">
            <input type="hidden" name="locale" value={locale === 'ru' ? 'en' : 'ru'} />
            <button
              type="submit"
              className="flex min-h-10 items-center gap-2 rounded-lg px-3 text-small font-medium text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring"
            >
              <Languages aria-hidden="true" className="size-4.5" />
              {m.app.switchLanguage}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
