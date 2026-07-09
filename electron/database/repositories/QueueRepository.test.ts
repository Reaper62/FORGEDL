import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { makeTestDb, type TestDb } from './__fixtures__'

describe('QueueRepository', () => {
  let tdb: TestDb
  beforeEach(() => {
    tdb = makeTestDb()
  })
  afterEach(() => {
    tdb.close()
  })

  it('creates and finds a download', () => {
    const createdAt = '2025-01-01T00:00:00.000Z'
    tdb.repositories.queue.create({ id: 'a', url: 'https://x', priority: 5 }, createdAt)
    const item = tdb.repositories.queue.findById('a')
    expect(item).not.toBeNull()
    expect(item!.id).toBe('a')
    expect(item!.url).toBe('https://x')
    expect(item!.status).toBe('waiting')
    expect(item!.priority).toBe(5)
  })

  it('returns most-recent first by createdAt', () => {
    tdb.repositories.queue.create({ id: 'a', url: 'u1', priority: 5 }, '2025-01-01T00:00:00Z')
    tdb.repositories.queue.create({ id: 'b', url: 'u2', priority: 5 }, '2025-01-02T00:00:00Z')
    const all = tdb.repositories.queue.findAll()
    expect(all.map((x) => x.id)).toEqual(['b', 'a'])
  })

  it('orders waiting items by priority desc, then createdAt asc', () => {
    tdb.repositories.queue.create({ id: 'low', url: 'u', priority: 1 }, '2025-01-01T00:00:00Z')
    tdb.repositories.queue.create({ id: 'high', url: 'u', priority: 9 }, '2025-01-02T00:00:00Z')
    tdb.repositories.queue.create({ id: 'mid', url: 'u', priority: 5 }, '2025-01-03T00:00:00Z')
    const waiting = tdb.repositories.queue.findWaitingOrdered(10)
    expect(waiting.map((x) => x.id)).toEqual(['high', 'mid', 'low'])
  })

  it('updates title', () => {
    tdb.repositories.queue.create({ id: 'a', url: 'u', priority: 5 }, '2025-01-01T00:00:00Z')
    tdb.repositories.queue.updateTitle('a', 'New Title')
    expect(tdb.repositories.queue.findById('a')!.title).toBe('New Title')
  })

  it('updates status and emits completedAt', () => {
    tdb.repositories.queue.create({ id: 'a', url: 'u', priority: 5 }, '2025-01-01T00:00:00Z')
    tdb.repositories.queue.updateStatus('a', 'completed', '2025-01-02T00:00:00Z')
    const item = tdb.repositories.queue.findById('a')!
    expect(item.status).toBe('completed')
    expect(item.completedAt).toBe('2025-01-02T00:00:00Z')
  })

  it('updates progress + speed + eta', () => {
    tdb.repositories.queue.create({ id: 'a', url: 'u', priority: 5 }, '2025-01-01T00:00:00Z')
    tdb.repositories.queue.updateProgress('a', 42.5, '1.2 MiB/s', '00:30', '50MiB')
    const item = tdb.repositories.queue.findById('a')!
    expect(item.progress).toBe(42.5)
    expect(item.speed).toBe('1.2 MiB/s')
    expect(item.eta).toBe('00:30')
    expect(item.fileSize).toBe('50MiB')
  })

  it('resetForRetry returns to waiting with cleared progress', () => {
    tdb.repositories.queue.create({ id: 'a', url: 'u', priority: 5 }, '2025-01-01T00:00:00Z')
    tdb.repositories.queue.updateStatus('a', 'error')
    tdb.repositories.queue.updateStatusWithError('a', 'error', 'boom')
    tdb.repositories.queue.resetForRetry('a')
    const item = tdb.repositories.queue.findById('a')!
    expect(item.status).toBe('waiting')
    expect(item.progress).toBe(0)
    expect(item.error).toBeUndefined()
  })

  it('resetStaleDownloading flips in-flight rows to waiting', () => {
    tdb.repositories.queue.create({ id: 'a', url: 'u', priority: 5 }, '2025-01-01T00:00:00Z')
    tdb.repositories.queue.create({ id: 'b', url: 'u', priority: 5 }, '2025-01-01T00:00:00Z')
    tdb.repositories.queue.updateStatus('a', 'downloading')
    tdb.repositories.queue.updateStatus('b', 'downloading')
    const n = tdb.repositories.queue.resetStaleDownloading()
    expect(n).toBe(2)
    expect(tdb.repositories.queue.findById('a')!.status).toBe('waiting')
    expect(tdb.repositories.queue.findById('b')!.status).toBe('waiting')
  })

  it('countStats aggregates by status', () => {
    tdb.repositories.queue.create({ id: 'a', url: 'u', priority: 1 }, '2025-01-01T00:00:00Z')
    tdb.repositories.queue.create({ id: 'b', url: 'u', priority: 1 }, '2025-01-01T00:00:00Z')
    tdb.repositories.queue.create({ id: 'c', url: 'u', priority: 1 }, '2025-01-01T00:00:00Z')
    tdb.repositories.queue.updateStatus('a', 'downloading')
    tdb.repositories.queue.updateStatus('b', 'completed', '2025-01-02T00:00:00Z')
    tdb.repositories.queue.updateStatusWithError('c', 'error', 'boom')
    const stats = tdb.repositories.queue.countStats()
    expect(stats.total).toBe(3)
    expect(stats.downloading).toBe(1)
    expect(stats.waiting).toBe(0)
    expect(stats.completed).toBe(1)
    expect(stats.failed).toBe(1)
  })

  it('deleteByIds only removes listed ids', () => {
    tdb.repositories.queue.create({ id: 'a', url: 'u', priority: 1 }, '2025-01-01T00:00:00Z')
    tdb.repositories.queue.create({ id: 'b', url: 'u', priority: 1 }, '2025-01-01T00:00:00Z')
    expect(tdb.repositories.queue.deleteByIds(['a'])).toBe(1)
    expect(tdb.repositories.queue.findById('a')).toBeNull()
    expect(tdb.repositories.queue.findById('b')).not.toBeNull()
  })
})
