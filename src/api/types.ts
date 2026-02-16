// Types derived from ojs-admin-api.md and ojs-conformance.md

// -- Manifest --
export interface OJSManifest {
  ojs_version?: string;
  specversion?: string;
  implementation: {
    name: string;
    version: string;
    language: string;
    homepage?: string;
    repository?: string;
  };
  conformance_level: number;
  conformance_tier?: string;
  protocols: string[];
  backend: string;
  capabilities?: Record<string, boolean>;
  extensions?:
    | { official?: ExtensionEntry[]; experimental?: ExtensionEntry[] }
    | string[];
}

export interface ExtensionEntry {
  name: string;
  uri: string;
  version: string;
}

// -- Queue --
export interface QueueSummary {
  name: string;
  state?: string;
  counts: JobCounts;
  throughput?: { processed_per_minute: number; failed_per_minute: number };
  latency_ms?: { p50: number; p95: number; p99: number };
  paused: boolean;
  created_at?: string;
}

export interface QueueDetail extends QueueSummary {
  configuration?: {
    concurrency?: number;
    rate_limit?: { limit: number; period: string };
    retention?: { completed?: string; discarded?: string };
    backpressure?: QueueBackpressure;
  };
  oldest_available_at?: string;
}

export interface JobCounts {
  available: number;
  active: number;
  scheduled: number;
  retryable: number;
  completed: number;
  discarded: number;
  cancelled: number;
}

// -- Job --
export interface JobSummary {
  id: string;
  type: string;
  queue: string;
  state: JobState;
  priority: number;
  attempt: number;
  created_at: string;
  completed_at?: string;
  scheduled_at?: string;
}

export interface JobDetail extends JobSummary {
  specversion?: string;
  args: unknown[];
  meta: Record<string, unknown>;
  max_attempts?: number;
  retry_policy?: Record<string, unknown>;
  errors: JobError[];
  result?: unknown;
  metadata?: {
    created_at: string;
    enqueued_at?: string;
    started_at?: string;
    scheduled_at?: string;
    completed_at?: string;
    cancelled_at?: string;
    discarded_at?: string;
  };
}

export interface JobError {
  code: string;
  message: string;
  type?: string;
  attempt: number;
  occurred_at: string;
  backtrace?: string[];
}

export type JobState =
  | 'available'
  | 'scheduled'
  | 'pending'
  | 'active'
  | 'completed'
  | 'retryable'
  | 'cancelled'
  | 'discarded';

// -- Worker --
export interface WorkerSummary {
  id: string;
  hostname?: string;
  state: 'running' | 'quiet' | 'stale' | 'terminate';
  queues: string[];
  concurrency?: number;
  active_jobs: number;
  started_at: string;
  last_heartbeat_at: string;
  version?: string;
  metadata?: Record<string, unknown>;
}

export interface WorkerListResponse {
  items: WorkerSummary[];
  summary?: { total: number; running: number; quiet: number; stale: number };
  pagination: Pagination;
}

// -- Stats --
export interface AggregateStats {
  queues: number;
  workers: number;
  jobs: JobCounts;
  throughput: { processed_per_minute: number; failed_per_minute: number };
  uptime_seconds?: number;
}

export interface HistoryDataPoint {
  timestamp: string;
  processed: number;
  failed: number;
  enqueued: number;
  latency_p50_ms?: number;
  latency_p99_ms?: number;
}

// -- Dead Letter --
export interface DeadLetterStats {
  total: number;
  by_queue?: Record<string, number>;
  by_error_type?: Record<string, number>;
  oldest_at?: string;
  newest_at?: string;
}

// -- Bulk --
export interface BulkResult {
  action: string;
  matched: number;
  succeeded: number;
  failed: number;
  errors?: { job_id: string; error: string }[];
}

export interface JobFilter {
  queue?: string;
  state?: JobState;
  type?: string;
  since?: string;
  until?: string;
}

// -- Common --
export interface Pagination {
  total: number;
  page: number;
  per_page: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    [key: string]: unknown;
  };
}

// -- Cron --
export interface CronJob {
  id: string;
  name?: string;
  type: string;
  queue: string;
  schedule: string;
  timezone?: string;
  args?: unknown[];
  meta?: Record<string, unknown>;
  enabled: boolean;
  last_run_at?: string;
  next_run_at?: string;
  created_at: string;
  updated_at?: string;
}

// -- Workflow --
export interface WorkflowSummary {
  id: string;
  name?: string;
  state: 'pending' | 'active' | 'completed' | 'failed' | 'cancelled';
  steps_total: number;
  steps_completed: number;
  created_at: string;
  completed_at?: string;
}

export interface WorkflowDetail extends WorkflowSummary {
  steps: WorkflowStep[];
  meta?: Record<string, unknown>;
}

export interface WorkflowStep {
  id: string;
  type: 'chain' | 'group' | 'batch';
  state: string;
  job_ids?: string[];
  depends_on?: string[];
  completed_at?: string;
}

// -- Progress --
export interface JobProgress {
  job_id: string;
  progress: number;
  data?: Record<string, unknown>;
  updated_at: string;
}

// -- Rate Limit --
export interface RateLimitInfo {
  key: string;
  limit: number;
  period: string;
  active: number;
  waiting: number;
  override?: { limit: number; period: string; expires_at?: string };
}

// -- Priority Stats --
export interface PriorityStats {
  queue: string;
  distribution: { priority: number; count: number }[];
}

// -- Event --
export interface OJSEvent {
  id: string;
  type: string;
  timestamp: string;
  data: Record<string, unknown>;
}

// -- Health --
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version?: string;
  uptime_seconds?: number;
  backend?: { status: string; latency_ms?: number };
  queues?: { total: number; paused: number };
  workers?: { total: number; active: number; stale: number };
}

// -- Middleware --
export interface MiddlewareEntry {
  name: string;
  phase: 'enqueue' | 'execution';
  order: number;
  description?: string;
}

// -- Unique Job --
export interface UniqueJobInfo {
  key: string;
  job_id: string;
  type: string;
  queue: string;
  state: string;
  locked_until?: string;
}

// -- Scheduled Job (enhanced) --
export interface ScheduledJobSummary extends JobSummary {
  scheduled_at: string;
}

// -- Bulk Audit --
export interface BulkAuditEntry {
  id: string;
  action: string;
  filter: JobFilter;
  result: BulkResult;
  performed_at: string;
  performed_by?: string;
}

// -- Webhook --
export interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
  last_delivery_at?: string;
  last_delivery_status?: number;
  failure_count?: number;
}

// -- Tenant --
export interface Tenant {
  id: string;
  name: string;
  state?: 'active' | 'suspended';
  limits?: {
    max_queues?: number;
    max_jobs_per_second?: number;
    max_concurrent_jobs?: number;
  };
  stats?: {
    queues: number;
    jobs: JobCounts;
    workers: number;
  };
  created_at: string;
}

// -- Worker Pool --
export interface WorkerPool {
  id: string;
  name: string;
  queues: string[];
  workers: number;
  active_jobs: number;
  concurrency: number;
  strategy?: string;
}

// -- Scheduling Stats --
export interface SchedulingStats {
  strategy: string;
  queues: { name: string; weight?: number; dispatched: number; starved: boolean }[];
}

// -- Job Schema --
export interface JobSchema {
  type: string;
  version: string;
  schema?: Record<string, unknown>;
  routing?: { strategy: string; versions: { version: string; weight?: number; queue?: string }[] };
  created_at?: string;
}

// -- Maintenance --
export interface MaintenanceStatus {
  enabled: boolean;
  reason?: string;
  started_at?: string;
  ends_at?: string;
}

// -- Workflow Progress --
export interface WorkflowProgress {
  workflow_id: string;
  progress: number;
  steps: { id: string; progress: number; state: string }[];
  updated_at: string;
}

// -- Job Result --
export interface JobResult {
  job_id: string;
  state: JobState;
  result?: unknown;
  error?: JobError;
  completed_at?: string;
}

// -- Queue Backpressure --
export interface QueueBackpressure {
  enabled: boolean;
  strategy?: string;
  threshold?: number;
  current_depth?: number;
  state?: 'normal' | 'warning' | 'critical';
}
