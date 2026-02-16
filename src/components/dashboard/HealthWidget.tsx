import type { HealthStatus } from '@/api/types';
import { formatDuration } from '@/lib/formatting';

interface HealthWidgetProps {
  health: HealthStatus | null;
}

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  healthy: { color: 'text-green-700 dark:text-green-300', bg: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800', label: '● Healthy' },
  degraded: { color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800', label: '◐ Degraded' },
  unhealthy: { color: 'text-red-700 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800', label: '○ Unhealthy' },
};

export function HealthWidget({ health }: HealthWidgetProps) {
  if (!health) return null;

  const cfg = statusConfig[health.status] ?? statusConfig['healthy']!;

  return (
    <div className={`rounded-lg border p-4 ${cfg.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase">System Health</h3>
        <span className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {health.uptime_seconds != null && (
          <div>
            <span className="text-gray-500 block">Uptime</span>
            <span className="font-medium">{formatDuration(health.uptime_seconds)}</span>
          </div>
        )}
        {health.backend && (
          <>
            <div>
              <span className="text-gray-500 block">Backend</span>
              <span className="font-medium">{health.backend.status}</span>
            </div>
            {health.backend.latency_ms != null && (
              <div>
                <span className="text-gray-500 block">Latency</span>
                <span className="font-medium">{health.backend.latency_ms}ms</span>
              </div>
            )}
          </>
        )}
        {health.workers && (
          <div>
            <span className="text-gray-500 block">Workers</span>
            <span className="font-medium">
              {health.workers.active} active / {health.workers.total} total
              {health.workers.stale > 0 && <span className="text-red-500 ml-1">({health.workers.stale} stale)</span>}
            </span>
          </div>
        )}
        {health.queues && (
          <div>
            <span className="text-gray-500 block">Queues</span>
            <span className="font-medium">
              {health.queues.total} total
              {health.queues.paused > 0 && <span className="text-amber-500 ml-1">({health.queues.paused} paused)</span>}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
