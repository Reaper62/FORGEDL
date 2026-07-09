import { useState } from 'react'
import {
  Wifi,
  FileCode,
  Shield,
  FolderLock,
  Globe,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react'
import { classifyError, type ErrorCategory } from '../../shared/utilities'

// ── Local icon map (lucide icons stay in the renderer layer) ───────

const CATEGORY_ICON: Record<ErrorCategory, React.ReactNode> = {
  network: <Wifi className="w-4 h-4" />,
  format: <FileCode className="w-4 h-4" />,
  ffmpeg: <FileCode className="w-4 h-4" />,
  permissions: <FolderLock className="w-4 h-4" />,
  auth: <Shield className="w-4 h-4" />,
  geo: <Globe className="w-4 h-4" />,
  rate_limit: <AlertTriangle className="w-4 h-4" />,
  extractor: <FileCode className="w-4 h-4" />,
  disk: <FolderLock className="w-4 h-4" />,
  unknown: <Info className="w-4 h-4" />,
}

// ── Component ─────────────────────────────────────────────────────────

interface ErrorExplainerProps {
  error: string
  isExpanded?: boolean
  onFix?: (category: ErrorCategory) => void
}

export function ErrorExplainer({ error, isExpanded = false, onFix }: ErrorExplainerProps) {
  const [expanded, setExpanded] = useState(isExpanded)
  const classification = classifyError(error)

  const categoryColors: Record<ErrorCategory, string> = {
    network: 'border-orange-400/30 bg-orange-400/5',
    format: 'border-blue-400/30 bg-blue-400/5',
    ffmpeg: 'border-purple-400/30 bg-purple-400/5',
    permissions: 'border-yellow-400/30 bg-yellow-400/5',
    auth: 'border-red-400/30 bg-red-400/5',
    geo: 'border-cyan-400/30 bg-cyan-400/5',
    rate_limit: 'border-amber-400/30 bg-amber-400/5',
    extractor: 'border-slate-400/30 bg-slate-400/5',
    disk: 'border-pink-400/30 bg-pink-400/5',
    unknown: 'border-neutral-700 bg-neutral-800/30',
  }

  return (
    <div className={`rounded-lg border text-sm ${categoryColors[classification.category]}`}>
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-white/[0.02] transition-colors rounded-t-lg"
      >
        <span className="text-neutral-400 flex-shrink-0">
          {CATEGORY_ICON[classification.category]}
        </span>
        <span className="text-neutral-200 font-medium text-xs flex-1">{classification.label}</span>
        <span className="text-neutral-600 flex-shrink-0">
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </span>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-3 pt-0 space-y-2.5 animate-fade-slide-up">
          <p className="text-neutral-400 text-xs leading-relaxed">{classification.description}</p>

          <div className="bg-neutral-950/50 rounded p-2.5 border border-neutral-800/50">
            <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1">Suggestion</p>
            <p className="text-neutral-300 text-xs leading-relaxed">{classification.suggestion}</p>
          </div>

          {error && (
            <details className="group">
              <summary className="text-[10px] text-neutral-600 cursor-pointer hover:text-neutral-500 transition-colors">
                Raw error output
              </summary>
              <pre className="mt-1.5 text-xs text-neutral-500 font-mono bg-neutral-950 rounded p-2.5 max-h-32 overflow-y-auto whitespace-pre-wrap break-all">
                {error}
              </pre>
            </details>
          )}

          {onFix && classification.fixAction && (
            <button
              onClick={() => onFix(classification.category)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
            >
              {classification.fixAction}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
