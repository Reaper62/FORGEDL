// Vitest setup. Runs before every test file.
// Smoke-check the Zod settings schema once — catches schema regressions
// that would otherwise only manifest at runtime.
import { DownloadSettingsSchema } from './shared/types'
import { afterAll } from 'vitest'

const valid = DownloadSettingsSchema.parse({})
if (!valid || typeof valid !== 'object') {
  throw new Error('Settings schema failed smoke-check')
}

// When running under Electron (not plain Node), exit cleanly after the
// test suite finishes. This prevents Electron's main process from hanging
// because it doesn't know vitest is done. process.exit(0) is used instead
// of app.quit() to avoid stalling on before-quit handlers.
// This afterAll runs once per suite since setupFiles are evaluated globally.
afterAll(() => {
  if (
    typeof process !== 'undefined' &&
    process.versions != null &&
    'electron' in (process.versions as Record<string, unknown>)
  ) {
    process.exit(0)
  }
})
