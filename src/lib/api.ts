// Typed access to Electron APIs exposed via preload contextBridge.
// Fallback object is used when running outside Electron (e.g. Vite dev server
// before Electron attaches); it mirrors the current ElectronAPI contract.
import type { ElectronAPI, BinaryHealth } from '../../shared/types'

function isElectron(): boolean {
  try {
    return !!(window as unknown as { api?: unknown }).api
  } catch {
    return false
  }
}

function notInElectronError(method: string): Error {
  const msg =
    'This operation requires Electron. ' +
    'The preload bridge is not available — are you running in a browser instead of the Electron app?'
  const err = new Error(msg)
  err.name = 'ElectronContextError'
  // Preserve the original method name for logging
  ;(err as Error & { method?: string }).method = method
  return err
}

const noBinaryHealth = (name: 'yt-dlp' | 'ffmpeg'): BinaryHealth => ({
  name,
  status: 'unknown',
  version: 'unknown',
})

const noRebuildResult = (name: string) => ({
  rebuilt: false,
  version: 'unknown',
  message: `Cannot repair ${name} — not running in Electron`,
})

const fallbackApi: ElectronAPI = {
  download: {
    add: async (_params) => {
      if (isElectron()) throw notInElectronError('download.add')
      throw new Error('Download unavailable — please launch the Electron application')
    },
    addBatch: async (_params) => {
      if (isElectron()) throw notInElectronError('download.addBatch')
      throw new Error('Batch download unavailable — please launch the Electron application')
    },
    pause: async () => {},
    resume: async () => {},
    cancel: async () => {},
    remove: async () => {},
    retry: async () => {},
    clearCompleted: async () => {},
    reorder: async () => {},
    reorderToPosition: async () => {},
    setSpeedLimit: async () => {},
    getExtraFlags: async () => null,
    updateExtraFlags: async () => {},
    getAll: async () => [],
    get: async () => null,
    getQueueStats: async () => ({
      total: 0,
      downloading: 0,
      waiting: 0,
      completed: 0,
      failed: 0,
    }),
    estimateBatchSize: async (_urls: string[]) => ({
      estimatedBytes: 0,
      resolvable: 0,
      total: 0,
    }),
    fetchMetadata: async () => {
      if (isElectron()) throw notInElectronError('download.fetchMetadata')
      throw new Error('Metadata fetch unavailable — please launch the Electron application')
    },
    fetchPlaylist: async () => {
      if (isElectron()) throw notInElectronError('download.fetchPlaylist')
      throw new Error('Playlist fetch unavailable — please launch the Electron application')
    },
  },
  history: {
    getAll: async () => [],
  },
  settings: {
    get: async () => ({
      outputFormat: 'bestvideo+bestaudio/best',
      downloadPath: '',
      extractAudio: false,
      audioFormat: 'mp3',
      embedMetadata: true,
      maxConcurrent: 3,
      speedLimit: '',
      namingTemplate: '%(title)s.%(ext)s',
      basePresetId: '',
      smartQueueOrdering: true,
      ytdlpPath: 'yt-dlp',
      ffmpegPath: 'ffmpeg',
    }),
    update: async () => {},
    reset: async () => {},
    export: async () => ({
      outputFormat: 'bestvideo+bestaudio/best',
      downloadPath: '',
      extractAudio: false,
      audioFormat: 'mp3',
      embedMetadata: true,
      maxConcurrent: 3,
      speedLimit: '',
      namingTemplate: '%(title)s.%(ext)s',
      basePresetId: '',
      smartQueueOrdering: true,
      ytdlpPath: 'yt-dlp',
      ffmpegPath: 'ffmpeg',
    }),
    import: async () => {},
    getPresets: async () => [],
    savePresets: async () => {},
  },
  system: {
    getYtDlpVersion: async () => 'unknown',
    getFfmpegVersion: async () => 'unknown',
    checkBinaryHealth: async (name) => noBinaryHealth(name),
    openFolder: async () => {},
    showInFolder: async () => {},
    getSystemInfo: async () => ({}),
    getDiskSpace: async () => ({ free: 0, total: 0 }),
    getPlatform: async () => 'browser' as NodeJS.Platform,
    getForgedlBasePath: async () => 'C:\\Users\\...\\Downloads\\FORGEDL',
    checkYtDlpUpdate: async () => ({
      current: 'unknown',
      latest: 'unknown',
      updated: false,
      newVersion: 'unknown',
    }),
    rebuildYtDlp: async () => noRebuildResult('yt-dlp'),
    rebuildFfmpeg: async () => noRebuildResult('ffmpeg'),
    runPost: async () => ({ checks: [], allPassed: true, totalDurationMs: 0 }),
  },
  dialog: {
    openDirectory: async () => null,
  },
  on: () => () => {},
}

export const api: ElectronAPI = (window.api || fallbackApi) as ElectronAPI
