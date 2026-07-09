// Error mappers — convert thrown errors and service results into
// the IPC Envelope shape that crosses the bridge.
import type { ZodError } from 'zod'
import { type AppError, type ErrorCode, type Result } from '../../shared/result'
import { wrap, type Envelope } from './result'

export const wrapResult = <T>(r: Result<T>): Envelope<T> => wrap(r)

export const failure = (code: ErrorCode, message: string, details?: unknown): Envelope<never> => ({
  ok: false,
  error: details === undefined ? { code, message } : { code, message, details },
})

/** Convert a thrown value (Error, string, ZodError, anything) to an AppError. */
export function fromThrown(value: unknown, fallback: ErrorCode = 'INTERNAL_ERROR'): AppError {
  if (value instanceof Error) {
    // Zod errors have a distinct shape.
    if ('issues' in value && Array.isArray((value as ZodError).issues)) {
      const z = value as ZodError
      return {
        code: 'INVALID_INPUT',
        message:
          z.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') ||
          'Validation failed',
        details: z.flatten(),
      }
    }
    const asAny = value as Error & { code?: unknown }
    if (typeof asAny.code === 'string') {
      return { code: asAny.code as ErrorCode, message: asAny.message }
    }
    return { code: fallback, message: asAny.message }
  }
  if (typeof value === 'string') {
    return { code: fallback, message: value }
  }
  return { code: fallback, message: 'Unknown error' }
}

/** Wrap an entire async handler in try/catch, returning an envelope. */
export async function safe<T>(fn: () => Promise<Result<T>>): Promise<Envelope<T>> {
  try {
    const r = await fn()
    return wrap(r)
  } catch (value) {
    return { ok: false, error: fromThrown(value) }
  }
}
