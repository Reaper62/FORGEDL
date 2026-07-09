import { useState, useEffect, useCallback, useRef } from 'react'
import { Command } from 'cmdk'
import {
  Download,
  FolderOpen,
  Settings,
  Clock,
  Search,
  Trash2,
  Stethoscope,
  RefreshCw,
  LayoutDashboard,
  Pause,
  Play,
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { api } from '../lib/api'
import { toast } from 'sonner'

interface CommandPaletteProps {
  downloadCount: number
  activeCount: number
  failedCount: number
  onOpenDownloadsFolder: () => void
  onClearCompleted: () => void
  onRetryAllFailed: () => void
  onPauseAll: () => void
  onResumeAll: () => void
  onRunDiagnostics: () => void
}

interface CommandAction {
  id: string
  label: string
  icon: React.ReactNode
  keywords: string[]
  section: string
  action: () => void
  disabled?: boolean
}

export function CommandPalette({
  downloadCount,
  activeCount,
  failedCount,
  onOpenDownloadsFolder,
  onClearCompleted,
  onRetryAllFailed,
  onPauseAll,
  onResumeAll,
  onRunDiagnostics,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Ctrl+K / Cmd+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape' && open) {
        e.preventDefault()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  const navigateTo = useCallback(
    (path: string) => {
      setOpen(false)
      navigate({ to: path })
    },
    [navigate],
  )

  const actions: CommandAction[] = [
    {
      id: 'navigate-dashboard',
      label: 'Go to Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      keywords: ['home', 'main', 'download'],
      section: 'Navigation',
      action: () => navigateTo('/'),
    },
    {
      id: 'navigate-history',
      label: 'Go to Download History',
      icon: <Clock className="w-4 h-4" />,
      keywords: ['past', 'completed', 'archive'],
      section: 'Navigation',
      action: () => navigateTo('/history'),
    },
    {
      id: 'navigate-settings',
      label: 'Go to Settings',
      icon: <Settings className="w-4 h-4" />,
      keywords: ['config', 'preferences', 'options'],
      section: 'Navigation',
      action: () => navigateTo('/settings'),
    },
    {
      id: 'open-folder',
      label: 'Open Downloads Folder',
      icon: <FolderOpen className="w-4 h-4" />,
      keywords: ['directory', 'files', 'explorer', 'output'],
      section: 'Actions',
      action: () => {
        setOpen(false)
        onOpenDownloadsFolder()
      },
    },
    {
      id: 'pause-all',
      label: `Pause All (${activeCount} active)`,
      icon: <Pause className="w-4 h-4" />,
      keywords: ['stop', 'halt', 'suspend'],
      section: 'Actions',
      action: () => {
        setOpen(false)
        onPauseAll()
      },
      disabled: activeCount === 0,
    },
    {
      id: 'resume-all',
      label: 'Resume All Paused',
      icon: <Play className="w-4 h-4" />,
      keywords: ['continue', 'start', 'unpause'],
      section: 'Actions',
      action: () => {
        setOpen(false)
        onResumeAll()
      },
      disabled: downloadCount === 0,
    },
    {
      id: 'retry-failed',
      label: `Retry All Failed (${failedCount})`,
      icon: <RefreshCw className="w-4 h-4" />,
      keywords: ['redo', 'recover', 'fix'],
      section: 'Actions',
      action: () => {
        setOpen(false)
        onRetryAllFailed()
      },
      disabled: failedCount === 0,
    },
    {
      id: 'clear-completed',
      label: 'Clear Completed Downloads',
      icon: <Trash2 className="w-4 h-4" />,
      keywords: ['remove', 'delete', 'clean', 'wipe'],
      section: 'Actions',
      action: () => {
        setOpen(false)
        onClearCompleted()
      },
    },
    {
      id: 'run-diagnostics',
      label: 'Run System Diagnostics',
      icon: <Stethoscope className="w-4 h-4" />,
      keywords: ['check', 'health', 'test', 'verify', 'post'],
      section: 'Actions',
      action: () => {
        setOpen(false)
        onRunDiagnostics()
      },
    },
    {
      id: 'quick-download',
      label: 'Quick Download from Clipboard',
      icon: <Download className="w-4 h-4" />,
      keywords: ['paste', 'url', 'link', 'add'],
      section: 'Actions',
      action: async () => {
        setOpen(false)
        try {
          const text = await navigator.clipboard.readText()
          if (!text) {
            toast.error('Clipboard is empty')
            return
          }
          try {
            new URL(text)
            await api.download.add({ url: text })
            toast.success('Download added from clipboard')
          } catch {
            toast.error('Clipboard does not contain a valid URL')
          }
        } catch {
          toast.error('Cannot access clipboard')
        }
      },
    },
  ]

  const sections = [...new Set(actions.map((a) => a.section))]

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command Palette"
      className="fixed inset-0 z-50"
      overlayClassName="bg-black/60 backdrop-blur-sm"
    >
      <div className="fixed inset-0 flex items-start justify-center pt-[20vh]">
        <div className="w-full max-w-xl rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl overflow-hidden animate-scale-in">
          <div className="flex items-center border-b border-neutral-800 px-4">
            <Search className="w-4 h-4 text-neutral-500 mr-2 flex-shrink-0" />
            <Command.Input
              ref={inputRef}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent py-4 text-white text-sm placeholder-neutral-500 focus:outline-none"
              autoFocus
            />
            <kbd className="text-[10px] text-neutral-600 bg-neutral-800 px-1.5 py-0.5 rounded font-mono">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin">
            <Command.Empty className="py-12 text-center">
              <p className="text-sm text-neutral-500">No results found</p>
              <p className="text-xs text-neutral-600 mt-1">Try a different search term</p>
            </Command.Empty>

            {sections.map((section) => {
              const sectionActions = actions.filter((a) => a.section === section)
              if (sectionActions.length === 0) return null
              return (
                <Command.Group
                  key={section}
                  heading={section}
                  className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-neutral-500 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
                >
                  {sectionActions.map((action) => (
                    <Command.Item
                      key={action.id}
                      value={`${action.label} ${action.keywords.join(' ')}`}
                      onSelect={action.action}
                      disabled={action.disabled}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-200 cursor-pointer aria-selected:bg-neutral-800 aria-selected:text-white data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed transition-colors duration-100"
                    >
                      <span className="text-neutral-400 flex-shrink-0">{action.icon}</span>
                      <span className="flex-1">{action.label}</span>
                      <span className="text-[10px] text-neutral-600">{action.section}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )
            })}
          </Command.List>

          <div className="border-t border-neutral-800 px-4 py-2.5 flex items-center gap-4 text-[10px] text-neutral-600">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-neutral-800 rounded font-mono">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-neutral-800 rounded font-mono">Enter</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-neutral-800 rounded font-mono">Esc</kbd>
              Close
            </span>
          </div>
        </div>
      </div>
    </Command.Dialog>
  )
}
