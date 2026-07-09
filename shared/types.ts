// ponytail: shared types between main and renderer — single source of truth
import { z } from 'zod'
import type { AppError } from './result'

// ── Result envelope at the IPC boundary ─────────────────────────────

export type Envelope<T> = { ok: true; data: T } | { ok: false; error: AppError }

export type NodeError = Error & { code?: string; details?: unknown }

// ── Download ────────────────────────────────────────────────────────

export const DownloadStatus = z.enum([
  'waiting',
  'fetching_metadata',
  'preparing',
  'downloading',
  'merging',
  'embedding',
  'verifying',
  'retrying',
  'completed',
  'error',
  'paused',
  'cancelled',
])
export type DownloadStatus = z.infer<typeof DownloadStatus>

export const DownloadItemSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  title: z.string().optional(),
  status: DownloadStatus,
  progress: z.number().min(0).max(100).default(0),
  speed: z.string().optional(),
  eta: z.string().optional(),
  fileSize: z.string().optional(),
  outputPath: z.string().optional(),
  error: z.string().optional(),
  priority: z.number().int().min(1).max(10).default(5),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
})
export type DownloadItem = z.infer<typeof DownloadItemSchema>

export const QueueStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  downloading: z.number().int().nonnegative(),
  waiting: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
})
export type QueueStats = z.infer<typeof QueueStatsSchema>

// ── Settings ────────────────────────────────────────────────────────

export const DownloadSettingsSchema = z.object({
  outputFormat: z.string().default('bestvideo+bestaudio/best'),
  downloadPath: z.string().default(''),
  extractAudio: z.boolean().default(false),
  audioFormat: z.string().default('mp3'),
  embedMetadata: z.boolean().default(true),
  maxConcurrent: z.number().int().min(1).max(20).default(3),
  speedLimit: z
    .string()
    .regex(/^(\d+(\.\d+)?[KMGkmg]?)?$/, 'Invalid speed limit format')
    .default(''),
  namingTemplate: z.string().default('%(title)s.%(ext)s'),
  basePresetId: z.string().default(''),
  smartQueueOrdering: z.boolean().default(true),
  ytdlpPath: z.string().default('yt-dlp'),
  ffmpegPath: z.string().default('ffmpeg'),
})
export type DownloadSettings = z.infer<typeof DownloadSettingsSchema>

// ── Video Metadata ──────────────────────────────────────────────────

export const FormatDetailSchema = z.object({
  format_id: z.string(),
  ext: z.string(),
  resolution: z.string().optional(),
  filesize: z.number().optional(),
  filesizeApprox: z.number().optional(),
  vcodec: z.string().optional(),
  acodec: z.string().optional(),
  format_note: z.string().optional(),
  tbr: z.number().optional(),
  vbr: z.number().optional(),
  abr: z.number().optional(),
  fps: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  dynamic_range: z.string().optional(),
  audio_channels: z.number().optional(),
})
export type FormatDetail = z.infer<typeof FormatDetailSchema>

export const SubtitleTrackSchema = z.object({
  lang: z.string().optional(),
  name: z.string().optional(),
  ext: z.string(),
})
export type SubtitleTrack = z.infer<typeof SubtitleTrackSchema>

export const ChapterSchema = z.object({
  title: z.string(),
  start_time: z.number(),
  end_time: z.number(),
})
export type Chapter = z.infer<typeof ChapterSchema>

export const VideoMetadataSchema = z.object({
  id: z.string(),
  title: z.string(),
  duration: z.number().optional(),
  thumbnail: z.string().optional(),
  uploader: z.string().optional(),
  description: z.string().optional(),
  view_count: z.number().optional(),
  like_count: z.number().optional(),
  upload_date: z.string().optional(),
  formats: z.array(FormatDetailSchema).optional(),
  subtitles: z.record(z.string(), z.array(SubtitleTrackSchema)).optional(),
  automatic_captions: z.record(z.string(), z.array(SubtitleTrackSchema)).optional(),
  chapters: z.array(ChapterSchema).optional(),
})
export type VideoMetadata = z.infer<typeof VideoMetadataSchema>

// ── Playlist ────────────────────────────────────────────────────────

export const PlaylistMetadataSchema = z.object({
  title: z.string(),
  channel: z.string().optional(),
  totalExpected: z.number().int().nonnegative().optional(),
})
export type PlaylistMetadata = z.infer<typeof PlaylistMetadataSchema>

export const PlaylistItemSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  duration: z.number().optional(),
  thumbnail: z.string().optional(),
  uploader: z.string().optional(),
  index: z.number().int().nonnegative().optional(),
})
export type PlaylistItem = z.infer<typeof PlaylistItemSchema>

export const ErrorRegistrySchema = z.record(z.string(), z.string())
export type ErrorRegistry = z.infer<typeof ErrorRegistrySchema>

export const PlaylistResultSchema = z.object({
  metadata: PlaylistMetadataSchema,
  items: z.array(PlaylistItemSchema),
  errors: ErrorRegistrySchema,
})
export type PlaylistResult = z.infer<typeof PlaylistResultSchema>

// ── Advanced Download Flags (shared with CommandBuilder) ────────────

export interface ExtraFlags {
  cookiesFile?: string
  browserCookies?: string
  subtitleLangs?: string[]
  embedSubs?: boolean
  username?: string
  password?: string
  netrc?: boolean
  proxy?: string
  userAgent?: string
  referer?: string
  playlistStart?: number
  playlistEnd?: number
  noPlaylist?: boolean
  /** Per-download speed limit override (e.g. "1M", "500K"). Takes precedence over global setting. */
  speedLimit?: string
  /** Per-download output format override. Used by auto-retry to progressively fall back to lower quality. */
  outputFormat?: string
  /** ID of the base preset this download was applied from (for layered config tracking). */
  basePresetId?: string
}

// ── Presets (named download configuration snapshots) ────────────────

export const PresetSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(60),
  outputFormat: z.string().optional(),
  extraFlags: z
    .object({
      cookiesFile: z.string().optional(),
      browserCookies: z.string().optional(),
      subtitleLangs: z.array(z.string()).optional(),
      embedSubs: z.boolean().optional(),
      username: z.string().optional(),
      password: z.string().optional(),
      netrc: z.boolean().optional(),
      proxy: z.string().optional(),
      userAgent: z.string().optional(),
      referer: z.string().optional(),
      playlistStart: z.number().int().positive().optional(),
      playlistEnd: z.number().int().positive().optional(),
      noPlaylist: z.boolean().optional(),
      speedLimit: z.string().optional(),
    })
    .optional(),
  createdAt: z.string().datetime(),
})
export type Preset = z.infer<typeof PresetSchema>

// ── POST (Power-On Self-Test) ───────────────────────────────────────

export const PostCheckStatus = z.enum(['pass', 'fail', 'warning', 'running'])
export type PostCheckStatus = z.infer<typeof PostCheckStatus>

// ── Binary health status (for Settings version display) ─────────

export const BinaryHealthStatus = z.enum(['ok', 'missing', 'corrupted', 'unknown'])
export type BinaryHealthStatus = z.infer<typeof BinaryHealthStatus>

export const BinaryHealthSchema = z.object({
  name: z.enum(['yt-dlp', 'ffmpeg']),
  status: BinaryHealthStatus,
  version: z.string(),
  path: z.string().optional(),
  error: z.string().optional(),
})
export type BinaryHealth = z.infer<typeof BinaryHealthSchema>

// ── POST check names ────────────────────────────────────────────

export const PostCheckName = z.enum([
  'yt-dlp',
  'ffmpeg',
  'internet',
  'disk-space',
  'write-permission',
  'database',
  'extractors',
  'download-test',
])
export type PostCheckName = z.infer<typeof PostCheckName>

export const PostCheckResultSchema = z.object({
  name: PostCheckName,
  label: z.string(),
  status: PostCheckStatus,
  message: z.string(),
  detail: z.string().optional(),
  durationMs: z.number().nonnegative(),
})
export type PostCheckResult = z.infer<typeof PostCheckResultSchema>

export const PostResultsSchema = z.object({
  checks: z.array(PostCheckResultSchema),
  allPassed: z.boolean(),
  totalDurationMs: z.number().nonnegative(),
})
export type PostResults = z.infer<typeof PostResultsSchema>

// ── Progress Event ──────────────────────────────────────────────────

export const DownloadProgressSchema = z.object({
  id: z.string().uuid(),
  progress: z.number().min(0).max(100),
  speed: z.string().optional(),
  eta: z.string().optional(),
  fileSize: z.string().optional(),
})
export type DownloadProgress = z.infer<typeof DownloadProgressSchema>

// ── Log Stream ───────────────────────────────────────────────────────

export const LogLineSchema = z.object({
  line: z.string(),
  timestamp: z.number(),
  level: z.enum(['error', 'warn', 'info']),
})
export type LogLine = z.infer<typeof LogLineSchema>

// ── IPC bindings ────────────────────────────────────────────────────
// The renderer-facing API. Every method returns `Promise<Envelope<T>>`
// at the preload boundary. The preload adapter unwraps envelopes into
// resolved Promise<T> or a NodeError (Error & { code, details }) so
// existing renderer code keeps working with minimal change.

export interface ElectronAPI {
  download: {
    add: (params: {
      url: string
      priority?: number
      extraFlags?: ExtraFlags
    }) => Promise<DownloadItem>
    addBatch: (params: {
      urls: string[]
      priority?: number
      extraFlags?: ExtraFlags
    }) => Promise<DownloadItem[]>
    pause: (id: string) => Promise<void>
    resume: (id: string) => Promise<void>
    cancel: (id: string) => Promise<void>
    remove: (id: string) => Promise<void>
    retry: (id: string) => Promise<void>
    clearCompleted: () => Promise<void>
    reorder: (id: string, direction: 'up' | 'down') => Promise<void>
    reorderToPosition: (id: string, newIndex: number) => Promise<void>
    setSpeedLimit: (id: string, speedLimit: string | null) => Promise<void>
    getExtraFlags: (id: string) => Promise<ExtraFlags | null>
    updateExtraFlags: (id: string, flags: ExtraFlags) => Promise<void>
    getAll: () => Promise<DownloadItem[]>
    get: (id: string) => Promise<DownloadItem | null>
    getQueueStats: () => Promise<QueueStats>
    estimateBatchSize: (
      urls: string[],
    ) => Promise<{ estimatedBytes: number; resolvable: number; total: number }>
    fetchMetadata: (url: string) => Promise<VideoMetadata>
    fetchPlaylist: (url: string) => Promise<PlaylistResult>
  }
  history: {
    getAll: () => Promise<DownloadItem[]>
  }
  settings: {
    get: () => Promise<DownloadSettings>
    update: (settings: Partial<DownloadSettings>) => Promise<void>
    reset: () => Promise<void>
    export: () => Promise<DownloadSettings>
    import: (settings: Partial<DownloadSettings>) => Promise<void>
    getPresets: () => Promise<Preset[]>
    savePresets: (presets: Preset[]) => Promise<void>
  }
  system: {
    getYtDlpVersion: () => Promise<string>
    getFfmpegVersion: () => Promise<string>
    checkBinaryHealth: (name: 'yt-dlp' | 'ffmpeg') => Promise<BinaryHealth>
    openFolder: (path: string) => Promise<void>
    showInFolder: (path: string) => Promise<void>
    getSystemInfo: () => Promise<Record<string, string>>
    getDiskSpace: (path: string) => Promise<{ free: number; total: number }>
    getPlatform: () => Promise<NodeJS.Platform>
    getForgedlBasePath: () => Promise<string>
    checkYtDlpUpdate: () => Promise<{
      current: string
      latest: string
      updated: boolean
      newVersion: string
    }>
    rebuildYtDlp: () => Promise<{ rebuilt: boolean; version: string; message: string }>
    rebuildFfmpeg: () => Promise<{ rebuilt: boolean; version: string; message: string }>
    runPost: () => Promise<PostResults>
  }
  dialog: {
    openDirectory: () => Promise<string | null>
  }
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
