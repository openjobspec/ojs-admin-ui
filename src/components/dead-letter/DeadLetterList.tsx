import { useState } from 'react';
import type { DeadLetterStats, JobSummary } from '@/api/types';
import { useClient } from '@/hooks/useAppContext';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { timeAgo, formatNumber } from '@/lib/formatting';

interface DeadLetterListProps {
  jobs: JobSummary[];
  stats: DeadLetterStats | null;
  onRefresh: () => void;
  onSelect: (id: string) => void;
}

export function DeadLetterList({ jobs, stats, onRefresh, onSelect }: DeadLetterListProps) {
  const client = useClient();
  const [showBulk, setShowBulk] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const retryOne = async (id: string) => {
    setActing(id);
    try { await client.retryDeadLetter(id); onRefresh(); }
    finally { setActing(null); }
  };

  const deleteOne = async (id: string) => {
    setActing(id);
    try { await client.deleteDeadLetter(id); onRefresh(); }
    finally { setActing(null); }
  };

  return (
    <>
      {/* Stats summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3">
            <div className="text-xs text-gray-500">Total Dead</div>
            <div className="text-xl font-bold text-red-600">{formatNumber(stats.total)}</div>
          </div>
          {stats.by_error_type && Object.entries(stats.by_error_type).slice(0, 3).map(([type, count]) => (
            <div key={type} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3">
              <div className="text-xs text-gray-500 truncate">{type}</div>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatNumber(count)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowBulk(true)}
          disabled={jobs.length === 0}
          className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40"
        >
          Bulk Retry All
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-3 py-3">Type</th>
              <th className="text-left px-3 py-3">Queue</th>
              <th className="text-center px-3 py-3">State</th>
              <th className="text-right px-3 py-3">Created</th>
              <th className="text-center px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500 cursor-pointer" onClick={() => onSelect(job.id)}>
                  {job.id.substring(0, 12)}…
                </td>
                <td className="px-3 py-3 font-medium cursor-pointer" onClick={() => onSelect(job.id)}>{job.type}</td>
                <td className="px-3 py-3 text-gray-500">{job.queue}</td>
                <td className="px-3 py-3 text-center"><StatusBadge state={job.state} /></td>
                <td className="px-3 py-3 text-right text-gray-500 text-xs">{timeAgo(job.created_at)}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex gap-1 justify-center">
                    <button
                      onClick={() => retryOne(job.id)}
                      disabled={acting === job.id}
                      className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
                    >
                      Retry
                    </button>
                    <button
                      onClick={() => deleteOne(job.id)}
                      disabled={acting === job.id}
                      className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {jobs.length === 0 && (
          <p className="text-center py-8 text-gray-500 text-sm">Dead letter queue is empty. 🎉</p>
        )}
      </div>

      <ConfirmModal
        open={showBulk}
        title="Bulk Retry All Dead Letter Jobs"
        message={`This will retry all ${stats?.total ?? 0} dead letter jobs. Are you sure?`}
        confirmLabel="Retry All"
        onConfirm={async () => { await client.bulkRetryDeadLetter({}); setShowBulk(false); onRefresh(); }}
        onCancel={() => setShowBulk(false)}
      />
    </>
  );
}
