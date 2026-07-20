import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Unit-test runner for pure lib/ code (no Next.js runtime required).
 * Alias `@/` mirrors tsconfig paths so imports match app code.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', 'lib/**/__tests__/**/*.test.ts'],
    clearMocks: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
