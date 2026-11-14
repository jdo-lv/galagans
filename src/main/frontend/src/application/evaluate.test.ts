import { describe, expect, it } from 'vitest'
import type { CheckIn } from '../domain/checkIn'
import type { Rule } from '../domain/rules'
import { evaluate } from './evaluate'

const now = new Date('2026-11-14T12:00:00Z')

const base = { label: 'SpO₂', unit: '%', tier: 'CMO', what: 'w', why: 'y', howDecided: 'h', next: 'n', source: 's' }
const spo01: Rule = { ...base, id: 'SPO-01', system: 'Respiratory', indicator: 'spo2Percent', validMin: 50, validMax: 100, below: 94, status: 'caution' }
const spo02: Rule = { ...base, id: 'SPO-02', system: 'Respiratory', indicator: 'spo2Percent', validMin: 50, validMax: 100, below: 90, status: 'warning', tier: 'Urgent ground' }
const hr = (id: string, above: number, status: Rule['status'] = 'caution'): Rule => ({
  ...base, id, system: 'Test', indicator: 'heartRateBpm', label: 'HR', unit: 'bpm', validMin: 20, validMax: 250, above, status,
})

const reading = (id: string, recordedAt: string, fields: Partial<CheckIn>): CheckIn => ({ id, recordedAt, symptoms: [], ...fields })

describe('evaluate', () => {
  it('returns one status per system in table order', () => {
    const statuses = evaluate([spo01, spo02, hr('HR-01', 100)], [reading('a', '2026-11-14T11:00:00Z', { spo2Percent: 97, heartRateBpm: 110 })], now)

    expect(statuses.map((s) => [s.system, s.state, s.rule?.id])).toEqual([
      ['Respiratory', 'nominal', undefined],
      ['Test', 'caution', 'HR-01'],
    ])
  })

  it('matches "above" strictly', () => {
    const at = (value: number) => evaluate([hr('HR-01', 100)], [reading('a', '2026-11-14T11:00:00Z', { heartRateBpm: value })], now)[0].state

    expect(at(100)).toBe('nominal')
    expect(at(101)).toBe('caution')
  })

  it('returns the first row in table order when rows of equal status match', () => {
    const [status] = evaluate([hr('HR-02', 100), hr('HR-01', 90)], [reading('a', '2026-11-14T11:00:00Z', { heartRateBpm: 120 })], now)

    expect(status.rule?.id).toBe('HR-02')
  })

  it.each([
    ['96 first', ['a', 'b']],
    ['88 first', ['b', 'a']],
  ])('picks the more severe reading on equal timestamps (%s)', (_, order) => {
    const byId = {
      a: reading('a', '2026-11-14T11:00:00Z', { spo2Percent: 96 }),
      b: reading('b', '2026-11-14T11:00:00Z', { spo2Percent: 88 }),
    }
    const [status] = evaluate([spo01, spo02], order.map((id) => byId[id as 'a' | 'b']), now)

    expect(status).toMatchObject({ state: 'warning', value: 88 })
  })

  it('picks the lower id on equal timestamps and equal status', () => {
    for (const order of [['b', 'a'], ['a', 'b']]) {
      const byId = {
        a: reading('a', '2026-11-14T11:00:00Z', { spo2Percent: 97 }),
        b: reading('b', '2026-11-14T11:00:00Z', { spo2Percent: 96 }),
      }
      const [status] = evaluate([spo01], order.map((id) => byId[id as 'a' | 'b']), now)
      expect(status.value).toBe(97)
    }
  })

  it('ignores values outside the valid range or not finite', () => {
    const [status] = evaluate(
      [spo01, spo02],
      [
        reading('a', '2026-11-14T11:30:00Z', { spo2Percent: 0 }),
        reading('b', '2026-11-14T11:20:00Z', { spo2Percent: Number.NaN }),
        reading('c', '2026-11-14T11:10:00Z', { spo2Percent: 120 }),
        reading('d', '2026-11-14T11:00:00Z', { spo2Percent: 92 }),
      ],
      now,
    )

    expect(status).toMatchObject({ state: 'caution', value: 92 })
  })

  it('reports no data when no reading is valid', () => {
    expect(evaluate([spo01], [reading('a', '2026-11-14T11:00:00Z', { spo2Percent: 120 })], now)).toEqual([
      { system: 'Respiratory', state: 'no-data', source: 'manual' },
    ])
  })

  it('reports stale only when the value is older than 24 h', () => {
    const at = (recordedAt: string) => evaluate([spo01, spo02], [reading('a', recordedAt, { spo2Percent: 88 })], now)[0]

    expect(at('2026-11-13T12:00:00Z').state).toBe('warning')
    expect(at('2026-11-13T11:59:00Z')).toEqual({
      system: 'Respiratory', state: 'stale', label: 'SpO₂', unit: '%', value: 88, recordedAt: '2026-11-13T11:59:00Z', source: 'manual',
    })
  })
})

describe('evaluate with the PVT (#17)', () => {
  const cog01: Rule = {
    ...base, id: 'COG-01', system: 'Cognition', indicator: 'pvtMedianMs', label: 'PVT median', unit: 'ms',
    validMin: 130, validMax: 10000, above: 305, status: 'caution',
  }
  const DAY = 24 * 60 * 60_000
  const at = (msBefore: number) => new Date(now.getTime() - msBefore).toISOString()

  it('AC3: no PVT is no data, labelled in-app test', () => {
    expect(evaluate([cog01], [], now)).toEqual([{ system: 'Cognition', state: 'no-data', source: 'in-app test' }])
  })

  it('a PVT goes stale after 4 days, not 24 h, and keeps its in-app test label', () => {
    const fresh = evaluate([cog01], [reading('a', at(4 * DAY), { pvtMedianMs: 312 })], now)[0]
    const old = evaluate([cog01], [reading('a', at(4 * DAY + 60_000), { pvtMedianMs: 312 })], now)[0]

    expect(fresh).toMatchObject({ state: 'caution', source: 'in-app test' })
    expect(old).toMatchObject({ state: 'stale', source: 'in-app test' })
  })

  it('SpO₂ keeps 24 h and the manual label', () => {
    const [status] = evaluate([spo01], [reading('a', at(DAY + 60_000), { spo2Percent: 92 })], now)

    expect(status).toMatchObject({ state: 'stale', source: 'manual' })
  })
})
