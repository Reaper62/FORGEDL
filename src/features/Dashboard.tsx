import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Download,
  Play,
  Pause,
  RefreshCw,
  Trash2,
  FolderOpen,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Info,
  Link as LinkIcon,
  Settings2,
  ListMusic,
  Globe,
  BarChart3,
  Timer,
  GripVertical,
  Bookmark,
} from 'lucide-react'
import { api } from '../lib/api'
import {
  DownloadItem,
  QueueStats,
  VideoMetadata,
  PlaylistResult,
  ExtraFlags,
} from '../../shared/types'
import { toast } from 'sonner'
import { useDropzone } from 'react-dropzone'
import { useAppStore } from '../store'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { PlaylistManager } from './Dashboard/PlaylistManager'
import { AdvancedDrawer } from './Dashboard/AdvancedDrawer'
import { PresetSelector } from './Dashboard/PresetSelector'
import { DownloadModeSelector } from './Dashboard/DownloadModeSelector'
import { CommandPalette } from '../components/CommandPalette'
import { DownloadContextMenu } from '../components/DownloadContextMenu'
import { DownloadProgressChart } from '../components/DownloadProgressChart'
import { ErrorExplainer } from '../components/ErrorExplainer'
import { FormatInspector } from '../components/FormatInspector'
import { RecoveryCenter } from '../components/RecoveryCenter'
import { LogViewer } from '../components/LogViewer'

type DownloadStatus = DownloadItem['status']

const STATUS_CONFIG: Record<
  DownloadStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  waiting: { label: 'Waiting', color: 'text-alert', icon: <Clock className="w-3 h-3" /> },
  fetching_metadata: {
    label: 'Fetching Info',
    color: 'text-active',
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  preparing: {
    label: 'Preparing',
    color: 'text-active',
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  downloading: {
    label: 'Downloading',
    color: 'text-active',
    icon: <Download className="w-3 h-3" />,
  },
  merging: {
    label: 'Merging',
    color: 'text-process',
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  embedding: {
    label: 'Embedding Metadata',
    color: 'text-process',
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  verifying: {
    label: 'Verifying',
    color: 'text-process',
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  retrying: { label: 'Retrying', color: 'text-alert', icon: <Timer className="w-3 h-3" /> },
  completed: {
    label: 'Completed',
    color: 'text-success',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  error: { label: 'Failed', color: 'text-failure', icon: <XCircle className="w-3 h-3" /> },
  paused: { label: 'Paused', color: 'text-neutral-400', icon: <Pause className="w-3 h-3" /> },
  cancelled: {
    label: 'Cancelled',
    color: 'text-neutral-500',
    icon: <XCircle className="w-3 h-3" />,
  },
}

// ── Sortable Queue Row ─────────────────────────────────────────────

interface SortableDownloadRowProps {
  item: DownloadItem
  progress: { progress: number; speed?: string; eta?: string } | undefined
  onPause: (id: string) => void
  onResume: (id: string) => void
  onRetry: (id: string) => void
  onCancel: (id: string) => void
  onRemove: (id: string) => void
  onOpenFolder: (path?: string) => void
  onFixError: (category: string) => void
}

function SortableDownloadRow({
  item,
  progress: live,
  onPause,
  onResume,
  onRetry,
  onCancel,
  onRemove,
  onOpenFolder,
  onFixError,
}: SortableDownloadRowProps) {
  const isWaiting = item.status === 'waiting'
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !isWaiting,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
    zIndex: isDragging ? 50 : undefined,
  }

  const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.waiting
  const progressData = live || { progress: item.progress, speed: item.speed, eta: item.eta }
  const isActive = [
    'downloading',
    'fetching_metadata',
    'preparing',
    'merging',
    'embedding',
    'verifying',
    'retrying',
  ].includes(item.status)
  const isDownloading = item.status === 'downloading'
  const isRetrying = item.status === 'retrying'
  const isError = item.status === 'error'

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <DownloadContextMenu
        item={item}
        onPause={onPause}
        onResume={onResume}
        onRetry={onRetry}
        onCancel={onCancel}
        onRemove={onRemove}
        onOpenFolder={onOpenFolder}
        onInspect={() => {}}
      >
        <div
          className={`bg-neutral-950 border rounded-lg p-4 flex gap-3 group hover:shadow-lg transition-all duration-200 ${
            isDragging ? 'shadow-xl border-brand/50 scale-[1.02]' : ''
          } ${
            isError
              ? 'border-failure/30 hover:border-failure/50'
              : 'border-neutral-800 hover:border-neutral-700'
          }`}
          title={item.error || undefined}
        >
          {/* Drag handle — only for waiting items; spacer for others */}
          {isWaiting ? (
            <button
              {...listeners}
              className="flex-shrink-0 self-stretch flex items-center justify-center w-5 text-neutral-600 hover:text-neutral-300 transition-colors cursor-grab active:cursor-grabbing rounded hover:bg-neutral-800/50 -ml-1"
              aria-label={`Drag to reorder ${item.title || item.url}`}
              title="Drag to reorder"
            >
              <GripVertical className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex-shrink-0 w-5" />
          )}

          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-white truncate">{item.title || item.url}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {statusCfg.icon}
                  <span
                    className={`text-[11px] font-medium uppercase tracking-wider ${statusCfg.color}`}
                  >
                    {statusCfg.label}
                  </span>
                </div>
              </div>

              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex-shrink-0">
                {item.status === 'downloading' && (
                  <button
                    onClick={() => onPause(item.id)}
                    className="p-1.5 hover:bg-neutral-800 rounded text-neutral-500 hover:text-white transition-all duration-150 hover:scale-110"
                    aria-label="Pause"
                    title="Pause"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                )}
                {item.status === 'paused' && (
                  <button
                    onClick={() => onResume(item.id)}
                    className="p-1.5 hover:bg-neutral-800 rounded text-neutral-500 hover:text-white transition-all duration-150 hover:scale-110"
                    aria-label="Resume"
                    title="Resume"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}
                {item.status === 'error' && (
                  <button
                    onClick={() => onRetry(item.id)}
                    className="p-1.5 hover:bg-neutral-800 rounded text-neutral-500 hover:text-white transition-all duration-150 hover:scale-110"
                    aria-label="Retry"
                    title="Retry"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => onRemove(item.id)}
                  className="p-1.5 hover:bg-failure/10 rounded text-neutral-500 hover:text-failure transition-all duration-150 hover:scale-110"
                  aria-label="Remove"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isActive && (
              <div className="space-y-2">
                <div
                  className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={Math.round(progressData.progress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ease-out progress-bar-shimmer ${
                      item.status === 'downloading' ? 'bg-active' : 'bg-process'
                    }`}
                    style={{ width: `${Math.min(progressData.progress, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-neutral-500 font-medium tracking-wide">
                  <span>{Math.round(progressData.progress)}%</span>
                  <span className="flex gap-3">
                    {progressData.speed && <span>{progressData.speed}</span>}
                    {progressData.eta && <span>ETA {progressData.eta}</span>}
                  </span>
                </div>

                {isDownloading && progressData.progress > 0 && (
                  <DownloadProgressChart downloadId={item.id} className="mt-1" />
                )}
              </div>
            )}

            {/* Retry countdown badge */}
            {isRetrying && (
              <div className="mt-2 p-2.5 bg-alert-muted border border-alert/20 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-alert">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span className="font-medium">Auto-retrying</span>
                  <span className="text-neutral-400 font-mono">
                    {(() => {
                      const m = item.error?.match(/\[AUTO-RETRY (\d+)\/(\d+)\]/)
                      return m ? `Attempt ${m[1]} of ${m[2]}` : 'Backing off…'
                    })()}
                  </span>
                </div>
                {item.error &&
                  (() => {
                    const m = item.error.match(/\[AUTO-RETRY (\d+)\/(\d+)\]/)
                    const max = m ? parseInt(m[2]) : 3
                    const current = m ? parseInt(m[1]) : 1
                    const pct = Math.round((current / max) * 100)
                    return (
                      <div className="mt-1.5 w-full bg-neutral-800 rounded-full h-1 overflow-hidden">
                        <div
                          className="h-1 rounded-full bg-alert progress-bar-shimmer"
                          style={{ width: `${pct}%`, transition: 'width 0.5s ease-out' }}
                        />
                      </div>
                    )
                  })()}
              </div>
            )}

            {/* Real-time log stream viewer */}
            {isActive && <LogViewer downloadId={item.id} className="mt-2" />}

            {/* Error explainer for failed downloads */}
            {isError && item.error && <ErrorExplainer error={item.error} onFix={onFixError} />}
          </div>
        </div>
      </DownloadContextMenu>
    </div>
  )
}

// ── Base preset helper (shared between mount effect and post-download reset) ─

async function applyBasePreset(
  baseId: string | undefined,
  setFormat: (format: string) => void,
  setFlags: (flags: ExtraFlags) => void,
  setName: (name: string | null) => void,
): Promise<boolean> {
  if (!baseId) {
    return false
  }
  try {
    const presetList = await api.settings.getPresets()
    const preset = presetList.find((p) => p.id === baseId)
    if (preset) {
      setFormat(preset.outputFormat ?? 'bestvideo+bestaudio/best')
      setFlags(preset.extraFlags ?? {})
      setName(preset.name)
      return true
    }
    setName(null)
    return false
  } catch {
    setName(null)
    return false
  }
}

export function Dashboard() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null)
  const [playlistData, setPlaylistData] = useState<PlaylistResult | null>(null)
  const [downloads, setDownloads] = useState<DownloadItem[]>([])
  const [stats, setStats] = useState<QueueStats>({
    total: 0,
    downloading: 0,
    waiting: 0,
    completed: 0,
    failed: 0,
  })
  const [progresses, setProgresses] = useState<
    Record<string, { progress: number; speed?: string; eta?: string }>
  >({})
  const [selectedFormat, setSelectedFormat] = useState('bestvideo+bestaudio/best')
  const [confirmClear, setConfirmClear] = useState(false)
  const [queueLoading, setQueueLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [extraFlags, setExtraFlags] = useState<ExtraFlags>({})
  const [basePresetName, setBasePresetName] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingFlags, setEditingFlags] = useState<ExtraFlags>({})

  const storeSettings = useAppStore((s) => s.settings)
  const inputRef = useRef<HTMLInputElement>(null)
  const subRef = useRef<Map<string, () => void>>(new Map())
  const navigate = useNavigate()

  const fetchQueueData = useCallback(async () => {
    try {
      const items = await api.download.getAll()
      setDownloads(items)
      const qStats = await api.download.getQueueStats()
      setStats(qStats)
    } catch (err) {
      console.error('Failed to load queue data:', err)
    } finally {
      setQueueLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQueueData()
    const unsubscribeQueue = api.on('queue:changed', () => {
      fetchQueueData()
    })
    return () => {
      unsubscribeQueue()
    }
  }, [fetchQueueData])

  // ── Auto-apply base preset on mount ────────────────────────────
  useEffect(() => {
    applyBasePreset(storeSettings.basePresetId, setSelectedFormat, setExtraFlags, setBasePresetName)
  }, [storeSettings.basePresetId])

  useEffect(() => {
    const activeIds = new Set(downloads.filter((d) => d.status === 'downloading').map((d) => d.id))

    // Unsubscribe from IDs that are no longer active
    for (const [id, unsub] of subRef.current) {
      if (!activeIds.has(id)) {
        unsub()
        subRef.current.delete(id)
      }
    }

    // Subscribe to new IDs that aren't already tracked
    for (const id of activeIds) {
      if (!subRef.current.has(id)) {
        const unsub = api.on(`download:progress:${id}`, (data: any) => {
          setProgresses((prev) => ({
            ...prev,
            [id]: { progress: data.progress, speed: data.speed, eta: data.eta },
          }))
        })
        subRef.current.set(id, unsub)
      }
    }
  }, [downloads])

  // Full cleanup only on unmount
  useEffect(() => {
    return () => {
      subRef.current.forEach((unsub) => unsub())
      subRef.current.clear()
    }
  }, [])

  type UrlType = 'single' | 'playlist' | 'channel' | 'batch'

  const classifyUrl = (str: string): UrlType | null => {
    try {
      // Multi-line input = batch
      const lines = str
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean)
      if (lines.length > 1) return 'batch'

      const u = new URL(str)
      if (/\/channel\//i.test(u.pathname) || /\/@/i.test(u.pathname) || /\/c\//i.test(u.pathname)) {
        return 'channel'
      }
      if (u.pathname.includes('/playlist') || u.searchParams.has('list')) {
        return 'playlist'
      }
      return 'single'
    } catch {
      return null
    }
  }

  const isPlaylistUrl = (str: string): boolean => {
    const t = classifyUrl(str)
    return t === 'playlist' || t === 'channel'
  }

  const isValidUrl = (str: string) => {
    try {
      new URL(str)
      return true
    } catch {
      return false
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text').trim()
    const urlType = classifyUrl(pastedText)
    if (urlType === 'batch') {
      // Multiple URLs pasted — auto-add to queue with storage check
      const urls = pastedText
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter((u) => isValidUrl(u))
      if (urls.length > 0) {
        setUrl('')
        handleBatchAddWithStorageCheck(urls)
      }
    } else if (urlType && isValidUrl(pastedText)) {
      setTimeout(() => {
        handleFetchInfo(pastedText)
      }, 0)
    }
  }

  // ── Storage-aware batch add ──────────────────────────────────
  const handleBatchAddWithStorageCheck = async (urls: string[]) => {
    try {
      // Non-blocking: estimate total size in background while adding
      api.download
        .addBatch({ urls })
        .then((items) => {
          const skipped = urls.length - items.length
          if (skipped > 0) {
            toast.success(
              `Added ${items.length} URLs — ${skipped} duplicate${skipped !== 1 ? 's' : ''} skipped`,
            )
          } else {
            toast.success(`Added ${urls.length} URLs to queue`)
          }
        })
        .catch((err: any) => toast.error(err?.message || 'Failed to add batch'))

      // Estimate storage needs in background
      try {
        const estimate = await api.download.estimateBatchSize(urls)
        if (estimate.estimatedBytes > 0) {
          const forgedlPath = await api.system.getForgedlBasePath()
          const disk = await api.system.getDiskSpace(forgedlPath)
          const estimatedMB = (estimate.estimatedBytes / (1024 * 1024)).toFixed(0)
          const freeMB = (disk.free / (1024 * 1024)).toFixed(0)

          if (estimate.estimatedBytes > disk.free * 0.8) {
            toast.warning(
              `Estimated ~${estimatedMB} MB needed. Only ${freeMB} MB free. Consider freeing space.`,
              { duration: 8000 },
            )
          }
        }
      } catch {
        // Storage check is non-critical — silently ignore failures
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add batch')
    }
  }

  const handleDownload = async () => {
    if (!url || !isValidUrl(url)) {
      toast.error('Please enter a valid URL')
      return
    }
    setLoading(true)
    try {
      await api.download.add({ url, extraFlags: hasActiveFlags ? extraFlags : undefined })
      setUrl('')
      setMetadata(null)
      // Re-apply base preset if active, otherwise reset only format
      const applied = await applyBasePreset(
        storeSettings.basePresetId,
        setSelectedFormat,
        setExtraFlags,
        setBasePresetName,
      )
      if (!applied) {
        setSelectedFormat('bestvideo+bestaudio/best')
      }
      toast.success('Download added to queue')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to start download')
    } finally {
      setLoading(false)
    }
  }

  const handleFetchInfo = async (targetUrl = url) => {
    if (!targetUrl || !isValidUrl(targetUrl)) return
    setLoading(true)
    setMetadata(null)
    setPlaylistData(null)

    if (isPlaylistUrl(targetUrl)) {
      try {
        const data = await api.download.fetchPlaylist(targetUrl)
        setPlaylistData(data)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch playlist'
        toast.error(msg)
      } finally {
        setLoading(false)
      }
    } else {
      try {
        const data = await api.download.fetchMetadata(targetUrl)
        setMetadata(data)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch metadata'
        toast.error(msg)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleFetchMetadata = async (targetUrl = url) => {
    await handleFetchInfo(targetUrl)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && url) {
      e.preventDefault()
      handleDownload()
    } else if (e.key === 'Enter' && e.shiftKey && url) {
      e.preventDefault()
      handleFetchMetadata()
    }
  }

  const handleOpenFolder = async (folderPath?: string) => {
    if (folderPath) {
      await api.system.openFolder(folderPath)
      return
    }
    const forgedlPath = await api.system.getForgedlBasePath()
    await api.system.openFolder(forgedlPath)
  }

  const onDrop = useCallback((_acceptedFiles: any, _fileRejections: any, event: any) => {
    const droppedUrl =
      event.dataTransfer?.getData('text/plain') || event.dataTransfer?.getData('text/uri-list')
    if (droppedUrl && isValidUrl(droppedUrl)) {
      setUrl(droppedUrl)
      handleFetchMetadata(droppedUrl)
    }
  }, [])

  const hasActiveFlags = Object.keys(extraFlags).length > 0

  // ── Command palette action handlers ────────────────────────────
  const handlePauseAll = useCallback(() => {
    downloads.filter((d) => d.status === 'downloading').forEach((d) => api.download.pause(d.id))
    toast.success('Pausing all active downloads')
  }, [downloads])

  const handleResumeAll = useCallback(() => {
    downloads.filter((d) => d.status === 'paused').forEach((d) => api.download.resume(d.id))
    toast.success('Resuming all paused downloads')
  }, [downloads])

  const handleRetryAllFailed = useCallback(() => {
    const failed = downloads.filter((d) => d.status === 'error')
    failed.forEach((d) => api.download.retry(d.id))
    toast.success(`Retrying ${failed.length} failed download${failed.length !== 1 ? 's' : ''}`)
  }, [downloads])

  const handleRetrySpecificIds = useCallback((ids: string[]) => {
    ids.forEach((id) => api.download.retry(id))
    toast.success(`Retrying ${ids.length} download${ids.length !== 1 ? 's' : ''}`)
  }, [])

  const handleRunDiagnostics = useCallback(async () => {
    try {
      const results = await api.system.runPost()
      if (results.allPassed) {
        toast.success('All diagnostics passed')
      } else {
        const fails = results.checks.filter((c) => c.status === 'fail').length
        toast.error(`${fails} diagnostic check(s) failed`)
      }
    } catch (err: any) {
      toast.error(err?.message || 'Diagnostics failed')
    }
  }, [])

  // ── Edit per-download settings ────────────────────────────────
  const handleEditSettings = useCallback(async (id: string) => {
    try {
      const flags = await api.download.getExtraFlags(id)
      setEditingId(id)
      setEditingFlags(flags ?? {})
      setDrawerOpen(true)
    } catch {
      toast.error('Failed to load download settings')
    }
  }, [])

  const handleApplyEditFlags = useCallback(
    async (flags: ExtraFlags) => {
      if (!editingId) return
      try {
        await api.download.updateExtraFlags(editingId, flags)
        toast.success('Settings updated')
        setDrawerOpen(false)
        setEditingId(null)
        setEditingFlags({})
      } catch (err: any) {
        toast.error(err?.message || 'Failed to update settings')
      }
    },
    [editingId],
  )

  const urlType = classifyUrl(url)

  // ── Drag-and-drop sensors ───────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      // Only reorder waiting items — find the dragged item
      const draggedItem = downloads.find((d) => d.id === active.id)
      if (!draggedItem || draggedItem.status !== 'waiting') return

      // Compute new index among waiting items
      const waitingIds = downloads.filter((d) => d.status === 'waiting').map((d) => d.id)
      const overIdx = waitingIds.indexOf(String(over.id))
      if (overIdx === -1) {
        // Dropped on a non-waiting item — find nearest waiting item
        const allIds = downloads.map((d) => d.id)
        const overAllIdx = allIds.indexOf(String(over.id))
        if (overAllIdx === -1) return
        // Find the closest waiting item above or below the drop target
        let closestWaitingIdx = -1
        for (let i = overAllIdx; i >= 0; i--) {
          const id = allIds[i]
          const d = downloads.find((dd) => dd.id === id)
          if (d?.status === 'waiting') {
            closestWaitingIdx = waitingIds.indexOf(id)
            break
          }
        }
        if (closestWaitingIdx === -1) {
          for (let i = overAllIdx; i < allIds.length; i++) {
            const id = allIds[i]
            const d = downloads.find((dd) => dd.id === id)
            if (d?.status === 'waiting') {
              closestWaitingIdx = waitingIds.indexOf(id)
              break
            }
          }
        }
        if (closestWaitingIdx === -1) return
        void api.download.reorderToPosition(String(active.id), closestWaitingIdx)
        return
      }
      void api.download.reorderToPosition(String(active.id), overIdx)
    },
    [downloads],
  )

  const { getRootProps, isDragActive } = useDropzone({ onDrop, noClick: true, noKeyboard: true })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Command Palette — Ctrl+K */}
      <CommandPalette
        downloadCount={downloads.length}
        activeCount={stats.downloading}
        failedCount={stats.failed}
        onOpenDownloadsFolder={() => handleOpenFolder()}
        onClearCompleted={async () => {
          await api.download.clearCompleted()
          toast.success('Completed downloads cleared')
        }}
        onRetryAllFailed={handleRetryAllFailed}
        onPauseAll={handlePauseAll}
        onResumeAll={handleResumeAll}
        onRunDiagnostics={handleRunDiagnostics}
      />
      <div
        {...getRootProps()}
        className={`bg-neutral-900 border ${isDragActive ? 'border-brand border-dashed bg-neutral-900/50 scale-[1.01]' : 'border-neutral-800'} rounded-xl p-8 transition-all duration-200 relative`}
      >
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                <Download className="w-5 h-5 text-neutral-500" />
                New Download
                {basePresetName && (
                  <span
                    data-testid="base-preset-badge"
                    className="text-[10px] font-medium bg-brand-muted/30 border border-brand/30 text-brand/90 px-2 py-0.5 rounded-full flex items-center gap-1"
                  >
                    <Bookmark className="w-3 h-3" />
                    {basePresetName}
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-500">
                Paste a media link, or drag and drop it here. Press{' '}
                <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-400 text-xs font-mono">
                  Ctrl+K
                </kbd>{' '}
                to focus.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                ref={inputRef}
                type="text"
                data-testid="download-url-input"
                placeholder={
                  urlType === 'playlist'
                    ? 'Playlist detected — press Enter to download all'
                    : urlType === 'channel'
                      ? 'Channel detected — press Enter to download'
                      : 'https://www.youtube.com/watch?v=... — or paste multiple URLs'
                }
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg pl-11 pr-4 py-3.5 text-white placeholder-neutral-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 text-sm transition-all duration-200"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
              />
              {/* URL type badge */}
              {urlType && isValidUrl(url) && (
                <span
                  className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    urlType === 'playlist'
                      ? 'text-process border-process/30 bg-process/5'
                      : urlType === 'channel'
                        ? 'text-active border-active/30 bg-active/5'
                        : urlType === 'batch'
                          ? 'text-alert border-alert/30 bg-alert/5'
                          : 'text-neutral-500 border-neutral-700 bg-neutral-900'
                  }`}
                >
                  {urlType === 'playlist' && (
                    <>
                      <ListMusic className="w-2.5 h-2.5 inline-block mr-1" />
                      Playlist
                    </>
                  )}
                  {urlType === 'channel' && (
                    <>
                      <Globe className="w-2.5 h-2.5 inline-block mr-1" />
                      Channel
                    </>
                  )}
                  {urlType === 'batch' && (
                    <>
                      <BarChart3 className="w-2.5 h-2.5 inline-block mr-1" />
                      Batch
                    </>
                  )}
                  {urlType === 'single' && 'Single'}
                </span>
              )}
            </div>
            <button
              onClick={() => setDrawerOpen(true)}
              data-testid="advanced-options-btn"
              className={`border py-3.5 px-3 rounded-lg flex items-center justify-center gap-1.5 text-sm transition-all duration-200 shrink-0 hover:scale-105 ${
                hasActiveFlags
                  ? 'bg-brand-muted border-brand/40 text-brand'
                  : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-400'
              }`}
              title="Advanced download options"
              aria-label="Advanced options"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              disabled={loading || !url || !isValidUrl(url)}
              data-testid="download-btn"
              className="bg-brand hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3.5 px-8 rounded-lg flex items-center gap-2 text-sm transition-all duration-200 shrink-0 hover:scale-[1.03] active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download
            </button>
          </div>
          {url && !isValidUrl(url) && !classifyUrl(url) && (
            <p className="text-failure text-xs">Please enter a valid URL.</p>
          )}
          {url && classifyUrl(url) === 'batch' && (
            <p className="text-alert text-xs flex items-center gap-1.5">
              <ListMusic className="w-3 h-3" />
              Multiple URLs detected — paste or type comma-separated links to batch-import
            </p>
          )}
        </div>
      </div>

      {/* Playlist Manager */}
      {playlistData && (
        <PlaylistManager
          playlist={playlistData}
          downloads={downloads}
          onClose={() => setPlaylistData(null)}
        />
      )}

      {/* Format Inspector Panel */}
      {!playlistData && metadata && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden animate-fade-slide-up">
          {/* Metadata header */}
          <div className="p-5 border-b border-neutral-800 flex gap-5">
            {metadata.thumbnail ? (
              <img
                src={metadata.thumbnail}
                alt={metadata.title}
                className="w-40 h-24 object-cover rounded-lg bg-neutral-950 flex-shrink-0"
              />
            ) : (
              <div className="w-40 h-24 bg-neutral-950 flex items-center justify-center rounded-lg flex-shrink-0">
                <Info className="w-5 h-5 text-neutral-700" />
              </div>
            )}
            <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between">
              <div>
                <p
                  className="font-semibold text-base text-white truncate font-grotesk tracking-tight"
                  title={metadata.title}
                >
                  {metadata.title}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                  {metadata.uploader && <span>{metadata.uploader}</span>}
                  {metadata.duration && (
                    <span>
                      {Math.floor(metadata.duration / 60)}:
                      {String(Math.floor(metadata.duration % 60)).padStart(2, '0')}
                    </span>
                  )}
                  {metadata.view_count && <span>{metadata.view_count.toLocaleString()} views</span>}
                </div>
              </div>
              <div className="mt-2">
                <DownloadModeSelector
                  metadata={metadata}
                  selectedFormat={selectedFormat}
                  onSelectFormat={setSelectedFormat}
                />
              </div>
              {/* Presets */}
              <div className="mt-2 pt-2 border-t border-neutral-800">
                <PresetSelector
                  currentFormat={selectedFormat}
                  extraFlags={extraFlags}
                  onApply={(format, flags) => {
                    setSelectedFormat(format)
                    setExtraFlags(flags)
                  }}
                />
              </div>
            </div>
            <button
              onClick={() => setMetadata(null)}
              data-testid="metadata-close-btn"
              className="self-start p-1.5 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded transition-all duration-150 hover:rotate-90"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Full codec inspector */}
          <FormatInspector
            metadata={metadata}
            selectedFormat={selectedFormat}
            onSelectFormat={setSelectedFormat}
          />
        </div>
      )}

      {/* Queue Section (hidden when playlist manager is open to save space) */}
      {!playlistData && (
        <div
          data-testid="queue-section"
          className="bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col min-h-[440px]"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b border-neutral-800 gap-4">
            <div className="flex items-center gap-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Play className="w-4 h-4 text-neutral-500" />
                Queue
              </h3>

              {/* Inline Stats Strip */}
              <div className="flex gap-4 text-xs font-medium">
                {stats.downloading > 0 && (
                  <span className="text-active">{stats.downloading} downloading</span>
                )}
                {stats.waiting > 0 && <span className="text-alert">{stats.waiting} waiting</span>}
                {stats.failed > 0 && <span className="text-failure">{stats.failed} failed</span>}
                {stats.completed > 0 && (
                  <span className="text-success">{stats.completed} completed</span>
                )}
                {stats.total === 0 && <span className="text-neutral-500">0 items</span>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenFolder()}
                data-testid="open-folder-btn"
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-2 px-3 rounded flex items-center justify-center gap-1.5 text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                Open Folder
              </button>

              {confirmClear ? (
                <div className="flex items-center gap-1 bg-failure-muted border border-failure/30 rounded px-1 py-1">
                  <button
                    onClick={async () => {
                      await api.download.clearCompleted()
                      setConfirmClear(false)
                      toast.success('Completed downloads cleared')
                    }}
                    data-testid="confirm-clear-btn"
                    className="bg-failure/20 hover:bg-failure/40 text-failure py-1 px-3 rounded text-xs transition-all duration-200 font-medium"
                  >
                    Confirm Clear
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    data-testid="cancel-clear-btn"
                    className="text-neutral-400 hover:text-white px-2 rounded text-xs transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  data-testid="clear-completed-btn"
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-2 px-3 rounded flex items-center justify-center gap-1.5 text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Completed
                </button>
              )}
            </div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={downloads.map((d) => d.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex-1 p-6 space-y-2">
                {queueLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-16 animate-pulse">
                    <div className="w-full max-w-2xl h-16 bg-neutral-800/50 rounded-lg mb-2"></div>
                    <div className="w-full max-w-2xl h-16 bg-neutral-800/30 rounded-lg mb-2"></div>
                    <div className="w-full max-w-2xl h-16 bg-neutral-800/20 rounded-lg"></div>
                  </div>
                ) : downloads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-16">
                    <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center mb-3">
                      <Download className="w-6 h-6 text-neutral-600" />
                    </div>
                    <p className="text-neutral-500 font-medium">Queue is empty</p>
                    <p className="text-xs text-neutral-600 mt-1">Add a URL above to get started</p>
                  </div>
                ) : (
                  downloads.map((item) => (
                    <SortableDownloadRow
                      key={item.id}
                      item={item}
                      progress={progresses[item.id]}
                      onPause={(id) => api.download.pause(id)}
                      onResume={(id) => api.download.resume(id)}
                      onRetry={(id) => api.download.retry(id)}
                      onCancel={(id) => api.download.cancel(id)}
                      onRemove={(id) => api.download.remove(id)}
                      onOpenFolder={(path) => handleOpenFolder(path)}
                      onFixError={(category) => {
                        if (category === 'ffmpeg' || category === 'permissions') {
                          navigate({ to: '/settings' })
                        } else if (category === 'auth') {
                          setDrawerOpen(true)
                        } else if (category === 'format') {
                          handleFetchInfo(item.url)
                        } else {
                          api.download.retry(item.id)
                        }
                      }}
                    />
                  ))
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Failed Download Recovery Center */}
      {stats.failed > 0 && !playlistData && (
        <RecoveryCenter
          failedItems={downloads.filter((d) => d.status === 'error')}
          onRetry={handleRetrySpecificIds}
          onRetryAll={handleRetryAllFailed}
        />
      )}

      {/* Advanced Drawer */}
      <AdvancedDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        flags={extraFlags}
        onApply={(flags) => setExtraFlags(flags)}
        onReset={() => setExtraFlags({})}
      />
    </div>
  )
}
