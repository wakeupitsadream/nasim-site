'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_LOCALE_COOKIE, adminI18n } from '@/lib/admin/i18n';
import type { FormState } from '@/lib/admin/form-state';
import { authConfigured, endSession, startSession, verifyCredentials } from '@/lib/auth';
import { allow, clientIp, hashIp } from '@/lib/ratelimit';
import { adminLocaleSchema, loginSchema } from '@/lib/validation/admin';

const WINDOW = { limit: 5, windowMs: 15 * 60 * 1000 };

export async function signIn(prev: FormState, data: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: data.get('email'),
    password: data.get('password'),
  });
  const { m } = await adminI18n();
  const fail = (message: string): FormState => ({ ...prev, status: 'error', message, fields: [] });
  if (!authConfigured()) return fail(m.login.notConfigured);
  if (!parsed.success) return fail(m.login.invalid);

  // Per address and per account; the keys are salted hashes, never the raw value (rule 7).
  const ip = hashIp(clientIp(await headers()));
  const account = hashIp(parsed.data.email);
  const allowed = [
    allow(`login:ip:${ip}`, { ...WINDOW, limit: 20 }),
    allow(`login:${account}`, WINDOW),
  ];
  if (allowed.includes(false)) return fail(m.login.tooMany);

  const user = await verifyCredentials(parsed.data.email, parsed.data.password);
  if (!user) return fail(m.login.invalid);
  await startSession(user);
  redirect('/admin');
}

export async function signOut(): Promise<void> {
  await endSession();
  redirect('/admin/login');
}

export async function switchLanguage(data: FormData): Promise<void> {
  const locale = adminLocaleSchema.safeParse(data.get('locale'));
  if (!locale.success) return;
  (await cookies()).set(ADMIN_LOCALE_COOKIE, locale.data, {
    path: '/admin',
    maxAge: 365 * 24 * 60 * 60,
    sameSite: 'lax',
  });
}
