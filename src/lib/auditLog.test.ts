// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { getAuditLog, addAuditEntry, clearAuditLog } from './auditLog';

describe('auditLog', () => {
  beforeEach(() => clearAuditLog());

  it('starts empty', () => {
    expect(getAuditLog()).toEqual([]);
  });

  it('prepends new entries (most recent first)', () => {
    addAuditEntry('dead_letter.retry', { id: 'a' }, { matched: 1, succeeded: 1, failed: 0 });
    addAuditEntry('dead_letter.delete', { id: 'b' }, { matched: 1, succeeded: 1, failed: 0 });
    const log = getAuditLog();
    expect(log).toHaveLength(2);
    expect(log[0]?.action).toBe('dead_letter.delete');
    expect(log[1]?.action).toBe('dead_letter.retry');
    expect(log[0]?.id).toBeTruthy();
    expect(log[0]?.performed_at).toBeTruthy();
  });

  it('caps the log at 100 entries', () => {
    for (let i = 0; i < 120; i++) {
      addAuditEntry('op', { i }, { matched: 1, succeeded: 1, failed: 0 });
    }
    expect(getAuditLog()).toHaveLength(100);
  });

  it('survives corrupt storage without throwing', () => {
    sessionStorage.setItem('ojs-admin-audit-log', '{not json');
    expect(getAuditLog()).toEqual([]);
  });
});
