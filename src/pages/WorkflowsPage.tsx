import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useClient } from '@/hooks/useAppContext';
import { usePolling } from '@/hooks/usePolling';
import { WorkflowTable } from '@/components/workflows/WorkflowTable';
import { WorkflowDetail } from '@/components/workflows/WorkflowDetail';
import { Pagination } from '@/components/common/Pagination';
import type { PaginatedResponse, WorkflowSummary } from '@/api/types';

const STATES = ['pending', 'active', 'completed', 'failed', 'cancelled'];

export function WorkflowsPage() {
  const client = useClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const stateFilter = searchParams.get('state') || undefined;
  const page = Number(searchParams.get('page')) || 1;
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

  const setStateFilter = (state?: string) => {
    const next = new URLSearchParams();
    if (state) next.set('state', state);
    setSearchParams(next, { replace: true });
  };

  const setPage = (p: number) => {
    const next = new URLSearchParams(searchParams);
    if (p > 1) next.set('page', String(p));
    else next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const fetchWorkflows = useCallback(
    () => client.workflows({ state: stateFilter, page, per_page: 25 }),
    [client, stateFilter, page],
  );
  const { data: wfResp, refresh } = usePolling<PaginatedResponse<WorkflowSummary>>(fetchWorkflows, 5000);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Workflows</h1>
        <button onClick={refresh} className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={stateFilter ?? ''}
          onChange={(e) => setStateFilter(e.target.value || undefined)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 bg-white dark:bg-gray-800"
        >
          <option value="">All states</option>
          {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {stateFilter && (
          <button onClick={() => setStateFilter(undefined)} className="text-xs text-gray-500 hover:text-gray-700 underline">
            Clear filter
          </button>
        )}
      </div>

      <WorkflowTable
        workflows={wfResp?.items ?? []}
        onRefresh={refresh}
        onSelect={setSelectedWorkflow}
      />

      {wfResp && (
        <Pagination
          page={wfResp.pagination.page}
          perPage={wfResp.pagination.per_page}
          total={wfResp.pagination.total}
          onChange={setPage}
        />
      )}

      {selectedWorkflow && <WorkflowDetail workflowId={selectedWorkflow} onClose={() => setSelectedWorkflow(null)} />}
    </div>
  );
}
