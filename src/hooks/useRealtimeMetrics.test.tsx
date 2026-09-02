import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AppContext } from '@/hooks/useAppContext';
import { useRealtimeMetrics } from './useRealtimeMetrics';
import type { OJSAdminClient } from '@/api/client';

function wrapper(client: OJSAdminClient) {
  return ({ children }: { children: ReactNode }) => (
    <AppContext.Provider value={{ client, manifest: null, baseUrl: '', connected: true }}>
      {children}
    </AppContext.Provider>
  );
}

const STATS = {
  jobs: { completed: 100, discarded: 5, active: 3, available: 10, scheduled: 2, retryable: 1 },
  throughput: { processed_per_minute: 600, failed_per_minute: 60 },
  workers: 4,
  queues: 2,
};

describe('useRealtimeMetrics (polling fallback)', () => {
  const originalEventSource = globalThis.EventSource;

  beforeEach(() => {
    vi.useFakeTimers();
    // Force the polling transport by removing EventSource (jsdom has none, but be explicit).
    // @ts-expect-error test override
    delete globalThis.EventSource;
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    globalThis.EventSource = originalEventSource;
  });

  it('polls stats on mount and populates throughput metrics', async () => {
    const client = {
      baseUrl: '',
      stats: vi.fn().mockResolvedValue(STATS),
      queues: vi.fn().mockResolvedValue({ items: [] }),
    } as unknown as OJSAdminClient;

    const { result, unmount } = renderHook(() => useRealtimeMetrics({ pollInterval: 1000 }), {
      wrapper: wrapper(client),
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(client.stats).toHaveBeenCalled();
    expect(result.current.metrics.throughput.length).toBeGreaterThan(0);
    expect(result.current.connection.transport).toBe('polling');
    unmount();
  });

  it('stops polling after unmount (no leaked interval)', async () => {
    const client = {
      baseUrl: '',
      stats: vi.fn().mockResolvedValue(STATS),
      queues: vi.fn().mockResolvedValue({ items: [] }),
    } as unknown as OJSAdminClient;

    const { unmount } = renderHook(() => useRealtimeMetrics({ pollInterval: 1000 }), {
      wrapper: wrapper(client),
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    const callsBefore = (client.stats as ReturnType<typeof vi.fn>).mock.calls.length;

    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect((client.stats as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsBefore);
  });
});
