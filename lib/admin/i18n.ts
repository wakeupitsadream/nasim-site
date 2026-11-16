// The admin speaks Russian and English only (cookie `admin_locale`, Russian by default). Its
// strings live in messages/admin/*.json, apart from the site's seven locales; server components
// read the dictionary and hand plain strings to the few client components.
import { cookies } from 'next/headers';
import en from '@/messages/admin/en.json';
import ru from '@/messages/admin/ru.json';

export type AdminMessages = typeof ru;
export const ADMIN_LOCALES = ['ru', 'en'] as const;
export type AdminLocale = (typeof ADMIN_LOCALES)[number];
export const ADMIN_LOCALE_COOKIE = 'admin_locale';

export const dictionary = (locale: AdminLocale): AdminMessages => (locale === 'en' ? en : ru);

/** `{name}` placeholders; a missing variable is left as it is, so the gap is visible. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in vars ? String(vars[key]) : whole,
  );
}

export async function adminLocale(): Promise<AdminLocale> {
  return (await cookies()).get(ADMIN_LOCALE_COOKIE)?.value === 'en' ? 'en' : 'ru';
}

export async function adminI18n(): Promise<{ locale: AdminLocale; m: AdminMessages }> {
  const locale = await adminLocale();
  return { locale, m: dictionary(locale) };
}
