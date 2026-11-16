/**
 * Create or update a person who may sign in to /admin.
 *
 *   pnpm admin:user owner@example.com                 → creates the owner, prints a one-time password
 *   pnpm admin:user owner@example.com 'new password'  → sets that password
 *   pnpm admin:user staff@example.com --role staff
 *   node scripts/admin-user.mjs --bootstrap            → build step: with ADMIN_EMAIL and
 *     ADMIN_PASSWORD set and no users yet, creates the first owner; otherwise does nothing.
 *
 * Needs DATABASE_URL_UNPOOLED or DATABASE_URL (from the environment or .env.local).
 */
import { randomBytes } from 'node:crypto';
import pg from 'pg';

for (const file of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(file);
  } catch {
    // file is absent: rely on the process environment
  }
}

const args = process.argv.slice(2);
const bootstrap = args.includes('--bootstrap');
const roleAt = args.indexOf('--role');
const role = roleAt === -1 ? 'owner' : args[roleAt + 1];
const positional = args.filter(
  (a, i) => !a.startsWith('--') && (roleAt === -1 || i !== roleAt + 1),
);

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  if (bootstrap) process.exit(0);
  console.error('[admin] DATABASE_URL is not set');
  process.exit(1);
}

let email = positional[0];
let password = positional[1];
if (bootstrap) {
  email = process.env.ADMIN_EMAIL;
  password = process.env.ADMIN_PASSWORD;
  if (!email || !password) process.exit(0);
}
if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error('[admin] usage: pnpm admin:user <email> [password] [--role owner|staff]');
  process.exit(1);
}
if (role !== 'owner' && role !== 'staff') {
  console.error('[admin] --role must be owner or staff');
  process.exit(1);
}

// The same hashing code the app verifies with (Node strips the types).
const { hashPassword, MIN_PASSWORD_LENGTH } = await import('../lib/auth/password.ts');
const generated = !password;
if (generated) password = randomBytes(12).toString('base64url');
if (password.length < MIN_PASSWORD_LENGTH) {
  console.error(`[admin] the password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  if (bootstrap) {
    const { rows } = await client.query('select count(*)::int as n from admin_users');
    if (rows[0].n > 0) {
      console.log('[admin] users exist — bootstrap skipped');
      process.exit(0);
    }
  }
  const hash = await hashPassword(password);
  await client.query(
    `insert into admin_users (email, password_hash, role) values ($1, $2, $3)
     on conflict (email) do update set password_hash = excluded.password_hash, role = excluded.role, active = true`,
    [email.toLowerCase(), hash, role],
  );
  // The address is the operator's own input; a generated password is shown once, here only.
  console.log(`[admin] ${role} saved`);
  if (generated) console.log(`[admin] one-time password: ${password}`);
} finally {
  await client.end();
}
