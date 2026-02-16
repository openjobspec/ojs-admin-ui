import type { Tenant } from '@/api/types';
import { formatNumber, timeAgo } from '@/lib/formatting';

interface TenantTableProps {
  tenants: Tenant[];
  onSelect: (id: string) => void;
}

export function TenantTable({ tenants, onSelect }: TenantTableProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-3">Name</th>
            <th className="text-center px-3 py-3">State</th>
            <th className="text-right px-3 py-3">Queues</th>
            <th className="text-right px-3 py-3">Active Jobs</th>
            <th className="text-right px-3 py-3">Workers</th>
            <th className="text-right px-3 py-3">Max Concurrent</th>
            <th className="text-right px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {tenants.map((t) => (
            <tr
              key={t.id}
              onClick={() => onSelect(t.id)}
              className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
            >
              <td className="px-4 py-3">
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-gray-500 font-mono">{t.id}</div>
              </td>
              <td className="px-3 py-3 text-center">
                {t.state === 'suspended' ? (
                  <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">Suspended</span>
                ) : (
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">Active</span>
                )}
              </td>
              <td className="px-3 py-3 text-right">{t.stats ? formatNumber(t.stats.queues) : '—'}</td>
              <td className="px-3 py-3 text-right">
                {t.stats ? formatNumber(t.stats.jobs.active) : '—'}
              </td>
              <td className="px-3 py-3 text-right">{t.stats ? formatNumber(t.stats.workers) : '—'}</td>
              <td className="px-3 py-3 text-right text-gray-500">
                {t.limits?.max_concurrent_jobs != null ? formatNumber(t.limits.max_concurrent_jobs) : '∞'}
              </td>
              <td className="px-4 py-3 text-right text-gray-500 text-xs">{timeAgo(t.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {tenants.length === 0 && (
        <p className="text-center py-8 text-gray-500 text-sm">No tenants found.</p>
      )}
    </div>
  );
}
