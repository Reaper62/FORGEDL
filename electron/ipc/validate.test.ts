import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { parse } from './validate'

const schema = z.object({
  url: z.string().url(),
  priority: z.number().int().min(1).max(10).optional(),
})

describe('parse', () => {
  it('returns ok with parsed data for valid input', () => {
    const r = parse(schema, { url: 'https://x' })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.data.url).toBe('https://x')
      expect(r.data.priority).toBeUndefined()
    }
  })

  it('returns INVALID_INPUT on bad url', () => {
    const r = parse(schema, { url: 'not-a-url' })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error.code).toBe('INVALID_INPUT')
      expect(r.error.message).toMatch(/url/)
    }
  })

  it('returns INVALID_INPUT on out-of-range priority', () => {
    const r = parse(schema, { url: 'https://x', priority: 99 })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.code).toBe('INVALID_INPUT')
  })

  it('includes zod-flatten details on failure', () => {
    const r = parse(schema, {})
    if (!r.ok) {
      expect(r.error.details).toBeDefined()
      expect(typeof r.error.details).toBe('object')
    }
  })
})
