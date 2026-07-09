import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { makeTestDb, type TestDb } from './__fixtures__'

describe('SettingsRepository', () => {
  let tdb: TestDb
  beforeEach(() => {
    tdb = makeTestDb()
  })
  afterEach(() => {
    tdb.close()
  })

  it('loadAll returns empty object when no rows', () => {
    expect(tdb.repositories.settings.loadAll()).toEqual({})
  })

  it('loadAll decodes JSON values', () => {
    tdb.repositories.settings.replaceAll({
      downloadPath: '/tmp/d',
      maxConcurrent: 4,
      extractAudio: true,
    })
    const out = tdb.repositories.settings.loadAll()
    expect(out).toEqual({
      downloadPath: '/tmp/d',
      maxConcurrent: 4,
      extractAudio: true,
    })
  })

  it('patch merges only the provided keys', () => {
    tdb.repositories.settings.replaceAll({ maxConcurrent: 3, extractAudio: false })
    tdb.repositories.settings.patch({ maxConcurrent: 8 })
    const out = tdb.repositories.settings.loadAll()
    expect(out.maxConcurrent).toBe(8)
    expect(out.extractAudio).toBe(false)
  })

  it('reset clears all keys', () => {
    tdb.repositories.settings.replaceAll({ foo: 1 })
    tdb.repositories.settings.reset()
    expect(tdb.repositories.settings.loadAll()).toEqual({})
  })

  it('replaceAll is atomic — no half-state visible', () => {
    tdb.repositories.settings.patch({ a: 1 })
    tdb.repositories.settings.replaceAll({ b: 2 })
    const out = tdb.repositories.settings.loadAll()
    expect(out).toEqual({ b: 2 })
  })
})
