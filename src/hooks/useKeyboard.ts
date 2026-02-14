import { useEffect } from 'react';

/** Calls handler on keydown, skipping events from input/textarea/select elements. */
export function useKeyboard(key: string, handler: () => void) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === key) {
        e.preventDefault();
        handler();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [key, handler]);
}
