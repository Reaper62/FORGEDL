import { describe, expect, it } from 'vitest'
import { normalizePlaylistNdjson } from './download-runtime'

// ── Helpers ─────────────────────────────────────────────────────────

/** Build a single NDJSON line for a playlist metadata entry. */
function playlistMetaJson(
  overrides: Record<string, unknown> = {},
  omitFields: string[] = [],
): string {
  const base: Record<string, unknown> = {
    _type: 'playlist',
    title: 'My Playlist',
    channel: 'TestChannel',
    entries: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    ...overrides,
  }
  for (const f of omitFields) delete base[f]
  return JSON.stringify(base)
}

/** Build a single NDJSON line for a video entry. */
function videoEntryJson(
  overrides: Record<string, unknown> = {},
  omitFields: string[] = [],
): string {
  const base: Record<string, unknown> = {
    id: 'dQw4w9WgXcQ',
    title: 'A Test Video',
    duration: 212,
    webpage_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    uploader: 'TestUploader',
    playlist_index: 1,
    ...overrides,
  }
  for (const f of omitFields) delete base[f]
  return JSON.stringify(base)
}

// ── Tests ───────────────────────────────────────────────────────────

describe('normalizePlaylistNdjson', () => {
  const PLAYLIST_URL = 'https://www.youtube.com/playlist?list=PLabc123'

  // ── Happy path ──────────────────────────────────────────────────

  it('parses metadata entry and video entries from NDJSON lines', () => {
    const lines = [
      playlistMetaJson({ title: 'My Playlist', channel: 'Chan' }),
      videoEntryJson({ id: 'vid1', title: 'Video 1', duration: 120 }),
      videoEntryJson({ id: 'vid2', title: 'Video 2', duration: 240 }),
    ]

    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, '')

    expect(result.metadata).toEqual({
      title: 'My Playlist',
      channel: 'Chan',
      totalExpected: 3,
    })
    expect(result.items).toHaveLength(2)
    expect(result.items[0].id).toBe('vid1')
    expect(result.items[0].title).toBe('Video 1')
    expect(result.items[0].duration).toBe(120)
    expect(result.items[1].id).toBe('vid2')
    expect(result.errors).toEqual({})
  })

  // ── Empty input ─────────────────────────────────────────────────

  it('returns default metadata for empty lines array', () => {
    const result = normalizePlaylistNdjson([], PLAYLIST_URL, '')
    expect(result.items).toHaveLength(0)
    expect(result.metadata.title).toBe('')
    expect(result.errors).toEqual({})
  })

  it('returns default metadata for lines with only invalid content', () => {
    const result = normalizePlaylistNdjson(['not json', '{broken'], PLAYLIST_URL, '')
    expect(result.items).toHaveLength(0)
    expect(result.metadata.title).toBe('')
  })

  // ── Partial line reassembly (Pass 1 output) ─────────────────────

  it('handles a single complete line after partial buffering', () => {
    // Simulates the result of partial-line buffering: one complete JSON line
    const line = videoEntryJson({ id: 'complete' })
    const result = normalizePlaylistNdjson([line], PLAYLIST_URL, '')
    expect(result.items).toHaveLength(1)
    expect(result.items[0].id).toBe('complete')
  })

  // ── stderr → ErrorRegistry ─────────────────────────────────────

  it('captures ERROR lines from stderr', () => {
    const lines = [videoEntryJson({ id: 'a' }), videoEntryJson({ id: 'b' })]
    const stderr = 'ERROR: [youtube] Video unavailable\n'

    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, stderr)

    expect(result.items).toHaveLength(2)
    expect(Object.keys(result.errors)).toHaveLength(1)
    expect(Object.values(result.errors)[0]).toContain('Video unavailable')
  })

  it('captures both ERROR and WARNING lines from stderr', () => {
    const lines = [videoEntryJson({ id: 'a' })]
    const stderr =
      'WARNING: [youtube] Falling back to android\nERROR: [youtube] Some entries failed\n'

    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, stderr)
    expect(Object.keys(result.errors)).toHaveLength(2)
  })

  it('does not capture non-ERROR/WARNING stderr lines', () => {
    const lines = [videoEntryJson({ id: 'a' })]
    const stderr = '[debug] Some debug output\n[info] Some info\n'

    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, stderr)
    expect(result.errors).toEqual({})
  })

  it('handles empty stderr gracefully', () => {
    const lines = [videoEntryJson({ id: 'a' })]
    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, '  ')
    expect(result.errors).toEqual({})
  })

  // ── URL fallback chain ─────────────────────────────────────────

  it('uses webpage_url when available', () => {
    const lines = [
      videoEntryJson({
        id: 'abc',
        webpage_url: 'https://youtube.com/watch?v=abc',
        url: 'https://googlevideo.com/stream',
      }),
    ]

    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, '')
    expect(result.items[0].url).toBe('https://youtube.com/watch?v=abc')
  })

  it('falls back to url field when webpage_url is missing', () => {
    const lines = [
      videoEntryJson({ id: 'abc', url: 'https://googlevideo.com/stream' }, ['webpage_url']),
    ]

    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, '')
    expect(result.items[0].url).toBe('https://googlevideo.com/stream')
  })

  it('falls back to constructed URL when both webpage_url and url are missing', () => {
    const lines = [JSON.stringify({ id: 'abc', title: 'No URL Video', duration: 60 })]

    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, '')
    expect(result.items[0].url).toBe('https://www.youtube.com/playlist?list=PLabc123&v=abc')
  })

  it('constructs URL correctly with different playlist URLs', () => {
    const lines = [JSON.stringify({ id: 'vid99', title: 'Test' })]
    const result = normalizePlaylistNdjson(lines, 'https://example.com/playlist.php?id=5', '')
    expect(result.items[0].url).toBe('https://example.com/playlist.php?id=5&v=vid99')
  })

  // ── Invalid JSON ───────────────────────────────────────────────

  it('skips lines that are not valid JSON', () => {
    const lines = ['not json at all', videoEntryJson({ id: 'real' }), '{broken: json}']

    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, '')
    expect(result.items).toHaveLength(1)
    expect(result.items[0].id).toBe('real')
  })

  it('skips empty lines', () => {
    const lines = ['', videoEntryJson({ id: 'valid' }), '   ']
    // Empty strings fail JSON.parse and get skipped
    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, '')
    expect(result.items).toHaveLength(1)
    expect(result.items[0].id).toBe('valid')
  })

  // ── Missing entry.id ───────────────────────────────────────────

  it('skips entries without an id field', () => {
    const lines = [
      JSON.stringify({ title: 'No ID entry', duration: 100 }),
      videoEntryJson({ id: 'valid' }),
    ]

    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, '')
    expect(result.items).toHaveLength(1)
    expect(result.items[0].id).toBe('valid')
  })

  // ── Metadata edge cases ────────────────────────────────────────

  it('handles playlist metadata without channel field', () => {
    const lines = [
      playlistMetaJson({ title: 'Solo Playlist' }, ['channel']),
      videoEntryJson({ id: 'a' }),
    ]

    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, '')
    expect(result.metadata.title).toBe('Solo Playlist')
    expect(result.metadata.channel).toBeUndefined()
  })

  it('handles playlist metadata without entries array', () => {
    const lines = [playlistMetaJson({ entries: undefined }), videoEntryJson({ id: 'a' })]

    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, '')
    expect(result.metadata.totalExpected).toBeUndefined()
  })

  it('handles null title in metadata', () => {
    const lines = [playlistMetaJson({ title: null }), videoEntryJson({ id: 'a' })]

    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, '')
    expect(result.metadata.title).toBe('')
  })

  it('handles missing title in metadata', () => {
    const lines = [playlistMetaJson({ title: undefined }), videoEntryJson({ id: 'a' })]

    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, '')
    expect(result.metadata.title).toBe('')
  })

  it('uses last _type=playlist entry for metadata (multiple present)', () => {
    const lines = [
      playlistMetaJson({ title: 'First' }),
      playlistMetaJson({ title: 'Last Takes Priority' }),
      videoEntryJson({ id: 'a' }),
    ]

    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, '')
    expect(result.metadata.title).toBe('Last Takes Priority')
  })

  // ── Type coercion ──────────────────────────────────────────────

  it('handles non-number duration gracefully', () => {
    const lines = [videoEntryJson({ id: 'a', duration: '212' })]

    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, '')
    expect(result.items[0].duration).toBeUndefined()
  })

  it('handles non-string uploader gracefully', () => {
    const lines = [videoEntryJson({ id: 'a', uploader: null })]

    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, '')
    expect(result.items[0].uploader).toBeUndefined()
  })

  it('handles null title by coercing to empty string', () => {
    const lines = [videoEntryJson({ id: 'a', title: null })]

    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, '')
    expect(result.items[0].title).toBe('')
  })

  it('handles non-string webpage_url by falling through the chain', () => {
    const lines = [
      videoEntryJson({
        id: 'abc',
        webpage_url: 42, // number, not string
        url: 'https://fallback.url/video',
      }),
    ]

    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, '')
    expect(result.items[0].url).toBe('https://fallback.url/video')
  })

  // ── playlist_index → index mapping ─────────────────────────────

  it('captures playlist_index as index on items', () => {
    const lines = [videoEntryJson({ id: 'a', playlist_index: 42 })]

    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, '')
    expect(result.items[0].index).toBe(42)
  })

  it('handles non-number playlist_index gracefully', () => {
    const lines = [videoEntryJson({ id: 'a', playlist_index: '5' })]

    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, '')
    expect(result.items[0].index).toBeUndefined()
  })

  it('handles missing playlist_index gracefully', () => {
    const lines = [videoEntryJson({ id: 'a' }, ['playlist_index'])]

    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, '')
    expect(result.items[0].index).toBeUndefined()
  })

  // ── Empty playlist (metadata but no videos) ────────────────────

  it('resolves with empty items array when playlist has no videos', () => {
    const lines = [playlistMetaJson({ title: 'Empty List', entries: [] })]

    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, '')
    expect(result.metadata.title).toBe('Empty List')
    expect(result.items).toHaveLength(0)
  })

  it('resolves with metadata even without any video entries', () => {
    const lines = [playlistMetaJson({ title: 'Only Meta' })]

    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, '')
    expect(result.metadata.title).toBe('Only Meta')
    expect(result.items).toHaveLength(0)
  })

  // ── Large playlists ────────────────────────────────────────────

  it('handles a large number of entries efficiently', () => {
    const lines = [playlistMetaJson({ totalExpected: undefined })]
    for (let i = 0; i < 500; i++) {
      lines.push(videoEntryJson({ id: `vid${i}`, title: `Video ${i}` }))
    }

    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, '')
    expect(result.items).toHaveLength(500)
    expect(result.items[0].id).toBe('vid0')
    expect(result.items[499].id).toBe('vid499')
  })

  // ── Mixed content (metadata interspersed) ──────────────────────

  it('correctly separates metadata from items when interspersed', () => {
    const lines = [
      videoEntryJson({ id: 'first' }),
      playlistMetaJson({ title: 'Late Metadata' }),
      videoEntryJson({ id: 'second' }),
    ]

    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, '')
    expect(result.metadata.title).toBe('Late Metadata')
    expect(result.items).toHaveLength(2)
    expect(result.items.map((i) => i.id)).toEqual(['first', 'second'])
  })

  // ── Errors + items coexist ─────────────────────────────────────

  it('returns both items and errors when some entries failed', () => {
    const lines = [playlistMetaJson({ title: 'Partial Playlist' }), videoEntryJson({ id: 'good' })]
    const stderr = 'ERROR: [youtube] Private video\nERROR: [youtube] Deleted video\n'

    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, stderr)
    expect(result.metadata.title).toBe('Partial Playlist')
    expect(result.items).toHaveLength(1)
    expect(Object.keys(result.errors)).toHaveLength(2)
  })

  // ── Thumbnail field ────────────────────────────────────────────

  it('passes through thumbnail when present', () => {
    const lines = [
      videoEntryJson({
        id: 'a',
        thumbnail: 'https://i.ytimg.com/vi/a/default.jpg',
      }),
    ]

    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, '')
    expect(result.items[0].thumbnail).toBe('https://i.ytimg.com/vi/a/default.jpg')
  })

  it('omits thumbnail when not a string', () => {
    const lines = [videoEntryJson({ id: 'a', thumbnail: 123 })]

    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, '')
    expect(result.items[0].thumbnail).toBeUndefined()
  })

  // ── Partial line buffering edge cases ──────────────────────────

  it('handles lines that are valid JSON but neither playlist nor video', () => {
    const lines = [
      JSON.stringify({ _type: 'other', someField: true }),
      videoEntryJson({ id: 'valid' }),
    ]

    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, '')
    // The _type='other' entry is neither metadata nor has an id, so it's skipped
    expect(result.items).toHaveLength(1)
    expect(result.items[0].id).toBe('valid')
  })

  it('handles entry with _type=playlist and no id as metadata only', () => {
    const lines = [
      JSON.stringify({ _type: 'playlist', title: 'Meta', id: 'ignored' }),
      // This should still be treated as metadata, not a video item
    ]

    const result = normalizePlaylistNdjson(lines, PLAYLIST_URL, '')
    expect(result.metadata.title).toBe('Meta')
    expect(result.items).toHaveLength(0)
  })
})
