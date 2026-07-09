// Central IPC channel definitions — single source of truth for main, preload,
// and renderer. NEVER hardcode a channel string elsewhere.
// Re-export envelope types so preload and main can import everything
// from one place.
export type { AppError, ErrorCode } from './result'
export type { Envelope } from './types'

export const IPC_CHANNELS = {
  // Download operations
  DOWNLOAD_ADD: 'download:add',
  DOWNLOAD_ADD_BATCH: 'download:addBatch',
  DOWNLOAD_PAUSE: 'download:pause',
  DOWNLOAD_RESUME: 'download:resume',
  DOWNLOAD_CANCEL: 'download:cancel',
  DOWNLOAD_REMOVE: 'download:remove',
  DOWNLOAD_RETRY: 'download:retry',
  DOWNLOAD_CLEAR_COMPLETED: 'download:clearCompleted',
  DOWNLOAD_REORDER: 'download:reorder',
  DOWNLOAD_REORDER_TO_POSITION: 'download:reorderToPosition',
  DOWNLOAD_SET_SPEED_LIMIT: 'download:setSpeedLimit',
  DOWNLOAD_GET_EXTRA_FLAGS: 'download:getExtraFlags',
  DOWNLOAD_UPDATE_EXTRA_FLAGS: 'download:updateExtraFlags',
  DOWNLOAD_GET_ALL: 'download:getAll',
  DOWNLOAD_GET: 'download:get',
  DOWNLOAD_GET_QUEUE_STATS: 'download:getQueueStats',
  DOWNLOAD_ESTIMATE_BATCH_SIZE: 'download:estimateBatchSize',
  DOWNLOAD_FETCH_METADATA: 'download:fetchMetadata',
  DOWNLOAD_FETCH_PLAYLIST: 'download:fetchPlaylist',

  // History
  HISTORY_GET_ALL: 'history:getAll',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',
  SETTINGS_RESET: 'settings:reset',
  SETTINGS_EXPORT: 'settings:export',
  SETTINGS_IMPORT: 'settings:import',
  SETTINGS_GET_PRESETS: 'settings:getPresets',
  SETTINGS_SAVE_PRESETS: 'settings:savePresets',

  // System
  SYSTEM_YTDLP_VERSION: 'system:ytdlpVersion',
  SYSTEM_FFMPEG_VERSION: 'system:ffmpegVersion',
  SYSTEM_CHECK_BINARY_HEALTH: 'system:checkBinaryHealth',
  SYSTEM_OPEN_FOLDER: 'system:openFolder',
  SYSTEM_SHOW_IN_FOLDER: 'system:showInFolder',
  SYSTEM_GET_INFO: 'system:getSystemInfo',
  SYSTEM_GET_DISK_SPACE: 'system:getDiskSpace',
  SYSTEM_GET_PLATFORM: 'system:getPlatform',
  SYSTEM_GET_FORGEDL_BASE_PATH: 'system:getForgedlBasePath',
  SYSTEM_CHECK_YTDLP_UPDATE: 'system:checkYtDlpUpdate',
  SYSTEM_REBUILD_YTDLP: 'system:rebuildYtDlp',
  SYSTEM_REBUILD_FFMPEG: 'system:rebuildFfmpeg',
  SYSTEM_RUN_POST: 'system:runPost',

  // Dialog
  DIALOG_OPEN_DIRECTORY: 'dialog:openDirectory',
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]

// Strongly-typed channel groups
export const DOWNLOAD_CHANNELS = [
  IPC_CHANNELS.DOWNLOAD_ADD,
  IPC_CHANNELS.DOWNLOAD_ADD_BATCH,
  IPC_CHANNELS.DOWNLOAD_PAUSE,
  IPC_CHANNELS.DOWNLOAD_RESUME,
  IPC_CHANNELS.DOWNLOAD_CANCEL,
  IPC_CHANNELS.DOWNLOAD_REMOVE,
  IPC_CHANNELS.DOWNLOAD_RETRY,
  IPC_CHANNELS.DOWNLOAD_CLEAR_COMPLETED,
  IPC_CHANNELS.DOWNLOAD_REORDER,
  IPC_CHANNELS.DOWNLOAD_REORDER_TO_POSITION,
  IPC_CHANNELS.DOWNLOAD_SET_SPEED_LIMIT,
  IPC_CHANNELS.DOWNLOAD_GET_ALL,
  IPC_CHANNELS.DOWNLOAD_GET,
  IPC_CHANNELS.DOWNLOAD_GET_QUEUE_STATS,
  IPC_CHANNELS.DOWNLOAD_ESTIMATE_BATCH_SIZE,
  IPC_CHANNELS.DOWNLOAD_FETCH_METADATA,
  IPC_CHANNELS.DOWNLOAD_FETCH_PLAYLIST,
] as const

export const HISTORY_CHANNELS = [IPC_CHANNELS.HISTORY_GET_ALL] as const
export const SETTINGS_CHANNELS = [
  IPC_CHANNELS.SETTINGS_GET,
  IPC_CHANNELS.SETTINGS_UPDATE,
  IPC_CHANNELS.SETTINGS_RESET,
  IPC_CHANNELS.SETTINGS_EXPORT,
  IPC_CHANNELS.SETTINGS_IMPORT,
  IPC_CHANNELS.SETTINGS_GET_PRESETS,
  IPC_CHANNELS.SETTINGS_SAVE_PRESETS,
] as const
export const SYSTEM_CHANNELS = [
  IPC_CHANNELS.SYSTEM_YTDLP_VERSION,
  IPC_CHANNELS.SYSTEM_FFMPEG_VERSION,
  IPC_CHANNELS.SYSTEM_CHECK_BINARY_HEALTH,
  IPC_CHANNELS.SYSTEM_OPEN_FOLDER,
  IPC_CHANNELS.SYSTEM_SHOW_IN_FOLDER,
  IPC_CHANNELS.SYSTEM_GET_INFO,
  IPC_CHANNELS.SYSTEM_GET_DISK_SPACE,
  IPC_CHANNELS.SYSTEM_GET_PLATFORM,
  IPC_CHANNELS.SYSTEM_GET_FORGEDL_BASE_PATH,
  IPC_CHANNELS.SYSTEM_CHECK_YTDLP_UPDATE,
  IPC_CHANNELS.SYSTEM_REBUILD_YTDLP,
  IPC_CHANNELS.SYSTEM_REBUILD_FFMPEG,
  IPC_CHANNELS.SYSTEM_RUN_POST,
] as const
export const DIALOG_CHANNELS = [IPC_CHANNELS.DIALOG_OPEN_DIRECTORY] as const

// Channels the renderer may subscribe to (events pushed main → renderer)
export const QUEUE_EVENT_CHANNELS = ['queue:changed'] as const

// Startup health check event — emitted once after window creation
// with BinaryHealth results for yt-dlp and ffmpeg.
export const STARTUP_HEALTH_CHANNEL = 'startup:health'

// Dynamic progress channels — keyed per download id.
export const PROGRESS_CHANNEL_PREFIX = 'download:progress:'

export const buildProgressChannel = (id: string): string => `${PROGRESS_CHANNEL_PREFIX}${id}`

export const isProgressChannel = (channel: string): boolean =>
  channel.startsWith(PROGRESS_CHANNEL_PREFIX)

// Dynamic log channels — keyed per download id.
export const LOG_CHANNEL_PREFIX = 'download:log:'

export const buildLogChannel = (id: string): string => `${LOG_CHANNEL_PREFIX}${id}`

export const isLogChannel = (channel: string): boolean => channel.startsWith(LOG_CHANNEL_PREFIX)

// Renderer-allowed subscription channels (preload enforcement)
export const RENDERER_ALLOWED_CHANNELS: readonly string[] = [
  ...QUEUE_EVENT_CHANNELS,
  STARTUP_HEALTH_CHANNEL,
  // Progress and log channels are dynamic — checked separately by prefix.
]
