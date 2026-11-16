// Server-only: who is signed in to /admin. Every server action and admin page calls
// `requireRole` (CLAUDE.md rule 8); proxy.ts only does the optimistic cookie check.
import { eq, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { getDb } from '@/lib/db/client';
import { hasDatabase } from '@/lib/db/queries/overrides';
import { adminUsers } from '@/lib/db/schema';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import {
  authSecret,
  createSessionToken,
  readSessionToken,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  type Role,
} from '@/lib/auth/session';

export type AdminUser = { id: string; email: string; role: Role };

/** Seconds since the epoch. Called from request handlers only, never while prerendering. */
const nowSeconds = () => Math.floor(new Date().getTime() / 1000);

/** True when sign-in can work at all: a database and a long enough AUTH_SECRET. */
export const authConfigured = (): boolean => hasDatabase() && authSecret() !== null;

/**
 * The signed-in, still active user, or null. The token alone is not trusted: the user row is
 * read on every call, so deactivating a user or changing a role takes effect at once.
 */
export async function currentUser(): Promise<AdminUser | null> {
  const secret = authSecret();
  if (!secret || !hasDatabase()) return null;
  // A session is checked against the clock and the database: only for a real request, never
  // for a prefetch that renders ahead of time.
  await connection();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = readSessionToken(token, secret, nowSeconds());
  if (!session) return null;
  const [row] = await getDb()
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      role: adminUsers.role,
      active: adminUsers.active,
    })
    .from(adminUsers)
    .where(eq(adminUsers.id, session.uid));
  if (!row || !row.active) return null;
  return { id: row.id, email: row.email, role: row.role };
}

/** For pages and server actions: redirects to the sign-in page when nobody is signed in. */
export async function requireRole(role?: Role): Promise<AdminUser> {
  const user = await currentUser();
  if (!user) redirect('/admin/login');
  if (role === 'owner' && user.role !== 'owner') redirect('/admin');
  return user;
}

let decoy: Promise<string> | undefined;

/**
 * The active user with this email and password, or null. An unknown email still costs one
 * scrypt check (against a throwaway hash), so the answer time does not reveal who has an account.
 */
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<AdminUser | null> {
  const [row] = await getDb()
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email.trim().toLowerCase()));
  decoy ??= hashPassword('no-such-user');
  const valid = await verifyPassword(password, row?.passwordHash ?? (await decoy));
  if (!row || !row.active || !valid) return null;
  await getDb()
    .update(adminUsers)
    .set({ lastLoginAt: sql`now()` })
    .where(eq(adminUsers.id, row.id));
  return { id: row.id, email: row.email, role: row.role };
}

export async function startSession(user: AdminUser): Promise<void> {
  const secret = authSecret();
  if (!secret) throw new Error('AUTH_SECRET is not set');
  const token = createSessionToken(
    { uid: user.id, email: user.email, role: user.role },
    secret,
    nowSeconds(),
  );
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
