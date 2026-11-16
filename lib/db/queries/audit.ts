import { desc } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { hasDatabase } from '@/lib/db/queries/overrides';
import { auditLog } from '@/lib/db/schema';

export type AuditEntry = { id: number; at: Date; userEmail: string; kind: string; key: string };

/** The latest admin edits, newest first. Not cached: only the admin's own pages read it. */
export async function recentChanges(limit = 10): Promise<AuditEntry[]> {
  if (!hasDatabase()) return [];
  return getDb()
    .select({
      id: auditLog.id,
      at: auditLog.at,
      userEmail: auditLog.userEmail,
      kind: auditLog.kind,
      key: auditLog.key,
    })
    .from(auditLog)
    .orderBy(desc(auditLog.at), desc(auditLog.id))
    .limit(limit);
}
