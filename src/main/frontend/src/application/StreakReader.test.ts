import { describe, expect, it } from 'vitest'
import type { CheckIn } from '../domain/checkIn'
import type { ProcessCounter, RoutineStreak, SeedDay } from '../domain/streak'
import { mockCounters, mockStreakSeed } from '../infrastructure/mockStreak'
import { StreakReader } from './StreakReader'

// Local times, so the tests pass in any TZ.
const NOV = 10
const OCT = 9
let ids = 0
const checkIn = (day: number, symptoms: string[] = [], { month = NOV, h = 8, m = 0 } = {}): CheckIn => ({
  id: `c${++ids}`,
  recordedAt: new Date(2026, month, day, h, m).toISOString(),
  symptoms,
})
const pvt = (day: number, month = NOV): CheckIn => ({ ...checkIn(day, [], { month, h: 7 }), pvtMedianMs: 280, pvtLapses: 0, pvtFalseStarts: 0 })
const everyDay = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => checkIn(from + i))

function read(checkIns: CheckIn[], seed: SeedDay[] = [], placeholders: ProcessCounter[] = []): Promise<RoutineStreak> {
  return new StreakReader({ list: async () => checkIns }, () => new Date(2026, NOV, 14, 8, 5), seed, placeholders).read()
}

/** Day of November → kind, for the 14 shown days. */
const kinds = (s: RoutineStreak) => Object.fromEntries(s.days.map((d) => [Number(d.date.slice(8)), d.kind]))
const synthetic = (s: RoutineStreak) => Object.fromEntries(s.days.map((d) => [Number(d.date.slice(8)), d.synthetic]))

describe('StreakReader (#40)', () => {
  it('AC34: a missed day stops the count; 14 days from 1 Nov; nothing synthetic without a seed', async () => {
    const s = await read([checkIn(14), checkIn(13), checkIn(11)])
    expect(s.count).toBe(2)
    expect(s.days).toHaveLength(14)
    expect(s.days[0].date).toBe('2026-11-01')
    expect(s.days[13].date).toBe('2026-11-14')
    expect(kinds(s)[12]).toBe('missed')
    expect(s.days.every((d) => !d.synthetic)).toBe(true)
    expect(s.seededBefore).toBeUndefined()
  })

  it('AC35: a PVT result is not a morning check-in', async () => {
    const s = await read([checkIn(14), pvt(13)])
    expect(kinds(s)[13]).toBe('missed')
    expect(s.count).toBe(1)
  })

  it('AC36: a check-in with every step skipped counts as done', async () => {
    const s = await read([checkIn(14)])
    expect(kinds(s)[14]).toBe('done')
    expect(s.count).toBe(1)
  })

  it('AC37: two check-ins on one day make one cell, reported if any has a symptom', async () => {
    const s = await read([checkIn(14), checkIn(14, ['rash'], { h: 9 })])
    expect(kinds(s)[14]).toBe('reported')
  })

  it('AC38: 13 Nov 23:59 local counts for 13 Nov', async () => {
    const s = await read([checkIn(13, [], { h: 23, m: 59 })])
    expect(kinds(s)[13]).toBe('done')
    expect(kinds(s)[14]).toBe('missed')
  })

  it('AC39: the seed fills the 13 days before the first real day; the first real day reads 12', async () => {
    const s = await read([checkIn(14)], mockStreakSeed)
    expect(s.count).toBe(12)
    expect(kinds(s)).toEqual({
      1: 'done', 2: 'done', 3: 'done', 4: 'done', 5: 'done', 6: 'done', 7: 'paused',
      8: 'paused', 9: 'reported', 10: 'reported', 11: 'done', 12: 'reported', 13: 'reported', 14: 'done',
    })
    expect(s.days.slice(0, 13).every((d) => d.synthetic)).toBe(true)
    expect(synthetic(s)[14]).toBe(false)
    expect(s.seededBefore).toBe('2026-11-14')
  })

  it('AC40: a PVT result never anchors the seed', async () => {
    const s = await read([pvt(13), checkIn(14)], mockStreakSeed)
    expect(kinds(s)[13]).toBe('reported')
    expect(synthetic(s)[13]).toBe(true)
    expect(s.count).toBe(12)
    expect(s.seededBefore).toBe('2026-11-14')
  })

  it('AC41: after the first real day only real data counts, so a real miss resets the streak', async () => {
    const s = await read([checkIn(10), checkIn(11), checkIn(14)], mockStreakSeed)
    expect([kinds(s)[12], kinds(s)[13]]).toEqual(['missed', 'missed'])
    expect([synthetic(s)[12], synthetic(s)[13]]).toEqual([false, false])
    expect(s.count).toBe(1)
    expect(kinds(s)[9]).toBe('reported')
    expect(synthetic(s)[9]).toBe(true)
    expect(s.seededBefore).toBe('2026-11-10')
  })

  it('AC42: with no check-ins the seed counts back from today, and today without one does not stop the count', async () => {
    const s = await read([], mockStreakSeed)
    expect(kinds(s)[13]).toBe('reported')
    expect(synthetic(s)[13]).toBe(true)
    expect(kinds(s)[14]).toBe('missed')
    expect(s.count).toBe(11)
  })

  it('AC43: days before the first real day without a seed row are missed and not synthetic', async () => {
    const s = await read([checkIn(14)], [{ daysBefore: 1, kind: 'done' }])
    expect(kinds(s)[13]).toBe('done')
    expect(synthetic(s)[13]).toBe(true)
    for (let day = 1; day <= 12; day++) expect([kinds(s)[day], synthetic(s)[day]]).toEqual(['missed', false])
    expect(s.count).toBe(2)
  })

  it('AC44: the count walks past the 14 shown days into the seed, which still sets seededBefore', async () => {
    const s = await read(everyDay(1, 14), mockStreakSeed)
    expect(s.count).toBe(25)
    expect(s.days.every((d) => !d.synthetic)).toBe(true)
    expect(s.seededBefore).toBe('2026-11-01')
  })

  it('AC45: a seed that is neither shown nor counted leaves seededBefore unset', async () => {
    const s = await read(
      everyDay(1, 14).filter((c) => new Date(c.recordedAt).getDate() !== 5),
      mockStreakSeed,
    )
    expect(s.count).toBe(9)
    expect(s.days.every((d) => !d.synthetic)).toBe(true)
    expect(s.seededBefore).toBeUndefined()
  })

  it('AC46: symptomDays counts consecutive real days, ending today, per symptom logged today', async () => {
    const s = await read(
      [checkIn(12, ['headache', 'congestion']), checkIn(13, ['headache', 'rash']), checkIn(14, ['headache', 'back-pain', 'congestion'])],
      mockStreakSeed,
    )
    expect(s.symptomDays).toEqual({ headache: 3, 'back-pain': 1, congestion: 1 })
  })

  it('AC47: PVT sessions count distinct days among today and the 27 days before, after the placeholders', async () => {
    const s = await read([pvt(14), pvt(10), pvt(10), pvt(18, OCT), pvt(17, OCT)], [], mockCounters)
    expect(s.counters).toEqual([
      ...mockCounters,
      { label: 'PVT sessions', value: '3 of 7', detail: 'every 4th day, last 28 days' },
    ])
  })
})
