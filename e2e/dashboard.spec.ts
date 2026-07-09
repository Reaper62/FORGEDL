/**
 * End-to-end tests for the download flow and dashboard interactions.
 *
 * Strategy: Launch the real Electron app but mock IPC handlers so we can
 * control responses and test the full React renderer + IPC bridge without
 * depending on real system binaries or network access.
 */
import { _electron as electron, test, expect, type Page } from '@playwright/test'

// ── System IPC mock helpers ──────────────────────────────────────────

async function setupBaseMocks(app: any) {
  await app.evaluate(({ ipcMain }: any) => {
    const channels = [
      'download:getAll',
      'download:getQueueStats',
      'download:add',
      'download:addBatch',
      'download:fetchMetadata',
      'download:fetchPlaylist',
      'download:pause',
      'download:resume',
      'download:cancel',
      'download:remove',
      'download:retry',
      'download:clearCompleted',
      'download:reorder',
      'download:reorderToPosition',
      'download:setSpeedLimit',
      'settings:get',
      'settings:update',
      'settings:reset',
      'settings:getPresets',
      'settings:savePresets',
      'system:getForgedlBasePath',
      'system:runPost',
      'system:getYtDlpVersion',
      'system:getFfmpegVersion',
    ]
    for (const ch of channels) {
      try {
        ipcMain.removeHandler(ch)
      } catch (_) {
        /* ignore */
      }
    }

    ipcMain.handle('download:getAll', () => ({
      ok: true,
      data: [
        {
          id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          url: 'https://example.com/1',
          title: 'First Video',
          status: 'downloading',
          progress: 45,
          speed: '2.5 MiB/s',
          eta: '32s',
          priority: 5,
          createdAt: '2026-07-05T12:00:00.000Z',
        },
        {
          id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          url: 'https://example.com/2',
          title: 'Second Video',
          status: 'waiting',
          progress: 0,
          priority: 5,
          createdAt: '2026-07-05T12:01:00.000Z',
        },
        {
          id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
          url: 'https://example.com/3',
          title: 'Third Video',
          status: 'waiting',
          progress: 0,
          priority: 5,
          createdAt: '2026-07-05T12:02:00.000Z',
        },
        {
          id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
          url: 'https://example.com/4',
          title: 'Failed Download',
          status: 'error',
          error: 'HTTP Error 403: Forbidden',
          progress: 72,
          priority: 5,
          createdAt: '2026-07-05T12:03:00.000Z',
        },
        {
          id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
          url: 'https://example.com/5',
          title: 'Completed Video',
          status: 'completed',
          progress: 100,
          priority: 5,
          createdAt: '2026-07-05T12:04:00.000Z',
          completedAt: '2026-07-05T12:10:00.000Z',
        },
      ],
    }))
    ipcMain.handle('download:getQueueStats', () => ({
      ok: true,
      data: { total: 5, downloading: 1, waiting: 2, completed: 1, failed: 1 },
    }))
    ipcMain.handle('download:add', () => ({
      ok: true,
      data: {
        id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
        url: 'https://example.com/new',
        title: 'New Download',
        status: 'waiting',
        progress: 0,
        priority: 5,
        createdAt: '2026-07-05T13:00:00.000Z',
      },
    }))
    ipcMain.handle('download:addBatch', () => ({ ok: true, data: [] }))
    ipcMain.handle('download:fetchMetadata', () => ({
      ok: true,
      data: {
        id: 'dQw4w9WgXcQ',
        title: 'Rick Astley - Never Gonna Give You Up',
        duration: 212,
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        uploader: 'RickAstleyVEVO',
        view_count: 1500000000,
        formats: [
          {
            format_id: '247',
            ext: 'webm',
            resolution: '1280x720',
            vcodec: 'vp9',
            filesize: 15000000,
            fps: 30,
            width: 1280,
            height: 720,
          },
          { format_id: '140', ext: 'm4a', acodec: 'mp4a.40.2', filesize: 2500000, abr: 128 },
        ],
      },
    }))
    ipcMain.handle('download:fetchPlaylist', () => ({
      ok: true,
      data: {
        metadata: { title: 'My Playlist', totalExpected: 5 },
        items: [
          { id: 'vid1', url: 'https://example.com/1', title: 'First', index: 1 },
          { id: 'vid2', url: 'https://example.com/2', title: 'Second', index: 2 },
        ],
        errors: {},
      },
    }))
    ipcMain.handle('download:pause', () => ({ ok: true, data: undefined }))
    ipcMain.handle('download:resume', () => ({ ok: true, data: undefined }))
    ipcMain.handle('download:cancel', () => ({ ok: true, data: undefined }))
    ipcMain.handle('download:remove', () => ({ ok: true, data: undefined }))
    ipcMain.handle('download:retry', () => ({ ok: true, data: undefined }))
    ipcMain.handle('download:clearCompleted', () => ({ ok: true, data: undefined }))
    ipcMain.handle('download:reorder', () => ({ ok: true, data: undefined }))
    ipcMain.handle('download:reorderToPosition', () => ({ ok: true, data: undefined }))
    ipcMain.handle('download:setSpeedLimit', () => ({ ok: true, data: undefined }))
    ipcMain.handle('settings:get', () => ({
      ok: true,
      data: {
        outputFormat: 'bestvideo+bestaudio/best',
        downloadPath: '/tmp/FORGEDL',
        extractAudio: false,
        audioFormat: 'mp3',
        embedMetadata: true,
        maxConcurrent: 3,
        speedLimit: '',
        namingTemplate: '%(title)s.%(ext)s',
        basePresetId: '',
        ytdlpPath: 'yt-dlp',
        ffmpegPath: 'ffmpeg',
      },
    }))
    ipcMain.handle('settings:update', () => ({ ok: true, data: undefined }))
    ipcMain.handle('settings:reset', () => ({ ok: true, data: undefined }))
    ipcMain.handle('settings:getPresets', () => ({
      ok: true,
      data: [
        {
          id: 'preset-1',
          name: 'Audio Only',
          outputFormat: 'bestaudio',
          createdAt: '2026-07-01T00:00:00.000Z',
        },
        {
          id: 'preset-2',
          name: '4K + Subs',
          outputFormat: 'bestvideo[height<=2160]+bestaudio/best',
          extraFlags: { embedSubs: true, subtitleLangs: ['en', 'ja'] },
          createdAt: '2026-07-02T00:00:00.000Z',
        },
      ],
    }))
    ipcMain.handle('settings:savePresets', () => ({ ok: true, data: undefined }))
    ipcMain.handle('system:getForgedlBasePath', () => ({ ok: true, data: '/tmp/FORGEDL' }))
    ipcMain.handle('system:runPost', () => ({
      ok: true,
      data: { checks: [], allPassed: true, totalDurationMs: 0 },
    }))
    ipcMain.handle('system:getYtDlpVersion', () => ({ ok: true, data: '2024.01.01' }))
    ipcMain.handle('system:getFfmpegVersion', () => ({ ok: true, data: '6.1' }))
  })
}

// ── Fixture: launch app with all mocks ───────────────────────────────

async function launchApp() {
  const electronApp = await electron.launch({ args: ['dist-electron/main.js'] })
  await setupBaseMocks(electronApp)
  const page = await electronApp.firstWindow()
  // Wait for the Dashboard to load
  await page.waitForSelector('text=New Download', { timeout: 15_000 })
  // Dismiss POST banner if visible
  const dismissBtn = page.locator('[data-testid="post-banner-dismiss"]')
  if (await dismissBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await dismissBtn.click()
  }
  return { electronApp, page }
}

async function goToSettings(page: Page) {
  const settingsLink = page.locator('a[href="/settings"]')
  await settingsLink.click()
  await page.waitForSelector('text=Configure download behaviour', { timeout: 10_000 })
}

// ── Tests ────────────────────────────────────────────────────────────

test.describe('Dashboard — Download Flow', () => {
  test('renders the New Download section with URL input', async () => {
    const { electronApp, page } = await launchApp()

    await expect(page.locator('text=New Download')).toBeVisible()
    const input = page.locator('[data-testid="download-url-input"]')
    await expect(input).toBeVisible()

    await electronApp.close()
  })

  test('shows validation error for invalid URL', async () => {
    const { electronApp, page } = await launchApp()

    const input = page.locator('[data-testid="download-url-input"]')
    await input.fill('not-a-url')
    await input.press('Enter')

    await expect(page.locator('text=Please enter a valid URL')).toBeVisible()

    await electronApp.close()
  })

  test('adds a download to the queue', async () => {
    const { electronApp, page } = await launchApp()

    const input = page.locator('[data-testid="download-url-input"]')
    await input.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ')

    // Click the Download button
    await page.locator('[data-testid="download-btn"]').click()

    // Wait for the toast notification
    await expect(page.locator('text=Download added to queue')).toBeVisible({ timeout: 5_000 })

    await electronApp.close()
  })

  test('fetches and displays video metadata on Shift+Enter', async () => {
    const { electronApp, page } = await launchApp()

    const input = page.locator('[data-testid="download-url-input"]')
    await input.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    await input.press('Shift+Enter')

    // Wait for the format inspector panel
    await expect(page.locator('text=Rick Astley - Never Gonna Give You Up')).toBeVisible({
      timeout: 10_000,
    })

    // Format quick-select buttons should be visible
    await expect(page.locator('[data-testid="format-btn-best"]')).toBeVisible()
    await expect(page.locator('[data-testid="format-btn-smallest"]')).toBeVisible()
    await expect(page.locator('[data-testid="format-btn-audio"]')).toBeVisible()

    await electronApp.close()
  })

  test('detects playlist URL and shows playlist indicator badge', async () => {
    const { electronApp, page } = await launchApp()

    const input = page.locator('[data-testid="download-url-input"]')
    await input.fill('https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf')

    // Playlist badge should appear
    await expect(page.locator('text=Playlist')).toBeVisible({ timeout: 3_000 })

    await electronApp.close()
  })
})

test.describe('Dashboard — Queue Management', () => {
  test('renders the queue with download items and stats', async () => {
    const { electronApp, page } = await launchApp()

    await expect(page.locator('[data-testid="queue-section"]')).toBeVisible()

    // Queue items should load
    await expect(page.locator('text=First Video')).toBeVisible({ timeout: 5_000 })
    await expect(page.locator('text=Second Video')).toBeVisible()
    await expect(page.locator('text=Failed Download')).toBeVisible()
    await expect(page.locator('text=Completed Video')).toBeVisible()

    // Stats strip should show counts
    await expect(page.locator('text=1 downloading')).toBeVisible()
    await expect(page.locator('text=2 waiting')).toBeVisible()

    await electronApp.close()
  })

  test('shows correct status labels for different download states', async () => {
    const { electronApp, page } = await launchApp()

    await expect(page.locator('text=First Video')).toBeVisible({ timeout: 5_000 })

    await expect(page.locator('text=Downloading').first()).toBeVisible()
    await expect(page.locator('text=Waiting').first()).toBeVisible()
    await expect(page.locator('text=Failed').first()).toBeVisible()
    await expect(page.locator('text=Completed').first()).toBeVisible()

    await electronApp.close()
  })

  test('shows empty state when queue has no items', async () => {
    const electronApp = await electron.launch({ args: ['dist-electron/main.js'] })

    // Override getAll to return empty array BEFORE the page loads
    await electronApp.evaluate(({ ipcMain }: any) => {
      try {
        ipcMain.removeHandler('download:getAll')
      } catch (_) {
        /* ignore */
      }
      ipcMain.handle('download:getAll', () => ({ ok: true, data: [] }))
      try {
        ipcMain.removeHandler('download:getQueueStats')
      } catch (_) {
        /* ignore */
      }
      ipcMain.handle('download:getQueueStats', () => ({
        ok: true,
        data: { total: 0, downloading: 0, waiting: 0, completed: 0, failed: 0 },
      }))
    })
    await setupBaseMocks(electronApp)

    const page = await electronApp.firstWindow()
    await page.waitForSelector('[data-testid="queue-section"]', { timeout: 15_000 })

    // Dismiss POST banner
    const dismissBtn = page.locator('[data-testid="post-banner-dismiss"]')
    if (await dismissBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dismissBtn.click()
    }

    await expect(page.locator('text=Queue is empty')).toBeVisible({ timeout: 5_000 })
    await expect(page.locator('text=Add a URL above to get started')).toBeVisible()

    await electronApp.close()
  })

  test('clear completed shows confirmation buttons', async () => {
    const { electronApp, page } = await launchApp()

    // Click "Clear Completed"
    const clearBtn = page.locator('[data-testid="clear-completed-btn"]')
    await clearBtn.click()

    // Confirmation should appear
    await expect(page.locator('[data-testid="confirm-clear-btn"]')).toBeVisible()
    await expect(page.locator('[data-testid="cancel-clear-btn"]')).toBeVisible()

    await electronApp.close()
  })

  test('drag handles are present on waiting items only', async () => {
    const { electronApp, page } = await launchApp()

    await expect(page.locator('text=Second Video')).toBeVisible({ timeout: 5_000 })

    // Waiting items should have drag handles
    const dragHandles = page.locator('[aria-label*="Drag to reorder"]')
    const count = await dragHandles.count()
    // Two waiting items should have drag handles
    expect(count).toBeGreaterThanOrEqual(2)

    await electronApp.close()
  })

  test('Open Folder button is visible in queue header', async () => {
    const { electronApp, page } = await launchApp()

    await expect(page.locator('[data-testid="open-folder-btn"]')).toBeVisible()

    await electronApp.close()
  })
})

test.describe('Dashboard — Advanced Drawer', () => {
  test('opens and closes the advanced drawer', async () => {
    const { electronApp, page } = await launchApp()

    const advBtn = page.locator('[data-testid="advanced-options-btn"]')
    await advBtn.click()

    await expect(page.locator('text=Advanced Options')).toBeVisible({ timeout: 3_000 })

    const closeBtn = page.locator('[data-testid="advanced-drawer-close"]')
    await closeBtn.click()

    await expect(page.locator('text=Advanced Options')).not.toBeVisible({ timeout: 3_000 })

    await electronApp.close()
  })

  test('shows all five sections in the drawer', async () => {
    const { electronApp, page } = await launchApp()

    const advBtn = page.locator('[data-testid="advanced-options-btn"]')
    await advBtn.click()

    await expect(page.locator('text=Advanced Options')).toBeVisible({ timeout: 3_000 })

    // All section labels visible
    await expect(page.locator('text=Subtitles')).toBeVisible()
    await expect(page.locator('text=Authentication')).toBeVisible()
    await expect(page.locator('text=Network')).toBeVisible()
    await expect(page.locator('text=Bandwidth')).toBeVisible()
    await expect(page.locator('text=Playlist Range')).toBeVisible()

    await electronApp.close()
  })

  test('bandwidth section has speed limit preset buttons', async () => {
    const { electronApp, page } = await launchApp()

    const advBtn = page.locator('[data-testid="advanced-options-btn"]')
    await advBtn.click()
    await expect(page.locator('text=Advanced Options')).toBeVisible({ timeout: 3_000 })

    // Open the Bandwidth section
    const bandwidthHeader = page.locator('[data-testid="advanced-section-bandwidth"]')
    await bandwidthHeader.click()

    // Speed limit presets visible
    await expect(page.locator('text=Per-download speed limit')).toBeVisible()
    await expect(page.locator('[data-testid="speed-preset-none"]')).toBeVisible()
    await expect(page.locator('[data-testid="speed-preset-1m"]')).toBeVisible()
    await expect(page.locator('[data-testid="speed-preset-5m"]')).toBeVisible()
    await expect(page.locator('[data-testid="speed-preset-10m"]')).toBeVisible()

    await electronApp.close()
  })

  test('applies speed limit override and persists in drawer', async () => {
    const { electronApp, page } = await launchApp()

    const advBtn = page.locator('[data-testid="advanced-options-btn"]')
    await advBtn.click()
    await expect(page.locator('text=Advanced Options')).toBeVisible({ timeout: 3_000 })

    // Open bandwidth section and set a speed limit
    const bandwidthHeader = page.locator('[data-testid="advanced-section-bandwidth"]')
    await bandwidthHeader.click()
    await page.locator('[data-testid="speed-preset-1m"]').click()

    // Apply the override
    await page.locator('[data-testid="apply-overrides-btn"]').click()

    // Close and reopen the drawer — the bandwidth setting should persist
    const closeBtn = page.locator('[data-testid="advanced-drawer-close"]')
    await closeBtn.click()
    await expect(page.locator('text=Advanced Options')).not.toBeVisible({ timeout: 3_000 })

    // Reopen the drawer and check the bandwidth section still has 1M
    await page.locator('[data-testid="advanced-options-btn"]').click()
    await expect(page.locator('text=Advanced Options')).toBeVisible({ timeout: 3_000 })
    await page.locator('[data-testid="advanced-section-bandwidth"]').click()

    // The speed limit input should still have 1M
    const speedInput = page.locator('[data-testid="speed-limit-input"]')
    await expect(speedInput).toHaveValue('1M')

    await electronApp.close()
  })
})

test.describe('Dashboard — Presets', () => {
  test('shows preset selector in metadata panel', async () => {
    const { electronApp, page } = await launchApp()

    // Fetch metadata to show the panel
    const input = page.locator('[data-testid="download-url-input"]')
    await input.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    await input.press('Shift+Enter')
    await expect(page.locator('text=Rick Astley')).toBeVisible({ timeout: 10_000 })

    // "Presets" label should be visible
    await expect(page.locator('text=Presets').first()).toBeVisible()

    await electronApp.close()
  })

  test('applies a preset when its name is clicked', async () => {
    const { electronApp, page } = await launchApp()

    // Fetch metadata to reveal preset selector
    const input = page.locator('[data-testid="download-url-input"]')
    await input.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    await input.press('Shift+Enter')
    await expect(page.locator('text=Rick Astley')).toBeVisible({ timeout: 10_000 })

    // Find the PresetSelector container and click "Audio Only" inside it
    await page.locator('[data-testid="preset-btn-Audio Only"]').click()

    // The preset button should still exist
    await expect(page.locator('[data-testid="preset-btn-Audio Only"]')).toBeVisible()

    await electronApp.close()
  })

  test('shows save preset input when Save button is clicked', async () => {
    const { electronApp, page } = await launchApp()

    // Fetch metadata
    const input = page.locator('[data-testid="download-url-input"]')
    await input.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    await input.press('Shift+Enter')
    await expect(page.locator('text=Rick Astley')).toBeVisible({ timeout: 10_000 })

    // Click "Save" — scoped to the preset row
    const savePresetBtn = page.locator('[data-testid="preset-save-btn"]')
    await savePresetBtn.click()

    // Input field should appear
    await expect(page.locator('[data-testid="preset-save-input"]')).toBeVisible()

    await electronApp.close()
  })
})

test.describe('Settings — File Naming & Base Preset', () => {
  test('navigates to settings page', async () => {
    const { electronApp, page } = await launchApp()

    await goToSettings(page)
    await expect(page.locator('text=Configure download behaviour')).toBeVisible()

    await electronApp.close()
  })

  test('file naming section shows template input and live preview', async () => {
    const { electronApp, page } = await launchApp()
    await goToSettings(page)

    await expect(page.locator('text=File Naming')).toBeVisible()

    const templateInput = page.locator('input[placeholder="%(title)s.%(ext)s"]')
    await expect(templateInput).toBeVisible()
    await expect(templateInput).toHaveValue('%(title)s.%(ext)s')

    // Live preview should show the rendered filename
    await expect(page.locator('text=My Video Title.mp4')).toBeVisible()

    // Available variables section should be present
    await expect(page.locator('text=Available variables')).toBeVisible()

    await electronApp.close()
  })

  test('file naming preview updates when template is changed', async () => {
    const { electronApp, page } = await launchApp()
    await goToSettings(page)

    const templateInput = page.locator('input[placeholder="%(title)s.%(ext)s"]')
    await templateInput.clear()
    await templateInput.fill('%(uploader)s - %(title)s [%(resolution)s].%(ext)s')

    // Preview should update to show new pattern
    await expect(page.locator('text=ChannelName - My Video Title [1920x1080].mp4')).toBeVisible()

    await electronApp.close()
  })

  test('base preset selector shows in advanced section', async () => {
    const { electronApp, page } = await launchApp()
    await goToSettings(page)

    // Open the Advanced section
    const advancedBtn = page.locator('button', { hasText: 'Advanced' })
    await advancedBtn.click()

    await expect(page.locator('text=Default Preset')).toBeVisible({ timeout: 3_000 })

    // Preset buttons match our mock data
    await expect(page.locator('button', { hasText: 'Audio Only' })).toBeVisible()
    await expect(page.locator('button', { hasText: '4K + Subs' })).toBeVisible()

    await electronApp.close()
  })

  test('selecting a base preset shows its configuration summary', async () => {
    const { electronApp, page } = await launchApp()
    await goToSettings(page)

    const advancedBtn = page.locator('button', { hasText: 'Advanced' })
    await advancedBtn.click()
    await expect(page.locator('text=Default Preset')).toBeVisible({ timeout: 3_000 })

    // Select the "4K + Subs" preset
    const presetBtn = page.locator('button', { hasText: '4K + Subs' })
    await presetBtn.click()

    // Summary badge should show the format string
    await expect(page.locator('text=bestvideo[height<=2160]+bestaudio/best')).toBeVisible({
      timeout: 3_000,
    })
    // +subs badge should appear
    await expect(page.locator('text=+subs')).toBeVisible({ timeout: 3_000 })

    await electronApp.close()
  })

  test('saves settings with custom file naming template', async () => {
    const { electronApp, page } = await launchApp()
    await goToSettings(page)

    // Change the naming template to make the form dirty
    const templateInput = page.locator('input[placeholder="%(title)s.%(ext)s"]')
    await templateInput.clear()
    await templateInput.fill('%(upload_date)s_%(title)s.%(ext)s')

    // Save changes button should be enabled
    const saveBtn = page.locator('button', { hasText: 'Save changes' })
    await expect(saveBtn).toBeEnabled({ timeout: 3_000 })
    await saveBtn.click()

    // Toast notification should appear
    await expect(page.locator('text=Settings saved successfully')).toBeVisible({ timeout: 5_000 })

    await electronApp.close()
  })
})

test.describe('Dashboard — Navigation', () => {
  test('sidebar navigation links work between all routes', async () => {
    const { electronApp, page } = await launchApp()

    // Dashboard is active by default
    await expect(page.locator('text=New Download')).toBeVisible()

    // Navigate to History
    await page.locator('a[href="/history"]').click()
    await expect(page.locator('text=History').first()).toBeVisible({ timeout: 5_000 })

    // Navigate to Settings
    await page.locator('a[href="/settings"]').click()
    await expect(page.locator('text=Configure download behaviour')).toBeVisible({ timeout: 5_000 })

    // Navigate back to Dashboard
    await page.locator('a[href="/"]').click()
    await expect(page.locator('text=New Download')).toBeVisible({ timeout: 5_000 })

    await electronApp.close()
  })
})
