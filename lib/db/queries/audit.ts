import { desc } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { hasDatabase } from '@/lib/db/queries/overrides';
import { auditLog } from '@/lib/db/schema';

type Stored = Record<string, unknown> | null;
export type AuditEntry = {
  id: number;
  at: Date;
  userEmail: string;
  kind: string;
  key: string;
  /** The stored edit of the entity before and after this change (changed fields only). */
  before: Stored;
  after: Stored;
};

/** The latest admin edits, newest first. Not cached: only the admin's own pages read it. */
export async function recentChanges(limit = 10): Promise<AuditEntry[]> {
  if (!hasDatabase()) return [];
  const rows = await getDb()
    .select({
      id: auditLog.id,
      at: auditLog.at,
      userEmail: auditLog.userEmail,
      kind: auditLog.kind,
      key: auditLog.key,
      before: auditLog.before,
      after: auditLog.after,
    })
    .from(auditLog)
    .orderBy(desc(auditLog.at), desc(auditLog.id))
    .limit(limit);
  return rows as AuditEntry[];
}
