// Password hashing for /admin. scrypt from node:crypto: no native dependency to build on Vercel
// (DECISIONS №68). No imports besides node:crypto and no TypeScript-only syntax, so
// scripts/admin-user.mjs can load this file directly with Node's type stripping.
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const N = 16384;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;

function derive(password: string, salt: Buffer, n: number, r: number, p: number, length: number) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password.normalize('NFKC'), salt, length, { N: n, r, p }, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

/** `scrypt$N$r$p$salt$hash`, salt and hash in base64url. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, N, R, P, KEY_LENGTH);
  return ['scrypt', N, R, P, salt.toString('base64url'), key.toString('base64url')].join('$');
}

/** Constant-time check; false for a malformed hash. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !n || !r || !p || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64url');
  const cost = [Number(n), Number(r), Number(p)];
  if (cost.some((x) => !Number.isInteger(x) || x <= 0) || expected.length === 0) return false;
  try {
    const key = await derive(
      password,
      Buffer.from(salt, 'base64url'),
      cost[0]!,
      cost[1]!,
      cost[2]!,
      expected.length,
    );
    return timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}

/** At least 10 characters: the admin can change every price on the site. */
export const MIN_PASSWORD_LENGTH = 10;
