import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildCommand, BuildError } from './yt-dlp-builder'
import { setSettingsSnapshot, clearSettingsSnapshot } from './settings-snapshot'
import { DownloadSettingsSchema } from '../../shared/types'

describe('buildCommand', () => {
  beforeEach(() => {
    setSettingsSnapshot(
      DownloadSettingsSchema.parse({
        outputFormat: 'bestvideo+bestaudio/best',
        maxConcurrent: 3,
        embedMetadata: false,
      }),
    )
  })

  afterEach(() => {
    clearSettingsSnapshot()
  })

  // ── Core settings mapping ─────────────────────────────────────────

  it('maps core settings to CLI args', () => {
    const result = buildCommand({ url: 'https://example.com/video' })
    expect(result.args).toContain('-f')
    expect(result.args).toContain('bestvideo+bestaudio/best')
    expect(result.args[result.args.length - 1]).toBe('https://example.com/video')
    expect(result.warnings).toEqual([])
  })

  it('maps speedLimit to -r flag', () => {
    setSettingsSnapshot(DownloadSettingsSchema.parse({ speedLimit: '1M', maxConcurrent: 3 }))
    const result = buildCommand({ url: 'https://example.com/video' })
    const idx = result.args.indexOf('-r')
    expect(idx).toBeGreaterThan(-1)
    expect(result.args[idx + 1]).toBe('1M')
  })

  // ── Extractor detection ──────────────────────────────────────────

  it('detects YouTube URLs (youtube.com/watch)', () => {
    const result = buildCommand({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
    expect(result.extractor).toBe('youtube')
  })

  it('detects YouTube URLs (youtu.be)', () => {
    const result = buildCommand({ url: 'https://youtu.be/dQw4w9WgXcQ' })
    expect(result.extractor).toBe('youtube')
  })

  it('detects YouTube URLs (youtube.com without www)', () => {
    const result = buildCommand({ url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' })
    expect(result.extractor).toBe('youtube')
  })

  it('detects generic URLs', () => {
    const result = buildCommand({ url: 'https://vimeo.com/12345' })
    expect(result.extractor).toBe('generic')
  })

  it('adds --embed-metadata for YouTube by default', () => {
    const result = buildCommand({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
    expect(result.args).toContain('--embed-metadata')
  })

  // ── ExtraFlags → CLI args mapping ─────────────────────────────────

  it('maps subtitleLangs to --sub-langs', () => {
    const result = buildCommand({
      url: 'https://example.com/video',
      extraFlags: { subtitleLangs: ['en', 'fr', 'de'] },
    })
    expect(result.args).toContain('--sub-langs')
    const idx = result.args.indexOf('--sub-langs')
    expect(result.args[idx + 1]).toBe('en,fr,de')
  })

  it('maps embedSubs to --embed-subs', () => {
    const result = buildCommand({
      url: 'https://example.com/video',
      extraFlags: { embedSubs: true },
    })
    expect(result.args).toContain('--embed-subs')
  })

  it('maps cookiesFile to --cookies', () => {
    const result = buildCommand({
      url: 'https://example.com/video',
      extraFlags: { cookiesFile: '/path/to/cookies.txt' },
    })
    const idx = result.args.indexOf('--cookies')
    expect(idx).toBeGreaterThan(-1)
    expect(result.args[idx + 1]).toBe('/path/to/cookies.txt')
  })

  it('maps browserCookies to --cookies-from-browser', () => {
    const result = buildCommand({
      url: 'https://example.com/video',
      extraFlags: { browserCookies: 'firefox' },
    })
    const idx = result.args.indexOf('--cookies-from-browser')
    expect(idx).toBeGreaterThan(-1)
    expect(result.args[idx + 1]).toBe('firefox')
  })

  it('maps username + password to --username and --password', () => {
    const result = buildCommand({
      url: 'https://example.com/video',
      extraFlags: { username: 'user1', password: 'secret' },
    })
    expect(result.args).toContain('--username')
    expect(result.args).toContain('user1')
    expect(result.args).toContain('--password')
    expect(result.args).toContain('secret')
  })

  it('maps proxy to --proxy', () => {
    const result = buildCommand({
      url: 'https://example.com/video',
      extraFlags: { proxy: 'socks5://127.0.0.1:9050' },
    })
    const idx = result.args.indexOf('--proxy')
    expect(idx).toBeGreaterThan(-1)
    expect(result.args[idx + 1]).toBe('socks5://127.0.0.1:9050')
  })

  it('maps userAgent to --user-agent', () => {
    const result = buildCommand({
      url: 'https://example.com/video',
      extraFlags: { userAgent: 'Mozilla/5.0 Custom' },
    })
    const idx = result.args.indexOf('--user-agent')
    expect(idx).toBeGreaterThan(-1)
    expect(result.args[idx + 1]).toBe('Mozilla/5.0 Custom')
  })

  it('maps referer to --referer', () => {
    const result = buildCommand({
      url: 'https://example.com/video',
      extraFlags: { referer: 'https://example.com' },
    })
    const idx = result.args.indexOf('--referer')
    expect(idx).toBeGreaterThan(-1)
    expect(result.args[idx + 1]).toBe('https://example.com')
  })

  it('maps netrc to --netrc', () => {
    const result = buildCommand({
      url: 'https://example.com/video',
      extraFlags: { netrc: true },
    })
    expect(result.args).toContain('--netrc')
  })

  // ── Playlist range ────────────────────────────────────────────────

  it('maps playlistStart/playlistEnd to --playlist-start/--playlist-end', () => {
    const result = buildCommand({
      url: 'https://youtube.com/playlist?list=abc',
      extraFlags: { playlistStart: 5, playlistEnd: 25 },
    })
    expect(result.args).toContain('--playlist-start')
    expect(result.args).toContain('5')
    expect(result.args).toContain('--playlist-end')
    expect(result.args).toContain('25')
  })

  it('maps noPlaylist to --no-playlist', () => {
    const result = buildCommand({
      url: 'https://youtube.com/playlist?list=abc',
      extraFlags: { noPlaylist: true },
    })
    expect(result.args).toContain('--no-playlist')
  })

  // ── Conflict resolution ───────────────────────────────────────────

  it('resolves cookiesFile over browserCookies when both are set', () => {
    const result = buildCommand({
      url: 'https://example.com/video',
      extraFlags: {
        cookiesFile: '/cookies.txt',
        browserCookies: 'chrome',
      },
    })
    expect(result.args).toContain('--cookies')
    expect(result.args).not.toContain('--cookies-from-browser')
    expect(result.warnings.some((w) => w.includes('--cookies-from-browser'))).toBe(true)
  })

  it('resolves username over netrc when both are set', () => {
    const result = buildCommand({
      url: 'https://example.com/video',
      extraFlags: {
        username: 'user1',
        password: 'pass',
        netrc: true,
      },
    })
    expect(result.args).toContain('--username')
    expect(result.args).not.toContain('--netrc')
    expect(result.warnings.some((w) => w.includes('--netrc'))).toBe(true)
  })

  it('cookies and netrc coexist (different conflict groups)', () => {
    const result = buildCommand({
      url: 'https://example.com/video',
      extraFlags: {
        cookiesFile: '/cookies.txt',
        netrc: true,
      },
    })
    expect(result.args).toContain('--cookies')
    expect(result.args).toContain('--netrc')
    expect(result.warnings).toHaveLength(0)
  })

  it('single flags in conflict groups survive without warnings', () => {
    const result = buildCommand({
      url: 'https://example.com/video',
      extraFlags: { browserCookies: 'chrome' },
    })
    expect(result.args).toContain('--cookies-from-browser')
    expect(result.warnings).toHaveLength(0)
  })

  // ── Validation ────────────────────────────────────────────────────

  it('throws BuildError for extract-audio with video format', () => {
    setSettingsSnapshot(
      DownloadSettingsSchema.parse({
        outputFormat: 'bestvideo+bestaudio/best',
        extractAudio: true,
        audioFormat: 'mp3',
      }),
    )
    expect(() => buildCommand({ url: 'https://example.com/video' })).toThrow(BuildError)
  })

  it('BuildError has correct code INVALID_COMBINATION', () => {
    setSettingsSnapshot(
      DownloadSettingsSchema.parse({
        outputFormat: 'bestvideo+bestaudio/best',
        extractAudio: true,
        audioFormat: 'mp3',
      }),
    )
    try {
      buildCommand({ url: 'https://example.com/video' })
      expect.fail('Should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(BuildError)
      expect((e as BuildError).code).toBe('INVALID_COMBINATION')
    }
  })

  it('does NOT throw for extract-audio with audio-only format', () => {
    setSettingsSnapshot(
      DownloadSettingsSchema.parse({
        outputFormat: 'bestaudio',
        extractAudio: true,
        audioFormat: 'mp3',
      }),
    )
    const result = buildCommand({ url: 'https://example.com/video' })
    expect(result.args).toContain('-x')
    expect(result.args).toContain('--audio-format')
  })

  it('extractAudio + audioFormat produce correct flags', () => {
    setSettingsSnapshot(
      DownloadSettingsSchema.parse({
        outputFormat: 'bestaudio',
        extractAudio: true,
        audioFormat: 'flac',
      }),
    )
    const result = buildCommand({ url: 'https://example.com/video' })
    expect(result.args).toContain('-x')
    const fmtIdx = result.args.indexOf('--audio-format')
    expect(fmtIdx).toBeGreaterThan(-1)
    expect(result.args[fmtIdx + 1]).toBe('flac')
  })

  // ── Warnings ──────────────────────────────────────────────────────

  it('warns when username is set without password', () => {
    const result = buildCommand({
      url: 'https://example.com/video',
      extraFlags: { username: 'user1' },
    })
    expect(result.warnings.some((w) => w.includes('--password'))).toBe(true)
  })

  it('does not warn when both username and password are set', () => {
    const result = buildCommand({
      url: 'https://example.com/video',
      extraFlags: { username: 'user1', password: 'pass' },
    })
    const authWarnings = result.warnings.filter((w) => w.includes('password'))
    expect(authWarnings).toHaveLength(0)
  })

  // ── End-to-end: combined extras ───────────────────────────────────

  it('combines multiple extraFlags correctly (full flow)', () => {
    const result = buildCommand({
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      extraFlags: {
        subtitleLangs: ['en', 'ja'],
        embedSubs: true,
        proxy: 'socks5://127.0.0.1:9050',
        userAgent: 'TestAgent/1.0',
        playlistStart: 1,
        playlistEnd: 10,
      },
    })

    expect(result.args).toContain('--sub-langs')
    const subIdx = result.args.indexOf('--sub-langs')
    expect(result.args[subIdx + 1]).toBe('en,ja')
    expect(result.args).toContain('--embed-subs')
    expect(result.args).toContain('--proxy')
    expect(result.args).toContain('--user-agent')
    expect(result.args).toContain('--playlist-start')
    expect(result.args).toContain('--playlist-end')
    expect(result.args).toContain('--embed-metadata')
    expect(result.args[result.args.length - 1]).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    expect(result.warnings).toHaveLength(0)
  })

  it('empty extraFlags produces no extra args', () => {
    const result = buildCommand({
      url: 'https://example.com/video',
      extraFlags: {},
    })
    expect(result.args).not.toContain('--sub-langs')
    expect(result.args).not.toContain('--cookies')
    expect(result.args).not.toContain('--proxy')
    expect(result.args).not.toContain('--username')
  })
})
