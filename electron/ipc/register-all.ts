// IPC orchestrator. Wires the active web-contents into the EventSink
// and registers every IPC area in a single call.
import type { BrowserWindow, WebContents } from 'electron'
import { registerDownloadsIPC } from './downloads'
import { registerHistoryIPC } from './history'
import { registerSettingsIPC } from './settings'
import { registerSystemIPC } from './system'
import { registerDialogIPC } from './dialog'
import { buildServices, getServices, resetServicesCache } from '../services/container'
import { bindDatabaseAccessor, getRepositories, resetRepositories } from '../database/repositories'
import type { EventSink } from '../services/event-bus'
import { getDatabase } from '../database/connection'
import { checkBinaryHealth } from '../services/runtime-info'
import { STARTUP_HEALTH_CHANNEL } from '../../shared/ipc-channels'
import { getLogger } from '../logging/logger'
import type { BinaryHealth } from '../../shared/types'

class WebContentsEventSink implements EventSink {
  constructor(private wc: WebContents | null) {}
  send(channel: string, ...args: unknown[]): void {
    if (!this.wc || this.wc.isDestroyed()) return
    this.wc.send(channel, ...args)
  }
  isReady(): boolean {
    return !!this.wc && !this.wc.isDestroyed()
  }
  set(wc: WebContents | null): void {
    this.wc = wc
  }
}

let sink: WebContentsEventSink | null = null

/**
 * Build services + register every IPC handler. Idempotent within a session;
 * subsequent calls do nothing.
 */
export function bootstrapIpc(): void {
  if (sink) return
  bindDatabaseAccessor(() => getDatabase())
  // Pre-build repositories so the queue service gets the same instance across runs.
  getRepositories()
  sink = new WebContentsEventSink(null)
  buildServices({ events: sink })
  registerDownloadsIPC()
  registerHistoryIPC()
  registerSettingsIPC()
  registerSystemIPC()
  registerDialogIPC()
}

/** Call after BrowserWindow creation to route events to the renderer. */
export function attachIpcToWindow(win: BrowserWindow): void {
  bootstrapIpc()
  sink?.set(win.webContents)
}

/** Detach on window close to prevent stray events. */
export function detachIpc(): void {
  sink?.set(null)
}

export function shutdownIpc(): void {
  sink?.set(null)
  resetServicesCache()
  resetRepositories()
  sink = null
}

/** For tests/devtools: peek the live services. */
export { getServices }

/**
 * Run a startup health check on yt-dlp and ffmpeg, then push results
 * to the renderer via the event sink. Called once after window creation.
 */
export function runStartupHealthCheck(): void {
  if (!sink || !sink.isReady()) return

  getLogger().info('Running startup binary health check...')

  try {
    const ytDlpResult: BinaryHealth = checkBinaryHealth('yt-dlp')
    const ffmpegResult: BinaryHealth = checkBinaryHealth('ffmpeg')

    sink.send(STARTUP_HEALTH_CHANNEL, {
      ytDlp: ytDlpResult,
      ffmpeg: ffmpegResult,
    })

    const issues: string[] = []
    if (ytDlpResult.status !== 'ok') {
      issues.push(
        `yt-dlp: ${ytDlpResult.status}${ytDlpResult.error ? ` — ${ytDlpResult.error.slice(0, 60)}` : ''}`,
      )
    }
    if (ffmpegResult.status !== 'ok') {
      issues.push(
        `ffmpeg: ${ffmpegResult.status}${ffmpegResult.error ? ` — ${ffmpegResult.error.slice(0, 60)}` : ''}`,
      )
    }

    if (issues.length > 0) {
      getLogger().warn(`Startup health check found issues: ${issues.join('; ')}`)
    } else {
      getLogger().info('Startup health check: both binaries OK')
    }
  } catch (e) {
    getLogger().error(`Startup health check failed: ${(e as Error).message}`)
  }
}
