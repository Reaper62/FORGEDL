import { useState, useRef, useCallback, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  ListMusic,
  XCircle,
  Download,
  CheckSquare,
  Square,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { api } from '../../lib/api'
import { toast } from 'sonner'
import type { PlaylistResult, DownloadItem } from '../../../shared/types'

interface PlaylistManagerProps {
  playlist: PlaylistResult
  /** Items already in the download queue — used to derive execution state. */
  downloads: DownloadItem[]
  onClose: () => void
}

const ROW_HEIGHT = 52

export function PlaylistManager({ playlist, downloads, onClose }: PlaylistManagerProps) {
  // ── Execution State: derive which URLs are already in the queue ───
  const queuedUrls = useMemo(() => new Set(downloads.map((d) => d.url)), [downloads])

  // ── Selection State: Set<string> keyed by stable video ID ─────────
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const lastClickedRef = useRef<number | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: playlist.items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  })

  // ── Selection helpers ──────────────────────────────────────────────

  const isSelected = useCallback((id: string) => selected.has(id), [selected])

  const isQueued = useCallback((url: string) => queuedUrls.has(url), [queuedUrls])

  const toggleOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleClick = useCallback(
    (id: string, index: number, event: React.MouseEvent) => {
      if (event.shiftKey && lastClickedRef.current !== null) {
        // Range select
        const start = Math.min(lastClickedRef.current, index)
        const end = Math.max(lastClickedRef.current, index)
        setSelected((prev) => {
          const next = new Set(prev)
          for (let i = start; i <= end; i++) {
            next.add(playlist.items[i].id)
          }
          return next
        })
      } else {
        toggleOne(id)
      }
      lastClickedRef.current = index
    },
    [toggleOne, playlist.items],
  )

  const selectAll = useCallback(() => {
    setSelected(new Set(playlist.items.map((item) => item.id)))
  }, [playlist.items])

  const deselectAll = useCallback(() => {
    setSelected(new Set())
    lastClickedRef.current = null
  }, [])

  const toggleAll = useCallback(() => {
    if (selected.size === playlist.items.length) {
      deselectAll()
    } else {
      selectAll()
    }
  }, [selected.size, playlist.items.length, selectAll, deselectAll])

  // ── Bulk download ──────────────────────────────────────────────────

  const handleDownloadSelected = useCallback(async () => {
    const urls = playlist.items
      .filter((item) => selected.has(item.id) && !queuedUrls.has(item.url))
      .map((item) => item.url)

    if (urls.length === 0) {
      toast.error('No un-queued items selected')
      return
    }

    setIsAdding(true)
    try {
      await api.download.addBatch({ urls })
      toast.success(`Added ${urls.length} download(s) to queue`)
      // Clear selection only for items that were actually dispatched
      setSelected((prev) => {
        const next = new Set(prev)
        for (const item of playlist.items) {
          if (urls.includes(item.url)) {
            next.delete(item.id)
          }
        }
        return next
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add downloads'
      toast.error(msg)
    } finally {
      setIsAdding(false)
    }
  }, [playlist.items, selected, queuedUrls])

  // ── Derived counts ─────────────────────────────────────────────────

  const errorCount = Object.keys(playlist.errors).length
  const selectedCount = selected.size
  const selectableCount = playlist.items.filter((item) => !queuedUrls.has(item.url)).length
  const allSelected = selected.size === playlist.items.length && playlist.items.length > 0

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="p-5 border-b border-neutral-800 animate-fade-slide-up">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <ListMusic className="w-5 h-5 text-neutral-500 flex-shrink-0" />
              <h3 className="text-[1.125rem] font-semibold text-white truncate">
                {playlist.metadata.title || 'Playlist'}
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {playlist.metadata.channel && (
                <span className="text-neutral-400 truncate">{playlist.metadata.channel}</span>
              )}
              <span className="text-neutral-500">
                {playlist.items.length}
                {playlist.metadata.totalExpected
                  ? ` / ${playlist.metadata.totalExpected}`
                  : ''}{' '}
                videos
              </span>
              {errorCount > 0 && (
                <span className="text-alert flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {errorCount} error{errorCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            data-testid="playlist-close-btn"
            className="p-1.5 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded transition-all duration-150 hover:rotate-90 flex-shrink-0"
            aria-label="Close playlist"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Error notices */}
        {errorCount > 0 && (
          <div className="mt-3 space-y-1 max-h-24 overflow-y-auto">
            {Object.entries(playlist.errors).map(([key, msg]) => (
              <div
                key={key}
                className="text-xs text-failure/80 bg-failure-muted/30 rounded px-2.5 py-1.5 flex items-start gap-1.5"
              >
                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span className="truncate">{msg}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-neutral-800 bg-neutral-950/50">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAll}
            data-testid="playlist-select-all"
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-all duration-150 hover:scale-105"
          >
            {allSelected ? (
              <CheckSquare className="w-3.5 h-3.5 text-brand" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
          {selectedCount > 0 && (
            <span className="text-xs text-neutral-500">{selectedCount} selected</span>
          )}
        </div>{' '}
        <button
          onClick={handleDownloadSelected}
          disabled={selectedCount === 0 || isAdding}
          data-testid="playlist-download-selected"
          className="bg-brand hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-2 px-5 rounded-lg flex items-center gap-1.5 text-xs transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
        >
          {isAdding ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          {isAdding ? 'Adding...' : `Download ${selectedCount > 0 ? selectedCount : ''}`}
        </button>
      </div>

      {/* ── Virtualized List ────────────────────────────────────── */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: Math.min(playlist.items.length * ROW_HEIGHT, 480) }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const item = playlist.items[virtualRow.index]
            const selected = isSelected(item.id)
            const queued = isQueued(item.url)

            return (
              <div
                key={item.id}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${ROW_HEIGHT}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  ...(selected
                    ? { backgroundColor: 'rgba(59, 10, 10, 0.4)' }
                    : queued
                      ? { backgroundColor: 'rgba(20, 83, 45, 0.1)' }
                      : {}),
                }}
                data-testid={`playlist-row-${item.id}`}
                className={`flex items-center gap-3 px-5 border-b border-neutral-800/50 cursor-pointer select-none transition-all duration-150 ${
                  !selected && !queued ? 'hover:bg-neutral-800/30' : ''
                }`}
                onClick={(e) => handleClick(item.id, virtualRow.index, e)}
              >
                {/* Checkbox */}
                <span className="flex-shrink-0">
                  {queued ? (
                    <CheckSquare className="w-4 h-4 text-success/60" />
                  ) : selected ? (
                    <CheckSquare className="w-4 h-4 text-brand" />
                  ) : (
                    <Square className="w-4 h-4 text-neutral-600" />
                  )}
                </span>

                {/* Thumbnail */}
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt=""
                    className="w-14 h-9 object-cover rounded flex-shrink-0 bg-neutral-950"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-14 h-9 rounded flex-shrink-0 bg-neutral-950 flex items-center justify-center">
                    <ListMusic className="w-4 h-4 text-neutral-700" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm truncate ${queued ? 'text-neutral-500' : 'text-white'}`}
                    title={item.title}
                  >
                    {item.index !== undefined && (
                      <span className="text-neutral-600 mr-1.5 text-xs tabular-nums">
                        {item.index}.
                      </span>
                    )}
                    {item.title}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">
                    {item.uploader && <span>{item.uploader}</span>}
                    {item.duration && (
                      <span>
                        {item.uploader ? ' · ' : ''}
                        {formatDuration(item.duration)}
                      </span>
                    )}
                    {queued && <span className="text-success/70 ml-2">already in queue</span>}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Footer stats ────────────────────────────────────────── */}
      <div className="px-5 py-2 border-t border-neutral-800 bg-neutral-950/50 flex items-center justify-between text-xs text-neutral-500">
        <span>
          {playlist.items.length} items · {selectableCount} available
        </span>
        {selectedCount > 0 && (
          <span>
            {selectedCount} selected ·{' '}
            <button
              onClick={deselectAll}
              className="text-neutral-400 hover:text-white underline transition-colors"
            >
              clear
            </button>
          </span>
        )}
      </div>
    </div>
  )
}

function formatDuration(seconds: number | undefined): string {
  if (seconds == null || seconds <= 0) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}
