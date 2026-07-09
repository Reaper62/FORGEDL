// ponytail: sync settings with main process via IPC
import { create } from 'zustand'
import { DownloadSettings } from '../../shared/types'
import { api } from '../lib/api'

interface AppState {
  settings: DownloadSettings
  setSettings: (settings: Partial<DownloadSettings>) => void
  loadSettings: () => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  settings: {
    outputFormat: 'bestvideo+bestaudio/best',
    downloadPath: '',
    extractAudio: false,
    audioFormat: 'mp3',
    embedMetadata: true,
    maxConcurrent: 3,
    speedLimit: '',
    namingTemplate: '%(title)s.%(ext)s',
    basePresetId: '',
    smartQueueOrdering: true,
    ytdlpPath: 'yt-dlp',
    ffmpegPath: 'ffmpeg',
  },
  setSettings: (newSettings) => {
    set((state) => {
      const updated = { ...state.settings, ...newSettings }
      // fire-and-forget IPC update
      api.settings.update(newSettings).catch(console.error)
      return { settings: updated }
    })
  },
  loadSettings: async () => {
    try {
      const settings = await api.settings.get()
      set({ settings })
    } catch (err) {
      console.error('Failed to load settings from main process:', err)
    }
  },
}))
