import { useCallback } from 'react';
import { useClient } from '@/hooks/useAppContext';
import { usePolling } from '@/hooks/usePolling';
import { WorkerTable } from '@/components/workers/WorkerTable';
import type { WorkerListResponse } from '@/api/types';

export function WorkersPage() {
  const client = useClient();
  const fetchWorkers = useCallback(() => client.workers(), [client]);
  const { data, refresh } = usePolling<WorkerListResponse>(fetchWorkers);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Workers</h1>
        <div className="flex items-center gap-3">
          {data?.summary && (
            <div className="flex gap-2 text-xs">
              <span className="text-green-600">{data.summary.running} running</span>
              {data.summary.quiet > 0 && <span className="text-yellow-600">{data.summary.quiet} quiet</span>}
              {data.summary.stale > 0 && <span className="text-red-600">{data.summary.stale} stale</span>}
            </div>
          )}
          <button onClick={refresh} className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            Refresh
          </button>
        </div>
      </div>
      <WorkerTable workers={data?.items ?? []} onRefresh={refresh} />
    </div>
  );
}
