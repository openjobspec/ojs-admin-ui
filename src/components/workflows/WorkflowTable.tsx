import { useState } from 'react';
import type { WorkflowSummary } from '@/api/types';
import { useClient } from '@/hooks/useAppContext';
import { timeAgo } from '@/lib/formatting';
import { ConfirmModal } from '@/components/common/ConfirmModal';

interface WorkflowTableProps {
  workflows: WorkflowSummary[];
  onRefresh: () => void;
  onSelect: (id: string) => void;
}

const stateColor = (s: string) => {
  switch (s) {
    case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'active': case 'pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'cancelled': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export function WorkflowTable({ workflows, onRefresh, onSelect }: WorkflowTableProps) {
  const client = useClient();
  const [cancelTarget, setCancelTarget] = useState<WorkflowSummary | null>(null);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    await client.cancelWorkflow(cancelTarget.id);
    setCancelTarget(null);
    onRefresh();
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-3 py-3">Name</th>
              <th className="text-center px-3 py-3">State</th>
              <th className="text-center px-3 py-3">Progress</th>
              <th className="text-right px-3 py-3">Created</th>
              <th className="text-center px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {workflows.map((w) => (
              <tr
                key={w.id}
                onClick={() => onSelect(w.id)}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
              >
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{w.id.substring(0, 12)}…</td>
                <td className="px-3 py-3 font-medium">{w.name ?? '—'}</td>
                <td className="px-3 py-3 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${stateColor(w.state)}`}>
                    {w.state}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${w.steps_total > 0 ? (w.steps_completed / w.steps_total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{w.steps_completed}/{w.steps_total}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-right text-gray-500 text-xs">{timeAgo(w.created_at)}</td>
                <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                  {['pending', 'active'].includes(w.state) && (
                    <button
                      onClick={() => setCancelTarget(w)}
                      className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {workflows.length === 0 && (
          <p className="text-center py-8 text-gray-500 text-sm">No workflows found.</p>
        )}
      </div>

      <ConfirmModal
        open={cancelTarget !== null}
        title="Cancel Workflow"
        message={`This will cancel the workflow "${cancelTarget?.name ?? cancelTarget?.id}" and all its pending steps.`}
        confirmLabel="Cancel Workflow"
        destructive
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </>
  );
}
