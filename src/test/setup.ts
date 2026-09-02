import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Guarantee every rendered tree is unmounted after each test so hooks that open
// real timers / EventSource connections cannot leak into worker teardown.
afterEach(() => {
  cleanup();
});

// jsdom does not implement matchMedia; provide a minimal stub so components that
// read `prefers-color-scheme` (e.g. the theme toggle) can render under test.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
