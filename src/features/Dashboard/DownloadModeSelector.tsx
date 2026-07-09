import { useMemo } from 'react'
import { Film, Music, Check, Sparkles, ArrowDown } from 'lucide-react'
import type { VideoMetadata, FormatDetail } from '../../../shared/types'

interface DownloadModeSelectorProps {
  metadata: VideoMetadata
  selectedFormat: string
  onSelectFormat: (format: string) => void
}

type Mode = 'video' | 'audio'

interface ResolutionOption {
  label: string
  height: number
  formatString: string
}

interface AudioFormatOption {
  label: string
  sublabel: string
  formatString: string
}

const RESOLUTION_OPTIONS: ResolutionOption[] = [
  {
    label: '4K',
    height: 2160,
    formatString: 'bestvideo[height<=2160]+bestaudio/best[height<=2160]',
  },
  {
    label: '1440p',
    height: 1440,
    formatString: 'bestvideo[height<=1440]+bestaudio/best[height<=1440]',
  },
  {
    label: '1080p',
    height: 1080,
    formatString: 'bestvideo[height<=1080]+bestaudio/best[height<=1080]',
  },
  {
    label: '720p',
    height: 720,
    formatString: 'bestvideo[height<=720]+bestaudio/best[height<=720]',
  },
  {
    label: '480p',
    height: 480,
    formatString: 'bestvideo[height<=480]+bestaudio/best[height<=480]',
  },
  {
    label: '360p',
    height: 360,
    formatString: 'bestvideo[height<=360]+bestaudio/best[height<=360]',
  },
]

const AUDIO_FORMAT_OPTIONS: AudioFormatOption[] = [
  { label: 'Best Audio', sublabel: 'Auto-select', formatString: 'bestaudio' },
  { label: 'M4A', sublabel: 'AAC', formatString: 'bestaudio[ext=m4a]' },
  { label: 'Opus', sublabel: 'WebM', formatString: 'bestaudio[ext=webm]' },
]

/** Extract the set of unique heights present in the video formats. */
function extractAvailableHeights(formats: FormatDetail[]): Set<number> {
  const heights = new Set<number>()
  for (const f of formats) {
    if (f.vcodec && f.vcodec !== 'none' && f.height && f.height > 0) {
      heights.add(f.height)
    }
  }
  return heights
}

/** Build a human-readable summary of the best available format. */
function summarizeBestFormat(formats: FormatDetail[]): string {
  let maxH = 0
  let fps = 0
  for (const f of formats) {
    if (f.vcodec && f.vcodec !== 'none') {
      if ((f.height ?? 0) > maxH) maxH = f.height ?? 0
      if ((f.fps ?? 0) > fps) fps = f.fps ?? 0
    }
  }
  const parts: string[] = []
  if (maxH > 0) {
    parts.push(maxH >= 2160 ? '4K' : maxH + 'p')
  }
  if (fps >= 50) parts.push('60fps')
  return parts.join(' · ') || 'Auto'
}

export function DownloadModeSelector({
  metadata,
  selectedFormat,
  onSelectFormat,
}: DownloadModeSelectorProps) {
  const formats = metadata.formats ?? []

  const availableHeights = useMemo(() => extractAvailableHeights(formats), [formats])
  const bestSummary = useMemo(() => summarizeBestFormat(formats), [formats])

  // Determine current mode based on selectedFormat
  const currentMode: Mode = useMemo(() => {
    if (selectedFormat === 'bestaudio' || selectedFormat.startsWith('bestaudio[')) {
      return 'audio'
    }
    return 'video'
  }, [selectedFormat])

  const isBestQuality = selectedFormat === 'bestvideo+bestaudio/best'
  const isSmallestFile = selectedFormat === 'worstvideo+worstaudio/worst'

  // Determine whether to show the checkmark badge next to the selected option.
  // Show for audio mode always, and for video mode when a specific resolution
  // (not Best/Smallest) is selected.
  const showCheckmark =
    currentMode === 'audio' ||
    (selectedFormat !== 'bestvideo+bestaudio/best' &&
      selectedFormat !== 'worstvideo+worstaudio/worst')

  // Check if any audio-only streams exist in the formats
  const hasAudioStreams = useMemo(
    () =>
      formats.some((f) => f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none')),
    [formats],
  )

  return (
    <div className="space-y-3">
      {/* ── Mode toggle ────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg p-1 w-fit">
        <button
          type="button"
          onClick={() => onSelectFormat('bestvideo+bestaudio/best')}
          data-testid="mode-video"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
            currentMode === 'video'
              ? 'bg-brand text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-300'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          Video
        </button>
        <button
          type="button"
          onClick={() => onSelectFormat('bestaudio')}
          data-testid="mode-audio"
          disabled={!hasAudioStreams}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
            currentMode === 'audio'
              ? 'bg-brand text-white shadow-sm'
              : !hasAudioStreams
                ? 'text-neutral-700 cursor-not-allowed'
                : 'text-neutral-400 hover:text-neutral-300'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          Audio
        </button>
      </div>

      {/* ── Preset buttons: Best / Smallest ────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {currentMode === 'video' && (
          <>
            <button
              type="button"
              onClick={() => onSelectFormat('bestvideo+bestaudio/best')}
              data-testid="format-btn-best"
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 border hover:scale-105 active:scale-95 flex items-center gap-1.5 ${
                isBestQuality
                  ? 'bg-brand-muted border-brand/50 text-brand'
                  : 'bg-transparent border-neutral-700 text-neutral-400 hover:text-neutral-300 hover:border-neutral-600'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              Best
              {bestSummary && bestSummary !== 'Auto' && (
                <span className="text-[10px] opacity-70">({bestSummary})</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onSelectFormat('worstvideo+worstaudio/worst')}
              data-testid="format-btn-smallest"
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 border hover:scale-105 active:scale-95 flex items-center gap-1.5 ${
                isSmallestFile
                  ? 'bg-brand-muted border-brand/50 text-brand'
                  : 'bg-transparent border-neutral-700 text-neutral-400 hover:text-neutral-300 hover:border-neutral-600'
              }`}
            >
              <ArrowDown className="w-3 h-3" />
              Smallest
            </button>
          </>
        )}

        {/* ── Resolution chips (video mode) ────────────────────── */}
        {currentMode === 'video' && <span className="w-px h-5 bg-neutral-700 mx-0.5" />}

        {currentMode === 'video' &&
          RESOLUTION_OPTIONS.map((opt) => {
            const isAvailable =
              availableHeights.has(opt.height) ||
              // For 4K: check if ANY height >= 2160 exists
              (opt.height === 2160 && [...availableHeights].some((h) => h >= 2160))
            const isSelected = selectedFormat === opt.formatString

            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => isAvailable && onSelectFormat(opt.formatString)}
                disabled={!isAvailable}
                data-testid={`resolution-${opt.label.toLowerCase()}`}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 border ${
                  isSelected
                    ? 'bg-brand-muted border-brand/50 text-brand scale-105'
                    : isAvailable
                      ? 'bg-transparent border-neutral-700 text-neutral-400 hover:text-neutral-300 hover:border-neutral-600 hover:scale-105 active:scale-95'
                      : 'bg-transparent border-neutral-800 text-neutral-700 cursor-not-allowed line-through opacity-40'
                }`}
                title={
                  isAvailable
                    ? `Download at ${opt.label} — ${opt.formatString}`
                    : `${opt.label} not available for this video`
                }
              >
                {opt.label}
              </button>
            )
          })}

        {/* ── Audio format chips (audio mode) ──────────────────── */}
        {currentMode === 'audio' &&
          AUDIO_FORMAT_OPTIONS.map((opt) => {
            const isSelected = selectedFormat === opt.formatString
            return (
              <button
                key={opt.formatString}
                type="button"
                onClick={() => onSelectFormat(opt.formatString)}
                data-testid={`audio-format-${opt.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 border hover:scale-105 active:scale-95 ${
                  isSelected
                    ? 'bg-brand-muted border-brand/50 text-brand'
                    : 'bg-transparent border-neutral-700 text-neutral-400 hover:text-neutral-300 hover:border-neutral-600'
                }`}
                title={`Download audio as ${opt.label} (${opt.sublabel})`}
              >
                <span className="flex items-center gap-1.5">
                  {opt.label}
                  <span className="text-[10px] opacity-60">{opt.sublabel}</span>
                </span>
              </button>
            )
          })}

        {/* ── Selection checkmark ────────────────────────────────── */}
        {(() => {
          const selectedOpt =
            currentMode === 'video'
              ? RESOLUTION_OPTIONS.find((o) => o.formatString === selectedFormat)
              : AUDIO_FORMAT_OPTIONS.find((o) => o.formatString === selectedFormat)
          if (selectedOpt && showCheckmark) {
            return (
              <span className="text-[10px] text-brand flex items-center gap-1 ml-1">
                <Check className="w-3 h-3" />
                {selectedOpt.label}
              </span>
            )
          }
          return null
        })()}
      </div>

      {/* ── Hint text ──────────────────────────────────────────── */}
      {currentMode === 'audio' && (
        <p className="text-[11px] text-neutral-600">
          Downloads audio stream directly — no conversion needed. For MP3/FLAC conversion, use{' '}
          <span className="text-neutral-500 font-medium">Settings → Audio</span>.
        </p>
      )}
      {currentMode === 'video' && availableHeights.size === 0 && (
        <p className="text-[11px] text-neutral-600">
          Resolution info not available — using Best Quality. Metadata will be refined during
          download.
        </p>
      )}
    </div>
  )
}
