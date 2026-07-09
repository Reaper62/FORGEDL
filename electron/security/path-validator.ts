// ponytail: path validation — prevent traversal, block Windows reserved names
import path from 'node:path'

const WINDOWS_RESERVED = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i
const INVALID_CHARS = /[<>:"|?*\x00-\x1f]/g
const SHELL_METACHAR = /[;&|`$(){}[\]<>!#*\n\r]/

export function isPathSafe(filePath: string, allowedRoot: string): boolean {
  const resolved = path.resolve(filePath)
  const root = path.resolve(allowedRoot)
  return resolved.startsWith(root + path.sep) || resolved === root
}

export function sanitizeFilename(name: string): string {
  let safe = name.replace(INVALID_CHARS, '_').trim()
  // ponytail: strip trailing dots/spaces (Windows disallows)
  safe = safe.replace(/[. ]+$/, '')
  if (WINDOWS_RESERVED.test(safe)) {
    safe = '_' + safe
  }
  return safe || 'download'
}

export function validateOutputPath(outputPath: string, allowedRoot: string): string {
  if (!isPathSafe(outputPath, allowedRoot)) {
    throw new Error(`Path "${outputPath}" is outside allowed directory`)
  }
  return path.resolve(outputPath)
}

export function validateDownloadDirectory(dir: string): string {
  if (!dir || typeof dir !== 'string') {
    throw new Error('Download directory is required')
  }
  if (dir.includes('\0')) {
    throw new Error('Download directory contains invalid characters')
  }
  return path.resolve(dir.trim())
}

export function validateExecutablePath(exePath: string): string {
  if (!exePath || typeof exePath !== 'string') {
    throw new Error('Executable path is required')
  }
  const trimmed = exePath.trim()
  if (!trimmed) {
    throw new Error('Executable path is required')
  }
  if (SHELL_METACHAR.test(trimmed)) {
    throw new Error('Executable path contains invalid characters')
  }
  return trimmed
}

export function validateShellPath(filePath: string): string {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Path is required')
  }
  if (filePath.includes('\0')) {
    throw new Error('Path contains invalid characters')
  }
  return path.resolve(filePath.trim())
}
