import { useState } from 'react';
import type { CronJob } from '@/api/types';
import { useClient } from '@/hooks/useAppContext';
import { timeAgo } from '@/lib/formatting';
import { ConfirmModal } from '@/components/common/ConfirmModal';

interface CronTableProps {
  crons: CronJob[];
  onRefresh: () => void;
  onSelect: (id: string) => void;
}

export function CronTable({ crons, onRefresh, onSelect }: CronTableProps) {
  const client = useClient();
  const [acting, setActing] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CronJob | null>(null);

  const toggle = async (c: CronJob) => {
    setActing(c.id);
    try {
      await client.toggleCron(c.id, !c.enabled);
      onRefresh();
    } finally {
      setActing(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await client.deleteCron(deleteTarget.id);
    setDeleteTarget(null);
    onRefresh();
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Name / Type</th>
              <th className="text-left px-3 py-3">Queue</th>
              <th className="text-left px-3 py-3">Schedule</th>
              <th className="text-left px-3 py-3">Timezone</th>
              <th className="text-right px-3 py-3">Last Run</th>
              <th className="text-right px-3 py-3">Next Run</th>
              <th className="text-center px-3 py-3">Status</th>
              <th className="text-center px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {crons.map((c) => (
              <tr
                key={c.id}
                onClick={() => onSelect(c.id)}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{c.name ?? c.type}</div>
                  {c.name && <div className="text-xs text-gray-500">{c.type}</div>}
                </td>
                <td className="px-3 py-3 text-gray-500">{c.queue}</td>
                <td className="px-3 py-3 font-mono text-xs">{c.schedule}</td>
                <td className="px-3 py-3 text-gray-500 text-xs">{c.timezone ?? 'UTC'}</td>
                <td className="px-3 py-3 text-right text-gray-500 text-xs">
                  {c.last_run_at ? timeAgo(c.last_run_at) : '—'}
                </td>
                <td className="px-3 py-3 text-right text-gray-500 text-xs">
                  {c.next_run_at ? new Date(c.next_run_at).toLocaleString() : '—'}
                </td>
                <td className="px-3 py-3 text-center">
                  {c.enabled ? (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">Active</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded-full">Disabled</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1 justify-center">
                    <button
                      onClick={() => toggle(c)}
                      disabled={acting === c.id}
                      className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
                    >
                      {acting === c.id ? '…' : c.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(c)}
                      className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {crons.length === 0 && (
          <p className="text-center py-8 text-gray-500 text-sm">No cron jobs registered.</p>
        )}
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete Cron Job"
        message={`This will permanently remove the cron job "${deleteTarget?.name ?? deleteTarget?.type}". This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

