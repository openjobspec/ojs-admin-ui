import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePolling } from './usePolling';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('usePolling', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('fetches immediately and polls after the interval', async () => {
    const fetcher = vi.fn().mockResolvedValue('value');
    const { result, unmount } = renderHook(() => usePolling(fetcher, 1000));

    await act(async () => {});
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result.current).toMatchObject({ data: 'value', loading: false, error: null });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
    unmount();
  });

  it('lets a manual refresh supersede and abort an interval request', async () => {
    const initial = deferred<string>();
    const interval = deferred<string>();
    const manual = deferred<string>();
    const fetcher = vi.fn()
      .mockImplementationOnce(() => initial.promise)
      .mockImplementationOnce(() => interval.promise)
      .mockImplementationOnce(() => manual.promise);
    const { result, unmount } = renderHook(() => usePolling(fetcher, 1000));

    await act(async () => initial.resolve('initial'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    const intervalSignal = fetcher.mock.calls[1]?.[0] as AbortSignal;
    expect(intervalSignal.aborted).toBe(false);

    act(() => {
      void result.current.refresh();
    });
    expect(intervalSignal.aborted).toBe(true);
    expect(result.current.loading).toBe(true);

    await act(async () => interval.resolve('stale interval'));
    expect(result.current.data).toBe('initial');
    expect(result.current.loading).toBe(true);

    await act(async () => manual.resolve('manual'));
    expect(result.current).toMatchObject({ data: 'manual', loading: false, error: null });
    unmount();
  });

  it('keeps the latest rejection when an older request resolves last', async () => {
    const older = deferred<string>();
    const latest = deferred<string>();
    const fetcher = vi.fn()
      .mockImplementationOnce(() => older.promise)
      .mockImplementationOnce(() => latest.promise);
    const { result, unmount } = renderHook(() => usePolling(fetcher, 10000));

    act(() => {
      void result.current.refresh();
    });
    await act(async () => latest.reject(new Error('latest failed')));
    expect(result.current.error?.message).toBe('latest failed');
    expect(result.current.loading).toBe(false);

    await act(async () => older.resolve('stale success'));
    expect(result.current.data).toBeNull();
    expect(result.current.error?.message).toBe('latest failed');
    unmount();
  });

  it('keeps the latest success when an older request rejects last', async () => {
    const older = deferred<string>();
    const latest = deferred<string>();
    const fetcher = vi.fn()
      .mockImplementationOnce(() => older.promise)
      .mockImplementationOnce(() => latest.promise);
    const { result, unmount } = renderHook(() => usePolling(fetcher, 10000));

    act(() => {
      void result.current.refresh();
    });
    await act(async () => latest.resolve('latest success'));
    expect(result.current).toMatchObject({ data: 'latest success', loading: false, error: null });

    await act(async () => older.reject(new Error('stale failure')));
    expect(result.current).toMatchObject({ data: 'latest success', loading: false, error: null });
    unmount();
  });

  it('aborts on unmount and ignores later refreshes and settlements', async () => {
    const request = deferred<string>();
    const fetcher = vi.fn((_signal?: AbortSignal) => request.promise);
    const { result, unmount } = renderHook(() => usePolling(fetcher, 1000));
    const refresh = result.current.refresh;
    const signal = fetcher.mock.calls[0]?.[0] as AbortSignal;

    unmount();
    expect(signal.aborted).toBe(true);

    await act(async () => {
      await refresh();
      request.resolve('late');
      await request.promise;
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('supersedes a request when the fetcher changes', async () => {
    const slowRequest = deferred<string>();
    const slow = vi.fn((_signal?: AbortSignal) => slowRequest.promise);
    const fast = vi.fn().mockResolvedValue('fresh');
    const { result, rerender, unmount } = renderHook(({ currentFetcher }) => (
      usePolling(currentFetcher, 10000)
    ), {
      initialProps: { currentFetcher: slow },
    });
    const slowSignal = slow.mock.calls[0]?.[0] as AbortSignal;

    rerender({ currentFetcher: fast });
    await act(async () => {});
    expect(slowSignal.aborted).toBe(true);
    expect(result.current.data).toBe('fresh');

    await act(async () => slowRequest.resolve('stale'));
    expect(result.current.data).toBe('fresh');
    unmount();
  });
});
