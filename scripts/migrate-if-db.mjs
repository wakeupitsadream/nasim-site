/**
 * Apply drizzle migrations before `next build` when a database URL is present (Vercel builds,
 * where the Neon integration injects it). Local and CI builds without a database skip with a
 * warning. drizzle's journal makes reruns no-ops. Same pattern as daylik's apps/web build.
 */
import { execFileSync } from 'node:child_process';

if (!process.env.DATABASE_URL_UNPOOLED && !process.env.DATABASE_URL) {
  console.warn('[migrate] WARNING: DATABASE_URL is not set — skipping migrations, build continues');
  process.exit(0);
}

console.log('[migrate] applying drizzle migrations');
execFileSync('pnpm', ['exec', 'drizzle-kit', 'migrate'], { stdio: 'inherit' });
console.log('[migrate] done');
