import { DEVICES } from '../domain/devices'
import { deviceMessage, isValidInput, SIM_DEVICES } from './simDevices'

const NOW = new Date('2026-11-14T09:30:00.000Z')
const sim = (name: string) => SIM_DEVICES.find((s) => s.name === name)!
const field = (name: string, key: string) => sim(name).fields.find((f) => f.field.key === key)!

describe('SIM_DEVICES', () => {
  it('covers every gateway device, in mockup 04 order', () => {
    expect(SIM_DEVICES.map((s) => s.name)).toEqual(['Pulse oximeter', 'Wrist bracelet', 'BP cuff', 'Thermometer', 'Environment node', 'Dosimeter'])
    expect(SIM_DEVICES.map((s) => s.device.id).sort()).toEqual(DEVICES.map((d) => d.id).sort())
  })

  it.each(SIM_DEVICES.map((s) => [s.name, s] as const))('%s: starting values are valid inputs', (_, s) => {
    for (const f of s.fields) expect(isValidInput(String(f.nominal), f)).toBe(true)
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
