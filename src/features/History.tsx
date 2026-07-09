import { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, Clock, CheckCircle2, XCircle, Download, Square, CheckSquare } from 'lucide-react'
import { api } from '../lib/api'
import { toast } from 'sonner'
import { DownloadItem } from '../../shared/types'

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'error', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function History() {
  const [items, setItems] = useState<DownloadItem[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const history: DownloadItem[] = await api.history.getAll()
      setItems(history)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    let result = items
    if (statusFilter !== 'all') {
      result = result.filter((item) => item.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (item) => item.title?.toLowerCase().includes(q) || item.url.toLowerCase().includes(q),
      )
    }
    return result
  }, [items, search, statusFilter])

  const stats = useMemo(() => {
    const completed = items.filter((i) => i.status === 'completed').length
    const failed = items.filter((i) => i.status === 'error').length
    const cancelled = items.filter((i) => i.status === 'cancelled').length
    return { total: items.length, completed, failed, cancelled }
  }, [items])

  // ── Selection helpers ─────────────────────────────────────────────

  const selectedCount = useMemo(() => {
    return filtered.filter((item) => selected.has(item.id)).length
  }, [filtered, selected])

  const allFilteredSelected = filtered.length > 0 && selectedCount === filtered.length

  const toggleOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAllFiltered = useCallback(() => {
    setSelected(allFilteredSelected ? new Set() : new Set(filtered.map((item) => item.id)))
  }, [filtered, allFilteredSelected])

  const clearSelection = useCallback(() => {
    setSelected(new Set())
  }, [])

  // ── Bulk actions ──────────────────────────────────────────────────

  const handleBulkRedownload = useCallback(async () => {
    const urls = items.filter((item) => selected.has(item.id)).map((item) => item.url)
    if (urls.length === 0) return
    try {
      await api.download.addBatch({ urls })
      setSelected(new Set())
      toast.success(`Re-queued ${urls.length} download${urls.length !== 1 ? 's' : ''}`)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to re-download')
    }
  }, [items, selected])

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Clock className="w-6 h-6 text-neutral-500" />
          Download History
        </h2>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover-lift cursor-default">
          <span className="text-xs text-neutral-500 block">Total</span>
          <span className="text-xl font-bold text-white font-grotesk tracking-tight">
            {stats.total}
          </span>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover-lift cursor-default">
          <span className="text-xs text-neutral-500 block">Completed</span>
          <span className="text-xl font-bold text-success font-grotesk tracking-tight">
            {stats.completed}
          </span>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover-lift cursor-default">
          <span className="text-xs text-neutral-500 block">Failed</span>
          <span className="text-xl font-bold text-failure font-grotesk tracking-tight">
            {stats.failed}
          </span>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover-lift cursor-default">
          <span className="text-xs text-neutral-500 block">Cancelled</span>
          <span className="text-xl font-bold text-neutral-400 font-grotesk tracking-tight">
            {stats.cancelled}
          </span>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by title or URL..."
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 text-sm transition-all duration-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 bg-neutral-900 border border-neutral-700 rounded-lg p-1">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                statusFilter === value
                  ? 'bg-brand text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk action toolbar (visible when items are selected) */}
      {selectedCount > 0 && (
        <div className="bg-brand-muted/20 border border-brand/30 rounded-lg px-4 py-2.5 flex items-center gap-3 animate-fade-slide-up">
          <button
            onClick={toggleAllFiltered}
            className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white transition-colors"
          >
            {allFilteredSelected ? (
              <CheckSquare className="w-3.5 h-3.5 text-brand" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
            {allFilteredSelected ? 'Deselect All' : 'Select All'}
          </button>
          <span className="text-xs text-neutral-400">·</span>
          <span className="text-xs text-brand font-medium">{selectedCount} selected</span>
          <span className="flex-1" />
          <button
            onClick={handleBulkRedownload}
            className="flex items-center gap-1.5 bg-active/10 hover:bg-active/20 text-active border border-active/30 rounded px-3 py-1.5 text-xs font-medium transition-all duration-200"
          >
            <Download className="w-3 h-3" />
            Re-download {selectedCount}
          </button>
          <button
            onClick={clearSelection}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* History Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-active border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center mb-3">
              <Search className="w-6 h-6 text-neutral-600" />
            </div>
            <p className="text-neutral-500 font-medium">
              {items.length === 0 ? 'No download history yet' : 'No matching results'}
            </p>
            <p className="text-xs text-neutral-600 mt-1">
              {items.length === 0
                ? 'Completed and failed downloads will appear here'
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="w-10 py-3 px-3">
                    <button
                      onClick={toggleAllFiltered}
                      className="text-neutral-600 hover:text-neutral-400 transition-colors"
                    >
                      {allFilteredSelected ? (
                        <CheckSquare className="w-4 h-4 text-brand" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Title / URL
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Size
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {filtered.map((item) => {
                  const isSel = selected.has(item.id)
                  return (
                    <tr
                      key={item.id}
                      className={`transition-all duration-150 cursor-pointer ${
                        isSel ? 'bg-brand-muted/10' : 'hover:bg-neutral-800/40'
                      }`}
                      onClick={() => toggleOne(item.id)}
                    >
                      <td className="py-3 px-3">
                        {isSel ? (
                          <CheckSquare className="w-4 h-4 text-brand" />
                        ) : (
                          <Square className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400" />
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-md">
                          <p className="text-sm text-white truncate font-medium">
                            {item.title || item.url}
                          </p>
                          <p className="text-xs text-neutral-500 truncate mt-0.5">{item.url}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                            item.status === 'completed'
                              ? 'bg-success-muted text-success'
                              : item.status === 'error'
                                ? 'bg-failure-muted text-failure'
                                : 'bg-neutral-500/10 text-neutral-400'
                          }`}
                        >
                          {item.status === 'completed' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : item.status === 'error' ? (
                            <XCircle className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {item.status}
                        </span>
                        {item.error && (
                          <p
                            className="text-xs text-failure/70 mt-1 truncate max-w-[120px]"
                            title={item.error}
                          >
                            {item.error}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-400">{item.fileSize || '—'}</td>
                      <td className="py-3 px-4 text-sm text-neutral-400">
                        {item.completedAt
                          ? new Date(item.completedAt).toLocaleDateString()
                          : new Date(item.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
