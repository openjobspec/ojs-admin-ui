import { useState, useCallback } from 'react';
import { ReceiptCard } from './ReceiptCard';
import type { AuditEntry, AuditFilter, AttestationReceipt } from './types';

interface AuditExplorerProps {
  entries: AuditEntry[];
  onVerify?: (receipt: AttestationReceipt) => Promise<boolean>;
}

const LEVELS = ['', 'none', 'pqc-only', 'hardware'] as const;

export function AuditExplorer({ entries, onVerify }: AuditExplorerProps) {
  const [filters, setFilters] = useState<AuditFilter>({});
  const [verifying, setVerifying] = useState<string | null>(null);
  const [verifiedMap, setVerifiedMap] = useState<Record<string, boolean>>({});

  const filtered = entries.filter((e) => {
    if (filters.jobType && !e.jobType.includes(filters.jobType)) return false;
    if (filters.level && e.level !== filters.level) return false;
    if (filters.jurisdiction && e.receipt?.jurisdiction?.region !== filters.jurisdiction) return false;
    if (filters.dateFrom && e.timestamp < filters.dateFrom) return false;
    if (filters.dateTo && e.timestamp > filters.dateTo) return false;
    return true;
  });

  const handleVerify = useCallback(async (receipt: AttestationReceipt) => {
    if (!onVerify) return;
    setVerifying(receipt.jobId);
    try {
      const ok = await onVerify(receipt);
      setVerifiedMap((prev) => ({ ...prev, [receipt.jobId]: ok }));
    } finally {
      setVerifying(null);
    }
  }, [onVerify]);

  const updateFilter = (key: keyof AuditFilter, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const jobTypes = [...new Set(entries.map((e) => e.jobType))];
  const jurisdictions = [...new Set(entries.map((e) => e.receipt?.jurisdiction?.region).filter(Boolean))] as string[];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Job Type</label>
          <select
            value={filters.jobType ?? ''}
            onChange={(e) => updateFilter('jobType', e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-900"
          >
            <option value="">All</option>
            {jobTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Attestation Level</label>
          <select
            value={filters.level ?? ''}
            onChange={(e) => updateFilter('level', e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-900"
          >
            {LEVELS.map((l) => <option key={l} value={l}>{l || 'All'}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Jurisdiction</label>
          <select
            value={filters.jurisdiction ?? ''}
            onChange={(e) => updateFilter('jurisdiction', e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-900"
          >
            <option value="">All</option>
            {jurisdictions.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
          <input
            type="date"
            value={filters.dateFrom ?? ''}
            onChange={(e) => updateFilter('dateFrom', e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-900"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To</label>
          <input
            type="date"
            value={filters.dateTo ?? ''}
            onChange={(e) => updateFilter('dateTo', e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-900"
          />
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {filtered.length} of {entries.length} entries
      </p>

      {/* Receipt list */}
      <div className="space-y-3">
        {filtered.map((entry) => (
          <div key={entry.id}>
            {entry.receipt ? (
              <ReceiptCard
                receipt={{
                  ...entry.receipt,
                  verified: verifiedMap[entry.receipt.jobId],
                }}
                onVerify={onVerify ? handleVerify : undefined}
              />
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 text-sm text-gray-500">
                <span className="font-mono">{entry.jobId.slice(0, 8)}…</span>
                {' — '}
                {entry.action}
                {' — '}
                No attestation receipt
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 dark:text-gray-600 py-8">
            No audit entries match the current filters.
          </p>
        )}
      </div>
    </div>
  );
}
