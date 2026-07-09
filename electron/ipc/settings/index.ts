// Settings IPC.
import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import { getServices } from '../../services/container'
import { wrapResult, safe } from '../errors'
import { parse } from '../validate'
import { DownloadSettingsSchema, PresetSchema } from '../../../shared/types'

const patchSchema = DownloadSettingsSchema.partial()

export function registerSettingsIPC(): void {
  const services = () => getServices()

  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async () => wrapResult(services().settings.get()))

  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE, async (_e, raw) =>
    safe(async () => {
      const input = parse(patchSchema, raw)
      if (!input.ok) return input
      return services().settings.update(input.data)
    }),
  )

  ipcMain.handle(IPC_CHANNELS.SETTINGS_RESET, async () => wrapResult(services().settings.reset()))

  ipcMain.handle(IPC_CHANNELS.SETTINGS_EXPORT, async () => wrapResult(services().settings.export()))

  ipcMain.handle(IPC_CHANNELS.SETTINGS_IMPORT, async (_e, raw) =>
    safe(async () => {
      const input = parse(patchSchema, raw)
      if (!input.ok) return input
      return services().settings.import(input.data)
    }),
  )

  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET_PRESETS, async () =>
    wrapResult(services().settings.getPresets()),
  )

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SAVE_PRESETS, async (_e, raw) =>
    safe(async () => {
      const input = parse(z.array(PresetSchema), raw)
      if (!input.ok) return input
      return services().settings.savePresets(input.data)
    }),
  )
}
