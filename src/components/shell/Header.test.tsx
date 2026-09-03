import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppContext } from '@/hooks/useAppContext';
import { Header } from './Header';
import type { OJSAdminClient } from '@/api/client';

function renderHeader(connected = true) {
  const client = { baseUrl: '' } as unknown as OJSAdminClient;
  return render(
    <AppContext.Provider value={{ client, manifest: null, baseUrl: '', connected }}>
      <Header />
    </AppContext.Provider>,
  );
}

describe('Header', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = '';
  });

  it('exposes an accessible theme toggle', () => {
    renderHeader();
    expect(screen.getByRole('button', { name: /toggle dark mode/i })).toBeInTheDocument();
  });

  it('applies the dark class and color-scheme when toggled', () => {
    renderHeader();
    fireEvent.click(screen.getByRole('button', { name: /toggle dark mode/i }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('reflects the light color-scheme after toggling back', () => {
    renderHeader();
    const btn = screen.getByRole('button', { name: /toggle dark mode/i });
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('announces backend connection status to assistive tech', () => {
    renderHeader(true);
    expect(screen.getByRole('status', { name: /connected to backend/i })).toBeInTheDocument();
  });
});
