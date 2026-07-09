// Shared utility functions — used by both renderer components and their tests.
// Extracted to eliminate duplication and enable clean imports.

// ── Speed parsing ────────────────────────────────────────────────────

/**
 * Parse a download speed string like "5.2 MiB/s" into a numeric MB/s value.
 * Returns 0 for undefined, empty, or unrecognized formats.
 */
export function parseSpeed(speed?: string): number {
  if (!speed) return 0
  const match = speed.match(/^([\d.]+)\s*([KMGT]?i?B\/s|B\/s)/i)
  if (!match) return 0
  const value = parseFloat(match[1])
  const unit = match[2].toUpperCase()
  const multipliers: Record<string, number> = {
    'B/S': 1 / (1024 * 1024),
    'KB/S': 1 / 1024,
    'KIB/S': 1 / 1024,
    'MB/S': 1,
    'MIB/S': 1,
    'GB/S': 1024,
    'GIB/S': 1024,
    'TB/S': 1024 * 1024,
    'TIB/S': 1024 * 1024,
  }
  return value * (multipliers[unit] ?? 1)
}

// ── Error classification ─────────────────────────────────────────────

export type ErrorCategory =
  | 'network'
  | 'format'
  | 'ffmpeg'
  | 'permissions'
  | 'auth'
  | 'geo'
  | 'rate_limit'
  | 'extractor'
  | 'disk'
  | 'unknown'

export interface ErrorClassification {
  category: ErrorCategory
  label: string
  description: string
  suggestion: string
  fixAction?: string
}

const CATEGORY_PATTERNS: { pattern: RegExp; category: ErrorCategory }[] = [
  {
    pattern:
      /(?:unable to download|network is unreachable|connection (?:timed out|refused|reset)|getaddrinfo|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|name resolution|no address associated)/i,
    category: 'network',
  },
  {
    pattern:
      /(?:requested format|format.*not available|no video formats|no audio formats|no format.*found|incomplete format)/i,
    category: 'format',
  },
  {
    pattern: /(?:ffmpeg|ffprobe|postprocessing|merging|embedding|conversion.*fail|transcode)/i,
    category: 'ffmpeg',
  },
  {
    pattern:
      /(?:permission denied|access denied|EACCES|EPERM|read-only|not writable|cannot (?:create|write|open) (?:file|directory))/i,
    category: 'permissions',
  },
  {
    pattern:
      /(?:login|sign in|cookie.*(?:expired|invalid)|authentication|unauthorized|age.?restrict|members.?only|private video)/i,
    category: 'auth',
  },
  {
    pattern:
      /(?:geo.?restrict|not available in your country|region.*block|country.*block|geo.?block)/i,
    category: 'geo',
  },
  {
    pattern: /(?:too many requests|rate.?limit|429|throttl|captcha|robot.*check|try again later)/i,
    category: 'rate_limit',
  },
  {
    pattern:
      /(?:extractor|unsupported url|no extractor|cannot parse|cannot extract|extraction.*fail)/i,
    category: 'extractor',
  },
  {
    pattern:
      /(?:disk.*(?:full|space)|no space left|ENOSPC|quota.*exceed|insufficient.*(?:space|storage))/i,
    category: 'disk',
  },
]

const CATEGORY_LABEL: Record<ErrorCategory, string> = {
  network: 'Network Error',
  format: 'Format Unavailable',
  ffmpeg: 'FFmpeg Processing Error',
  permissions: 'Permission Denied',
  auth: 'Authentication Required',
  geo: 'Geo-Restricted Content',
  rate_limit: 'Rate Limited',
  extractor: 'Extraction Error',
  disk: 'Disk Full',
  unknown: 'Unexpected Error',
}

const CATEGORY_DESCRIPTION: Record<ErrorCategory, string> = {
  network: 'Your connection to the server was interrupted or could not be established.',
  format: 'The requested video/audio format is not available for this content.',
  ffmpeg: 'Media post-processing (merging, conversion, or embedding) failed.',
  permissions: 'The app cannot write to the download directory.',
  auth: 'This content requires login, cookies, or is age-restricted.',
  geo: 'This content is not available in your region.',
  rate_limit:
    'The server is temporarily blocking requests — you may be downloading too fast or too frequently.',
  extractor:
    "yt-dlp couldn't process this URL — the site may have changed or the URL may be invalid.",
  disk: 'There is not enough free space on the drive to complete this download.',
  unknown: 'An unexpected error occurred during the download.',
}

const CATEGORY_SUGGESTION: Record<ErrorCategory, string> = {
  network: 'Check your internet connection, try again in a moment, or try a different network.',
  format:
    'Try selecting a different format or using "Best Quality" which auto-selects the optimal format.',
  ffmpeg:
    'Check that FFmpeg is installed and accessible. Go to Settings → Advanced to verify the FFmpeg path.',
  permissions:
    'Choose a different download folder in Settings, or ensure the current folder has write permissions.',
  auth: 'Open Advanced Options and provide a cookies file, browser cookies, or login credentials for the site.',
  geo: 'Use a VPN or configure a proxy in Advanced Options → Network.',
  rate_limit:
    'Wait a few minutes and try again. Reduce concurrent downloads or add a speed limit in Settings.',
  extractor:
    'Verify the URL works in a browser. Update yt-dlp (Settings → Advanced → Update yt-dlp) for the latest site support.',
  disk: 'Free up disk space or change the download directory to a drive with more available space.',
  unknown: 'Try retrying the download. If the issue persists, check the log or update yt-dlp.',
}

const CATEGORY_FIX_ACTION: Record<ErrorCategory, string | undefined> = {
  network: 'Retry',
  format: 'Change Format',
  ffmpeg: 'Check FFmpeg',
  permissions: 'Change Folder',
  auth: 'Add Auth',
  geo: 'Set Proxy',
  rate_limit: 'Wait & Retry',
  extractor: 'Update yt-dlp',
  disk: 'Free Up Space',
  unknown: 'Retry',
}

/**
 * Classify a download error message into a known category with
 * human-readable label, description, suggestion, and fix action.
 */
export function classifyError(errorMessage: string): ErrorClassification {
  for (const { pattern, category } of CATEGORY_PATTERNS) {
    if (pattern.test(errorMessage)) {
      return {
        category,
        label: CATEGORY_LABEL[category],
        description: CATEGORY_DESCRIPTION[category],
        suggestion: CATEGORY_SUGGESTION[category],
        fixAction: CATEGORY_FIX_ACTION[category],
      }
    }
  }
  return {
    category: 'unknown',
    label: CATEGORY_LABEL.unknown,
    description: CATEGORY_DESCRIPTION.unknown,
    suggestion: CATEGORY_SUGGESTION.unknown,
    fixAction: CATEGORY_FIX_ACTION.unknown,
  }
}
