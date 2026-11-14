import { DEVICES } from '../domain/devices'
import { deviceMessage, isValidInput, nominalValues, SIM_DEVICES } from './simDevices'

const NOW = new Date('2026-11-14T09:30:00.000Z')
const sim = (name: string) => SIM_DEVICES.find((s) => s.name === name)!
const field = (name: string, key: string) => sim(name).fields.find((f) => f.field.key === key)!

describe('SIM_DEVICES', () => {
  it('covers every gateway device, in mockup 04 order', () => {
    expect(SIM_DEVICES.map((s) => s.name)).toEqual(['Pulse oximeter', 'Wrist bracelet', 'BP cuff', 'Thermometer', 'Environment node', 'Dosimeter'])
    expect(SIM_DEVICES.map((s) => s.device.id).sort()).toEqual(DEVICES.map((d) => d.id).sort())
  })

  it.each(SIM_DEVICES.map((s) => [s.name, s] as const))('%s: nominal values are valid inputs and the slider stays in limits', (_, s) => {
    for (const f of s.fields) expect(isValidInput(f.nominal.toFixed(f.decimals), f)).toBe(true)
    const slider = s.fields.find((f) => f.field.key === s.override.key)!.field
    expect([s.override.min >= slider.validMin, s.override.max <= slider.validMax]).toEqual([true, true])
  })

  it('formats each card value', () => {
    expect(SIM_DEVICES.map((s) => s.format(nominalValues(s)))).toEqual([
      '97 % · 63 bpm',
      '63 bpm',
      '108/70 mmHg · 63 bpm',
      '36.8 °C',
      '2.3 mmHg · 22.0 °C · 45 % RH',
      '0.50 mSv/day',
    ])
  })
})

describe('deviceMessage', () => {
  it('keeps the contract key order and leaves out missing fields', () => {
    expect(JSON.stringify(deviceMessage(sim('Pulse oximeter'), { spo2_pct: 97, pulse_bpm: 63 }, NOW, () => 'id-1'))).toBe(
      '{"id":"id-1","t":"2026-11-14T09:30:00.000Z","spo2_pct":97,"pulse_bpm":63,"src":"synthetic"}',
    )
    expect(JSON.stringify(deviceMessage(sim('Environment node'), { co2_mmhg_1h: 3.4 }, NOW, () => 'id-2'))).toBe(
      '{"id":"id-2","t":"2026-11-14T09:30:00.000Z","co2_mmhg_1h":3.4,"src":"synthetic"}',
    )
  })
})

describe('isValidInput', () => {
  it.each([
    ['Pulse oximeter', 'spo2_pct', '91', true],
    ['Pulse oximeter', 'spo2_pct', '91.0', false],
    ['Pulse oximeter', 'spo2_pct', ' 91', false],
    ['Pulse oximeter', 'spo2_pct', '49', false],
    ['Thermometer', 'temp_c', '36.8', true],
    ['Thermometer', 'temp_c', '36.85', false],
    ['Thermometer', 'temp_c', '44', false],
    ['Dosimeter', 'dose_rate_msv_day', '0.75', true],
    ['Environment node', 'rh_pct', '101', false],
  ])('%s %s %j → %s', (name, key, value, valid) => {
    expect(isValidInput(value, field(name, key))).toBe(valid)
  })
})
