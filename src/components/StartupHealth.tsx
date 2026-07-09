import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import type { BinaryHealth } from '../../shared/types'

interface StartupHealthPayload {
  ytDlp: BinaryHealth
  ffmpeg: BinaryHealth
}

/**
 * Listens for the one-shot startup:health event from the main process
 * and shows a summary toast if any binaries are missing or corrupted.
 *
 * Only fires once — the event is emitted exactly once after window creation.
 */
export function StartupHealth() {
  const firedRef = useRef(false)

  useEffect(() => {
    const unsubscribe = api.on('startup:health', (payload: unknown) => {
      if (firedRef.current) return
      firedRef.current = true

      const data = payload as StartupHealthPayload
      if (!data?.ytDlp || !data?.ffmpeg) return

      const ytOk = data.ytDlp.status === 'ok'
      const ffOk = data.ffmpeg.status === 'ok'
      const bothOk = ytOk && ffOk

      if (bothOk) {
        // All good — show a subtle success notification
        toast.success('yt-dlp and ffmpeg detected — ready to download', {
          id: 'startup-health',
          duration: 4000,
        })
        return
      }

      // Build a human-readable summary of issues
      const issues: string[] = []
      if (!ytOk) {
        issues.push(
          `yt-dlp is ${data.ytDlp.status}${data.ytDlp.version ? ` (${data.ytDlp.version})` : ''}`,
        )
      }
      if (!ffOk) {
        issues.push(
          `ffmpeg is ${data.ffmpeg.status}${data.ffmpeg.version ? ` (${data.ffmpeg.version})` : ''}`,
        )
      }

      const summary = issues.join(' · ')
      const allMissing = !ytOk && !ffOk
      const action = allMissing
        ? 'Missing'
        : data.ytDlp.status === 'missing' || data.ffmpeg.status === 'missing'
          ? 'Missing dependencies'
          : 'Issues detected'

      toast.error(`${action}: ${summary}`, {
        id: 'startup-health',
        duration: 8000,
        description: 'Go to Settings → Advanced to repair or configure paths',
      })
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // This component renders nothing — it only listens for events
  return null
}
