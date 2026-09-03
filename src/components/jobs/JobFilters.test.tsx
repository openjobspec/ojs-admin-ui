import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JobFilters } from './JobFilters';

describe('JobFilters', () => {
  const base = { filters: {}, queues: ['default', 'critical'], onChange: vi.fn() };

  it('labels the queue and state selects for assistive tech', () => {
    render(<JobFilters {...base} />);
    expect(screen.getByRole('combobox', { name: /filter by queue/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /filter by state/i })).toBeInTheDocument();
  });

  it('labels the job type input', () => {
    render(<JobFilters {...base} />);
    expect(screen.getByRole('textbox', { name: /job type/i })).toBeInTheDocument();
  });

  it('emits a queue change', () => {
    const onChange = vi.fn();
    render(<JobFilters {...base} onChange={onChange} />);
    fireEvent.change(screen.getByRole('combobox', { name: /filter by queue/i }), { target: { value: 'critical' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ queue: 'critical' }));
  });

  it('submits the job type filter', () => {
    const onChange = vi.fn();
    render(<JobFilters {...base} onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox', { name: /job type/i }), { target: { value: 'email' } });
    fireEvent.click(screen.getByRole('button', { name: /^filter$/i }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ type: 'email' }));
  });
});
