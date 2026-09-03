/**
 * Client-side (session-scoped) audit log for bulk/administrative operations.
 * Lives here — not in the page component — so any action handler can record an
 * entry without importing from the page layer.
 */

export interface AuditResult {
  matched: number;
  succeeded: number;
  failed: number;
}

export interface AuditEntry {
  id: string;
  action: string;
  filter: Record<string, unknown>;
  result: AuditResult;
  performed_at: string;
}

export const AUDIT_STORAGE_KEY = 'ojs-admin-audit-log';
const MAX_ENTRIES = 100;

export function getAuditLog(): AuditEntry[] {
  try {
    const raw = sessionStorage.getItem(AUDIT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuditEntry[]) : [];
  } catch {
    return [];
  }
}

export function addAuditEntry(action: string, filter: Record<string, unknown>, result: AuditResult): void {
  const entries = getAuditLog();
  entries.unshift({
    id: crypto.randomUUID(),
    action,
    filter,
    result,
    performed_at: new Date().toISOString(),
  });
  try {
    sessionStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // Storage full/unavailable — audit logging is best-effort.
  }
}

export function clearAuditLog(): void {
  sessionStorage.removeItem(AUDIT_STORAGE_KEY);
}
