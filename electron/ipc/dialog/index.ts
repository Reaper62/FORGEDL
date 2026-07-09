// Dialog IPC: native folder picker.
import { ipcMain, dialog, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'

export function registerDialogIPC(): void {
  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_DIRECTORY, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return { ok: true, data: null }
    const r = await dialog.showOpenDialog(win, { properties: ['openDirectory'] })
    return { ok: true, data: r.canceled ? null : (r.filePaths[0] ?? null) }
  })
}
