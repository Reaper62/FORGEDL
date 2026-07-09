// Factory that builds and exposes shared repository instances per DB.
// Components create repositories by passing in a Database instance.
// A module-level default factory wires them against the singleton DB
// from `getDatabase()` for production code; tests instantiate directly.
import type Database from 'better-sqlite3'

import { QueueRepository } from './QueueRepository'
import { HistoryRepository } from './HistoryRepository'
import { SettingsRepository } from './SettingsRepository'

export interface Repositories {
  queue: QueueRepository
  history: HistoryRepository
  settings: SettingsRepository
}

let cached: Repositories | null = null

let createDatabase: () => Database.Database | null = () => null

/** Allows the application to inject the production-time DB lazy accessor. */
export function bindDatabaseAccessor(fn: () => Database.Database | null): void {
  createDatabase = fn
  cached = null
}

export function getRepositories(): Repositories {
  if (cached) return cached
  const db = createDatabase()
  if (!db) {
    throw new Error(
      'Repositories requested before database was initialized. ' +
        'Call initDatabase() in app.whenReady() before any service.',
    )
  }
  cached = {
    queue: new QueueRepository(db),
    history: new HistoryRepository(db),
    settings: new SettingsRepository(db),
  }
  return cached
}

/** Test/Tools helper: drop the cached repository instance. */
export function resetRepositories(): void {
  cached = null
}

/** Test helper: build repositories against an arbitrary DB instance. */
export function buildRepositories(db: Database.Database): Repositories {
  return {
    queue: new QueueRepository(db),
    history: new HistoryRepository(db),
    settings: new SettingsRepository(db),
  }
}

export { QueueRepository } from './QueueRepository'
export { HistoryRepository } from './HistoryRepository'
export { SettingsRepository } from './SettingsRepository'
