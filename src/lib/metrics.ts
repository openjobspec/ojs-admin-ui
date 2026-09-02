/**
 * Pure, framework-free math backing {@link useRealtimeMetrics}. Extracting these
 * keeps the hook focused on connection orchestration and makes the arithmetic
 * unit-testable in isolation.
 */

export const BASE_RECONNECT_DELAY = 1000;
export const MAX_RECONNECT_DELAY = 30000;

/**
 * Exponential backoff with ±25% jitter, capped at {@link MAX_RECONNECT_DELAY}.
 * `rand` is injectable so callers/tests can make the jitter deterministic.
 */
export function reconnectDelay(attempt: number, rand: () => number = Math.random): number {
  const base = Math.min(BASE_RECONNECT_DELAY * Math.pow(2, attempt), MAX_RECONNECT_DELAY);
  return base * (0.75 + rand() * 0.5);
}

/** Append `sample` and keep only the most recent `maxSamples` entries. */
export function appendSample<T>(arr: T[], sample: T, maxSamples: number): T[] {
  const next = [...arr, sample];
  return next.length > maxSamples ? next.slice(-maxSamples) : next;
}

/** True when `errorRate` exceeds twice the average of the recent samples. */
export function isAnomaly(recentRates: number[], errorRate: number): boolean {
  if (recentRates.length === 0) return false;
  const avg = recentRates.reduce((a, b) => a + b, 0) / recentRates.length;
  return avg > 0 && errorRate > avg * 2;
}

interface Counters {
  completed: number;
  discarded: number;
  timestamp: number;
}

interface Rates {
  processedPerSec: number;
  failedPerSec: number;
}

/**
 * Derive per-second processed/failed rates from the delta between two counter
 * snapshots. Falls back to the provided rates when there is no previous sample,
 * time hasn't advanced, or the delta is zero. Never returns negative rates.
 */
export function deriveThroughput(prev: Counters | null, current: Counters, fallback: Rates): Rates {
  let processedPerSec = fallback.processedPerSec;
  let failedPerSec = fallback.failedPerSec;

  if (prev) {
    const dt = (current.timestamp - prev.timestamp) / 1000;
    if (dt > 0) {
      processedPerSec = Math.max(0, (current.completed - prev.completed) / dt) || fallback.processedPerSec;
      failedPerSec = Math.max(0, (current.discarded - prev.discarded) / dt) || fallback.failedPerSec;
    }
  }

  return { processedPerSec, failedPerSec };
}
