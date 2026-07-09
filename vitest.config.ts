// Vitest configuration for unit tests. Uses happy-dom so any future
// renderer-side `*.test.tsx` files have a DOM, but for the current
// backend-only test suite it's effectively a no-op.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['electron/**/*.test.ts', 'shared/**/*.test.ts', 'src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'dist-electron'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['electron/**/*.ts', 'shared/**/*.ts'],
      exclude: [
        'electron/main.ts', // bootstrap, exercised via E2E
        'electron/preload.ts', // exercised via E2E
        'electron/**/*.test.ts',
      ],
    },
  },
})
