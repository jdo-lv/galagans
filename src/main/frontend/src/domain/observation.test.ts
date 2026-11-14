import { describe, expect, it } from 'vitest'
import type { CheckIn } from './checkIn'
import { fromCheckIn } from './observation'

const T = '2026-11-14T09:00:00Z'
const checkIn = (fields: Partial<CheckIn>): CheckIn => ({ id: 'c1', recordedAt: T, symptoms: [], ...fields })

describe('fromCheckIn', () => {
  it('AC1: one manual Observation per defined indicator field', () => {
    const observations = fromCheckIn(checkIn({ spo2Percent: 95, heartRateBpm: 60, sleepHours: 7, mood: 4 }))

    expect(observations).toEqual(
      [
        ['spo2Percent', 95, '%'],
        ['heartRateBpm', 60, 'bpm'],
        ['sleepHours', 7, 'h'],
        ['mood', 4, '/ 5'],
      ].map(([indicator, value, unit]) => ({
        resourceType: 'Observation',
        id: `c1:${indicator}`,
        status: 'final',
        code: { text: indicator },
        valueQuantity: { value, unit },
        effectiveDateTime: T,
        device: { display: 'manual' },
      })),
    )
  })

  it('AC2: only the PVT median becomes an Observation, from the in-app test', () => {
    const observations = fromCheckIn(checkIn({ pvtMedianMs: 310, pvtLapses: 1, pvtFalseStarts: 0, symptoms: ['headache'] }))

    expect(observations).toHaveLength(1)
    expect(observations[0]).toMatchObject({
      id: 'c1:pvtMedianMs',
      valueQuantity: { value: 310, unit: 'ms' },
      device: { display: 'in-app test' },
    })
  })
})
