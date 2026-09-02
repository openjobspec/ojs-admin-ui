import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AppContext } from '@/hooks/useAppContext';
import { DeadLetterList } from './DeadLetterList';
import { getAuditLog, clearAuditLog } from '@/lib/auditLog';
import type { OJSAdminClient } from '@/api/client';
import type { JobSummary } from '@/api/types';

function job(id: string): JobSummary {
  return { id, type: 'email.send', queue: 'default', state: 'discarded', priority: 0, attempt: 3, created_at: new Date().toISOString() };
}

function renderList(clientOverrides: Partial<Record<keyof OJSAdminClient, unknown>> = {}) {
  const onRefresh = vi.fn();
  const client = {
    baseUrl: '',
    retryDeadLetter: vi.fn().mockResolvedValue(undefined),
    deleteDeadLetter: vi.fn().mockResolvedValue(undefined),
    bulkRetryDeadLetter: vi.fn().mockResolvedValue({ action: 'retry', matched: 5, succeeded: 5, failed: 0 }),
    ...clientOverrides,
  } as unknown as OJSAdminClient;
  render(
    <AppContext.Provider value={{ client, manifest: null, baseUrl: '', connected: true }}>
      <DeadLetterList jobs={[job('job-1')]} stats={{ total: 5 }} onRefresh={onRefresh} onSelect={vi.fn()} />
    </AppContext.Provider>,
  );
  return { client, onRefresh };
}

describe('DeadLetterList', () => {
  beforeEach(() => clearAuditLog());

  it('does not delete immediately — it asks for confirmation first', () => {
    const { client } = renderList();
    fireEvent.click(screen.getByRole('button', { name: /delete job/i }));
    expect(client.deleteDeadLetter).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('deletes and records an audit entry after confirmation', async () => {
    const { client, onRefresh } = renderList();
    fireEvent.click(screen.getByRole('button', { name: /delete job/i }));
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    await waitFor(() => expect(client.deleteDeadLetter).toHaveBeenCalledWith('job-1'));
    expect(onRefresh).toHaveBeenCalled();
    const log = getAuditLog();
    expect(log.some((e) => e.action.includes('delete'))).toBe(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps the target after failure, records no success, and retries successfully', async () => {
    const deleteDeadLetter = vi.fn()
      .mockRejectedValueOnce(new Error('delete failed'))
      .mockResolvedValueOnce(undefined);
    const { onRefresh } = renderList({ deleteDeadLetter });
    fireEvent.click(screen.getByRole('button', { name: /delete job/i }));
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/delete failed/i);
    expect(screen.getByRole('dialog')).toHaveTextContent('job-1');
    expect(onRefresh).not.toHaveBeenCalled();
    expect(getAuditLog().some((entry) => entry.action.includes('delete'))).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    await waitFor(() => expect(deleteDeadLetter).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(onRefresh).toHaveBeenCalledOnce();
    expect(getAuditLog().filter((entry) => entry.action.includes('delete'))).toHaveLength(1);
  });

  it('does not refresh, audit, or commit after unmount', async () => {
    let resolveDelete!: () => void;
    const deleteDeadLetter = vi.fn(() => new Promise<void>((resolve) => {
      resolveDelete = resolve;
    }));
    const onRefresh = vi.fn();
    const client = {
      baseUrl: '',
      retryDeadLetter: vi.fn(),
      deleteDeadLetter,
      bulkRetryDeadLetter: vi.fn(),
    } as unknown as OJSAdminClient;
    const { unmount } = render(
      <AppContext.Provider value={{ client, manifest: null, baseUrl: '', connected: true }}>
        <DeadLetterList jobs={[job('job-1')]} stats={{ total: 1 }} onRefresh={onRefresh} onSelect={vi.fn()} />
      </AppContext.Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /delete job/i }));
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    unmount();
    await act(async () => resolveDelete());
    expect(onRefresh).not.toHaveBeenCalled();
    expect(getAuditLog()).toHaveLength(0);
  });

  it('does not delete when the confirmation is cancelled', () => {
    const { client } = renderList();
    fireEvent.click(screen.getByRole('button', { name: /delete job/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(client.deleteDeadLetter).not.toHaveBeenCalled();
  });

  it('records an audit entry on single retry', async () => {
    const { client } = renderList();
    fireEvent.click(screen.getByRole('button', { name: /retry job/i }));
    await waitFor(() => expect(client.retryDeadLetter).toHaveBeenCalledWith('job-1'));
    await waitFor(() => expect(getAuditLog().some((e) => e.action.includes('retry'))).toBe(true));
  });

  it('records bulk retry results in the audit log', async () => {
    const { client } = renderList();
    fireEvent.click(screen.getByRole('button', { name: /bulk retry all/i }));
    fireEvent.click(screen.getByRole('button', { name: /^retry all$/i }));
    await waitFor(() => expect(client.bulkRetryDeadLetter).toHaveBeenCalled());
    await waitFor(() => {
      const entry = getAuditLog().find((e) => e.action.includes('bulk'));
      expect(entry?.result).toEqual({ matched: 5, succeeded: 5, failed: 0 });
    });
  });
});
