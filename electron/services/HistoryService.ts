// HistoryService — read/aggregate the download_history table.
import type { DownloadItem } from '../../shared/types'
import type { HistoryRepository } from '../database/repositories/HistoryRepository'
import { err, ok, type Result } from '../../shared/result'

export interface HistoryServiceDeps {
  historyRepo: HistoryRepository
}

export class HistoryService {
  constructor(private readonly deps: HistoryServiceDeps) {}

  /** Return at most `limit` most-recent archived downloads. */
  list(limit = 500): Result<DownloadItem[]> {
    return ok(this.deps.historyRepo.findAll(limit))
  }

  findById(id: string): Result<DownloadItem | null> {
    return ok(this.deps.historyRepo.findById(id))
  }

  count(): Result<number> {
    return ok(this.deps.historyRepo.count())
  }

  deleteByIds(ids: string[]): Result<{ removed: number }> {
    if (ids.length === 0) return err('INVALID_INPUT', 'ids must be non-empty')
    return ok({ removed: this.deps.historyRepo.deleteByIds(ids) })
  }

  purgeOlderThan(days: number): Result<{ removed: number }> {
    if (days < 1) return err('INVALID_INPUT', 'days must be >= 1')
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return ok({ removed: this.deps.historyRepo.deleteOlderThan(cutoff.toISOString()) })
  }
}
