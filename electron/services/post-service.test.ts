import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PostResults } from '../../shared/types'

// ── Hoisted mutable mock references ────────────────────────────────

const {
  mockExecFileSync,
  mockExistsSync,
  mockMkdirSync,
  mockWriteFileSync,
  mockUnlinkSync,
  mockRmSync,
  mockStatfsSync,
} = vi.hoisted(() => ({
  mockExecFileSync: vi.fn(),
  mockExistsSync: vi.fn(),
  mockMkdirSync: vi.fn(),
  mockWriteFileSync: vi.fn(),
  mockUnlinkSync: vi.fn(),
  mockRmSync: vi.fn(),
  mockStatfsSync: vi.fn(),
}))

// ── Module mocks ───────────────────────────────────────────────────
// CJS → ESM interop: named imports from CJS modules resolve through
// the default export, so we must override BOTH the named and default
// properties on the mocked module.                                      ─┐

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>()
  return {
    ...actual,
    execFileSync: mockExecFileSync,
    default: {
      ...(actual as unknown as { default: Record<string, unknown> }).default,
      execFileSync: mockExecFileSync,
    },
  }
})

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  return {
    ...actual,
    existsSync: mockExistsSync,
    mkdirSync: mockMkdirSync,
    writeFileSync: mockWriteFileSync,
    unlinkSync: mockUnlinkSync,
    rmSync: mockRmSync,
    statfsSync: mockStatfsSync,
    default: {
      ...(actual as unknown as { default: Record<string, unknown> }).default,
      existsSync: mockExistsSync,
      mkdirSync: mockMkdirSync,
      writeFileSync: mockWriteFileSync,
      unlinkSync: mockUnlinkSync,
      rmSync: mockRmSync,
      statfsSync: mockStatfsSync,
    },
  }
})

const mockYtDlpPath = '/usr/bin/yt-dlp'
const mockFfmpegPath = '/usr/bin/ffmpeg'

vi.mock('./runtime-info', () => ({
  resolveYtDlpPath: vi.fn(() => mockYtDlpPath),
  resolveFfmpegPath: vi.fn(() => mockFfmpegPath),
}))

const mockDownloadPath = '/home/user/Downloads/FORGEDL'

vi.mock('./download-path', () => ({
  resolveForgedlBase: vi.fn(() => mockDownloadPath),
}))

vi.mock('./settings-snapshot', () => ({
  getSettings: vi.fn(() => ({
    outputFormat: 'bestvideo+bestaudio/best',
    downloadPath: '',
    extractAudio: false,
    audioFormat: 'mp3',
    embedMetadata: true,
    maxConcurrent: 3,
    speedLimit: '',
    ytdlpPath: 'yt-dlp',
    ffmpegPath: 'ffmpeg',
  })),
}))

const { mockGetDatabase } = vi.hoisted(() => {
  const fn = vi.fn()
  return { mockGetDatabase: fn }
})

vi.mock('../database/connection', () => ({
  getDatabase: mockGetDatabase,
}))

vi.mock('../logging/logger', () => ({
  getLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}))

// ── Mock global fetch ──────────────────────────────────────────────

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// ── Dynamic import after mocks ────────────────────────────────────

let mod: typeof import('./post-service')

async function reloadModule(): Promise<void> {
  mod = await import('./post-service')
}

describe('PostService', () => {
  beforeEach(async () => {
    // ── Default: yt-dlp + ffmpeg exist ──────────────────────────
    mockExistsSync.mockReturnValue(true)

    // ── Default: yt-dlp + ffmpeg + extractors return valid output
    mockExecFileSync.mockImplementation((_exe: string, args: string[]) => {
      if (args[0] === '--version') return '2024.01.01\n'
      if (args[0] === '-version') return 'ffmpeg version 6.1 Copyright (c) 2000-2024\n'
      if (args[0] === '--list-extractors') return 'youtube\ntwitter\ntiktok\n'
      return ''
    })

    // ── Default: statfsSync reports healthy disk ────────────────
    mockStatfsSync.mockReturnValue({ bsize: 4096, bfree: 50_000_000, blocks: 100_000_000 })

    // ── Default: internet succeeds ──────────────────────────────
    mockFetch.mockResolvedValue({ ok: true, status: 204 })

    // ── Default: database healthy ───────────────────────────────
    mockGetDatabase.mockReturnValue({
      pragma: vi.fn(() => [{ integrity_check: 'ok' }]),
    })

    await reloadModule()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  // ── runPost orchestrator ──────────────────────────────────────────

  describe('runPost', () => {
    it('returns 8 checks with correct names', async () => {
      const results = await mod.runPost()
      expect(results.checks.map((c) => c.name)).toEqual([
        'yt-dlp',
        'ffmpeg',
        'internet',
        'disk-space',
        'write-permission',
        'database',
        'extractors',
        'download-test',
      ])
    })

    it('has allPassed=true when every check passes', async () => {
      const results = await mod.runPost()
      expect(results.allPassed).toBe(true)
      expect(results.checks.every((c) => c.status === 'pass')).toBe(true)
    })

    it('sets totalDurationMs >= 0', async () => {
      const results = await mod.runPost()
      expect(results.totalDurationMs).toBeGreaterThanOrEqual(0)
    })

    it('has allPassed=false when any check fails', async () => {
      mockFetch.mockRejectedValue(new Error('offline'))
      const results = await mod.runPost()
      expect(results.allPassed).toBe(false)
    })

    it('has allPassed=false when any check warns', async () => {
      mockStatfsSync.mockReturnValue({ bsize: 4096, bfree: 100, blocks: 100_000_000 })
      const results = await mod.runPost()
      expect(results.allPassed).toBe(false)
      const disk = results.checks.find((c) => c.name === 'disk-space')
      expect(disk!.status).toBe('warning')
    })
  })

  // ── yt-dlp check ────────────────────────────────────────────────

  describe('yt-dlp check', () => {
    it('passes with version', async () => {
      const results = await mod.runPost()
      const check = results.checks.find((c) => c.name === 'yt-dlp')!
      expect(check.status).toBe('pass')
      expect(check.message).toContain('2024.01.01')
    })

    it('fails when binary not found', async () => {
      mockExistsSync.mockReturnValue(false)
      const results = await mod.runPost()
      const check = results.checks.find((c) => c.name === 'yt-dlp')!
      expect(check.status).toBe('fail')
      expect(check.message).toContain('not found')
    })

    it('fails when execFileSync throws', async () => {
      mockExecFileSync.mockImplementation(() => {
        throw new Error('spawn ENOENT')
      })
      const results = await mod.runPost()
      const check = results.checks.find((c) => c.name === 'yt-dlp')!
      expect(check.status).toBe('fail')
      expect(check.detail).toContain('ENOENT')
    })

    it('warns when version output is empty', async () => {
      mockExecFileSync.mockImplementation((_exe: string, args: string[]) => {
        if (args[0] === '--version') return '\n'
        return ''
      })
      const results = await mod.runPost()
      const check = results.checks.find((c) => c.name === 'yt-dlp')!
      expect(check.status).toBe('warning')
      expect(check.message).toContain('unknown')
    })
  })

  // ── ffmpeg check ────────────────────────────────────────────────

  describe('ffmpeg check', () => {
    it('passes with version', async () => {
      const results = await mod.runPost()
      const check = results.checks.find((c) => c.name === 'ffmpeg')!
      expect(check.status).toBe('pass')
      expect(check.message).toContain('6.1')
    })

    it('fails when binary not found', async () => {
      mockExistsSync.mockReturnValue(false)
      const results = await mod.runPost()
      const check = results.checks.find((c) => c.name === 'ffmpeg')!
      expect(check.status).toBe('fail')
      expect(check.message).toContain('not found')
    })

    it('fails when execFileSync throws', async () => {
      mockExecFileSync.mockImplementation((_exe: string, args: string[]) => {
        if (args[0] === '--version') return '2024.01.01\n'
        throw new Error('spawn ENOENT')
      })
      const results = await mod.runPost()
      const check = results.checks.find((c) => c.name === 'ffmpeg')!
      expect(check.status).toBe('fail')
    })

    it('warns when version output is empty', async () => {
      mockExecFileSync.mockImplementation((_exe: string, args: string[]) => {
        if (args[0] === '--version') return '2024.01.01\n'
        if (args[0] === '-version') return 'ffmpeg version \n'
        return ''
      })
      const results = await mod.runPost()
      const check = results.checks.find((c) => c.name === 'ffmpeg')!
      expect(check.status).toBe('warning')
      expect(check.message).toContain('unknown')
    })
  })

  // ── Internet check ──────────────────────────────────────────────

  describe('internet check', () => {
    it('passes when fetch succeeds', async () => {
      const results = await mod.runPost()
      const check = results.checks.find((c) => c.name === 'internet')!
      expect(check.status).toBe('pass')
      expect(check.message).toBe('Connected')
    })

    it('fails when all URLs unreachable', async () => {
      mockFetch.mockRejectedValue(new Error('fetch failed'))
      const results = await mod.runPost()
      const check = results.checks.find((c) => c.name === 'internet')!
      expect(check.status).toBe('fail')
      expect(check.message).toContain('No internet')
    })

    it('tries second URL when first fails', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('first fails'))
        .mockResolvedValueOnce({ ok: true, status: 204 })
      const results = await mod.runPost()
      const check = results.checks.find((c) => c.name === 'internet')!
      expect(check.status).toBe('pass')
    })
  })

  // ── Disk space check ─────────────────────────────────────────────

  describe('disk-space check', () => {
    it('passes with free/total when statfsSync available', async () => {
      mockStatfsSync.mockReturnValue({ bsize: 4096, bfree: 60_000_000, blocks: 200_000_000 })
      const results = await mod.runPost()
      const check = results.checks.find((c) => c.name === 'disk-space')!
      expect(check.status).toBe('pass')
      expect(check.message).toContain('GB free')
    })

    it('warns when free space below 500 MB', async () => {
      mockStatfsSync.mockReturnValue({ bsize: 4096, bfree: 100_000, blocks: 200_000_000 })
      const results = await mod.runPost()
      const check = results.checks.find((c) => c.name === 'disk-space')!
      expect(check.status).toBe('warning')
      expect(check.message).toContain('Low disk space')
    })

    it('warns when statfsSync throws', async () => {
      mockStatfsSync.mockImplementation(() => {
        throw new Error('not available')
      })
      const results = await mod.runPost()
      const check = results.checks.find((c) => c.name === 'disk-space')!
      expect(check.status).toBe('warning')
      expect(check.message).toContain('Could not measure')
    })

    it('warns when statfsSync returns missing numeric fields', async () => {
      mockStatfsSync.mockReturnValue(
        {} as unknown as { bsize: number; bfree: number; blocks: number },
      )
      const results = await mod.runPost()
      const check = results.checks.find((c) => c.name === 'disk-space')!
      expect(check.status).toBe('warning')
      expect(check.message).toContain('Could not measure')
    })

    it('fails when download directory cannot be created', async () => {
      mockExistsSync.mockReturnValue(false)
      mockMkdirSync.mockImplementation(() => {
        throw new Error('mkdir EACCES')
      })
      const results = await mod.runPost()
      const check = results.checks.find((c) => c.name === 'disk-space')!
      expect(check.status).toBe('fail')
      expect(check.message).toContain('Cannot create')
    })
  })

  // ── Write permission check ───────────────────────────────────────

  describe('write-permission check', () => {
    it('passes when directory is writable', async () => {
      const results = await mod.runPost()
      const check = results.checks.find((c) => c.name === 'write-permission')!
      expect(check.status).toBe('pass')
    })

    it('fails when writeFileSync throws', async () => {
      mockWriteFileSync.mockImplementation(() => {
        throw new Error('write EACCES')
      })
      const results = await mod.runPost()
      const check = results.checks.find((c) => c.name === 'write-permission')!
      expect(check.status).toBe('fail')
      expect(check.message).toContain('Cannot write')
    })

    it('still attempts write when mkdirSync fails', async () => {
      mockMkdirSync.mockImplementation(() => {
        throw new Error('mkdir EACCES')
      })
      const results = await mod.runPost()
      const check = results.checks.find((c) => c.name === 'write-permission')!
      expect(check.status).toBe('pass')
    })
  })

  // ── Database check ───────────────────────────────────────────────

  describe('database check', () => {
    it('passes when integrity_check returns ok', async () => {
      const results = await mod.runPost()
      const check = results.checks.find((c) => c.name === 'database')!
      expect(check.status).toBe('pass')
      expect(check.message).toContain('integrity OK')
    })

    it('fails when integrity_check returns non-ok', async () => {
      mockGetDatabase.mockReturnValue({
        pragma: vi.fn(() => [{ integrity_check: 'row 5 missing from index' }]),
      })
      const results = await mod.runPost()
      const check = results.checks.find((c) => c.name === 'database')!
      expect(check.status).toBe('fail')
      expect(check.message).toContain('integrity check failed')
    })

    it('fails when integrity_check returns multiple rows', async () => {
      mockGetDatabase.mockReturnValue({
        pragma: vi.fn(() => [
          { integrity_check: 'row 1 corrupted' },
          { integrity_check: 'row 2 corrupted' },
        ]),
      })
      const results = await mod.runPost()
      const check = results.checks.find((c) => c.name === 'database')!
      expect(check.status).toBe('fail')
    })

    it('fails when getDatabase throws', async () => {
      mockGetDatabase.mockImplementation(() => {
        throw new Error('DB not ready')
      })
      const results = await mod.runPost()
      const check = results.checks.find((c) => c.name === 'database')!
      expect(check.status).toBe('fail')
    })
  })

  // ── Two-phase optimization ──────────────────────────────────────

  describe('two-phase optimization', () => {
    it('skips yt-dlp version and extractors when binary missing', async () => {
      mockExistsSync.mockReturnValue(false)
      const results = await mod.runPost()

      // Both yt-dlp and extractors should fail with "not found" / "skipped"
      const ytDlp = results.checks.find((c) => c.name === 'yt-dlp')!
      const extractors = results.checks.find((c) => c.name === 'extractors')!
      expect(ytDlp.status).toBe('fail')
      expect(ytDlp.message).toContain('not found')
      expect(extractors.status).toBe('fail')
      expect(extractors.message).toContain('skipped')

      // Verify execFileSync was NOT called for the skipped extractors check
      const extractorCalls = mockExecFileSync.mock.calls.filter(
        (call: unknown[]) => (call as string[])[1] === '--list-extractors',
      )
      expect(extractorCalls).toHaveLength(0)
    })

    it('skips ffmpeg version when binary missing', async () => {
      // yt-dlp exists, ffmpeg does not — explicit path-based mock
      mockExistsSync.mockImplementation((p: string) => p === mockYtDlpPath)
      const results = await mod.runPost()

      const ffmpeg = results.checks.find((c) => c.name === 'ffmpeg')!
      const ytDlp = results.checks.find((c) => c.name === 'yt-dlp')!
      const extractors = results.checks.find((c) => c.name === 'extractors')!

      expect(ffmpeg.status).toBe('fail')
      expect(ytDlp.status).toBe('pass') // yt-dlp still checked
      expect(extractors.status).toBe('pass') // extractors still checked
    })

    it('does not short-circuit when both binaries exist', async () => {
      const results = await mod.runPost()
      expect(results.allPassed).toBe(true)
    })
  })

  // ── Extractors check ─────────────────────────────────────────────

  describe('extractors check', () => {
    it('passes with non-empty list', async () => {
      mockExecFileSync.mockImplementation((_exe: string, args: string[]) => {
        if (args[0] === '--version') return '2024.01.01\n'
        if (args[0] === '-version') return 'ffmpeg version 6.1 Copyright\n'
        if (args[0] === '--list-extractors') return 'youtube\ntwitter\ninstagram\ntiktok\n'
        return ''
      })
      const results = await mod.runPost()
      const check = results.checks.find((c) => c.name === 'extractors')!
      expect(check.status).toBe('pass')
      expect(check.message).toContain('4 extractors')
    })

    it('fails when extractors list is empty', async () => {
      mockExecFileSync.mockImplementation((_exe: string, args: string[]) => {
        if (args[0] === '--version') return '2024.01.01\n'
        if (args[0] === '-version') return 'ffmpeg version 6.1 Copyright\n'
        if (args[0] === '--list-extractors') return '\n'
        return ''
      })
      const results = await mod.runPost()
      const check = results.checks.find((c) => c.name === 'extractors')!
      expect(check.status).toBe('fail')
      expect(check.message).toContain('No extractors')
    })

    it('fails when execFileSync throws for extractors', async () => {
      mockExecFileSync.mockImplementation((_exe: string, args: string[]) => {
        if (args[0] === '--version') return '2024.01.01\n'
        if (args[0] === '-version') return 'ffmpeg version 6.1 Copyright\n'
        throw new Error('timeout')
      })
      const results = await mod.runPost()
      const check = results.checks.find((c) => c.name === 'extractors')!
      expect(check.status).toBe('fail')
    })
  })

  // ── Download test check ─────────────────────────────────────────

  describe('download-test check', () => {
    it('passes when yt-dlp downloads the test video successfully', async () => {
      const results = await mod.runPost()
      const check = results.checks.find((c) => c.name === 'download-test')!
      expect(check.status).toBe('pass')
      expect(check.message).toContain('End-to-end download succeeded')
    })

    it('returns skipped when yt-dlp is not found', async () => {
      mockExistsSync.mockReturnValue(false)
      const results = await mod.runPost()
      const check = results.checks.find((c) => c.name === 'download-test')!
      expect(check.status).toBe('fail')
      expect(check.message).toContain('skipped')
    })

    it('fails when execFileSync throws during download', async () => {
      mockExecFileSync.mockImplementation((_exe: string, args: string[]) => {
        // Fail only the download test (matched by the test URL)
        if (args.includes('https://youtu.be/BaW_jenozKc'))
          throw new Error('HTTP Error 403: Forbidden')
        if (args[0] === '--version') return '2024.01.01\n'
        if (args[0] === '-version') return 'ffmpeg version 6.1 Copyright\n'
        if (args[0] === '--list-extractors') return 'youtube\n'
        return ''
      })
      const results = await mod.runPost()
      const check = results.checks.find((c) => c.name === 'download-test')!
      expect(check.status).toBe('fail')
      expect(check.message).toContain('Download test failed')
      expect(check.detail).toContain('403')
    })

    it('calls rmSync to clean up temp directory on success', async () => {
      await mod.runPost()
      expect(mockRmSync).toHaveBeenCalled()
      const rmCall = mockRmSync.mock.calls[0]
      expect(rmCall[0]).toContain('.forgedl-post-dl-test')
      expect(rmCall[1]).toEqual({ recursive: true, force: true })
    })

    it('calls rmSync to clean up temp directory even on failure', async () => {
      mockExecFileSync.mockImplementation((_exe: string, args: string[]) => {
        if (args.includes('https://youtu.be/BaW_jenozKc')) throw new Error('timeout')
        if (args[0] === '--version') return '2024.01.01\n'
        if (args[0] === '-version') return 'ffmpeg version 6.1 Copyright\n'
        if (args[0] === '--list-extractors') return 'youtube\n'
        return ''
      })
      mockRmSync.mockClear() // reset from beforeEach
      await mod.runPost()
      expect(mockRmSync).toHaveBeenCalled()
      const rmCall = mockRmSync.mock.calls[0]
      expect(rmCall[0]).toContain('.forgedl-post-dl-test')
    })
  })

  // ── Composite scenarios ──────────────────────────────────────────

  describe('composite scenarios', () => {
    it('has allPassed=false with multiple failures', async () => {
      // yt-dlp not found + internet down
      mockExistsSync.mockReturnValue(false)
      mockFetch.mockRejectedValue(new Error('network down'))

      const results = await mod.runPost()
      expect(results.allPassed).toBe(false)

      // With existsSync=false, yt-dlp and ffmpeg both fail
      const ytDlp = results.checks.find((c) => c.name === 'yt-dlp')!
      const ffmpeg = results.checks.find((c) => c.name === 'ffmpeg')!
      const internet = results.checks.find((c) => c.name === 'internet')!
      const diskSpace = results.checks.find((c) => c.name === 'disk-space')!

      expect(ytDlp.status).toBe('fail')
      expect(ffmpeg.status).toBe('fail')
      expect(internet.status).toBe('fail')
      // Disk space check should still pass (existsSync=false for downloadPath
      // triggers mkdirSync which succeeds in default mock, then statfsSync works)
      // But wait: mockExistsSync=false affects downloadPath too... mkdirSync
      // will run and succeed, then statfsSync returns a result so disk passes
      expect(diskSpace.status).not.toBe('fail')
    })

    it('all checks report fail when everything is broken', async () => {
      mockExistsSync.mockReturnValue(false)
      mockFetch.mockRejectedValue(new Error('offline'))
      mockMkdirSync.mockImplementation(() => {
        throw new Error('mkdir EACCES')
      })
      mockWriteFileSync.mockImplementation(() => {
        throw new Error('write EACCES')
      })
      mockGetDatabase.mockImplementation(() => {
        throw new Error('DB not ready')
      })
      mockExecFileSync.mockImplementation(() => {
        throw new Error('exec failed')
      })
      mockStatfsSync.mockImplementation(() => {
        throw new Error('not available')
      })

      const results = await mod.runPost()
      expect(results.checks.every((c) => c.status === 'fail')).toBe(true)
      expect(results.allPassed).toBe(false)
    })

    it('counts warnings correctly when yt-dlp version empty and statfs unavailable', async () => {
      mockExecFileSync.mockImplementation((_exe: string, args: string[]) => {
        if (args[0] === '--version') return '\n' // yt-dlp → warning
        if (args[0] === '-version') return 'ffmpeg version 6.1 Copyright\n'
        if (args[0] === '--list-extractors') return 'youtube\n'
        return ''
      })
      mockStatfsSync.mockImplementation(() => {
        throw new Error('not available')
      })

      const results = await mod.runPost()
      const warnings = results.checks.filter((c) => c.status === 'warning')
      expect(warnings).toHaveLength(2)
      expect(warnings.some((c) => c.name === 'yt-dlp')).toBe(true)
      expect(warnings.some((c) => c.name === 'disk-space')).toBe(true)
    })
  })
})
