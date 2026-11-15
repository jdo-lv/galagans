import { describe, expect, it } from 'vitest'
import type { CheckIn } from '../domain/checkIn'
import type { Observation } from '../domain/observation'
import { READINGS } from '../domain/readings'
import { STALE_AFTER_MS, type Rule } from '../domain/rules'
import { RULES } from '../test/rules'
import { combinedHistory, FakeObservationRepository, FakeRepository, FakeRuleSource } from '../test/fakes'
import { LatestReadingsReader } from './LatestReadingsReader'

const now = new Date('2026-11-14T12:00:00Z')

async function read(checkIns: CheckIn[], { ruleRows = RULES, devices = [] as Observation[] } = {}) {
  const repository = new FakeRepository()
  checkIns.forEach((c) => repository.items.set(c.id, { checkIn: c, pending: false }))
  const observations = new FakeObservationRepository()
  devices.forEach((o) => observations.items.set(o.id, o))
  return new LatestReadingsReader(new FakeRuleSource(ruleRows), combinedHistory(repository, observations), () => now).read()
}

const device = (id: string, indicator: Observation['code']['text'], value: number, unit = 'mmHg'): Observation => ({
  resourceType: 'Observation',
  id: `bp-cuff:${id}:${indicator}`,
  status: 'final',
  code: { text: indicator },
  valueQuantity: { value, unit },
  effectiveDateTime: '2026-11-14T11:00:00Z',
  device: { display: 'BP cuff · synthetic' },
})

const byKey = async (key: string, ...args: Parameters<typeof read>) => (await read(...args)).find((r) => r.spec.key === key)
const checkIn = (fields: Partial<CheckIn>, recordedAt: string): CheckIn => ({ id: 'a', recordedAt, symptoms: [], ...fields })

describe('LatestReadingsReader', () => {
  it('returns one reading per READINGS row; device-only tiles have no data until a device sends', async () => {
    const readings = await read([])

    expect(readings.map((r) => r.spec)).toEqual(READINGS)
    expect(readings.filter((r) => r.state === 'no-data').map((r) => r.spec.key)).toEqual(READINGS.map((r) => r.key))
  })

  it('Blood pressure shows "systolic/diastolic" from the same measurement, rated by its systolic rows since #43', async () => {
    const reading = await byKey('bloodPressure', [], {
      devices: [device('m1', 'systolicMmHg', 108), device('m1', 'diastolicMmHg', 70), device('m0', 'diastolicMmHg', 99)],
    })

    expect(reading).toMatchObject({ state: 'nominal', value: 108, text: '108/70', source: 'BP cuff · synthetic' })
    expect(reading).not.toHaveProperty('unrated')
  })

  it('Blood pressure without its diastolic shows the systolic value only', async () => {
    const reading = await byKey('bloodPressure', [], { devices: [device('m1', 'systolicMmHg', 108)] })

    expect(reading).toMatchObject({ value: 108 })
    expect(reading?.text).toBeUndefined()
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

  it('#19 AC8: a caution reading carries the rule row that decided it', async () => {
    const reading = await byKey('spo2', [checkIn({ spo2Percent: 92 }, '2026-11-14T11:50:00Z')])

    expect(reading?.state).toBe('check')
    expect(reading?.rule?.id).toBe('SPO-01')
    expect(reading?.unrated).toBeUndefined()
  })

  it('#19 AC10: a nominal reading of a rated indicator has no rule and is not unrated', async () => {
    const reading = await byKey('spo2', [checkIn({ spo2Percent: 96 }, '2026-11-14T11:50:00Z')])

    expect(reading?.state).toBe('nominal')
    expect(reading).not.toHaveProperty('rule')
    expect(reading).not.toHaveProperty('unrated')
  })

  it('#19 AC11: a stale reading carries no rule, even when its value matches one', async () => {
    const reading = await byKey('spo2', [checkIn({ spo2Percent: 92 }, '2026-11-13T11:00:00Z')])

    expect(reading?.state).toBe('stale')
    expect(reading).not.toHaveProperty('rule')
  })

  it('#19 AC12: an indicator with no rule rows is unrated (Sleep; Heart rate has CV rows since #43)', async () => {
    const reading = await byKey('sleep', [checkIn({ sleepHours: 7 }, '2026-11-14T11:50:00Z')])

    expect(reading?.state).toBe('nominal')
    expect(reading?.unrated).toBe(true)
  })

  it('AC25: a heart-rate rule row sets the Heart rate state', async () => {
    const [spo01, spo02] = RULES
    const heartRateRow: Rule = {
      ...spo01, id: 'TEST-HR', system: 'Test', indicator: 'heartRateBpm', above: 100, below: undefined, status: 'check', validMin: 20, validMax: 250,
    }

    const reading = await byKey('heartRate', [checkIn({ heartRateBpm: 110 }, '2026-11-14T11:00:00Z')], { ruleRows: [spo01, spo02, heartRateRow] })

    expect(reading?.state).toBe('check')
  })

  it('#35 AC20: the CV-03 drift row never rates the Heart rate reading', async () => {
    const repository = new FakeRepository()
    for (const day of [12, 13, 14]) {
      repository.items.set(`hr-${day}`, { checkIn: { id: `hr-${day}`, recordedAt: `2026-11-${day}T07:00:00Z`, heartRateBpm: 70, symptoms: [] }, pending: false })
    }
    const readings = await new LatestReadingsReader(new FakeRuleSource(RULES), combinedHistory(repository), () => new Date('2026-11-14T09:30:00Z')).read()
    const heartRate = readings.find((r) => r.spec.key === 'heartRate')!

    expect(heartRate).toMatchObject({ state: 'nominal', value: 70 })
    expect(heartRate).not.toHaveProperty('rule')
    expect(heartRate).not.toHaveProperty('unrated')
  })

  it('#35 AC20: a rule set with only a drift row on an indicator leaves its reading unrated', async () => {
    const reading = await byKey('heartRate', [checkIn({ heartRateBpm: 70 }, '2026-11-14T11:00:00Z')], { ruleRows: RULES.filter((r) => r.id === 'CV-03') })

    expect(reading).toMatchObject({ state: 'nominal', unrated: true })
  })
})
