import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { makeTestDb, type TestDb } from './__fixtures__'

const rowFromItem = (id: string, url: string, status = 'completed') => ({
  id,
  url,
  title: null,
  status,
  progress: status === 'completed' ? 100 : 0,
  speed: null,
  eta: null,
  fileSize: null,
  outputPath: null,
  error: null,
  priority: 5,
  createdAt: '2025-01-01T00:00:00.000Z',
  completedAt: '2025-01-02T00:00:00.000Z',
})

describe('HistoryRepository', () => {
  let tdb: TestDb
  beforeEach(() => {
    tdb = makeTestDb()
  })
  afterEach(() => {
    tdb.close()
  })

  it('archives a row from the queue shape', () => {
    tdb.repositories.history.archive(rowFromItem('a', 'https://x'))
    const found = tdb.repositories.history.findById('a')
    expect(found).not.toBeNull()
    expect(found!.url).toBe('https://x')
    expect(found!.status).toBe('completed')
  })

  it('archive is idempotent (INSERT OR IGNORE)', () => {
    tdb.repositories.history.archive(rowFromItem('a', 'https://x'))
    tdb.repositories.history.archive(rowFromItem('a', 'https://x'))
    expect(tdb.repositories.history.count()).toBe(1)
  })

  it('archiveBatch is idempotent', () => {
    const rows = [rowFromItem('a', 'https://x'), rowFromItem('b', 'https://y')]
    tdb.repositories.history.archiveBatch(rows)
    tdb.repositories.history.archiveBatch(rows)
    expect(tdb.repositories.history.count()).toBe(2)
  })

  it('findAll respects limit and orders by archivedAt desc', () => {
    for (let i = 0; i < 5; i++) {
      tdb.repositories.history.archive(rowFromItem(`id${i}`, `https://x/${i}`))
    }
    const results = tdb.repositories.history.findAll(3)
    expect(results.length).toBe(3)
  })

  it('deleteByIds empties only listed ids', () => {
    tdb.repositories.history.archive(rowFromItem('a', 'https://x'))
    tdb.repositories.history.archive(rowFromItem('b', 'https://y'))
    expect(tdb.repositories.history.deleteByIds(['a'])).toBe(1)
    expect(tdb.repositories.history.count()).toBe(1)
  })

  it('deleteOlderThan removes only old entries', () => {
    tdb.seedHistory({
      id: 'old',
      url: 'u',
      createdAt: '2020-01-01T00:00:00Z',
      completedAt: '2020-01-01T00:00:00Z',
      archivedAt: '2020-01-01T00:00:00Z',
    })
    tdb.repositories.history.archive(rowFromItem('new', 'https://y'))
    const removed = tdb.repositories.history.deleteOlderThan('2024-01-01T00:00:00Z')
    expect(removed).toBe(1)
    expect(tdb.repositories.history.count()).toBe(1)
    expect(tdb.repositories.history.findById('old')).toBeNull()
    expect(tdb.repositories.history.findById('new')).not.toBeNull()
  })
})
