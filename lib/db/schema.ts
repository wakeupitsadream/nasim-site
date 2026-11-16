import { sql } from 'drizzle-orm';
import {
  bigserial,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
// Relative import: drizzle-kit loads this file without the @/ path alias.
import type { I18nText } from '../i18n/text';

/** Site-wide settings, a single row with id = 1 (migration 0000). Unused since the admin stores
 * settings as a content override (DECISIONS №68); kept so that the migration history stays linear. */
export const settings = pgTable(
  'settings',
  {
    id: integer('id').primaryKey().default(1),
    brandName: jsonb('brand_name').$type<I18nText>().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check('settings_singleton', sql`${t.id} = 1`)],
);

/** People who may sign in to /admin. Passwords are scrypt hashes (lib/auth/password.ts). */
export const adminUsers = pgTable('admin_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['owner', 'staff'] })
    .notNull()
    .default('owner'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
});

/**
 * What the admin changed, on top of content/seed/*.json: one row per edited entity, holding only
 * the fields that were edited. The site reads seed + override (lib/content/queries.ts), so an
 * entity nobody touched follows the seed, and a new seed field reaches edited entities too.
 */
export const contentOverrides = pgTable(
  'content_overrides',
  {
    /** `settings` | `service` | `price_item` | `package` */
    kind: text('kind').notNull(),
    /** `site` for settings, otherwise the entity's slug or key. */
    key: text('key').notNull(),
    data: jsonb('data').$type<Record<string, unknown>>().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text('updated_by').notNull(),
  },
  (t) => [primaryKey({ columns: [t.kind, t.key] })],
);

/** Every admin change with the values before and after. No customer data ever lands here. */
export const auditLog = pgTable(
  'audit_log',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
    userEmail: text('user_email').notNull(),
    kind: text('kind').notNull(),
    key: text('key').notNull(),
    before: jsonb('before').$type<Record<string, unknown> | null>(),
    after: jsonb('after').$type<Record<string, unknown> | null>(),
  },
  (t) => [index('audit_log_at_idx').on(t.at)],
);
