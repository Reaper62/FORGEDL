// QueueRepository — the ONLY place SQL targeting the `downloads` table
// lives. All access is through typed methods that return either a row
// projection (Item) or `null`/`undefined` for "not found".
import { BaseRepository } from './BaseRepository'
import type { DownloadItem, QueueStats } from '../../../shared/types'
import { toItem, toQueueStats, type DownloadRow, type QueueStatsRow } from './rows'

export interface CreateDownloadInput {
  id: string
  url: string
  priority: number
  title?: string
}

export class QueueRepository extends BaseRepository {
  // Prepared statements are cached as instance fields so they're built
  // once on construction, not on every call.
  private readonly stmts = {
    insert: this.db.prepare(`
      INSERT INTO downloads (id, url, status, progress, priority, createdAt, title)
      VALUES (@id, @url, 'waiting', 0, @priority, @createdAt, @title)
    `),
    updateTitle: this.db.prepare(`
      UPDATE downloads SET title = ? WHERE id = ?
    `),
    updateStatus: this.db.prepare(`
      UPDATE downloads SET status = ?, completedAt = ? WHERE id = ?
    `),
    updateStatusError: this.db.prepare(`
      UPDATE downloads SET status = ?, error = ? WHERE id = ?
    `),
    updateProgress: this.db.prepare(`
      UPDATE downloads SET progress = ?, speed = ?, eta = ?, fileSize = ? WHERE id = ?
    `),
    resetForRetry: this.db.prepare(`
      UPDATE downloads
      SET status = 'waiting', progress = 0, error = NULL, completedAt = NULL
      WHERE id = ?
    `),
    resetStaleDownloading: this.db.prepare(`
      UPDATE downloads SET status = 'waiting' WHERE status = 'downloading'
    `),
    resetStaleRetrying: this.db.prepare(`
      UPDATE downloads SET status = 'waiting', error = NULL WHERE status = 'retrying'
    `),
    deleteByIds: this.db.prepare(`
      DELETE FROM downloads WHERE id IN (SELECT value FROM json_each(?))
    `),
    deleteWhereStatusIn: this.db.prepare(`
      DELETE FROM downloads WHERE status IN ('completed', 'error', 'cancelled')
    `),
    findById: this.db.prepare(`SELECT * FROM downloads WHERE id = ?`),
    findAll: this.db.prepare(`
      SELECT * FROM downloads ORDER BY createdAt DESC
    `),
    findWaitingOrdered: this.db.prepare(`
      SELECT * FROM downloads
      WHERE status = 'waiting'
      ORDER BY (
        priority +
        MIN(9, CAST(
          (julianday('now') - julianday(createdAt)) * 1440.0 / 10.0
        AS INTEGER))
      ) DESC, createdAt ASC
      LIMIT ?
    `),
    countStats: this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'downloading' THEN 1 ELSE 0 END) as downloading,
        SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) as waiting,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed
      FROM downloads
    `),
    updatePriority: this.db.prepare(`
      UPDATE downloads SET priority = ? WHERE id = ?
    `),
  }

  create(input: CreateDownloadInput, createdAt: string): void {
    this.stmts.insert.run({
      id: input.id,
      url: input.url,
      priority: input.priority,
      createdAt,
      title: input.title ?? null,
    })
  }

  updateTitle(id: string, title: string | undefined): void {
    this.stmts.updateTitle.run(title ?? null, id)
  }

  updatePriority(id: string, priority: number): void {
    this.stmts.updatePriority.run(priority, id)
  }

  updateStatus(id: string, status: string, completedAt?: string | null): void {
    this.stmts.updateStatus.run(status, completedAt ?? null, id)
  }

  updateStatusWithError(id: string, status: string, error: string): void {
    this.stmts.updateStatusError.run(status, error, id)
  }

  updateProgress(
    id: string,
    progress: number,
    speed?: string,
    eta?: string,
    fileSize?: string,
  ): void {
    this.stmts.updateProgress.run(progress, speed ?? null, eta ?? null, fileSize ?? null, id)
  }

  resetForRetry(id: string): void {
    this.stmts.resetForRetry.run(id)
  }

  resetStaleDownloading(): number {
    const r = this.stmts.resetStaleDownloading.run()
    return r.changes
  }

  resetStaleRetrying(): number {
    const r = this.stmts.resetStaleRetrying.run()
    return r.changes
  }

  deleteByIds(ids: string[]): number {
    if (ids.length === 0) return 0
    const r = this.stmts.deleteByIds.run(JSON.stringify(ids))
    return r.changes
  }

  deleteFinished(): number {
    const r = this.stmts.deleteWhereStatusIn.run()
    return r.changes
  }

  findById(id: string): DownloadItem | null {
    const row = this.stmts.findById.get(id) as DownloadRow | undefined
    return row ? toItem(row) : null
  }

  findAll(): DownloadItem[] {
    const rows = this.stmts.findAll.all() as DownloadRow[]
    return rows.map(toItem)
  }

  findWaitingOrdered(limit: number): DownloadItem[] {
    const rows = this.stmts.findWaitingOrdered.all(limit) as DownloadRow[]
    return rows.map(toItem)
  }

  countStats(): QueueStats {
    const row = this.stmts.countStats.get() as QueueStatsRow
    return toQueueStats(row)
  }
}
