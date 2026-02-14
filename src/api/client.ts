import type {
  AggregateStats,
  BulkResult,
  DeadLetterStats,
  HistoryDataPoint,
  JobDetail,
  JobFilter,
  JobSummary,
  OJSManifest,
  PaginatedResponse,
  QueueDetail,
  QueueSummary,
  WorkerListResponse,
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
  health(): Promise<{ status: string; version?: string; uptime_seconds?: number }> {
    return this.request('/ojs/v1/health');
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
