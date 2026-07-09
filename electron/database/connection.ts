// Database connection — opens WAL-mode SQLite, sets pragmas, runs
// migrations, integrity-checks, and triggers a backup. All schema lives
// in migrations.ts. No SQL lives in this file.
import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'
import { runMigrations, integrityCheck } from './migrations'
import { writeStartupBackup } from './backup'
import { getLogger } from '../logging/logger'

let db: Database.Database | null = null
let dbFilePath: string | null = null

const DB_FILENAME = 'ytdlp.db'

export function getDbFilePath(userDataPath: string): string {
  return path.join(userDataPath, 'db', DB_FILENAME)
}

export function initDatabase(userDataPath: string): Database.Database {
  if (db) return db

  const dbDir = path.join(userDataPath, 'db')
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  dbFilePath = getDbFilePath(userDataPath)

  // Snapshot the existing file before opening it. This is safer and cheaper
  // than opening then copying, because better-sqlite3 may have open handles
  // flushing WAL on open. We do not back up if the DB does not yet exist
  // (fresh install) — the WAL file alone can be ignored.
  if (fs.existsSync(dbFilePath)) {
    try {
      writeStartupBackup(dbFilePath)
    } catch (err) {
      getLogger().warn(`Startup backup skipped: ${(err as Error).message}`)
    }
  }

  db = new Database(dbFilePath)

  // Performance + safety pragmas
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')
  db.pragma('synchronous = NORMAL')

  runMigrations(db)

  if (!integrityCheck(db)) {
    throw new Error(
      'Database integrity check failed. The database may be corrupted. ' +
        'A backup has been written next to the original file.',
    )
  }

  getLogger().info(`Database initialized at ${dbFilePath}`)
  return db
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase first.')
  }
  return db
}

export function closeDatabase(): void {
  if (db) {
    try {
      db.pragma('wal_checkpoint(TRUNCATE)')
    } catch {
      // Ignore — final checkpoint is best-effort.
    }
    db.close()
    db = null
  }
}
