import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppContext } from '@/hooks/useAppContext';
import { Layout } from './Layout';
import type { OJSAdminClient } from '@/api/client';

function renderLayout() {
  const client = { baseUrl: '' } as unknown as OJSAdminClient;
  render(
    <AppContext.Provider value={{ client, manifest: null, baseUrl: '', connected: true }}>
      <MemoryRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<div>Home content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AppContext.Provider>,
  );
}

describe('Layout', () => {
  it('provides a skip link that targets the main landmark', () => {
    renderLayout();
    const skip = screen.getByRole('link', { name: /skip to main content/i });
    expect(skip).toHaveAttribute('href', '#main-content');
  });

  it('renders a main landmark with a matching id', () => {
    renderLayout();
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
  });

  it('labels the primary navigation landmark', () => {
    renderLayout();
    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument();
  });
});
