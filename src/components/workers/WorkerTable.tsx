import { useState } from 'react';
import type { WorkerSummary } from '@/api/types';
import { useClient } from '@/hooks/useAppContext';
import { timeAgo } from '@/lib/formatting';
import { ConfirmModal } from '@/components/common/ConfirmModal';

interface WorkerTableProps {
  workers: WorkerSummary[];
  onRefresh: () => void;
}

export function WorkerTable({ workers, onRefresh }: WorkerTableProps) {
  const client = useClient();
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'quiet' | 'deregister' } | null>(null);

  const execute = async () => {
    if (!confirmAction) return;
    if (confirmAction.action === 'quiet') await client.quietWorker(confirmAction.id);
    else await client.deregisterWorker(confirmAction.id);
    setConfirmAction(null);
    onRefresh();
  };

  const stateColor = (s: string) => {
    switch (s) {
      case 'running': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'quiet': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'stale': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Worker ID</th>
              <th className="text-left px-3 py-3">Hostname</th>
              <th className="text-center px-3 py-3">State</th>
              <th className="text-left px-3 py-3">Queues</th>
              <th className="text-right px-3 py-3">Active</th>
              <th className="text-right px-3 py-3">Last Heartbeat</th>
              <th className="text-center px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {workers.map((w) => (
              <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 font-mono text-xs">{w.id.substring(0, 16)}</td>
                <td className="px-3 py-3 text-gray-500">{w.hostname ?? '—'}</td>
                <td className="px-3 py-3 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${stateColor(w.state)}`}>
                    {w.state}
                  </span>
                </td>
                <td className="px-3 py-3 text-gray-500 text-xs">{w.queues.join(', ')}</td>
                <td className="px-3 py-3 text-right">{w.active_jobs}</td>
                <td className="px-3 py-3 text-right text-gray-500 text-xs">{timeAgo(w.last_heartbeat_at)}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex gap-1 justify-center">
                    {w.state === 'running' && (
                      <button
                        onClick={() => setConfirmAction({ id: w.id, action: 'quiet' })}
                        className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Quiet
                      </button>
                    )}
                    {w.state === 'stale' && (
                      <button
                        onClick={() => setConfirmAction({ id: w.id, action: 'deregister' })}
                        className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {workers.length === 0 && (
          <p className="text-center py-8 text-gray-500 text-sm">No workers connected.</p>
        )}
      </div>

      <ConfirmModal
        open={confirmAction !== null}
        title={confirmAction?.action === 'quiet' ? 'Quiet Worker' : 'Remove Stale Worker'}
        message={confirmAction?.action === 'quiet'
          ? 'This will signal the worker to stop fetching new jobs. Active jobs will finish.'
          : 'This will remove the stale worker and requeue its active jobs.'}
        confirmLabel={confirmAction?.action === 'quiet' ? 'Quiet' : 'Remove'}
        destructive={confirmAction?.action === 'deregister'}
        onConfirm={execute}
        onCancel={() => setConfirmAction(null)}
      />
    </>
  );
}
