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
});
