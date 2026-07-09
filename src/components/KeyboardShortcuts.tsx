import { useState, useEffect, useCallback } from 'react'
import { X, Command } from 'lucide-react'

interface Shortcut {
  keys: string[]
  description: string
}

const SHORTCUTS: Shortcut[] = [
  { keys: ['Enter'], description: 'Start download with current URL' },
  { keys: ['Shift', 'Enter'], description: 'Fetch metadata for current URL' },
  { keys: ['Ctrl', 'K'], description: 'Open command palette' },
  { keys: ['?'], description: 'Show this help panel' },
  { keys: ['Esc'], description: 'Close drawers, modals, or cancel' },
  { keys: ['Ctrl', 'Click'], description: 'Range-select items (hold Ctrl + click)' },
  { keys: ['Shift', 'Click'], description: 'Range-select items (hold Shift + click)' },
]

export function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Only trigger when no input/textarea is focused
    const tag = (e.target as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

    if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault()
      setIsOpen((prev) => !prev)
    }
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Panel */}
      <div
        className="relative bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-[420px] max-w-[90vw] max-h-[80vh] overflow-y-auto"
        style={{ animation: 'liftIn 200ms ease-out' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 px-5 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-[1.125rem] font-semibold text-white flex items-center gap-2">
              <Command className="w-5 h-5 text-neutral-500" />
              Keyboard Shortcuts
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Press{' '}
              <kbd className="px-1 py-0.5 bg-neutral-800 rounded text-neutral-400 text-[10px] font-mono">
                ?
              </kbd>{' '}
              to toggle
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded transition-all duration-150 hover:rotate-90"
            aria-label="Close shortcuts"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcut list */}
        <div className="p-5 space-y-3">
          {SHORTCUTS.map((shortcut) => (
            <div key={shortcut.description} className="flex items-center justify-between gap-4">
              <span className="text-sm text-neutral-300">{shortcut.description}</span>
              <span className="flex items-center gap-1 flex-shrink-0">
                {shortcut.keys.map((key, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <kbd className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-xs font-mono text-neutral-300">
                      {key}
                    </kbd>
                    {i < shortcut.keys.length - 1 && (
                      <span className="text-neutral-600 text-xs">+</span>
                    )}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/50">
          <p className="text-[10px] text-neutral-600 text-center">
            More shortcuts available via the Command Palette (
            <kbd className="px-1 py-0.5 bg-neutral-800 rounded text-neutral-500 text-[9px] font-mono">
              Ctrl+K
            </kbd>
            )
          </p>
        </div>
      </div>
    </div>
  )
}
