import { redirect } from 'next/navigation';
import { signIn, switchLanguage } from '@/app/admin/actions';
import { LoginForm } from '@/components/admin/login-form';
import { adminI18n } from '@/lib/admin/i18n';
import { currentUser } from '@/lib/auth';

export default async function LoginPage() {
  if (await currentUser()) redirect('/admin');
  const { locale, m } = await adminI18n();
  return (
    <main lang={locale} className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm rounded-card border border-border bg-card p-6 shadow-card">
        <h1 className="mb-6 font-sans text-h3 font-semibold tracking-normal">{m.login.title}</h1>
        <LoginForm
          action={signIn}
          labels={{
            email: m.login.email,
            password: m.login.password,
            submit: m.login.submit,
            pending: m.login.pending,
          }}
        />
        <form action={switchLanguage} className="mt-4 text-center">
          <input type="hidden" name="locale" value={locale === 'ru' ? 'en' : 'ru'} />
          <button
            type="submit"
            className="rounded-sm text-small text-muted-foreground underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring"
          >
            {m.app.switchLanguage}
          </button>
        </form>
      </div>
    </main>
  );
}
