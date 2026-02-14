import { useEffect, useRef, useState, useCallback } from 'react';

export function usePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs = 5000,
): { data: T | null; loading: boolean; error: Error | null; refresh: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const doFetch = useCallback(async () => {
    cancelledRef.current = false;
    try {
      const result = await fetcher();
      if (!cancelledRef.current) {
        setData(result);
        setError(null);
      }
    } catch (e) {
      if (!cancelledRef.current) {
        setError(e instanceof Error ? e : new Error(String(e)));
      }
    } finally {
      if (!cancelledRef.current) {
        setLoading(false);
      }
    }
  }, [fetcher]);

  useEffect(() => {
    cancelledRef.current = false;
    doFetch();
    timerRef.current = setInterval(doFetch, intervalMs);
    return () => {
      cancelledRef.current = true;
      clearInterval(timerRef.current);
    };
  }, [doFetch, intervalMs]);

  return { data, loading, error, refresh: doFetch };
}
