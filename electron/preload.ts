// Preload — typed, narrow bridge between renderer and main.
// Every method returns Promise<T> resolved directly, OR rejects with
// a NodeError whose `.code` carries the structured AppError.code for
// callers that want to handle specific error types.
import { contextBridge, ipcRenderer } from 'electron'
import {
  IPC_CHANNELS,
  RENDERER_ALLOWED_CHANNELS,
  PROGRESS_CHANNEL_PREFIX,
  LOG_CHANNEL_PREFIX,
} from '../shared/ipc-channels'
import type { Envelope, AppError, ErrorCode } from '../shared/ipc-channels'

// ── Error type & envelope reject ──────────────────────────────────────

export class IpcError extends Error {
  readonly code: ErrorCode
  readonly details: unknown
  constructor(code: ErrorCode, message: string, details: unknown) {
    super(message)
    this.name = 'IpcError'
    this.code = code
    this.details = details
  }
}

function isEnvelope(value: unknown): value is Envelope<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ok' in value &&
    typeof (value as { ok: unknown }).ok === 'boolean'
  )
}

async function invokeEnvelope<T>(channel: string, payload?: unknown): Promise<T> {
  const response: unknown = await ipcRenderer.invoke(channel, payload)
  if (!isEnvelope(response)) {
    // Defensive: a handler returned a non-envelope (should never happen
    // after the refactor). Treat as an internal error.
    throw new IpcError('INTERNAL_ERROR', `Handler for ${channel} returned non-envelope`, response)
  }
  if (response.ok) return response.data as T
  const err = (response as { ok: false; error: AppError }).error
  throw new IpcError(err.code, err.message, err.details)
}

function subscribe(channel: string, callback: (...args: unknown[]) => void): () => void {
  const isAllowed =
    (RENDERER_ALLOWED_CHANNELS as readonly string[]).includes(channel) ||
    channel.startsWith(PROGRESS_CHANNEL_PREFIX) ||
    channel.startsWith(LOG_CHANNEL_PREFIX)

  if (!isAllowed) {
    throw new IpcError('INVALID_INPUT', `IPC channel not allowed: ${channel}`, { channel })
  }
  const handler = (_e: unknown, ...args: unknown[]): void => callback(...args)
  ipcRenderer.on(channel, handler)
  return () => {
    ipcRenderer.removeListener(channel, handler)
  }
}

// ── contextBridge export — narrow, fully typed surface ─────────────────

const api = {
  download: {
    add: (params: { url: string; priority?: number }): Promise<unknown> =>
      invokeEnvelope(IPC_CHANNELS.DOWNLOAD_ADD, params),
    addBatch: (params: { urls: string[]; priority?: number }): Promise<unknown[]> =>
      invokeEnvelope(IPC_CHANNELS.DOWNLOAD_ADD_BATCH, params),
    pause: (id: string): Promise<void> => invokeEnvelope<void>(IPC_CHANNELS.DOWNLOAD_PAUSE, { id }),
    resume: (id: string): Promise<void> =>
      invokeEnvelope<void>(IPC_CHANNELS.DOWNLOAD_RESUME, { id }),
    cancel: (id: string): Promise<void> =>
      invokeEnvelope<void>(IPC_CHANNELS.DOWNLOAD_CANCEL, { id }),
    remove: (id: string): Promise<void> =>
      invokeEnvelope<void>(IPC_CHANNELS.DOWNLOAD_REMOVE, { id }),
    retry: (id: string): Promise<void> => invokeEnvelope<void>(IPC_CHANNELS.DOWNLOAD_RETRY, { id }),
    clearCompleted: (): Promise<void> =>
      invokeEnvelope<void>(IPC_CHANNELS.DOWNLOAD_CLEAR_COMPLETED),
    reorder: (id: string, direction: 'up' | 'down'): Promise<void> =>
      invokeEnvelope<void>(IPC_CHANNELS.DOWNLOAD_REORDER, { id, direction }),
    reorderToPosition: (id: string, newIndex: number): Promise<void> =>
      invokeEnvelope<void>(IPC_CHANNELS.DOWNLOAD_REORDER_TO_POSITION, { id, newIndex }),
    setSpeedLimit: (id: string, limit: string | null): Promise<void> =>
      invokeEnvelope<void>(IPC_CHANNELS.DOWNLOAD_SET_SPEED_LIMIT, { id, limit }),
    getExtraFlags: (id: string): Promise<unknown> =>
      invokeEnvelope(IPC_CHANNELS.DOWNLOAD_GET_EXTRA_FLAGS, { id }),
    updateExtraFlags: (id: string, flags: Record<string, unknown>): Promise<void> =>
      invokeEnvelope<void>(IPC_CHANNELS.DOWNLOAD_UPDATE_EXTRA_FLAGS, { id, flags }),
    getAll: (): Promise<unknown[]> => invokeEnvelope(IPC_CHANNELS.DOWNLOAD_GET_ALL),
    get: (id: string): Promise<unknown> => invokeEnvelope(IPC_CHANNELS.DOWNLOAD_GET, { id }),
    getQueueStats: (): Promise<unknown> => invokeEnvelope(IPC_CHANNELS.DOWNLOAD_GET_QUEUE_STATS),
    estimateBatchSize: (urls: string[]): Promise<unknown> =>
      invokeEnvelope(IPC_CHANNELS.DOWNLOAD_ESTIMATE_BATCH_SIZE, urls),
    fetchMetadata: (url: string): Promise<unknown> =>
      invokeEnvelope(IPC_CHANNELS.DOWNLOAD_FETCH_METADATA, url),
    fetchPlaylist: (url: string): Promise<unknown> =>
      invokeEnvelope(IPC_CHANNELS.DOWNLOAD_FETCH_PLAYLIST, url),
  },
  history: {
    getAll: (): Promise<unknown[]> => invokeEnvelope(IPC_CHANNELS.HISTORY_GET_ALL),
  },
  settings: {
    get: (): Promise<unknown> => invokeEnvelope(IPC_CHANNELS.SETTINGS_GET),
    update: (settings: Record<string, unknown>): Promise<void> =>
      invokeEnvelope<void>(IPC_CHANNELS.SETTINGS_UPDATE, settings),
    reset: (): Promise<void> => invokeEnvelope<void>(IPC_CHANNELS.SETTINGS_RESET),
    export: (): Promise<unknown> => invokeEnvelope(IPC_CHANNELS.SETTINGS_EXPORT),
    import: (settings: Record<string, unknown>): Promise<void> =>
      invokeEnvelope<void>(IPC_CHANNELS.SETTINGS_IMPORT, settings),
    getPresets: (): Promise<unknown[]> => invokeEnvelope(IPC_CHANNELS.SETTINGS_GET_PRESETS),
    savePresets: (presets: unknown[]): Promise<void> =>
      invokeEnvelope<void>(IPC_CHANNELS.SETTINGS_SAVE_PRESETS, presets),
  },
  system: {
    getYtDlpVersion: (): Promise<string> => invokeEnvelope(IPC_CHANNELS.SYSTEM_YTDLP_VERSION),
    getFfmpegVersion: (): Promise<string> => invokeEnvelope(IPC_CHANNELS.SYSTEM_FFMPEG_VERSION),
    checkBinaryHealth: (name: string): Promise<unknown> =>
      invokeEnvelope(IPC_CHANNELS.SYSTEM_CHECK_BINARY_HEALTH, name),
    openFolder: (path: string): Promise<void> =>
      invokeEnvelope<void>(IPC_CHANNELS.SYSTEM_OPEN_FOLDER, path),
    showInFolder: (path: string): Promise<void> =>
      invokeEnvelope<void>(IPC_CHANNELS.SYSTEM_SHOW_IN_FOLDER, path),
    getSystemInfo: (): Promise<Record<string, string>> =>
      invokeEnvelope(IPC_CHANNELS.SYSTEM_GET_INFO),
    getDiskSpace: (path: string): Promise<{ free: number; total: number }> =>
      invokeEnvelope(IPC_CHANNELS.SYSTEM_GET_DISK_SPACE, path),
    getPlatform: (): Promise<NodeJS.Platform> => invokeEnvelope(IPC_CHANNELS.SYSTEM_GET_PLATFORM),
    getForgedlBasePath: (): Promise<string> =>
      invokeEnvelope(IPC_CHANNELS.SYSTEM_GET_FORGEDL_BASE_PATH),
    checkYtDlpUpdate: (): Promise<{
      current: string
      latest: string
      updated: boolean
      newVersion: string
    }> => invokeEnvelope(IPC_CHANNELS.SYSTEM_CHECK_YTDLP_UPDATE),
    rebuildYtDlp: (): Promise<unknown> => invokeEnvelope(IPC_CHANNELS.SYSTEM_REBUILD_YTDLP),
    rebuildFfmpeg: (): Promise<unknown> => invokeEnvelope(IPC_CHANNELS.SYSTEM_REBUILD_FFMPEG),
    runPost: (): Promise<unknown> => invokeEnvelope(IPC_CHANNELS.SYSTEM_RUN_POST),
  },
  dialog: {
    openDirectory: (): Promise<string | null> => invokeEnvelope(IPC_CHANNELS.DIALOG_OPEN_DIRECTORY),
  },
  on: subscribe,
  IpcError,
}

contextBridge.exposeInMainWorld('api', api)
