import { ExternalLink, Languages, LogOut } from 'lucide-react';
import { signOut, switchLanguage } from '@/app/admin/actions';
import type { AdminLocale, AdminMessages } from '@/lib/admin/i18n';
import { cn } from '@/lib/utils';

type Props = {
  locale: AdminLocale;
  m: AdminMessages;
  /** Icons only (the phone header); the labels stay as accessible names. */
  compact?: boolean;
};

/** Open the site, switch the admin's language, sign out. */
export function AccountActions({ locale, m, compact = false }: Props) {
  const item = cn(
    'flex items-center gap-3 rounded-lg text-small font-medium text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring [&_svg]:size-4.5 [&_svg]:shrink-0',
    compact ? 'size-10 justify-center' : 'min-h-10 w-full px-3',
  );
  const text = (label: string) => (compact ? <span className="sr-only">{label}</span> : label);
  return (
    <div className={compact ? 'flex items-center gap-1' : 'grid gap-0.5'}>
      <a href={`/${locale}`} target="_blank" rel="noopener" className={item}>
        <ExternalLink aria-hidden="true" />
        {text(m.app.viewSite)}
      </a>
      <form action={switchLanguage}>
        <input type="hidden" name="locale" value={locale === 'ru' ? 'en' : 'ru'} />
        <button type="submit" data-action="language" className={item}>
          <Languages aria-hidden="true" />
          {text(m.app.switchLanguage)}
        </button>
      </form>
      <form action={signOut}>
        <button type="submit" data-action="sign-out" className={item}>
          <LogOut aria-hidden="true" />
          {text(m.app.signOut)}
        </button>
      </form>
    </div>
  );
}
