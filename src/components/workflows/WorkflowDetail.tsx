import { useEffect, useState, useCallback } from 'react';
import { useClient } from '@/hooks/useAppContext';
import { useKeyboard } from '@/hooks/useKeyboard';
import type { WorkflowDetail as WorkflowDetailType, WorkflowProgress } from '@/api/types';
import { JsonViewer } from '@/components/common/JsonViewer';
import { timeAgo } from '@/lib/formatting';

interface WorkflowDetailProps {
  workflowId: string;
  onClose: () => void;
}

const stepStateColor = (s: string) => {
  switch (s) {
    case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'active': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case 'pending': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'cancelled': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const stepTypeLabel = (t: string) => {
  switch (t) {
    case 'chain': return '⟶ Chain';
    case 'group': return '⟷ Group';
    case 'batch': return '▤ Batch';
    default: return t;
  }
};

export function WorkflowDetail({ workflowId, onClose }: WorkflowDetailProps) {
  const client = useClient();
  const [workflow, setWorkflow] = useState<WorkflowDetailType | null>(null);
  const [wfProgress, setWfProgress] = useState<WorkflowProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useKeyboard('Escape', onClose);

  const load = useCallback(async () => {
    try {
      const wf = await client.workflow(workflowId);
      setWorkflow(wf);
      if (['pending', 'active'].includes(wf.state)) {
        client.workflowProgress(workflowId).then(setWfProgress).catch(() => setWfProgress(null));
      }
    }
    catch (e) { setError(String(e)); }
  }, [client, workflowId]);

  useEffect(() => { load(); }, [load]);

  const workflowState = workflow?.state;
  // Poll progress for active workflows
  useEffect(() => {
    if (!workflowState || !['pending', 'active'].includes(workflowState)) return;
    const interval = setInterval(() => {
      client.workflowProgress(workflowId).then(setWfProgress).catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [client, workflowId, workflowState]);

  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!workflow) return <div className="p-4 text-gray-500">Loading…</div>;

  const progress = workflow.steps_total > 0
    ? Math.round((workflow.steps_completed / workflow.steps_total) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-xl bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 overflow-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{workflow.name ?? 'Workflow'}</h2>
            <p className="text-xs text-gray-500 font-mono">{workflow.id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Status + Progress */}
          <div className="flex items-center gap-3">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${stepStateColor(workflow.state)}`}>
              {workflow.state}
            </span>
            <span className="text-sm text-gray-500">
              {workflow.steps_completed}/{workflow.steps_total} steps ({progress}%)
            </span>
            <span className="text-xs text-gray-400">{timeAgo(workflow.created_at)}</span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${wfProgress ? Math.round(wfProgress.progress * 100) : progress}%` }}
            />
          </div>

          {/* Per-Step Progress (from workflow progress endpoint) */}
          {wfProgress && wfProgress.steps.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Step Progress</h3>
              <div className="space-y-1.5">
                {wfProgress.steps.map((sp) => (
                  <div key={sp.id} className="flex items-center gap-2 text-xs">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-xs ${stepStateColor(sp.state)}`}>
                      {sp.state}
                    </span>
                    <span className="font-mono text-gray-500 w-20 truncate">{sp.id.substring(0, 10)}</span>
                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 rounded-full transition-all"
                        style={{ width: `${Math.round(sp.progress * 100)}%` }}
                      />
                    </div>
                    <span className="text-gray-400 w-8 text-right">{Math.round(sp.progress * 100)}%</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Steps */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Steps</h3>
            <div className="space-y-2">
              {workflow.steps.map((step) => (
                <div key={step.id} className="bg-gray-50 dark:bg-gray-800 rounded p-3 text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{stepTypeLabel(step.type)}</span>
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-xs ${stepStateColor(step.state)}`}>
                      {step.state}
                    </span>
                    <span className="text-gray-400 font-mono">{step.id.substring(0, 12)}</span>
                  </div>
                  {step.job_ids && step.job_ids.length > 0 && (
                    <div className="text-gray-500 mt-1">
                      Jobs: {step.job_ids.map((id) => id.substring(0, 8)).join(', ')}
                    </div>
                  )}
                  {step.depends_on && step.depends_on.length > 0 && (
                    <div className="text-gray-400 mt-1">
                      Depends on: {step.depends_on.map((id) => id.substring(0, 8)).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Timing */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Timing</h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Created</span>
                <span className="font-mono">{new Date(workflow.created_at).toLocaleString()}</span>
              </div>
              {workflow.completed_at && (
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Completed</span>
                  <span className="font-mono">{new Date(workflow.completed_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          </section>

          {/* Metadata */}
          {workflow.meta && Object.keys(workflow.meta).length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Metadata</h3>
              <JsonViewer data={workflow.meta} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
