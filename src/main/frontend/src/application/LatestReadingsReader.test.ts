import { describe, expect, it } from 'vitest'
import type { CheckIn } from '../domain/checkIn'
import { READINGS, type ReadingPlaceholder } from '../domain/readings'
import { STALE_AFTER_MS, type Rule } from '../domain/rules'
import { mockReadings } from '../infrastructure/mockReadings'
import rules from '../infrastructure/rules.json'
import { FakeRepository, FakeRuleSource } from '../test/fakes'
import { LatestReadingsReader } from './LatestReadingsReader'

const now = new Date('2026-11-14T12:00:00Z')

async function read(checkIns: CheckIn[], { ruleRows = rules as Rule[], placeholders = [] as ReadingPlaceholder[] } = {}) {
  const repository = new FakeRepository()
  checkIns.forEach((c) => repository.items.set(c.id, { checkIn: c, pending: false }))
  return new LatestReadingsReader(new FakeRuleSource(ruleRows), repository, () => now, placeholders).read()
}

const byKey = async (key: string, ...args: Parameters<typeof read>) => (await read(...args)).find((r) => r.spec.key === key)
const checkIn = (fields: Partial<CheckIn>, recordedAt: string): CheckIn => ({ id: 'a', recordedAt, symptoms: [], ...fields })

describe('LatestReadingsReader', () => {
  it('AC24: returns one reading per READINGS row, with the synthetic placeholders', async () => {
    const readings = await read([], { placeholders: mockReadings })

    expect(readings.map((r) => r.spec)).toEqual(READINGS)
    expect(readings.slice(4)).toEqual([
      { spec: READINGS[4], state: 'synthetic', text: '108/70', source: 'synthetic' },
      { spec: READINGS[5], state: 'synthetic', text: '2.3', source: 'synthetic' },
    ])
  })

  it('AC24: a row with no input and no placeholder has no data', async () => {
    const readings = await read([])

    expect(readings.slice(4).map((r) => [r.spec.key, r.state])).toEqual([
      ['bloodPressure', 'no-data'],
      ['cabinCo2', 'no-data'],
    ])
  })

  it.each([
    ['heartRate', { heartRateBpm: 19 }],
    ['heartRate', { heartRateBpm: 251 }],
    ['spo2', { spo2Percent: 49 }],
    ['spo2', { spo2Percent: 101 }],
    ['sleep', { sleepHours: -1 }],
    ['sleep', { sleepHours: 24.5 }],
    ['mood', { mood: 0 }],
    ['mood', { mood: 6 }],
    ['heartRate', { heartRateBpm: Number.NaN }],
    ['spo2', { spo2Percent: Number.NaN }],
    ['sleep', { sleepHours: Number.NaN }],
    ['mood', { mood: Number.NaN }],
    ['heartRate', { heartRateBpm: '63' as unknown as number }],
  ])('AC21: %s from %o has no data', async (key, fields) => {
    const reading = await byKey(key, [checkIn(fields, '2026-11-14T11:00:00Z')])

    expect(reading?.state).toBe('no-data')
  })

  it.each([
    ['heartRate', 'heartRateBpm', 20],
    ['heartRate', 'heartRateBpm', 250],
    ['spo2', 'spo2Percent', 50],
    ['spo2', 'spo2Percent', 100],
    ['sleep', 'sleepHours', 0],
    ['sleep', 'sleepHours', 24],
    ['mood', 'mood', 1],
    ['mood', 'mood', 5],
  ])('AC22: %s %s = %d is shown', async (key, field, value) => {
    const reading = await byKey(key, [checkIn({ [field]: value }, '2026-11-14T11:00:00Z')])

    expect(reading?.state).not.toBe('no-data')
    expect(reading?.value).toBe(value)
  })

  it.each([
    ['spo2', 'spo2Percent', 96],
    ['heartRate', 'heartRateBpm', 63],
    ['sleep', 'sleepHours', 7],
    ['mood', 'mood', 3],
  ])('AC23: %s is stale 24 h + 1 ms after it was recorded, not at exactly 24 h', async (key, field, value) => {
    const at = async (ageMs: number) =>
      (await byKey(key, [checkIn({ [field]: value }, new Date(now.getTime() - ageMs).toISOString())]))?.state

    expect(await at(STALE_AFTER_MS + 1)).toBe('stale')
    expect(await at(STALE_AFTER_MS)).not.toBe('stale')
  })

  it('AC25: a heart-rate rule row sets the Heart rate state', async () => {
    const [spo01, spo02] = rules as Rule[]
    const heartRateRow: Rule = {
      ...spo01, id: 'TEST-HR', system: 'Test', indicator: 'heartRateBpm', above: 100, below: undefined, status: 'caution', validMin: 20, validMax: 250,
    }

    const reading = await byKey('heartRate', [checkIn({ heartRateBpm: 110 }, '2026-11-14T11:00:00Z')], { ruleRows: [spo01, spo02, heartRateRow] })

    expect(reading?.state).toBe('caution')
  })
})
