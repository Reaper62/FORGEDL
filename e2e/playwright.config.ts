import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  // Electron tests don't use webServer or browser projects — we launch
  // the Electron app programmatically in fixtures.
  use: {
    // No browser config needed for _electron tests
  },
})
