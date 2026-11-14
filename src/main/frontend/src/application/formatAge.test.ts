import { describe, expect, it } from 'vitest'
import { formatAge, formatDelay, formatOldAge, formatStaleAge, formatTime } from './formatAge'

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

  it('AC29: formatOldAge ends ages with "old"; formatStaleAge still prefixes "data"', () => {
    expect(formatOldAge(before(24 * 3600), now)).toBe('1 d old')
    expect(formatOldAge(before(2 * 3600), now)).toBe('2 h old')
    expect(formatStaleAge(before(24 * 3600), now)).toBe('data 1 d old')
  })
})

describe('formatTime', () => {
  it('AC23: local time as zero-padded 24-h HH:MM', () => {
    expect(formatTime(new Date(2026, 10, 14, 7, 5).toISOString())).toBe('07:05')
    expect(formatTime(new Date(2026, 10, 14, 23, 59).toISOString())).toBe('23:59')
  })
})

describe('formatDelay', () => {
  it.each([
    [845_000, '14 min 05 s'],
    [1_690_000, '28 min 10 s'],
    [120_000, '2 min 00 s'],
  ])('AC2: %i ms → %s', (ms, expected) => {
    expect(formatDelay(ms)).toBe(expected)
  })
})
