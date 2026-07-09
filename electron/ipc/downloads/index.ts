// IPC handlers for download lifecycle.
// All input validated with Zod; all service exceptions caught and
// converted to envelopes.
import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import { getServices } from '../../services/container'
import { parse } from '../validate'
import { safe, wrapResult, failure } from '../errors'
import { validateDownloadUrl } from '../../security/url-validator'
import type { DownloadItem } from '../../../shared/types'

const uuid = z.string().uuid()
const extraFlagsInput = z
  .object({
    cookiesFile: z.string().optional(),
    browserCookies: z.string().optional(),
    subtitleLangs: z.array(z.string()).optional(),
    embedSubs: z.boolean().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    netrc: z.boolean().optional(),
    proxy: z.string().optional(),
    userAgent: z.string().optional(),
    referer: z.string().optional(),
    playlistStart: z.number().int().positive().optional(),
    playlistEnd: z.number().int().positive().optional(),
    noPlaylist: z.boolean().optional(),
    speedLimit: z
      .string()
      .regex(/^(\d+(\.\d+)?[KMGkmg]?)?$/, 'Invalid speed limit format')
      .optional(),
  })
  .optional()

const addInput = z.object({
  url: z.string().min(1),
  priority: z.number().int().min(1).max(10).optional(),
  extraFlags: extraFlagsInput,
})
const addBatchInput = z.object({
  urls: z.array(z.string().min(1)).min(1),
  priority: z.number().int().min(1).max(10).optional(),
  extraFlags: extraFlagsInput,
})
const idOnly = z.object({ id: uuid })

export function registerDownloadsIPC(): void {
  const services = () => getServices()
  const queue = () => services().queue

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_ADD, async (_e, raw) =>
    safe(async () => {
      const input = parse(addInput, raw)
      if (!input.ok) return input
      const safeUrl = validateDownloadUrl(input.data.url)

      const created = await queue().add({
        url: safeUrl,
        priority: input.data.priority,
        extraFlags: input.data.extraFlags,
      })
      if (!created.ok) return created

      // Best-effort metadata enrichment; failure does not break enrollment.
      try {
        const meta = await queue().fetchMetadata(safeUrl)
        if (meta.ok && meta.data.title) {
          queue().setTitle(created.data.id, meta.data.title)
          return { ok: true, data: { ...created.data, title: meta.data.title } as DownloadItem }
        }
      } catch {
        // swallow — service layer logged it
      }
      return created
    }),
  )

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_ADD_BATCH, async (_e, raw) =>
    safe(async () => {
      const input = parse(addBatchInput, raw)
      if (!input.ok) return input
      const validated: string[] = []
      for (const u of input.data.urls) {
        try {
          validated.push(validateDownloadUrl(u))
        } catch {
          return failure('INVALID_URL', `Invalid URL: ${u}`)
        }
      }
      return queue().addBatch({
        urls: validated,
        priority: input.data.priority,
        extraFlags: input.data.extraFlags,
      })
    }),
  )

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_PAUSE, async (_e, raw) =>
    safe(async () => {
      const p = parse(idOnly, { id: raw })
      if (!p.ok) return p
      return queue().pause(p.data.id)
    }),
  )

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_RESUME, async (_e, raw) =>
    safe(async () => {
      const p = parse(idOnly, { id: raw })
      if (!p.ok) return p
      return queue().resume(p.data.id)
    }),
  )

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_CANCEL, async (_e, raw) =>
    safe(async () => {
      const p = parse(idOnly, { id: raw })
      if (!p.ok) return p
      return queue().cancel(p.data.id)
    }),
  )

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_REMOVE, async (_e, raw) =>
    safe(async () => {
      const p = parse(idOnly, { id: raw })
      if (!p.ok) return p
      return queue().remove(p.data.id)
    }),
  )

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_RETRY, async (_e, raw) =>
    safe(async () => {
      const p = parse(idOnly, { id: raw })
      if (!p.ok) return p
      return queue().retry(p.data.id)
    }),
  )

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_REORDER, async (_e, raw) =>
    safe(async () => {
      const input = parse(z.object({ id: uuid, direction: z.enum(['up', 'down']) }), raw)
      if (!input.ok) return input
      return queue().reorder(input.data.id, input.data.direction)
    }),
  )

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_CLEAR_COMPLETED, async () =>
    wrapResult(queue().clearCompleted()),
  )

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_GET_EXTRA_FLAGS, async (_e, raw) =>
    safe(async () => {
      const p = parse(idOnly, { id: raw })
      if (!p.ok) return p
      return queue().getExtraFlags(p.data.id)
    }),
  )

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_UPDATE_EXTRA_FLAGS, async (_e, raw) =>
    safe(async () => {
      const input = parse(z.object({ id: uuid, flags: extraFlagsInput }), raw)
      if (!input.ok) return input
      return queue().updateExtraFlags(input.data.id, input.data.flags ?? {})
    }),
  )

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_GET_ALL, async () => wrapResult(queue().getAll()))

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_GET, async (_e, raw) =>
    safe(async () => {
      const p = parse(idOnly, { id: raw })
      if (!p.ok) return p
      return queue().get(p.data.id)
    }),
  )

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_GET_QUEUE_STATS, async () => wrapResult(queue().getStats()))

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_ESTIMATE_BATCH_SIZE, async (_e, raw) =>
    safe(async () => {
      const input = parse(z.array(z.string().min(1)).min(1), raw)
      if (!input.ok) return input
      return queue().estimateBatchSize(input.data)
    }),
  )

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_FETCH_METADATA, async (_e, raw) =>
    safe(async () => {
      if (typeof raw !== 'string') return failure('INVALID_INPUT', 'url required')
      const safeUrl = validateDownloadUrl(raw)
      return queue().fetchMetadata(safeUrl)
    }),
  )

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_FETCH_PLAYLIST, async (_e, raw) =>
    safe(async () => {
      if (typeof raw !== 'string') return failure('INVALID_INPUT', 'url required')
      const safeUrl = validateDownloadUrl(raw)
      return queue().fetchPlaylist(safeUrl)
    }),
  )

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_REORDER_TO_POSITION, async (_e, raw) =>
    safe(async () => {
      const input = parse(z.object({ id: uuid, newIndex: z.number().int().nonnegative() }), raw)
      if (!input.ok) return input
      return queue().reorderToPosition(input.data.id, input.data.newIndex)
    }),
  )

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_SET_SPEED_LIMIT, async (_e, raw) =>
    safe(async () => {
      const input = parse(
        z.object({
          id: uuid,
          limit: z
            .string()
            .regex(/^(\d+(\.\d+)?[KMGkmg]?)?$/, 'Invalid speed limit')
            .nullable(),
        }),
        raw,
      )
      if (!input.ok) return input
      return queue().setSpeedLimit(input.data.id, input.data.limit)
    }),
  )
}
