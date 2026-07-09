import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuPortal,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@radix-ui/react-context-menu'
import {
  Play,
  Pause,
  RefreshCw,
  Trash2,
  FolderOpen,
  Copy,
  ExternalLink,
  Info,
  XCircle,
  CheckCircle2,
  Settings2,
} from 'lucide-react'
import type { DownloadItem } from '../../shared/types'

interface DownloadContextMenuProps {
  item: DownloadItem
  children: React.ReactNode
  onPause?: (id: string) => void
  onResume?: (id: string) => void
  onRetry?: (id: string) => void
  onCancel?: (id: string) => void
  onRemove?: (id: string) => void
  onOpenFolder?: (path?: string) => void
  onCopyUrl?: (url: string) => void
  onInspect?: (item: DownloadItem) => void
  onEditSettings?: (id: string) => void
}

const menuItemClass =
  'flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-200 cursor-pointer outline-none data-[highlighted]:bg-neutral-800 data-[highlighted]:text-white transition-colors duration-75'
const menuSeparatorClass = 'h-px bg-neutral-800 my-1'

export function DownloadContextMenu({
  item,
  children,
  onPause,
  onResume,
  onRetry,
  onCancel,
  onRemove,
  onOpenFolder,
  onCopyUrl,
  onInspect,
}: DownloadContextMenuProps) {
  const isPaused = item.status === 'paused'
  const isError = item.status === 'error'
  const isCompleted = item.status === 'completed'
  const isWaiting = item.status === 'waiting'
  const isActive = [
    'downloading',
    'fetching_metadata',
    'preparing',
    'merging',
    'embedding',
    'verifying',
  ].includes(item.status)
  const hasOutputPath = !!item.outputPath
  const isEditable = !isCompleted && item.status !== 'cancelled'

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(item.url).catch(() => {
      // Clipboard API might not be available; silently fail
    })
    onCopyUrl?.(item.url)
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuPortal>
        <ContextMenuContent className="min-w-[200px] bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl py-1.5 z-50 animate-scale-in overflow-hidden">
          {/* ── Lifecycle actions (state-aware) ──────────────────── */}
          {isActive && (
            <ContextMenuItem className={menuItemClass} onSelect={() => onPause?.(item.id)}>
              <Pause className="w-4 h-4 text-neutral-400" />
              Pause Download
            </ContextMenuItem>
          )}

          {isPaused && (
            <ContextMenuItem className={menuItemClass} onSelect={() => onResume?.(item.id)}>
              <Play className="w-4 h-4 text-neutral-400" />
              Resume Download
            </ContextMenuItem>
          )}

          {isError && (
            <ContextMenuItem className={menuItemClass} onSelect={() => onRetry?.(item.id)}>
              <RefreshCw className="w-4 h-4 text-neutral-400" />
              Retry Download
            </ContextMenuItem>
          )}

          {(isWaiting || isPaused) && (
            <ContextMenuItem className={menuItemClass} onSelect={() => onCancel?.(item.id)}>
              <XCircle className="w-4 h-4 text-neutral-400" />
              Cancel Download
            </ContextMenuItem>
          )}

          <ContextMenuSeparator className={menuSeparatorClass} />

          {/* ── Edit Settings (per-download overrides) ────────────── */}
          {isEditable && (
            <ContextMenuItem className={menuItemClass} onSelect={() => onEditSettings?.(item.id)}>
              <Settings2 className="w-4 h-4 text-neutral-400" />
              Edit Settings
            </ContextMenuItem>
          )}

          <ContextMenuSeparator className={menuSeparatorClass} />

          {/* ── File actions (output-specific) ───────────────────── */}
          {hasOutputPath && (
            <ContextMenuItem
              className={menuItemClass}
              onSelect={() => onOpenFolder?.(item.outputPath)}
            >
              <FolderOpen className="w-4 h-4 text-neutral-400" />
              Show in Folder
            </ContextMenuItem>
          )}

          <ContextMenuItem className={menuItemClass} onSelect={handleCopyUrl}>
            <Copy className="w-4 h-4 text-neutral-400" />
            Copy URL
          </ContextMenuItem>

          <ContextMenuItem
            className={menuItemClass}
            onSelect={() => {
              window.open(item.url, '_blank', 'noopener,noreferrer')
            }}
          >
            <ExternalLink className="w-4 h-4 text-neutral-400" />
            Open in Browser
          </ContextMenuItem>

          <ContextMenuSeparator className={menuSeparatorClass} />

          {/* ── Inspect (error details or metadata) ──────────────── */}
          {isError && item.error && (
            <ContextMenuItem className={menuItemClass} onSelect={() => onInspect?.(item)}>
              <Info className="w-4 h-4 text-neutral-400" />
              View Error Details
            </ContextMenuItem>
          )}

          {isCompleted && (
            <ContextMenuItem className={menuItemClass} onSelect={() => onInspect?.(item)}>
              <CheckCircle2 className="w-4 h-4 text-success" />
              View Details
            </ContextMenuItem>
          )}

          <ContextMenuSeparator className={menuSeparatorClass} />

          {/* ── Destructive actions ───────────────────────────────── */}
          <ContextMenuItem
            className={`${menuItemClass} text-failure data-[highlighted]:bg-failure/10 data-[highlighted]:text-failure`}
            onSelect={() => onRemove?.(item.id)}
          >
            <Trash2 className="w-4 h-4" />
            Remove from Queue
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenuPortal>
    </ContextMenu>
  )
}
