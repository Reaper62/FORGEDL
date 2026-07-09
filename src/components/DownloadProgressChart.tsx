import { useState, useEffect, useRef, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { Activity } from 'lucide-react'
import { api } from '../lib/api'
import { parseSpeed } from '../../shared/utilities'

interface DataPoint {
  time: number
  speed: number
  progress: number
}

interface DownloadProgressChartProps {
  downloadId: string
  className?: string
}

// Keep last N data points (rolling window)
const MAX_POINTS = 40

export function DownloadProgressChart({ downloadId, className = '' }: DownloadProgressChartProps) {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([])
  const [currentProgress, setCurrentProgress] = useState(0)
  const startTime = useRef(Date.now())
  const subRef = useRef<(() => void) | null>(null)

  // Subscribe to progress events for this download
  useEffect(() => {
    const channel = `download:progress:${downloadId}`

    const unsub = api.on(channel, (data: unknown) => {
      const p = data as { progress: number; speed?: string; eta?: string; fileSize?: string }
      const speedNum = parseSpeed(p.speed)
      const now = (Date.now() - startTime.current) / 1000

      setDataPoints((prev) => {
        const next = [...prev, { time: now, speed: speedNum, progress: p.progress }]
        if (next.length > MAX_POINTS) {
          return next.slice(next.length - MAX_POINTS)
        }
        return next
      })
      setCurrentProgress(p.progress)
    })
    subRef.current = unsub

    return () => {
      subRef.current?.()
    }
  }, [downloadId])

  // Reset start time when download changes
  useEffect(() => {
    startTime.current = Date.now()
    setDataPoints([])
    setCurrentProgress(0)
  }, [downloadId])

  const stats = useMemo(() => {
    if (dataPoints.length < 2) return null
    const speeds = dataPoints.map((d) => d.speed).filter((s) => s > 0)
    if (speeds.length === 0) return null

    const avg = speeds.reduce((a, b) => a + b, 0) / speeds.length
    const max = Math.max(...speeds)
    const min = Math.min(...speeds)
    const variance = speeds.reduce((sum, s) => sum + (s - avg) ** 2, 0) / speeds.length
    const stability =
      avg > 0 ? Math.max(0, Math.min(100, 100 - (Math.sqrt(variance) / avg) * 100)) : 0

    return { avg, max, min, stability }
  }, [dataPoints])

  const maxSpeed = useMemo(() => {
    if (dataPoints.length === 0) return 5
    const max = Math.max(...dataPoints.map((d) => d.speed))
    return Math.max(max, 1) * 1.3 // 30% headroom
  }, [dataPoints])

  if (dataPoints.length === 0 && currentProgress === 0) {
    return (
      <div className={`flex items-center justify-center h-full min-h-[60px] ${className}`}>
        <div className="flex items-center gap-1.5 text-neutral-600 text-xs">
          <Activity className="w-3 h-3 animate-pulse" />
          Awaiting data...
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Chart */}
      <div className="h-[60px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dataPoints} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`speedGradient-${downloadId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis hide domain={[0, maxSpeed]} />
            <Tooltip
              contentStyle={{
                background: '#171717',
                border: '1px solid #404040',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#f9fafb',
                padding: '6px 10px',
              }}
              labelStyle={{ color: '#737373', marginBottom: 2 }}
              formatter={(value: number, name: string) => {
                if (name === 'speed') return [`${value.toFixed(1)} MB/s`, 'Speed']
                return [value, name]
              }}
              labelFormatter={(t: number) => `${t.toFixed(0)}s elapsed`}
            />
            <ReferenceLine
              y={stats?.avg}
              stroke="#525252"
              strokeDasharray="3 3"
              strokeWidth={0.5}
            />
            <Area
              type="monotone"
              dataKey="speed"
              stroke="#3B82F6"
              strokeWidth={1.5}
              fill={`url(#speedGradient-${downloadId})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="flex items-center gap-3 text-[10px] text-neutral-500">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-active" />
            {stats.avg.toFixed(1)} MB/s avg
          </span>
          <span className="text-neutral-600">·</span>
          <span>
            {stats.min.toFixed(1)}–{stats.max.toFixed(1)} MB/s
          </span>
          <span className="text-neutral-600">·</span>
          <span
            className={
              stats.stability >= 80
                ? 'text-success'
                : stats.stability >= 50
                  ? 'text-alert'
                  : 'text-failure'
            }
          >
            {Math.round(stats.stability)}% stable
          </span>
        </div>
      )}
    </div>
  )
}
