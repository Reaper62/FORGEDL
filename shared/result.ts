// Result<T> envelope and error code catalog — single source of truth used by
// services, IPC handlers, preload, and (optionally) renderer.
//
// Every fallible path returns a Result. There are no raw throws across layer
// boundaries. Repositories may throw internally for unrecoverable errors but
// always convert to Result at the service boundary.

export type ErrorCode =
  | 'INVALID_INPUT'
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'DB_ERROR'
  | 'YT_DLP_ERROR'
  | 'NO_ACTIVE_PROCESS'
  | 'PATH_TRAVERSAL'
  | 'INVALID_URL'
  | 'INTERNAL_ERROR'

export interface AppError {
  code: ErrorCode
  message: string
  details?: unknown
}

export type Result<T, E = AppError> = { ok: true; data: T } | { ok: false; error: E }

export const ok = <T>(data: T): Result<T> => ({ ok: true, data })

export const err = (code: ErrorCode, message: string, details?: unknown): Result<never> => ({
  ok: false,
  error: details === undefined ? { code, message } : { code, message, details },
})

export const isOk = <T>(r: Result<T>): r is { ok: true; data: T } => r.ok
export const isErr = <T>(r: Result<T>): r is { ok: false; error: AppError } => !r.ok

export function unwrap<T>(r: Result<T>): T {
  if (r.ok) return r.data
  throw new Error(`Result unwrap on err: ${r.error.code} — ${r.error.message}`)
}
