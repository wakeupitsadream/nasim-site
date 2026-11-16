import { and, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { auditLog, contentOverrides } from '@/lib/db/schema';
import type { OverrideKind } from '@/lib/db/queries/overrides';

export type OverrideWrite = {
  kind: OverrideKind;
  key: string;
  /** The edited fields only; merged over what is already stored for the entity. */
  patch: Record<string, unknown>;
};

/**
 * Store edits and their audit trail in one transaction. Callers validate the merged entity with
 * its zod schema first and call `updateTag` afterwards (server actions only).
 */
export async function saveOverrides(writes: OverrideWrite[], userEmail: string): Promise<void> {
  if (writes.length === 0) return;
  await getDb().transaction(async (tx) => {
    for (const { kind, key, patch } of writes) {
      const [existing] = await tx
        .select({ data: contentOverrides.data })
        .from(contentOverrides)
        .where(and(eq(contentOverrides.kind, kind), eq(contentOverrides.key, key)));
      const before = existing?.data ?? null;
      const after = { ...(before ?? {}), ...patch };
      await tx
        .insert(contentOverrides)
        .values({ kind, key, data: after, updatedBy: userEmail })
        .onConflictDoUpdate({
          target: [contentOverrides.kind, contentOverrides.key],
          set: { data: after, updatedBy: userEmail, updatedAt: new Date() },
        });
      await tx.insert(auditLog).values({ userEmail, kind, key, before, after });
    }
  });
}
