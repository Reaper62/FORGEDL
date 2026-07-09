// SettingsRepository — key/value settings persisted as JSON strings in
// the `settings` table. Validation lives in the service that wraps this.
import { BaseRepository } from './BaseRepository'

export class SettingsRepository extends BaseRepository {
  private readonly stmts = {
    selectAll: this.db.prepare(`SELECT key, value FROM settings`),
    selectByKey: this.db.prepare(`SELECT value FROM settings WHERE key = ?`),
    upsert: this.db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `),
    deleteKey: this.db.prepare(`DELETE FROM settings WHERE key = ?`),
    deleteAll: this.db.prepare(`DELETE FROM settings`),
  }

  loadAll(): Record<string, unknown> {
    const rows = this.stmts.selectAll.all() as {
      key: string
      value: string
    }[]
    const out: Record<string, unknown> = {}
    for (const { key, value } of rows) {
      try {
        out[key] = JSON.parse(value)
      } catch {
        out[key] = value
      }
    }
    return out
  }

  /** Replaces all settings atomically from a plain-object map. */
  replaceAll(values: Record<string, unknown>): void {
    const runner = this.db.transaction(() => {
      this.stmts.deleteAll.run()
      for (const [key, value] of Object.entries(values)) {
        this.stmts.upsert.run(key, JSON.stringify(value))
      }
    })
    runner()
  }

  /** Patches a subset of keys atomically. */
  patch(values: Record<string, unknown>): void {
    const runner = this.db.transaction(() => {
      for (const [key, value] of Object.entries(values)) {
        this.stmts.upsert.run(key, JSON.stringify(value))
      }
    })
    runner()
  }

  reset(): void {
    this.stmts.deleteAll.run()
  }

  /** Read a single JSON value by key. Returns null if not found. */
  getJson<T = unknown>(key: string): T | null {
    const row = this.stmts.selectByKey.get(key) as { value: string } | undefined
    if (!row) return null
    try {
      return JSON.parse(row.value) as T
    } catch {
      return null
    }
  }

  /** Store a JSON value under a single key. */
  setJson(key: string, value: unknown): void {
    this.stmts.upsert.run(key, JSON.stringify(value))
  }
}
