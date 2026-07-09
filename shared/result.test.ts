import { describe, expect, it } from 'vitest'
import { err, isErr, isOk, ok, Result, unwrap } from './result'

describe('Result helpers', () => {
  it('ok constructs a success result', () => {
    const r = ok(42)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data).toBe(42)
  })

  it('err constructs a failure result with code+message', () => {
    const r = err('INVALID_INPUT', 'bad')
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error.code).toBe('INVALID_INPUT')
      expect(r.error.message).toBe('bad')
      expect(r.error.details).toBeUndefined()
    }
  })

  it('err includes details when provided', () => {
    const r = err('DB_ERROR', 'oops', { sql: 'SELECT 1' })
    if (!r.ok) expect(r.error.details).toEqual({ sql: 'SELECT 1' })
  })

  it('isOk narrows to success type', () => {
    const r: Result<number> = ok(7)
    if (isOk(r)) {
      expect(r.data).toBe(7)
    } else {
      throw new Error('should not reach here')
    }
  })

  it('isErr narrows to error type', () => {
    const r: Result<number> = err('NOT_FOUND', 'no item')
    if (isErr(r)) {
      expect(r.error.code).toBe('NOT_FOUND')
    } else {
      throw new Error('should not reach here')
    }
  })

  it('unwrap returns data on success', () => {
    expect(unwrap(ok('hi'))).toBe('hi')
  })

  it('unwrap throws on failure', () => {
    expect(() => unwrap(err('INTERNAL_ERROR', 'boom'))).toThrow(/INTERNAL_ERROR.*boom/)
  })
})
