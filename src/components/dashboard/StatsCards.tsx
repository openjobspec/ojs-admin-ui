import type { JobCounts } from '@/api/types';
import { formatNumber, formatRate } from '@/lib/formatting';

interface StatsCardsProps {
  jobs: JobCounts;
  throughput: { processed_per_minute: number; failed_per_minute: number };
  queues: number;
  workers: number;
}

function Card({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

export function StatsCards({ jobs, throughput, queues, workers }: StatsCardsProps) {
  const totalActive = jobs.available + jobs.active + jobs.scheduled + jobs.retryable;
  const errorRate = throughput.processed_per_minute > 0
    ? ((throughput.failed_per_minute / throughput.processed_per_minute) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <Card label="Active Jobs" value={formatNumber(totalActive)} color="text-blue-600" sub={`${formatNumber(jobs.active)} executing`} />
      <Card label="Completed" value={formatNumber(jobs.completed)} color="text-green-600" />
      <Card label="Failed" value={formatNumber(jobs.discarded)} color="text-red-600" />
      <Card label="Throughput" value={formatRate(throughput.processed_per_minute)} color="text-gray-900 dark:text-gray-100" sub={`${errorRate}% error rate`} />
      <Card label="Queues" value={String(queues)} color="text-purple-600" />
      <Card label="Workers" value={String(workers)} color="text-amber-600" />
    </div>
  );
}

