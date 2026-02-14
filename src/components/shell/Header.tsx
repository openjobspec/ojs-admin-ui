import { useState, useEffect } from 'react';
import { useConnected } from '@/hooks/useAppContext';

const DARK_MODE_KEY = 'ojs-dark-mode';

function getInitialDark(): boolean {
  const stored = localStorage.getItem(DARK_MODE_KEY);
  if (stored !== null) return stored === 'true';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function Header() {
  const [dark, setDark] = useState(getInitialDark);
  const connected = useConnected();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem(DARK_MODE_KEY, String(dark));
  }, [dark]);

  return (
    <header className="h-12 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span
          className={`inline-block w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}
          title={connected ? 'Connected to backend' : 'Disconnected from backend'}
        />
        Open Job Spec Admin Dashboard
      </div>
      <button
        onClick={() => setDark(!dark)}
        className="text-sm px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
        aria-label="Toggle dark mode"
      >
        {dark ? '☀️' : '🌙'}
      </button>
    </header>
  );
}
