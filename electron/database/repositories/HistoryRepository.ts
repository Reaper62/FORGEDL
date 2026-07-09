// HistoryRepository — the ONLY place SQL targeting `download_history` lives.
// Provides archive-from-queue, bulk operations, and selective search.
import { BaseRepository } from './BaseRepository'
import type { DownloadItem } from '../../../shared/types'
import { isDownloadStatus, toItem, type DownloadRow } from './rows'

export class HistoryRepository extends BaseRepository {
  private readonly stmts = {
    archiveOne: this.db.prepare(`
      INSERT OR IGNORE INTO download_history
        (id, url, title, status, fileSize, outputPath, error, createdAt, completedAt)
      VALUES (@id, @url, @title, @status, @fileSize, @outputPath, @error, @createdAt, @completedAt)
    `),
    findAll: this.db.prepare(`
      SELECT * FROM download_history ORDER BY archivedAt DESC LIMIT ?
    `),
    findById: this.db.prepare(`
      SELECT * FROM download_history WHERE id = ?
    `),
    deleteByIds: this.db.prepare(`
      DELETE FROM download_history WHERE id IN (SELECT value FROM json_each(?))
    `),
    deleteOlderThan: this.db.prepare(`
      DELETE FROM download_history WHERE archivedAt < ?
    `),
    countAll: this.db.prepare(`SELECT COUNT(*) as n FROM download_history`),
  }

  archive(row: DownloadRow): void {
    this.stmts.archiveOne.run({
      id: row.id,
      url: row.url,
      title: row.title ?? null,
      status: isDownloadStatus(row.status) ? row.status : 'completed',
      fileSize: row.fileSize ?? null,
      outputPath: row.outputPath ?? null,
      error: row.error ?? null,
      createdAt: row.createdAt,
      completedAt: row.completedAt ?? null,
    })
  }

  archiveBatch(rows: DownloadRow[]): void {
    for (const r of rows) this.archive(r)
  }

  findAll(limit = 500): DownloadItem[] {
    const rows = this.stmts.findAll.all(limit) as DownloadRow[]
    return rows.map(toItem)
  }

  findById(id: string): DownloadItem | null {
    const row = this.stmts.findById.get(id) as DownloadRow | undefined
    return row ? toItem(row) : null
  }

  deleteByIds(ids: string[]): number {
    if (ids.length === 0) return 0
    return this.stmts.deleteByIds.run(JSON.stringify(ids)).changes
  }

  deleteOlderThan(isoDate: string): number {
    return this.stmts.deleteOlderThan.run(isoDate).changes
  }

  count(): number {
    const row = this.stmts.countAll.get() as { n: number }
    return row?.n ?? 0
  }
}
