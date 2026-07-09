import { useMemo, useState, useEffect } from 'react'
import {
  RefreshCw,
  AlertTriangle,
  Shield,
  Wifi,
  FileCode,
  FolderLock,
  Globe,
  HardDrive,
  ChevronDown,
  ChevronUp,
  XCircle,
} from 'lucide-react'
import { classifyError, type ErrorCategory } from '../../shared/utilities'
import type { DownloadItem } from '../../shared/types'

// ── Config ───────────────────────────────────────────────────────────

const CATEGORY_META: Record<
  ErrorCategory,
  { label: string; icon: React.ReactNode; color: string }
> = {
  network: {
    label: 'Network Errors',
    icon: <Wifi className="w-4 h-4" />,
    color: 'text-orange-400 border-orange-400/20 bg-orange-400/5',
  },
  format: {
    label: 'Format Issues',
    icon: <FileCode className="w-4 h-4" />,
    color: 'text-blue-400 border-blue-400/20 bg-blue-400/5',
  },
  ffmpeg: {
    label: 'FFmpeg Failures',
    icon: <FileCode className="w-4 h-4" />,
    color: 'text-purple-400 border-purple-400/20 bg-purple-400/5',
  },
  permissions: {
    label: 'Permission Denied',
    icon: <FolderLock className="w-4 h-4" />,
    color: 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5',
  },
  auth: {
    label: 'Auth Required',
    icon: <Shield className="w-4 h-4" />,
    color: 'text-red-400 border-red-400/20 bg-red-400/5',
  },
  geo: {
    label: 'Geo-Restricted',
    icon: <Globe className="w-4 h-4" />,
    color: 'text-cyan-400 border-cyan-400/20 bg-cyan-400/5',
  },
  rate_limit: {
    label: 'Rate Limited',
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'text-amber-400 border-amber-400/20 bg-amber-400/5',
  },
  extractor: {
    label: 'Extraction Errors',
    icon: <FileCode className="w-4 h-4" />,
    color: 'text-slate-400 border-slate-400/20 bg-slate-400/5',
  },
  disk: {
    label: 'Disk Full',
    icon: <HardDrive className="w-4 h-4" />,
    color: 'text-pink-400 border-pink-400/20 bg-pink-400/5',
  },
  unknown: {
    label: 'Unknown Errors',
    icon: <XCircle className="w-4 h-4" />,
    color: 'text-neutral-400 border-neutral-700 bg-neutral-800/30',
  },
}

// ── Types ─────────────────────────────────────────────────────────────

interface FailedGroup {
  category: ErrorCategory
  label: string
  icon: React.ReactNode
  color: string
  items: DownloadItem[]
  suggestion: string
}

interface RecoveryCenterProps {
  failedItems: DownloadItem[]
  onRetry: (ids: string[]) => void
  onRetryAll: () => void
  className?: string
}

// ── Component ─────────────────────────────────────────────────────────

export function RecoveryCenter({
  failedItems,
  onRetry,
  onRetryAll,
  className = '',
}: RecoveryCenterProps) {
  const [expanded, setExpanded] = useState<Set<ErrorCategory>>(new Set())

  // Group failed items by error category
  const groups = useMemo((): FailedGroup[] => {
    const map = new Map<ErrorCategory, DownloadItem[]>()
    for (const item of failedItems) {
      const classification = classifyError(item.error ?? '')
      const cat = classification.category
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(item)
    }

    // Sort groups: largest first
    return [...map.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .map(([category, items]) => {
        const meta = CATEGORY_META[category]
        const classification = classifyError(items[0].error ?? '')
        return {
          category,
          label: meta.label,
          icon: meta.icon,
          color: meta.color,
          items,
          suggestion: classification.suggestion,
        }
      })
  }, [failedItems])

  // Auto-expand largest groups on first render
  useEffect(() => {
    if (groups.length > 0 && expanded.size === 0) {
      setExpanded(new Set([groups[0].category]))
    }
  }, [groups, expanded.size])

  const toggleGroup = (cat: ErrorCategory) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  if (failedItems.length === 0) return null

  return (
    <div
      className={`bg-neutral-900 border border-failure/20 rounded-xl overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-failure/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-failure/10 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-failure" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Failed Download Recovery</h3>
            <p className="text-xs text-neutral-500">
              {failedItems.length} download{failedItems.length !== 1 ? 's' : ''} failed
              {groups.length > 1 ? ` across ${groups.length} categories` : ''}
            </p>
          </div>
        </div>
        <button
          onClick={onRetryAll}
          data-testid="recovery-retry-all"
          className="flex items-center gap-1.5 bg-failure/10 hover:bg-failure/20 text-failure border border-failure/30 font-medium py-2 px-4 rounded-lg text-xs transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry All ({failedItems.length})
        </button>
      </div>

      {/* Groups */}
      <div className="divide-y divide-neutral-800">
        {groups.map((group) => {
          const isExpanded = expanded.has(group.category)
          return (
            <div key={group.category} className={group.color}>
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.category)}
                data-testid={`recovery-group-${group.category}`}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-neutral-400 flex-shrink-0">{group.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-200 font-medium">{group.label}</p>
                  <p className="text-xs text-neutral-500 truncate">
                    {group.suggestion.slice(0, 80)}
                  </p>
                </div>
                <span className="text-xs font-semibold bg-neutral-800 text-neutral-300 rounded-full px-2 py-0.5 tabular-nums">
                  {group.items.length}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRetry(group.items.map((i) => i.id))
                  }}
                  data-testid={`recovery-retry-group-${group.category}`}
                  className="flex items-center gap-1 text-[11px] font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 rounded px-2.5 py-1 transition-all duration-150 hover:scale-105"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </button>
                <span className="text-neutral-600 flex-shrink-0">
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </span>
              </button>

              {/* Expanded items */}
              {isExpanded && (
                <div className="px-4 pb-3 space-y-1 animate-fade-slide-up">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded bg-neutral-950/50 border border-neutral-800/50 text-xs"
                    >
                      <span className="text-neutral-500 truncate flex-1 min-w-0">
                        {item.title || item.url}
                      </span>
                      {(item.fileSize || item.error) && (
                        <span className="text-neutral-600 hidden sm:block tabular-nums">
                          {item.fileSize || item.error?.slice(0, 40)}
                        </span>
                      )}
                      <button
                        onClick={() => onRetry([item.id])}
                        data-testid={`recovery-retry-single-${item.id}`}
                        className="flex-shrink-0 p-1 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded transition-colors"
                        title="Retry this download"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
