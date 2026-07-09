// Shared test fixture: build a fresh in-memory SQLite, run migrations,
// return a typed Repositories object the test can use.
import Database from 'better-sqlite3'
import { runMigrations } from '../migrations'
import { buildRepositories, type Repositories } from './index'

export interface TestDb {
  db: Database.Database
  repositories: Repositories
  close: () => void
  seedHistory(row: {
    id: string
    url: string
    title?: string | null
    status?: string
    fileSize?: string | null
    outputPath?: string | null
    error?: string | null
    createdAt: string
    completedAt?: string | null
    archivedAt: string
  }): void
}

export function makeTestDb(): TestDb {
  const db = new Database(':memory:')
  db.pragma('journal_mode = MEMORY')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')
  runMigrations(db)

  const seedStmt = db.prepare(
    `INSERT INTO download_history
       (id, url, title, status, fileSize, outputPath, error, createdAt, completedAt, archivedAt)
     VALUES (@id, @url, @title, @status, @fileSize, @outputPath, @error, @createdAt, @completedAt, @archivedAt)`,
  )

  return {
    db,
    repositories: buildRepositories(db),
    close: () => db.close(),
    seedHistory: (row) =>
      seedStmt.run({
        id: row.id,
        url: row.url,
        title: row.title ?? null,
        status: row.status ?? 'completed',
        fileSize: row.fileSize ?? null,
        outputPath: row.outputPath ?? null,
        error: row.error ?? null,
        createdAt: row.createdAt,
        completedAt: row.completedAt ?? null,
        archivedAt: row.archivedAt,
      }),
  }
}
