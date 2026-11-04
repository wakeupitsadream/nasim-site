import { attachDatabasePool } from '@vercel/functions';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export type Db = NodePgDatabase<typeof schema>;

let db: Db | undefined;

/**
 * Lazy singleton, so builds and pages that never query the database do not need DATABASE_URL.
 * Runtime uses the pooled Neon URL (PgBouncer) with a small client-side pool; on Vercel Fluid
 * compute attachDatabasePool releases idle clients before the instance suspends.
 * Migrations use DATABASE_URL_UNPOOLED (drizzle.config.ts).
 */
export function getDb(): Db {
  if (db) return db;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');
  const pool = new Pool({ connectionString, max: 5 });
  if (process.env.VERCEL) attachDatabasePool(pool);
  db = drizzle({ client: pool, schema });
  return db;
}
