// CommandBuilder — capability-aware yt-dlp argument construction.
//
// Responsibilities:
//   - Detect extractor type from URL and apply site-specific rules
//   - Resolve mutually exclusive flags deterministically
//   - Validate argument combinations BEFORE process spawn
//
// Non-responsibilities:
//   - Subprocess management (DownloadRuntime)
//   - Persistence (repos only)
//   - Settings resolution (reads from settings snapshot)
import { getSettings } from './settings-snapshot'
import { resolveDownloadDir } from './download-path'
import { getLogger } from '../logging/logger'
import type { DownloadSettings } from '../../shared/types'

// ── Extractor detection ──────────────────────────────────────────────

export type ExtractorHint = 'youtube' | 'generic'

function detectExtractor(url: string): ExtractorHint {
  const youtubePatterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\//i,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\//i,
  ]
  for (const p of youtubePatterns) {
    if (p.test(url)) return 'youtube'
  }
  return 'generic'
}

// ── Conflict matrix ──────────────────────────────────────────────────

interface ConflictRule {
  /** Groups of flags where only one may appear in the final args. */
  mutuallyExclusive: string[][]
}

const conflictRules: ConflictRule = {
  mutuallyExclusive: [
    ['--cookies', '--cookies-from-browser'],
    ['--username', '--netrc'],
  ],
}

// ── Builder error ────────────────────────────────────────────────────

export class BuildError extends Error {
  constructor(
    message: string,
    public readonly code: 'CONFLICT' | 'INVALID_COMBINATION' | 'MISSING_REQUIRED',
  ) {
    super(message)
    this.name = 'BuildError'
  }
}

// ── Builder result ───────────────────────────────────────────────────

export interface BuildResult {
  args: string[]
  warnings: string[]
  extractor: ExtractorHint
}

// ── Builder ──────────────────────────────────────────────────────────

export interface CommandBuilderInput {
  url: string
  /** Override settings per-download. Falls back to global settings. */
  overrides?: Partial<DownloadSettings>
  /** Extra flags the UI may inject (subtitles, auth, etc.). */
  extraFlags?: {
    cookiesFile?: string
    browserCookies?: string
    subtitleLangs?: string[]
    embedSubs?: boolean
    username?: string
    password?: string
    netrc?: boolean
    proxy?: string
    userAgent?: string
    referer?: string
    playlistStart?: number
    playlistEnd?: number
    noPlaylist?: boolean
    speedLimit?: string
    outputFormat?: string
  }
}

export function buildCommand(input: CommandBuilderInput): BuildResult {
  const settings = { ...getSettings(), ...input.overrides }
  const extractor = detectExtractor(input.url)
  const warnings: string[] = []
  const flags = new Map<string, string | true>()
  const ef = input.extraFlags ?? {}

  // ── 1. Core format flags ─────────────────────────────────────────

  // Per-download output format override takes precedence (used by auto-retry fallback)
  const outputFormat = ef.outputFormat ?? settings.outputFormat
  if (outputFormat) {
    flags.set('-f', outputFormat)
  }

  if (settings.extractAudio) {
    flags.set('-x', true)
    if (settings.audioFormat) {
      flags.set('--audio-format', settings.audioFormat)
    }
  }

  if (settings.embedMetadata) {
    flags.set('--embed-metadata', true)
  }

  // Per-download speed limit takes precedence over global
  const effectiveSpeedLimit = ef.speedLimit ?? settings.speedLimit
  if (effectiveSpeedLimit) {
    flags.set('-r', effectiveSpeedLimit)
  }

  // ── 2. Output path ───────────────────────────────────────────────

  // Resolve the target directory (VIDEO or AUDIO subfolder under FORGEDL).
  // This auto-creates the directory tree if it doesn't exist.
  const downloadDir = resolveDownloadDir(settings)
  const dir = downloadDir.replace(/\\/g, '/')
  const template = settings.namingTemplate || '%(title)s.%(ext)s'
  flags.set('-o', `${dir}/${template}`)

  // ── 3. Extractor-specific defaults ───────────────────────────────

  if (extractor === 'youtube') {
    // YouTube: prefer embedding metadata, don't download auto-subs by default
    if (!flags.has('--embed-metadata')) {
      flags.set('--embed-metadata', true)
    }
  }

  // ── 4. Extra flags from advanced UI ──────────────────────────────

  if (ef.speedLimit) {
    // Per-task speed limit — applied above in step 1
  }

  if (ef.cookiesFile) {
    flags.set('--cookies', ef.cookiesFile)
  }
  if (ef.browserCookies) {
    flags.set('--cookies-from-browser', ef.browserCookies)
  }
  if (ef.username) {
    flags.set('--username', ef.username)
    if (ef.password) {
      flags.set('--password', ef.password)
    }
  }
  if (ef.netrc) {
    flags.set('--netrc', true)
  }
  if (ef.subtitleLangs && ef.subtitleLangs.length > 0) {
    flags.set('--sub-langs', ef.subtitleLangs.join(','))
  }
  if (ef.embedSubs) {
    flags.set('--embed-subs', true)
  }
  if (ef.proxy) {
    flags.set('--proxy', ef.proxy)
  }
  if (ef.userAgent) {
    flags.set('--user-agent', ef.userAgent)
  }
  if (ef.referer) {
    flags.set('--referer', ef.referer)
  }
  if (ef.playlistStart !== undefined) {
    flags.set('--playlist-start', String(ef.playlistStart))
  }
  if (ef.playlistEnd !== undefined) {
    flags.set('--playlist-end', String(ef.playlistEnd))
  }
  if (ef.noPlaylist) {
    flags.set('--no-playlist', true)
  }

  // ── 5. Conflict resolution ──────────────────────────────────────

  for (const group of conflictRules.mutuallyExclusive) {
    const present = group.filter((f) => flags.has(f))
    if (present.length > 1) {
      // Deterministic resolution: --cookies beats --cookies-from-browser,
      // --username beats --netrc (explicit auth > implicit).
      const winner = resolveConflict(group, present)
      for (const flag of present) {
        if (flag !== winner) {
          flags.delete(flag)
          warnings.push(`Flag ${flag} dropped: mutually exclusive with ${winner}`)
        }
      }
    }
  }

  // ── 6. Validation ───────────────────────────────────────────────

  // Cannot have both --extract-audio and a format string that forces video
  if (flags.has('-x')) {
    const fmt = flags.get('-f')
    if (typeof fmt === 'string' && fmt.includes('+')) {
      const parts = fmt.split('+')
      const hasVideo = parts.some(
        (p) => p !== 'bestaudio' && p !== 'worstaudio' && p !== 'ba' && p !== 'wa',
      )
      if (hasVideo) {
        throw new BuildError(
          `Format '${fmt}' includes video but --extract-audio is set. Use audio-only format.`,
          'INVALID_COMBINATION',
        )
      }
    }
  }

  // --username without --password is likely a mistake
  if (flags.has('--username') && !flags.has('--password')) {
    warnings.push('--username set without --password; some sites may prompt interactively')
  }

  // ── 7. Assemble args array ──────────────────────────────────────

  const args: string[] = []
  for (const [flag, value] of flags) {
    args.push(flag)
    if (value !== true) {
      args.push(value)
    }
  }
  args.push(input.url)

  getLogger().debug(
    `CommandBuilder: extractor=${extractor} ` +
      `flags=[${args.join(', ')}] warnings=${warnings.length}`,
  )

  return { args, warnings, extractor }
}

/** Resolve which flag wins from a mutually exclusive group. */
function resolveConflict(group: string[], present: string[]): string {
  // --cookies (explicit file) beats --cookies-from-browser
  if (present.includes('--cookies') && present.includes('--cookies-from-browser')) {
    return '--cookies'
  }
  // --username (explicit auth) beats --netrc (file-based)
  if (present.includes('--netrc') && present.includes('--username')) {
    return '--username'
  }
  // Default: first in the group wins
  return present[0]
}
