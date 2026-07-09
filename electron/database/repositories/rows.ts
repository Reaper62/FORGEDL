// Internal row types — the bridge between SQL tables and domain types.
// Repositories convert between Row and DownloadItem/QueueStats using
// toItem/toRow helpers.
import type { DownloadItem, DownloadStatus, QueueStats } from '../../../shared/types'

export interface DownloadRow {
  id: string
  url: string
  title: string | null
  status: string
  progress: number
  speed: string | null
  eta: string | null
  fileSize: string | null
  outputPath: string | null
  error: string | null
  priority: number
  createdAt: string
  completedAt: string | null
}

export const isDownloadStatus = (s: string): s is DownloadStatus => {
  const known = [
    'waiting',
    'fetching_metadata',
    'preparing',
    'downloading',
    'merging',
    'embedding',
    'verifying',
    'completed',
    'error',
    'paused',
    'cancelled',
  ] as const
  return (known as readonly string[]).includes(s)
}

export const toItem = (row: DownloadRow): DownloadItem => ({
  id: row.id,
  url: row.url,
  title: row.title ?? undefined,
  status: isDownloadStatus(row.status) ? row.status : 'waiting',
  progress: row.progress ?? 0,
  speed: row.speed ?? undefined,
  eta: row.eta ?? undefined,
  fileSize: row.fileSize ?? undefined,
  outputPath: row.outputPath ?? undefined,
  error: row.error ?? undefined,
  priority: row.priority ?? 5,
  createdAt: row.createdAt,
  completedAt: row.completedAt ?? undefined,
})

export interface QueueStatsRow {
  total: number | null
  downloading: number | null
  waiting: number | null
  completed: number | null
  failed: number | null
}

export const toQueueStats = (row: QueueStatsRow): QueueStats => ({
  total: row.total ?? 0,
  downloading: row.downloading ?? 0,
  waiting: row.waiting ?? 0,
  completed: row.completed ?? 0,
  failed: row.failed ?? 0,
})
