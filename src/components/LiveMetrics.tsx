import { memo, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
} from 'recharts';
import type { ConnectionInfo, RealtimeMetrics, QueueDepth } from '@/types/realtime';
import { cn } from '@/lib/formatting';

// -- Connection Status Indicator --

const CONNECTION_STYLES: Record<string, { dot: string; label: string }> = {
  connected: { dot: 'bg-green-500', label: 'Connected' },
  connecting: { dot: 'bg-yellow-500 animate-pulse', label: 'Connecting…' },
  disconnected: { dot: 'bg-red-500', label: 'Disconnected' },
  error: { dot: 'bg-red-500', label: 'Error' },
};

const DEFAULT_STYLE = { dot: 'bg-red-500', label: 'Disconnected' };

export const ConnectionIndicator = memo(function ConnectionIndicator({
  connection,
  onReconnect,
}: {
  connection: ConnectionInfo;
  onReconnect?: () => void;
}) {
  const style = CONNECTION_STYLES[connection.state] ?? DEFAULT_STYLE;

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <span className={cn('w-2 h-2 rounded-full', style.dot)} aria-label={style.label} />
      <span>{style.label}</span>
      {connection.transport !== 'sse' && connection.state === 'connected' && (
        <span className="text-gray-400">(polling)</span>
      )}
      {connection.reconnectAttempt > 0 && connection.state !== 'connected' && (
        <span className="text-gray-400">retry #{connection.reconnectAttempt}</span>
      )}
      {(connection.state === 'disconnected' || connection.state === 'error') && onReconnect && (
        <button
          onClick={onReconnect}
          className="ml-1 text-blue-500 hover:text-blue-700 underline"
        >
          Reconnect
        </button>
      )}
    </div>
  );
});

// -- Throughput Chart --

export const ThroughputLiveChart = memo(function ThroughputLiveChart({
  data,
}: {
  data: RealtimeMetrics['throughput'];
}) {
  const formatted = useMemo(
    () =>
      data.map((s) => ({
        time: new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        processed: Number(s.processedPerSec.toFixed(2)),
        failed: Number(s.failedPerSec.toFixed(2)),
        enqueued: Number(s.enqueuedPerSec.toFixed(2)),
      })),
    [data],
  );

  if (formatted.length === 0) {
    return <p className="text-sm text-gray-500">Waiting for data…</p>;
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="rtProcessed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="rtFailed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="rtEnqueued" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10 }} width={40} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="enqueued" stroke="#3B82F6" fill="url(#rtEnqueued)" strokeWidth={1.5} name="Enqueued/s" />
          <Area type="monotone" dataKey="processed" stroke="#22C55E" fill="url(#rtProcessed)" strokeWidth={2} name="Processed/s" />
          <Area type="monotone" dataKey="failed" stroke="#EF4444" fill="url(#rtFailed)" strokeWidth={2} name="Failed/s" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

// -- Queue Depth Sparklines --

function SparklineBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 truncate text-gray-600 dark:text-gray-400" title={label}>{label}</span>
      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-gray-500 tabular-nums">{value}</span>
    </div>
  );
}

export const QueueDepthSparklines = memo(function QueueDepthSparklines({
  queues,
}: {
  queues: QueueDepth[];
}) {
  const maxDepth = useMemo(
    () => Math.max(1, ...queues.map((q) => q.available + q.active + q.scheduled + q.retryable)),
    [queues],
  );

  if (queues.length === 0) {
    return <p className="text-sm text-gray-500">No queue data.</p>;
  }

  return (
    <div className="space-y-2">
      {queues.slice(0, 10).map((q) => {
        const total = q.available + q.active + q.scheduled + q.retryable;
        return (
          <div key={q.queue} className="space-y-1">
            <SparklineBar label={q.queue} value={total} max={maxDepth} color="bg-blue-500" />
            <div className="flex gap-3 ml-22 text-[10px] text-gray-400">
              <span>avail: {q.available}</span>
              <span>active: {q.active}</span>
              <span>sched: {q.scheduled}</span>
              {q.retryable > 0 && <span className="text-amber-500">retry: {q.retryable}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
});

// -- Active Workers --

export const ActiveWorkers = memo(function ActiveWorkers({
  workers,
  totalWorkers,
}: {
  workers: RealtimeMetrics['workers'];
  totalWorkers: number;
}) {
  const STATE_COLORS: Record<string, string> = {
    running: 'bg-green-500',
    quiet: 'bg-yellow-500',
    stale: 'bg-red-500',
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalWorkers}</span>
        <span className="text-sm text-gray-500">workers</span>
      </div>
      {workers.length > 0 ? (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {workers.map((w) => (
            <div key={w.id} className="flex items-center gap-2 text-xs">
              <span
                className={cn('w-2 h-2 rounded-full flex-shrink-0', STATE_COLORS[w.state] ?? 'bg-gray-400')}
                title={w.state}
              />
              <span className="truncate text-gray-700 dark:text-gray-300 flex-1" title={w.id}>
                {w.id.slice(0, 12)}…
              </span>
              <span className="text-gray-500 tabular-nums">{w.activeJobs} jobs</span>
              <span className={cn(
                'px-1.5 py-0.5 rounded text-[10px] font-medium',
                w.state === 'running' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                w.state === 'quiet' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
              )}>
                {w.state}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No worker details available.</p>
      )}
    </div>
  );
});

// -- Error Rate Chart --

export const ErrorRateChart = memo(function ErrorRateChart({
  data,
}: {
  data: RealtimeMetrics['errorRate'];
}) {
  const formatted = useMemo(
    () =>
      data.map((s) => ({
        time: new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        errorRate: Number(s.errorRate.toFixed(2)),
        isAnomaly: s.isAnomaly,
      })),
    [data],
  );

  const avgRate = useMemo(() => {
    if (data.length === 0) return 0;
    return data.reduce((sum, s) => sum + s.errorRate, 0) / data.length;
  }, [data]);

  if (formatted.length === 0) {
    return <p className="text-sm text-gray-500">Waiting for data…</p>;
  }

  const hasAnomalies = data.some((s) => s.isAnomaly);

  return (
    <div>
      {hasAnomalies && (
        <div className="mb-2 px-2 py-1 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-xs text-red-600 dark:text-red-400">
          ⚠ Anomaly detected — error rate spike above 2× average
        </div>
      )}
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} width={40} unit="%" />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            {avgRate > 0 && (
              <ReferenceLine y={avgRate} stroke="#9CA3AF" strokeDasharray="3 3" label={{ value: 'avg', fontSize: 10, fill: '#9CA3AF' }} />
            )}
            <Line
              type="monotone"
              dataKey="errorRate"
              stroke="#EF4444"
              strokeWidth={2}
              dot={(props: Record<string, unknown>) => {
                const { cx, cy, payload } = props as { cx: number; cy: number; payload: { isAnomaly: boolean } };
                if (!payload?.isAnomaly) return <circle key={`dot-${cx}`} cx={cx} cy={cy} r={0} />;
                return (
                  <circle
                    key={`anomaly-${cx}`}
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill="#EF4444"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                );
              }}
              name="Error Rate %"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

// -- Composite LiveMetrics Panel --

interface LiveMetricsProps {
  metrics: RealtimeMetrics;
  connection: ConnectionInfo;
  onReconnect?: () => void;
}

export const LiveMetrics = memo(function LiveMetrics({ metrics, connection, onReconnect }: LiveMetricsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Live Metrics</h2>
        <ConnectionIndicator connection={connection} onReconnect={onReconnect} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
            Real-time Throughput (jobs/sec)
          </h3>
          <ThroughputLiveChart data={metrics.throughput} />
        </section>

        <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Error Rate</h3>
          <ErrorRateChart data={metrics.errorRate} />
        </section>

        <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Queue Depths</h3>
          <QueueDepthSparklines queues={metrics.queueDepths} />
        </section>

        <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Active Workers</h3>
          <ActiveWorkers workers={metrics.workers} totalWorkers={metrics.totalWorkers} />
        </section>
      </div>
    </div>
  );
});

export default LiveMetrics;
