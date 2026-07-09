import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { api } from '../lib/api'
import { buildLogChannel } from '../../shared/ipc-channels'
import type { LogLine } from '../../shared/types'
import { Terminal, X, ChevronDown, ScrollText, AlertTriangle, AlertCircle } from 'lucide-react'

const MAX_LINES = 1000
const ESTIMATED_LINE_HEIGHT = 18

type FilterLevel = 'all' | 'error' | 'warn' | 'info'

const LEVEL_BADGES: Record<
  FilterLevel,
  { label: string; className: string; icon: React.ReactNode }
> = {
  all: {
    label: 'All',
    className: 'text-neutral-400 bg-neutral-800 border-neutral-700',
    icon: <ScrollText className="w-3 h-3" />,
  },
  error: {
    label: 'Errors',
    className: 'text-failure bg-failure/10 border-failure/30',
    icon: <AlertCircle className="w-3 h-3" />,
  },
  warn: {
    label: 'Warnings',
    className: 'text-alert bg-alert/10 border-alert/30',
    icon: <AlertTriangle className="w-3 h-3" />,
  },
  info: {
    label: 'Info',
    className: 'text-neutral-400 bg-neutral-800 border-neutral-700',
    icon: null,
  },
}

const LINE_COLORS: Record<string, string> = {
  error: 'text-failure',
  warn: 'text-alert',
  info: 'text-neutral-300',
}

const LINE_BG: Record<string, string> = {
  error: 'bg-failure/5',
  warn: 'bg-alert/5',
  info: '',
}

interface LogViewerProps {
  downloadId: string
  className?: string
}

export function LogViewer({ downloadId, className = '' }: LogViewerProps) {
  const [lines, setLines] = useState<LogLine[]>([])
  const [filter, setFilter] = useState<FilterLevel>('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const [search, setSearch] = useState('')
  const [isCollapsed, setIsCollapsed] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const userScrolledUp = useRef(false)

  // Subscribe to log stream
  useEffect(() => {
    const unsub = api.on(buildLogChannel(downloadId), (raw: unknown) => {
      const entry = raw as LogLine
      setLines((prev) => {
        const next = [...prev, entry]
        return next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next
      })
    })
    return () => {
      unsub()
    }
  }, [downloadId])

  // Reset log state when downloadId changes
  useEffect(() => {
    setLines([])
    setFilter('all')
    setAutoScroll(true)
    setSearch('')
    userScrolledUp.current = false
  }, [downloadId])

  // Apply filters
  const filteredLines = useMemo(() => {
    let result = lines
    if (filter !== 'all') {
      result = result.filter((l) => l.level === filter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((l) => l.line.toLowerCase().includes(q))
    }
    return result
  }, [lines, filter, search])

  // Virtualization
  const virtualizer = useVirtualizer({
    count: filteredLines.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => ESTIMATED_LINE_HEIGHT,
    overscan: 10,
  })

  // Auto-scroll: scroll to bottom when new lines arrive, unless user scrolled up
  const scrollToBottom = useCallback(() => {
    if (autoScroll && !userScrolledUp.current && containerRef.current) {
      virtualizer.scrollToIndex(filteredLines.length - 1, { align: 'end' })
    }
  }, [autoScroll, filteredLines.length, virtualizer])

  useEffect(() => {
    scrollToBottom()
  }, [lines.length, scrollToBottom])

  // Detect manual scroll to pause auto-scroll
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30
    userScrolledUp.current = !isAtBottom
    if (isAtBottom) {
      setAutoScroll(true)
    }
  }, [])

  // Filter counts
  const counts = useMemo(() => {
    const e = lines.filter((l) => l.level === 'error').length
    const w = lines.filter((l) => l.level === 'warn').length
    return { errors: e, warnings: w, total: lines.length }
  }, [lines])

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className={`flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors py-1 px-2 rounded hover:bg-neutral-800/50 ${className}`}
      >
        <Terminal className="w-3.5 h-3.5" />
        <span>View Logs</span>
        {counts.total > 0 && (
          <span className="text-[10px] font-mono text-neutral-600">({counts.total} lines)</span>
        )}
        {counts.errors > 0 && (
          <span className="text-[10px] font-mono text-failure/70">{counts.errors} err</span>
        )}
        {counts.warnings > 0 && (
          <span className="text-[10px] font-mono text-alert/70">{counts.warnings} warn</span>
        )}
      </button>
    )
  }

  return (
    <div
      className={`flex flex-col border border-neutral-800 rounded-lg overflow-hidden ${className}`}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-neutral-900 border-b border-neutral-800 flex-wrap">
        {/* Filter pills */}
        <div className="flex gap-0.5">
          {(['all', 'error', 'warn'] as FilterLevel[]).map((level) => {
            const badge = LEVEL_BADGES[level]
            const count =
              level === 'all' ? counts.total : level === 'error' ? counts.errors : counts.warnings
            return (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border transition-all duration-150 ${
                  filter === level
                    ? badge.className
                    : 'text-neutral-500 border-transparent hover:text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                {badge.icon}
                {badge.label}
                {count > 0 && <span className="opacity-60">({count})</span>}
              </button>
            )
          })}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Filter..."
            className="w-28 bg-neutral-950 border border-neutral-700 rounded px-2 py-0.5 text-[10px] text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-brand/50 font-mono"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Auto-scroll toggle */}
        <button
          onClick={() => {
            setAutoScroll(!autoScroll)
            userScrolledUp.current = false
          }}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border transition-all duration-150 ${
            autoScroll
              ? 'bg-brand/10 border-brand/30 text-brand'
              : 'text-neutral-500 border-transparent hover:text-neutral-300'
          }`}
          title={
            autoScroll ? 'Auto-scroll ON — click to pause' : 'Auto-scroll OFF — click to resume'
          }
        >
          <ChevronDown
            className={`w-3 h-3 transition-transform ${autoScroll ? '' : 'rotate-180'}`}
          />
          Auto
        </button>

        {/* Clear */}
        <button
          onClick={() => setLines([])}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 border border-transparent transition-all duration-150"
          title="Clear log"
        >
          <X className="w-3 h-3" />
          Clear
        </button>

        {/* Collapse */}
        <button
          onClick={() => setIsCollapsed(true)}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 border border-neutral-700 transition-all duration-150"
        >
          Hide
        </button>
      </div>

      {/* Log lines — virtualized */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 bg-[#0a0a0a] overflow-auto font-mono text-xs leading-relaxed"
        style={{ height: '200px', contain: 'strict' }}
      >
        {filteredLines.length === 0 ? (
          <div className="flex items-center justify-center h-full text-neutral-600 text-xs">
            {lines.length === 0 ? (
              <span className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5" />
                Waiting for output...
              </span>
            ) : (
              <span>No lines match current filter</span>
            )}
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const entry = filteredLines[virtualRow.index]
              const time = new Date(entry.timestamp).toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className={`flex gap-2 px-3 py-px ${LINE_BG[entry.level]} hover:bg-neutral-800/30 transition-colors`}
                  title={`${time} [${entry.level.toUpperCase()}]`}
                >
                  <span className="text-neutral-600 text-[10px] select-none shrink-0 w-11 text-right">
                    {time}
                  </span>
                  <span className="text-neutral-700 select-none shrink-0 w-7 text-right text-[10px] uppercase">
                    {entry.level === 'error' ? 'ERR' : entry.level === 'warn' ? 'WRN' : 'INF'}
                  </span>
                  <span className={`whitespace-pre-wrap break-all ${LINE_COLORS[entry.level]}`}>
                    {entry.line}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
