import { describe, expect, it } from 'vitest'
import { formatAge, formatStaleAge } from './formatAge'

const now = new Date('2026-11-14T12:00:00Z')
const before = (seconds: number) => new Date(now.getTime() - seconds * 1000).toISOString()

describe('formatAge', () => {
  it.each([
    [0, 'just now'],
    [59, 'just now'],
    [60, '1 min ago'],
    [59 * 60 + 59, '59 min ago'],
    [60 * 60, '1 h ago'],
    [23 * 3600 + 59 * 60, '23 h ago'],
    [24 * 3600, '1 d ago'],
    [-5 * 60, 'just now'],
  ])('%i s old → %s', (seconds, expected) => {
    expect(formatAge(before(seconds), now)).toBe(expected)
  })

  it('prefixes stale ages with "data" and ends them with "old"', () => {
    expect(formatStaleAge(before(24 * 3600 + 60), now)).toBe('data 1 d old')
  })
})
