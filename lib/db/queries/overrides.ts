import { eq } from 'drizzle-orm';
import { cacheLife, cacheTag } from 'next/cache';
import { getDb } from '@/lib/db/client';
import { contentOverrides } from '@/lib/db/schema';

/** What the admin can edit. Each kind has its own cache tag next to the shared `content`. */
export const OVERRIDE_KINDS = ['settings', 'service', 'price_item', 'package'] as const;
export type OverrideKind = (typeof OVERRIDE_KINDS)[number];

export type Overrides = Record<string, Record<string, unknown>>;

const NONE: Overrides = {};

/** Cache tags of one kind: `settings` for settings, `content` for everything customers read. */
export const tagsFor = (kind: OverrideKind): string[] =>
  kind === 'settings' ? ['settings'] : ['content', `content:${kind}`];

/** True when the deployment has a database; without one the seed files are the content. */
export const hasDatabase = (): boolean => Boolean(process.env.DATABASE_URL);

/**
 * The admin's edits of one kind, by entity key. Cached until a server action calls `updateTag`
 * (CLAUDE.md rule 5). A database error throws: silently serving seed prices instead of the
 * prices the owner set would be worse than a failed render.
 */
export async function getOverrides(kind: OverrideKind): Promise<Overrides> {
  // No database (local builds, CI, unit tests): never enter the cached scope.
  if (!hasDatabase()) return NONE;
  return cachedOverrides(kind);
}

async function cachedOverrides(kind: OverrideKind): Promise<Overrides> {
  'use cache';
  cacheLife('max');
  for (const tag of tagsFor(kind)) cacheTag(tag);
  const rows = await getDb()
    .select({ key: contentOverrides.key, data: contentOverrides.data })
    .from(contentOverrides)
    .where(eq(contentOverrides.kind, kind));
  return Object.fromEntries(rows.map((r) => [r.key, r.data]));
}
