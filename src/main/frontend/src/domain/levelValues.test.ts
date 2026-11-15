import { latestReading } from '../application/evaluate'
import { RULES } from '../test/rules'
import { DEVICES, type DeviceId, type DeviceSpec } from './devices'
import { deviceMessage, indicatorLevels, levelsFor, randomValues } from './levelValues'
import type { Observation } from './observation'
import type { Indicator, Status } from './rules'

const device = (id: DeviceId): DeviceSpec => DEVICES.find((d) => d.id === id)!
const LOWEST = () => 0
const HIGHEST = () => 0.999999

describe('levelsFor', () => {
  it.each([
    ['oximeter', ['nominal', 'check', 'emergency']],
    ['bracelet', ['nominal', 'check']],
    ['bp-cuff', ['nominal', 'watch', 'check', 'treat', 'emergency']],
    ['thermometer', ['nominal', 'check']],
    ['env-node', ['nominal', 'watch', 'check']],
    ['dosimeter', ['nominal', 'check', 'emergency']],
  ] as const)('AC14: %s → %j', (id, levels) => {
    expect(levelsFor(device(id), RULES)).toEqual(levels)
  })
})

describe('indicatorLevels', () => {
  it('AC15: the bracelet at check sets heart rate to check for every device', () => {
    expect(indicatorLevels({ bracelet: 'check' }, RULES)).toEqual({ heartRateBpm: 'check' })
  })

  it('AC15: absent or nominal devices set nothing', () => {
    expect(indicatorLevels({}, RULES)).toEqual({})
    expect(indicatorLevels({ oximeter: 'nominal' }, RULES)).toEqual({})
  })

  it('AC15: a level sets only the indicators that have a row at it', () => {
    expect(indicatorLevels({ oximeter: 'emergency' }, RULES)).toEqual({ spo2Percent: 'emergency' })
    expect(indicatorLevels({ 'env-node': 'watch' }, RULES)).toEqual({ cabinCo2MmHg: 'watch' })
    expect(indicatorLevels({ 'bp-cuff': 'watch' }, RULES)).toEqual({ systolicMmHg: 'watch' })
  })

  it('AC15: the most severe level wins for a shared indicator', () => {
    expect(indicatorLevels({ oximeter: 'check', bracelet: 'nominal', 'bp-cuff': 'emergency' }, RULES)).toEqual({
      spo2Percent: 'check',
      heartRateBpm: 'check',
      systolicMmHg: 'emergency',
      diastolicMmHg: 'emergency',
    })
  })
})

describe('randomValues', () => {
  it.each([
    ['bp-cuff', { systolicMmHg: 'watch' }, LOWEST, { systolic_mmhg: 120, diastolic_mmhg: 68, pulse_bpm: 62 }],
    ['bp-cuff', { systolicMmHg: 'watch' }, HIGHEST, { systolic_mmhg: 129, diastolic_mmhg: 72, pulse_bpm: 64 }],
    ['oximeter', { spo2Percent: 'emergency' }, LOWEST, { spo2_pct: 81, pulse_bpm: 62 }],
    ['oximeter', { spo2Percent: 'emergency' }, HIGHEST, { spo2_pct: 89, pulse_bpm: 64 }],
    ['thermometer', { bodyTempC: 'check' }, LOWEST, { temp_c: 38 }],
    ['thermometer', { bodyTempC: 'check' }, HIGHEST, { temp_c: 41.6 }],
    ['thermometer', {}, LOWEST, { temp_c: 35.7 }],
    ['thermometer', {}, HIGHEST, { temp_c: 37.9 }],
    ['dosimeter', { doseRateMsvDay: 'check', bfoDose30dMgyEq: 'emergency' }, LOWEST, { dose_rate_msv_day: 0.91, dose_30d_mgy_eq: 250.1 }],
    ['env-node', { cabinTempC: 'check', cabinHumidityPct: 'check' }, HIGHEST, { co2_mmhg_1h: 2.3, temp_c: 17.9, rh_pct: 24 }],
    // An indicator with no row at its level draws nominal.
    ['thermometer', { bodyTempC: 'emergency' }, LOWEST, { temp_c: 35.7 }],
  ] as const)('AC16: %s at %j with random %s → %j', (id, levels, random, values) => {
    expect(randomValues(device(id), levels as Partial<Record<Indicator, Status>>, RULES, random)).toEqual(values)
  })

  it.each([{}, { spo2Percent: 'emergency' }, { spo2Percent: 'check', heartRateBpm: 'check' }] as const)(
    'AC15 (#53): a range sets spo2_pct whatever its level (%j); pulse_bpm keeps its level',
    (levels) => {
      const ranges = { spo2Percent: { min: 91, max: 93 } }
      const low = randomValues(device('oximeter'), levels, RULES, LOWEST, ranges)
      const high = randomValues(device('oximeter'), levels, RULES, HIGHEST, ranges)
      expect(low.spo2_pct).toBe(91)
      expect(high.spo2_pct).toBe(93)
      expect(low.pulse_bpm).toBe(randomValues(device('oximeter'), levels, RULES, LOWEST).pulse_bpm)
      expect(high.pulse_bpm).toBe(randomValues(device('oximeter'), levels, RULES, HIGHEST).pulse_bpm)
    },
  )

  it('AC15 (#53): a range with decimals draws on the field grid', () => {
    const ranges = { cabinCo2MmHg: { min: 3.2, max: 3.8 } }
    expect(randomValues(device('env-node'), {}, RULES, LOWEST, ranges).co2_mmhg_1h).toBe(3.2)
    expect(randomValues(device('env-node'), {}, RULES, HIGHEST, ranges).co2_mmhg_1h).toBe(3.8)
  })

  it('AC15 (#53): without ranges the output is unchanged', () => {
    expect(randomValues(device('oximeter'), {}, RULES, LOWEST, undefined)).toEqual({ spo2_pct: 95, pulse_bpm: 62 })
  })
})

describe('randomValues against the rules engine', () => {
  const observation = (indicator: Indicator, value: number): Observation => ({
    resourceType: 'Observation',
    id: `x:${indicator}`,
    status: 'final',
    code: { text: indicator },
    valueQuantity: { value, unit: '' },
    effectiveDateTime: '2026-11-14T09:30:00Z',
    device: { display: 'oximeter · synthetic' },
  })
  const cases = DEVICES.flatMap((d) => levelsFor(d, RULES).map((level) => [d.id, level] as const))

  it.each(cases)('AC17: %s at %s: 500 draws each evaluate to their indicator level', (id, level) => {
    const spec = device(id)
    const levels = indicatorLevels({ [id]: level }, RULES)
    for (let i = 0; i < 500; i++) {
      const values = randomValues(spec, levels, RULES, Math.random)
      for (const field of spec.fields) {
        const rows = RULES.filter((r) => r.indicator === field.indicator && (r.below !== undefined || r.above !== undefined))
        const expected = rows.some((r) => r.status === level) ? level : 'nominal'
        const reading = latestReading([observation(field.indicator, values[field.key])], field.indicator, field.validMin, field.validMax, rows)
        expect([field.key, values[field.key], reading?.status]).toEqual([field.key, values[field.key], expected])
      }
    }
  })

  const range = (id: DeviceId, key: string, level: Status) => {
    const spec = device(id)
    const levels = indicatorLevels({ [id]: level }, RULES)
    return [randomValues(spec, levels, RULES, LOWEST)[key], randomValues(spec, levels, RULES, HIGHEST)[key]]
  }

  it.each([
    ['oximeter', 'spo2_pct', 'check', [90, 93]],
    ['oximeter', 'spo2_pct', 'emergency', [81, 89]],
    ['oximeter', 'pulse_bpm', 'check', [101, 110]],
    ['bracelet', 'hr_bpm', 'check', [101, 110]],
    ['bp-cuff', 'systolic_mmhg', 'watch', [120, 129]],
    ['bp-cuff', 'systolic_mmhg', 'check', [130, 139]],
    ['bp-cuff', 'systolic_mmhg', 'treat', [140, 179]],
    ['bp-cuff', 'systolic_mmhg', 'emergency', [180, 196]],
    ['bp-cuff', 'diastolic_mmhg', 'check', [80, 89]],
    ['bp-cuff', 'diastolic_mmhg', 'treat', [90, 119]],
    ['bp-cuff', 'diastolic_mmhg', 'emergency', [120, 130]],
    ['thermometer', 'temp_c', 'check', [38, 41.6]],
    ['env-node', 'co2_mmhg_1h', 'watch', [2.6, 3]],
    ['env-node', 'co2_mmhg_1h', 'check', [3.1, 3.3]],
    ['env-node', 'temp_c', 'check', [16.2, 17.9]],
    ['env-node', 'rh_pct', 'check', [23, 24]],
    ['dosimeter', 'dose_rate_msv_day', 'check', [0.91, 0.99]],
    ['dosimeter', 'dose_30d_mgy_eq', 'check', [125.1, 250]],
    ['dosimeter', 'dose_30d_mgy_eq', 'emergency', [250.1, 275]],
  ] as const)('AC17: %s %s at %s spans %j', (id, key, level, expected) => {
    expect(range(id, key, level)).toEqual(expected)
  })
})

describe('drift rows (#35)', () => {
  const withoutDrift = RULES.filter((r) => r.atLeast === undefined)

  it.each(['bracelet', 'oximeter'] as const)('AC16: %s levels ignore CV-03', (id) => {
    expect(levelsFor(device(id), RULES)).toEqual(levelsFor(device(id), withoutDrift))
    expect(levelsFor(device('bracelet'), RULES)).toEqual(['nominal', 'check'])
  })

  it.each([LOWEST, () => 0.5, HIGHEST])('AC16: the bp-cuff at watch keeps the pulse nominal (62–64 bpm)', (random) => {
    const values = randomValues(device('bp-cuff'), indicatorLevels({ 'bp-cuff': 'watch' }, RULES), RULES, random)
    expect(Number.isInteger(values.pulse_bpm)).toBe(true)
    expect(values.pulse_bpm).toBeGreaterThanOrEqual(62)
    expect(values.pulse_bpm).toBeLessThanOrEqual(64)
  })
})

describe('deviceMessage', () => {
  const NOW = new Date('2026-11-14T09:30:00.000Z')

  it('AC18: keeps the contract key order and leaves out missing fields', () => {
    expect(JSON.stringify(deviceMessage(device('oximeter'), { spo2_pct: 97, pulse_bpm: 63 }, NOW, () => 'id-1'))).toBe(
      '{"id":"id-1","t":"2026-11-14T09:30:00.000Z","spo2_pct":97,"pulse_bpm":63,"src":"synthetic"}',
    )
    expect(JSON.stringify(deviceMessage(device('env-node'), { co2_mmhg_1h: 3.4 }, NOW, () => 'id-2'))).toBe(
      '{"id":"id-2","t":"2026-11-14T09:30:00.000Z","co2_mmhg_1h":3.4,"src":"synthetic"}',
    )
  })
})
