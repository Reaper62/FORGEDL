import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Wifi,
  HardDrive,
  FileCheck,
  Database,
  MonitorPlay,
  Film,
  Puzzle,
  Download,
  Info,
} from 'lucide-react'
import type { PostCheckResult } from '../../shared/types'

function getCheckIcon(name: string, iconSizeClass: string): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    'yt-dlp': <MonitorPlay className={iconSizeClass} />,
    ffmpeg: <Film className={iconSizeClass} />,
    internet: <Wifi className={iconSizeClass} />,
    'disk-space': <HardDrive className={iconSizeClass} />,
    'write-permission': <FileCheck className={iconSizeClass} />,
    database: <Database className={iconSizeClass} />,
    extractors: <Puzzle className={iconSizeClass} />,
    'download-test': <Download className={iconSizeClass} />,
  }
  return icons[name] ?? <Info className={iconSizeClass} />
}

// ── Status icon (coloured circle) ──────────────────────────────────

function PostCheckStatusIcon({ status }: { status: PostCheckResult['status'] }) {
  switch (status) {
    case 'pass':
      return <CheckCircle2 className="w-4 h-4 text-success" />
    case 'fail':
      return <XCircle className="w-4 h-4 text-failure" />
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-amber-400" />
    case 'running':
      return <Loader2 className="w-4 h-4 text-active animate-spin" />
  }
}

// ── Status badge (OK / FAIL / WARN pill) ───────────────────────────

function PostCheckStatusBadge({ status }: { status: PostCheckResult['status'] }) {
  const styles: Record<string, string> = {
    pass: 'text-success border-success/20 bg-success/5',
    fail: 'text-failure border-failure/20 bg-failure/5',
    warning: 'text-amber-400 border-amber-400/20 bg-amber-400/5',
    running: 'text-active border-active/20 bg-active/5',
  }
  const labels: Record<string, string> = {
    pass: 'OK',
    fail: 'FAIL',
    warning: 'WARN',
    running: '...',
  }
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles[status]}`}
    >
      {labels[status]}
    </span>
  )
}

// ── Full check row ─────────────────────────────────────────────────

export function PostCheckRow({
  check,
  iconSize,
}: {
  check: PostCheckResult
  iconSize?: 'sm' | 'default'
}) {
  const iconSizeClass = iconSize === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'

  const messageColor =
    check.status === 'fail'
      ? 'text-failure/80'
      : check.status === 'warning'
        ? 'text-amber-400/80'
        : 'text-neutral-500'

  const rowBg =
    check.status === 'fail'
      ? 'bg-failure/5 border border-failure/10'
      : check.status === 'warning'
        ? 'bg-amber-400/5 border border-amber-400/10'
        : 'bg-neutral-900/50 border border-neutral-800'

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 hover:bg-neutral-900/50 ${rowBg}`}
    >
      <span className="text-neutral-500 shrink-0">{getCheckIcon(check.name, iconSizeClass)}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-200">{check.label}</span>
          <PostCheckStatusBadge status={check.status} />
          <span className="text-[10px] text-neutral-600 tabular-nums ml-auto">
            {check.durationMs}ms
          </span>
        </div>
        <p
          className={`text-xs mt-0.5 truncate ${messageColor}`}
          title={check.detail ? `${check.message}\n${check.detail}` : check.message}
        >
          {check.message}
        </p>
        {check.detail && (check.status === 'fail' || check.status === 'warning') && (
          <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2" title={check.detail}>
            {check.detail}
          </p>
        )}
      </div>
      <PostCheckStatusIcon status={check.status} />
    </div>
  )
}
