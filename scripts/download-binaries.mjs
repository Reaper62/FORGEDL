// Downloads yt-dlp.exe and ffmpeg binaries for Windows into bin/.
// Run via: node scripts/download-binaries.mjs
// Called automatically before packaging via the "prepackage" npm script.

import { createWriteStream, existsSync, mkdirSync, unlinkSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BIN_DIR = join(__dirname, '..', 'bin')

// ── URLs ──────────────────────────────────────────────────────────────

const YTDLP_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'

const FFMPEG_ZIP_URL = 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip'

// ── Helpers ───────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
    console.log(`  created ${dir}`)
  }
}

async function downloadFile(url, dest) {
  console.log(`  downloading ${url}`)
  const res = await fetch(url, {
    headers: { 'User-Agent': 'FORGERDL-build-script/1.0' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  const total = parseInt(res.headers.get('content-length') ?? '0', 10)
  const stream = createWriteStream(dest)
  const reader = res.body.getReader()

  let downloaded = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    stream.write(Buffer.from(value))
    downloaded += value.length
    if (total > 0) {
      const pct = ((downloaded / total) * 100).toFixed(1)
      process.stdout.write(`\r  ${pct}% (${(downloaded / 1024 / 1024).toFixed(1)} MB)`)
    }
  }
  stream.end()
  if (total > 0) process.stdout.write('\n')
  console.log(`  saved ${dest}`)
}

async function downloadWithRetry(url, dest, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await downloadFile(url, dest)
      return
    } catch (e) {
      if (i === retries - 1) throw e
      console.log(`  retry ${i + 1}/${retries}: ${e.message}`)
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  console.log('=== FORGERDL Binary Download ===\n')
  ensureDir(BIN_DIR)

  // 1. yt-dlp
  console.log('[1/2] yt-dlp')
  const ytdlpPath = join(BIN_DIR, 'yt-dlp.exe')
  await downloadWithRetry(YTDLP_URL, ytdlpPath)

  // 2. ffmpeg
  console.log('\n[2/2] ffmpeg')
  const ffmpegExe = join(BIN_DIR, 'ffmpeg.exe')
  const ffprobeExe = join(BIN_DIR, 'ffprobe.exe')

  // If already downloaded, skip
  if (existsSync(ffmpegExe) && existsSync(ffprobeExe)) {
    console.log('  ffmpeg binaries already present, skipping')
  } else {
    const zipPath = join(BIN_DIR, 'ffmpeg-temp.zip')
    try {
      await downloadWithRetry(FFMPEG_ZIP_URL, zipPath)

      // Extract ffmpeg.exe and ffprobe.exe from the zip using PowerShell
      console.log('  extracting...')
      const psScript = [
        `$zip = [System.IO.Compression.ZipFile]::OpenRead('${zipPath.replace(/'/g, "''")}')`,
        `$ffmpeg = $zip.Entries | Where-Object { $_.Name -eq 'ffmpeg.exe' } | Select-Object -First 1`,
        `$ffprobe = $zip.Entries | Where-Object { $_.Name -eq 'ffprobe.exe' } | Select-Object -First 1`,
        `if ($ffmpeg) { [System.IO.Compression.ZipFileExtensions]::ExtractToFile($ffmpeg, '${ffmpegExe.replace(/'/g, "''")}', $true) }`,
        `if ($ffprobe) { [System.IO.Compression.ZipFileExtensions]::ExtractToFile($ffprobe, '${ffprobeExe.replace(/'/g, "''")}', $true) }`,
        `$zip.Dispose()`,
        `if ($ffmpeg) { Write-Output 'ffmpeg.exe extracted' } else { throw 'ffmpeg.exe not found in archive' }`,
        `if ($ffprobe) { Write-Output 'ffprobe.exe extracted' } else { throw 'ffprobe.exe not found in archive' }`,
      ].join('; ')

      const result = spawnSync('powershell', ['-NoProfile', '-Command', psScript], {
        encoding: 'utf-8',
        stdio: 'pipe',
      })

      if (result.error || result.status !== 0) {
        console.error('  extraction error:', result.stderr || result.error?.message)
        throw new Error('Failed to extract ffmpeg from zip')
      }

      console.log('  ffmpeg.exe and ffprobe.exe extracted')
    } finally {
      // Clean up temp zip
      try {
        if (existsSync(zipPath)) unlinkSync(zipPath)
      } catch {
        // best effort
      }
    }
  }

  console.log('\n=== Complete ===')
  console.log(`  yt-dlp:  ${ytdlpPath}`)
  console.log(`  ffmpeg:  ${ffmpegExe}`)
  console.log(`  ffprobe: ${ffprobeExe}`)
}

main().catch((e) => {
  console.error('\nFATAL:', e.message)
  process.exit(1)
})
