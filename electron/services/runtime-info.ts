// RuntimeInfo — read-only process queries for yt-dlp/ffmpeg versions and
// disk checks. No spawning state, no DB access — pure utility module that
// downstream services can call without pulling in subprocess plumbing.
import { execFileSync, spawnSync } from 'node:child_process'
import { app } from 'electron'
import {
  existsSync,
  statSync,
  mkdirSync,
  writeFileSync,
  unlinkSync,
  chmodSync,
  readdirSync,
} from 'node:fs'
import { join } from 'node:path'
import os from 'node:os'
import { getLogger } from '../logging/logger'
import { validateExecutablePath } from '../security/path-validator'
import { getSettings } from './settings-snapshot'
import type { BinaryHealth } from '../../shared/types'

// ── Bundled binary path helpers ───────────────────────────────────────

/**
 * Resolve the path to a binary bundled with the app (in the bin/ dir
 * included as extraResources). Returns null if the app isn't packaged
 * (dev mode) or the binary doesn't exist.
 */
function getBundledBinPath(name: string): string | null {
  try {
    // In production (packaged): app.isPackaged === true, resources in
    // process.resourcesPath. In dev: app.isPackaged === false, app not
    // yet ready, or running via vite. In dev, look for bin/ relative to
    // app.getAppPath() or __dirname.
    if (app.isPackaged) {
      const candidate = join(process.resourcesPath, 'bin', name)
      if (existsSync(candidate)) return candidate
    }

    // Dev mode — check project root bin/
    const devCandidate = join(app.getAppPath(), 'bin', name)
    if (existsSync(devCandidate)) return devCandidate

    return null
  } catch {
    return null
  }
}

/** Resolve the bin/ directory where bundled binaries are stored. */
function getBinDir(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'bin')
  }
  return join(app.getAppPath(), 'bin')
}

// ── Path resolution ───────────────────────────────────────────────────

export function resolveYtDlpPath(): string {
  const settings = getSettings()

  // 1. User-configured path in settings (explicit override)
  if (settings.ytdlpPath) {
    getLogger().debug(`Using configured yt-dlp: ${settings.ytdlpPath}`)
    return validateExecutablePath(settings.ytdlpPath)
  }

  // 2. Bundled binary (packaged with app via extraResources)
  // Use platform-appropriate name so auto-downloads are discovered
  const bundledName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'
  const bundled = getBundledBinPath(bundledName)
  if (bundled) {
    getLogger().debug(`Using bundled yt-dlp: ${bundled}`)
    return bundled
  }

  // 3. Fallback to 'yt-dlp' on system PATH
  getLogger().debug('Using yt-dlp from system PATH')
  return validateExecutablePath('yt-dlp')
}

export function resolveFfmpegPath(): string {
  const settings = getSettings()

  // 1. User-configured path (explicit override)
  if (settings.ffmpegPath) {
    getLogger().debug(`Using configured ffmpeg: ${settings.ffmpegPath}`)
    return validateExecutablePath(settings.ffmpegPath)
  }

  // 2. Bundled binary
  const bundled = getBundledBinPath('ffmpeg.exe')
  if (bundled) {
    getLogger().debug(`Using bundled ffmpeg: ${bundled}`)
    return bundled
  }

  // 3. Fallback to 'ffmpeg' on system PATH
  getLogger().debug('Using ffmpeg from system PATH')
  return validateExecutablePath('ffmpeg')
}

// ── Version queries ───────────────────────────────────────────────────

/** Extract version from yt-dlp --version output (stdout). */
function extractYtDlpVersion(binPath: string): string {
  const out = execFileSync(binPath, ['--version'], {
    encoding: 'utf-8',
    timeout: 10_000,
  })
  return out.trim() || 'unknown'
}

/**
 * Extract version from ffmpeg -version output.
 * ffmpeg writes version info to stderr by convention (not stdout),
 * so we capture stderr via spawnSync and parse the first line.
 */
function extractFfmpegVersion(binPath: string): string {
  const result = spawnSync(binPath, ['-version'], {
    encoding: 'utf-8',
    timeout: 10_000,
  })
  // ffmpeg outputs to stderr; fall back to stdout if stderr is empty
  const output = (result.stderr || result.stdout || '').trim()
  const firstLine = output.split('\n')[0] ?? ''
  const version = firstLine.replace(/^ffmpeg version\s+/, '').split(' ')[0]
  return version || 'unknown'
}

export function getYtDlpVersion(): string {
  try {
    return extractYtDlpVersion(resolveYtDlpPath())
  } catch (e) {
    getLogger().warn(`yt-dlp version query failed: ${(e as Error).message}`)
    return 'unknown'
  }
}

export function getFfmpegVersion(): string {
  try {
    return extractFfmpegVersion(resolveFfmpegPath())
  } catch (e) {
    getLogger().warn(`ffmpeg version query failed: ${(e as Error).message}`)
    return 'unknown'
  }
}

// ── Update helpers ────────────────────────────────────────────────────

export interface YtDlpUpdateResult {
  current: string
  latest: string
  updated: boolean
  newVersion: string
}

export async function checkAndUpdateYtDlpAsync(): Promise<YtDlpUpdateResult> {
  const current = getYtDlpVersion()

  // Try to get latest version from PyPI
  let latest: string | null = null
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const res = await fetch('https://pypi.org/pypi/yt-dlp/json', {
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (res.ok) {
      const data = (await res.json()) as { info?: { version?: string } }
      latest = data?.info?.version ?? null
    }
  } catch {
    getLogger().warn('Failed to fetch latest yt-dlp version from PyPI')
  }

  // If we couldn't get latest from PyPI, run the update anyway and compare
  if (!latest) {
    const ytdlp = resolveYtDlpPath()
    try {
      execFileSync(ytdlp, ['-U'], { encoding: 'utf-8', timeout: 60_000 })
    } catch (e) {
      getLogger().error(`yt-dlp -U failed: ${(e as Error).message}`)
      throw new Error(`yt-dlp self-update failed: ${(e as Error).message}`)
    }
    const newVersion = getYtDlpVersion()
    const updated = newVersion !== current
    return { current, latest: newVersion, updated, newVersion }
  }

  // Compare versions (simple string comparison works for semver-like versions)
  if (latest === current) {
    return { current, latest, updated: false, newVersion: current }
  }

  // Run the update
  try {
    const ytdlp = resolveYtDlpPath()
    execFileSync(ytdlp, ['-U'], { encoding: 'utf-8', timeout: 60_000 })
    getLogger().info(`yt-dlp updated from ${current} to latest ${latest}`)
  } catch (e) {
    getLogger().error(`yt-dlp -U failed: ${(e as Error).message}`)
    throw new Error(`yt-dlp self-update failed: ${(e as Error).message}`)
  }

  const newVersion = getYtDlpVersion()
  return { current, latest, updated: true, newVersion }
}

// ── Binary health check (one-shot, synchronous) ────────────────────────

/**
 * Performs a thorough health check on a binary (yt-dlp or ffmpeg).
 *
 * Checks in order:
 * 1. Path resolution — can we find the binary?
 * 2. File existence — does the file exist?
 * 3. Execution — can we run it and parse the version?
 *
 * Returns a BinaryHealth object with one of four statuses:
 * - ok:        Binary exists, runs, and version was extracted
 * - missing:   File not found at the resolved path
 * - corrupted: File exists but fails to execute or returns no version
 * - unknown:   Could not determine status (resolver threw unexpectedly)
 */
export function checkBinaryHealth(name: 'yt-dlp' | 'ffmpeg'): BinaryHealth {
  try {
    const resolver = name === 'yt-dlp' ? resolveYtDlpPath : resolveFfmpegPath
    const binPath = resolver()

    // Check existence
    if (!existsSync(binPath)) {
      return {
        name,
        status: 'missing',
        version: '',
        path: binPath,
        error: `File not found: ${binPath}`,
      }
    }

    // Check it's a real file (not a directory)
    try {
      const stat = statSync(binPath)
      if (!stat.isFile()) {
        return {
          name,
          status: 'corrupted',
          version: '',
          path: binPath,
          error: `Path is not a file: ${binPath}`,
        }
      }
    } catch {
      return {
        name,
        status: 'corrupted',
        version: '',
        path: binPath,
        error: `Cannot stat file: ${binPath}`,
      }
    }

    // Try to execute and parse version
    try {
      const version =
        name === 'yt-dlp' ? extractYtDlpVersion(binPath) : extractFfmpegVersion(binPath)

      if (version && version !== 'unknown') {
        return {
          name,
          status: 'ok',
          version,
          path: binPath,
        }
      }

      return {
        name,
        status: 'corrupted',
        version: version || '',
        path: binPath,
        error: 'Binary executed but returned no recognizable version',
      }
    } catch (e) {
      return {
        name,
        status: 'corrupted',
        version: '',
        path: binPath,
        error: `Execution failed: ${(e as Error).message}`,
      }
    }
  } catch (e) {
    return {
      name,
      status: 'unknown',
      version: '',
      error: `Path resolution failed: ${(e as Error).message}`,
    }
  }
}

// ── Repair / rebuild helpers ───────────────────────────────────────────

export interface RepairResult {
  rebuilt: boolean
  version: string
  message: string
}

/**
 * Attempt to repair yt-dlp with a three-tier strategy:
 * 1. Try yt-dlp -U self-update (only if binary exists)
 * 2. Auto-download from yt-dlp GitHub releases into bin/
 * 3. Show install guide
 */
export async function repairYtDlp(): Promise<RepairResult> {
  try {
    const binPath = resolveYtDlpPath()

    // ── Tier 1: self-update (binary must exist) ─────────────────
    if (existsSync(binPath)) {
      // Quick health check before attempting update
      let preVersion = ''
      let isHealthy = false
      try {
        preVersion = extractYtDlpVersion(binPath)
        isHealthy = preVersion !== '' && preVersion !== 'unknown'
      } catch {
        // Binary exists but doesn't run — skip to download
      }

      if (isHealthy) {
        try {
          getLogger().info(`Repairing yt-dlp via ${binPath} -U`)
          const out = execFileSync(binPath, ['-U'], {
            encoding: 'utf-8',
            timeout: 60_000,
          })
          getLogger().info(`yt-dlp -U output: ${out.slice(0, 500)}`)
          const newVersion = extractYtDlpVersion(binPath)
          return {
            rebuilt: true,
            version: newVersion,
            message: `yt-dlp updated to ${newVersion}`,
          }
        } catch (e) {
          getLogger().warn(`yt-dlp -U failed: ${(e as Error).message}`)
          // Self-update failed, but binary is still working — report partial success
          return {
            rebuilt: false,
            version: preVersion,
            message: `yt-dlp ${preVersion} is working but could not be updated: ${(e as Error).message}`,
          }
        }
      }
      // Binary exists but is unhealthy (corrupted) — fall through to download
      getLogger().warn(`yt-dlp at ${binPath} appears corrupted — will attempt download`)
    }

    // ── Tier 2: auto-download ───────────────────────────────────
    getLogger().info('yt-dlp not found or update failed — attempting auto-download...')
    const dlResult = await downloadYtDlp()
    if (dlResult.rebuilt) {
      return dlResult
    }

    // ── Tier 3: install guide ───────────────────────────────────
    return {
      rebuilt: false,
      version: '',
      message:
        `yt-dlp auto-download failed: ${dlResult.message}. ` +
        `Install yt-dlp from https://github.com/yt-dlp/yt-dlp/releases or add it to your PATH.`,
    }
  } catch (e) {
    const msg = (e as Error).message
    getLogger().error(`yt-dlp repair failed: ${msg}`)
    return {
      rebuilt: false,
      version: '',
      message: `yt-dlp repair failed: ${msg}`,
    }
  }
}

// ── yt-dlp auto-download ───────────────────────────────────────────────

const YTDLP_GITHUB_API = 'https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest'

/**
 * Auto-download yt-dlp from its GitHub releases into the app bin/ dir.
 * yt-dlp distributes single binaries (no archives), so no extraction needed.
 *
 * Asset mapping by platform:
 * - Windows: yt-dlp.exe
 * - Linux:   yt-dlp (static binary)
 * - macOS:   yt-dlp_macos
 */
async function downloadYtDlp(): Promise<RepairResult> {
  try {
    const platform = process.platform
    let assetPattern: RegExp
    let binaryName: string

    if (platform === 'win32') {
      assetPattern = /^yt-dlp\.exe$/
      binaryName = 'yt-dlp.exe'
    } else if (platform === 'darwin') {
      assetPattern = /^yt-dlp_macos$/
      binaryName = 'yt-dlp'
    } else {
      assetPattern = /^yt-dlp$/ // exact match — avoid matching yt-dlp.tar.gz etc.
      binaryName = 'yt-dlp'
    }

    // 1. Fetch release metadata from GitHub API
    getLogger().info('Fetching yt-dlp release info from GitHub...')
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15_000)
    const releaseRes = await fetch(YTDLP_GITHUB_API, {
      headers: { Accept: 'application/vnd.github.v3+json' },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!releaseRes.ok) {
      return {
        rebuilt: false,
        version: '',
        message: `GitHub API returned ${releaseRes.status}: ${releaseRes.statusText}`,
      }
    }

    const release = (await releaseRes.json()) as GitHubRelease

    // yt-dlp assets use simple names — find exact match for our platform
    const asset = release.assets?.find((a) => assetPattern.test(a.name))
    if (!asset) {
      return {
        rebuilt: false,
        version: '',
        message: `No matching yt-dlp asset found for ${platform}`,
      }
    }

    getLogger().info(`Found yt-dlp asset: ${asset.name}`)

    // 2. Download the binary directly (no archive extraction needed)
    const binDir = getBinDir()
    mkdirSync(binDir, { recursive: true })
    const destPath = join(binDir, binaryName)

    getLogger().info(`Downloading ${asset.name} to ${destPath}...`)
    const dlController = new AbortController()
    const dlTimeout = setTimeout(() => dlController.abort(), 120_000)
    const dlRes = await fetch(asset.browser_download_url, {
      signal: dlController.signal,
    })
    clearTimeout(dlTimeout)

    if (!dlRes.ok) {
      return {
        rebuilt: false,
        version: '',
        message: `Download failed: HTTP ${dlRes.status}`,
      }
    }

    const buffer = Buffer.from(await dlRes.arrayBuffer())
    writeFileSync(destPath, buffer)
    getLogger().info(
      `Downloaded ${asset.name} to ${destPath} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`,
    )

    // 3. Make executable on Unix
    if (platform !== 'win32') {
      try {
        chmodSync(destPath, 0o755)
      } catch {
        /* best-effort */
      }
    }

    // 4. Validate the downloaded binary
    try {
      const version = extractYtDlpVersion(destPath)
      if (version && version !== 'unknown') {
        getLogger().info(`yt-dlp auto-download success: ${version} at ${destPath}`)
        return {
          rebuilt: true,
          version,
          message: `yt-dlp ${version} downloaded and installed to bin/`,
        }
      }
      return {
        rebuilt: false,
        version: '',
        message: 'Downloaded binary failed version check',
      }
    } catch (e) {
      return {
        rebuilt: false,
        version: '',
        message: `Downloaded binary does not run: ${(e as Error).message}`,
      }
    }
  } catch (e) {
    const msg = (e as Error).message
    getLogger().error(`yt-dlp auto-download failed: ${msg}`)
    return {
      rebuilt: false,
      version: '',
      message: `Auto-download failed: ${msg}`,
    }
  }
}

/**
 * Attempt to repair ffmpeg with a three-tier strategy:
 * 1. Check if a bundled binary exists (in the app's bin/ resources)
 * 2. Try running 'ffmpeg' on system PATH
 * 3. Auto-download ffmpeg from BtbN GitHub releases into the bin/ directory
 */
export async function repairFfmpeg(): Promise<RepairResult> {
  try {
    // ── Tier 1: bundled binary ──────────────────────────────────
    const platform = process.platform
    const binaryName = platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
    const bundled = getBundledBinPath(binaryName)
    if (bundled && existsSync(bundled)) {
      try {
        const version = extractFfmpegVersion(bundled)
        if (version && version !== 'unknown') {
          return {
            rebuilt: true,
            version,
            message: `Bundled ffmpeg found at ${bundled} — version ${version}`,
          }
        }
      } catch {
        // Bundled binary exists but doesn't work — try next tier
      }
    }

    // ── Tier 2: system PATH ─────────────────────────────────────
    try {
      const version = extractFfmpegVersion('ffmpeg')
      if (version && version !== 'unknown') {
        return {
          rebuilt: true,
          version,
          message: `System ffmpeg found — version ${version}`,
        }
      }
    } catch {
      // Not on PATH — fall through to auto-download
    }

    // ── Tier 3: auto-download ───────────────────────────────────
    getLogger().info('ffmpeg not found — attempting auto-download...')
    const dlResult = await downloadFfmpeg()
    if (dlResult.rebuilt) {
      return dlResult
    }

    // Download failed — guide the user
    const installGuide =
      platform === 'win32'
        ? 'Download ffmpeg from https://ffmpeg.org/download.html and add it to your PATH.'
        : platform === 'darwin'
          ? 'Install ffmpeg via Homebrew: brew install ffmpeg'
          : 'Install ffmpeg via your package manager: sudo apt install ffmpeg'

    return {
      rebuilt: false,
      version: '',
      message: `Auto-download failed: ${dlResult.message}. ${installGuide}`,
    }
  } catch (e) {
    const msg = (e as Error).message
    getLogger().error(`ffmpeg repair failed: ${msg}`)
    return {
      rebuilt: false,
      version: '',
      message: `ffmpeg repair failed: ${msg}`,
    }
  }
}

// ── ffmpeg auto-download ───────────────────────────────────────────────

const GITHUB_API_RELEASES = 'https://api.github.com/repos/BtbN/FFmpeg-Builds/releases/latest'

interface GitHubAsset {
  name: string
  browser_download_url: string
}

interface GitHubRelease {
  assets: GitHubAsset[]
}

/**
 * Auto-download ffmpeg from BtbN's GitHub releases into the app bin/ dir.
 * Handles all three platforms:
 * - Windows: ffmpeg-master-latest-win64-gpl.zip
 * - Linux:   ffmpeg-master-latest-linux64-gpl.tar.xz
 * - macOS:   ffmpeg-master-latest-macos64-gpl.tar.xz
 */
async function downloadFfmpeg(): Promise<RepairResult> {
  try {
    const platform = process.platform
    let assetPattern: RegExp
    let binaryName: string

    if (platform === 'win32') {
      assetPattern = /ffmpeg-master-latest-win64-gpl\.zip/
      binaryName = 'ffmpeg.exe'
    } else if (platform === 'darwin') {
      assetPattern = /ffmpeg-master-latest-macos64-gpl\.tar\.xz/
      binaryName = 'ffmpeg'
    } else {
      assetPattern = /ffmpeg-master-latest-linux64-gpl\.tar\.xz/
      binaryName = 'ffmpeg'
    }

    // 1. Fetch release metadata from GitHub API
    getLogger().info('Fetching ffmpeg release info from GitHub...')
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15_000)
    const releaseRes = await fetch(GITHUB_API_RELEASES, {
      headers: { Accept: 'application/vnd.github.v3+json' },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!releaseRes.ok) {
      return {
        rebuilt: false,
        version: '',
        message: `GitHub API returned ${releaseRes.status}: ${releaseRes.statusText}`,
      }
    }

    const release = (await releaseRes.json()) as GitHubRelease
    const asset = release.assets?.find((a) => assetPattern.test(a.name))
    if (!asset) {
      return {
        rebuilt: false,
        version: '',
        message: `No matching ffmpeg asset found for ${platform}`,
      }
    }

    getLogger().info(`Found ffmpeg asset: ${asset.name}`)

    // 2. Download the archive
    const binDir = getBinDir()
    mkdirSync(binDir, { recursive: true })
    const archiveExt = platform === 'win32' ? '.zip' : '.tar.xz'
    const archivePath = join(os.tmpdir(), `ffmpeg-dl-${Date.now()}${archiveExt}`)

    getLogger().info(`Downloading ${asset.name} to ${archivePath}...`)
    const dlController = new AbortController()
    const dlTimeout = setTimeout(() => dlController.abort(), 120_000)
    const dlRes = await fetch(asset.browser_download_url, {
      signal: dlController.signal,
    })
    clearTimeout(dlTimeout)

    if (!dlRes.ok) {
      return {
        rebuilt: false,
        version: '',
        message: `Download failed: HTTP ${dlRes.status}`,
      }
    }

    // Download to buffer and write to temp file
    const buffer = Buffer.from(await dlRes.arrayBuffer())
    writeFileSync(archivePath, buffer)
    getLogger().info(`Downloaded ${asset.name} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`)

    // 3. Extract the archive
    getLogger().info(`Extracting ${asset.name}...`)
    try {
      if (platform === 'win32') {
        // Use PowerShell Expand-Archive for .zip
        execFileSync(
          'powershell',
          [
            '-NoProfile',
            '-Command',
            `Expand-Archive -Path "${archivePath}" -DestinationPath "${binDir}" -Force`,
          ],
          { encoding: 'utf-8', timeout: 60_000 },
        )
      } else {
        // Use tar for .tar.xz
        execFileSync('tar', ['-xJf', archivePath, '-C', binDir], {
          encoding: 'utf-8',
          timeout: 60_000,
        })
      }
    } finally {
      // Clean up the archive
      try {
        unlinkSync(archivePath)
      } catch {
        /* best-effort */
      }
    }

    // 4. Find the extracted binary (may be nested in subdirectories)
    const binPath = findExtractedBinary(binDir, binaryName)
    if (!binPath) {
      // Fallback: search with lowercase name (Linux/macOS)
      const altBinPath = findExtractedBinary(
        binDir,
        binaryName === 'ffmpeg.exe' ? 'ffmpeg' : 'ffmpeg',
      )
      if (!altBinPath) {
        return {
          rebuilt: false,
          version: '',
          message: `Extraction completed but could not find ${binaryName} in ${binDir}`,
        }
      }
    }

    const finalPath = binPath ?? findExtractedBinary(binDir, 'ffmpeg')!

    // 5. Make executable on Unix
    if (platform !== 'win32') {
      try {
        chmodSync(finalPath, 0o755)
      } catch {
        /* best-effort */
      }
    }

    // 6. Validate the downloaded binary
    try {
      const version = extractFfmpegVersion(finalPath)
      if (version && version !== 'unknown') {
        getLogger().info(`ffmpeg auto-download success: ${version} at ${finalPath}`)
        return {
          rebuilt: true,
          version,
          message: `ffmpeg ${version} downloaded and installed to bin/`,
        }
      }
      return {
        rebuilt: false,
        version: '',
        message: 'Downloaded binary failed version check',
      }
    } catch (e) {
      return {
        rebuilt: false,
        version: '',
        message: `Downloaded binary does not run: ${(e as Error).message}`,
      }
    }
  } catch (e) {
    const msg = (e as Error).message
    getLogger().error(`ffmpeg auto-download failed: ${msg}`)
    return {
      rebuilt: false,
      version: '',
      message: `Auto-download failed: ${msg}`,
    }
  }
}

/** Recursively search the bin directory for an extracted binary by name. */
function findExtractedBinary(rootDir: string, targetName: string): string | null {
  try {
    const stack = [rootDir]
    const visited = new Set<string>()

    while (stack.length > 0) {
      const dir = stack.pop()!
      if (visited.has(dir)) continue
      visited.add(dir)

      let entries: string[]
      try {
        entries = readdirSync(dir)
      } catch {
        continue
      }

      for (const entry of entries) {
        const fullPath = join(dir, entry)
        try {
          const s = statSync(fullPath)
          if (s.isDirectory()) {
            stack.push(fullPath)
          } else if (s.isFile() && entry === targetName) {
            return fullPath
          }
        } catch {
          continue
        }
      }
    }

    return null
  } catch {
    return null
  }
}
