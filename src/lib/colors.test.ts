import { describe, it, expect } from 'vitest';
import { STATE_COLORS, STATE_BG } from './colors';
import type { JobState } from '@/api/types';

const ALL_STATES: JobState[] = ['available', 'scheduled', 'pending', 'active', 'completed', 'retryable', 'cancelled', 'discarded'];

describe('STATE_COLORS', () => {
  it('has a color for every job state', () => {
    for (const state of ALL_STATES) {
      expect(STATE_COLORS[state]).toBeDefined();
      expect(STATE_COLORS[state]).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });
});

describe('STATE_BG', () => {
  it('has background classes for every job state', () => {
    for (const state of ALL_STATES) {
      expect(STATE_BG[state]).toBeDefined();
      expect(STATE_BG[state]).toContain('bg-');
    }
  });
});
