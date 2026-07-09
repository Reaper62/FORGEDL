// System IPC: runtime info + shell helpers + disk info.
import { ipcMain, shell } from 'electron'
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import { validateShellPath } from '../../security/path-validator'
import { safe, failure } from '../errors'
import {
  getYtDlpVersion,
  getFfmpegVersion,
  checkAndUpdateYtDlpAsync,
  checkBinaryHealth,
  repairYtDlp,
  repairFfmpeg,
} from '../../services/runtime-info'
import { resolveForgedlBase } from '../../services/download-path'
import { getSettings } from '../../services/settings-snapshot'
import { runPost } from '../../services/post-service'

function systemInfo(): Record<string, string> {
  return {
    os: os.type(),
    release: os.release(),
    arch: os.arch(),
    totalmem: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
    freemem: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
    cpus: String(os.cpus().length),
    platform: os.platform(),
    hostname: os.hostname(),
  }
}

function diskSpace(folderPath?: string): { free: number; total: number } {
  const target = folderPath ? validateShellPath(folderPath) : os.homedir()
  const normalized = path.resolve(target)
  try {
    const fsAny = fs as typeof fs & {
      statfsSync?: (p: string) => { bsize: number; bfree: number; blocks: number }
    }
    if (typeof fsAny.statfsSync === 'function') {
      const stat = fsAny.statfsSync(normalized)
      return { free: stat.bsize * stat.bfree, total: stat.bsize * stat.blocks }
    }
  } catch {
    // fall through to zero-placeholders
  }
  return { free: 0, total: 0 }
}

export function registerSystemIPC(): void {
  ipcMain.handle(IPC_CHANNELS.SYSTEM_YTDLP_VERSION, async () => ({
    ok: true,
    data: getYtDlpVersion(),
  }))
  ipcMain.handle(IPC_CHANNELS.SYSTEM_FFMPEG_VERSION, async () => ({
    ok: true,
    data: getFfmpegVersion(),
  }))

  ipcMain.handle(IPC_CHANNELS.SYSTEM_CHECK_BINARY_HEALTH, async (_e, raw: unknown) =>
    safe(async () => {
      if (typeof raw !== 'string' || (raw !== 'yt-dlp' && raw !== 'ffmpeg')) {
        return failure('INVALID_INPUT', 'Binary name must be "yt-dlp" or "ffmpeg"')
      }
      const result = checkBinaryHealth(raw)
      return { ok: true, data: result }
    }),
  )

  ipcMain.handle(IPC_CHANNELS.SYSTEM_REBUILD_YTDLP, async () =>
    safe(async () => {
      const result = await repairYtDlp()
      return { ok: true, data: result }
    }),
  )

  ipcMain.handle(IPC_CHANNELS.SYSTEM_REBUILD_FFMPEG, async () =>
    safe(async () => {
      const result = await repairFfmpeg()
      return { ok: true, data: result }
    }),
  )

  ipcMain.handle(IPC_CHANNELS.SYSTEM_CHECK_YTDLP_UPDATE, async () =>
    safe(async () => {
      const result = await checkAndUpdateYtDlpAsync()
      return { ok: true, data: result }
    }),
  )

  ipcMain.handle(IPC_CHANNELS.SYSTEM_OPEN_FOLDER, async (_e, raw: unknown) =>
    safe(async () => {
      if (typeof raw !== 'string' || raw.length === 0)
        return failure('INVALID_INPUT', 'path required')
      const resolved = validateShellPath(raw)
      if (!fs.existsSync(resolved)) return failure('NOT_FOUND', 'Folder does not exist')
      await shell.openPath(resolved)
      return { ok: true, data: undefined }
    }),
  )

  ipcMain.handle(IPC_CHANNELS.SYSTEM_SHOW_IN_FOLDER, async (_e, raw: unknown) =>
    safe(async () => {
      if (typeof raw !== 'string' || raw.length === 0)
        return failure('INVALID_INPUT', 'path required')
      const resolved = validateShellPath(raw)
      if (!fs.existsSync(resolved)) return failure('NOT_FOUND', 'File does not exist')
      shell.showItemInFolder(resolved)
      return { ok: true, data: undefined }
    }),
  )

  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_INFO, async () => ({ ok: true, data: systemInfo() }))

  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_DISK_SPACE, async (_e, raw: unknown) => {
    const p = typeof raw === 'string' ? raw : undefined
    return { ok: true, data: diskSpace(p) }
  })

  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_PLATFORM, async () => ({ ok: true, data: os.platform() }))

  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_FORGEDL_BASE_PATH, async () => ({
    ok: true,
    data: resolveForgedlBase(getSettings().downloadPath),
  }))

  ipcMain.handle(IPC_CHANNELS.SYSTEM_RUN_POST, async () =>
    safe(async () => {
      const results = await runPost()
      return { ok: true, data: results }
    }),
  )
}
