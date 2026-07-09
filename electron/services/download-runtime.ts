// DownloadRuntime — owns the yt-dlp child_process lifecycle.
// Knows nothing about the database, the queue, or events. Pure
// subprocess + output parsing. Callers persist progress via callbacks.
import { spawn, type ChildProcess } from 'node:child_process'
import type {
  DownloadItem,
  DownloadProgress,
  VideoMetadata,
  PlaylistResult,
  PlaylistItem,
  PlaylistMetadata,
  ErrorRegistry,
  ExtraFlags,
} from '../../shared/types'
import { resolveYtDlpPath } from './runtime-info'
import { getLogger } from '../logging/logger'
import { buildCommand } from './yt-dlp-builder'

export interface DownloadCallbacks {
  onProgress: (p: DownloadProgress) => void
  onComplete: () => void
  onError: (error: string) => void
  onOutputLine?: (line: string) => void
}

const progressRegex =
  /\[download\]\s+(\d+(?:\.\d+)?)%\s+of\s+~?([\d.]+\w+)\s+at\s+([\d.]+\w+\/s)\s+ETA\s+([\d:]+)/
const progressFallbackRegex = /\[download\]\s+(\d+(?:\.\d+)?)%/

interface ParsedProgress {
  progress: number
  speed?: string
  eta?: string
  fileSize?: string
}

function parseProgressLine(line: string): ParsedProgress | null {
  const m = line.match(progressRegex)
  if (m) {
    return {
      progress: parseFloat(m[1]),
      fileSize: m[2],
      speed: m[3],
      eta: m[4],
    }
  }
  const fb = line.match(progressFallbackRegex)
  if (fb) {
    return { progress: parseFloat(fb[1]) }
  }
  return null
}

// ── Playlist NDJSON normalization ────────────────────────────────────
// Pure function: takes raw NDJSON lines + stderr, returns PlaylistResult.
// Extracted so it can be tested without mocking child_process.

export function normalizePlaylistNdjson(
  lines: string[],
  playlistUrl: string,
  stderr: string,
): PlaylistResult {
  const items: PlaylistItem[] = []
  const errors: ErrorRegistry = {}
  let metadata: PlaylistMetadata = { title: '' }

  for (const line of lines) {
    try {
      const entry = JSON.parse(line) as Record<string, unknown>

      // Playlist metadata entries have _type === 'playlist'
      if (entry._type === 'playlist') {
        metadata = {
          title: String(entry.title ?? ''),
          channel: typeof entry.channel === 'string' ? entry.channel : undefined,
          totalExpected: Array.isArray(entry.entries) ? entry.entries.length : undefined,
        }
        continue
      }

      // Individual video entries
      if (entry.id) {
        items.push({
          id: String(entry.id),
          url:
            typeof entry.webpage_url === 'string'
              ? entry.webpage_url
              : typeof entry.url === 'string'
                ? entry.url
                : `${playlistUrl}&v=${entry.id}`,
          title: String(entry.title ?? ''),
          duration: typeof entry.duration === 'number' ? entry.duration : undefined,
          thumbnail: typeof entry.thumbnail === 'string' ? entry.thumbnail : undefined,
          uploader: typeof entry.uploader === 'string' ? entry.uploader : undefined,
          index: typeof entry.playlist_index === 'number' ? entry.playlist_index : undefined,
        })
      }
    } catch {
      // Skip unparseable lines (non-JSON stderr interleaving)
    }
  }

  // Capture partial failures from stderr
  if (stderr.trim()) {
    const errLines = stderr.trim().split('\n')
    for (let i = 0; i < errLines.length; i++) {
      const el = errLines[i]
      if (el.includes('ERROR:') || el.includes('WARNING:')) {
        errors[`stderr:${i}`] = el.trim()
      }
    }
  }

  return { metadata, items, errors }
}

export class DownloadRuntime {
  private readonly active = new Map<string, ChildProcess>()
  private readonly aborted = new Set<string>()

  /** Number of downloads currently being processed by yt-dlp children. */
  get activeCount(): number {
    return this.active.size
  }

  isActive(id: string): boolean {
    return this.active.has(id)
  }

  activeIds(): string[] {
    return [...this.active.keys()]
  }

  start(
    item: DownloadItem,
    extraFlags: ExtraFlags | undefined,
    callbacks: DownloadCallbacks,
  ): void {
    if (this.active.has(item.id)) {
      getLogger().warn(`Download ${item.id} is already running`)
      return
    }

    const ytdlp = resolveYtDlpPath()
    const built = buildCommand({ url: item.url, extraFlags })
    const args = built.args

    getLogger().info(`Spawning yt-dlp for ${item.id}`)
    const child = spawn(ytdlp, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    this.active.set(item.id, child)
    this.aborted.delete(item.id)

    let stderr = ''

    const handleChunk = (chunk: Buffer | string): void => {
      const text = chunk.toString()
      for (const line of text.split(/\r?\n/)) {
        if (!line) continue
        callbacks.onOutputLine?.(line)
        const parsed = parseProgressLine(line)
        if (parsed) {
          callbacks.onProgress({
            id: item.id,
            progress: parsed.progress,
            speed: parsed.speed,
            eta: parsed.eta,
            fileSize: parsed.fileSize,
          })
        }
      }
    }

    child.stdout?.on('data', handleChunk)
    child.stderr?.on('data', (d: Buffer) => {
      stderr += d.toString()
      handleChunk(d)
    })

    child.on('error', (err) => {
      this.active.delete(item.id)
      if (this.aborted.has(item.id)) {
        this.aborted.delete(item.id)
        return
      }
      getLogger().error(`Download ${item.id} process error: ${err.message}`)
      callbacks.onError(err.message)
    })

    child.on('close', (code) => {
      this.active.delete(item.id)

      if (this.aborted.has(item.id)) {
        this.aborted.delete(item.id)
        return
      }

      if (code === 0) {
        callbacks.onComplete()
      } else {
        getLogger().error(`Download ${item.id} failed with code ${code}: ${stderr.slice(0, 500)}`)
        callbacks.onError(stderr.trim() || `Process exited with code ${code}`)
      }
    })
  }

  // Note: execVersionSync intentionally not exposed here — version queries
  // live in services/runtime-info.ts and use execFileSync directly so they
  // don't entangle with the download lifecycle state.

  cancel(id: string): boolean {
    const child = this.active.get(id)
    if (!child) return false
    this.aborted.add(id)
    getLogger().info(`Sending SIGINT to ${id}`)
    try {
      child.kill('SIGINT')
    } catch (e) {
      getLogger().warn(`kill SIGINT for ${id} failed: ${(e as Error).message}`)
    }
    return true
  }

  cancelAll(): number {
    let n = 0
    for (const id of [...this.active.keys()]) {
      if (this.cancel(id)) n++
    }
    return n
  }

  /**
   * Polls until all active processes have exited, then resolves.
   * Used during app shutdown. Forces SIGKILL after timeout.
   */
  async waitForAllExit(maxWaitMs: number): Promise<void> {
    if (this.active.size === 0) return
    const deadline = Date.now() + maxWaitMs
    while (this.active.size > 0) {
      if (Date.now() >= deadline) {
        getLogger().warn(
          `Shutdown timeout after ${maxWaitMs}ms; force-killing ${this.active.size} children`,
        )
        for (const [, child] of this.active) {
          try {
            child.kill('SIGKILL')
          } catch {
            // best effort
          }
        }
        this.active.clear()
        return
      }
      await new Promise((r) => setTimeout(r, 100))
    }
  }

  /**
   * Two-pass playlist aggregation.
   * Pass 1: Buffer raw NDJSON events from yt-dlp --dump-json.
   * Pass 2: Normalize into PlaylistResult (metadata, items, errors).
   */
  fetchPlaylist(url: string): Promise<PlaylistResult> {
    return new Promise((resolve, reject) => {
      let exe: string
      try {
        exe = resolveYtDlpPath()
      } catch (e) {
        reject(e)
        return
      }

      const child = spawn(exe, ['--dump-json', '--ignore-errors', '--no-warnings', url], {
        stdio: ['ignore', 'pipe', 'pipe'],
      })

      const lines: string[] = []
      let stderr = ''
      let partial = ''

      child.stdout?.on('data', (d: Buffer) => {
        const text = partial + d.toString()
        const parts = text.split('\n')
        partial = parts.pop() ?? ''
        for (const line of parts) {
          if (line) lines.push(line)
        }
      })
      child.stderr?.on('data', (d: Buffer) => {
        stderr += d.toString()
      })

      child.on('error', reject)
      child.on('close', (code) => {
        if (code !== 0 && lines.length === 0) {
          reject(new Error(`yt-dlp playlist fetch exited ${code}: ${stderr.slice(0, 500)}`))
          return
        }

        // Flush any remaining partial line before normalizing
        if (partial) lines.push(partial)

        resolve(normalizePlaylistNdjson(lines, url, stderr))
      })
    })
  }

  /** Synchronous version for tests. */
  fetchMetadata(url: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const exe = ((): string => {
        try {
          return resolveYtDlpPath()
        } catch (e) {
          reject(e)
          throw e
        }
      })()

      const child = spawn(exe, ['--dump-json', '--no-warnings', url], {
        stdio: ['ignore', 'pipe', 'pipe'],
      })
      let stdout = ''
      let stderr = ''
      child.stdout?.on('data', (d) => {
        stdout += d.toString()
      })
      child.stderr?.on('data', (d) => {
        stderr += d.toString()
      })
      child.on('error', reject)
      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`yt-dlp --dump-json exited ${code}: ${stderr.slice(0, 500)}`))
          return
        }
        try {
          const parsed = JSON.parse(stdout) as VideoMetadata
          // Coerce to partial VideoMetadata. Only the fields we care about
          // are guaranteed. Cast through unknown to keep types honest.
          resolve({
            id: String(parsed.id ?? ''),
            title: String(parsed.title ?? ''),
            duration: typeof parsed.duration === 'number' ? parsed.duration : undefined,
            thumbnail: typeof parsed.thumbnail === 'string' ? parsed.thumbnail : undefined,
            uploader: typeof parsed.uploader === 'string' ? parsed.uploader : undefined,
            description: typeof parsed.description === 'string' ? parsed.description : undefined,
            view_count:
              typeof (parsed as any).view_count === 'number'
                ? (parsed as any).view_count
                : undefined,
            like_count:
              typeof (parsed as any).like_count === 'number'
                ? (parsed as any).like_count
                : undefined,
            upload_date:
              typeof (parsed as any).upload_date === 'string'
                ? (parsed as any).upload_date
                : undefined,
            formats: Array.isArray((parsed as any).formats)
              ? (parsed as any).formats.map((f: any) => ({
                  format_id: String(f.format_id ?? ''),
                  ext: String(f.ext ?? ''),
                  resolution: typeof f.resolution === 'string' ? f.resolution : undefined,
                  filesize: typeof f.filesize === 'number' ? f.filesize : undefined,
                  filesizeApprox:
                    typeof f.filesize_approx === 'number' ? f.filesize_approx : undefined,
                  vcodec: typeof f.vcodec === 'string' ? f.vcodec : undefined,
                  acodec: typeof f.acodec === 'string' ? f.acodec : undefined,
                  format_note: typeof f.format_note === 'string' ? f.format_note : undefined,
                  tbr: typeof f.tbr === 'number' ? f.tbr : undefined,
                  vbr: typeof f.vbr === 'number' ? f.vbr : undefined,
                  abr: typeof f.abr === 'number' ? f.abr : undefined,
                  fps: typeof f.fps === 'number' ? f.fps : undefined,
                  width: typeof f.width === 'number' ? f.width : undefined,
                  height: typeof f.height === 'number' ? f.height : undefined,
                  dynamic_range: typeof f.dynamic_range === 'string' ? f.dynamic_range : undefined,
                  audio_channels:
                    typeof f.audio_channels === 'number' ? f.audio_channels : undefined,
                }))
              : undefined,
            subtitles: (parsed as any).subtitles ?? undefined,
            automatic_captions: (parsed as any).automatic_captions ?? undefined,
            chapters: Array.isArray((parsed as any).chapters)
              ? (parsed as any).chapters.map((c: any) => ({
                  title: String(c.title ?? ''),
                  start_time: typeof c.start_time === 'number' ? c.start_time : 0,
                  end_time: typeof c.end_time === 'number' ? c.end_time : 0,
                }))
              : undefined,
          })
        } catch (e) {
          reject(e)
        }
      })
    })
  }
}
