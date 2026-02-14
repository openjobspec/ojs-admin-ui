import { describe, it, expect } from 'vitest';
import { formatNumber, formatDuration, timeAgo, formatRate, cn } from './formatting';

describe('formatNumber', () => {
  it('formats numbers below 1000 as-is', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(42)).toBe('42');
    expect(formatNumber(999)).toBe('999');
  });

  it('formats thousands with K suffix', () => {
    expect(formatNumber(1_000)).toBe('1.0K');
    expect(formatNumber(1_500)).toBe('1.5K');
    expect(formatNumber(999_999)).toBe('1000.0K');
  });

  it('formats millions with M suffix', () => {
    expect(formatNumber(1_000_000)).toBe('1.0M');
    expect(formatNumber(2_500_000)).toBe('2.5M');
  });
});

describe('formatDuration', () => {
  it('formats seconds', () => {
    expect(formatDuration(0)).toBe('0s');
    expect(formatDuration(30)).toBe('30s');
    expect(formatDuration(59.9)).toBe('60s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(60)).toBe('1m 0s');
    expect(formatDuration(90)).toBe('1m 30s');
    expect(formatDuration(3599)).toBe('59m 59s');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(3600)).toBe('1h 0m');
    expect(formatDuration(7260)).toBe('2h 1m');
  });
});

describe('timeAgo', () => {
  it('returns "just now" for recent times', () => {
    const now = new Date().toISOString();
    expect(timeAgo(now)).toBe('just now');
  });

  it('returns seconds ago', () => {
    const tenSecondsAgo = new Date(Date.now() - 10_000).toISOString();
    expect(timeAgo(tenSecondsAgo)).toBe('10s ago');
  });

  it('returns minutes ago', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(timeAgo(fiveMinutesAgo)).toBe('5m ago');
  });

  it('returns hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3_600_000).toISOString();
    expect(timeAgo(twoHoursAgo)).toBe('2h ago');
  });

  it('returns days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString();
    expect(timeAgo(threeDaysAgo)).toBe('3d ago');
  });
});

describe('formatRate', () => {
  it('formats low rates as per hour', () => {
    expect(formatRate(0.5)).toBe('30.0/h');
  });

  it('formats normal rates as per minute', () => {
    expect(formatRate(10)).toBe('10.0/m');
    expect(formatRate(100)).toBe('100.0/m');
  });

  it('formats high rates as per second', () => {
    expect(formatRate(1200)).toBe('20/s');
  });
});

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('filters falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });

  it('returns empty string for no truthy values', () => {
    expect(cn(false, null, undefined)).toBe('');
  });
});
