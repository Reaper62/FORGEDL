import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import path from 'node:path'
import type { DownloadSettings } from '../../shared/types'

// ── Mocks ──────────────────────────────────────────────────────────

let mockExists = false
let mockCreatedDirs: string[] = []
let mockHomeDir = '/home/testuser'

/** Build an expected path using the real path.join for platform-agnostic tests. */
const p = (...segments: string[]): string => path.join(...segments)

const mockExistsSync = vi.fn((_path: string) => mockExists)
const mockMkdirSync = vi.fn((path: string) => {
  mockCreatedDirs.push(path)
  mockExists = true
})

vi.mock('node:fs', () => ({
  default: {
    existsSync: mockExistsSync,
    mkdirSync: mockMkdirSync,
  },
}))

vi.mock('node:os', () => ({
  default: {
    homedir: vi.fn(() => mockHomeDir),
  },
}))

// Re-import the module after mocking so it picks up the mocked deps.
// We use a dynamic import so the module cache is fresh with mocks active.
let mod: typeof import('./download-path')

async function reloadModule(): Promise<void> {
  // Reset the module to pick up mocks. Vitest re-evaluates on import.
  mod = await import('./download-path')
}

// ── Helpers ────────────────────────────────────────────────────────

function makeSettings(overrides: Partial<DownloadSettings> = {}): DownloadSettings {
  return {
    outputFormat: 'bestvideo+bestaudio/best',
    downloadPath: '',
    extractAudio: false,
    audioFormat: 'mp3',
    embedMetadata: true,
    maxConcurrent: 3,
    speedLimit: '',
    namingTemplate: '%(title)s.%(ext)s',
    basePresetId: '',
    smartQueueOrdering: true,
    ytdlpPath: 'yt-dlp',
    ffmpegPath: 'ffmpeg',
    ...overrides,
  }
}

describe('download-path', () => {
  beforeEach(async () => {
    mockExists = false
    mockCreatedDirs = []
    mockHomeDir = '/home/testuser'
    // Reset the module-level base path by re-importing
    await reloadModule()
    // Clear the overridden base path
    mod.setDownloadBasePath('')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ── resolveForgedlBase ─────────────────────────────────────────

  describe('resolveForgedlBase', () => {
    it('uses homedir/Downloads/FORGEDL when downloadPath is empty', () => {
      const result = mod.resolveForgedlBase('')
      expect(result).toBe(p('/home/testuser', 'Downloads', 'FORGEDL'))
    })

    it('appends FORGEDL to a custom downloadPath', () => {
      const result = mod.resolveForgedlBase('/custom/path')
      expect(result).toBe(p('/custom/path', 'FORGEDL'))
    })

    it('normalizes Windows-style custom downloadPath', () => {
      const result = mod.resolveForgedlBase('C:\\Users\\Me\\Downloads')
      // path.join normalizes to forward slashes in the test os
      // but on Windows the actual path.join would use backslashes.
      // Since we're testing the logic, not the platform, we just
      // verify FORGEDL is appended.
      expect(result).toContain('FORGEDL')
      expect(result).toContain('Users')
    })

    it('uses setDownloadBasePath when configured', () => {
      mod.setDownloadBasePath('/electron/downloads/path')
      const result = mod.resolveForgedlBase('')
      expect(result).toBe(p('/electron/downloads/path', 'FORGEDL'))
    })

    it('custom downloadPath takes priority over setDownloadBasePath', () => {
      mod.setDownloadBasePath('/electron/downloads/path')
      const result = mod.resolveForgedlBase('/custom')
      expect(result).toBe(p('/custom', 'FORGEDL'))
    })
  })

  // ── resolveDownloadDir — path resolution ────────────────────────

  describe('resolveDownloadDir — path resolution', () => {
    it('resolves to VIDEO folder by default', () => {
      const settings = makeSettings()
      const result = mod.resolveDownloadDir(settings)
      expect(result).toBe(p('/home/testuser', 'Downloads', 'FORGEDL', 'VIDEO'))
    })

    it('resolves to AUDIO folder when extractAudio is true', () => {
      const settings = makeSettings({ extractAudio: true })
      const result = mod.resolveDownloadDir(settings)
      expect(result).toBe(p('/home/testuser', 'Downloads', 'FORGEDL', 'AUDIO'))
    })

    it('resolves to AUDIO folder when format is bestaudio (even without extractAudio)', () => {
      const settings = makeSettings({ outputFormat: 'bestaudio' })
      const result = mod.resolveDownloadDir(settings)
      expect(result).toBe(p('/home/testuser', 'Downloads', 'FORGEDL', 'AUDIO'))
    })

    it('resolves to AUDIO folder when format is worstaudio', () => {
      const settings = makeSettings({ outputFormat: 'worstaudio' })
      const result = mod.resolveDownloadDir(settings)
      expect(result).toBe(p('/home/testuser', 'Downloads', 'FORGEDL', 'AUDIO'))
    })

    it('resolves to AUDIO folder when format is ba', () => {
      const settings = makeSettings({ outputFormat: 'ba' })
      const result = mod.resolveDownloadDir(settings)
      expect(result).toBe(p('/home/testuser', 'Downloads', 'FORGEDL', 'AUDIO'))
    })

    it('resolves to AUDIO folder when format is wa', () => {
      const settings = makeSettings({ outputFormat: 'wa' })
      const result = mod.resolveDownloadDir(settings)
      expect(result).toBe(p('/home/testuser', 'Downloads', 'FORGEDL', 'AUDIO'))
    })

    it('resolves to VIDEO folder when format is video with no extractAudio', () => {
      const settings = makeSettings({ outputFormat: 'bestvideo+bestaudio/best' })
      const result = mod.resolveDownloadDir(settings)
      expect(result).toBe(p('/home/testuser', 'Downloads', 'FORGEDL', 'VIDEO'))
    })

    it('extractAudio overrides audio-only format (still AUDIO)', () => {
      const settings = makeSettings({
        extractAudio: true,
        outputFormat: 'bestvideo+bestaudio/best',
      })
      const result = mod.resolveDownloadDir(settings)
      expect(result).toBe(p('/home/testuser', 'Downloads', 'FORGEDL', 'AUDIO'))
    })

    it('uses custom downloadPath with FORGEDL nesting', () => {
      const settings = makeSettings({ downloadPath: '/custom' })
      const result = mod.resolveDownloadDir(settings)
      expect(result).toBe(p('/custom', 'FORGEDL', 'VIDEO'))
    })

    it('custom path with audio format goes to AUDIO subfolder', () => {
      const settings = makeSettings({
        downloadPath: '/custom',
        extractAudio: true,
      })
      const result = mod.resolveDownloadDir(settings)
      expect(result).toBe(p('/custom', 'FORGEDL', 'AUDIO'))
    })
  })

  // ── resolveDownloadDir — directory creation ────────────────────

  describe('resolveDownloadDir — directory creation', () => {
    it('creates the directory when it does not exist', () => {
      mockExists = false
      const settings = makeSettings()
      mod.resolveDownloadDir(settings)
      expect(mockCreatedDirs).toContain(p('/home/testuser', 'Downloads', 'FORGEDL', 'VIDEO'))
    })

    it('does not create the directory when it already exists', () => {
      mockExists = true
      mockCreatedDirs = []
      const settings = makeSettings()
      mod.resolveDownloadDir(settings)
      expect(mockCreatedDirs).toHaveLength(0)
    })

    it('creates the AUDIO directory when routing to audio', () => {
      mockExists = false
      const settings = makeSettings({ extractAudio: true })
      mod.resolveDownloadDir(settings)
      expect(mockCreatedDirs).toContain(p('/home/testuser', 'Downloads', 'FORGEDL', 'AUDIO'))
    })

    it('creates nested directories under a custom path', () => {
      mockExists = false
      const settings = makeSettings({ downloadPath: '/custom/nested' })
      mod.resolveDownloadDir(settings)
      // fs.mkdirSync with recursive: true handles intermediate dirs
      expect(mockCreatedDirs).toContain(p('/custom/nested', 'FORGEDL', 'VIDEO'))
    })

    it('mkdirSync is called with recursive: true', () => {
      mockExists = false
      const settings = makeSettings()
      mod.resolveDownloadDir(settings)
      expect(mockMkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true })
    })
  })

  // ── setDownloadBasePath ────────────────────────────────────────

  describe('setDownloadBasePath', () => {
    it('overrides the default Downloads path', () => {
      mod.setDownloadBasePath('/custom/base')
      const result = mod.resolveForgedlBase('')
      expect(result).toBe(p('/custom/base', 'FORGEDL'))
    })

    it('does not affect resolveForgedlBase when downloadPath is set', () => {
      mod.setDownloadBasePath('/custom/base')
      const result = mod.resolveForgedlBase('/explicit/path')
      expect(result).toBe(p('/explicit/path', 'FORGEDL'))
    })

    it('can be cleared by setting an empty string', () => {
      mod.setDownloadBasePath('/custom/base')
      mod.setDownloadBasePath('')
      const result = mod.resolveForgedlBase('')
      expect(result).toBe(p('/home/testuser', 'Downloads', 'FORGEDL'))
    })
  })

  // ── Edge cases ─────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles downloadPath with trailing separator', () => {
      const result = mod.resolveForgedlBase('/custom/path/')
      expect(result).toBe(p('/custom/path', 'FORGEDL'))
    })

    it('handles empty outputFormat gracefully (falls back to VIDEO)', () => {
      const settings = makeSettings({ outputFormat: '' })
      const result = mod.resolveDownloadDir(settings)
      expect(result).toBe(p('/home/testuser', 'Downloads', 'FORGEDL', 'VIDEO'))
    })
  })
})
