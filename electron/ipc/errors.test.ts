import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'
import { fromThrown, safe } from './errors'
import { ok, err } from '../../shared/result'

describe('ipc errors: fromThrown', () => {
  it('handles plain Error', () => {
    const e = fromThrown(new Error('oops'))
    expect(e.code).toBe('INTERNAL_ERROR')
    expect(e.message).toBe('oops')
  })

  it('preserves Error.code when string', () => {
    const fake = Object.assign(new Error('typed'), { code: 'DB_ERROR' })
    const e = fromThrown(fake)
    expect(e.code).toBe('DB_ERROR')
    expect(e.message).toBe('typed')
  })

  it('handles ZodError → INVALID_INPUT with details', () => {
    const z = new ZodError([{ path: ['foo'], message: 'bad', code: 'custom' }])
    const e = fromThrown(z)
    expect(e.code).toBe('INVALID_INPUT')
    expect(e.message).toMatch(/foo.*bad/)
  })

  it('handles string', () => {
    const e = fromThrown('just a string')
    expect(e.code).toBe('INTERNAL_ERROR')
    expect(e.message).toBe('just a string')
  })

  it('handles non-string non-error', () => {
    const e = fromThrown(42)
    expect(e.code).toBe('INTERNAL_ERROR')
    expect(e.message).toBe('Unknown error')
  })
})

describe('ipc errors: safe', () => {
  it('passes through ok results', async () => {
    const env = await safe(async () => ok(123))
    expect(env.ok).toBe(true)
    if (env.ok) expect(env.data).toBe(123)
  })

  it('wraps err results', async () => {
    const env = await safe(async () => err('INVALID_INPUT', 'bad'))
    expect(env.ok).toBe(false)
    if (!env.ok) expect(env.error.code).toBe('INVALID_INPUT')
  })

  it('converts thrown Error into INTERNAL_ERROR envelope', async () => {
    const env = await safe(async () => {
      throw new Error('boom')
    })
    expect(env.ok).toBe(false)
    if (!env.ok) expect(env.error.message).toBe('boom')
  })
})
