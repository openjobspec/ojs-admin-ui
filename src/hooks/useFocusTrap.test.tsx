import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { useFocusTrap } from './useFocusTrap';

function Dialog({ onClose, children }: { onClose: () => void; children?: React.ReactNode }) {
  const ref = useFocusTrap<HTMLDivElement>(true, { onEscape: onClose });
  return (
    <div ref={ref} tabIndex={-1} role="dialog" aria-label="test">
      <input aria-label="Dialog input" />
      <button onClick={onClose}>First</button>
      <button>Second</button>
      {children}
    </div>
  );
}

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(true)}>Open</button>
      {open && <Dialog onClose={() => setOpen(false)} />}
    </div>
  );
}

describe('useFocusTrap', () => {
  it('moves focus in, cycles focus, and restores the trigger', () => {
    render(<Harness />);
    const open = screen.getByRole('button', { name: 'Open' });
    open.focus();
    fireEvent.click(open);
    expect(screen.getByRole('textbox', { name: 'Dialog input' })).toHaveFocus();

    const second = screen.getByRole('button', { name: 'Second' });
    second.focus();
    fireEvent.keyDown(second, { key: 'Tab' });
    expect(screen.getByRole('textbox', { name: 'Dialog input' })).toHaveFocus();

    const input = screen.getByRole('textbox', { name: 'Dialog input' });
    fireEvent.keyDown(input, { key: 'Tab', shiftKey: true });
    expect(second).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: 'First' }));
    expect(open).toHaveFocus();
  });

  it('closes on Escape from a form control', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Dialog input' }), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('only closes the topmost nested dialog', () => {
    const closeOuter = vi.fn();
    const closeInner = vi.fn();
    render(
      <Dialog onClose={closeOuter}>
        <Dialog onClose={closeInner} />
      </Dialog>,
    );

    const dialogs = screen.getAllByRole('dialog');
    const innerInput = dialogs[1]?.querySelector('input');
    expect(innerInput).not.toBeNull();
    fireEvent.keyDown(innerInput!, { key: 'Escape' });
    expect(closeInner).toHaveBeenCalledOnce();
    expect(closeOuter).not.toHaveBeenCalled();
  });
});
