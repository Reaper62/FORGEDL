import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  DownloadSettingsSchema,
  type DownloadSettings,
  type BinaryHealth,
  type Preset,
} from '../../shared/types'
import { api } from '../lib/api'
import { useAppStore } from '../store'
import { toast } from 'sonner'
import {
  Save,
  RotateCcw,
  FolderOpen,
  FileCheck,
  HardDrive,
  Volume2,
  Gauge,
  Zap,
  ChevronDown,
  Wrench,
  Info,
  Loader2,
  RefreshCw,
  ArrowUpCircle,
  FileCode,
  Stethoscope,
  ShieldCheck,
  ShieldX,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Download,
  FileText,
  Hash,
  Eye,
  Bookmark,
  Star,
  SortAsc,
} from 'lucide-react'
import type { PostResults } from '../../shared/types'
import { PostCheckRow } from '../components/PostCheckRow'

// ── Binary health visual config ───────────────────────────────────────

function HealthIcon({ status }: { status: string }) {
  switch (status) {
    case 'ok':
      return <CheckCircle2 className="w-3.5 h-3.5 text-success" />
    case 'missing':
      return <XCircle className="w-3.5 h-3.5 text-failure" />
    case 'corrupted':
      return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
    default:
      return <HelpCircle className="w-3.5 h-3.5 text-neutral-500" />
  }
}

function HealthLabel({ status }: { status: string }) {
  const labels: Record<string, { text: string; color: string }> = {
    ok: { text: 'OK', color: 'text-success' },
    missing: { text: 'Missing', color: 'text-failure' },
    corrupted: { text: 'Corrupted', color: 'text-amber-400' },
    unknown: { text: 'Unknown', color: 'text-neutral-500' },
  }
  const cfg = labels[status] ?? labels.unknown
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider ${cfg.color}`}>
      {cfg.text}
    </span>
  )
}

function BinaryStatusRow({
  name,
  version,
  health,
  repairing,
  onRepair,
  updateResult,
}: {
  name: 'yt-dlp' | 'ffmpeg'
  version: string | null
  health: BinaryHealth | null
  repairing: boolean
  onRepair: () => void
  updateResult?: { current: string; latest: string; updated: boolean; newVersion: string } | null
}) {
  const displayLabel = name === 'yt-dlp' ? 'yt-dlp' : 'ffmpeg'
  const repoLabel = name === 'yt-dlp' ? 'Repair' : 'Download'
  const healthStatus =
    health?.status ?? (version && version !== 'unknown' && version !== 'missing' ? 'ok' : 'unknown')

  // Determine the version string to display
  let displayVersion = version ?? 'Not checked'
  if (health?.status === 'missing') displayVersion = 'Not found'
  else if (health?.status === 'corrupted') displayVersion = health.version || 'Broken'
  else if (health?.status === 'unknown' && !version) displayVersion = 'Not checked'

  return (
    <div className="flex items-center gap-3 bg-neutral-900/50 rounded-lg px-3 py-2.5">
      <HealthIcon status={healthStatus} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-neutral-600 uppercase tracking-wider">
            {displayLabel}
          </span>
          <HealthLabel status={healthStatus} />
        </div>
        <span
          className={`text-sm font-mono ${healthStatus === 'ok' ? 'text-success' : healthStatus === 'missing' || healthStatus === 'corrupted' ? 'text-failure' : 'text-neutral-400'}`}
          title={
            health?.path
              ? `Binary: ${health.path}`
              : health?.status === 'missing'
                ? 'Not found on disk'
                : 'Click Refresh to detect path'
          }
        >
          {displayVersion}
        </span>
        {health?.error && (
          <p className="text-[10px] text-neutral-500 mt-0.5 truncate" title={health.error}>
            {health.error.slice(0, 80)}
            {health.error.length > 80 ? '…' : ''}
          </p>
        )}
        {updateResult && name === 'yt-dlp' && updateResult.updated && (
          <span className="text-[10px] text-process flex items-center gap-1 mt-0.5 animate-fade-in">
            <ArrowUpCircle className="w-2.5 h-2.5" />
            Updated from {updateResult.current}
          </span>
        )}
        {updateResult &&
          name === 'yt-dlp' &&
          !updateResult.updated &&
          updateResult.current === updateResult.latest &&
          updateResult.current !== 'unknown' && (
            <span className="text-[10px] text-success/70 block mt-0.5 animate-fade-in">
              Already up to date
            </span>
          )}
      </div>
      {(healthStatus === 'missing' || healthStatus === 'corrupted') && (
        <button
          type="button"
          onClick={onRepair}
          disabled={repairing}
          className="flex items-center gap-1.5 text-[11px] font-medium bg-amber-400/10 hover:bg-amber-400/20 disabled:opacity-50 text-amber-400 px-2.5 py-1 rounded transition-all duration-150"
        >
          {repairing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Download className="w-3 h-3" />
          )}
          {repairing ? 'Working…' : repoLabel}
        </button>
      )}
    </div>
  )
}

export function Settings() {
  const { settings, setSettings, loadSettings } = useAppStore()
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [ytDlpVersion, setYtDlpVersion] = useState<string | null>(null)
  const [ffmpegVersion, setFfmpegVersion] = useState<string | null>(null)
  const [ytDlpHealth, setYtDlpHealth] = useState<BinaryHealth | null>(null)
  const [ffmpegHealth, setFfmpegHealth] = useState<BinaryHealth | null>(null)
  const [healthLoading, setHealthLoading] = useState(false)
  const [repairingYtDlp, setRepairingYtDlp] = useState(false)
  const [repairingFfmpeg, setRepairingFfmpeg] = useState(false)
  const [updateChecking, setUpdateChecking] = useState(false)
  const [updateResult, setUpdateResult] = useState<{
    current: string
    latest: string
    updated: boolean
    newVersion: string
  } | null>(null)

  // ── Presets state ──
  const [presets, setPresets] = useState<Preset[]>([])
  const [presetsLoaded, setPresetsLoaded] = useState(false)

  // ── Diagnostics state ──
  const [postResults, setPostResults] = useState<PostResults | null>(null)
  const [postRunning, setPostRunning] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<DownloadSettings>({
    resolver: zodResolver(DownloadSettingsSchema),
    defaultValues: settings,
  })

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    reset(settings)
  }, [settings, reset])

  const extractAudio = watch('extractAudio')
  const namingTemplate = watch('namingTemplate')
  const basePresetId = watch('basePresetId')

  // ── Load presets on mount ──
  useEffect(() => {
    api.settings
      .getPresets()
      .then((data) => {
        setPresets(data)
        setPresetsLoaded(true)
      })
      .catch(() => setPresetsLoaded(true))
  }, [])

  // ── File naming preview ──
  const previewTemplate = (template: string): string => {
    return template
      .replace(/%\(title\)s/g, 'My Video Title')
      .replace(/%\(ext\)s/g, 'mp4')
      .replace(/%\(id\)s/g, 'dQw4w9WgXcQ')
      .replace(/%\(uploader\)s/g, 'ChannelName')
      .replace(/%\(upload_date\)s/g, '20260705')
      .replace(/%\(duration\)s/g, '212')
      .replace(/%\(resolution\)s/g, '1920x1080')
      .replace(/%\(playlist_title\)s/g, 'My Playlist')
      .replace(/%\(playlist_index\)s/g, '03')
      .replace(/%\(epoch\)s/g, '1751731200')
  }

  const onSubmit = async (data: DownloadSettings) => {
    setIsSaving(true)
    try {
      await api.settings.update(data)
      setSettings(data)
      toast.success('Settings saved successfully')
    } catch (err) {
      toast.error('Failed to save settings')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    setIsResetting(true)
    try {
      await api.settings.reset()
      const defaults = await api.settings.get()
      setSettings(defaults)
      reset(defaults)
      toast.success('Settings reset to defaults')
    } catch (err) {
      toast.error('Failed to reset settings')
      console.error(err)
    } finally {
      setIsResetting(false)
    }
  }

  const handleBrowseFolder = async () => {
    try {
      const dir = await api.dialog.openDirectory()
      if (dir) setValue('downloadPath', dir, { shouldDirty: true })
    } catch {
      toast.error('Failed to open folder dialog')
    }
  }

  const fetchHealthChecks = async () => {
    if (healthLoading) return
    setHealthLoading(true)
    try {
      const [ytHealth, ffHealth] = await Promise.all([
        api.system.checkBinaryHealth('yt-dlp'),
        api.system.checkBinaryHealth('ffmpeg'),
      ])
      setYtDlpHealth(ytHealth)
      setFfmpegHealth(ffHealth)
      // Also refresh the simple version strings from health data
      if (ytHealth.version) setYtDlpVersion(ytHealth.version)
      else if (ytHealth.status === 'missing') setYtDlpVersion('missing')
      if (ffHealth.version) setFfmpegVersion(ffHealth.version)
      else if (ffHealth.status === 'missing') setFfmpegVersion('missing')
    } catch {
      // Silently fail — health checks are non-critical
    } finally {
      setHealthLoading(false)
    }
  }

  const toggleAdvanced = () => {
    setAdvancedOpen((prev) => {
      const next = !prev
      if (next) {
        // Fetch health checks (includes exact versions) on open
        fetchHealthChecks()
      }
      return next
    })
  }

  const handleRepairYtDlp = async () => {
    setRepairingYtDlp(true)
    try {
      const result = await api.system.rebuildYtDlp()
      if (result.rebuilt) {
        setYtDlpVersion(result.version)
        toast.success(result.message)
      } else {
        toast.error(result.message || 'yt-dlp repair failed')
      }
      // Re-check health after repair
      const health = await api.system.checkBinaryHealth('yt-dlp')
      setYtDlpHealth(health)
    } catch (err: any) {
      toast.error(err?.message || 'yt-dlp repair failed')
    } finally {
      setRepairingYtDlp(false)
    }
  }

  const handleRepairFfmpeg = async () => {
    setRepairingFfmpeg(true)
    try {
      const result = await api.system.rebuildFfmpeg()
      if (result.rebuilt) {
        setFfmpegVersion(result.version)
        toast.success(result.message)
      } else {
        toast.error(result.message || 'ffmpeg repair failed')
      }
      // Re-check health after repair
      const health = await api.system.checkBinaryHealth('ffmpeg')
      setFfmpegHealth(health)
    } catch (err: any) {
      toast.error(err?.message || 'ffmpeg repair failed')
    } finally {
      setRepairingFfmpeg(false)
    }
  }

  const handleRunDiagnostics = async () => {
    setPostRunning(true)
    setPostError(null)
    setPostResults(null)
    try {
      const results = await api.system.runPost()
      setPostResults(results)
      if (results.allPassed) {
        toast.success('All diagnostics passed')
      } else {
        const fails = results.checks.filter((c) => c.status === 'fail').length
        const warns = results.checks.filter((c) => c.status === 'warning').length
        const parts: string[] = []
        if (fails > 0) parts.push(`${fails} failed`)
        if (warns > 0) parts.push(`${warns} warning${warns !== 1 ? 's' : ''}`)
        if (parts.length > 0) {
          toast.error(parts.join(', '))
        } else {
          toast.success('All diagnostics passed')
        }
      }
    } catch (err: any) {
      const msg = err?.message || 'Diagnostics failed'
      setPostError(msg)
      toast.error(msg)
    } finally {
      setPostRunning(false)
    }
  }

  const handleCheckUpdate = async () => {
    setUpdateChecking(true)
    setUpdateResult(null)
    try {
      const result = await api.system.checkYtDlpUpdate()
      setUpdateResult(result)

      // Refresh the displayed version
      if (result.updated) {
        setYtDlpVersion(result.newVersion)
        toast.success(`yt-dlp updated to ${result.newVersion}`)
      } else if (result.current === result.latest) {
        toast.success(`yt-dlp is up to date (${result.current})`)
      } else {
        toast.error('yt-dlp update failed')
      }
      // Refresh health status after update
      try {
        const health = await api.system.checkBinaryHealth('yt-dlp')
        setYtDlpHealth(health)
        if (health.version) setYtDlpVersion(health.version)
      } catch {
        // non-critical
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to check for updates')
    } finally {
      setUpdateChecking(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-sm text-neutral-500 mt-1.5">
          Configure download behaviour, output paths, and executables
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* ── Unified settings surface ────────────────────────────── */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          {/* ── Section: Download ────────────────────────────────── */}
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-2.5 pb-1">
              <span className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0">
                <HardDrive className="w-4 h-4 text-neutral-300" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-white">Download</h3>
                <p className="text-xs text-neutral-500">Output location and format preferences</p>
              </div>
            </div>

            {/* Download Path */}
            <div className="space-y-2">
              <label className="block text-[13px] font-medium text-neutral-200">
                Download directory
              </label>
              <div className="flex gap-2">
                <input
                  {...register('downloadPath')}
                  type="text"
                  placeholder="C:\Users\...\Downloads"
                  className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={handleBrowseFolder}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 rounded-lg transition-all duration-200 hover:scale-110"
                  aria-label="Browse for download folder"
                >
                  <FolderOpen className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[11px] text-neutral-600 leading-relaxed">
                Defaults to your system Downloads folder. A{' '}
                <code className="px-1 py-0.5 bg-neutral-800 rounded text-neutral-400 text-[11px] font-mono">
                  FORGEDL
                </code>{' '}
                folder with{' '}
                <code className="px-1 py-0.5 bg-neutral-800 rounded text-neutral-400 text-[11px] font-mono">
                  VIDEO
                </code>{' '}
                and{' '}
                <code className="px-1 py-0.5 bg-neutral-800 rounded text-neutral-400 text-[11px] font-mono">
                  AUDIO
                </code>{' '}
                subfolders is created automatically.
              </p>
              {errors.downloadPath && (
                <p className="text-failure text-xs">{errors.downloadPath.message}</p>
              )}
            </div>

            {/* Two-column: Output Format + Concurrent Downloads */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-neutral-200 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-neutral-400" />
                  Output format
                </label>
                <input
                  {...register('outputFormat')}
                  type="text"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-2.5 text-white text-sm font-mono placeholder-neutral-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all duration-200"
                />
                <p className="text-[11px] text-neutral-600">
                  yt-dlp format string (e.g. bestvideo+bestaudio/best)
                </p>
                {errors.outputFormat && (
                  <p className="text-failure text-xs">{errors.outputFormat.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-neutral-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-alert" />
                  Max concurrent downloads
                </label>
                <input
                  {...register('maxConcurrent', { valueAsNumber: true })}
                  type="number"
                  min={1}
                  max={20}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all duration-200"
                />
                <p className="text-[11px] text-neutral-600">Simultaneous downloads (1–20)</p>
                {errors.maxConcurrent && (
                  <p className="text-failure text-xs">{errors.maxConcurrent.message}</p>
                )}
              </div>
            </div>

            {/* Speed Limit */}
            <div className="space-y-2">
              <label className="block text-[13px] font-medium text-neutral-200 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-neutral-400" />
                Speed limit
              </label>
              <input
                {...register('speedLimit')}
                type="text"
                placeholder="Unlimited — set e.g. 1M or 500K to cap download rate"
                className="w-full sm:w-[calc(50%-12px)] bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all duration-200"
              />
              {errors.speedLimit && (
                <p className="text-red-400 text-xs">{errors.speedLimit.message}</p>
              )}
            </div>

            {/* Smart Queue Ordering */}
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  {...register('smartQueueOrdering')}
                  type="checkbox"
                  className="sr-only peer"
                />
                <div className="w-10 h-6 rounded-full bg-neutral-800 border border-neutral-700 peer-checked:bg-brand peer-checked:border-brand peer-focus:ring-2 peer-focus:ring-brand/50 peer-focus:ring-offset-1 peer-focus:ring-offset-neutral-900 transition-all duration-200" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 peer-checked:translate-x-4" />
              </div>
              <div>
                <span className="text-sm text-neutral-200 font-medium flex items-center gap-1.5">
                  <SortAsc className="w-3.5 h-3.5 text-neutral-400" />
                  Smart queue ordering
                </span>
                <span className="text-xs text-neutral-500">
                  Prioritize smaller downloads first to reduce total completion time (Shortest Job
                  First)
                </span>
              </div>
            </label>
          </div>

          {/* ── Divider ──────────────────────────────────────────── */}
          <div className="border-t border-neutral-800" />

          {/* ── Section: Audio ───────────────────────────────────── */}
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-1">
              <span className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0">
                <Volume2 className="w-4 h-4 text-neutral-300" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-white">Audio</h3>
                <p className="text-xs text-neutral-500">Extraction and metadata preferences</p>
              </div>
            </div>

            {/* Extract Audio toggle */}
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative flex-shrink-0 mt-0.5">
                <input {...register('extractAudio')} type="checkbox" className="sr-only peer" />
                <div className="w-10 h-6 rounded-full bg-neutral-800 border border-neutral-700 peer-checked:bg-brand peer-checked:border-brand peer-focus:ring-2 peer-focus:ring-brand/50 peer-focus:ring-offset-1 peer-focus:ring-offset-neutral-900 transition-all duration-200" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 peer-checked:translate-x-4" />
              </div>
              <div>
                <span className="text-sm text-neutral-200 font-medium block">
                  Extract audio only
                </span>
                <span className="text-xs text-neutral-500">
                  Convert video downloads to audio files instead
                </span>
              </div>
            </label>

            {/* Audio Format (conditional) */}
            {extractAudio && (
              <div className="mt-4 animate-fade-slide-up">
                <label className="block text-[13px] font-medium text-neutral-200 mb-2">
                  Audio format
                </label>
                <div className="flex flex-wrap gap-2">
                  {['mp3', 'aac', 'flac', 'm4a', 'opus', 'vorbis', 'wav'].map((fmt) => {
                    const currentFmt = watch('audioFormat')
                    return (
                      <label
                        key={fmt}
                        className={`px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 border peer-focus:ring-2 peer-focus:ring-brand/50 ${
                          currentFmt === fmt
                            ? 'bg-brand-muted border-brand/40 text-brand'
                            : 'bg-neutral-950 border-neutral-700 text-neutral-400 hover:border-neutral-600 hover:text-neutral-300'
                        }`}
                      >
                        <input
                          {...register('audioFormat')}
                          type="radio"
                          value={fmt}
                          className="sr-only peer"
                        />
                        {fmt.toUpperCase()}
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Embed Metadata toggle */}
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative flex-shrink-0 mt-0.5">
                <input {...register('embedMetadata')} type="checkbox" className="sr-only peer" />
                <div className="w-10 h-6 rounded-full bg-neutral-800 border border-neutral-700 peer-checked:bg-brand peer-checked:border-brand peer-focus:ring-2 peer-focus:ring-brand/50 peer-focus:ring-offset-1 peer-focus:ring-offset-neutral-900 transition-all duration-200" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 peer-checked:translate-x-4" />
              </div>
              <div>
                <span className="text-sm text-neutral-200 font-medium block">Embed metadata</span>
                <span className="text-xs text-neutral-500">
                  Include thumbnail, title, and uploader in downloaded files
                </span>
              </div>
            </label>
          </div>

          {/* ── Divider ──────────────────────────────────────────── */}
          <div className="border-t border-neutral-800" />

          {/* ── Section: File Naming ──────────────────────────── */}
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-1">
              <span className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-neutral-300" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-white">File Naming</h3>
                <p className="text-xs text-neutral-500">Customize output filename pattern</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[13px] font-medium text-neutral-200 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-neutral-400" />
                Naming template
              </label>
              <input
                {...register('namingTemplate')}
                type="text"
                placeholder="%(title)s.%(ext)s"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-2.5 text-white text-sm font-mono placeholder-neutral-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all duration-200"
              />
              {errors.namingTemplate && (
                <p className="text-failure text-xs">{errors.namingTemplate.message}</p>
              )}
            </div>

            {/* Live preview */}
            {namingTemplate && (
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 animate-fade-slide-up">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    Preview
                  </span>
                </div>
                <p className="text-sm font-mono text-success break-all">
                  {previewTemplate(namingTemplate)}
                </p>
              </div>
            )}

            {/* Available variables */}
            <details className="group">
              <summary className="text-xs text-neutral-500 hover:text-neutral-400 cursor-pointer transition-colors list-none flex items-center gap-1.5">
                <ChevronDown className="w-3 h-3 transition-transform duration-200 group-open:rotate-180" />
                Available variables
              </summary>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
                {[
                  ['%(title)s', 'Video title'],
                  ['%(ext)s', 'File extension'],
                  ['%(id)s', 'Video ID'],
                  ['%(uploader)s', 'Uploader name'],
                  ['%(upload_date)s', 'Upload date (YYYYMMDD)'],
                  ['%(duration)s', 'Duration in seconds'],
                  ['%(resolution)s', 'e.g. 1920x1080'],
                  ['%(playlist_title)s', 'Playlist name'],
                  ['%(playlist_index)s', 'Index in playlist'],
                  ['%(epoch)s', 'Unix timestamp'],
                ].map(([v, desc]) => (
                  <div key={v} className="flex items-baseline gap-1.5">
                    <code className="text-[11px] font-mono text-brand bg-brand-muted/20 px-1 py-0.5 rounded">
                      {v}
                    </code>
                    <span className="text-[10px] text-neutral-600 truncate">{desc}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>

          {/* ── Divider ──────────────────────────────────────────── */}
          <div className="border-t border-neutral-800" />

          {/* ── Section: Advanced (collapsible) ──────────────────── */}
          <div>
            <button
              type="button"
              onClick={toggleAdvanced}
              className="w-full p-6 flex items-center justify-between hover:bg-neutral-800/30 transition-colors duration-150"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0">
                  <Wrench className="w-4 h-4 text-neutral-300" />
                </span>
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-white">Advanced</h3>
                  <p className="text-xs text-neutral-500">Custom executable paths</p>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-neutral-500 transition-transform duration-200 ${
                  advancedOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <div
              className="section-collapse"
              style={{
                maxHeight: advancedOpen ? '2200px' : '0px',
                opacity: advancedOpen ? 1 : 0,
              }}
            >
              <div className="px-6 pb-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[13px] font-medium text-neutral-200 flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-neutral-400" />
                      yt-dlp path
                    </label>
                    <input
                      {...register('ytdlpPath')}
                      type="text"
                      placeholder="yt-dlp"
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-2.5 text-white text-sm font-mono placeholder-neutral-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all duration-200"
                    />
                    <p className="text-[11px] text-neutral-600">
                      Keep as{' '}
                      <code className="px-1 py-0.5 bg-neutral-800 rounded text-neutral-400 text-[11px] font-mono">
                        yt-dlp
                      </code>{' '}
                      if on system PATH
                    </p>
                    {errors.ytdlpPath && (
                      <p className="text-red-400 text-xs">{errors.ytdlpPath.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[13px] font-medium text-neutral-200 flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-neutral-400" />
                      ffmpeg path
                    </label>
                    <input
                      {...register('ffmpegPath')}
                      type="text"
                      placeholder="ffmpeg"
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-2.5 text-white text-sm font-mono placeholder-neutral-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all duration-200"
                    />
                    <p className="text-[11px] text-neutral-600">
                      Required for audio extraction and format conversion
                    </p>
                    {errors.ffmpegPath && (
                      <p className="text-red-400 text-xs">{errors.ffmpegPath.message}</p>
                    )}
                  </div>
                </div>

                {/* ── System Info Card ──────────────────────────── */}
                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-neutral-500" />
                      <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                        Detected Versions
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={fetchHealthChecks}
                        disabled={healthLoading}
                        className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 px-2.5 py-1 rounded transition-all duration-150"
                      >
                        {healthLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                        Refresh
                      </button>
                      <button
                        type="button"
                        onClick={handleCheckUpdate}
                        disabled={updateChecking}
                        className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 px-2.5 py-1 rounded transition-all duration-150"
                      >
                        {updateChecking ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <ArrowUpCircle className="w-3 h-3" />
                        )}
                        {updateChecking ? 'Updating…' : 'Update yt-dlp'}
                      </button>
                    </div>
                  </div>
                  {healthLoading && !ytDlpHealth ? (
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Checking executables…
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* yt-dlp row */}
                      <BinaryStatusRow
                        name="yt-dlp"
                        version={ytDlpVersion}
                        health={ytDlpHealth}
                        repairing={repairingYtDlp}
                        onRepair={handleRepairYtDlp}
                        updateResult={updateResult}
                      />
                      {/* ffmpeg row */}
                      <BinaryStatusRow
                        name="ffmpeg"
                        version={ffmpegVersion}
                        health={ffmpegHealth}
                        repairing={repairingFfmpeg}
                        onRepair={handleRepairFfmpeg}
                      />
                    </div>
                  )}
                </div>

                {/* ── Base Preset Selector ──────────────────────── */}
                {presetsLoaded && presets.length > 0 && (
                  <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                        Default Preset
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-600 mb-3">
                      Automatically apply this preset to every new download. Override per-download
                      via Advanced Options.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setValue('basePresetId', '', { shouldDirty: true })}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 border ${
                          !basePresetId
                            ? 'bg-brand-muted border-brand/40 text-brand'
                            : 'bg-transparent border-neutral-700 text-neutral-400 hover:border-neutral-600 hover:text-neutral-300'
                        }`}
                      >
                        None
                      </button>
                      {presets.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setValue('basePresetId', p.id, { shouldDirty: true })}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 border hover:scale-105 active:scale-95 ${
                            basePresetId === p.id
                              ? 'bg-brand-muted border-brand/40 text-brand'
                              : 'bg-transparent border-neutral-700 text-neutral-400 hover:border-neutral-600 hover:text-neutral-300'
                          }`}
                          title={p.outputFormat ? `Format: ${p.outputFormat}` : 'Custom flags only'}
                        >
                          <Bookmark className="w-3 h-3 inline-block mr-1 -mt-0.5" />
                          {p.name}
                        </button>
                      ))}
                    </div>
                    {basePresetId &&
                      (() => {
                        const preset = presets.find((p) => p.id === basePresetId)
                        if (!preset) return null
                        return (
                          <div className="mt-3 pt-3 border-t border-neutral-800 flex flex-wrap gap-1.5">
                            {preset.outputFormat && (
                              <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded font-mono">
                                Format: {preset.outputFormat}
                              </span>
                            )}
                            {preset.extraFlags?.embedSubs && (
                              <span className="text-[10px] bg-brand-muted/30 text-brand/80 px-2 py-0.5 rounded">
                                +subs
                              </span>
                            )}
                            {preset.extraFlags?.subtitleLangs &&
                              preset.extraFlags.subtitleLangs.length > 0 && (
                                <span className="text-[10px] bg-brand-muted/30 text-brand/80 px-2 py-0.5 rounded">
                                  {preset.extraFlags.subtitleLangs.join(', ')}
                                </span>
                              )}
                            {preset.extraFlags?.proxy && (
                              <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded">
                                Proxy
                              </span>
                            )}
                            {preset.extraFlags?.speedLimit && (
                              <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded">
                                {preset.extraFlags.speedLimit}
                              </span>
                            )}
                            {!preset.outputFormat && !preset.extraFlags && (
                              <span className="text-[10px] text-neutral-600">
                                No overrides configured
                              </span>
                            )}
                          </div>
                        )
                      })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Diagnostics Section ──────────────────────────────── */}
        <div className="border-t border-neutral-800" />
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0">
                <Stethoscope className="w-4 h-4 text-neutral-300" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-white">Diagnostics</h3>
                <p className="text-xs text-neutral-500">
                  {postResults
                    ? postResults.allPassed
                      ? `All ${postResults.checks.length} checks passed in ${postResults.totalDurationMs}ms`
                      : `${postResults.checks.filter((c) => c.status === 'fail').length} issue${postResults.checks.filter((c) => c.status === 'fail').length !== 1 ? 's' : ''} found in ${postResults.totalDurationMs}ms`
                    : 'Verify that all system components are working correctly'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRunDiagnostics}
              disabled={postRunning}
              data-testid="run-diagnostics-btn"
              className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 font-medium py-2.5 px-5 rounded-lg text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              {postRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running…
                </>
              ) : (
                <>
                  <Stethoscope className="w-4 h-4" />
                  Run Diagnostics
                </>
              )}
            </button>
          </div>

          {/* Error state */}
          {postError && (
            <div
              data-testid="diagnostics-error"
              className="bg-failure/5 border border-failure/20 rounded-lg p-4 flex items-center gap-3"
            >
              <ShieldX className="w-5 h-5 text-failure flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-failure">Diagnostics failed to run</p>
                <p className="text-xs text-failure/70 mt-0.5">{postError}</p>
              </div>
            </div>
          )}

          {/* Results list */}
          {postResults && !postError && (
            <div
              data-testid="diagnostics-results"
              className="bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden"
            >
              {/* Summary header */}
              <div
                data-testid="diagnostics-summary"
                className={`px-4 py-3 border-b border-neutral-800 flex items-center gap-2.5 ${postResults.allPassed ? 'bg-success/5' : 'bg-failure/5'}`}
              >
                {postResults.allPassed ? (
                  <ShieldCheck className="w-4 h-4 text-success" />
                ) : (
                  <ShieldX className="w-4 h-4 text-failure" />
                )}
                <span
                  className={`text-xs font-semibold uppercase tracking-wider ${postResults.allPassed ? 'text-success' : 'text-failure'}`}
                >
                  {postResults.allPassed ? 'All systems operational' : 'Issues detected'}
                </span>
              </div>

              {/* Individual checks */}
              <div data-testid="diagnostics-checks" className="divide-y divide-neutral-800">
                {postResults.checks.map((check) => (
                  <PostCheckRow key={check.name} check={check} iconSize="sm" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Sticky action bar ──────────────────────────────────── */}
        <div className="sticky bottom-0 -mx-8 px-8 mt-8 bg-neutral-925/95 backdrop-blur-sm border-t border-neutral-800 py-4 z-10">
          <div className="max-w-3xl mx-auto flex items-center justify-end sm:justify-between">
            <p className="text-xs text-neutral-500 hidden sm:block">
              {isDirty ? 'Unsaved changes' : 'All changes saved'}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                disabled={isResetting}
                className="border border-neutral-700 hover:border-neutral-600 text-neutral-300 font-medium py-2 px-5 rounded-lg flex items-center gap-2 text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                {isResetting ? 'Resetting…' : 'Reset'}
              </button>
              <button
                type="submit"
                disabled={!isDirty || isSaving}
                className="bg-brand hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-6 rounded-lg flex items-center gap-2 text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
