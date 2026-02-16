import { useState, useEffect } from 'react';
import { timeAgo } from '@/lib/formatting';

interface AuditEntry {
  id: string;
  action: string;
  filter: Record<string, unknown>;
  result: { matched: number; succeeded: number; failed: number };
  performed_at: string;
}

const STORAGE_KEY = 'ojs-admin-audit-log';

export function getAuditLog(): AuditEntry[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as AuditEntry[] : [];
  } catch {
    return [];
  }
}

export function addAuditEntry(action: string, filter: Record<string, unknown>, result: { matched: number; succeeded: number; failed: number }): void {
  const entries = getAuditLog();
  entries.unshift({
    id: crypto.randomUUID(),
    action,
    filter,
    result,
    performed_at: new Date().toISOString(),
  });
  // Keep last 100 entries
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 100)));
}

export function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  useEffect(() => {
    setEntries(getAuditLog());
    const interval = setInterval(() => setEntries(getAuditLog()), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Bulk Operations Audit Log</h1>
        <button
          onClick={() => { sessionStorage.removeItem(STORAGE_KEY); setEntries([]); }}
          className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Clear Log
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Action</th>
              <th className="text-left px-3 py-3">Filter</th>
              <th className="text-right px-3 py-3">Matched</th>
              <th className="text-right px-3 py-3">Succeeded</th>
              <th className="text-right px-3 py-3">Failed</th>
              <th className="text-right px-4 py-3">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                    entry.action.includes('retry') ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : entry.action.includes('cancel') ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                  }`}>
                    {entry.action}
                  </span>
                </td>
                <td className="px-3 py-3 text-xs font-mono text-gray-500">
                  {Object.entries(entry.filter).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}=${v}`).join(', ') || '—'}
                </td>
                <td className="px-3 py-3 text-right">{entry.result.matched}</td>
                <td className="px-3 py-3 text-right text-green-600">{entry.result.succeeded}</td>
                <td className="px-3 py-3 text-right text-red-600">{entry.result.failed}</td>
                <td className="px-4 py-3 text-right text-gray-500 text-xs">{timeAgo(entry.performed_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && (
          <p className="text-center py-8 text-gray-500 text-sm">No bulk operations recorded in this session.</p>
        )}
      </div>
    </div>
  );
}
