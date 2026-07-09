// Zod helpers used by IPC handlers. Validates the untrusted payload
// against a schema and returns a Result instead of throwing.
import type { ZodSchema } from 'zod'
import { ok, err, type Result, type ErrorCode } from '../../shared/result'

export function parse<T>(schema: ZodSchema<T>, input: unknown): Result<T> {
  const r = schema.safeParse(input)
  if (!r.success) {
    const issue = r.error.issues[0]
    return err(
      'INVALID_INPUT' satisfies ErrorCode,
      issue ? `${issue.path.join('.') || '(root)'}: ${issue.message}` : 'Invalid input',
      r.error.flatten(),
    )
  }
  return ok(r.data)
}
