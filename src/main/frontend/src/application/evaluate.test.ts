import { describe, expect, it } from 'vitest'
import type { CheckIn } from '../domain/checkIn'
import type { Rule } from '../domain/rules'
import { fromCheckIn, type Observation } from '../domain/observation'
import { RULES } from '../test/rules'
import { CHART_WINDOW_MS } from '../domain/rules'
import { chartPoints, evaluate as evaluateObservations } from './evaluate'

const now = new Date('2026-11-14T12:00:00Z')

const base = { label: 'SpO₂', unit: '%', tier: 'CMO', what: 'w', why: 'y', howDecided: 'h', next: 'n', source: 's' }
const spo01: Rule = { ...base, id: 'SPO-01', system: 'Respiratory', indicator: 'spo2Percent', validMin: 50, validMax: 100, below: 94, status: 'check' }
const spo02: Rule = { ...base, id: 'SPO-02', system: 'Respiratory', indicator: 'spo2Percent', validMin: 50, validMax: 100, below: 90, status: 'emergency', tier: 'Urgent ground' }
const hr = (id: string, above: number, status: Rule['status'] = 'check'): Rule => ({
  ...base, id, system: 'Test', indicator: 'heartRateBpm', label: 'HR', unit: 'bpm', validMin: 20, validMax: 250, above, status,
})

const reading = (id: string, recordedAt: string, fields: Partial<CheckIn>): CheckIn => ({ id, recordedAt, symptoms: [], ...fields })

const evaluate = (rules: Rule[], checkIns: CheckIn[], at: Date) => evaluateObservations(rules, checkIns.flatMap(fromCheckIn), at)

describe('evaluate', () => {
  it('returns one status per system in table order', () => {
    const statuses = evaluate([spo01, spo02, hr('HR-01', 100)], [reading('a', '2026-11-14T11:00:00Z', { spo2Percent: 97, heartRateBpm: 110 })], now)

    expect(statuses.map((s) => [s.system, s.state, s.rule?.id])).toEqual([
      ['Respiratory', 'nominal', undefined],
      ['Test', 'check', 'HR-01'],
    ])
  })

  it('matches "above" strictly', () => {
    const at = (value: number) => evaluate([hr('HR-01', 100)], [reading('a', '2026-11-14T11:00:00Z', { heartRateBpm: value })], now)[0].state

    expect(at(100)).toBe('nominal')
    expect(at(101)).toBe('check')
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

    expect(status).toMatchObject({ state: 'emergency', value: 88 })
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

    expect(status).toMatchObject({ state: 'check', value: 92 })
  })

  it('reports no data when no reading is valid', () => {
    expect(evaluate([spo01], [reading('a', '2026-11-14T11:00:00Z', { spo2Percent: 120 })], now)).toEqual([
      { system: 'Respiratory', state: 'no-data' },
    ])
  })

  it('reports stale only when the value is older than 24 h', () => {
    const at = (recordedAt: string) => evaluate([spo01, spo02], [reading('a', recordedAt, { spo2Percent: 88 })], now)[0]

    expect(at('2026-11-13T12:00:00Z').state).toBe('emergency')
    expect(at('2026-11-13T11:59:00Z')).toEqual({
      system: 'Respiratory', state: 'stale', label: 'SpO₂', unit: '%', value: 88, recordedAt: '2026-11-13T11:59:00Z', source: 'manual',
    })
  })
})

describe('evaluate with the PVT (#17)', () => {
  const cog01: Rule = {
    ...base, id: 'COG-01', system: 'Cognition', indicator: 'pvtMedianMs', label: 'PVT median', unit: 'ms',
    validMin: 130, validMax: 10000, above: 305, status: 'check',
  }
  const DAY = 24 * 60 * 60_000
  const at = (msBefore: number) => new Date(now.getTime() - msBefore).toISOString()

  it('AC3: no PVT is no data, with no source', () => {
    expect(evaluate([cog01], [], now)).toEqual([{ system: 'Cognition', state: 'no-data' }])
  })

  it('a PVT goes stale after 4 days, not 24 h, and keeps its in-app test label', () => {
    const fresh = evaluate([cog01], [reading('a', at(4 * DAY), { pvtMedianMs: 312 })], now)[0]
    const old = evaluate([cog01], [reading('a', at(4 * DAY + 60_000), { pvtMedianMs: 312 })], now)[0]

    expect(fresh).toMatchObject({ state: 'check', source: 'in-app test' })
    expect(old).toMatchObject({ state: 'stale', source: 'in-app test' })
  })

  it('SpO₂ keeps 24 h and the manual label', () => {
    const [status] = evaluate([spo01], [reading('a', at(DAY + 60_000), { spo2Percent: 92 })], now)

    expect(status).toMatchObject({ state: 'stale', source: 'manual' })
  })
})

describe('evaluate, a system with several indicators (Cabin air)', () => {
  const air = (id: string, indicator: Rule['indicator'], label: string, unit: string, threshold: { above?: number; below?: number }): Rule => ({
    ...base, id, system: 'Cabin air', indicator, label, unit, validMin: 0, validMax: 100, status: 'check', ...threshold,
  })
  const rows = [
    air('CAB-01', 'cabinCo2MmHg', 'CO₂ (1-h avg)', 'mmHg', { above: 3 }),
    air('CAB-02', 'cabinTempC', 'Cabin temp', '°C', { below: 18 }),
    air('CAB-03', 'cabinTempC', 'Cabin temp', '°C', { above: 27 }),
    air('CAB-04', 'cabinHumidityPct', 'Cabin humidity', '% RH', { above: 75 }),
  ]
  const obs = (indicator: Rule['indicator'], value: number, recordedAt = '2026-11-14T11:59:00Z'): Observation => ({
    resourceType: 'Observation', id: `env-node:m-${indicator}:${indicator}`, status: 'final', code: { text: indicator },
    valueQuantity: { value, unit: '' }, effectiveDateTime: recordedAt, device: { display: 'environment node · synthetic' },
  })
  const status = (observations: Observation[]) => evaluateObservations(rows, observations, now)

  it('shows the first indicator when all are nominal', () => {
    const [s] = status([obs('cabinCo2MmHg', 2.3), obs('cabinTempC', 22), obs('cabinHumidityPct', 45)])

    expect([s.state, s.label, s.value, s.rule]).toEqual(['nominal', 'CO₂ (1-h avg)', 2.3, undefined])
  })

  it('shows the worst indicator: temperature 28 °C is a check while CO₂ is nominal', () => {
    const [s] = status([obs('cabinCo2MmHg', 2.3), obs('cabinTempC', 28), obs('cabinHumidityPct', 45)])

    expect([s.state, s.label, s.value, s.unit, s.rule?.id]).toEqual(['check', 'Cabin temp', 28, '°C', 'CAB-03'])
  })

  it('equal severity keeps table order', () => {
    const [s] = status([obs('cabinCo2MmHg', 3.4), obs('cabinHumidityPct', 80)])

    expect(s.rule?.id).toBe('CAB-01')
  })

  it('a fresh nominal beats a stale indicator; all missing is no data', () => {
    const [s] = status([obs('cabinCo2MmHg', 9, '2026-11-12T11:00:00Z'), obs('cabinTempC', 22)])

    expect([s.state, s.label]).toEqual(['nominal', 'Cabin temp'])
    expect(status([])[0].state).toBe('no-data')
  })
})

describe('evaluate with the shipped rules (#43)', () => {
  const NOW = new Date('2026-11-14T09:31:07Z')
  const obs = (indicator: Rule['indicator'], value: number): Observation => ({
    resourceType: 'Observation', id: `dev:m:${indicator}`, status: 'final', code: { text: indicator },
    valueQuantity: { value, unit: '' }, effectiveDateTime: NOW.toISOString(), device: { display: 'BP cuff · synthetic' },
  })
  const system = (name: string, observations: Observation[]) => {
    const s = evaluateObservations(RULES, observations, NOW).find((status) => status.system === name)!
    return [s.state, s.rule?.id]
  }

  it('AC1: a more severe level wins inside an indicator and across indicators', () => {
    expect(system('Cardiovascular', [obs('systolicMmHg', 150), obs('diastolicMmHg', 70)])).toEqual(['treat', 'BP-04'])
    expect(system('Cardiovascular', [obs('systolicMmHg', 125), obs('diastolicMmHg', 85)])).toEqual(['check', 'BP-03'])
    expect(system('Cardiovascular', [obs('systolicMmHg', 125), obs('diastolicMmHg', 95)])).toEqual(['treat', 'BP-05'])
    expect(system('Cardiovascular', [obs('systolicMmHg', 185), obs('diastolicMmHg', 95)])).toEqual(['emergency', 'BP-06'])
    expect(system('Cabin air', [obs('cabinCo2MmHg', 2.8), obs('cabinTempC', 22)])).toEqual(['watch', 'CAB-06'])
  })

  it.each([
    [100, 'nominal', undefined],
    [101, 'check', 'CV-01'],
    [39, 'check', 'CV-02'],
  ])('AC5: heart rate %s → Cardiovascular %s %s', (value, state, rule) => {
    expect(system('Cardiovascular', [obs('heartRateBpm', value)])).toEqual([state, rule])
  })

  it.each([
    [119, 79, 'nominal', undefined],
    [120, 79, 'watch', 'BP-01'],
    [130, 70, 'check', 'BP-02'],
    [118, 80, 'check', 'BP-03'],
    [140, 70, 'treat', 'BP-04'],
    [118, 90, 'treat', 'BP-05'],
    [180, 70, 'emergency', 'BP-06'],
    [118, 120, 'emergency', 'BP-07'],
  ])('AC5: BP %s/%s → Cardiovascular %s %s', (systolic, diastolic, state, rule) => {
    expect(system('Cardiovascular', [obs('systolicMmHg', systolic), obs('diastolicMmHg', diastolic)])).toEqual([state, rule])
  })

  it.each([
    ['Immune', 'bodyTempC', 37.9, 'nominal', undefined],
    ['Immune', 'bodyTempC', 38.0, 'check', 'TMP-01'],
    ['Cabin air', 'cabinCo2MmHg', 2.5, 'nominal', undefined],
    ['Cabin air', 'cabinCo2MmHg', 2.6, 'watch', 'CAB-06'],
    ['Cabin air', 'cabinCo2MmHg', 3.1, 'check', 'CAB-01'],
    ['Radiation', 'doseRateMsvDay', 0.9, 'nominal', undefined],
    ['Radiation', 'doseRateMsvDay', 0.91, 'check', 'RAD-03'],
  ] as const)('AC6: %s %s %s → %s %s', (name, indicator, value, state, rule) => {
    expect(system(name, [obs(indicator, value)])).toEqual([state, rule])
  })
})

describe('resting HR drift CV-03 (#35)', () => {
  const NOW = new Date('2026-11-14T09:30:00Z')
  const CV03 = RULES.filter((r) => r.id === 'CV-03')
  const hr = (day: number, time: string, value: number): CheckIn =>
    reading(`hr-${day}-${time}`, `2026-11-${String(day).padStart(2, '0')}T${time}:00Z`, { heartRateBpm: value })
  const daily = (days: number[], value: number) => days.map((day) => hr(day, '07:00', value))
  const obs = (id: string, indicator: Rule['indicator'], value: number, at: string, display: Observation['device']['display']): Observation => ({
    resourceType: 'Observation', id, status: 'final', code: { text: indicator }, valueQuantity: { value, unit: '' },
    effectiveDateTime: at, device: { display },
  })
  const BRC = obs('bracelet:m1:heartRateBpm', 'heartRateBpm', 71, '2026-11-14T06:00:00Z', 'bracelet · synthetic')
  const BPC = [
    obs('bp-cuff:m2:systolicMmHg', 'systolicMmHg', 125, '2026-11-14T08:00:00Z', 'BP cuff · synthetic'),
    obs('bp-cuff:m2:diastolicMmHg', 'diastolicMmHg', 70, '2026-11-14T08:00:00Z', 'BP cuff · synthetic'),
  ]
  const observations = (seed: CheckIn[], extra: Observation[] = []) => [...seed.flatMap(fromCheckIn), ...extra]
  const cardio = (seed: CheckIn[], extra: Observation[] = []) =>
    evaluateObservations(RULES, observations(seed, extra), NOW).find((s) => s.system === 'Cardiovascular')!
  const points = (seed: CheckIn[], stale = false) =>
    chartPoints(CV03, observations(seed), NOW, stale, CHART_WINDOW_MS).map((p) => [p.recordedAt.slice(0, 10), p.value, p.status, p.rule?.id])

  it('AC6: resting HR 70 on 12, 13 and 14 Nov → watch, CV-03', () => {
    const s = cardio(daily([12, 13, 14], 70))

    expect(s).toMatchObject({ state: 'watch', label: 'Resting HR', unit: 'bpm', value: 70, recordedAt: '2026-11-14T07:00:00Z', source: 'manual' })
    expect(s.rule?.id).toBe('CV-03')
  })

  it('AC7: 69 bpm counts (≥), 68 does not', () => {
    expect(cardio(daily([12, 13, 14], 69))).toMatchObject({ state: 'watch', rule: { id: 'CV-03' } })
    const s = cardio(daily([12, 13, 14], 68))
    expect(s).toMatchObject({ state: 'nominal', label: 'Heart rate', value: 68 })
    expect(s.rule).toBeUndefined()
  })

  it('AC8: a lower reading on the newest day breaks the run', () => {
    const s = cardio([...daily([12, 13, 14], 70), hr(14, '08:00', 66)])

    expect(s).toMatchObject({ state: 'nominal', label: 'Heart rate', value: 66, recordedAt: '2026-11-14T08:00:00Z' })
    expect(s.rule).toBeUndefined()
  })

  it('AC9: a missing day or only 2 days is nominal', () => {
    expect(cardio(daily([11, 12, 14], 70)).state).toBe('nominal')
    expect(cardio(daily([13, 14], 70)).state).toBe('nominal')
  })

  it('AC10: any source counts; a tie keeps the earliest reading', () => {
    expect(cardio(daily([12, 13], 70), [BRC])).toMatchObject({
      state: 'watch', value: 71, recordedAt: '2026-11-14T06:00:00Z', source: 'bracelet · synthetic',
    })
    expect(cardio([...daily([12, 13], 70), hr(14, '07:00', 71)], [BRC]).recordedAt).toBe('2026-11-14T06:00:00Z')
  })

  it('AC11: out-of-range readings are ignored, so the newest valid reading is 26.5 h old → stale', () => {
    const s = cardio([...daily([12, 13], 70), hr(14, '08:00', 300), hr(14, '08:30', 15)])

    expect(s).toMatchObject({ state: 'stale', value: 70 })
    expect(s.rule).toBeUndefined()
  })

  it('AC12: no heart rate and no BP → no data', () => {
    expect(cardio([]).state).toBe('no-data')
  })

  it('AC13: age from the newest reading, value from the newest day’s lowest', () => {
    expect(cardio([...daily([11, 12], 70), hr(13, '01:00', 70), hr(13, '23:00', 75)])).toMatchObject({
      state: 'watch', value: 70, recordedAt: '2026-11-13T01:00:00Z',
    })
    expect(cardio(daily([11, 12, 13], 70))).toMatchObject({ state: 'stale', value: 70 })
  })

  it('AC14: CV-01 check beats the drift watch', () => {
    const s = cardio([...daily([12, 13], 70), hr(14, '07:00', 105)])

    expect(s).toMatchObject({ state: 'check', label: 'Heart rate', value: 105, rule: { id: 'CV-01' } })
  })

  it('AC15: BP-01 watch beats the drift watch by table order', () => {
    expect(cardio(daily([12, 13, 14], 70), BPC)).toMatchObject({ state: 'watch', label: 'Systolic', value: 125, rule: { id: 'BP-01' } })
  })

  it('AC21: one point per day, the lowest of the day; the 3-day run is watch', () => {
    const seed = [61, 62, 60, 63, 70, 71, 70].map((v, i) => hr(8 + i, '07:00', v))

    expect(points([...seed, hr(13, '18:00', 90)])).toEqual([
      ['2026-11-08', 61, 'nominal', undefined],
      ['2026-11-09', 62, 'nominal', undefined],
      ['2026-11-10', 60, 'nominal', undefined],
      ['2026-11-11', 63, 'nominal', undefined],
      ['2026-11-12', 70, 'watch', 'CV-03'],
      ['2026-11-13', 71, 'watch', 'CV-03'],
      ['2026-11-14', 70, 'watch', 'CV-03'],
    ])
  })

  it('AC24: a high day outside a 3-day run stays nominal', () => {
    expect(points([hr(12, '07:00', 70), hr(13, '07:00', 63), hr(14, '07:00', 70)]).map((p) => p[2])).toEqual(['nominal', 'nominal', 'nominal'])
  })

  it('AC25: the newest point is stale when the status is; runs count days before the window', () => {
    expect(points(daily([5, 6, 7, 8], 70), true)).toEqual([['2026-11-08', 70, 'stale', undefined]])
    expect(points([...daily([5, 6, 7, 8], 70), hr(14, '07:00', 61)])).toEqual([
      ['2026-11-08', 70, 'watch', 'CV-03'],
      ['2026-11-14', 61, 'nominal', undefined],
    ])
  })
})
