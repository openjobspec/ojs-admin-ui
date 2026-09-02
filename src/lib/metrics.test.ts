// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { reconnectDelay, appendSample, isAnomaly, deriveThroughput } from './metrics';

describe('reconnectDelay', () => {
  it('grows exponentially and is capped at the max delay', () => {
    // With rand=0.5 the jitter factor is exactly 1.0, so we see the base curve.
    const mid = () => 0.5;
    expect(reconnectDelay(0, mid)).toBe(1000);
    expect(reconnectDelay(1, mid)).toBe(2000);
    expect(reconnectDelay(2, mid)).toBe(4000);
    expect(reconnectDelay(20, mid)).toBe(30000); // capped
  });

  it('applies jitter within +/-25%', () => {
    expect(reconnectDelay(0, () => 0)).toBe(750);
    expect(reconnectDelay(0, () => 1)).toBeCloseTo(1250);
  });
});

describe('appendSample', () => {
  it('appends to the tail', () => {
    expect(appendSample([1, 2], 3, 10)).toEqual([1, 2, 3]);
  });

  it('keeps only the last maxSamples entries', () => {
    expect(appendSample([1, 2, 3], 4, 3)).toEqual([2, 3, 4]);
  });
});

describe('isAnomaly', () => {
  it('is false without history', () => {
    expect(isAnomaly([], 100)).toBe(false);
  });

  it('flags a rate more than 2x the recent average', () => {
    expect(isAnomaly([10, 10, 10], 25)).toBe(true);
    expect(isAnomaly([10, 10, 10], 15)).toBe(false);
  });

  it('is false when the recent average is zero', () => {
    expect(isAnomaly([0, 0], 5)).toBe(false);
  });
});

describe('deriveThroughput', () => {
  const fallback = { processedPerSec: 1, failedPerSec: 0.5 };

  it('uses the fallback when there is no previous sample', () => {
    const out = deriveThroughput(null, { completed: 100, discarded: 5, timestamp: 1000 }, fallback);
    expect(out).toEqual(fallback);
  });

  it('derives per-second rates from the delta', () => {
    const prev = { completed: 100, discarded: 5, timestamp: 0 };
    const cur = { completed: 200, discarded: 15, timestamp: 10_000 }; // +100 done / +10 fail over 10s
    const out = deriveThroughput(prev, cur, fallback);
    expect(out.processedPerSec).toBe(10);
    expect(out.failedPerSec).toBe(1);
  });

  it('falls back when the delta is zero (no progress)', () => {
    const prev = { completed: 100, discarded: 5, timestamp: 0 };
    const cur = { completed: 100, discarded: 5, timestamp: 10_000 };
    const out = deriveThroughput(prev, cur, fallback);
    expect(out).toEqual(fallback);
  });

  it('falls back when dt is not positive', () => {
    const prev = { completed: 100, discarded: 5, timestamp: 10_000 };
    const cur = { completed: 200, discarded: 15, timestamp: 10_000 };
    const out = deriveThroughput(prev, cur, fallback);
    expect(out).toEqual(fallback);
  });

  it('never returns negative rates when counters reset', () => {
    const prev = { completed: 500, discarded: 50, timestamp: 0 };
    const cur = { completed: 10, discarded: 1, timestamp: 5_000 };
    const out = deriveThroughput(prev, cur, fallback);
    expect(out.processedPerSec).toBeGreaterThanOrEqual(0);
    expect(out.failedPerSec).toBeGreaterThanOrEqual(0);
  });
});
