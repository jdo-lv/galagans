import { DEVICES, type DeviceField, type DeviceId, type DeviceSpec } from '../domain/devices'
import type { Status } from '../domain/rules'

export interface SimField {
  field: DeviceField
  /** Tile label, e.g. "SpO₂"; the unit follows it. */
  label: string
}

export interface SimDevice {
  device: DeviceSpec & { id: DeviceId }
  /** Section title, e.g. "Pulse oximeter". */
  name: string
  fields: SimField[]
}

const device = (id: DeviceId) => DEVICES.find((d) => d.id === id)!

function fields(id: DeviceId, labels: Record<string, string>): SimField[] {
  return device(id).fields.map((field) => ({ field, label: labels[field.key] }))
}

/** The six virtual devices of mockup 04, in its order. */
export const SIM_DEVICES: SimDevice[] = [
  { device: device('oximeter'), name: 'Pulse oximeter', fields: fields('oximeter', { spo2_pct: 'SpO₂', pulse_bpm: 'Pulse' }) },
  { device: device('bracelet'), name: 'Wrist bracelet', fields: fields('bracelet', { hr_bpm: 'Heart rate' }) },
  {
    device: device('bp-cuff'),
    name: 'BP cuff',
    fields: fields('bp-cuff', { systolic_mmhg: 'Systolic', diastolic_mmhg: 'Diastolic', pulse_bpm: 'Pulse' }),
  },
  { device: device('thermometer'), name: 'Thermometer', fields: fields('thermometer', { temp_c: 'Temperature' }) },
  {
    device: device('env-node'),
    name: 'Environment node',
    fields: fields('env-node', { co2_mmhg_1h: 'CO₂ (1-h avg)', temp_c: 'Cabin temp', rh_pct: 'Humidity' }),
  },
  {
    device: device('dosimeter'),
    name: 'Dosimeter',
    fields: fields('dosimeter', { dose_rate_msv_day: 'Dose rate', dose_30d_mgy_eq: '30-day BFO dose' }),
  },
]

/** Simulator defaults per device: seconds between messages and the starting level. The only place they are set. */
export const SIM_CONFIG: Record<DeviceId, { everyS: number; level: Status }> = {
  oximeter: { everyS: 1, level: 'nominal' },
  bracelet: { everyS: 1, level: 'nominal' },
  'bp-cuff': { everyS: 1, level: 'nominal' },
  thermometer: { everyS: 1, level: 'nominal' },
  'env-node': { everyS: 1, level: 'nominal' },
  dosimeter: { everyS: 1, level: 'nominal' },
}
