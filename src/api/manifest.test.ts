import { describe, it, expect } from 'vitest';
import { hasCapability, hasExtension, supportsAdminApi, conformanceBadge } from './manifest';
import type { OJSManifest } from './types';

const baseManifest: OJSManifest = {
  implementation: { name: 'test', version: '1.0.0', language: 'go' },
  conformance_level: 2,
  protocols: ['http'],
  backend: 'redis',
};

describe('hasCapability', () => {
  it('returns true when capability exists and is true', () => {
    const m = { ...baseManifest, capabilities: { dead_letter: true, bulk_ops: false } };
    expect(hasCapability(m, 'dead_letter')).toBe(true);
  });

  it('returns false when capability exists and is false', () => {
    const m = { ...baseManifest, capabilities: { dead_letter: false } };
    expect(hasCapability(m, 'dead_letter')).toBe(false);
  });

  it('returns false when capability does not exist', () => {
    const m = { ...baseManifest, capabilities: {} };
    expect(hasCapability(m, 'dead_letter')).toBe(false);
  });

  it('returns false when capabilities is undefined', () => {
    expect(hasCapability(baseManifest, 'dead_letter')).toBe(false);
  });
});

describe('hasExtension', () => {
  it('returns true for string array format', () => {
    const m = { ...baseManifest, extensions: ['admin-api', 'webhooks'] };
    expect(hasExtension(m, 'admin-api')).toBe(true);
    expect(hasExtension(m, 'webhooks')).toBe(true);
    expect(hasExtension(m, 'other')).toBe(false);
  });

  it('returns true for structured official extensions', () => {
    const m = {
      ...baseManifest,
      extensions: {
        official: [{ name: 'admin-api', uri: 'https://example.com', version: '1.0' }],
        experimental: [],
      },
    };
    expect(hasExtension(m, 'admin-api')).toBe(true);
    expect(hasExtension(m, 'other')).toBe(false);
  });

  it('returns true for structured experimental extensions', () => {
    const m = {
      ...baseManifest,
      extensions: {
        official: [],
        experimental: [{ name: 'metrics', uri: 'https://example.com', version: '0.1' }],
      },
    };
    expect(hasExtension(m, 'metrics')).toBe(true);
  });

  it('returns false when extensions is undefined', () => {
    expect(hasExtension(baseManifest, 'admin-api')).toBe(false);
  });
});

describe('supportsAdminApi', () => {
  it('returns true when admin-api extension present', () => {
    const m = { ...baseManifest, extensions: ['admin-api'] };
    expect(supportsAdminApi(m)).toBe(true);
  });

  it('returns false when admin-api extension absent', () => {
    const m = { ...baseManifest, extensions: ['webhooks'] };
    expect(supportsAdminApi(m)).toBe(false);
  });
});

describe('conformanceBadge', () => {
  it('maps known levels correctly', () => {
    expect(conformanceBadge(0)).toBe('Level 0: Core');
    expect(conformanceBadge(1)).toBe('Level 1: Reliable');
    expect(conformanceBadge(2)).toBe('Level 2: Scheduled');
    expect(conformanceBadge(3)).toBe('Level 3: Orchestration');
    expect(conformanceBadge(4)).toBe('Level 4: Advanced');
  });

  it('handles unknown levels', () => {
    expect(conformanceBadge(99)).toBe('Level 99: Unknown');
  });
});
