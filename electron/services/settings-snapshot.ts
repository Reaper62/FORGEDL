// SettingsSnapshot — synchronous, in-memory snapshot of the last-known
// settings. Decouples runtime-info (which needs settings to resolve binary
// paths) from any async SettingsService initialization. The SettingsService
// is responsible for keeping this snapshot up to date.
import type { DownloadSettings } from '../../shared/types'
import { DownloadSettingsSchema } from '../../shared/types'

let snapshot: DownloadSettings | null = null

/** Replace the snapshot atomically. */
export function setSettingsSnapshot(s: DownloadSettings): void {
  snapshot = DownloadSettingsSchema.parse(s)
}

/** Return the current snapshot. Falls back to schema defaults if unset. */
export function getSettings(): DownloadSettings {
  if (snapshot) return snapshot
  return DownloadSettingsSchema.parse({})
}

/** Mark snapshot absent (e.g. after reset to schema defaults). */
export function clearSettingsSnapshot(): void {
  snapshot = null
}
