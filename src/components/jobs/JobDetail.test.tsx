import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppContext } from '@/hooks/useAppContext';
import { JobDetail } from './JobDetail';
import type { OJSAdminClient } from '@/api/client';
import type { JobDetail as JobDetailType } from '@/api/types';

function completedJob(): JobDetailType {
  return {
    id: 'job-0123456789abcdef',
    type: 'email.send',
    queue: 'default',
    state: 'completed',
    priority: 0,
    attempt: 1,
    created_at: new Date().toISOString(),
    args: [{ to: 'a@b.com' }],
    meta: {},
    errors: [],
  };
}

function renderDetail(onClose = vi.fn()) {
  const client = {
    baseUrl: '',
    job: vi.fn().mockResolvedValue(completedJob()),
    jobResult: vi.fn(),
    jobProgressStreamUrl: (id: string) => `/stream/${id}`,
  } as unknown as OJSAdminClient;
  render(
    <AppContext.Provider value={{ client, manifest: null, baseUrl: '', connected: true }}>
      <JobDetail jobId="job-0123456789abcdef" onClose={onClose} />
    </AppContext.Provider>,
  );
  return { client, onClose };
}

describe('JobDetail', () => {
  it('renders a labelled modal dialog once the job loads', async () => {
    renderDetail();
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName(/email\.send/i);
  });

  it('has an accessible close button that invokes onClose', async () => {
    const { onClose } = renderDetail();
    const close = await screen.findByRole('button', { name: /close job details/i });
    fireEvent.click(close);
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on Escape', async () => {
    const { onClose } = renderDetail();
    const dialog = await screen.findByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
