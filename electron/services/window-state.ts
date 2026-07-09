import fs from 'node:fs'
import path from 'node:path'
import { screen, type Rectangle } from 'electron'
import { getLogger } from '../logging/logger'

interface WindowState {
  x?: number
  y?: number
  width: number
  height: number
  isMaximized: boolean
  isFullScreen: boolean
}

const DEFAULT_STATE: WindowState = {
  width: 1400,
  height: 900,
  isMaximized: false,
  isFullScreen: false,
}

let statePath: string | null = null

export function initWindowState(userDataPath: string): void {
  statePath = path.join(userDataPath, 'window-state.json')
}

function load(): WindowState {
  if (!statePath) return { ...DEFAULT_STATE }
  try {
    if (fs.existsSync(statePath)) {
      const raw = fs.readFileSync(statePath, 'utf-8')
      const parsed = JSON.parse(raw)
      return {
        ...DEFAULT_STATE,
        ...parsed,
      }
    }
  } catch (err) {
    getLogger().warn(`Failed to load window state: ${(err as Error).message}`)
  }
  return { ...DEFAULT_STATE }
}

function save(state: WindowState): void {
  if (!statePath) return
  try {
    const toSave: WindowState = { ...state }
    if (toSave.isMaximized || toSave.isFullScreen) {
      const prev = load()
      toSave.width = prev.width
      toSave.height = prev.height
    }
    fs.writeFileSync(statePath, JSON.stringify(toSave, null, 2), 'utf-8')
  } catch (err) {
    getLogger().warn(`Failed to save window state: ${(err as Error).message}`)
  }
}

export function getWindowState(): WindowState {
  const state = load()

  try {
    const displays = screen.getAllDisplays()
    const allBounds = displays.map((d) => d.bounds)

    const windowBounds: Rectangle = {
      x: state.x ?? 100,
      y: state.y ?? 100,
      width: state.width,
      height: state.height,
    }

    const isVisible = allBounds.some((displayBounds: Rectangle) => {
      const overlapX = Math.max(
        0,
        Math.min(windowBounds.x + windowBounds.width, displayBounds.x + displayBounds.width) -
          Math.max(windowBounds.x, displayBounds.x),
      )
      const overlapY = Math.max(
        0,
        Math.min(windowBounds.y + windowBounds.height, displayBounds.y + displayBounds.height) -
          Math.max(windowBounds.y, displayBounds.y),
      )
      return overlapX > 100 && overlapY > 100
    })

    if (!isVisible) {
      return { ...DEFAULT_STATE }
    }

    return state
  } catch {
    return state
  }
}

export function saveWindowState(state: WindowState): void {
  save(state)
}
