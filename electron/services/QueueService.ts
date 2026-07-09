// QueueService — business logic for the download queue.
//
// Responsibilities:
//   - Persist downloads (delegated to QueueRepository)
//   - Decide what runs next (concurrency vs settings.maxConcurrent)
//   - Manage lifecycle transitions (waiting → downloading → completed/error/...)
//   - Emit renderer-visible events through EventSink
//
// Non-responsibilities:
//   - SQL (repos only)
//   - Electron imports
//   - Subprocesses (DownloadRuntime only)
import type {
  DownloadItem,
  QueueStats,
  VideoMetadata,
  PlaylistResult,
  ExtraFlags,
} from '../../shared/types'
import type { QueueRepository } from '../database/repositories/QueueRepository'
import type { HistoryRepository } from '../database/repositories/HistoryRepository'
import type { DownloadRuntime } from './download-runtime'
import type { EventSink } from './event-bus'
import { err, ok, type Result } from '../../shared/result'
import { buildProgressChannel, buildLogChannel } from '../../shared/ipc-channels'
import { getLogger } from '../logging/logger'
import { getSettings } from './settings-snapshot'
import { randomUUID } from 'node:crypto'

// ── Auto-Retry Types ────────────────────────────────────────────────

/** Per-download retry state tracked in memory (not persisted). */
interface RetryState {
  retryCount: number
  maxRetries: number
  nextRetryAt: number
  originalFormat: string
  lastError: string
  timer?: ReturnType<typeof setTimeout>
}

/** Error categories that warrant automatic retry. */
type RetryableCategory = 'network' | 'rate_limit' | 'extractor'

const RETRY_BASE_DELAY_MS = 5_000
const RETRY_MAX_DELAY_MS = 300_000
const RETRY_DEFAULT_MAX = 3

// ── Smart Ordering Utilities (exported for testing) ───────────────────

/**
 * Parse a fileSize string like "512.3 MiB" into bytes for comparison.
 * Returns -1 for unknown/unparseable sizes so they sort after known ones.
 */
export function parseFileSizeToBytes(fileSize?: string): number {
  if (!fileSize) return -1
  const match = fileSize.match(/^([\d.]+)\s*(B|KB|KiB|MB|MiB|GB|GiB|TB|TiB)?$/i)
  if (!match) return -1
  const value = parseFloat(match[1])
  const unit = (match[2] || 'B').toUpperCase()
  const multipliers: Record<string, number> = {
    B: 1,
    KB: 1000,
    KIB: 1024,
    MB: 1000 * 1000,
    MIB: 1024 * 1024,
    GB: 1000 * 1000 * 1000,
    GIB: 1024 * 1024 * 1024,
    TB: 1000 * 1000 * 1000 * 1000,
    TIB: 1024 * 1024 * 1024 * 1024,
  }
  return Math.round(value * (multipliers[unit] ?? 1))
}

/**
 * Sort waiting items by estimated file size (Shortest Job First) while
 * preserving priority as a secondary sort key. Items with unknown size
 * sort after all known-size items to avoid blocking small downloads.
 */
export function applySmartOrdering(items: DownloadItem[]): DownloadItem[] {
  return [...items].sort((a, b) => {
    const aSize = parseFileSizeToBytes(a.fileSize)
    const bSize = parseFileSizeToBytes(b.fileSize)

    // Known sizes always come before unknown sizes
    const aKnown = aSize >= 0
    const bKnown = bSize >= 0
    if (aKnown !== bKnown) return aKnown ? -1 : 1

    // Both known: smallest first
    if (aKnown && bKnown) {
      if (aSize !== bSize) return aSize - bSize
    }

    // Same size or both unknown: respect priority (higher first)
    return b.priority - a.priority
  })
}

/** Classify a raw yt-dlp output line into a log level for the stream viewer. */
export function classifyLogLevel(line: string): 'error' | 'warn' | 'info' {
  if (/\[error\]|ERROR:|FATAL|Traceback/i.test(line)) return 'error'
  if (/\[warn\]|WARNING:|\[warning\]/i.test(line)) return 'warn'
  return 'info'
}

export interface AddInput {
  url: string
  priority?: number
  extraFlags?: ExtraFlags
}

export interface QueueServiceDeps {
  queueRepo: QueueRepository
  historyRepo: HistoryRepository
  runtime: DownloadRuntime
  events: EventSink
}

export class QueueService {
  constructor(private readonly deps: QueueServiceDeps) {}

  private get repos() {
    return { queue: this.deps.queueRepo, history: this.deps.historyRepo }
  }

  private get runtime() {
    return this.deps.runtime
  }

  private get events() {
    return this.deps.events
  }

  // ── Lifecycle / Recovery ────────────────────────────────────────────

  /** Idempotent. Resets stale 'downloading' and 'retrying' rows to 'waiting' on startup. */
  runStartupRecovery(): void {
    const n = this.repos.queue.resetStaleDownloading()
    const m = this.repos.queue.resetStaleRetrying()
    if (n > 0 || m > 0) {
      getLogger().info(
        `Startup recovery: reset ${n} stale downloading + ${m} stale retrying to waiting`,
      )
    }
  }

  // ── Queue dispatch ──────────────────────────────────────────────────

  private isProcessing = false
  /** Per-download overrides stored in memory, keyed by download ID. */
  private readonly extraFlagsByDownload = new Map<string, ExtraFlags>()

  /** Auto-retry state for downloads that failed with a retryable error. */
  private readonly retryState = new Map<string, RetryState>()

  /** Picks up to N waiting downloads based on concurrency. Re-entrant
   *  via the `isProcessing` guard — nested calls no-op until the outer
   *  frame completes. When smartQueueOrdering is enabled in settings,
   *  items with known smaller file sizes are dispatched first to reduce
   *  total completion time (Shortest Job First). */
  processQueue(): void {
    if (!this.events.isReady()) return
    if (this.isProcessing) return
    this.isProcessing = true
    try {
      const settings = getSettings()
      const maxConcurrent = Math.max(1, settings.maxConcurrent)
      const slots = maxConcurrent - this.runtime.activeCount
      if (slots <= 0) return

      let next = this.repos.queue.findWaitingOrdered(slots)

      // Smart ordering: when enabled, promote items with known small file sizes.
      // Items with unknown size (not yet probed) stay at the end but above
      // extremely large items. This maximizes throughput by finishing quick wins first.
      if (settings.smartQueueOrdering && next.length > 1) {
        next = applySmartOrdering(next)
      }

      for (const item of next) {
        if (this.runtime.activeCount >= maxConcurrent) break
        if (this.runtime.isActive(item.id)) continue
        this.startDownload(item)
      }
    } finally {
      this.isProcessing = false
    }
  }

  private startDownload(item: DownloadItem): void {
    this.repos.queue.updateStatus(item.id, 'downloading')
    this.events.send('queue:changed')
    const extraFlags = this.extraFlagsByDownload.get(item.id)
    try {
      this.runtime.start(item, extraFlags, {
        onProgress: (p) => {
          this.repos.queue.updateProgress(item.id, p.progress, p.speed, p.eta, p.fileSize)
          this.events.send(buildProgressChannel(item.id), p)
        },
        onOutputLine: (line) => {
          const level = classifyLogLevel(line)
          this.events.send(buildLogChannel(item.id), {
            line,
            timestamp: Date.now(),
            level,
          })
        },
        onComplete: () => {
          // Clean up retry state and any injected fallback flags — download succeeded
          this.retryState.delete(item.id)
          this.cleanRetryFlags(item.id)
          const completedAt = new Date().toISOString()
          this.repos.queue.updateStatus(item.id, 'completed', completedAt)
          const row = this.findRowForArchive(item.id)
          if (row) this.repos.history.archive(row)
          this.events.send('queue:changed')
          this.processQueue()
        },
        onError: (error) => {
          this.handleDownloadError(item, error)
        },
      })
    } catch (e) {
      // Runtime.start must not throw; if a malformed item did, log + revert.
      getLogger().error(`runtime.start failed for ${item.id}: ${(e as Error).message}`)
      this.handleDownloadError(item, (e as Error).message)
    }
  }

  /**
   * Reads back the row after a status mutation so it can be archived.
   * Done in-memory from the just-updated row; no extra SQL roundtrip —
   * we re-fetch only because we want the post-update snapshot.
   */
  private findRowForArchive(id: string) {
    const item = this.repos.queue.findById(id)
    if (!item) return null
    return {
      id: item.id,
      url: item.url,
      title: item.title ?? null,
      status: item.status,
      progress: item.progress,
      speed: item.speed ?? null,
      eta: item.eta ?? null,
      fileSize: item.fileSize ?? null,
      outputPath: item.outputPath ?? null,
      error: item.error ?? null,
      priority: item.priority,
      createdAt: item.createdAt,
      completedAt: item.completedAt ?? null,
    }
  }

  // ── Auto-Retry Engine ─────────────────────────────────────────────

  /**
   * Classifies an error string to decide whether automatic retry is warranted.
   * Returns the retryable category, or null if the error is permanent.
   */
  private classifyRetryable(error: string): RetryableCategory | null {
    const e = error.toLowerCase()

    // Rate limiting — always retryable
    if (/429|too many requests|rate[\s-]?limit/i.test(e)) return 'rate_limit'

    // Network failures — transient
    if (
      /unable to download webpage|http error 5\d\d|connection reset|timed out|network is unreachable|temporary failure|econnrefused|econnreset|etimedout|enotfound|resolve host/i.test(
        e,
      )
    ) {
      return 'network'
    }

    // Extractor errors that may be temporary (server-side issues).
    // Deliberately excludes 'sign in to confirm' — age-restricted/private
    // videos require user credentials and won't resolve on retry.
    if (/extractorerror|no video formats found/i.test(e)) {
      return 'extractor'
    }

    // Everything else: ffmpeg failures, auth, permissions, format, disk — permanent
    return null
  }

  /**
   * Computes a progressively lower-quality format for each retry attempt.
   * Retry 1: same format. Retry 2: 720p cap. Retry 3: worst quality.
   */
  private computeFallbackFormat(retryCount: number, originalFormat: string): string {
    if (retryCount <= 1) return originalFormat

    // Audio-only formats: keep audio-only through all retries
    if (originalFormat.includes('bestaudio') && !originalFormat.includes('bestvideo')) {
      return retryCount >= 3 ? 'worstaudio/worst' : originalFormat
    }

    if (retryCount === 2) {
      return 'bestvideo[height<=720]+bestaudio/best[height<=720]'
    }
    // Final attempt — smallest possible
    return 'worstvideo+worstaudio/worst'
  }

  /**
   * Computes the exponential backoff delay with jitter.
   * delay = min(baseDelay * 2^retryCount, maxDelay) * random(0.75 .. 1.25)
   */
  private computeBackoffMs(retryCount: number): number {
    const linear = Math.min(RETRY_BASE_DELAY_MS * Math.pow(2, retryCount), RETRY_MAX_DELAY_MS)
    const jitter = 0.75 + Math.random() * 0.5
    return Math.round(linear * jitter)
  }

  /**
   * Called by startDownload's onError AND the catch block.
   * Decides whether to auto-retry or mark the download as permanently errored.
   */
  private handleDownloadError(item: DownloadItem, error: string): void {
    const category = this.classifyRetryable(error)
    const existing = this.retryState.get(item.id)
    const retryCount = existing ? existing.retryCount : 0
    const maxRetries = existing?.maxRetries ?? RETRY_DEFAULT_MAX

    if (category && retryCount < maxRetries) {
      // Retryable error with attempts remaining — schedule backoff
      this.scheduleRetry(item, error, category, retryCount, maxRetries)
    } else {
      // Permanent failure or ran out of retries — archive and move on
      if (existing) {
        getLogger().info(
          `Download ${item.id}: auto-retry exhausted (${retryCount}/${maxRetries}). Marking as error.`,
        )
        this.cleanRetryFlags(item.id)
        this.retryState.delete(item.id)
      }
      this.repos.queue.updateStatusWithError(item.id, 'error', error)
      const row = this.findRowForArchive(item.id)
      if (row) this.repos.history.archive(row)
      this.events.send('queue:changed')
      this.processQueue()
    }
  }

  /**
   * Schedules a delayed retry with exponential backoff and fallback format.
   */
  private scheduleRetry(
    item: DownloadItem,
    error: string,
    category: RetryableCategory,
    retryCount: number,
    maxRetries: number,
  ): void {
    const newRetryCount = retryCount + 1
    const delayMs = this.computeBackoffMs(newRetryCount)
    const nextRetryAt = Date.now() + delayMs

    // Compute fallback format and stash it in extraFlags
    const originalFormat =
      this.retryState.get(item.id)?.originalFormat ?? getSettings().outputFormat
    const fallbackFormat = this.computeFallbackFormat(newRetryCount, originalFormat)

    const existingFlags = this.extraFlagsByDownload.get(item.id)
    const mergedFlags: ExtraFlags = {
      ...(existingFlags ?? {}),
      outputFormat: fallbackFormat,
    }
    this.extraFlagsByDownload.set(item.id, mergedFlags)

    // Update persisted status to 'retrying' so the UI can reflect it.
    // Store retry metadata in the error column so the Dashboard can parse it.
    const retryMeta = `[AUTO-RETRY ${newRetryCount}/${maxRetries}] ${error}`
    this.repos.queue.updateStatusWithError(item.id, 'retrying', retryMeta)
    this.repos.queue.updateProgress(item.id, 0)

    // Schedule the retry timer
    const timer = setTimeout(() => {
      this.executeRetry(item.id)
    }, delayMs)

    // Store retry state
    this.retryState.set(item.id, {
      retryCount: newRetryCount,
      maxRetries,
      nextRetryAt,
      originalFormat,
      lastError: error,
      timer,
    })

    const delaySec = (delayMs / 1000).toFixed(0)
    getLogger().info(
      `Download ${item.id}: auto-retry ${newRetryCount}/${maxRetries} in ${delaySec}s ` +
        `(${category}) — format: ${fallbackFormat}`,
    )

    this.events.send('queue:changed')
  }

  /**
   * Fires after the backoff timer expires. Safety-checks that the item
   * still exists and is still in 'retrying' status before re-queuing.
   */
  private executeRetry(id: string): void {
    const state = this.retryState.get(id)
    if (!state) return

    // Remove the timer reference (it already fired)
    state.timer = undefined

    // Safety check: item might have been removed or paused while waiting
    const item = this.repos.queue.findById(id)
    if (!item) {
      this.retryState.delete(id)
      this.extraFlagsByDownload.delete(id)
      return
    }

    if (item.status !== 'retrying') {
      // Status was changed externally (pause, cancel, remove) — abort
      this.retryState.delete(id)
      return
    }

    // Reset to waiting and let processQueue pick it up
    this.repos.queue.resetForRetry(id)
    this.events.send('queue:changed')
    this.processQueue()
  }

  /**
   * Cancel any pending retry timer and remove retry state for a download.
   * Safe to call even if no retry is pending.
   */
  private clearRetryState(id: string): void {
    const state = this.retryState.get(id)
    if (!state) return
    if (state.timer) {
      clearTimeout(state.timer)
    }
    this.retryState.delete(id)
    // Also strip any injected fallback format so it doesn't persist
    // if the user resumes or retries manually later.
    this.cleanRetryFlags(id)
  }

  /** Strip the injected outputFormat from extraFlags (keep other flags intact). */
  private cleanRetryFlags(id: string): void {
    const flags = this.extraFlagsByDownload.get(id)
    if (!flags?.outputFormat) return
    delete flags.outputFormat
    if (Object.keys(flags).length === 0) {
      this.extraFlagsByDownload.delete(id)
    }
  }

  async add(input: AddInput): Promise<Result<DownloadItem>> {
    if (!input.url) {
      return err('INVALID_INPUT', 'URL is required')
    }
    if (input.priority !== undefined && (input.priority < 1 || input.priority > 10)) {
      return err('INVALID_INPUT', 'priority must be between 1 and 10')
    }

    const id = randomUUID()
    const createdAt = new Date().toISOString()
    const priority = input.priority ?? 5

    try {
      this.repos.queue.create({ id, url: input.url, priority, title: undefined }, createdAt)

      if (input.extraFlags && Object.keys(input.extraFlags).length > 0) {
        this.extraFlagsByDownload.set(id, input.extraFlags)
      }
    } catch (e) {
      return err('DB_ERROR', (e as Error).message)
    }

    const item = this.repos.queue.findById(id)
    if (!item) {
      return err('INTERNAL_ERROR', 'Created download disappeared')
    }

    this.events.send('queue:changed')
    this.processQueue()
    return ok(item)
  }

  /** Update a download's persisted title (e.g. after metadata enrichment). */
  setTitle(id: string, title: string | undefined): Result<void> {
    if (!this.repos.queue.findById(id)) return err('NOT_FOUND', `No download with id ${id}`)
    this.repos.queue.updateTitle(id, title)
    this.events.send('queue:changed')
    return ok(undefined)
  }

  async addBatch(input: {
    urls: string[]
    priority?: number
    extraFlags?: ExtraFlags
  }): Promise<Result<DownloadItem[]>> {
    // ── Deduplication ────────────────────────────────────────────
    // 1. Trim and drop empty strings
    const trimmed = input.urls.map((u) => u.trim()).filter(Boolean)

    // 2. Remove internal duplicates (case-insensitive), preserving first occurrence casing
    const seen = new Set<string>()
    const unique: string[] = []
    for (const u of trimmed) {
      const key = u.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(u)
      }
    }

    // 3. Cross-check against active queue items to skip already-queued URLs.
    //    Terminal states (completed, error, cancelled) are NOT blocked —
    //    a user may want to re-download a finished/failed item by pasting again.
    const activeStatuses = new Set([
      'waiting',
      'downloading',
      'paused',
      'retrying',
      'fetching_metadata',
      'preparing',
      'merging',
      'embedding',
      'verifying',
    ])
    const existing = new Set(
      this.repos.queue
        .findAll()
        .filter((item) => activeStatuses.has(item.status))
        .map((item) => item.url.trim().toLowerCase()),
    )
    const newUrls = unique.filter((u) => !existing.has(u.trim().toLowerCase()))

    const skipped = trimmed.length - newUrls.length
    if (skipped > 0) {
      getLogger().info(
        `Batch add: ${skipped} duplicate URL(s) skipped (${newUrls.length} new, ${trimmed.length} submitted)`,
      )
    }

    const out: DownloadItem[] = []
    for (const url of newUrls) {
      const r = await this.add({ url, priority: input.priority, extraFlags: input.extraFlags })
      if (!r.ok) return r
      out.push(r.data)
    }
    return ok(out)
  }

  pause(id: string): Result<void> {
    if (!this.repos.queue.findById(id)) return err('NOT_FOUND', `No download with id ${id}`)
    this.runtime.cancel(id)
    this.clearRetryState(id)
    this.repos.queue.updateStatus(id, 'paused')
    this.events.send('queue:changed')
    this.processQueue()
    return ok(undefined)
  }

  resume(id: string): Result<void> {
    if (!this.repos.queue.findById(id)) return err('NOT_FOUND', `No download with id ${id}`)
    this.clearRetryState(id)
    this.repos.queue.updateStatus(id, 'waiting')
    this.events.send('queue:changed')
    this.processQueue()
    return ok(undefined)
  }

  cancel(id: string): Result<void> {
    if (!this.repos.queue.findById(id)) return err('NOT_FOUND', `No download with id ${id}`)
    this.runtime.cancel(id)
    this.clearRetryState(id)
    this.repos.queue.updateStatus(id, 'cancelled')
    this.events.send('queue:changed')
    this.processQueue()
    return ok(undefined)
  }

  remove(id: string): Result<void> {
    const row = this.findRowForArchive(id)
    if (!row) return err('NOT_FOUND', `No download with id ${id}`)
    this.runtime.cancel(id)
    this.clearRetryState(id)
    this.extraFlagsByDownload.delete(id)
    if (row.status !== 'completed' && row.status !== 'error' && row.status !== 'cancelled') {
      // snapshot current state to preserve metadata before deletion
      this.repos.history.archive(row)
    }
    this.repos.queue.deleteByIds([id])
    this.events.send('queue:changed')
    return ok(undefined)
  }

  retry(id: string): Result<DownloadItem> {
    if (!this.repos.queue.findById(id)) return err('NOT_FOUND', `No download with id ${id}`)
    // Clear any stale auto-retry state on manual retry
    this.clearRetryState(id)
    // Reset the fallback format so manual retry starts fresh with original format
    const flags = this.extraFlagsByDownload.get(id)
    if (flags?.outputFormat) {
      delete flags.outputFormat
      if (Object.keys(flags).length === 0) {
        this.extraFlagsByDownload.delete(id)
      }
    }
    this.repos.queue.resetForRetry(id)
    this.events.send('queue:changed')
    this.processQueue()
    const item = this.repos.queue.findById(id)
    return item ? ok(item) : err('INTERNAL_ERROR', 'Retry target lost')
  }

  clearCompleted(): Result<{ removed: number }> {
    // Archive any remaining finished rows before deleting.
    const all = this.repos.queue.findAll()
    const finished = all.filter(
      (i) => i.status === 'completed' || i.status === 'error' || i.status === 'cancelled',
    )
    for (const item of finished) {
      this.repos.history.archive(this.findRowForArchive(item.id)!)
    }
    // Clean up extraFlags for removed items
    for (const item of finished) {
      this.extraFlagsByDownload.delete(item.id)
    }
    const removed = this.repos.queue.deleteFinished()
    getLogger().info(`Archived and cleared ${removed} finished download(s)`)
    this.events.send('queue:changed')
    return ok({ removed })
  }

  // ── Queries ─────────────────────────────────────────────────────────

  getAll(): Result<DownloadItem[]> {
    return ok(this.repos.queue.findAll())
  }

  get(id: string): Result<DownloadItem | null> {
    return ok(this.repos.queue.findById(id))
  }

  reorder(id: string, direction: 'up' | 'down'): Result<void> {
    const item = this.repos.queue.findById(id)
    if (!item) return err('NOT_FOUND', `No download with id ${id}`)
    if (item.status !== 'waiting') {
      return err('INVALID_INPUT', 'Only waiting items can be reordered')
    }
    // Reordering is done by adjusting priority within the same tier.
    // Move up = increase priority; move down = decrease priority.
    const delta = direction === 'up' ? 1 : -1
    const newPriority = Math.max(1, Math.min(10, item.priority + delta))
    if (newPriority !== item.priority) {
      this.repos.queue.updatePriority(id, newPriority)
      this.events.send('queue:changed')
    }
    return ok(undefined)
  }

  /** Drag-and-drop reorder: move a waiting item to a specific position index
   *  among other waiting items, computing a new priority from its neighbors. */
  reorderToPosition(id: string, newIndex: number): Result<void> {
    const item = this.repos.queue.findById(id)
    if (!item) return err('NOT_FOUND', `No download with id ${id}`)
    if (item.status !== 'waiting') {
      return err('INVALID_INPUT', 'Only waiting items can be reordered')
    }

    const waiting = this.repos.queue.findWaitingOrdered(9999)
    if (waiting.length < 2) return ok(undefined)

    // Remove the item from its current position
    const currentIdx = waiting.findIndex((w) => w.id === id)
    if (currentIdx === -1) return ok(undefined)
    if (currentIdx === newIndex) return ok(undefined)

    const others = waiting.filter((w) => w.id !== id)
    const clampedIdx = Math.max(0, Math.min(newIndex, others.length))

    let newPriority: number
    if (clampedIdx === 0) {
      // Top of the list — higher priority than the current top
      newPriority = Math.min(10, (others[0]?.priority ?? 5) + 1)
    } else if (clampedIdx >= others.length) {
      // Bottom — lower than the last item
      newPriority = Math.max(1, (others[others.length - 1]?.priority ?? 5) - 1)
    } else {
      // Between two items — average their priorities
      const above = others[clampedIdx - 1]?.priority ?? 10
      const below = others[clampedIdx]?.priority ?? 1
      newPriority = Math.round((above + below) / 2)
      // If averaging gives the same priority as a neighbor, use fractional tiebreaker
      if (newPriority === above && above > 1) newPriority = above - 1
      else if (newPriority === below && below < 10) newPriority = below + 1
    }
    newPriority = Math.max(1, Math.min(10, newPriority))

    if (newPriority !== item.priority) {
      this.repos.queue.updatePriority(id, newPriority)
      this.events.send('queue:changed')
    }
    return ok(undefined)
  }

  /** Read per-download extra flags for an existing queue item. */
  getExtraFlags(id: string): Result<ExtraFlags | null> {
    if (!this.repos.queue.findById(id)) return err('NOT_FOUND', `No download with id ${id}`)
    return ok(this.extraFlagsByDownload.get(id) ?? null)
  }

  /** Update per-download extra flags for an existing queue item. */
  updateExtraFlags(id: string, flags: ExtraFlags): Result<void> {
    if (!this.repos.queue.findById(id)) return err('NOT_FOUND', `No download with id ${id}`)
    if (Object.keys(flags).length > 0) {
      this.extraFlagsByDownload.set(id, { ...flags })
    } else {
      this.extraFlagsByDownload.delete(id)
    }
    return ok(undefined)
  }

  /** Set or clear a per-download speed limit override. */
  setSpeedLimit(id: string, limit: string | null): Result<void> {
    if (!this.repos.queue.findById(id)) return err('NOT_FOUND', `No download with id ${id}`)
    const flags = this.extraFlagsByDownload.get(id)
    if (limit) {
      if (flags) {
        flags.speedLimit = limit
      } else {
        this.extraFlagsByDownload.set(id, { speedLimit: limit })
      }
    } else if (flags) {
      delete flags.speedLimit
      if (Object.keys(flags).length === 0) {
        this.extraFlagsByDownload.delete(id)
      }
    }
    return ok(undefined)
  }

  getStats(): Result<QueueStats> {
    return ok(this.repos.queue.countStats())
  }

  async fetchMetadata(url: string): Promise<Result<VideoMetadata>> {
    if (!url) return err('INVALID_INPUT', 'URL is required')
    try {
      const meta = await this.runtime.fetchMetadata(url)
      return ok(meta)
    } catch (e) {
      return err('YT_DLP_ERROR', (e as Error).message)
    }
  }

  async fetchPlaylist(url: string): Promise<Result<PlaylistResult>> {
    if (!url) return err('INVALID_INPUT', 'URL is required')
    try {
      const result = await this.runtime.fetchPlaylist(url)
      return ok(result)
    } catch (e) {
      return err('YT_DLP_ERROR', (e as Error).message)
    }
  }

  /**
   * Estimate the total download size of a batch of URLs by fetching metadata
   * for each (in parallel, capped at 5 concurrent) and summing up the
   * largest available format size per URL.
   *
   * Returns: estimatedBytes (sum of best estimates), resolvable (count of
   * URLs where we got a size), total (total URLs submitted).
   */
  async estimateBatchSize(
    urls: string[],
  ): Promise<Result<{ estimatedBytes: number; resolvable: number; total: number }>> {
    if (!urls.length) return err('INVALID_INPUT', 'urls must be non-empty')

    const CONCURRENCY = 5
    let estimatedBytes = 0
    let resolvable = 0

    // Process in chunks of CONCURRENCY to avoid overwhelming the system
    for (let i = 0; i < urls.length; i += CONCURRENCY) {
      const chunk = urls.slice(i, i + CONCURRENCY)
      const results = await Promise.allSettled(
        chunk.map(async (url) => {
          try {
            const meta = await this.runtime.fetchMetadata(url)
            return meta
          } catch {
            return null
          }
        }),
      )

      for (const result of results) {
        if (result.status !== 'fulfilled' || !result.value) continue
        const meta = result.value
        // Find the largest format to use as the size estimate
        let maxSize = 0
        if (meta.formats) {
          for (const fmt of meta.formats) {
            const size = fmt.filesize ?? fmt.filesizeApprox ?? 0
            if (size > maxSize) maxSize = size
          }
        }
        if (maxSize > 0) {
          estimatedBytes += maxSize
          resolvable++
        }
      }
    }

    return ok({ estimatedBytes, resolvable, total: urls.length })
  }
}
