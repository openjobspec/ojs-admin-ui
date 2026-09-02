import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  test: {
    // Component/hook suites need a DOM; pure logic suites opt into the faster
    // `node` environment with a `// @vitest-environment node` docblock.
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // Bounded timeouts so a leaked timer/EventSource surfaces as a fast, clear
    // failure instead of hanging worker teardown.
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
  },
});

