import { useState, useCallback } from 'react';
import { useClient } from '@/hooks/useAppContext';
import { usePolling } from '@/hooks/usePolling';
import { Pagination } from '@/components/common/Pagination';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { PaginatedResponse, UniqueJobInfo } from '@/api/types';

export function UniqueJobsPage() {
  const client = useClient();
  const [page, setPage] = useState(1);

  const fetchUnique = useCallback(() => client.uniqueJobs(page, 25), [client, page]);
  const { data: resp, refresh } = usePolling<PaginatedResponse<UniqueJobInfo>>(fetchUnique, 10000);

  const items = resp?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Unique Jobs</h1>
        <button onClick={refresh} className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
          Refresh
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Unique Key</th>
              <th className="text-left px-3 py-3">Job ID</th>
              <th className="text-left px-3 py-3">Type</th>
              <th className="text-left px-3 py-3">Queue</th>
              <th className="text-center px-3 py-3">State</th>
              <th className="text-right px-4 py-3">Locked Until</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {items.map((u) => (
              <tr key={u.key} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 font-mono text-xs">{u.key}</td>
                <td className="px-3 py-3 font-mono text-xs text-gray-500">{u.job_id.substring(0, 12)}…</td>
                <td className="px-3 py-3 font-medium">{u.type}</td>
                <td className="px-3 py-3 text-gray-500">{u.queue}</td>
                <td className="px-3 py-3 text-center"><StatusBadge state={u.state} /></td>
                <td className="px-4 py-3 text-right text-gray-500 text-xs">
                  {u.locked_until ? new Date(u.locked_until).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <p className="text-center py-8 text-gray-500 text-sm">No unique job locks active.</p>
        )}
      </div>

      {resp && (
        <Pagination
          page={resp.pagination.page}
          perPage={resp.pagination.per_page}
          total={resp.pagination.total}
          onChange={setPage}
        />
      )}
    </div>
  );
}
