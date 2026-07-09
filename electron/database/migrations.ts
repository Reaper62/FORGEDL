// Migration system — the ONLY source of truth for schema changes.
// Append-only. Never edit a landed migration; add a new version instead.
import type Database from 'better-sqlite3'
import { getLogger } from '../logging/logger'

interface Migration {
  version: number
  name: string
  up: (db: Database.Database) => void
}

// ARCHITECTURE NOTE:
// v1 is intentionally idempotent: CREATE TABLE IF NOT EXISTS knows how to
// handle both fresh installs and existing installs that already have these
// tables from the previous inline-DDL implementation. v2 onward assumes
// fresh installs only carry forward-applied migration state.

// Forward-only schema lives here. Indexes live next to their tables.
const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS downloads (
          id TEXT PRIMARY KEY NOT NULL,
          url TEXT NOT NULL,
          title TEXT,
          status TEXT NOT NULL DEFAULT 'waiting',
          progress REAL NOT NULL DEFAULT 0,
          speed TEXT,
          eta TEXT,
          fileSize TEXT,
          outputPath TEXT,
          error TEXT,
          priority INTEGER NOT NULL DEFAULT 5,
          createdAt TEXT NOT NULL,
          completedAt TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_downloads_status ON downloads(status);
        CREATE INDEX IF NOT EXISTS idx_downloads_priority ON downloads(priority, createdAt);
        CREATE INDEX IF NOT EXISTS idx_downloads_createdAt ON downloads(createdAt);

        CREATE TABLE IF NOT EXISTS download_history (
          id TEXT PRIMARY KEY NOT NULL,
          url TEXT NOT NULL,
          title TEXT,
          status TEXT NOT NULL,
          fileSize TEXT,
          outputPath TEXT,
          error TEXT,
          createdAt TEXT NOT NULL,
          completedAt TEXT,
          archivedAt TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_history_completedAt ON download_history(completedAt);
        CREATE INDEX IF NOT EXISTS idx_history_status ON download_history(status);
        CREATE INDEX IF NOT EXISTS idx_history_archivedAt ON download_history(archivedAt);
      `)
    },
  },
  // Future migrations go here (append only, e.g. v2 add_plugin_tables, etc.)
]

export function runMigrations(db: Database.Database): void {
  // Ensure migrations table exists before we can read version.
  // CREATE TABLE IF NOT EXISTS is safe to re-run when called by bootstrap
  // or by test fixtures.
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      appliedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  const currentVersionRow = db.prepare('SELECT MAX(version) as version FROM migrations').get() as {
    version: number | null
  }
  const currentVersion = currentVersionRow?.version ?? 0

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      getLogger().info(`Applying migration ${migration.version}: ${migration.name}`)

      const apply = db.transaction(() => {
        migration.up(db)
        db.prepare('INSERT INTO migrations (version) VALUES (?)').run(migration.version)
      })

      apply()
      getLogger().info(`Migration ${migration.version} applied successfully`)
    }
  }
}

export function currentSchemaVersion(db: Database.Database): number {
  const row = db.prepare('SELECT MAX(version) as version FROM migrations').get() as {
    version: number | null
  }
  return row?.version ?? 0
}

export function integrityCheck(db: Database.Database): boolean {
  const row = db.prepare('PRAGMA integrity_check').get() as {
    integrity_check: string
  }
  return row?.integrity_check === 'ok'
}
