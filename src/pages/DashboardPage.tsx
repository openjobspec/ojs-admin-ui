import { useCallback } from 'react';
import { useClient } from '@/hooks/useAppContext';
import { usePolling } from '@/hooks/usePolling';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { QueueOverview } from '@/components/dashboard/QueueOverview';
import { ThroughputChart } from '@/components/dashboard/ThroughputChart';
import { HealthWidget } from '@/components/dashboard/HealthWidget';
import { MaintenanceBanner } from '@/components/dashboard/MaintenanceBanner';
import type { AggregateStats, HealthStatus, HistoryDataPoint, MaintenanceStatus, QueueSummary } from '@/api/types';

export function DashboardPage() {
  const client = useClient();

  const fetchStats = useCallback(() => client.stats(), [client]);
  const fetchQueues = useCallback(() => client.queues().then((r) => r.items), [client]);
  const fetchHistory = useCallback(
    () => client.statsHistory('5m').then((r) => r.data).catch((err) => { console.warn('Failed to load history:', err); return [] as HistoryDataPoint[]; }),
    [client],
  );
  const fetchHealth = useCallback(
    () => client.health().catch((err) => { console.warn('Failed to load health:', err); return null; }),
    [client],
  );
  const fetchMaintenance = useCallback(
    () => client.maintenanceStatus().catch((err) => { console.warn('Failed to load maintenance status:', err); return null; }),
    [client],
  );

  const { data: stats, loading, error } = usePolling<AggregateStats>(fetchStats);
  const { data: queues } = usePolling<QueueSummary[]>(fetchQueues);
  const { data: history } = usePolling<HistoryDataPoint[]>(fetchHistory, 15000);
  const { data: health } = usePolling<HealthStatus | null>(fetchHealth, 10000);
  const { data: maintenance, refresh: refreshMaintenance } = usePolling<MaintenanceStatus | null>(fetchMaintenance, 10000);

  if (loading && !stats) return <Loading />;
  if (error) return <ErrorDisplay error={error} />;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Dashboard</h1>
      <MaintenanceBanner status={maintenance ?? null} onToggle={refreshMaintenance} />
      <HealthWidget health={health ?? null} />
      <StatsCards jobs={stats.jobs} throughput={stats.throughput} queues={stats.queues} workers={stats.workers} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Throughput (5m)</h2>
          <ThroughputChart data={history ?? []} />
        </section>
        <section>
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Queues</h2>
          <QueueOverview queues={queues ?? []} />
        </section>
      </div>
    </div>
  );
}

function Loading() {
  return <div className="flex items-center justify-center h-64 text-gray-500" role="status" aria-live="polite">Loading dashboard…</div>;
}

function ErrorDisplay({ error }: { error: Error }) {
  return (
    <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center" role="alert">
      <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">Failed to connect</h2>
      <p className="text-sm text-red-600 dark:text-red-300 mt-2">{error.message}</p>
      <p className="text-xs text-gray-500 mt-4">Make sure an OJS backend is running and accessible.</p>
    </div>
  );
}
