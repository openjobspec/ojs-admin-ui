import { useEffect, useRef, useCallback, useState } from 'react';
import { useClient } from '@/hooks/useAppContext';
import type {
  ConnectionInfo,
  RealtimeMetrics,
  ThroughputSample,
  ErrorRateSample,
  JobEvent,
  UseRealtimeMetricsOptions,
  SSEMetricsData,
} from '@/types/realtime';

const DEFAULT_POLL_INTERVAL = 3000;
const DEFAULT_MAX_SAMPLES = 60;
const DEFAULT_MAX_RECONNECT = 10;
const BASE_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

function reconnectDelay(attempt: number): number {
  const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(2, attempt), MAX_RECONNECT_DELAY);
  // Add jitter ±25%
  return delay * (0.75 + Math.random() * 0.5);
}

const INITIAL_METRICS: RealtimeMetrics = {
  queueDepths: [],
  throughput: [],
  workers: [],
  errorRate: [],
  totalActiveJobs: 0,
  totalWorkers: 0,
};

const INITIAL_CONNECTION: ConnectionInfo = {
  state: 'disconnected',
  transport: 'polling',
  reconnectAttempt: 0,
  lastConnectedAt: null,
  error: null,
};

export function useRealtimeMetrics(options: UseRealtimeMetricsOptions = {}) {
  const {
    sseUrl = '/ojs/v1/admin/stats/stream',
    pollInterval = DEFAULT_POLL_INTERVAL,
    maxSamples = DEFAULT_MAX_SAMPLES,
    maxReconnectAttempts = DEFAULT_MAX_RECONNECT,
    enabled = true,
  } = options;

  const client = useClient();
  const [metrics, setMetrics] = useState<RealtimeMetrics>(INITIAL_METRICS);
  const [connection, setConnection] = useState<ConnectionInfo>(INITIAL_CONNECTION);
  const [events, setEvents] = useState<JobEvent[]>([]);

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const reconnectAttemptRef = useRef(0);
  const mountedRef = useRef(true);
  const prevProcessedRef = useRef<number | null>(null);
  const prevFailedRef = useRef<number | null>(null);
  const prevTimestampRef = useRef<number | null>(null);

  const appendSample = useCallback(
    <T>(arr: T[], sample: T) => {
      const next = [...arr, sample];
      return next.length > maxSamples ? next.slice(-maxSamples) : next;
    },
    [maxSamples],
  );

  const processMetricsData = useCallback(
    (data: SSEMetricsData) => {
      const now = Date.now();

      const throughputSample: ThroughputSample = {
        timestamp: now,
        processedPerSec: data.throughput.processed_per_second,
        failedPerSec: data.throughput.failed_per_second,
        enqueuedPerSec: data.throughput.enqueued_per_second,
      };

      const totalErrors = data.queues.reduce((sum, q) => sum + q.retryable, 0);
      const totalJobs = data.queues.reduce(
        (sum, q) => sum + q.available + q.active + q.scheduled + q.retryable,
        0,
      );
      const errorRate = totalJobs > 0 ? data.error_rate : 0;

      // Simple anomaly: error rate > 2x average of recent samples
      const errorSample: ErrorRateSample = {
        timestamp: now,
        errorRate,
        totalErrors,
        isAnomaly: false,
      };

      setMetrics((prev) => {
        const recentRates = prev.errorRate.slice(-10).map((s) => s.errorRate);
        const avgRate = recentRates.length > 0
          ? recentRates.reduce((a, b) => a + b, 0) / recentRates.length
          : 0;
        errorSample.isAnomaly = avgRate > 0 && errorRate > avgRate * 2;

        return {
          queueDepths: data.queues,
          throughput: appendSample(prev.throughput, throughputSample),
          workers: data.workers.active,
          errorRate: appendSample(prev.errorRate, errorSample),
          totalActiveJobs: data.queues.reduce((s, q) => s + q.active, 0),
          totalWorkers: data.workers.total,
        };
      });
    },
    [appendSample],
  );

  const processPolledStats = useCallback(
    (stats: { jobs: Record<string, number>; throughput: { processed_per_minute: number; failed_per_minute: number }; workers: number; queues: number }) => {
      const now = Date.now();
      const processedPerSec = stats.throughput.processed_per_minute / 60;
      const failedPerSec = stats.throughput.failed_per_minute / 60;

      // Derive per-second rates from delta if we have previous data
      let derivedProcessed = processedPerSec;
      let derivedFailed = failedPerSec;
      const completed = stats.jobs.completed ?? 0;
      const discarded = stats.jobs.discarded ?? 0;
      if (prevTimestampRef.current !== null && prevProcessedRef.current !== null && prevFailedRef.current !== null) {
        const dt = (now - prevTimestampRef.current) / 1000;
        if (dt > 0) {
          derivedProcessed = Math.max(0, (completed - prevProcessedRef.current) / dt) || processedPerSec;
          derivedFailed = Math.max(0, (discarded - prevFailedRef.current) / dt) || failedPerSec;
        }
      }
      prevProcessedRef.current = completed;
      prevFailedRef.current = discarded;
      prevTimestampRef.current = now;

      const throughputSample: ThroughputSample = {
        timestamp: now,
        processedPerSec: derivedProcessed,
        failedPerSec: derivedFailed,
        enqueuedPerSec: 0,
      };

      const totalActive = (stats.jobs.available ?? 0) + (stats.jobs.active ?? 0) + (stats.jobs.scheduled ?? 0) + (stats.jobs.retryable ?? 0);
      const errorRate = totalActive > 0
        ? ((stats.jobs.discarded ?? 0) / ((stats.jobs.completed ?? 0) + (stats.jobs.discarded ?? 0) || 1)) * 100
        : 0;

      const errorSample: ErrorRateSample = {
        timestamp: now,
        errorRate,
        totalErrors: stats.jobs.discarded ?? 0,
        isAnomaly: false,
      };

      setMetrics((prev) => {
        const recentRates = prev.errorRate.slice(-10).map((s) => s.errorRate);
        const avgRate = recentRates.length > 0
          ? recentRates.reduce((a, b) => a + b, 0) / recentRates.length
          : 0;
        errorSample.isAnomaly = avgRate > 0 && errorRate > avgRate * 2;

        return {
          ...prev,
          throughput: appendSample(prev.throughput, throughputSample),
          errorRate: appendSample(prev.errorRate, errorSample),
          totalActiveJobs: stats.jobs.active ?? 0,
          totalWorkers: stats.workers,
        };
      });
    },
    [appendSample],
  );

  // Also poll queue depths separately for polling fallback
  const pollQueues = useCallback(async () => {
    try {
      const res = await client.queues(1, 100);
      setMetrics((prev) => ({
        ...prev,
        queueDepths: res.items.map((q) => ({
          queue: q.name,
          available: q.counts.available,
          active: q.counts.active,
          scheduled: q.counts.scheduled,
          retryable: q.counts.retryable,
        })),
      }));
    } catch {
      // Queue polling failure is non-fatal
    }
  }, [client]);

  // SSE connection
  const connectSSE = useCallback(() => {
    if (!mountedRef.current) return;

    setConnection((prev) => ({
      ...prev,
      state: 'connecting',
      transport: 'sse',
      reconnectAttempt: reconnectAttemptRef.current,
      error: null,
    }));

    const baseUrl = (client as unknown as { baseUrl: string }).baseUrl ?? '';
    const es = new EventSource(`${baseUrl}${sseUrl}`);
    eventSourceRef.current = es;

    es.onopen = () => {
      if (!mountedRef.current) return;
      reconnectAttemptRef.current = 0;
      setConnection({
        state: 'connected',
        transport: 'sse',
        reconnectAttempt: 0,
        lastConnectedAt: Date.now(),
        error: null,
      });
    };

    es.addEventListener('metrics', (e: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const data: SSEMetricsData = JSON.parse(e.data);
        processMetricsData(data);
      } catch {
        // Ignore malformed events
      }
    });

    const jobEventTypes = ['job.enqueued', 'job.completed', 'job.failed', 'job.cancelled'] as const;
    for (const eventType of jobEventTypes) {
      es.addEventListener(eventType, (e: MessageEvent) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(e.data);
          const jobEvent: JobEvent = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            eventType: eventType.replace('job.', '') as JobEvent['eventType'],
            jobId: data.job_id ?? data.id,
            jobType: data.type ?? data.job_type ?? 'unknown',
            queue: data.queue ?? 'default',
            timestamp: data.timestamp ?? new Date().toISOString(),
            duration: data.duration,
            error: data.error,
            attempt: data.attempt,
          };
          setEvents((prev) => [jobEvent, ...prev].slice(0, 200));
        } catch {
          // Ignore malformed events
        }
      });
    }

    es.onerror = () => {
      if (!mountedRef.current) return;
      es.close();
      eventSourceRef.current = null;

      if (reconnectAttemptRef.current < maxReconnectAttempts) {
        const delay = reconnectDelay(reconnectAttemptRef.current);
        reconnectAttemptRef.current += 1;
        setConnection((prev) => ({
          ...prev,
          state: 'disconnected',
          reconnectAttempt: reconnectAttemptRef.current,
          error: 'Connection lost, reconnecting…',
        }));
        reconnectTimerRef.current = setTimeout(connectSSE, delay);
      } else {
        // Fall back to polling
        setConnection({
          state: 'connected',
          transport: 'polling',
          reconnectAttempt: 0,
          lastConnectedAt: Date.now(),
          error: null,
        });
        startPolling();
      }
    };
  }, [client, sseUrl, maxReconnectAttempts, processMetricsData]);

  // Polling fallback
  const startPolling = useCallback(() => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    const poll = async () => {
      if (!mountedRef.current) return;
      try {
        const stats = await client.stats();
        processPolledStats(stats as unknown as Parameters<typeof processPolledStats>[0]);
        await pollQueues();
        setConnection((prev) =>
          prev.transport === 'polling'
            ? { ...prev, state: 'connected', lastConnectedAt: Date.now(), error: null }
            : prev,
        );
      } catch (e) {
        if (!mountedRef.current) return;
        setConnection((prev) =>
          prev.transport === 'polling'
            ? { ...prev, state: 'error', error: e instanceof Error ? e.message : 'Poll failed' }
            : prev,
        );
      }
    };

    poll();
    pollTimerRef.current = setInterval(poll, pollInterval);
  }, [client, pollInterval, processPolledStats, pollQueues]);

  // Cleanup helper
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = undefined;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) {
      cleanup();
      return;
    }

    // Try SSE first, fall back to polling on initial failure
    try {
      if (typeof EventSource !== 'undefined') {
        connectSSE();
      } else {
        startPolling();
      }
    } catch {
      startPolling();
    }

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [enabled, connectSSE, startPolling, cleanup]);

  const disconnect = useCallback(() => {
    cleanup();
    setConnection(INITIAL_CONNECTION);
  }, [cleanup]);

  const reconnect = useCallback(() => {
    cleanup();
    reconnectAttemptRef.current = 0;
    if (typeof EventSource !== 'undefined') {
      connectSSE();
    } else {
      startPolling();
    }
  }, [cleanup, connectSSE, startPolling]);

  return {
    metrics,
    connection,
    events,
    disconnect,
    reconnect,
  };
}
