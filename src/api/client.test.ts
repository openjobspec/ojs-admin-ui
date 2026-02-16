import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OJSAdminClient, ApiRequestError } from './client';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function jsonResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: 'OK',
    json: () => Promise.resolve(data),
  });
}

function errorResponse(status: number, body: { error?: { message?: string; code?: string } } = {}) {
  return Promise.resolve({
    ok: false,
    status,
    statusText: 'Error',
    json: () => Promise.resolve(body),
  });
}

describe('OJSAdminClient', () => {
  let client: OJSAdminClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new OJSAdminClient('http://localhost:8080');
  });

  describe('request handling', () => {
    it('prepends baseUrl to all requests', async () => {
      mockFetch.mockReturnValue(jsonResponse({ ojs_version: '1.0' }));
      await client.manifest();
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/ojs/manifest',
        expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) }),
      );
    });

    it('throws ApiRequestError on non-ok response', async () => {
      mockFetch.mockReturnValue(errorResponse(404, { error: { message: 'Not found', code: 'NOT_FOUND' } }));
      await expect(client.manifest()).rejects.toThrow(ApiRequestError);
      try {
        await client.manifest();
      } catch (e) {
        const err = e as ApiRequestError;
        expect(err.status).toBe(404);
        expect(err.message).toBe('Not found');
        expect(err.code).toBe('NOT_FOUND');
      }
    });

    it('handles error responses with no JSON body', async () => {
      mockFetch.mockReturnValue(
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () => Promise.reject(new Error('no json')),
        }),
      );
      await expect(client.manifest()).rejects.toThrow('Internal Server Error');
    });
  });

  describe('manifest', () => {
    it('fetches /ojs/manifest', async () => {
      const data = { implementation: { name: 'test', version: '1.0', language: 'go' } };
      mockFetch.mockReturnValue(jsonResponse(data));
      const result = await client.manifest();
      expect(result).toEqual(data);
    });
  });

  describe('stats', () => {
    it('fetches /ojs/v1/admin/stats', async () => {
      mockFetch.mockReturnValue(jsonResponse({ queues: 3 }));
      const result = await client.stats();
      expect(result).toEqual({ queues: 3 });
    });
  });

  describe('queues', () => {
    it('fetches with pagination params', async () => {
      mockFetch.mockReturnValue(jsonResponse({ items: [], pagination: { total: 0, page: 1, per_page: 50 } }));
      await client.queues(2, 10);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/ojs/v1/admin/queues?page=2&per_page=10',
        expect.anything(),
      );
    });
  });

  describe('jobs', () => {
    it('builds query string from params', async () => {
      mockFetch.mockReturnValue(jsonResponse({ items: [], pagination: { total: 0, page: 1, per_page: 25 } }));
      await client.jobs({ queue: 'default', state: 'active', page: 2 });
      const url = mockFetch.mock.calls[0]![0] as string;
      expect(url).toContain('queue=default');
      expect(url).toContain('state=active');
      expect(url).toContain('page=2');
    });

    it('omits undefined params', async () => {
      mockFetch.mockReturnValue(jsonResponse({ items: [], pagination: { total: 0, page: 1, per_page: 25 } }));
      await client.jobs({ queue: 'default' });
      const url = mockFetch.mock.calls[0]![0] as string;
      expect(url).not.toContain('state=');
    });
  });

  describe('job actions', () => {
    it('retries a job with POST', async () => {
      mockFetch.mockReturnValue(Promise.resolve({ ok: true, status: 204, statusText: 'No Content', json: () => Promise.reject() }));
      await client.retryJob('job-123');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/ojs/v1/admin/jobs/job-123/retry',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('cancels a job with POST', async () => {
      mockFetch.mockReturnValue(Promise.resolve({ ok: true, status: 204, statusText: 'No Content', json: () => Promise.reject() }));
      await client.cancelJob('job-456');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/ojs/v1/admin/jobs/job-456/cancel',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('URL encoding', () => {
    it('encodes queue names in URLs', async () => {
      mockFetch.mockReturnValue(jsonResponse({}));
      await client.queue('my/queue name');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/ojs/v1/admin/queues/my%2Fqueue%20name',
        expect.anything(),
      );
    });
  });

  describe('workers', () => {
    it('quiets a worker with POST', async () => {
      mockFetch.mockReturnValue(Promise.resolve({ ok: true, status: 204, statusText: 'No Content', json: () => Promise.reject() }));
      await client.quietWorker('w-1');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/ojs/v1/admin/workers/w-1/quiet',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('deregisters a worker with DELETE', async () => {
      mockFetch.mockReturnValue(Promise.resolve({ ok: true, status: 204, statusText: 'No Content', json: () => Promise.reject() }));
      await client.deregisterWorker('w-1');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/ojs/v1/admin/workers/w-1',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('crons', () => {
    it('fetches cron jobs with pagination', async () => {
      mockFetch.mockReturnValue(jsonResponse({ items: [], pagination: { total: 0, page: 1, per_page: 50 } }));
      await client.crons(2, 10);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/ojs/v1/crons?page=2&per_page=10',
        expect.anything(),
      );
    });

    it('toggles a cron job with PATCH', async () => {
      mockFetch.mockReturnValue(jsonResponse({ id: 'c-1', enabled: false }));
      await client.toggleCron('c-1', false);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/ojs/v1/crons/c-1',
        expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ enabled: false }) }),
      );
    });

    it('deletes a cron job with DELETE', async () => {
      mockFetch.mockReturnValue(Promise.resolve({ ok: true, status: 204, statusText: 'No Content', json: () => Promise.reject() }));
      await client.deleteCron('c-1');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/ojs/v1/crons/c-1',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('workflows', () => {
    it('fetches workflows with state filter', async () => {
      mockFetch.mockReturnValue(jsonResponse({ items: [], pagination: { total: 0, page: 1, per_page: 25 } }));
      await client.workflows({ state: 'active', page: 1, per_page: 25 });
      const url = mockFetch.mock.calls[0]![0] as string;
      expect(url).toContain('state=active');
    });

    it('cancels a workflow with POST', async () => {
      mockFetch.mockReturnValue(Promise.resolve({ ok: true, status: 204, statusText: 'No Content', json: () => Promise.reject() }));
      await client.cancelWorkflow('wf-1');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/ojs/v1/workflows/wf-1/cancel',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('job progress', () => {
    it('fetches job progress', async () => {
      mockFetch.mockReturnValue(jsonResponse({ job_id: 'j-1', progress: 0.5 }));
      const result = await client.jobProgress('j-1');
      expect(result.progress).toBe(0.5);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/ojs/v1/jobs/j-1/progress',
        expect.anything(),
      );
    });
  });

  describe('rate limits', () => {
    it('fetches rate limits with pagination', async () => {
      mockFetch.mockReturnValue(jsonResponse({ items: [], pagination: { total: 0, page: 1, per_page: 50 } }));
      await client.rateLimits(1, 25);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/ojs/v1/rate-limits?page=1&per_page=25',
        expect.anything(),
      );
    });

    it('overrides a rate limit with PUT', async () => {
      mockFetch.mockReturnValue(jsonResponse({ key: 'api', limit: 100, period: '1m' }));
      await client.overrideRateLimit('api', 100, '1m');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/ojs/v1/rate-limits/api',
        expect.objectContaining({ method: 'PUT' }),
      );
    });

    it('deletes a rate limit override with DELETE', async () => {
      mockFetch.mockReturnValue(Promise.resolve({ ok: true, status: 204, statusText: 'No Content', json: () => Promise.reject() }));
      await client.deleteRateLimitOverride('api');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/ojs/v1/rate-limits/api/override',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('queue config', () => {
    it('updates queue config with PUT', async () => {
      mockFetch.mockReturnValue(jsonResponse({ name: 'default' }));
      await client.updateQueueConfig('default', { concurrency: 10 });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/ojs/v1/admin/queues/default/config',
        expect.objectContaining({ method: 'PUT', body: JSON.stringify({ concurrency: 10 }) }),
      );
    });
  });

  describe('priority', () => {
    it('fetches priority stats', async () => {
      mockFetch.mockReturnValue(jsonResponse({ queue: 'default', distribution: [] }));
      await client.priorityStats('default');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/ojs/v1/queues/default/priority-stats',
        expect.anything(),
      );
    });

    it('updates job priority with PATCH', async () => {
      mockFetch.mockReturnValue(Promise.resolve({ ok: true, status: 204, statusText: 'No Content', json: () => Promise.reject() }));
      await client.updateJobPriority('j-1', 5);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/ojs/v1/admin/jobs/j-1',
        expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ priority: 5 }) }),
      );
    });
  });

  describe('events', () => {
    it('fetches events with type filter', async () => {
      mockFetch.mockReturnValue(jsonResponse({ items: [], pagination: { total: 0, page: 1, per_page: 50 } }));
      await client.events({ type: 'job.completed' });
      const url = mockFetch.mock.calls[0]![0] as string;
      expect(url).toContain('type=job.completed');
    });
  });

  describe('unique jobs', () => {
    it('fetches unique jobs with pagination', async () => {
      mockFetch.mockReturnValue(jsonResponse({ items: [], pagination: { total: 0, page: 1, per_page: 50 } }));
      await client.uniqueJobs(1, 25);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/ojs/v1/unique-jobs?page=1&per_page=25',
        expect.anything(),
      );
    });
  });

  describe('middleware', () => {
    it('fetches middleware chains', async () => {
      const data = { enqueue: [], execution: [] };
      mockFetch.mockReturnValue(jsonResponse(data));
      const result = await client.middleware();
      expect(result).toEqual(data);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/ojs/v1/middleware',
        expect.anything(),
      );
    });
  });

  describe('health', () => {
    it('fetches health status', async () => {
      mockFetch.mockReturnValue(jsonResponse({ status: 'healthy', uptime_seconds: 3600 }));
      const result = await client.health();
      expect(result.status).toBe('healthy');
    });
  });

  describe('webhooks', () => {
    it('fetches webhook subscriptions with pagination', async () => {
      mockFetch.mockReturnValue(jsonResponse({ items: [], pagination: { total: 0, page: 1, per_page: 50 } }));
      await client.webhooks(1, 25);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/ojs/v1/webhooks/subscriptions?page=1&per_page=25',
        expect.anything(),
      );
    });

    it('creates a webhook with POST', async () => {
      mockFetch.mockReturnValue(jsonResponse({ id: 'wh-1', url: 'https://example.com', events: ['job.completed'], active: true }));
      await client.createWebhook({ url: 'https://example.com', events: ['job.completed'] });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/ojs/v1/webhooks/subscriptions',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('updates a webhook with PUT', async () => {
      mockFetch.mockReturnValue(jsonResponse({ id: 'wh-1', active: false }));
      await client.updateWebhook('wh-1', { active: false });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/ojs/v1/webhooks/subscriptions/wh-1',
        expect.objectContaining({ method: 'PUT' }),
      );
    });

    it('deletes a webhook with DELETE', async () => {
      mockFetch.mockReturnValue(Promise.resolve({ ok: true, status: 204, statusText: 'No Content', json: () => Promise.reject() }));
      await client.deleteWebhook('wh-1');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/ojs/v1/webhooks/subscriptions/wh-1',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('tests a webhook with POST', async () => {
      mockFetch.mockReturnValue(jsonResponse({ status: 200, response_time_ms: 42 }));
      const result = await client.testWebhook('wh-1');
      expect(result.status).toBe(200);
      expect(result.response_time_ms).toBe(42);
    });
  });

  describe('tenants', () => {
    it('fetches tenants with pagination', async () => {
      mockFetch.mockReturnValue(jsonResponse({ items: [], pagination: { total: 0, page: 1, per_page: 50 } }));
      await client.tenants(1, 25);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/ojs/v1/admin/tenants?page=1&per_page=25',
        expect.anything(),
      );
    });

    it('fetches tenant jobs with filters', async () => {
      mockFetch.mockReturnValue(jsonResponse({ items: [], pagination: { total: 0, page: 1, per_page: 25 } }));
      await client.tenantJobs('t-1', { state: 'active' });
      const url = mockFetch.mock.calls[0]![0] as string;
      expect(url).toContain('tenants/t-1/jobs');
      expect(url).toContain('state=active');
    });
  });

  describe('worker pools', () => {
    it('fetches worker pools', async () => {
      mockFetch.mockReturnValue(jsonResponse({ pools: [] }));
      const result = await client.workerPools();
      expect(result.pools).toEqual([]);
    });

    it('fetches scheduling stats', async () => {
      mockFetch.mockReturnValue(jsonResponse({ strategy: 'round-robin', queues: [] }));
      const result = await client.schedulingStats();
      expect(result.strategy).toBe('round-robin');
    });
  });

  describe('job schemas', () => {
    it('fetches all job schemas', async () => {
      mockFetch.mockReturnValue(jsonResponse({ schemas: [] }));
      const result = await client.jobSchemas();
      expect(result.schemas).toEqual([]);
    });

    it('fetches a specific schema', async () => {
      mockFetch.mockReturnValue(jsonResponse({ type: 'email', version: '1.0' }));
      await client.jobSchema('email');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/ojs/v1/admin/schemas/email',
        expect.anything(),
      );
    });
  });

  describe('maintenance', () => {
    it('fetches maintenance status', async () => {
      mockFetch.mockReturnValue(jsonResponse({ enabled: false }));
      const result = await client.maintenanceStatus();
      expect(result.enabled).toBe(false);
    });

    it('sets maintenance mode with POST', async () => {
      mockFetch.mockReturnValue(jsonResponse({ enabled: true, reason: 'migration' }));
      await client.setMaintenance(true, 'migration', '1h');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/ojs/v1/admin/system/maintenance',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ enabled: true, reason: 'migration', duration: '1h' }),
        }),
      );
    });
  });

  describe('workflow progress', () => {
    it('fetches workflow progress', async () => {
      mockFetch.mockReturnValue(jsonResponse({ workflow_id: 'wf-1', progress: 0.75, steps: [] }));
      const result = await client.workflowProgress('wf-1');
      expect(result.progress).toBe(0.75);
    });
  });

  describe('job result', () => {
    it('fetches job result', async () => {
      mockFetch.mockReturnValue(jsonResponse({ job_id: 'j-1', state: 'completed', result: { ok: true } }));
      const result = await client.jobResult('j-1');
      expect(result.state).toBe('completed');
    });
  });

  describe('job progress stream URL', () => {
    it('returns the correct SSE URL', () => {
      const url = client.jobProgressStreamUrl('j-1');
      expect(url).toBe('http://localhost:8080/ojs/v1/jobs/j-1/progress/stream');
    });
  });
});
