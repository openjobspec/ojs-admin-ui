import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ConfirmModal } from './ConfirmModal';

function deferred() {
  let resolve!: () => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const baseProps = {
  open: true,
  title: 'Delete job',
  message: 'This cannot be undone.',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe('ConfirmModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<ConfirmModal {...baseProps} open={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('exposes dialog semantics and supports synchronous actions', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmModal {...baseProps} onConfirm={onConfirm} onCancel={onCancel} confirmLabel="Delete" />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Delete job');
    expect(dialog).toHaveAccessibleDescription('This cannot be undone.');
    expect(dialog.contains(document.activeElement)).toBe(true);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    });
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('closes on Escape from an input and restores trigger focus', () => {
    const onCancel = vi.fn();
    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.focus();
    const { unmount } = render(
      <ConfirmModal {...baseProps} onCancel={onCancel}>
        <input aria-label="Reason" />
      </ConfirmModal>,
    );

    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Reason' }), { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledOnce();
    unmount();
    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it('blocks every dismissal path and disables controls while confirmation is pending', async () => {
    const request = deferred();
    const onCancel = vi.fn();
    render(
      <ConfirmModal
        {...baseProps}
        onConfirm={() => request.promise}
        onCancel={onCancel}
        confirmLabel="Delete"
        confirmingLabel="Deleting…"
      >
        <input aria-label="Reason" />
      </ConfirmModal>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Reason' })).toBeDisabled();

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    fireEvent.click(screen.getByRole('dialog').parentElement!);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).not.toHaveBeenCalled();

    await act(async () => request.resolve());
  });

  it('catches rejection, keeps the dialog open, and allows retry', async () => {
    const first = deferred();
    const onConfirm = vi.fn()
      .mockImplementationOnce(() => first.promise)
      .mockResolvedValueOnce(undefined);
    render(<ConfirmModal {...baseProps} onConfirm={onConfirm} confirmLabel="Delete" />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await act(async () => first.reject(new Error('backend unavailable')));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/backend unavailable.*try again/i);
    expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(2));
  });
});
