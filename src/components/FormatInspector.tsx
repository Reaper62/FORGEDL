import { useState, useMemo } from 'react'
import { Film, Music, Subtitles, List, BarChart3, Zap, Check, Filter, X } from 'lucide-react'
import type { VideoMetadata, FormatDetail, SubtitleTrack } from '../../shared/types'

interface FormatInspectorProps {
  metadata: VideoMetadata
  selectedFormat: string
  onSelectFormat: (formatId: string) => void
}

type TabKey = 'all' | 'video' | 'audio' | 'subs' | 'chapters'

// ── Utilities ─────────────────────────────────────────────────────────

function fmtBitrate(kbps?: number): string {
  if (!kbps) return '\u2014'
  if (kbps >= 1000) return (kbps / 1000).toFixed(1) + ' Mbps'
  return kbps.toFixed(0) + ' kbps'
}

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return m + ':' + String(s).padStart(2, '0')
}

function fmtSize(bytes?: number): string {
  if (!bytes) return '\u2014'
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB'
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB'
  return (bytes / 1024).toFixed(0) + ' KB'
}

function codecBadge(codec?: string) {
  if (!codec || codec === 'none') {
    return { label: 'none', color: 'text-neutral-600' }
  }
  const u = codec.toUpperCase()
  if (u.includes('AV01') || u.includes('AV1')) return { label: 'AV1', color: 'text-emerald-400' }
  if (u.includes('VP9')) return { label: 'VP9', color: 'text-green-400' }
  if (u.includes('AVC') || u.includes('H264')) return { label: 'H.264', color: 'text-blue-400' }
  if (u.includes('HEVC') || u.includes('H265')) return { label: 'H.265', color: 'text-purple-400' }
  if (u.includes('VP8')) return { label: 'VP8', color: 'text-teal-400' }
  if (u.includes('OPUS')) return { label: 'Opus', color: 'text-orange-400' }
  if (u.includes('MP4A')) return { label: 'AAC', color: 'text-yellow-400' }
  if (u.includes('AAC')) return { label: 'AAC', color: 'text-yellow-400' }
  if (u.includes('MP3')) return { label: 'MP3', color: 'text-amber-400' }
  if (u.includes('VORBIS')) return { label: 'Vorbis', color: 'text-cyan-400' }
  return { label: codec, color: 'text-neutral-400' }
}

function computeBestPairing(formats: FormatDetail[]): {
  video: FormatDetail | null
  audio: FormatDetail | null
} {
  const vFormats = formats.filter((f) => f.vcodec && f.vcodec !== 'none')
  const aFormats = formats.filter((f) => f.acodec && f.acodec !== 'none' && f.vcodec === 'none')

  function scoreVideo(f: FormatDetail): number {
    let s = 0
    const vc = (f.vcodec ?? '').toUpperCase()
    if (vc.includes('AV01') || vc.includes('AV1')) s += 100
    else if (vc.includes('HEVC') || vc.includes('H265')) s += 70
    else if (vc.includes('VP9')) s += 60
    else if (vc.includes('AVC') || vc.includes('H264')) s += 40
    s += f.height ?? 0
    s += (f.fps ?? 0) * 2
    return s
  }

  function scoreAudio(f: FormatDetail): number {
    let s = 0
    const ac = (f.acodec ?? '').toUpperCase()
    if (ac.includes('OPUS')) s += 100
    else if (ac.includes('AAC')) s += 70
    else if (ac.includes('VORBIS')) s += 50
    else if (ac.includes('MP3')) s += 30
    s += (f.abr ?? 0) / 10
    s += (f.audio_channels ?? 2) * 5
    return s
  }

  const bestV =
    vFormats.length > 0 ? vFormats.reduce((a, b) => (scoreVideo(a) > scoreVideo(b) ? a : b)) : null
  const bestA =
    aFormats.length > 0 ? aFormats.reduce((a, b) => (scoreAudio(a) > scoreAudio(b) ? a : b)) : null

  return { video: bestV, audio: bestA }
}

// ── Sub-components ────────────────────────────────────────────────────

function CodecLabelInternal({ codec }: { codec?: string }) {
  const { label, color } = codecBadge(codec)
  if (label === 'none') {
    return <span className="text-neutral-600 text-xs">{'\u2014'}</span>
  }
  return <span className={'text-xs font-mono font-medium ' + color}>{label}</span>
}

function FpsLabel({ fps }: { fps?: number }) {
  if (!fps) return <span className="text-neutral-600 text-xs">{'\u2014'}</span>
  const label = fps >= 59 ? '60fps' : fps >= 50 ? '50fps' : fps >= 30 ? '30fps' : fps + 'fps'
  const color = fps >= 50 ? 'text-brand' : fps >= 30 ? 'text-active' : 'text-neutral-400'
  return <span className={'text-xs font-mono ' + color}>{label}</span>
}

function HdrLabel({ dr }: { dr?: string }) {
  if (!dr) return null
  if (dr.toUpperCase().includes('HDR') || dr.includes('10')) {
    return (
      <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded px-1.5 py-0.5">
        HDR
      </span>
    )
  }
  return (
    <span className="text-[10px] text-neutral-600 bg-neutral-800 rounded px-1.5 py-0.5">SDR</span>
  )
}

function EmptyCell({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-xs text-neutral-600">{message}</p>
    </div>
  )
}

function AllFormatRow(props: { fmt: FormatDetail; isSel: boolean; onSel: () => void }) {
  const f = props.fmt
  return (
    <button
      onClick={props.onSel}
      className={
        'w-full text-left px-4 py-2.5 flex items-center gap-3 transition-all duration-150 hover:bg-neutral-800/30' +
        (props.isSel ? ' bg-brand-muted/50 border-l-2 border-brand' : '')
      }
    >
      <span className="w-14 font-mono text-[11px] text-neutral-500">{f.format_id}</span>
      <span className="w-20 text-xs font-medium text-neutral-200">
        {f.resolution || (f.vcodec === 'none' ? 'Audio' : '\u2014')}
      </span>
      <span className="w-14 text-xs text-neutral-500">{f.ext}</span>
      <span className="flex-1 flex items-center gap-1.5">
        <CodecLabelInternal codec={f.vcodec && f.vcodec !== 'none' ? f.vcodec : f.acodec} />
        {f.dynamic_range ? <HdrLabel dr={f.dynamic_range} /> : null}
        {f.fps && f.fps >= 50 ? <FpsLabel fps={f.fps} /> : null}
      </span>
      <span className="w-16 text-[10px] text-neutral-500 tabular-nums">{fmtBitrate(f.tbr)}</span>
      <span className="w-20 text-[10px] font-mono text-neutral-500 tabular-nums text-right">
        {fmtSize(f.filesize || f.filesizeApprox)}
      </span>
      {props.isSel ? <Check className="w-3.5 h-3.5 text-brand flex-shrink-0" /> : null}
    </button>
  )
}

function CompactFormatRow(props: { fmt: FormatDetail; isSel: boolean; onSel: () => void }) {
  const f = props.fmt
  return (
    <button
      onClick={props.onSel}
      className={
        'w-full text-left px-4 py-2.5 flex items-center gap-3 transition-all duration-150 hover:bg-neutral-800/30' +
        (props.isSel ? ' bg-brand-muted/50 border-l-2 border-brand' : '')
      }
    >
      <span className="w-14 font-mono text-[11px] text-neutral-500">{f.format_id}</span>
      <span className="text-xs font-medium text-neutral-200">{f.resolution || '\u2014'}</span>
      <span className="text-xs text-neutral-500">{f.ext}</span>
      <span className="text-[10px] text-neutral-500 tabular-nums">{fmtBitrate(f.tbr)}</span>
      <span className="text-[10px] font-mono text-neutral-500 tabular-nums ml-auto">
        {fmtSize(f.filesize || f.filesizeApprox)}
      </span>
      {props.isSel ? <Check className="w-3.5 h-3.5 text-brand flex-shrink-0" /> : null}
    </button>
  )
}

// ── Tabs config ───────────────────────────────────────────────────────

interface TabDef {
  key: TabKey
  label: string
  icon: React.ReactNode
}

const TABS: TabDef[] = [
  { key: 'all', label: 'All Formats', icon: <List className="w-3.5 h-3.5" /> },
  { key: 'video', label: 'Video', icon: <Film className="w-3.5 h-3.5" /> },
  { key: 'audio', label: 'Audio', icon: <Music className="w-3.5 h-3.5" /> },
  { key: 'subs', label: 'Subtitles', icon: <Subtitles className="w-3.5 h-3.5" /> },
  { key: 'chapters', label: 'Chapters', icon: <List className="w-3.5 h-3.5" /> },
]

// ── Main component ────────────────────────────────────────────────────

export function FormatInspector({
  metadata,
  selectedFormat,
  onSelectFormat,
}: FormatInspectorProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [showAllSubs, setShowAllSubs] = useState(false)

  const formats = metadata.formats ?? []

  const videoFormats = useMemo(
    () => formats.filter((f) => f.vcodec && f.vcodec !== 'none'),
    [formats],
  )
  const audioFormats = useMemo(
    () => formats.filter((f) => f.acodec && f.acodec !== 'none' && f.vcodec === 'none'),
    [formats],
  )
  const combinedFormats = useMemo(
    () => formats.filter((f) => f.vcodec && f.vcodec !== 'none' && f.acodec && f.acodec !== 'none'),
    [formats],
  )

  const allSubs = useMemo(() => {
    const result: { type: string; lang: string; track: SubtitleTrack }[] = []
    if (metadata.subtitles) {
      for (const [lang, tracks] of Object.entries(metadata.subtitles)) {
        for (const t of tracks) result.push({ type: 'Manual', lang, track: t })
      }
    }
    if (metadata.automatic_captions) {
      for (const [lang, tracks] of Object.entries(metadata.automatic_captions)) {
        for (const t of tracks) result.push({ type: 'Auto', lang, track: t })
      }
    }
    return result
  }, [metadata.subtitles, metadata.automatic_captions])

  const bestPairing = useMemo(() => computeBestPairing(formats), [formats])

  const uniqueCodecs = useMemo(() => {
    const v = new Set(
      videoFormats.map((f) => codecBadge(f.vcodec).label).filter((c) => c !== 'none'),
    )
    const a = new Set(
      audioFormats.map((f) => codecBadge(f.acodec).label).filter((c) => c !== 'none'),
    )
    return { video: [...v], audio: [...a] }
  }, [videoFormats, audioFormats])

  const maxRes = useMemo(() => {
    let max = 0
    for (const f of videoFormats) {
      if ((f.height ?? 0) > max) max = f.height ?? 0
    }
    return max || undefined
  }, [videoFormats])

  // ── Filter state ──────────────────────────────────────────────────
  const [codecFilter, setCodecFilter] = useState<Set<string>>(new Set())
  const [resFilter, setResFilter] = useState<number>(0)

  const filteredVideoFormats = useMemo(() => {
    let result = videoFormats
    if (codecFilter.size > 0) {
      result = result.filter((f) => codecFilter.has(codecBadge(f.vcodec).label))
    }
    if (resFilter > 0) {
      result = result.filter((f) => (f.height ?? 0) >= resFilter)
    }
    return result
  }, [videoFormats, codecFilter, resFilter])

  const filteredAudioFormats = useMemo(() => {
    let result = audioFormats
    if (codecFilter.size > 0) {
      result = result.filter((f) => codecFilter.has(codecBadge(f.acodec).label))
    }
    return result
  }, [audioFormats, codecFilter])

  const filteredAllFormats = useMemo(() => {
    let result = formats.filter(
      (f) => f.format_note !== 'storyboard' && (f.vcodec !== 'none' || f.acodec !== 'none'),
    )
    if (codecFilter.size > 0) {
      result = result.filter((f) => {
        const v = codecBadge(f.vcodec).label
        const a = codecBadge(f.acodec).label
        return codecFilter.has(v) || codecFilter.has(a)
      })
    }
    if (resFilter > 0) {
      result = result.filter((f) => (f.height ?? 0) >= resFilter || (f.width ?? 0) >= resFilter)
    }
    return result
  }, [formats, codecFilter, resFilter])

  const hasActiveFilters = codecFilter.size > 0 || resFilter > 0

  const toggleCodecFilter = (codec: string) => {
    setCodecFilter((prev) => {
      const next = new Set(prev)
      if (next.has(codec)) next.delete(codec)
      else next.add(codec)
      return next
    })
  }

  const clearFilters = () => {
    setCodecFilter(new Set())
    setResFilter(0)
  }

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden animate-fade-slide-up">
      {/* Header */}
      <div className="p-5 border-b border-neutral-800">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-neutral-500" />
          <span className="text-sm font-semibold text-white">Codec Inspector</span>
          <span className="text-[10px] text-neutral-600 ml-auto">{formats.length} formats</span>
        </div>

        {/* Summary chips */}
        <div className="flex flex-wrap gap-1.5">
          {uniqueCodecs.video.map((c) => (
            <span
              key={c}
              className="text-[10px] font-semibold bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded"
            >
              {c}
            </span>
          ))}
          {uniqueCodecs.video.length > 0 && uniqueCodecs.audio.length > 0 ? (
            <span className="text-neutral-600 text-[10px]">{'\u00B7'}</span>
          ) : null}
          {uniqueCodecs.audio.map((c) => (
            <span
              key={c}
              className="text-[10px] font-semibold bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded"
            >
              {c}
            </span>
          ))}
          {maxRes ? (
            <>
              <span className="text-neutral-600 text-[10px]">{'\u00B7'}</span>
              <span className="text-[10px] font-semibold bg-neutral-800 text-active px-2 py-0.5 rounded">
                {maxRes}p max
              </span>
            </>
          ) : null}
          {allSubs.length > 0 ? (
            <>
              <span className="text-neutral-600 text-[10px]">{'\u00B7'}</span>
              <span className="text-[10px] font-semibold bg-neutral-800 text-process px-2 py-0.5 rounded">
                {new Set(allSubs.map((s) => s.lang)).size} subs
              </span>
            </>
          ) : null}
          {metadata.chapters && metadata.chapters.length > 0 ? (
            <>
              <span className="text-neutral-600 text-[10px]">{'\u00B7'}</span>
              <span className="text-[10px] font-semibold bg-neutral-800 text-alert px-2 py-0.5 rounded">
                {metadata.chapters.length} chapters
              </span>
            </>
          ) : null}
        </div>
      </div>

      {/* Best pairing */}
      {bestPairing.video &&
      bestPairing.audio &&
      videoFormats.length > 0 &&
      audioFormats.length > 0 ? (
        <div className="mx-5 mt-4 bg-active/5 border border-active/20 rounded-lg p-3 flex items-center gap-3">
          <Zap className="w-4 h-4 text-active flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-active font-medium">Best Quality Pairing</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">
              {bestPairing.video.format_id} ({bestPairing.video.resolution || '?'}{' '}
              {codecBadge(bestPairing.video.vcodec).label}){' + '}
              {bestPairing.audio.format_id} ({codecBadge(bestPairing.audio.acodec).label}{' '}
              {bestPairing.audio.audio_channels}ch)
              {bestPairing.video.filesize && bestPairing.audio.filesize ? (
                <span className="ml-1 text-neutral-500">
                  {'\u2248'} {fmtSize(bestPairing.video.filesize + bestPairing.audio.filesize)}
                </span>
              ) : null}
            </p>
          </div>
          <button
            onClick={() => {
              const id = bestPairing.video!.format_id + '+' + bestPairing.audio!.format_id
              onSelectFormat(id)
            }}
            className={
              'px-3 py-1 rounded text-xs font-medium border transition-all duration-200 ' +
              (selectedFormat === bestPairing.video?.format_id + '+' + bestPairing.audio?.format_id
                ? 'bg-brand-muted border-brand/50 text-brand'
                : 'bg-transparent border-active/30 text-active hover:bg-active/10')
            }
          >
            <Check
              className={
                'w-3 h-3 inline-block ' +
                (selectedFormat ===
                bestPairing.video?.format_id + '+' + bestPairing.audio?.format_id
                  ? ''
                  : 'hidden')
              }
            />
            {' Use Pair'}
          </button>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="flex border-b border-neutral-800 mt-4">
        {TABS.map((tab) => {
          const count =
            tab.key === 'all'
              ? hasActiveFilters
                ? filteredAllFormats.length
                : formats.length
              : tab.key === 'video'
                ? hasActiveFilters
                  ? filteredVideoFormats.length
                  : videoFormats.length
                : tab.key === 'audio'
                  ? hasActiveFilters
                    ? filteredAudioFormats.length
                    : audioFormats.length
                  : tab.key === 'subs'
                    ? allSubs.length
                    : (metadata.chapters?.length ?? 0)
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={
                'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-all duration-200 border-b-2 ' +
                (isActive
                  ? 'border-active text-active'
                  : 'border-transparent text-neutral-500 hover:text-neutral-300 hover:border-neutral-700')
              }
            >
              {tab.icon}
              {tab.label}
              {count > 0 ? (
                <span
                  className={
                    'text-[10px] rounded px-1 py-0.5 ' +
                    (isActive ? 'bg-active/20' : 'bg-neutral-800')
                  }
                >
                  {count}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      {/* Filter chips (shown for all/video/audio tabs) */}
      {(activeTab === 'all' || activeTab === 'video' || activeTab === 'audio') && (
        <div className="px-4 py-2 border-b border-neutral-800/50 flex items-center gap-2 flex-wrap">
          <Filter className="w-3 h-3 text-neutral-500 flex-shrink-0" />
          {/* Codec filter chips */}
          {[...uniqueCodecs.video, ...uniqueCodecs.audio].map((codec) => {
            const active = codecFilter.has(codec)
            return (
              <button
                key={codec}
                onClick={() => toggleCodecFilter(codec)}
                className={`text-[10px] font-medium rounded px-2 py-1 border transition-all duration-150 hover:scale-105 ${
                  active
                    ? 'bg-brand-muted border-brand/40 text-brand'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                }`}
              >
                {codec}
              </button>
            )
          })}
          {/* Resolution filter chips */}
          {maxRes && maxRes >= 720 ? (
            <>
              <span className="w-px h-4 bg-neutral-700" />
              {[2160, 1080, 720].map((r) => {
                if (r > maxRes) return null
                const active = resFilter === r
                return (
                  <button
                    key={r}
                    onClick={() => setResFilter(resFilter === r ? 0 : r)}
                    className={`text-[10px] font-medium rounded px-2 py-1 border transition-all duration-150 hover:scale-105 ${
                      active
                        ? 'bg-brand-muted border-brand/40 text-brand'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                    }`}
                  >
                    {r >= 2160 ? '4K+' : r + 'p+'}
                  </button>
                )
              })}
            </>
          ) : null}
          {hasActiveFilters ? (
            <>
              <span className="text-neutral-600 text-[10px]">·</span>
              <button
                onClick={clearFilters}
                className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors flex items-center gap-1"
              >
                <X className="w-2.5 h-2.5" />
                Clear
              </button>
            </>
          ) : null}
        </div>
      )}

      {/* Content */}
      <div className="max-h-[320px] overflow-y-auto bg-neutral-950">
        {/* All Formats */}
        {activeTab === 'all' ? (
          <div className="divide-y divide-neutral-800/50">
            {filteredAllFormats.map((f) => (
              <AllFormatRow
                key={f.format_id}
                fmt={f}
                isSel={selectedFormat === f.format_id}
                onSel={() => onSelectFormat(f.format_id)}
              />
            ))}
          </div>
        ) : null}

        {/* Video */}
        {activeTab === 'video' ? (
          <div>
            <div className="sticky top-0 bg-neutral-950 px-4 py-2 border-b border-neutral-800/50 text-[10px] text-neutral-600 uppercase tracking-wider grid grid-cols-[1fr_80px_60px_60px_70px] gap-2">
              <span>Codec</span>
              <span>Bitrate</span>
              <span>FPS</span>
              <span>HDR</span>
              <span>Resolution</span>
            </div>
            <div className="divide-y divide-neutral-800/50">
              {filteredVideoFormats.map((f) => (
                <div
                  key={f.format_id}
                  onClick={() => onSelectFormat(f.format_id)}
                  className={
                    'px-4 py-2.5 grid grid-cols-[1fr_80px_60px_60px_70px] gap-2 items-center cursor-pointer transition-colors hover:bg-neutral-800/30' +
                    (selectedFormat === f.format_id ? ' bg-brand-muted/50' : '')
                  }
                >
                  <div className="flex items-center gap-2">
                    <CodecLabelInternal codec={f.vcodec} />
                    {f.dynamic_range ? <HdrLabel dr={f.dynamic_range} /> : null}
                  </div>
                  <span className="text-xs text-neutral-400 tabular-nums">
                    {fmtBitrate(f.vbr || f.tbr)}
                  </span>
                  <FpsLabel fps={f.fps} />
                  <span className="text-xs text-neutral-500">
                    {f.dynamic_range?.includes('HDR') ? 'HDR' : 'SDR'}
                  </span>
                  <span className="text-xs text-neutral-300 tabular-nums">
                    {f.resolution || (f.width ?? '?') + '\u00D7' + (f.height ?? '?')}
                  </span>
                </div>
              ))}
              {filteredVideoFormats.length === 0 ? (
                <EmptyCell message="No separate video streams — use combined formats" />
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Audio */}
        {activeTab === 'audio' ? (
          <div>
            <div className="sticky top-0 bg-neutral-950 px-4 py-2 border-b border-neutral-800/50 text-[10px] text-neutral-600 uppercase tracking-wider grid grid-cols-[1fr_70px_50px_90px] gap-2">
              <span>Codec</span>
              <span>Bitrate</span>
              <span>Ch</span>
              <span>Size</span>
            </div>
            <div className="divide-y divide-neutral-800/50">
              {filteredAudioFormats.map((f) => (
                <div
                  key={f.format_id}
                  onClick={() => onSelectFormat(f.format_id)}
                  className={
                    'px-4 py-2.5 grid grid-cols-[1fr_70px_50px_90px] gap-2 items-center cursor-pointer transition-colors hover:bg-neutral-800/30' +
                    (selectedFormat === f.format_id ? ' bg-brand-muted/50' : '')
                  }
                >
                  <div className="flex items-center gap-2">
                    <CodecLabelInternal codec={f.acodec} />
                  </div>
                  <span className="text-xs text-neutral-400 tabular-nums">
                    {fmtBitrate(f.abr || f.tbr)}
                  </span>
                  <span className="text-xs text-neutral-400 tabular-nums">
                    {f.audio_channels ? f.audio_channels + 'ch' : '\u2014'}
                  </span>
                  <span className="text-xs text-neutral-500 tabular-nums">
                    {fmtSize(f.filesize || f.filesizeApprox)}
                  </span>
                </div>
              ))}
              {filteredAudioFormats.length === 0 ? (
                <EmptyCell message="No separate audio streams" />
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Subtitles */}
        {activeTab === 'subs' ? (
          <div>
            {allSubs.length === 0 ? (
              <EmptyCell message="No subtitle tracks available" />
            ) : (
              <div className="divide-y divide-neutral-800/50">
                {(showAllSubs ? allSubs : allSubs.slice(0, 12)).map((s, i) => (
                  <div key={s.lang + '-' + i} className="px-4 py-2.5 flex items-center gap-3">
                    <span className="text-xs text-neutral-300 font-medium w-10">{s.lang}</span>
                    <span className="text-xs text-neutral-500 flex-1">
                      {s.track.name || s.track.ext}
                    </span>
                    <span
                      className={
                        'text-[10px] font-semibold uppercase tracking-wider rounded px-1.5 py-0.5 ' +
                        (s.type === 'Auto'
                          ? 'text-neutral-600 bg-neutral-800'
                          : 'text-process bg-process/10')
                      }
                    >
                      {s.type}
                    </span>
                  </div>
                ))}
                {allSubs.length > 12 ? (
                  <button
                    onClick={() => setShowAllSubs(!showAllSubs)}
                    className="w-full px-4 py-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors text-center"
                  >
                    {showAllSubs ? 'Show fewer' : 'Show all ' + allSubs.length + ' tracks'}
                  </button>
                ) : null}
              </div>
            )}
          </div>
        ) : null}

        {/* Chapters */}
        {activeTab === 'chapters' ? (
          <div>
            {!metadata.chapters || metadata.chapters.length === 0 ? (
              <EmptyCell message="No chapter markers" />
            ) : (
              <div className="divide-y divide-neutral-800/50">
                {metadata.chapters.map((ch, i) => (
                  <div
                    key={i}
                    className="px-4 py-2.5 flex items-center gap-3 hover:bg-neutral-800/20 transition-colors cursor-default"
                  >
                    <span className="text-[10px] font-mono text-neutral-600 w-8 tabular-nums">
                      {i + 1}
                    </span>
                    <span className="text-xs text-neutral-200 flex-1 truncate">{ch.title}</span>
                    <span className="text-[10px] font-mono text-neutral-500 tabular-nums">
                      {fmtTime(ch.start_time)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* Combined formats (all tab only) */}
        {activeTab === 'all' && combinedFormats.length > 0 ? (
          <div className="border-t border-neutral-800/50 p-3">
            <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-2">
              Combined Video + Audio ({combinedFormats.length})
            </p>
            <div className="divide-y divide-neutral-800/30">
              {combinedFormats.map((f) => (
                <CompactFormatRow
                  key={f.format_id}
                  fmt={f}
                  isSel={selectedFormat === f.format_id}
                  onSel={() => onSelectFormat(f.format_id)}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
