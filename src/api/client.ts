import type {
  AggregateStats,
  BulkResult,
  CronJob,
  DeadLetterStats,
  HealthStatus,
  HistoryDataPoint,
  JobDetail,
  JobFilter,
  JobProgress,
  JobResult,
  JobSchema,
  JobSummary,
  MaintenanceStatus,
  MiddlewareEntry,
  OJSEvent,
  OJSManifest,
  PaginatedResponse,
  PriorityStats,
  QueueDetail,
  QueueSummary,
  RateLimitInfo,
  SchedulingStats,
  Tenant,
  UniqueJobInfo,
  WebhookSubscription,
  WorkerListResponse,
  WorkerPool,
  WorkflowDetail,
  WorkflowProgress,
  WorkflowSummary,
} from './types';

export class OJSAdminClient {
  constructor(private baseUrl: string = '') {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiRequestError(res.status, body?.error?.message ?? res.statusText, body?.error?.code);
    }
    if (res.status === 204) return undefined as T;
    return res.json();
  }

  // -- Manifest --
  manifest(): Promise<OJSManifest> {
    return this.request('/ojs/manifest');
  }

  // -- Stats --
  stats(): Promise<AggregateStats> {
    return this.request('/ojs/v1/admin/stats');
  }

  statsHistory(period = '5m', since?: string, queue?: string): Promise<{ period: string; data: HistoryDataPoint[] }> {
    const params = new URLSearchParams({ period });
    if (since) params.set('since', since);
    if (queue) params.set('queue', queue);
    return this.request(`/ojs/v1/admin/stats/history?${params}`);
  }

  // -- Queues --
  queues(page = 1, perPage = 50): Promise<PaginatedResponse<QueueSummary>> {
    return this.request(`/ojs/v1/admin/queues?page=${page}&per_page=${perPage}`);
  }

  queue(name: string): Promise<QueueDetail> {
    return this.request(`/ojs/v1/admin/queues/${encodeURIComponent(name)}`);
  }

  pauseQueue(name: string): Promise<void> {
    return this.request(`/ojs/v1/admin/queues/${encodeURIComponent(name)}/pause`, { method: 'POST' });
  }

  resumeQueue(name: string): Promise<void> {
    return this.request(`/ojs/v1/admin/queues/${encodeURIComponent(name)}/resume`, { method: 'POST' });
  }

  purgeQueue(name: string, states: string[], olderThan?: string): Promise<{ purged_count: number }> {
    return this.request(`/ojs/v1/admin/queues/${encodeURIComponent(name)}/jobs`, {
      method: 'DELETE',
      body: JSON.stringify({ states, older_than: olderThan, confirm: true }),
    });
  }

  // -- Jobs --
  jobs(params: {
    queue?: string;
    state?: string;
    type?: string;
    since?: string;
    until?: string;
    page?: number;
    per_page?: number;
    sort?: string;
    order?: string;
  } = {}): Promise<PaginatedResponse<JobSummary>> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined) qs.set(k, String(v)); });
    return this.request(`/ojs/v1/admin/jobs?${qs}`);
  }

  job(id: string): Promise<JobDetail> {
    return this.request(`/ojs/v1/admin/jobs/${encodeURIComponent(id)}`);
  }

  retryJob(id: string): Promise<void> {
    return this.request(`/ojs/v1/admin/jobs/${encodeURIComponent(id)}/retry`, { method: 'POST' });
  }

  cancelJob(id: string): Promise<void> {
    return this.request(`/ojs/v1/admin/jobs/${encodeURIComponent(id)}/cancel`, { method: 'POST' });
  }

  bulkRetry(filter: JobFilter): Promise<BulkResult> {
    return this.request('/ojs/v1/admin/jobs/bulk/retry', {
      method: 'POST',
      body: JSON.stringify({ filter, confirm: true }),
    });
  }

  bulkCancel(filter: JobFilter): Promise<BulkResult> {
    return this.request('/ojs/v1/admin/jobs/bulk/cancel', {
      method: 'POST',
      body: JSON.stringify({ filter, confirm: true }),
    });
  }

  // -- Workers --
  workers(page = 1, perPage = 50): Promise<WorkerListResponse> {
    return this.request(`/ojs/v1/admin/workers?page=${page}&per_page=${perPage}`);
  }

  quietWorker(id: string): Promise<void> {
    return this.request(`/ojs/v1/admin/workers/${encodeURIComponent(id)}/quiet`, { method: 'POST' });
  }

  deregisterWorker(id: string): Promise<void> {
    return this.request(`/ojs/v1/admin/workers/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  // -- Dead Letter --
  deadLetter(params: {
    queue?: string;
    type?: string;
    page?: number;
    per_page?: number;
  } = {}): Promise<PaginatedResponse<JobSummary>> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined) qs.set(k, String(v)); });
    return this.request(`/ojs/v1/admin/dead-letter?${qs}`);
  }

  deadLetterStats(): Promise<DeadLetterStats> {
    return this.request('/ojs/v1/admin/dead-letter/stats');
  }

  retryDeadLetter(id: string): Promise<void> {
    return this.request(`/ojs/v1/admin/dead-letter/${encodeURIComponent(id)}/retry`, { method: 'POST' });
  }

  deleteDeadLetter(id: string): Promise<void> {
    return this.request(`/ojs/v1/admin/dead-letter/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  bulkRetryDeadLetter(filter: JobFilter): Promise<BulkResult> {
    return this.request('/ojs/v1/admin/dead-letter/retry', {
      method: 'POST',
      body: JSON.stringify({ filter, confirm: true }),
    });
  }

  // -- Health --
  health(): Promise<HealthStatus> {
    return this.request('/ojs/v1/health');
  }

  // -- Cron Jobs --
  crons(page = 1, perPage = 50): Promise<PaginatedResponse<CronJob>> {
    return this.request(`/ojs/v1/crons?page=${page}&per_page=${perPage}`);
  }

  cron(id: string): Promise<CronJob> {
    return this.request(`/ojs/v1/crons/${encodeURIComponent(id)}`);
  }

  toggleCron(id: string, enabled: boolean): Promise<CronJob> {
    return this.request(`/ojs/v1/crons/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    });
  }

  deleteCron(id: string): Promise<void> {
    return this.request(`/ojs/v1/crons/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  // -- Workflows --
  workflows(params: {
    state?: string;
    page?: number;
    per_page?: number;
  } = {}): Promise<PaginatedResponse<WorkflowSummary>> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined) qs.set(k, String(v)); });
    return this.request(`/ojs/v1/workflows?${qs}`);
  }

  workflow(id: string): Promise<WorkflowDetail> {
    return this.request(`/ojs/v1/workflows/${encodeURIComponent(id)}`);
  }

  cancelWorkflow(id: string): Promise<void> {
    return this.request(`/ojs/v1/workflows/${encodeURIComponent(id)}/cancel`, { method: 'POST' });
  }

  // -- Job Progress --
  jobProgress(id: string): Promise<JobProgress> {
    return this.request(`/ojs/v1/jobs/${encodeURIComponent(id)}/progress`);
  }

  // -- Rate Limits --
  rateLimits(page = 1, perPage = 50): Promise<PaginatedResponse<RateLimitInfo>> {
    return this.request(`/ojs/v1/rate-limits?page=${page}&per_page=${perPage}`);
  }

  rateLimit(key: string): Promise<RateLimitInfo> {
    return this.request(`/ojs/v1/rate-limits/${encodeURIComponent(key)}`);
  }

  overrideRateLimit(key: string, limit: number, period: string, expiresAt?: string): Promise<RateLimitInfo> {
    return this.request(`/ojs/v1/rate-limits/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify({ limit, period, expires_at: expiresAt }),
    });
  }

  deleteRateLimitOverride(key: string): Promise<void> {
    return this.request(`/ojs/v1/rate-limits/${encodeURIComponent(key)}/override`, { method: 'DELETE' });
  }

  // -- Queue Config --
  updateQueueConfig(name: string, config: {
    concurrency?: number;
    rate_limit?: { limit: number; period: string };
    retention?: { completed?: string; discarded?: string };
  }): Promise<QueueDetail> {
    return this.request(`/ojs/v1/admin/queues/${encodeURIComponent(name)}/config`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  // -- Priority --
  priorityStats(queue: string): Promise<PriorityStats> {
    return this.request(`/ojs/v1/queues/${encodeURIComponent(queue)}/priority-stats`);
  }

  updateJobPriority(id: string, priority: number): Promise<void> {
    return this.request(`/ojs/v1/admin/jobs/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ priority }),
    });
  }

  // -- Events --
  events(params: {
    type?: string;
    since?: string;
    page?: number;
    per_page?: number;
  } = {}): Promise<PaginatedResponse<OJSEvent>> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined) qs.set(k, String(v)); });
    return this.request(`/ojs/v1/events?${qs}`);
  }

  // -- Unique Jobs --
  uniqueJobs(page = 1, perPage = 50): Promise<PaginatedResponse<UniqueJobInfo>> {
    return this.request(`/ojs/v1/unique-jobs?page=${page}&per_page=${perPage}`);
  }

  // -- Middleware --
  middleware(): Promise<{ enqueue: MiddlewareEntry[]; execution: MiddlewareEntry[] }> {
    return this.request('/ojs/v1/middleware');
  }

  // -- Webhooks --
  webhooks(page = 1, perPage = 50): Promise<PaginatedResponse<WebhookSubscription>> {
    return this.request(`/ojs/v1/webhooks/subscriptions?page=${page}&per_page=${perPage}`);
  }

  webhook(id: string): Promise<WebhookSubscription> {
    return this.request(`/ojs/v1/webhooks/subscriptions/${encodeURIComponent(id)}`);
  }

  createWebhook(data: { url: string; events: string[]; secret?: string; metadata?: Record<string, unknown> }): Promise<WebhookSubscription> {
    return this.request('/ojs/v1/webhooks/subscriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateWebhook(id: string, data: { url?: string; events?: string[]; active?: boolean }): Promise<WebhookSubscription> {
    return this.request(`/ojs/v1/webhooks/subscriptions/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteWebhook(id: string): Promise<void> {
    return this.request(`/ojs/v1/webhooks/subscriptions/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  testWebhook(id: string): Promise<{ status: number; response_time_ms: number }> {
    return this.request(`/ojs/v1/webhooks/subscriptions/${encodeURIComponent(id)}/test`, { method: 'POST' });
  }

  // -- Tenants --
  tenants(page = 1, perPage = 50): Promise<PaginatedResponse<Tenant>> {
    return this.request(`/ojs/v1/admin/tenants?page=${page}&per_page=${perPage}`);
  }

  tenant(id: string): Promise<Tenant> {
    return this.request(`/ojs/v1/admin/tenants/${encodeURIComponent(id)}`);
  }

  tenantJobs(id: string, params: { state?: string; page?: number; per_page?: number } = {}): Promise<PaginatedResponse<JobSummary>> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined) qs.set(k, String(v)); });
    return this.request(`/ojs/v1/admin/tenants/${encodeURIComponent(id)}/jobs?${qs}`);
  }

  // -- Worker Pools --
  workerPools(): Promise<{ pools: WorkerPool[] }> {
    return this.request('/ojs/v1/admin/pools');
  }

  schedulingStats(): Promise<SchedulingStats> {
    return this.request('/ojs/v1/admin/scheduling/stats');
  }

  // -- Job Schemas / Versioning --
  jobSchemas(): Promise<{ schemas: JobSchema[] }> {
    return this.request('/ojs/v1/admin/schemas');
  }

  jobSchema(type: string): Promise<JobSchema> {
    return this.request(`/ojs/v1/admin/schemas/${encodeURIComponent(type)}`);
  }

  // -- Maintenance Mode --
  maintenanceStatus(): Promise<MaintenanceStatus> {
    return this.request('/ojs/v1/admin/system/maintenance');
  }

  setMaintenance(enabled: boolean, reason?: string, duration?: string): Promise<MaintenanceStatus> {
    return this.request('/ojs/v1/admin/system/maintenance', {
      method: 'POST',
      body: JSON.stringify({ enabled, reason, duration }),
    });
  }

  // -- Workflow Progress --
  workflowProgress(id: string): Promise<WorkflowProgress> {
    return this.request(`/ojs/v1/workflows/${encodeURIComponent(id)}/progress`);
  }

  // -- Job Result --
  jobResult(id: string): Promise<JobResult> {
    return this.request(`/ojs/v1/jobs/${encodeURIComponent(id)}/result`);
  }

  // -- SSE Progress Stream URL --
  jobProgressStreamUrl(id: string): string {
    return `${this.baseUrl}/ojs/v1/jobs/${encodeURIComponent(id)}/progress/stream`;
  }
}

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}
