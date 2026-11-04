import { sql } from 'drizzle-orm';
import { check, integer, jsonb, pgTable, timestamp } from 'drizzle-orm/pg-core';
// Relative import: drizzle-kit loads this file without the @/ path alias.
import type { I18nText } from '../i18n/text';

/** Site-wide settings, a single row with id = 1 (BRIEF §11). Phase 2 adds the remaining columns. */
export const settings = pgTable(
  'settings',
  {
    id: integer('id').primaryKey().default(1),
    brandName: jsonb('brand_name').$type<I18nText>().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check('settings_singleton', sql`${t.id} = 1`)],
);
