// Download path resolution — determines where videos and audio go based
// on settings and auto-creates missing directories.
//
// Default (no downloadPath set): ~/Downloads/FORGEDL/{VIDEO,AUDIO}/
// Custom (downloadPath set):     <custom>/FORGEDL/{VIDEO,AUDIO}/
//
// Video downloads go to the VIDEO subfolder. Audio-only downloads
// (extractAudio = true) go to the AUDIO subfolder.
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { getLogger } from '../logging/logger'
import type { DownloadSettings } from '../../shared/types'

const FORGEDL_DIR = 'FORGEDL'
const VIDEO_DIR = 'VIDEO'
const AUDIO_DIR = 'AUDIO'

/**
 * Override the default Downloads base. Call from main.ts during bootstrap
 * with app.getPath('downloads') for correct localization.
 */
let downloadBasePath: string | null = null

export function setDownloadBasePath(basePath: string): void {
  downloadBasePath = basePath
}

function defaultDownloadsDir(): string {
  // Prefer Electron's localized Downloads path if set, otherwise fall back
  // to os.homedir() + 'Downloads' (works for English systems).
  if (downloadBasePath) return downloadBasePath
  return path.join(os.homedir(), 'Downloads')
}

const AUDIO_ONLY_FORMATS = ['bestaudio', 'worstaudio', 'ba', 'wa']

/**
 * Returns true if the download should go to the AUDIO folder.
 * Checks both extractAudio setting and audio-only format strings.
 */
function isAudioDownload(settings: DownloadSettings): boolean {
  if (settings.extractAudio) return true
  const fmt = settings.outputFormat || ''
  // If the format is explicitly audio-only, route to AUDIO even without
  // the extract-audio checkbox (e.g. user picks "Audio Only" preset).
  return AUDIO_ONLY_FORMATS.includes(fmt)
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    getLogger().info(`Created directory: ${dir}`)
  }
}

/**
 * Resolve the base FORGEDL directory.
 * - If downloadPath is empty: uses ~/Downloads/FORGEDL
 * - If downloadPath is set: uses <downloadPath>/FORGEDL
 */
export function resolveForgedlBase(downloadPath: string): string {
  if (!downloadPath) {
    return path.join(defaultDownloadsDir(), FORGEDL_DIR)
  }
  // If the user chose a custom folder, nest FORGEDL inside it so the
  // VIDEO/AUDIO structure is always maintained.
  return path.join(downloadPath, FORGEDL_DIR)
}

/**
 * Resolve the target download directory for the current settings context.
 * Auto-creates the directory tree if it doesn't exist.
 *
 * Returns an absolute path to either:
 *   <base>/FORGEDL/VIDEO  (video downloads)
 *   <base>/FORGEDL/AUDIO  (audio-only downloads)
 */
export function resolveDownloadDir(settings: DownloadSettings): string {
  const base = resolveForgedlBase(settings.downloadPath)
  const sub = isAudioDownload(settings) ? AUDIO_DIR : VIDEO_DIR
  const target = path.join(base, sub)

  // Auto-create both the base FORGEDL dir and the subfolder (VIDEO/AUDIO)
  ensureDir(target)

  return target
}
