import { describe, it, expect } from 'vitest'
import { generateReference, formatReference } from '@/lib/reference'

describe('generateReference', () => {
  it('returns exactly 8 characters', () => {
    expect(generateReference()).toHaveLength(8)
  })

  it('matches alphanumeric uppercase pattern', () => {
    expect(generateReference()).toMatch(/^[A-Z0-9]{8}$/)
  })

  it('1000 calls produce no duplicates', () => {
    const refs = new Set(Array.from({ length: 1000 }, () => generateReference()))
    expect(refs.size).toBe(1000)
  })
})

describe('formatReference', () => {
  it('prefixes with EMB-', () => {
    expect(formatReference('A3FX92KL')).toBe('EMB-A3FX92KL')
  })

  it('combined with generateReference produces correct format', () => {
    const ref = formatReference(generateReference())
    expect(ref).toMatch(/^EMB-[A-Z0-9]{8}$/)
  })
})
