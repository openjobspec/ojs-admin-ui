import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JobTable } from './JobTable';
import type { JobSummary } from '@/api/types';

function job(overrides: Partial<JobSummary> = {}): JobSummary {
  return {
    id: 'job-0123456789abcdef',
    type: 'email.send',
    queue: 'default',
    state: 'available',
    priority: 0,
    attempt: 1,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('JobTable', () => {
  it('preserves native table semantics and exposes a specific details button', () => {
    render(<JobTable jobs={[job()]} onSelect={vi.fn()} />);
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getAllByRole('cell')).toHaveLength(7);
    expect(screen.getAllByRole('columnheader')).toHaveLength(7);
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();

    const button = screen.getByRole('button', {
      name: 'View details for email.send job job-0123456789abcdef',
    });
    expect(button).toHaveTextContent('View details');
    expect(button.closest('tr')).not.toHaveAttribute('role');
    expect(button.closest('tr')).not.toHaveAttribute('tabindex');
  });

  it('opens details with native button keyboard activation', () => {
    const onSelect = vi.fn();
    render(<JobTable jobs={[job({ id: 'abc123' })]} onSelect={onSelect} />);
    const button = screen.getByRole('button', { name: /view details for email\.send job abc123/i });

    button.focus();
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledWith('abc123');
  });

  it('does not make the row itself clickable', () => {
    const onSelect = vi.fn();
    render(<JobTable jobs={[job()]} onSelect={onSelect} />);
    fireEvent.click(screen.getAllByRole('row')[1]!);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders an empty state when there are no jobs', () => {
    render(<JobTable jobs={[]} onSelect={vi.fn()} />);
    expect(screen.getByText(/no jobs found/i)).toBeInTheDocument();
  });
});
