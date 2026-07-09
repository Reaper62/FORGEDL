import { describe, expect, it, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { FormatInspector } from './FormatInspector'
import type { VideoMetadata, FormatDetail, SubtitleTrack, Chapter } from '../../shared/types'

function makeFormat(overrides: Partial<FormatDetail> = {}): FormatDetail {
  return {
    format_id: '247',
    ext: 'webm',
    resolution: '1280x720',
    filesize: 50_000_000,
    vcodec: 'vp9',
    acodec: 'none',
    format_note: '720p',
    tbr: 1200,
    vbr: 1100,
    fps: 30,
    width: 1280,
    height: 720,
    ...overrides,
  }
}

function makeMetadata(overrides: Partial<VideoMetadata> = {}): VideoMetadata {
  return {
    id: 'test-video-id',
    title: 'Test Video',
    duration: 300,
    uploader: 'TestChannel',
    ...overrides,
  }
}

const mockFormats: FormatDetail[] = [
  makeFormat({ format_id: '247', vcodec: 'vp9', acodec: 'none', tbr: 1200, height: 720 }),
  makeFormat({ format_id: '136', vcodec: 'avc1.64001f', acodec: 'none', tbr: 1800, height: 720 }),
  makeFormat({
    format_id: '140',
    resolution: undefined,
    vcodec: 'none',
    acodec: 'mp4a.40.2',
    ext: 'm4a',
    tbr: 128,
    abr: 128,
    audio_channels: 2,
  }),
  makeFormat({
    format_id: '251',
    resolution: undefined,
    vcodec: 'none',
    acodec: 'opus',
    ext: 'webm',
    tbr: 160,
    abr: 160,
    audio_channels: 2,
  }),
  makeFormat({
    format_id: '22',
    vcodec: 'avc1.64001F',
    acodec: 'mp4a.40.2',
    ext: 'mp4',
    tbr: 2500,
    filesize: 100_000_000,
  }),
]

const mockMetadata = makeMetadata({
  formats: mockFormats,
  subtitles: {
    en: [{ ext: 'vtt', name: 'English' } as SubtitleTrack],
    es: [{ ext: 'vtt', name: 'Spanish' } as SubtitleTrack],
  },
  automatic_captions: {
    en: [{ ext: 'srv1', name: 'English (auto)' } as SubtitleTrack],
  },
  chapters: [
    { title: 'Intro', start_time: 0, end_time: 30 } as Chapter,
    { title: 'Main', start_time: 30, end_time: 270 } as Chapter,
    { title: 'Outro', start_time: 270, end_time: 300 } as Chapter,
  ],
})

describe('FormatInspector', () => {
  it('renders the codec inspector header', () => {
    const { getByText } = render(
      <FormatInspector metadata={mockMetadata} selectedFormat="" onSelectFormat={vi.fn()} />,
    )
    expect(getByText('Codec Inspector')).toBeInTheDocument()
  })

  it('shows format count', () => {
    const { queryAllByText } = render(
      <FormatInspector metadata={mockMetadata} selectedFormat="" onSelectFormat={vi.fn()} />,
    )
    expect(queryAllByText(/5 formats/i).length).toBeGreaterThanOrEqual(1)
  })

  it('shows summary codec chips', () => {
    const { queryAllByText } = render(
      <FormatInspector metadata={mockMetadata} selectedFormat="" onSelectFormat={vi.fn()} />,
    )
    expect(queryAllByText('VP9').length).toBeGreaterThanOrEqual(1)
    expect(queryAllByText('AAC').length).toBeGreaterThanOrEqual(1)
  })

  it('shows max resolution badge', () => {
    const { queryAllByText } = render(
      <FormatInspector metadata={mockMetadata} selectedFormat="" onSelectFormat={vi.fn()} />,
    )
    expect(queryAllByText('720p max').length).toBeGreaterThanOrEqual(1)
  })

  it('shows subtitle count badge', () => {
    const { queryAllByText } = render(
      <FormatInspector metadata={mockMetadata} selectedFormat="" onSelectFormat={vi.fn()} />,
    )
    expect(queryAllByText('2 subs').length).toBeGreaterThanOrEqual(1)
  })

  it('shows chapter count badge', () => {
    const { queryAllByText } = render(
      <FormatInspector metadata={mockMetadata} selectedFormat="" onSelectFormat={vi.fn()} />,
    )
    expect(queryAllByText('3 chapters').length).toBeGreaterThanOrEqual(1)
  })

  it('renders format IDs', () => {
    const { queryAllByText } = render(
      <FormatInspector metadata={mockMetadata} selectedFormat="" onSelectFormat={vi.fn()} />,
    )
    expect(queryAllByText('247').length).toBeGreaterThanOrEqual(1)
    expect(queryAllByText('22').length).toBeGreaterThanOrEqual(1)
  })

  it('calls onSelectFormat when clicking a format button', () => {
    const onSelectFormat = vi.fn()
    const { container } = render(
      <FormatInspector metadata={mockMetadata} selectedFormat="" onSelectFormat={onSelectFormat} />,
    )
    // Click the first button whose text starts with "247" (an AllFormatRow)
    const buttons = Array.from(container.querySelectorAll('button'))
    const target = buttons.find((b) => b.textContent?.trim().startsWith('247'))
    expect(target).toBeTruthy()
    fireEvent.click(target!)
    expect(onSelectFormat).toHaveBeenCalledWith('247')
  })

  it('switches to video tab', () => {
    const { getAllByText, queryByText } = render(
      <FormatInspector metadata={mockMetadata} selectedFormat="" onSelectFormat={vi.fn()} />,
    )
    fireEvent.click(getAllByText('Video')[0])
    expect(queryByText('Bitrate')).toBeInTheDocument()
  })

  it('switches to audio tab', () => {
    const { getAllByText, queryByText } = render(
      <FormatInspector metadata={mockMetadata} selectedFormat="" onSelectFormat={vi.fn()} />,
    )
    fireEvent.click(getAllByText('Audio')[0])
    expect(queryByText('Ch')).toBeInTheDocument()
  })

  it('switches to subtitles tab', () => {
    const { getAllByText, getByText } = render(
      <FormatInspector metadata={mockMetadata} selectedFormat="" onSelectFormat={vi.fn()} />,
    )
    fireEvent.click(getAllByText('Subtitles')[0])
    expect(getByText('English')).toBeInTheDocument()
    expect(getByText('Spanish')).toBeInTheDocument()
  })

  it('switches to chapters tab', () => {
    const { getAllByText, getByText } = render(
      <FormatInspector metadata={mockMetadata} selectedFormat="" onSelectFormat={vi.fn()} />,
    )
    fireEvent.click(getAllByText('Chapters')[0])
    expect(getByText('Intro')).toBeInTheDocument()
    expect(getByText('0:00')).toBeInTheDocument()
  })

  it('shows best pairing', () => {
    const { getAllByText } = render(
      <FormatInspector metadata={mockMetadata} selectedFormat="" onSelectFormat={vi.fn()} />,
    )
    expect(getAllByText(/Best Quality Pairing/i).length).toBeGreaterThanOrEqual(1)
  })

  it('renders with empty formats gracefully', () => {
    const empty = makeMetadata({ formats: [] })
    const { getByText, getAllByText } = render(
      <FormatInspector metadata={empty} selectedFormat="" onSelectFormat={vi.fn()} />,
    )
    expect(getByText('0 formats')).toBeInTheDocument()
    expect(getAllByText('Codec Inspector').length).toBeGreaterThanOrEqual(1)
  })

  it('shows empty chapter message when no chapters', () => {
    const noChapters = makeMetadata({ formats: mockFormats })
    const { container } = render(
      <FormatInspector metadata={noChapters} selectedFormat="" onSelectFormat={vi.fn()} />,
    )
    // Click the Chapters tab button
    const buttons = Array.from(container.querySelectorAll('button'))
    const chapBtn = buttons.find((b) => b.textContent?.includes('Chapters'))
    expect(chapBtn).toBeTruthy()
    fireEvent.click(chapBtn!)
    // The EmptyCell component should now be visible with its message
    expect(container.textContent).toContain('No chapter markers')
  })
})
