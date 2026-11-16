// The admin session: a signed token in an httpOnly cookie. Pure functions (no next/* imports),
// unit-tested; reading the cookie and checking the user lives in lib/auth/index.ts.
import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'brigada_admin';
/** Seven days, as BRIEF §10 asks. */
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export type Role = 'owner' | 'staff';
export type SessionPayload = { uid: string; email: string; role: Role; exp: number };

const sign = (body: string, secret: string) =>
  createHmac('sha256', secret).update(body).digest('base64url');

/** `payload.signature`; `nowSeconds` is passed in so that tests control the clock. */
export function createSessionToken(
  user: { uid: string; email: string; role: Role },
  secret: string,
  nowSeconds: number,
): string {
  const payload: SessionPayload = { ...user, exp: nowSeconds + SESSION_TTL_SECONDS };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body, secret)}`;
}

/** The payload of a valid, unexpired token; null otherwise. Never throws. */
export function readSessionToken(
  token: string | undefined,
  secret: string,
  nowSeconds: number,
): SessionPayload | null {
  if (!token || !secret) return null;
  const [body, signature, extra] = token.split('.');
  if (!body || !signature || extra !== undefined) return null;
  const expected = Buffer.from(sign(body, secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (typeof p.uid !== 'string' || typeof p.email !== 'string') return null;
    if (p.role !== 'owner' && p.role !== 'staff') return null;
    if (typeof p.exp !== 'number' || p.exp <= nowSeconds) return null;
    return p;
  } catch {
    return null;
  }
}

/** Minimum length for AUTH_SECRET: a short secret makes the signature guessable. */
export const MIN_SECRET_LENGTH = 32;
export const authSecret = (): string | null => {
  const secret = process.env.AUTH_SECRET?.trim() ?? '';
  return secret.length >= MIN_SECRET_LENGTH ? secret : null;
};
