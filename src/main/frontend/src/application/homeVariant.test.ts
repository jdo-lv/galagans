import { describe, expect, it } from 'vitest'
import { READINGS, type LatestReading } from '../domain/readings'
import { CHECK_IN_ROUTINE, type RoutineItem, type RoutineState } from '../domain/routine'
import { homeVariant } from './homeVariant'

const routine = (state: RoutineState): RoutineItem[] => [{ kind: 'check-in', ...CHECK_IN_ROUTINE, state }, { kind: 'pvt', label: 'PVT (3 min)', due: false }]
const readings = (pvt: LatestReading['state']): LatestReading[] =>
  READINGS.map((spec) => ({ spec, state: spec.key === 'pvt' ? pvt : 'no-data' }))

describe('homeVariant (#52)', () => {
  it.each(['done', 'upcoming'] as const)('AC6: check-in %s and PVT reading nominal → nominal, nothing to do', (state) => {
    expect(homeVariant({ routine: routine(state), readings: readings('nominal') })).toEqual({ variant: 'nominal', items: [] })
  })

  it.each([
    ['due', 'Due 07:00–09:00'],
    ['missed', 'Overdue since 09:00'],
  ] as const)('AC7: check-in %s → a check-in item "%s" fed by heart rate, SpO₂, sleep and mood', (state, when) => {
    const { variant, items } = homeVariant({ routine: routine(state), readings: readings('nominal') })

    expect(variant).toBe('todo')
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ id: 'check-in', title: 'Morning check-in', when, readingKeys: ['heartRate', 'spo2', 'sleep', 'mood'] })
  })

  it.each([
    ['no-data', 'Every 4th day · no result yet'],
    ['stale', 'Every 4th day · none in 4 days'],
  ] as const)('AC8: PVT reading %s → a PVT item "%s" for Cognition', (pvt, when) => {
    const { variant, items } = homeVariant({ routine: routine('done'), readings: readings(pvt) })

    expect(variant).toBe('todo')
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ id: 'pvt', title: 'PVT (3 min)', when, readingKeys: ['pvt'], systems: ['Cognition'] })
  })

  it('AC9: both owed → check-in first, then PVT', () => {
    const { items } = homeVariant({ routine: routine('missed'), readings: readings('no-data') })

    expect(items.map((i) => i.id)).toEqual(['check-in', 'pvt'])
  })

  it('a readings failure still lists the owed check-in, and a routine failure the owed PVT', () => {
    expect(homeVariant({ routine: routine('missed') }).items.map((i) => i.id)).toEqual(['check-in'])
    expect(homeVariant({ readings: readings('stale') }).items.map((i) => i.id)).toEqual(['pvt'])
  })

  it('every item says why, how long it takes and where that comes from', () => {
    const { items } = homeVariant({ routine: routine('missed'), readings: readings('no-data') })

    for (const item of items) for (const field of ['why', 'takes', 'source'] as const) expect(item[field]).not.toBe('')
  })
})
