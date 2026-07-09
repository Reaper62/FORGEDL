import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { makeTestDb, type TestDb } from '../database/repositories/__fixtures__'
import { InMemoryEventSink, NoopEventSink } from './event-bus'
import { QueueService, parseFileSizeToBytes, applySmartOrdering } from './QueueService'
import { setSettingsSnapshot, clearSettingsSnapshot } from './settings-snapshot'
import type { DownloadCallbacks, DownloadRuntime } from './download-runtime'
import type { DownloadItem, DownloadProgress, VideoMetadata } from '../../shared/types'
import { DownloadSettingsSchema } from '../../shared/types'

// ── FakeRuntime ────────────────────────────────────────────────────────

class FakeRuntime implements Pick<
  DownloadRuntime,
  | 'activeCount'
  | 'isActive'
  | 'activeIds'
  | 'start'
  | 'cancel'
  | 'cancelAll'
  | 'waitForAllExit'
  | 'fetchMetadata'
> {
  private readonly _active = new Set<string>()

  get activeCount(): number {
    return this._active.size
  }
  isActive = (id: string): boolean => this._active.has(id)
  activeIds = (): string[] => [...this._active.keys()]
  start(item: DownloadItem, _extraFlags: unknown, cb: DownloadCallbacks): void {
    void cb
    this._active.add(item.id)
  }
  cancel(id: string): boolean {
    const had = this._active.has(id)
    this._active.delete(id)
    return had
  }
  cancelAll = (): number => {
    const n = this._active.size
    this._active.clear()
    return n
  }
  waitForAllExit = async (): Promise<void> => undefined
  fetchMetadata = async (url: string): Promise<VideoMetadata> => {
    return { id: 'sm', title: `mock-${url}`, uploader: 'mocker' }
  }

  installStart(id: string, callbacks: DownloadCallbacks): void {
    this._active.add(id)
    callbacks.onProgress?.({ id, progress: 0, speed: '', eta: '' })
  }
  simulateCompletion(id: string): void {
    this._active.delete(id)
  }
  simulateProgress(_id: string, _p: DownloadProgress): void {
    void _id
    void _p
  }
}

// ── Smart Ordering Utilities ────────────────────────────────────────────

function makeItem(overrides: Partial<DownloadItem> = {}): DownloadItem {
  return {
    id: overrides.id ?? 'id-1',
    url: overrides.url ?? 'https://example.com/v',
    title: overrides.title ?? 'Test Video',
    status: overrides.status ?? 'waiting',
    progress: overrides.progress ?? 0,
    priority: overrides.priority ?? 5,
    createdAt: overrides.createdAt ?? '2025-01-01T00:00:00Z',
    fileSize: overrides.fileSize,
    speed: overrides.speed,
    eta: overrides.eta,
    outputPath: overrides.outputPath,
    error: overrides.error,
    completedAt: overrides.completedAt,
  }
}

// ── Log Level Classification ────────────────────────────────────────────

import { classifyLogLevel } from './QueueService'

describe('classifyLogLevel', () => {
  it('classifies ERROR: lines as error', () => {
    expect(classifyLogLevel('ERROR: [youtube] Video unavailable')).toBe('error')
  })

  it('classifies [error] tag as error', () => {
    expect(classifyLogLevel('[error] Something failed')).toBe('error')
  })

  it('classifies FATAL lines as error', () => {
    expect(classifyLogLevel('FATAL: Out of memory')).toBe('error')
  })

  it('classifies Traceback lines as error', () => {
    expect(classifyLogLevel('Traceback (most recent call last):')).toBe('error')
  })

  it('classifies WARNING: lines as warn', () => {
    expect(classifyLogLevel('WARNING: [youtube] Falling back')).toBe('warn')
  })

  it('classifies [warn] tag as warn', () => {
    expect(classifyLogLevel('[warn] Deprecated option used')).toBe('warn')
  })

  it('classifies [warning] tag as warn', () => {
    expect(classifyLogLevel('[warning] SSL certificate issue')).toBe('warn')
  })

  it('classifies download progress lines as info', () => {
    expect(classifyLogLevel('[download] 45.3% of 50MiB at 2.1MiB/s ETA 00:15')).toBe('info')
  })

  it('classifies generic stdout as info', () => {
    expect(classifyLogLevel('[youtube] Extracting URL: https://...')).toBe('info')
  })

  it('is case-insensitive for error patterns', () => {
    expect(classifyLogLevel('error: something went wrong')).toBe('error')
  })

  it('is case-insensitive for warn patterns', () => {
    expect(classifyLogLevel('warning: disk space low')).toBe('warn')
  })

  it('does not misclassify lines with err/warn in URL text', () => {
    expect(classifyLogLevel('[download] Downloading video from some-error-site.com')).toBe('info')
  })
})

describe('parseFileSizeToBytes', () => {
  it('returns -1 for undefined', () => {
    expect(parseFileSizeToBytes(undefined)).toBe(-1)
  })

  it('returns -1 for empty string', () => {
    expect(parseFileSizeToBytes('')).toBe(-1)
  })

  it('returns -1 for unparseable string', () => {
    expect(parseFileSizeToBytes('not a size')).toBe(-1)
  })

  it('returns -1 for invalid format', () => {
    expect(parseFileSizeToBytes('abc MB')).toBe(-1)
  })

  it('parses bare bytes (no unit)', () => {
    expect(parseFileSizeToBytes('1024')).toBe(1024)
  })

  it('parses bytes with B unit', () => {
    expect(parseFileSizeToBytes('512 B')).toBe(512)
  })

  it('parses KB', () => {
    expect(parseFileSizeToBytes('1 KB')).toBe(1000)
  })

  it('parses KiB (IEC)', () => {
    expect(parseFileSizeToBytes('1 KiB')).toBe(1024)
  })

  it('parses MB', () => {
    expect(parseFileSizeToBytes('10 MB')).toBe(10000000)
  })

  it('parses MiB (IEC)', () => {
    expect(parseFileSizeToBytes('10 MiB')).toBe(10485760)
  })

  it('parses GB', () => {
    expect(parseFileSizeToBytes('2 GB')).toBe(2000000000)
  })

  it('parses GiB (IEC)', () => {
    expect(parseFileSizeToBytes('2 GiB')).toBe(2147483648)
  })

  it('parses TB', () => {
    expect(parseFileSizeToBytes('1 TB')).toBe(1000000000000)
  })

  it('parses TiB (IEC)', () => {
    expect(parseFileSizeToBytes('1 TiB')).toBe(1099511627776)
  })

  it('parses decimal values', () => {
    expect(parseFileSizeToBytes('1.5 MB')).toBe(1500000)
  })

  it('parses decimal values with IEC units', () => {
    expect(parseFileSizeToBytes('2.5 GiB')).toBe(2684354560)
  })

  it('handles yt-dlp format: no space before unit', () => {
    expect(parseFileSizeToBytes('50MiB')).toBe(52428800)
  })

  it('handles yt-dlp format: fractional with no space', () => {
    expect(parseFileSizeToBytes('1.2GiB')).toBe(1288490189)
  })

  it('is case-insensitive', () => {
    expect(parseFileSizeToBytes('1 mib')).toBe(1048576)
    expect(parseFileSizeToBytes('1 MIB')).toBe(1048576)
  })

  it('rounds to nearest integer', () => {
    expect(parseFileSizeToBytes('1.234 MiB')).toBe(Math.round(1.234 * 1048576))
  })

  it('handles very small sizes', () => {
    const result = parseFileSizeToBytes('0.001 MB')
    expect(result).toBeGreaterThan(0)
  })

  it('handles zero', () => {
    expect(parseFileSizeToBytes('0 B')).toBe(0)
  })
})

describe('applySmartOrdering', () => {
  it('returns a new array (does not mutate input)', () => {
    const input = [makeItem({ id: 'a', fileSize: '1 MB' }), makeItem({ id: 'b', fileSize: '2 MB' })]
    const original = [...input]
    const result = applySmartOrdering(input)
    expect(result).not.toBe(input)
    expect(input).toEqual(original)
  })

  it('returns empty array for empty input', () => {
    expect(applySmartOrdering([])).toEqual([])
  })

  it('returns single item unchanged', () => {
    const item = makeItem({ id: 'sole', fileSize: '5 MB' })
    expect(applySmartOrdering([item])).toEqual([item])
  })

  it('sorts known sizes smallest first', () => {
    const items = [
      makeItem({ id: 'large', fileSize: '100 MB', priority: 5 }),
      makeItem({ id: 'small', fileSize: '1 MB', priority: 5 }),
      makeItem({ id: 'medium', fileSize: '10 MB', priority: 5 }),
    ]
    const ordered = applySmartOrdering(items)
    expect(ordered.map((i) => i.id)).toEqual(['small', 'medium', 'large'])
  })

  it('puts known sizes before unknown sizes', () => {
    const items = [
      makeItem({ id: 'unknown', fileSize: undefined, priority: 10 }),
      makeItem({ id: 'known', fileSize: '1 GB', priority: 1 }),
    ]
    const ordered = applySmartOrdering(items)
    expect(ordered.map((i) => i.id)).toEqual(['known', 'unknown'])
  })

  it('sorts unknown items by priority (higher first)', () => {
    const items = [
      makeItem({ id: 'low', fileSize: undefined, priority: 2 }),
      makeItem({ id: 'high', fileSize: undefined, priority: 8 }),
    ]
    const ordered = applySmartOrdering(items)
    expect(ordered.map((i) => i.id)).toEqual(['high', 'low'])
  })

  it('uses priority as tiebreaker for same-size items', () => {
    const items = [
      makeItem({ id: 'a', fileSize: '10 MB', priority: 3 }),
      makeItem({ id: 'b', fileSize: '10 MB', priority: 7 }),
    ]
    const ordered = applySmartOrdering(items)
    expect(ordered.map((i) => i.id)).toEqual(['b', 'a'])
  })

  it('sorts known small first, then known large, then unknown by priority', () => {
    const items = [
      makeItem({ id: 'unknown-low', fileSize: undefined, priority: 2 }),
      makeItem({ id: 'big', fileSize: '5 GB', priority: 5 }),
      makeItem({ id: 'tiny', fileSize: '50 KB', priority: 1 }),
      makeItem({ id: 'unknown-high', fileSize: undefined, priority: 9 }),
      makeItem({ id: 'medium', fileSize: '100 MB', priority: 1 }),
    ]
    const ordered = applySmartOrdering(items)
    expect(ordered.map((i) => i.id)).toEqual([
      'tiny',
      'medium',
      'big',
      'unknown-high',
      'unknown-low',
    ])
  })

  it('handles all items with unknown sizes (priority ordering only)', () => {
    const items = [
      makeItem({ id: 'p1', fileSize: undefined, priority: 1 }),
      makeItem({ id: 'p5', fileSize: undefined, priority: 5 }),
      makeItem({ id: 'p10', fileSize: undefined, priority: 10 }),
    ]
    const ordered = applySmartOrdering(items)
    expect(ordered.map((i) => i.id)).toEqual(['p10', 'p5', 'p1'])
  })

  it('handles mixed IEC and SI units in comparison', () => {
    const items = [
      makeItem({ id: 'iec', fileSize: '1 MiB', priority: 5 }),
      makeItem({ id: 'si', fileSize: '1 MB', priority: 5 }),
    ]
    const ordered = applySmartOrdering(items)
    // 1 MB = 1,000,000 bytes, 1 MiB = 1,048,576 bytes — SI MB is smaller
    expect(ordered.map((i) => i.id)).toEqual(['si', 'iec'])
  })

  it('handles all same priority and all unknown sizes', () => {
    const items = [
      makeItem({ id: 'a', fileSize: undefined, priority: 5 }),
      makeItem({ id: 'b', fileSize: undefined, priority: 5 }),
    ]
    const ordered = applySmartOrdering(items)
    expect(ordered).toHaveLength(2)
  })

  it('prioritizes known sizes over unknown even with much higher priority', () => {
    const items = [
      makeItem({ id: 'important-unknown', fileSize: undefined, priority: 10 }),
      makeItem({ id: 'small-known', fileSize: '1 KB', priority: 1 }),
    ]
    const ordered = applySmartOrdering(items)
    expect(ordered.map((i) => i.id)).toEqual(['small-known', 'important-unknown'])
  })
})

// ── QueueService Integration Tests ──────────────────────────────────────

describe('QueueService', () => {
  let tdb: TestDb
  let sink: InMemoryEventSink
  let runtime: FakeRuntime
  let service: QueueService

  beforeEach(() => {
    tdb = makeTestDb()
    sink = new InMemoryEventSink()
    runtime = new FakeRuntime()
    service = new QueueService({
      queueRepo: tdb.repositories.queue,
      historyRepo: tdb.repositories.history,
      runtime: runtime as unknown as DownloadRuntime,
      events: sink,
    })
    setSettingsSnapshot(DownloadSettingsSchema.parse({ maxConcurrent: 3 }))
  })

  afterEach(() => {
    clearSettingsSnapshot()
    tdb.close()
  })

  it('add inserts a waiting item and emits queue:changed', async () => {
    const r = await service.add({ url: 'https://example.com/a' })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.data.status).toBe('waiting')
    expect(sink.history().some((e) => e.channel === 'queue:changed')).toBe(true)
  })

  it('add rejects invalid priority', async () => {
    const r = await service.add({ url: 'https://x', priority: 99 })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.code).toBe('INVALID_INPUT')
  })

  it('processQueue bails when events are not ready (no-op sink)', async () => {
    const offline = new QueueService({
      queueRepo: tdb.repositories.queue,
      historyRepo: tdb.repositories.history,
      runtime: runtime as unknown as DownloadRuntime,
      events: new NoopEventSink(),
    })
    const addResult = await offline.add({ url: 'https://x/pq' })
    expect(addResult.ok).toBe(true)
    offline.processQueue()
    expect(runtime.activeCount).toBe(0)
  })

  it('pause flips status to paused and cancels an active item', async () => {
    const r = await service.add({ url: 'https://x/1' })
    if (!r.ok) throw new Error('precondition failed')
    runtime.installStart(r.data.id, {
      onProgress: () => undefined,
      onComplete: () => undefined,
      onError: () => undefined,
    })
    const pauseResult = service.pause(r.data.id)
    expect(pauseResult.ok).toBe(true)
    const item = service.get(r.data.id)
    if (item.ok && item.data) {
      expect(item.data.status).toBe('paused')
    }
  })

  it('resume flips paused back to waiting', async () => {
    const r = await service.add({ url: 'https://x/2' })
    if (!r.ok) throw new Error('precondition failed')
    service.pause(r.data.id)
    const resumeResult = service.resume(r.data.id)
    expect(resumeResult.ok).toBe(true)
    const item = service.get(r.data.id)
    if (item.ok && item.data) {
      expect(item.data.status).toBe('waiting')
    }
  })

  it('cancel stops active and marks cancelled', async () => {
    const r = await service.add({ url: 'https://x/3' })
    if (!r.ok) throw new Error('precondition failed')
    runtime.installStart(r.data.id, {
      onProgress: () => undefined,
      onComplete: () => undefined,
      onError: () => undefined,
    })
    const cancelResult = service.cancel(r.data.id)
    expect(cancelResult.ok).toBe(true)
    const item = service.get(r.data.id)
    if (item.ok && item.data) {
      expect(item.data.status).toBe('cancelled')
    }
  })

  it('remove deletes item and archives non-terminal rows', async () => {
    const r = await service.add({ url: 'https://x/4' })
    if (!r.ok) throw new Error('precondition failed')
    const removeResult = service.remove(r.data.id)
    expect(removeResult.ok).toBe(true)
    const item = service.get(r.data.id)
    if (item.ok) {
      expect(item.data).toBeNull()
    }
  })

  it('retry resets error/retrying items to waiting', async () => {
    const r = await service.add({ url: 'https://x/5' })
    if (!r.ok) throw new Error('precondition failed')
    tdb.repositories.queue.updateStatusWithError(r.data.id, 'error', 'test failure')
    const retryResult = service.retry(r.data.id)
    expect(retryResult.ok).toBe(true)
    const item = service.get(r.data.id)
    if (item.ok && item.data) {
      expect(item.data.status).toBe('waiting')
    }
  })

  it('clearCompleted removes finished items', async () => {
    const r = await service.add({ url: 'https://x/6' })
    if (!r.ok) throw new Error('precondition failed')
    tdb.repositories.queue.updateStatus(r.data.id, 'completed')
    const clearResult = service.clearCompleted()
    expect(clearResult.ok).toBe(true)
    if (clearResult.ok) {
      expect(clearResult.data.removed).toBe(1)
    }
  })

  it('addBatch creates multiple items', async () => {
    const r = await service.addBatch({ urls: ['https://x/a', 'https://x/b', 'https://x/c'] })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.data).toHaveLength(3)
    }
  })

  it('addBatch deduplicates internal duplicates (case-insensitive)', async () => {
    const r = await service.addBatch({ urls: ['https://x/A', 'https://x/a', 'https://x/b'] })
    expect(r.ok).toBe(true)
    if (r.ok) {
      // 'https://x/A' and 'https://x/a' are the same URL — only 2 should be added
      expect(r.data).toHaveLength(2)
      const urls = r.data.map((d) => d.url)
      expect(urls).toContain('https://x/A')
      expect(urls).toContain('https://x/b')
    }
  })

  it('addBatch skips URLs already in the queue', async () => {
    // Add one URL first
    await service.add({ url: 'https://x/existing' })
    // Now batch-add including the existing URL
    const r = await service.addBatch({ urls: ['https://x/existing', 'https://x/new'] })
    expect(r.ok).toBe(true)
    if (r.ok) {
      // Only 'new' should be added — 'existing' is already in queue
      expect(r.data).toHaveLength(1)
      expect(r.data[0].url).toBe('https://x/new')
    }
    // Total queue should have 2 items (original + new)
    const all = service.getAll()
    if (all.ok) expect(all.data).toHaveLength(2)
  })

  it('addBatch allows re-adding URLs in terminal states (completed, error, cancelled)', async () => {
    // Add and complete a URL
    const r1 = await service.add({ url: 'https://x/re-download' })
    if (!r1.ok) throw new Error('precondition failed')
    tdb.repositories.queue.updateStatus(r1.data.id, 'completed')

    // Re-add the same URL — should be allowed since it's in a terminal state
    const r2 = await service.addBatch({ urls: ['https://x/re-download'] })
    expect(r2.ok).toBe(true)
    if (r2.ok) {
      expect(r2.data).toHaveLength(1)
      expect(r2.data[0].url).toBe('https://x/re-download')
    }
    // Total queue should have 2 items (old completed + new waiting)
    const all = service.getAll()
    if (all.ok) expect(all.data).toHaveLength(2)
  })

  it('addBatch trims whitespace from URLs', async () => {
    const r = await service.addBatch({ urls: ['  https://x/trimmed  ', 'https://x/other'] })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.data).toHaveLength(2)
    }
  })

  it('getAll returns all items', async () => {
    await service.add({ url: 'https://x/1' })
    await service.add({ url: 'https://x/2' })
    const result = service.getAll()
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data).toHaveLength(2)
    }
  })

  it('get returns null for unknown id', () => {
    const result = service.get('nonexistent')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data).toBeNull()
    }
  })

  it('getStats returns queue statistics', async () => {
    await service.add({ url: 'https://x/1' })
    const stats = service.getStats()
    expect(stats.ok).toBe(true)
    if (stats.ok) {
      expect(stats.data.waiting).toBe(1)
    }
  })

  it('reorder changes priority of waiting item', async () => {
    const r = await service.add({ url: 'https://x/7', priority: 5 })
    if (!r.ok) throw new Error('precondition failed')
    const reorderResult = service.reorder(r.data.id, 'up')
    expect(reorderResult.ok).toBe(true)
    const item = service.get(r.data.id)
    if (item.ok && item.data) {
      expect(item.data.priority).toBe(6)
    }
  })

  it('reorder rejects non-waiting items', async () => {
    const r = await service.add({ url: 'https://x/8' })
    if (!r.ok) throw new Error('precondition failed')
    service.pause(r.data.id)
    const reorderResult = service.reorder(r.data.id, 'up')
    expect(reorderResult.ok).toBe(false)
  })

  it('smartQueueOrdering sends smaller items first in processQueue', async () => {
    setSettingsSnapshot(
      DownloadSettingsSchema.parse({ maxConcurrent: 1, smartQueueOrdering: true }),
    )
    await service.add({ url: 'https://x/large', priority: 5 })
    await service.add({ url: 'https://x/small', priority: 5 })
    await service.add({ url: 'https://x/medium', priority: 5 })

    const all = service.getAll()
    if (!all.ok) throw new Error('precondition failed')

    const items = all.data
    const large = items.find((i) => i.url === 'https://x/large')!
    const small = items.find((i) => i.url === 'https://x/small')!
    const medium = items.find((i) => i.url === 'https://x/medium')!

    tdb.repositories.queue.updateProgress(large.id, 0, '', '', '100 MB')
    tdb.repositories.queue.updateProgress(small.id, 0, '', '', '1 MB')
    tdb.repositories.queue.updateProgress(medium.id, 0, '', '', '10 MB')

    service.processQueue()

    expect(runtime.activeCount).toBeGreaterThanOrEqual(1)
    const activeIds = runtime.activeIds()
    if (activeIds.length > 0) {
      expect(activeIds).toContain(small.id)
    }
  })

  it('smartQueueOrdering off keeps original order', async () => {
    setSettingsSnapshot(
      DownloadSettingsSchema.parse({ maxConcurrent: 1, smartQueueOrdering: false }),
    )
    await service.add({ url: 'https://x/off-a', priority: 5 })
    await service.add({ url: 'https://x/off-b', priority: 5 })

    const all = service.getAll()
    if (!all.ok) throw new Error('precondition failed')
    const items = all.data
    tdb.repositories.queue.updateProgress(items[0].id, 0, '', '', '100 MB')
    tdb.repositories.queue.updateProgress(items[1].id, 0, '', '', '1 MB')

    service.processQueue()

    expect(runtime.activeCount).toBeGreaterThanOrEqual(1)
    const activeIds = runtime.activeIds()
    if (activeIds.length > 0) {
      expect(activeIds).toContain(items[0].id)
    }
  })
})
