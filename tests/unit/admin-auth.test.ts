import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { createSessionToken, readSessionToken, SESSION_TTL_SECONDS } from '@/lib/auth/session';

const SECRET = 'a-test-secret-that-is-long-enough-123456';
const USER = { uid: 'u1', email: 'owner@example.test', role: 'owner' as const };
const NOW = 1_800_000_000;

describe('admin passwords', () => {
  it('verifies the right password and nothing else', async () => {
    const hash = await hashPassword('correct horse battery');
    expect(hash.startsWith('scrypt$')).toBe(true);
    expect(await verifyPassword('correct horse battery', hash)).toBe(true);
    expect(await verifyPassword('correct horse batterx', hash)).toBe(false);
    expect(await verifyPassword('', hash)).toBe(false);
  });

  it('salts every hash', async () => {
    expect(await hashPassword('same password')).not.toBe(await hashPassword('same password'));
  });

  it('rejects malformed hashes without throwing', async () => {
    for (const stored of ['', 'plain', 'scrypt$0$8$1$c2FsdA$aGFzaA', 'bcrypt$1$2$3$4$5'])
      expect(await verifyPassword('x', stored)).toBe(false);
  });
});

describe('admin session token', () => {
  it('round-trips the user until it expires', () => {
    const token = createSessionToken(USER, SECRET, NOW);
    expect(readSessionToken(token, SECRET, NOW + 60)).toMatchObject(USER);
    expect(readSessionToken(token, SECRET, NOW + SESSION_TTL_SECONDS - 1)).not.toBeNull();
    expect(readSessionToken(token, SECRET, NOW + SESSION_TTL_SECONDS)).toBeNull();
  });

  it('rejects a token signed with another secret or edited by hand', () => {
    const token = createSessionToken(USER, SECRET, NOW);
    expect(readSessionToken(token, `${SECRET}x`, NOW)).toBeNull();
    const [body, signature] = token.split('.') as [string, string];
    const forged = Buffer.from(
      JSON.stringify({ ...USER, role: 'owner', uid: 'someone-else', exp: NOW + 999 }),
    ).toString('base64url');
    expect(readSessionToken(`${forged}.${signature}`, SECRET, NOW)).toBeNull();
    expect(readSessionToken(`${body}.${signature}.extra`, SECRET, NOW)).toBeNull();
    expect(readSessionToken(body, SECRET, NOW)).toBeNull();
    expect(readSessionToken(undefined, SECRET, NOW)).toBeNull();
    expect(readSessionToken(token, '', NOW)).toBeNull();
  });
});
