// Base repository with shared transaction() primitive.
// Repositories extend this to get a typed `transaction<R>(fn)` that runs
// inside a better-sqlite3 SAVEPOINT/transaction. The optional closure
// receives the same repository instance so services can compose without
// accessing the raw Database.
import type Database from 'better-sqlite3'
import { err, ok, type Result } from '../../../shared/result'

export class BaseRepository {
  constructor(protected readonly db: Database.Database) {}

  /**
   * Runs `fn` inside a single SQLite transaction (synchronous in
   * better-sqlite3). The closure executes serially; returns whatever
   * the closure returns. Any thrown error rolls back and is converted
   * to a Result.
   */
  transaction<R>(fn: () => R): Result<R> {
    const runner = this.db.transaction(fn)
    try {
      return ok(runner())
    } catch (e) {
      return err('DB_ERROR', (e as Error).message ?? String(e))
    }
  }
}
