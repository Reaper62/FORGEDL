import { useState, useEffect, useCallback, useRef } from 'react'
import { Loader2, ShieldCheck, ShieldX, ChevronDown, ChevronUp, RefreshCw, X } from 'lucide-react'
import { api } from '../lib/api'
import type { PostResults } from '../../shared/types'
import { PostCheckRow } from './PostCheckRow'

export function PostBanner() {
  const [results, setResults] = useState<PostResults | null>(null)
  const [running, setRunning] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runChecks = useCallback(async () => {
    setRunning(true)
    setDismissed(false)
    setError(null)
    // Clear any stale dismiss timer from a previous run
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current)
      dismissTimer.current = null
    }
    try {
      const res = await api.system.runPost()
      setResults(res)
      if (res.allPassed) {
        // Auto-dismiss after a short delay if everything passes
        dismissTimer.current = setTimeout(() => setDismissed(true), 3000)
      } else {
        setExpanded(true)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'System check failed'
      setError(msg)
      console.error('POST failed:', err)
    } finally {
      setRunning(false)
    }
  }, [])

  useEffect(() => {
    runChecks()
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current)
    }
  }, [runChecks])

  if (dismissed) return null

  const failCount = results?.checks.filter((c) => c.status === 'fail').length ?? 0
  const warnCount = results?.checks.filter((c) => c.status === 'warning').length ?? 0
  const hasIssues = failCount > 0 || warnCount > 0

  return (
    <div
      data-testid="post-banner"
      className={`border rounded-xl overflow-hidden transition-all duration-300 mb-6 ${
        error
          ? 'border-failure/30 bg-failure/5'
          : hasIssues
            ? 'border-failure/30 bg-failure/5'
            : results?.allPassed
              ? 'border-success/30 bg-success/5'
              : 'border-active/30 bg-active/5'
      }`}
    >
      {/* Header bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-white/[0.02]"
      >
        {running ? (
          <>
            <Loader2 className="w-5 h-5 text-active animate-spin" />
            <span className="text-sm font-medium text-neutral-300 flex-1">
              Running system checks...
            </span>
          </>
        ) : error ? (
          <>
            <ShieldX className="w-5 h-5 text-failure" />
            <span className="text-sm font-medium text-failure flex-1">
              System check failed: {error}
            </span>
          </>
        ) : results?.allPassed ? (
          <>
            <ShieldCheck className="w-5 h-5 text-success" />
            <span className="text-sm font-medium text-success flex-1">All systems operational</span>
            <span className="text-[11px] text-neutral-500 tabular-nums">
              {results.totalDurationMs}ms
            </span>
          </>
        ) : (
          <>
            <ShieldX className="w-5 h-5 text-failure" />
            <span className="text-sm font-medium text-failure flex-1">
              {failCount} issue{failCount !== 1 ? 's' : ''} detected
              {warnCount > 0 && `, ${warnCount} warning${warnCount !== 1 ? 's' : ''}`}
            </span>
            <span className="text-[11px] text-neutral-500 tabular-nums">
              {results?.totalDurationMs}ms
            </span>
          </>
        )}
        <div className="flex items-center gap-1">
          {!running && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                runChecks()
              }}
              data-testid="post-banner-rerun"
              className="p-1 hover:bg-neutral-800 rounded transition-colors"
              title="Re-run checks"
            >
              <RefreshCw className="w-3.5 h-3.5 text-neutral-400" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setDismissed(true)
            }}
            data-testid="post-banner-dismiss"
            className="p-1 hover:bg-neutral-800 rounded transition-colors"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5 text-neutral-500" />
          </button>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-neutral-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-neutral-500" />
          )}
        </div>
      </button>

      {/* Expanded detail list */}
      {expanded && results && (
        <div
          data-testid="post-banner-details"
          className="border-t border-neutral-800/50 px-4 py-3 space-y-2 animate-fade-slide-up"
        >
          {results.checks.map((check) => (
            <PostCheckRow key={check.name} check={check} />
          ))}
        </div>
      )}
    </div>
  )
}
