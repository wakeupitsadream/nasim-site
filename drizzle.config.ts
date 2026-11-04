import { defineConfig } from 'drizzle-kit';

// drizzle-kit runs standalone (pnpm db:*), where Next has not loaded env files.
for (const file of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(file);
  } catch {
    // file is absent: rely on the process environment
  }
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/db/schema.ts',
  out: './drizzle',
  // Neon: migrations must use the direct (unpooled) connection string.
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? '' },
  strict: true,
  verbose: true,
});
