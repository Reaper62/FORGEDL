// Startup backup with timestamped filenames and rotation.
// Copies the database file at the start of every session. Keeps the last
// `BACKUP_RETENTION` backups; older ones are pruned.
import fs from 'node:fs'
import path from 'node:path'

const BACKUP_RETENTION = 5
const BACKUP_DIRNAME = 'backups'
const BACKUP_PATTERN = /^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})-(\d{3}Z)\.db$/

function timestampForBackup(date = new Date()): string {
  // ISO-like string that's filesystem-safe (no colons).
  const iso = date.toISOString()
  return iso.slice(0, 19).replace(/:/g, '-') + '-' + iso.slice(20, 23)
}

function backupDirFor(dbPath: string): string {
  return path.join(path.dirname(dbPath), BACKUP_DIRNAME)
}

function backupFilePath(dbPath: string, timestamp: string): string {
  return path.join(backupDirFor(dbPath), `${timestamp}.db`)
}

/**
 * Copies the database file at startup. Idempotent within the same minute
 * (timestamp precision is ms but filename second-resolution is intentional —
 * two startups in the same second overwrite). Does not back up WAL/SHM.
 */
export function writeStartupBackup(dbPath: string, now: Date = new Date()): string {
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Cannot back up non-existent file: ${dbPath}`)
  }

  const dir = backupDirFor(dbPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const ts = timestampForBackup(now)
  const target = backupFilePath(dbPath, ts)
  fs.copyFileSync(dbPath, target)

  rotateBackups(dbPath)
  return target
}

/**
 * Deletes the oldest backups beyond the retention count.
 */
export function rotateBackups(dbPath: string): void {
  const dir = backupDirFor(dbPath)
  if (!fs.existsSync(dir)) return

  const entries = fs
    .readdirSync(dir)
    .filter((name) => BACKUP_PATTERN.test(name))
    .sort() // ISO-sorted ascending — oldest first
    .reverse() // newest first

  const toDelete = entries.slice(BACKUP_RETENTION)
  for (const old of toDelete) {
    try {
      fs.unlinkSync(path.join(dir, old))
    } catch {
      // Ignore — best-effort cleanup
    }
  }
}

export function listBackups(dbPath: string): { timestamp: string; path: string }[] {
  const dir = backupDirFor(dbPath)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((name) => BACKUP_PATTERN.test(name))
    .sort()
    .reverse()
    .map((name) => ({
      timestamp: name.replace(BACKUP_PATTERN, '$1$2'),
      path: path.join(dir, name),
    }))
}
