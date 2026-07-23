// Base repository with shared transaction() primitive.
// Repositories extend this to get a typed `transaction<R>(fn)` that runs
// inside a better-sqlite3 SAVEPOINT/transaction. The optional closure
// receives the same repository instance so services can compose without
// accessing the raw Database.
import type Database from 'better-sqlite3'
import { err, ok, type Result } from '../../../shared/result'

export class BaseRepository {
  constructor(protected readonly db: Database.Database) {}

}
