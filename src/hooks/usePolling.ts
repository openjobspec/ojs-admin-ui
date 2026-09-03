import { useEffect, useRef, useState, useCallback } from 'react';

type PollingFetcher<T> = (signal?: AbortSignal) => Promise<T>;

export function usePolling<T>(
  fetcher: PollingFetcher<T>,
  intervalMs = 5000,
): { data: T | null; loading: boolean; error: Error | null; refresh: () => Promise<void> } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const mountedRef = useRef(false);
  const generationRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (!mountedRef.current) return;
    const generation = ++generationRef.current;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      const result = await fetcherRef.current(controller.signal);
      if (mountedRef.current && generation === generationRef.current) {
        setData(result);
        setError(null);
      }
    } catch (e) {
      if (mountedRef.current && generation === generationRef.current) {
        setError(e instanceof Error ? e : new Error(String(e)));
      }
    } finally {
      if (mountedRef.current && generation === generationRef.current) {
        controllerRef.current = null;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void refresh();
    const timer = setInterval(() => {
      void refresh();
    }, intervalMs);

    return () => {
      mountedRef.current = false;
      generationRef.current += 1;
      controllerRef.current?.abort();
      controllerRef.current = null;
      clearInterval(timer);
    };
  }, [fetcher, intervalMs, refresh]);

  return { data, loading, error, refresh };
}
