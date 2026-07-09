// SettingsService — schema-validated settings persistence with import/export.
import {
  DownloadSettingsSchema,
  type DownloadSettings,
  PresetSchema,
  type Preset,
} from '../../shared/types'
import { err, ok, type Result } from '../../shared/result'
import type { SettingsRepository } from '../database/repositories/SettingsRepository'
import { clearSettingsSnapshot, setSettingsSnapshot } from './settings-snapshot'
import { validateDownloadDirectory, validateExecutablePath } from '../security/path-validator'

const PRESETS_KEY = '__downloadPresets__'

export interface SettingsServiceDeps {
  settingsRepo: SettingsRepository
}

export class SettingsService {
  constructor(private readonly deps: SettingsServiceDeps) {}

  /** Read and validate. Caches result in the runtime snapshot. */
  get(): Result<DownloadSettings> {
    const raw = this.deps.settingsRepo.loadAll()
    const parsed = DownloadSettingsSchema.safeParse(raw)
    if (!parsed.success) {
      // Schema mismatch — fall back to defaults (rare; corrupt row).
      const defaults = DownloadSettingsSchema.parse({})
      setSettingsSnapshot(defaults)
      return ok(defaults)
    }
    setSettingsSnapshot(parsed.data)
    return ok(parsed.data)
  }

  /** Validate & persist a patch; reset cache on failure. */
  update(patch: Partial<DownloadSettings>): Result<void> {
    const current = DownloadSettingsSchema.parse(this.deps.settingsRepo.loadAll())
    const candidate = { ...current, ...patch }

    if (candidate.downloadPath) {
      const r = validateDownloadDirectory(candidate.downloadPath)
      candidate.downloadPath = r
    }
    if (candidate.ytdlpPath) {
      candidate.ytdlpPath = validateExecutablePath(candidate.ytdlpPath)
    }
    if (candidate.ffmpegPath) {
      candidate.ffmpegPath = validateExecutablePath(candidate.ffmpegPath)
    }

    const validated = DownloadSettingsSchema.safeParse(candidate)
    if (!validated.success) {
      return err('INVALID_INPUT', validated.error.issues[0]?.message ?? 'Invalid settings')
    }

    try {
      this.deps.settingsRepo.patch(validated.data as Record<string, unknown>)
    } catch (e) {
      return err('DB_ERROR', (e as Error).message)
    }
    setSettingsSnapshot(validated.data)
    return ok(undefined)
  }

  /** Wipe all settings; next get() returns schema defaults. */
  reset(): Result<void> {
    try {
      this.deps.settingsRepo.reset()
    } catch (e) {
      return err('DB_ERROR', (e as Error).message)
    }
    clearSettingsSnapshot()
    return ok(undefined)
  }

  /** Return the current validated settings (export convenience). */
  export(): Result<DownloadSettings> {
    return this.get()
  }

  /** Replace all settings from a (possibly partial) imported object. */
  import(data: Partial<DownloadSettings>): Result<void> {
    return this.update(data)
  }

  /** Read saved download presets. Always returns an array (empty if none). */
  getPresets(): Result<Preset[]> {
    try {
      const raw = this.deps.settingsRepo.getJson<unknown[]>(PRESETS_KEY)
      if (!Array.isArray(raw)) return ok([])
      const validated: Preset[] = []
      for (const item of raw) {
        const parsed = PresetSchema.safeParse(item)
        if (parsed.success) validated.push(parsed.data)
      }
      return ok(validated)
    } catch (e) {
      return err('DB_ERROR', (e as Error).message)
    }
  }

  /** Persist the full presets array. */
  savePresets(presets: Preset[]): Result<void> {
    try {
      // Validate every preset before saving
      for (const p of presets) PresetSchema.parse(p)
      this.deps.settingsRepo.setJson(PRESETS_KEY, presets)
      return ok(undefined)
    } catch (e) {
      return err('INVALID_INPUT', (e as Error).message)
    }
  }
}
