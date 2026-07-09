// Electron main entry point — bootstraps new architecture and creates the renderer window.
import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { initDatabase } from './database/connection'
import { initLogger, getLogger } from './logging/logger'
import { applyCSP } from './security/csp'
import { initWindowState, getWindowState, saveWindowState } from './services/window-state'
import { setDownloadBasePath } from './services/download-path'
import { buildServices as _buildServices, resetServicesCache } from './services/container'
import {
  attachIpcToWindow,
  bootstrapIpc,
  detachIpc,
  shutdownIpc,
  getServices,
  runStartupHealthCheck,
} from './ipc/register-all'
import { bindDatabaseAccessor, resetRepositories } from './database/repositories'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SHUTDOWN_MAX_WAIT_MS = 15_000
let mainWindow: BrowserWindow | null = null
let isShuttingDown = false

function createWindow(): void {
  const windowState = getWindowState()

  mainWindow = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    minWidth: 900,
    minHeight: 600,
    show: false,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  })

  if (windowState.isMaximized) mainWindow.maximize()
  if (windowState.isFullScreen) mainWindow.setFullScreen(true)

  const persistState = (): void => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    const bounds = mainWindow.getBounds()
    saveWindowState({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized: mainWindow.isMaximized(),
      isFullScreen: mainWindow.isFullScreen(),
    })
  }

  mainWindow.on('resize', persistState)
  mainWindow.on('move', persistState)
  mainWindow.on('maximize', persistState)
  mainWindow.on('unmaximize', persistState)
  mainWindow.on('enter-full-screen', persistState)
  mainWindow.on('leave-full-screen', persistState)

  mainWindow.once('ready-to-show', () => mainWindow?.show())

  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
    getLogger().error(`Renderer failed to load: ${code} ${desc} — ${url}`)
  })
  mainWindow.webContents.on('render-process-gone', (_e, details) => {
    getLogger().error('Renderer process gone:', details)
  })

  const devServerUrl = process.env.VITE_DEV_SERVER_URL
  if (devServerUrl) {
    // Running via vite-plugin-electron dev mode (npm run dev / npx vite)
    mainWindow.loadURL(devServerUrl)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    // Running from built files (npm run electron:dev) or packaged
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  attachIpcToWindow(mainWindow)

  // Run startup health check after the renderer has loaded so the
  // ipcRenderer.on('startup:health') listener is registered in the
  // React StartupHealth component. did-finish-load fires after all
  // scripts have executed but before paint.
  mainWindow.webContents.once('did-finish-load', () => {
    runStartupHealthCheck()
  })

  // Now that events can reach the renderer, kick queue processing.
  try {
    getServices().queue.processQueue()
  } catch (e) {
    getLogger().warn(`Initial processQueue failed: ${(e as Error).message}`)
  }

  mainWindow.on('closed', () => {
    mainWindow = null
    detachIpc()
  })
}

function bootstrapRuntime(): void {
  const userData = app.getPath('userData')
  // Use Electron's localized Downloads path for platform-correct defaults
  setDownloadBasePath(app.getPath('downloads'))
  initLogger(userData)
  initWindowState(userData)
  const db = initDatabase(userData)
  bindDatabaseAccessor(() => db)

  // bootstrapIpc creates services with a WebContentsEventSink (initially
  // a no-op because the window hasn't been attached yet) and registers
  // every IPC handler. attachIpcToWindow — called inside createWindow —
  // is the single point that points the sink at the renderer.
  bootstrapIpc()

  // Pure DB recovery is safe before the window is ready.
  getServices().queue.runStartupRecovery()
  applyCSP()
}

app.on('web-contents-created', (_e, contents) => {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }))
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsed = new URL(navigationUrl)
    const ok =
      (parsed.hostname === 'localhost' && parsed.protocol === 'http:') ||
      parsed.protocol === 'file:'
    if (!ok) {
      event.preventDefault()
      getLogger().warn(`Blocked navigation to ${navigationUrl}`)
    }
  })
})

app.whenReady().then(() => {
  bootstrapRuntime()
  getLogger().info('Subsystems loaded. Creating window...')
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', (event) => {
  if (isShuttingDown) return
  let services: ReturnType<typeof _buildServices> | null = null
  try {
    services = getServices() ?? null
  } catch {
    services = null
  }
  const active = services?.runtime?.activeCount ?? 0
  if (active > 0) {
    event.preventDefault()
    isShuttingDown = true
    getLogger().info(`Shutting down with ${active} active download(s)`)
    if (services) {
      services.runtime.cancelAll()
      void services.runtime.waitForAllExit(SHUTDOWN_MAX_WAIT_MS).then(() => {
        shutdownIpc()
        resetServicesCache()
        resetRepositories()
        app.quit()
      })
      return
    }
    shutdownIpc()
    app.quit()
    return
  }
  shutdownIpc()
})

// Suppress noisy uncaught rejections on Windows where `os.platform()` etc.
// fall back gracefully but can still log noisily. We never let them crash.
process.on('uncaughtException', (err) => {
  getLogger().error('Uncaught exception in main process:', err)
})
process.on('unhandledRejection', (reason) => {
  getLogger().error('Unhandled rejection in main process:', reason)
})

void os // imported for future use (disk space, network interface checks)
