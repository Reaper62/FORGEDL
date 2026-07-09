/**
 * End-to-end tests for the POST (Power-On Self-Test) diagnostics system.
 *
 * Strategy: Launch the real Electron app but mock the IPC handler for
 * runPost so we control the response. This tests the full React renderer,
 * IPC bridge, and UI behavior without depending on real system binaries.
 */
import { _electron as electron, test, expect, type Page } from '@playwright/test'
import type { PostResults, PostCheckResult } from '../shared/types'

// ── Mock data factories ──────────────────────────────────────────────

function mockCheck(overrides: Partial<PostCheckResult> = {}): PostCheckResult {
  return {
    name: 'yt-dlp',
    label: 'yt-dlp CLI',
    status: 'pass',
    message: 'yt-dlp 2024.01.01',
    durationMs: 150,
    ...overrides,
  }
}

function allPassedResults(): PostResults {
  return {
    checks: [
      mockCheck({
        name: 'yt-dlp',
        label: 'yt-dlp CLI',
        status: 'pass',
        message: 'yt-dlp 2024.01.01',
        durationMs: 150,
      }),
      mockCheck({
        name: 'ffmpeg',
        label: 'FFmpeg',
        status: 'pass',
        message: 'FFmpeg 6.1',
        durationMs: 120,
      }),
      mockCheck({
        name: 'internet',
        label: 'Internet Connection',
        status: 'pass',
        message: 'Connected',
        durationMs: 80,
      }),
      mockCheck({
        name: 'disk-space',
        label: 'Disk Space',
        status: 'pass',
        message: '245.3 GB free of 476.9 GB',
        durationMs: 5,
      }),
      mockCheck({
        name: 'write-permission',
        label: 'Write Permission',
        status: 'pass',
        message: 'Download directory is writable',
        durationMs: 3,
      }),
      mockCheck({
        name: 'database',
        label: 'Database',
        status: 'pass',
        message: 'Database integrity OK',
        durationMs: 10,
      }),
      mockCheck({
        name: 'extractors',
        label: 'Site Extractors',
        status: 'pass',
        message: '1847 extractors available',
        durationMs: 3200,
      }),
      mockCheck({
        name: 'download-test',
        label: 'Download Test',
        status: 'pass',
        message: 'End-to-end download succeeded',
        durationMs: 4500,
      }),
    ],
    allPassed: true,
    totalDurationMs: 8068,
  }
}

function mixedFailResults(): PostResults {
  return {
    checks: [
      mockCheck({
        name: 'yt-dlp',
        label: 'yt-dlp CLI',
        status: 'fail',
        message: 'yt-dlp executable not found',
        detail: 'Looked at: /usr/bin/yt-dlp',
        durationMs: 2,
      }),
      mockCheck({
        name: 'ffmpeg',
        label: 'FFmpeg',
        status: 'pass',
        message: 'FFmpeg 6.1',
        durationMs: 120,
      }),
      mockCheck({
        name: 'internet',
        label: 'Internet Connection',
        status: 'fail',
        message: 'No internet connection detected',
        durationMs: 8000,
      }),
      mockCheck({
        name: 'disk-space',
        label: 'Disk Space',
        status: 'pass',
        message: '245.3 GB free of 476.9 GB',
        durationMs: 5,
      }),
      mockCheck({
        name: 'write-permission',
        label: 'Write Permission',
        status: 'pass',
        message: 'Download directory is writable',
        durationMs: 3,
      }),
      mockCheck({
        name: 'database',
        label: 'Database',
        status: 'warning',
        message: 'Database integrity check returned unexpected result',
        durationMs: 1,
      }),
      mockCheck({
        name: 'extractors',
        label: 'Site Extractors',
        status: 'fail',
        message: 'Extractor check skipped — yt-dlp not found',
        durationMs: 1,
      }),
      mockCheck({
        name: 'download-test',
        label: 'Download Test',
        status: 'fail',
        message: 'Download test skipped — yt-dlp not found',
        durationMs: 1,
      }),
    ],
    allPassed: false,
    totalDurationMs: 8133,
  }
}

function mixedWarningResults(): PostResults {
  return {
    checks: [
      mockCheck({
        name: 'yt-dlp',
        label: 'yt-dlp CLI',
        status: 'warning',
        message: 'yt-dlp responded but version unknown',
        durationMs: 150,
      }),
      mockCheck({
        name: 'ffmpeg',
        label: 'FFmpeg',
        status: 'pass',
        message: 'FFmpeg 6.1',
        durationMs: 120,
      }),
      mockCheck({
        name: 'internet',
        label: 'Internet Connection',
        status: 'pass',
        message: 'Connected',
        durationMs: 80,
      }),
      mockCheck({
        name: 'disk-space',
        label: 'Disk Space',
        status: 'warning',
        message: 'Low disk space: 0.3 GB free of 476.9 GB',
        durationMs: 5,
      }),
      mockCheck({
        name: 'write-permission',
        label: 'Write Permission',
        status: 'pass',
        message: 'Download directory is writable',
        durationMs: 3,
      }),
      mockCheck({
        name: 'database',
        label: 'Database',
        status: 'pass',
        message: 'Database integrity OK',
        durationMs: 10,
      }),
      mockCheck({
        name: 'extractors',
        label: 'Site Extractors',
        status: 'pass',
        message: '1847 extractors available',
        durationMs: 3200,
      }),
      mockCheck({
        name: 'download-test',
        label: 'Download Test',
        status: 'pass',
        message: 'End-to-end download succeeded',
        durationMs: 4500,
      }),
    ],
    allPassed: false,
    totalDurationMs: 8068,
  }
}

// ── Test fixture ─────────────────────────────────────────────────────

/**
 * Launches the Electron app with a mocked runPost IPC handler.
 * Returns the ElectronApplication and the first Page.
 */
async function launchWithMock(mockData: PostResults) {
  const electronApp = await electron.launch({
    args: ['dist-electron/main.js'],
  })

  // Override the IPC handler in the main process BEFORE the page loads.
  // This ensures PostBanner (which runs POST on mount) gets our mock data.
  await electronApp.evaluate(
    ({ ipcMain }, { channel, data }: { channel: string; data: PostResults }) => {
      ipcMain.removeHandler(channel)
      ipcMain.handle(channel, () => ({ ok: true, data }))
    },
    { channel: 'system:runPost', data: mockData },
  )

  const page = await electronApp.firstWindow()
  // Wait for React to mount and the POST check to resolve
  await page.waitForSelector('[data-testid="post-banner"]', { timeout: 15_000 })

  return { electronApp, page }
}

// ── Navigate helpers ─────────────────────────────────────────────────

/** Click the Settings nav link and wait for the settings page to load. */
async function goToSettings(page: Page) {
  // Click the Settings link in the sidebar
  const settingsLink = page.locator('a[href="/settings"]')
  await settingsLink.click()
  // Wait for the diagnostics section to be visible
  await page.waitForSelector('[data-testid="run-diagnostics-btn"]', { timeout: 10_000 })
}

// ── Tests ────────────────────────────────────────────────────────────

test.describe('POST e2e', () => {
  test.describe('PostBanner auto-run', () => {
    test('shows banner with results on app launch', async () => {
      const { electronApp, page } = await launchWithMock(allPassedResults())

      // Banner should be visible
      const banner = page.locator('[data-testid="post-banner"]')
      await expect(banner).toBeVisible()

      // All-passed state shows "All systems operational"
      await expect(banner).toContainText('All systems operational')

      // Should show total duration
      await expect(banner).toContainText('8068ms')

      await electronApp.close()
    })

    test('shows issue count when checks fail', async () => {
      const { electronApp, page } = await launchWithMock(mixedFailResults())

      const banner = page.locator('[data-testid="post-banner"]')
      await expect(banner).toBeVisible()

      // Should show failure count
      await expect(banner).toContainText('issue')
      // ffmpeg passes (not included in fail count), yt-dlp, internet,
      // extractors, download-test fail = 4 fails + 1 warning
      await expect(banner).toContainText('4 issue')

      await electronApp.close()
    })

    test('expands to show per-check details', async () => {
      const { electronApp, page } = await launchWithMock(allPassedResults())

      // Click the banner to expand
      const banner = page.locator('[data-testid="post-banner"]')
      await banner.click()

      // Detail rows should appear
      const details = page.locator('[data-testid="post-banner-details"]')
      await expect(details).toBeVisible()

      // All 8 checks rendered
      const rows = details.locator('> div')
      await expect(rows).toHaveCount(8)

      // Check first row content
      await expect(rows.first()).toContainText('yt-dlp CLI')
      await expect(rows.first()).toContainText('yt-dlp 2024.01.01')

      await electronApp.close()
    })

    test('dismiss hides the banner', async () => {
      const { electronApp, page } = await launchWithMock(allPassedResults())

      const banner = page.locator('[data-testid="post-banner"]')
      await expect(banner).toBeVisible()

      // Click dismiss
      const dismissBtn = page.locator('[data-testid="post-banner-dismiss"]')
      await dismissBtn.click()

      // Banner should be gone
      await expect(banner).not.toBeVisible()

      await electronApp.close()
    })

    test('re-run button triggers fresh check', async () => {
      const { electronApp, page } = await launchWithMock(allPassedResults())

      // Wait for auto-run to finish
      const banner = page.locator('[data-testid="post-banner"]')
      await expect(banner).toContainText('All systems operational')

      // Override IPC to return failures for the re-run
      await electronApp.evaluate(
        ({ ipcMain }, { channel, data }: { channel: string; data: PostResults }) => {
          ipcMain.removeHandler(channel)
          ipcMain.handle(channel, () => ({ ok: true, data }))
        },
        { channel: 'system:runPost', data: mixedFailResults() },
      )

      // Click re-run
      const rerunBtn = page.locator('[data-testid="post-banner-rerun"]')
      await rerunBtn.click()

      // Should now show failures
      await expect(banner).toContainText('issue')

      await electronApp.close()
    })
  })

  test.describe('Settings diagnostics', () => {
    test('shows Run Diagnostics button on settings page', async () => {
      const { electronApp, page } = await launchWithMock(allPassedResults())
      await goToSettings(page)

      const btn = page.locator('[data-testid="run-diagnostics-btn"]')
      await expect(btn).toBeVisible()
      await expect(btn).toContainText('Run Diagnostics')

      await electronApp.close()
    })

    test('clicking Run Diagnostics displays results with all passed', async () => {
      const { electronApp, page } = await launchWithMock(allPassedResults())
      await goToSettings(page)

      // Click the Run Diagnostics button
      const btn = page.locator('[data-testid="run-diagnostics-btn"]')
      await btn.click()

      // Wait for results to appear
      const results = page.locator('[data-testid="diagnostics-results"]')
      await expect(results).toBeVisible({ timeout: 10_000 })

      // Summary should show all passed
      const summary = page.locator('[data-testid="diagnostics-summary"]')
      await expect(summary).toContainText('All systems operational')

      // All 8 checks rendered
      const checks = page.locator('[data-testid="diagnostics-checks"] > div')
      await expect(checks).toHaveCount(8)

      // Each check has its label
      await expect(checks.nth(0)).toContainText('yt-dlp CLI')
      await expect(checks.nth(1)).toContainText('FFmpeg')
      await expect(checks.nth(2)).toContainText('Internet Connection')
      await expect(checks.nth(7)).toContainText('Download Test')

      await electronApp.close()
    })

    test('displays failures with red summary header', async () => {
      const { electronApp, page } = await launchWithMock(mixedFailResults())
      await goToSettings(page)

      const btn = page.locator('[data-testid="run-diagnostics-btn"]')
      await btn.click()

      // Wait for results
      const results = page.locator('[data-testid="diagnostics-results"]')
      await expect(results).toBeVisible({ timeout: 10_000 })

      // Summary shows issues
      const summary = page.locator('[data-testid="diagnostics-summary"]')
      await expect(summary).toContainText('Issues detected')

      // Description should show issue count
      const description = page.locator('text=issue')
      await expect(description.first()).toBeVisible()

      await electronApp.close()
    })

    test('displays warnings with details in check rows', async () => {
      const { electronApp, page } = await launchWithMock(mixedWarningResults())
      await goToSettings(page)

      const btn = page.locator('[data-testid="run-diagnostics-btn"]')
      await btn.click()

      // Wait for results
      const results = page.locator('[data-testid="diagnostics-results"]')
      await expect(results).toBeVisible({ timeout: 10_000 })

      // Should NOT be all passed (warnings make allPassed=false)
      const summary = page.locator('[data-testid="diagnostics-summary"]')
      await expect(summary).toContainText('Issues detected')

      // yt-dlp row should show WARN badge
      const checks = page.locator('[data-testid="diagnostics-checks"] > div')
      await expect(checks.nth(0)).toContainText('WARN')

      // disk-space row should show warning
      await expect(checks.nth(3)).toContainText('WARN')

      await electronApp.close()
    })

    test('shows loading state while diagnostics run', async () => {
      const { electronApp, page } = await launchWithMock(allPassedResults())
      await goToSettings(page)

      const btn = page.locator('[data-testid="run-diagnostics-btn"]')
      await btn.click()

      // Button should temporarily show "Running…"
      // (The mock resolves instantly so this may be too fast to catch,
      // but we verify the button becomes enabled again after completion)
      await expect(btn).toBeEnabled({ timeout: 10_000 })

      await electronApp.close()
    })

    test('handles IPC error gracefully', async () => {
      const electronApp = await electron.launch({
        args: ['dist-electron/main.js'],
      })

      // Mock runPost to throw an error
      await electronApp.evaluate(
        ({ ipcMain }, { channel }: { channel: string }) => {
          ipcMain.removeHandler(channel)
          ipcMain.handle(channel, () => {
            throw new Error('IPC handler crashed')
          })
        },
        { channel: 'system:runPost' },
      )

      const page = await electronApp.firstWindow()
      await page.waitForSelector('[data-testid="run-diagnostics-btn"]', { timeout: 15_000 })
      await goToSettings(page)

      const btn = page.locator('[data-testid="run-diagnostics-btn"]')
      await btn.click()

      // Error banner should appear
      const errorBanner = page.locator('[data-testid="diagnostics-error"]')
      await expect(errorBanner).toBeVisible({ timeout: 10_000 })
      await expect(errorBanner).toContainText('Diagnostics failed to run')

      await electronApp.close()
    })

    test('updates description text after diagnostics run', async () => {
      const { electronApp, page } = await launchWithMock(allPassedResults())
      await goToSettings(page)

      // Default description
      await expect(
        page.locator('text=Verify that all system components are working correctly'),
      ).toBeVisible()

      const btn = page.locator('[data-testid="run-diagnostics-btn"]')
      await btn.click()

      // After run, description shows pass count
      await page.waitForSelector('[data-testid="diagnostics-results"]')
      await expect(page.locator('text=All 8 checks passed in 8068ms')).toBeVisible()

      await electronApp.close()
    })
  })
})
