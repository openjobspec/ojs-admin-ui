import { useCallback } from 'react';
import { useClient } from '@/hooks/useAppContext';
import { usePolling } from '@/hooks/usePolling';
import { formatNumber } from '@/lib/formatting';
import type { WorkerPool, SchedulingStats } from '@/api/types';

export function PoolsPage() {
  const client = useClient();

  const fetchPools = useCallback(
    () => client.workerPools().then((r) => r.pools).catch((err) => { console.warn('Failed to load worker pools:', err); return [] as WorkerPool[]; }),
    [client],
  );
  const fetchScheduling = useCallback(
    () => client.schedulingStats().catch((err) => { console.warn('Failed to load scheduling stats:', err); return null; }),
    [client],
  );

  const { data: pools, refresh } = usePolling<WorkerPool[]>(fetchPools, 10000);
  const { data: scheduling } = usePolling<SchedulingStats | null>(fetchScheduling, 10000);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Worker Pools & Scheduling</h1>
        <button onClick={refresh} className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
          Refresh
        </button>
      </div>

      {/* Worker Pools */}
      <section>
        <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase mb-3">Worker Pools</h2>
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Pool</th>
                <th className="text-left px-3 py-3">Queues</th>
                <th className="text-right px-3 py-3">Workers</th>
                <th className="text-right px-3 py-3">Active Jobs</th>
                <th className="text-right px-3 py-3">Concurrency</th>
                <th className="text-left px-4 py-3">Strategy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(pools ?? []).map((pool) => (
                <tr key={pool.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium">{pool.name}</td>
                  <td className="px-3 py-3 text-gray-500 text-xs">{pool.queues.join(', ')}</td>
                  <td className="px-3 py-3 text-right">{formatNumber(pool.workers)}</td>
                  <td className="px-3 py-3 text-right">{formatNumber(pool.active_jobs)}</td>
                  <td className="px-3 py-3 text-right text-gray-500">{pool.concurrency}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{pool.strategy ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(pools ?? []).length === 0 && (
            <p className="text-center py-8 text-gray-500 text-sm">No worker pools configured.</p>
          )}
        </div>
      </section>

      {/* Scheduling Stats */}
      {scheduling && (
        <section>
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase mb-3">
            Scheduling Distribution
            <span className="ml-2 text-xs font-normal text-gray-400">Strategy: {scheduling.strategy}</span>
          </h2>
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="space-y-2">
              {scheduling.queues.map((q) => {
                const maxDispatched = Math.max(...scheduling.queues.map((x) => x.dispatched), 1);
                return (
                  <div key={q.name} className="flex items-center gap-3 text-sm">
                    <span className="w-32 truncate font-medium">{q.name}</span>
                    {q.weight != null && (
                      <span className="text-xs text-gray-400 w-16">w={q.weight}</span>
                    )}
                    <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                      <div
                        className={`h-full rounded ${q.starved ? 'bg-red-500' : 'bg-blue-500'}`}
                        style={{ width: `${(q.dispatched / maxDispatched) * 100}%` }}
                      />
                    </div>
                    <span className="w-16 text-right text-gray-500 text-xs">{formatNumber(q.dispatched)}</span>
                    {q.starved && (
                      <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded">starved</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
