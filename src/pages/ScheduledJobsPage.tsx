import { useCallback } from 'react';
import { useClient } from '@/hooks/useAppContext';
import { usePolling } from '@/hooks/usePolling';
import { StatusBadge } from '@/components/common/StatusBadge';
import { timeAgo } from '@/lib/formatting';
import type { PaginatedResponse, JobSummary } from '@/api/types';

export function ScheduledJobsPage() {
  const client = useClient();

  const fetchScheduled = useCallback(
    () => client.jobs({ state: 'scheduled', per_page: 50, sort: 'scheduled_at', order: 'asc' }),
    [client],
  );
  const { data: resp, refresh } = usePolling<PaginatedResponse<JobSummary>>(fetchScheduled, 10000);

  const jobs = resp?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Scheduled Jobs</h1>
        <button onClick={refresh} className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
          Refresh
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-3 py-3">Type</th>
              <th className="text-left px-3 py-3">Queue</th>
              <th className="text-center px-3 py-3">State</th>
              <th className="text-center px-3 py-3">Priority</th>
              <th className="text-right px-3 py-3">Scheduled For</th>
              <th className="text-right px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{job.id.substring(0, 12)}…</td>
                <td className="px-3 py-3 font-medium">{job.type}</td>
                <td className="px-3 py-3 text-gray-500">{job.queue}</td>
                <td className="px-3 py-3 text-center"><StatusBadge state={job.state} /></td>
                <td className="px-3 py-3 text-center text-gray-500">{job.priority}</td>
                <td className="px-3 py-3 text-right">
                  {job.scheduled_at ? (
                    <div>
                      <div className="text-xs font-medium">{new Date(job.scheduled_at).toLocaleString()}</div>
                      <div className="text-xs text-gray-400">{timeAgo(job.scheduled_at)}</div>
                    </div>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-right text-gray-500 text-xs">{timeAgo(job.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {jobs.length === 0 && (
          <p className="text-center py-8 text-gray-500 text-sm">No scheduled jobs.</p>
        )}
      </div>
    </div>
  );
}
