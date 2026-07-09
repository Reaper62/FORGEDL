import { useState, useEffect, useCallback, useRef } from 'react'
import {
  X,
  ChevronDown,
  Subtitles,
  Shield,
  Wifi,
  ListVideo,
  RotateCcw,
  Check,
  Globe,
  Lock,
  Monitor,
  AlertTriangle,
  Gauge,
} from 'lucide-react'
import type { ExtraFlags } from '../../../shared/types'

interface AdvancedDrawerProps {
  isOpen: boolean
  onClose: () => void
  flags: ExtraFlags
  onApply: (flags: ExtraFlags) => void
  onReset: () => void
}

type SectionKey = 'subtitles' | 'auth' | 'network' | 'bandwidth' | 'playlist'

const SECTIONS: { key: SectionKey; label: string; icon: React.ReactNode }[] = [
  { key: 'subtitles', label: 'Subtitles', icon: <Subtitles className="w-4 h-4" /> },
  { key: 'auth', label: 'Authentication', icon: <Shield className="w-4 h-4" /> },
  { key: 'network', label: 'Network', icon: <Wifi className="w-4 h-4" /> },
  { key: 'bandwidth', label: 'Bandwidth', icon: <Gauge className="w-4 h-4" /> },
  { key: 'playlist', label: 'Playlist Range', icon: <ListVideo className="w-4 h-4" /> },
]

const SUBTITLE_LANG_PRESETS = [
  'en',
  'es',
  'fr',
  'de',
  'ja',
  'ko',
  'pt',
  'ru',
  'zh-Hans',
  'ar',
  'hi',
  'it',
]

const SPEED_LIMIT_PRESETS = [
  { label: 'None', value: '' },
  { label: '500K', value: '500K' },
  { label: '1M', value: '1M' },
  { label: '2M', value: '2M' },
  { label: '5M', value: '5M' },
  { label: '10M', value: '10M' },
]

export function AdvancedDrawer({ isOpen, onClose, flags, onApply, onReset }: AdvancedDrawerProps) {
  const [local, setLocal] = useState<ExtraFlags>(flags)
  const [openSections, setOpenSections] = useState<Set<SectionKey>>(new Set(['subtitles']))
  const [customLangs, setCustomLangs] = useState('')
  const drawerRef = useRef<HTMLDivElement>(null)
  const isDirty = JSON.stringify(local) !== JSON.stringify(flags)

  // Sync local state when flags prop changes externally
  useEffect(() => {
    setLocal(flags)
    setCustomLangs('')
  }, [flags])

  // Focus trap + Escape key
  useEffect(() => {
    if (!isOpen) return

    // Focus first input on open
    const timer = setTimeout(() => {
      const firstInput = drawerRef.current?.querySelector<HTMLElement>(
        'input:not([type="hidden"]), select, button:not([aria-label="Close advanced drawer"])',
      )
      firstInput?.focus()
    }, 100)

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      // Trap focus: if Tab pressed on last element, wrap to first
      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'input:not([type="hidden"]), select, button, [tabindex]:not([tabindex="-1"])',
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', handler)
    }
  }, [isOpen, onClose])

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose()
    },
    [onClose],
  )

  const toggleSection = useCallback((key: SectionKey) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const update = useCallback(<K extends keyof ExtraFlags>(key: K, value: ExtraFlags[K]) => {
    setLocal((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleApply = useCallback(() => {
    onApply(local)
  }, [local, onApply])

  const handleReset = useCallback(() => {
    onReset()
    setLocal({})
    setCustomLangs('')
  }, [onReset])

  // ── Subtitle helpers ──────────────────────────────────────────────

  const selectedLangs = local.subtitleLangs ?? []
  const toggleLang = (lang: string) => {
    const next = selectedLangs.includes(lang)
      ? selectedLangs.filter((l) => l !== lang)
      : [...selectedLangs, lang]
    update('subtitleLangs', next.length > 0 ? next : undefined)
  }

  const addCustomLangs = () => {
    const parsed = customLangs
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (parsed.length === 0) return
    const merged = [...new Set([...selectedLangs, ...parsed])]
    update('subtitleLangs', merged)
    setCustomLangs('')
  }

  // ── Validation warnings ───────────────────────────────────────────

  const showCookiesConflict = !!(local.cookiesFile && local.browserCookies)
  const showAuthConflict = !!(local.netrc && local.username)
  const playlistRangeInvalid =
    local.playlistStart !== undefined &&
    local.playlistEnd !== undefined &&
    local.playlistStart > local.playlistEnd

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={handleBackdropClick}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="relative w-[380px] max-w-[90vw] h-full bg-neutral-900 border-l border-neutral-800 overflow-y-auto shadow-2xl"
        style={{
          animation: 'slideIn 250ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-neutral-900 border-b border-neutral-800 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-[1.125rem] font-semibold text-white">Advanced Options</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Per-download overrides</p>
          </div>
          <button
            onClick={onClose}
            data-testid="advanced-drawer-close"
            className="p-1.5 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded transition-all duration-150 hover:rotate-90"
            aria-label="Close advanced drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* ── Subtitles ────────────────────────────────────────── */}
          <Section
            icon={SECTIONS[0].icon}
            label={SECTIONS[0].label}
            isOpen={openSections.has('subtitles')}
            onToggle={() => toggleSection('subtitles')}
            index={0}
          >
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="embed-subs-checkbox"
                  checked={local.embedSubs ?? false}
                  onChange={(e) => update('embedSubs', e.target.checked || undefined)}
                  className="w-4 h-4 rounded border-neutral-600 bg-neutral-950 text-brand focus:ring-brand focus:ring-offset-neutral-900"
                />
                <span className="text-sm text-neutral-300">Embed subtitles in video</span>
              </label>

              <div>
                <p className="text-xs text-neutral-500 mb-2">Subtitle languages</p>
                <div className="flex flex-wrap gap-1.5">
                  {SUBTITLE_LANG_PRESETS.map((lang) => {
                    const active = selectedLangs.includes(lang)
                    return (
                      <button
                        key={lang}
                        onClick={() => toggleLang(lang)}
                        data-testid={`sub-lang-${lang}`}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors border ${
                          active
                            ? 'bg-brand-muted border-brand/40 text-brand'
                            : 'bg-transparent border-neutral-700 text-neutral-400 hover:border-neutral-600'
                        }`}
                      >
                        {lang}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={customLangs}
                  onChange={(e) => setCustomLangs(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCustomLangs()
                    }
                  }}
                  placeholder="Custom: ko, fr, ..."
                  className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-brand"
                />
                <button
                  onClick={addCustomLangs}
                  disabled={!customLangs.trim()}
                  className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-300 px-3 rounded-lg text-xs font-medium transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </Section>

          {/* ── Authentication ───────────────────────────────────── */}
          <Section
            icon={SECTIONS[1].icon}
            label={SECTIONS[1].label}
            isOpen={openSections.has('auth')}
            onToggle={() => toggleSection('auth')}
            index={1}
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <Lock className="w-3 h-3" />
                  Cookies file path
                </label>
                <input
                  type="text"
                  value={local.cookiesFile ?? ''}
                  onChange={(e) => update('cookiesFile', e.target.value || undefined)}
                  placeholder="/path/to/cookies.txt"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-brand"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <Monitor className="w-3 h-3" />
                  Browser cookies
                </label>
                <select
                  value={local.browserCookies ?? ''}
                  onChange={(e) => update('browserCookies', e.target.value || undefined)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand"
                >
                  <option value="">None</option>
                  <option value="chrome">Chrome</option>
                  <option value="firefox">Firefox</option>
                  <option value="edge">Edge</option>
                  <option value="brave">Brave</option>
                  <option value="opera">Opera</option>
                  <option value="safari">Safari</option>
                </select>
              </div>

              {showCookiesConflict && (
                <div className="flex items-start gap-1.5 text-xs text-alert bg-alert-muted/20 rounded px-2.5 py-1.5">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  Cookies file takes priority over browser cookies.
                </div>
              )}

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <Globe className="w-3 h-3" />
                  Username
                </label>
                <input
                  type="text"
                  value={local.username ?? ''}
                  onChange={(e) => update('username', e.target.value || undefined)}
                  placeholder="Site username"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-brand"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400">Password</label>
                <input
                  type="password"
                  value={local.password ?? ''}
                  onChange={(e) => update('password', e.target.value || undefined)}
                  placeholder="Site password"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-brand"
                />
                {local.username && !local.password && (
                  <p className="text-xs text-alert">
                    Username set without password — some sites may prompt interactively.
                  </p>
                )}
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={local.netrc ?? false}
                  onChange={(e) => update('netrc', e.target.checked || undefined)}
                  className="w-4 h-4 rounded border-neutral-600 bg-neutral-950 text-brand focus:ring-brand focus:ring-offset-neutral-900"
                />
                <span className="text-sm text-neutral-300">Use .netrc file for authentication</span>
              </label>

              {showAuthConflict && (
                <div className="flex items-start gap-1.5 text-xs text-alert bg-alert-muted/20 rounded px-2.5 py-1.5">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  .netrc will be used instead of username/password.
                </div>
              )}
            </div>
          </Section>

          {/* ── Network ──────────────────────────────────────────── */}
          <Section
            icon={SECTIONS[2].icon}
            label={SECTIONS[2].label}
            isOpen={openSections.has('network')}
            onToggle={() => toggleSection('network')}
            index={2}
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400">Proxy URL</label>
                <input
                  type="text"
                  value={local.proxy ?? ''}
                  onChange={(e) => update('proxy', e.target.value || undefined)}
                  placeholder="socks5://127.0.0.1:9050"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-brand font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400">Custom User-Agent</label>
                <input
                  type="text"
                  value={local.userAgent ?? ''}
                  onChange={(e) => update('userAgent', e.target.value || undefined)}
                  placeholder="Mozilla/5.0 ..."
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-brand font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400">Custom Referer</label>
                <input
                  type="text"
                  value={local.referer ?? ''}
                  onChange={(e) => update('referer', e.target.value || undefined)}
                  placeholder="https://example.com"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-brand"
                />
              </div>
            </div>
          </Section>

          {/* ── Bandwidth ────────────────────────────────────────── */}
          <Section
            icon={SECTIONS[3].icon}
            label={SECTIONS[3].label}
            isOpen={openSections.has('bandwidth')}
            onToggle={() => toggleSection('bandwidth')}
            index={3}
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400">Per-download speed limit</label>
                <input
                  type="text"
                  data-testid="speed-limit-input"
                  value={local.speedLimit ?? ''}
                  onChange={(e) => update('speedLimit', e.target.value || undefined)}
                  placeholder="e.g. 1M, 500K — leave empty for global"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-brand font-mono"
                />
                <p className="text-[10px] text-neutral-600">
                  Overrides the global speed limit for this download only
                </p>
              </div>

              <div>
                <p className="text-xs text-neutral-500 mb-2">Quick presets</p>
                <div className="flex flex-wrap gap-1.5">
                  {SPEED_LIMIT_PRESETS.map((sp) => {
                    const active = (local.speedLimit ?? '') === sp.value
                    return (
                      <button
                        key={sp.value || 'none'}
                        type="button"
                        data-testid={`speed-preset-${sp.label.toLowerCase()}`}
                        onClick={() => update('speedLimit', sp.value || undefined)}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors border ${
                          active
                            ? 'bg-brand-muted border-brand/40 text-brand'
                            : 'bg-transparent border-neutral-700 text-neutral-400 hover:border-neutral-600'
                        }`}
                      >
                        {sp.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </Section>

          {/* ── Playlist Range ───────────────────────────────────── */}
          <Section
            icon={SECTIONS[4].icon}
            label={SECTIONS[4].label}
            isOpen={openSections.has('playlist')}
            onToggle={() => toggleSection('playlist')}
            index={4}
          >
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="no-playlist-checkbox"
                  checked={local.noPlaylist ?? false}
                  onChange={(e) => update('noPlaylist', e.target.checked || undefined)}
                  className="w-4 h-4 rounded border-neutral-600 bg-neutral-950 text-brand focus:ring-brand focus:ring-offset-neutral-900"
                />
                <span className="text-sm text-neutral-300">
                  Download single video only (ignore playlist)
                </span>
              </label>

              {!local.noPlaylist && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-neutral-400">Start at #</label>
                      <input
                        type="number"
                        min={1}
                        data-testid="playlist-start-input"
                        value={local.playlistStart ?? ''}
                        onChange={(e) =>
                          update(
                            'playlistStart',
                            e.target.value ? Number(e.target.value) : undefined,
                          )
                        }
                        placeholder="1"
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-brand"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-neutral-400">End at #</label>
                      <input
                        type="number"
                        min={1}
                        data-testid="playlist-end-input"
                        value={local.playlistEnd ?? ''}
                        onChange={(e) =>
                          update('playlistEnd', e.target.value ? Number(e.target.value) : undefined)
                        }
                        placeholder="10"
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-brand"
                      />
                    </div>
                  </div>
                  {playlistRangeInvalid && (
                    <div className="flex items-start gap-1.5 text-xs text-alert bg-alert-muted/20 rounded px-2.5 py-1.5">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      Start index ({local.playlistStart}) is greater than end index (
                      {local.playlistEnd}). Range will be reversed.
                    </div>
                  )}
                </>
              )}
            </div>
          </Section>
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-neutral-900 border-t border-neutral-800 px-5 py-4 flex items-center gap-3">
          <button
            onClick={handleReset}
            data-testid="reset-overrides-btn"
            disabled={Object.keys(flags).length === 0 && Object.keys(local).length === 0}
            className="flex items-center gap-1.5 border border-neutral-700 hover:border-neutral-600 text-neutral-300 py-2 px-4 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            onClick={handleApply}
            disabled={!isDirty}
            data-testid="apply-overrides-btn"
            className="flex-1 bg-brand hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 text-sm transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            Apply Overrides
          </button>
        </div>
      </div>
    </div>
  )
}

/** Collapsible section wrapper. */
function Section({
  icon,
  label,
  isOpen,
  onToggle,
  children,
  index = 0,
}: {
  icon: React.ReactNode
  label: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
  index?: number
}) {
  return (
    <div
      className="bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden"
      style={{
        animation: `liftIn 300ms ease-out ${80 * index}ms both`,
        opacity: 0,
      }}
    >
      <button
        onClick={onToggle}
        data-testid={`advanced-section-${label.toLowerCase().replace(/\s+/g, '-')}`}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-neutral-800/50 transition-colors duration-150"
      >
        <span className="text-neutral-500">{icon}</span>
        <span className="text-sm font-medium text-neutral-200 flex-1">{label}</span>
        <ChevronDown
          className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ease-out ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className="section-collapse"
        style={{
          maxHeight: isOpen ? '2000px' : '0px',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="px-4 pb-4 pt-1">{children}</div>
      </div>
    </div>
  )
}
