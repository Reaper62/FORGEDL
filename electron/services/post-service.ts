// PostService — Power-On Self-Test that checks all critical runtime
// resources in parallel and returns a diagnostic report for the UI.
import { execFileSync, spawnSync } from 'node:child_process'
import * as fs from 'node:fs'
import { join } from 'node:path'
import type { PostCheckResult, PostResults } from '../../shared/types'
import { resolveYtDlpPath, resolveFfmpegPath } from './runtime-info'
import { resolveForgedlBase } from './download-path'
import { getSettings } from './settings-snapshot'
import { getDatabase } from '../database/connection'
import { getLogger } from '../logging/logger'

const CHECK_TIMEOUT_MS = 8_000
const DOWNLOAD_TIMEOUT_MS = 15_000
const INTERNET_CHECK_URLS = [
  'https://www.google.com/generate_204',
  'https://cloudflare.com/cdn-cgi/trace',
]

// ── Individual checks ────────────────────────────────────────────────

/** If binaryExists is explicitly false, short-circuit without calling execFileSync. */
async function checkYtDlp(binaryExists?: boolean): Promise<PostCheckResult> {
  const start = Date.now()
  try {
    const ytdlp = resolveYtDlpPath()
    const exists = binaryExists ?? fs.existsSync(ytdlp)
    if (!exists) {
      return {
        name: 'yt-dlp',
        label: 'yt-dlp CLI',
        status: 'fail',
        message: 'yt-dlp executable not found',
        detail: `Looked at: ${ytdlp}. Install yt-dlp or configure the path in Settings.`,
        durationMs: Date.now() - start,
      }
    }
    // Version check to confirm the binary works
    const out = execFileSync(ytdlp, ['--version'], {
      encoding: 'utf-8',
      timeout: CHECK_TIMEOUT_MS,
    })
    const version = out.trim()
    return {
      name: 'yt-dlp',
      label: 'yt-dlp CLI',
      status: version ? 'pass' : 'warning',
      message: version ? `yt-dlp ${version}` : 'yt-dlp responded but version unknown',
      detail: `Path: ${ytdlp}`,
      durationMs: Date.now() - start,
    }
  } catch (e) {
    const msg = (e as Error).message
    getLogger().warn(`POST yt-dlp check failed: ${msg}`)
    return {
      name: 'yt-dlp',
      label: 'yt-dlp CLI',
      status: 'fail',
      message: 'yt-dlp check failed',
      detail: msg,
      durationMs: Date.now() - start,
    }
  }
}

/** If binaryExists is explicitly false, short-circuit without calling execFileSync. */
async function checkFfmpeg(binaryExists?: boolean): Promise<PostCheckResult> {
  const start = Date.now()
  try {
    const ffmpeg = resolveFfmpegPath()
    const exists = binaryExists ?? fs.existsSync(ffmpeg)
    if (!exists) {
      return {
        name: 'ffmpeg',
        label: 'FFmpeg',
        status: 'fail',
        message: 'FFmpeg executable not found',
        detail: `Looked at: ${ffmpeg}. Install FFmpeg or configure the path in Settings.`,
        durationMs: Date.now() - start,
      }
    }
    // ffmpeg outputs version info to stderr by convention
    const result = spawnSync(ffmpeg, ['-version'], {
      encoding: 'utf-8',
      timeout: CHECK_TIMEOUT_MS,
    })
    const output = (result.stderr || result.stdout || '').trim()
    const firstLine = output.split('\n')[0] ?? ''
    const version = firstLine.replace(/^ffmpeg version\s+/, '').split(' ')[0]
    return {
      name: 'ffmpeg',
      label: 'FFmpeg',
      status: version ? 'pass' : 'warning',
      message: version ? `FFmpeg ${version}` : 'FFmpeg responded but version unknown',
      detail: `Path: ${ffmpeg}`,
      durationMs: Date.now() - start,
    }
  } catch (e) {
    const msg = (e as Error).message
    getLogger().warn(`POST ffmpeg check failed: ${msg}`)
    return {
      name: 'ffmpeg',
      label: 'FFmpeg',
      status: 'fail',
      message: 'FFmpeg check failed',
      detail: msg,
      durationMs: Date.now() - start,
    }
  }
}

async function checkInternet(): Promise<PostCheckResult> {
  const start = Date.now()
  for (const url of INTERNET_CHECK_URLS) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS)
      const res = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (res.ok || res.status === 204) {
        return {
          name: 'internet',
          label: 'Internet Connection',
          status: 'pass',
          message: 'Connected',
          detail: `Reached ${url}`,
          durationMs: Date.now() - start,
        }
      }
    } catch {
      // Try next URL
      continue
    }
  }
  return {
    name: 'internet',
    label: 'Internet Connection',
    status: 'fail',
    message: 'No internet connection detected',
    detail: 'Check your network connection. Downloads require internet access.',
    durationMs: Date.now() - start,
  }
}

async function checkDiskSpace(): Promise<PostCheckResult> {
  const start = Date.now()
  try {
    const downloadPath = resolveForgedlBase(getSettings().downloadPath)
    // Ensure directory exists for stat check
    if (!fs.existsSync(downloadPath)) {
      try {
        fs.mkdirSync(downloadPath, { recursive: true })
      } catch {
        return {
          name: 'disk-space',
          label: 'Disk Space',
          status: 'fail',
          message: 'Cannot create download directory',
          detail: `Path: ${downloadPath}`,
          durationMs: Date.now() - start,
        }
      }
    }

    // Try to get actual free disk space via statfsSync (available on Node 18.15+)
    let freeGB = 0
    let totalGB = 0
    try {
      const fsAny = fs as typeof fs & {
        statfsSync?: (p: string) => { bsize: number; bfree: number; blocks: number }
      }
      if (typeof fsAny.statfsSync === 'function') {
        const stat = fsAny.statfsSync(downloadPath)
        if (
          stat &&
          typeof stat.bsize === 'number' &&
          typeof stat.bfree === 'number' &&
          typeof stat.blocks === 'number'
        ) {
          freeGB = (stat.bsize * stat.bfree) / (1024 * 1024 * 1024)
          totalGB = (stat.bsize * stat.blocks) / (1024 * 1024 * 1024)
        }
      }
    } catch {
      // statfsSync not available — skip disk space measurement
    }

    // Warn if disk space is critically low (< 500 MB free)
    if (freeGB > 0 && totalGB > 0 && freeGB < 0.5) {
      return {
        name: 'disk-space',
        label: 'Disk Space',
        status: 'warning',
        message: `Low disk space: ${freeGB.toFixed(1)} GB free of ${totalGB.toFixed(1)} GB`,
        detail: `Path: ${downloadPath}`,
        durationMs: Date.now() - start,
      }
    }

    if (freeGB > 0 && totalGB > 0) {
      return {
        name: 'disk-space',
        label: 'Disk Space',
        status: 'pass',
        message: `${freeGB.toFixed(1)} GB free of ${totalGB.toFixed(1)} GB`,
        detail: `Path: ${downloadPath}`,
        durationMs: Date.now() - start,
      }
    }

    return {
      name: 'disk-space',
      label: 'Disk Space',
      status: 'warning',
      message: 'Could not measure disk space',
      detail: `Directory exists at: ${downloadPath}. statfsSync not available on this platform.`,
      durationMs: Date.now() - start,
    }
  } catch (e) {
    const msg = (e as Error).message
    getLogger().warn(`POST disk-space check failed: ${msg}`)
    return {
      name: 'disk-space',
      label: 'Disk Space',
      status: 'fail',
      message: 'Disk space check failed',
      detail: msg,
      durationMs: Date.now() - start,
    }
  }
}

async function checkWritePermission(): Promise<PostCheckResult> {
  const start = Date.now()
  try {
    const downloadPath = resolveForgedlBase(getSettings().downloadPath)
    try {
      fs.mkdirSync(downloadPath, { recursive: true })
    } catch {
      // Directory creation failed — permission issue
    }
    const testFile = join(downloadPath, '.forgedl-post-perm-test')
    fs.writeFileSync(testFile, 'test')
    fs.unlinkSync(testFile)
    return {
      name: 'write-permission',
      label: 'Write Permission',
      status: 'pass',
      message: 'Download directory is writable',
      detail: `Path: ${downloadPath}`,
      durationMs: Date.now() - start,
    }
  } catch (e) {
    const msg = (e as Error).message
    getLogger().warn(`POST write-permission check failed: ${msg}`)
    return {
      name: 'write-permission',
      label: 'Write Permission',
      status: 'fail',
      message: 'Cannot write to download directory',
      detail: msg,
      durationMs: Date.now() - start,
    }
  }
}

async function checkDatabase(): Promise<PostCheckResult> {
  const start = Date.now()
  try {
    const db = getDatabase()
    // Run a quick integrity check
    const result = db.pragma('integrity_check') as Array<{ integrity_check: string }>
    const healthy = result.length === 1 && result[0].integrity_check === 'ok'
    if (healthy) {
      return {
        name: 'database',
        label: 'Database',
        status: 'pass',
        message: 'Database integrity OK',
        detail: undefined,
        durationMs: Date.now() - start,
      }
    }
    return {
      name: 'database',
      label: 'Database',
      status: 'fail',
      message: 'Database integrity check failed',
      detail: result.map((r) => r.integrity_check).join('; '),
      durationMs: Date.now() - start,
    }
  } catch (e) {
    const msg = (e as Error).message
    getLogger().warn(`POST database check failed: ${msg}`)
    return {
      name: 'database',
      label: 'Database',
      status: 'fail',
      message: 'Database check failed',
      detail: msg,
      durationMs: Date.now() - start,
    }
  }
}

/** If ytDlpExists is explicitly false, short-circuit without spawning yt-dlp. */
async function checkExtractors(ytDlpExists?: boolean): Promise<PostCheckResult> {
  const start = Date.now()
  try {
    const ytdlp = resolveYtDlpPath()
    const exists = ytDlpExists ?? fs.existsSync(ytdlp)
    if (!exists) {
      return {
        name: 'extractors',
        label: 'Site Extractors',
        status: 'fail',
        message: 'Extractor check skipped — yt-dlp not found',
        detail: `Looked at: ${ytdlp}. Install yt-dlp or configure the path in Settings.`,
        durationMs: Date.now() - start,
      }
    }
    const out = execFileSync(ytdlp, ['--list-extractors'], {
      encoding: 'utf-8',
      timeout: CHECK_TIMEOUT_MS,
    })
    const count = out.trim().split('\n').filter(Boolean).length
    if (count > 0) {
      return {
        name: 'extractors',
        label: 'Site Extractors',
        status: 'pass',
        message: `${count} extractors available`,
        detail: `Path: ${ytdlp}`,
        durationMs: Date.now() - start,
      }
    }
    return {
      name: 'extractors',
      label: 'Site Extractors',
      status: 'fail',
      message: 'No extractors found — yt-dlp may be damaged',
      detail: 'yt-dlp --list-extractors returned empty output. Try reinstalling yt-dlp.',
      durationMs: Date.now() - start,
    }
  } catch (e) {
    const msg = (e as Error).message
    getLogger().warn(`POST extractors check failed: ${msg}`)
    return {
      name: 'extractors',
      label: 'Site Extractors',
      status: 'fail',
      message: 'Extractor check failed',
      detail: msg,
      durationMs: Date.now() - start,
    }
  }
}

/**
 * End-to-end download test — downloads a tiny known video to confirm
 * the full yt-dlp pipeline works (network → extractor → download → merge).
 *
 * If ytDlpExists is explicitly false, short-circuits without spawning yt-dlp.
 * Always cleans up the temp download directory in a finally block.
 */
async function checkDownloadTest(ytDlpExists?: boolean): Promise<PostCheckResult> {
  const start = Date.now()
  const downloadPath = resolveForgedlBase(getSettings().downloadPath)
  const tempDir = join(downloadPath, '.forgedl-post-dl-test')

  try {
    const ytdlp = resolveYtDlpPath()
    const exists = ytDlpExists ?? fs.existsSync(ytdlp)
    if (!exists) {
      return {
        name: 'download-test',
        label: 'Download Test',
        status: 'fail',
        message: 'Download test skipped — yt-dlp not found',
        detail: `Looked at: ${ytdlp}. Install yt-dlp or configure the path in Settings.`,
        durationMs: Date.now() - start,
      }
    }

    // Use canonical yt-dlp test video (10 seconds, permanent fixture)
    const testUrl = 'https://youtu.be/BaW_jenozKc'
    execFileSync(
      ytdlp,
      [
        '-f',
        'worst', // smallest possible quality
        '--max-filesize',
        '2M', // safety cap
        '--no-playlist',
        '-o',
        join(tempDir, 'test.%(ext)s'),
        testUrl,
      ],
      {
        encoding: 'utf-8',
        timeout: DOWNLOAD_TIMEOUT_MS,
      },
    )

    return {
      name: 'download-test',
      label: 'Download Test',
      status: 'pass',
      message: 'End-to-end download succeeded',
      detail: `Downloaded ${testUrl} successfully.`,
      durationMs: Date.now() - start,
    }
  } catch (e) {
    const msg = (e as Error).message
    getLogger().warn(`POST download-test check failed: ${msg}`)
    return {
      name: 'download-test',
      label: 'Download Test',
      status: 'fail',
      message: 'Download test failed',
      detail: msg,
      durationMs: Date.now() - start,
    }
  } finally {
    // Always clean up temp files — never leave debris behind
    try {
      fs.rmSync(tempDir, { recursive: true, force: true })
    } catch {
      // Best-effort cleanup; ignore errors
    }
  }
}

// ── Orchestrator ─────────────────────────────────────────────────────

/**
 * Two-phase Power-On Self-Test.
 *
 * Phase 1 (pre-scan): Quick synchronous binary existence checks so
 *   the slow execFileSync calls are skipped entirely for missing
 *   binaries — saving ~2-4 seconds when yt-dlp is absent.
 *
 * Phase 2: Run all 7 checks in parallel. The yt-dlp, ffmpeg, and
 *   extractors checks receive the pre-scan result and short-circuit
 *   immediately if the binary is missing.
 */
export async function runPost(): Promise<PostResults> {
  const start = Date.now()
  getLogger().info('POST starting...')

  // ── Phase 1: Quick pre-scan (binary existence only) ───────────
  let ytDlpFound = false
  let ffmpegFound = false
  try {
    ytDlpFound = fs.existsSync(resolveYtDlpPath())
  } catch {
    /* ignore */
  }
  try {
    ffmpegFound = fs.existsSync(resolveFfmpegPath())
  } catch {
    /* ignore */
  }

  // ── Phase 2: Run all checks in parallel ───────────────────────
  // Binary-dependent checks receive the pre-scan result to avoid
  // redundant fs.existsSync calls and skip slow execFileSync calls
  // when the binary is missing.
  const checks: PostCheckResult[] = await Promise.all([
    checkYtDlp(ytDlpFound),
    checkFfmpeg(ffmpegFound),
    checkInternet(),
    checkDiskSpace(),
    checkWritePermission(),
    checkDatabase(),
    checkExtractors(ytDlpFound),
    checkDownloadTest(ytDlpFound),
  ])

  const allPassed = checks.every((c) => c.status === 'pass')
  const totalDurationMs = Date.now() - start

  getLogger().info(
    `POST complete in ${totalDurationMs}ms — ${allPassed ? 'all passed' : 'issues found'}`,
  )

  return { checks, allPassed, totalDurationMs }
}
