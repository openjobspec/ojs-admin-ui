// Real-time metric and event types for the OJS Admin UI

// -- Connection --

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

export type TransportType = 'sse' | 'websocket' | 'polling';

export interface ConnectionInfo {
  state: ConnectionState;
  transport: TransportType;
  reconnectAttempt: number;
  lastConnectedAt: number | null;
  error: string | null;
}

// -- Metrics --

export interface QueueDepth {
  queue: string;
  available: number;
  active: number;
  scheduled: number;
  retryable: number;
}

export interface ThroughputSample {
  timestamp: number;
  processedPerSec: number;
  failedPerSec: number;
  enqueuedPerSec: number;
}

export interface WorkerStatus {
  id: string;
  state: 'running' | 'quiet' | 'stale';
  activeJobs: number;
  lastHeartbeatAt: string;
}

export interface ErrorRateSample {
  timestamp: number;
  errorRate: number;
  totalErrors: number;
  isAnomaly: boolean;
}

export interface RealtimeMetrics {
  queueDepths: QueueDepth[];
  throughput: ThroughputSample[];
  workers: WorkerStatus[];
  errorRate: ErrorRateSample[];
  totalActiveJobs: number;
  totalWorkers: number;
}

// -- SSE Event Types --

export type SSEEventType =
  | 'metrics'
  | 'job.enqueued'
  | 'job.completed'
  | 'job.failed'
  | 'job.cancelled'
  | 'worker.joined'
  | 'worker.left'
  | 'queue.paused'
  | 'queue.resumed';

export interface SSEEvent<T = unknown> {
  type: SSEEventType;
  timestamp: string;
  data: T;
}

export interface SSEMetricsData {
  queues: QueueDepth[];
  throughput: { processed_per_second: number; failed_per_second: number; enqueued_per_second: number };
  workers: { total: number; active: WorkerStatus[] };
  error_rate: number;
}

// -- WebSocket Message Types --

export type WSMessageType = 'subscribe' | 'unsubscribe' | 'metrics' | 'event' | 'ping' | 'pong';

export interface WSMessage<T = unknown> {
  type: WSMessageType;
  channel?: string;
  data?: T;
  timestamp?: string;
}

export interface WSSubscribeMessage {
  type: 'subscribe';
  channel: string;
}

export interface WSMetricsMessage {
  type: 'metrics';
  data: SSEMetricsData;
  timestamp: string;
}

export interface WSEventMessage {
  type: 'event';
  data: JobEvent;
  timestamp: string;
}

// -- Job Events --

export type JobEventType = 'enqueued' | 'completed' | 'failed' | 'cancelled';

export interface JobEvent {
  id: string;
  eventType: JobEventType;
  jobId: string;
  jobType: string;
  queue: string;
  timestamp: string;
  duration?: number;
  error?: string;
  attempt?: number;
}

// -- Hook Options --

export interface UseRealtimeMetricsOptions {
  /** SSE endpoint URL (relative to baseUrl) */
  sseUrl?: string;
  /** WebSocket endpoint URL */
  wsUrl?: string;
  /** Polling interval fallback in ms (default: 3000) */
  pollInterval?: number;
  /** Max number of throughput/error samples to keep (default: 60) */
  maxSamples?: number;
  /** Max reconnect attempts before giving up (default: 10) */
  maxReconnectAttempts?: number;
  /** Enable/disable the hook */
  enabled?: boolean;
}
