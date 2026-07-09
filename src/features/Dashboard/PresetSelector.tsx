import { useState, useEffect, useCallback, useRef } from 'react'
import { X, Check, Bookmark, Plus } from 'lucide-react'
import { api } from '../../lib/api'
import { toast } from 'sonner'
import type { Preset, ExtraFlags } from '../../../shared/types'

interface PresetSelectorProps {
  /** Current output format (e.g. 'bestvideo+bestaudio/best') */
  currentFormat: string
  /** Current extra flags from AdvancedDrawer */
  extraFlags: ExtraFlags
  /** Called when user clicks a preset — parent applies format + extraFlags */
  onApply: (format: string, extraFlags: ExtraFlags) => void
}

/** Human-readable summary for a preset's config. */
function summarize({ outputFormat, extraFlags }: Preset): string {
  const parts: string[] = []
  if (outputFormat) {
    if (outputFormat === 'bestaudio') parts.push('Audio only')
    else if (outputFormat === 'bestvideo+bestaudio/best') parts.push('Best quality')
    else if (outputFormat.includes('worst')) parts.push('Smallest file')
    else parts.push(outputFormat)
  }
  const ef = extraFlags
  if (ef) {
    if (ef.embedSubs) parts.push('+subs')
    if (ef.subtitleLangs?.length) parts.push(`${ef.subtitleLangs.length} langs`)
    if (ef.proxy) parts.push('proxy')
    if (ef.cookiesFile || ef.browserCookies) parts.push('auth')
    if (ef.noPlaylist) parts.push('no-pl')
  }
  return parts.join(' · ') || 'Custom config'
}

export function PresetSelector({ currentFormat, extraFlags, onApply }: PresetSelectorProps) {
  const [presets, setPresets] = useState<Preset[]>([])
  const [loaded, setLoaded] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const saveInputRef = useRef<HTMLInputElement>(null)

  // ── Load presets on mount ─────────────────────────────────────────

  const loadPresets = useCallback(async () => {
    try {
      const data = await api.settings.getPresets()
      setPresets(data)
    } catch (err) {
      console.error('Failed to load presets:', err)
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    loadPresets()
  }, [loadPresets])

  // Focus save input when it appears
  useEffect(() => {
    if (showSaveInput) {
      saveInputRef.current?.focus()
    }
  }, [showSaveInput])

  // ── Persist presets ──────────────────────────────────────────────

  const persist = useCallback(async (updated: Preset[]) => {
    setPresets(updated)
    try {
      await api.settings.savePresets(updated)
    } catch (err) {
      console.error('Failed to save presets:', err)
    }
  }, [])

  // ── Save current config as preset ────────────────────────────────

  const handleSave = useCallback(() => {
    const name = saveName.trim()
    if (!name || name.length > 60) return

    const now = new Date().toISOString()
    const hasFlags = Object.keys(extraFlags).length > 0

    // Prevent duplicate names
    if (presets.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      toast.error('A preset with that name already exists')
      setSaveName('')
      setShowSaveInput(false)
      return
    }

    const preset: Preset = {
      id: crypto.randomUUID(),
      name,
      outputFormat: currentFormat,
      extraFlags: hasFlags ? { ...extraFlags } : undefined,
      createdAt: now,
    }

    persist([...presets, preset])
    setSaveName('')
    setShowSaveInput(false)
  }, [saveName, currentFormat, extraFlags, presets, persist])

  const handleSaveKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      setShowSaveInput(false)
      setSaveName('')
    }
  }

  // ── Delete ───────────────────────────────────────────────────────

  const handleDelete = useCallback(
    (id: string) => {
      if (deleteConfirm === id) {
        persist(presets.filter((p) => p.id !== id))
        setDeleteConfirm(null)
      } else {
        setDeleteConfirm(id)
        // Auto-cancel after 3s
        setTimeout(() => setDeleteConfirm((prev) => (prev === id ? null : prev)), 3000)
      }
    },
    [deleteConfirm, presets, persist],
  )

  // ── Apply ────────────────────────────────────────────────────────

  const handleApply = useCallback(
    (preset: Preset) => {
      onApply(preset.outputFormat ?? 'bestvideo+bestaudio/best', preset.extraFlags ?? {})
    },
    [onApply],
  )

  // ── Render ───────────────────────────────────────────────────────

  if (!loaded) return null

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mr-1">
        <Bookmark className="w-3 h-3 inline-block -mt-0.5 mr-1" />
        Presets
      </span>

      {presets.map((preset) => {
        const isDeleting = deleteConfirm === preset.id
        const summary = summarize(preset)

        return (
          <div key={preset.id} className="relative group">
            <button
              onClick={() => (isDeleting ? handleDelete(preset.id) : handleApply(preset))}
              data-testid={`preset-btn-${preset.name}`}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 border flex items-center gap-1.5 hover:scale-105 active:scale-95 ${
                isDeleting
                  ? 'bg-failure-muted border-failure/40 text-failure animate-shake'
                  : 'bg-transparent border-neutral-700 text-neutral-400 hover:text-neutral-300 hover:border-neutral-600'
              }`}
              title={`${preset.name} — ${summary}${isDeleting ? ' (click to confirm delete)' : ''}`}
            >
              {isDeleting ? (
                <>
                  <X className="w-3 h-3" />
                  Delete?
                </>
              ) : (
                preset.name
              )}
            </button>{' '}
            {/* Delete button on hover (when not confirming) */}
            {!isDeleting && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(preset.id)
                }}
                data-testid={`preset-delete-btn-${preset.name}`}
                className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-neutral-800 border border-neutral-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150 hover:scale-125 hover:bg-failure/20 hover:border-failure/30"
                aria-label={`Delete preset "${preset.name}"`}
                title={`Delete "${preset.name}"`}
              >
                <X className="w-2.5 h-2.5 text-neutral-400 hover:text-failure" />
              </button>
            )}
          </div>
        )
      })}

      {/* Save button or input */}
      {showSaveInput ? (
        <div className="flex items-center gap-1 animate-scale-bounce">
          <input
            ref={saveInputRef}
            type="text"
            data-testid="preset-save-input"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={handleSaveKeyDown}
            onBlur={() => {
              // Delay to allow click on save button
              setTimeout(() => {
                if (!saveName.trim()) setShowSaveInput(false)
              }, 150)
            }}
            placeholder="Preset name…"
            maxLength={60}
            className="bg-neutral-950 border border-brand/50 rounded px-2.5 py-1 text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-brand w-28"
          />
          <button
            onClick={handleSave}
            disabled={!saveName.trim()}
            data-testid="preset-confirm-save"
            className="p-1 rounded text-brand hover:bg-brand-muted disabled:opacity-30 transition-colors"
            aria-label="Confirm save preset"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setShowSaveInput(false)
              setSaveName('')
            }}
            data-testid="preset-cancel-save"
            className="p-1 rounded text-neutral-500 hover:text-neutral-300 transition-colors"
            aria-label="Cancel save"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowSaveInput(true)}
          data-testid="preset-save-btn"
          className="px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 border border-dashed border-neutral-700 text-neutral-500 hover:text-neutral-300 hover:border-neutral-500 hover:scale-105 active:scale-95 flex items-center gap-1"
          title="Save current config as preset"
        >
          <Plus className="w-3 h-3" />
          Save
        </button>
      )}
    </div>
  )
}
