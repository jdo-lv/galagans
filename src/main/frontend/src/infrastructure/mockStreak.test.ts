import { describe, expect, it } from 'vitest'
import { mockCounters, mockStreakSeed } from './mockStreak'

describe('Synthetic routine history (#40)', () => {
  it('AC48: 13 seed days copy mockup 09 cells 133–145', () => {
    expect(mockStreakSeed).toEqual([
      { daysBefore: 13, kind: 'done' },
      { daysBefore: 12, kind: 'done' },
      { daysBefore: 11, kind: 'done' },
      { daysBefore: 10, kind: 'done' },
      { daysBefore: 9, kind: 'done' },
      { daysBefore: 8, kind: 'done' },
      { daysBefore: 7, kind: 'paused' },
      { daysBefore: 6, kind: 'paused' },
      { daysBefore: 5, kind: 'reported' },
      { daysBefore: 4, kind: 'reported' },
      { daysBefore: 3, kind: 'done' },
      { daysBefore: 2, kind: 'reported' },
      { daysBefore: 1, kind: 'reported' },
    ])
  })

  it('AC49: exercise and fluid counters are synthetic placeholders', () => {
    expect(mockCounters).toEqual([
      { label: 'Exercise this week', value: '540 / 600 min', detail: 'countermeasure minutes done', source: 'synthetic' },
      { label: 'Fluid log', value: '4 of 7 days', detail: 'days you logged to target', source: 'synthetic' },
    ])
  })
})
