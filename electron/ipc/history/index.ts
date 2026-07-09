// History IPC read handlers.
import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import { getServices } from '../../services/container'
import { wrapResult } from '../errors'

export function registerHistoryIPC(): void {
  const services = () => getServices()

  ipcMain.handle(IPC_CHANNELS.HISTORY_GET_ALL, async () => wrapResult(services().history.list()))
}
