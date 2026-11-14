import { DEVICES, type DeviceField, type DeviceSpec } from '../domain/devices'

export interface SimField {
  field: DeviceField
  /** Input label, e.g. "SpO₂"; the unit follows it. */
  label: string
  /** Starting value; research/health-indicators.md where noted, else a team choice. */
  nominal: number
  decimals: number
}

export interface SimDevice {
  device: DeviceSpec
  /** Section title, e.g. "Pulse oximeter". */
  name: string
  fields: SimField[]
}

const device = (id: string) => DEVICES.find((d) => d.id === id)!

function fields(id: string, rows: Record<string, Omit<SimField, 'field'>>): SimField[] {
  return device(id).fields.map((field) => ({ field, ...rows[field.key] }))
}

/** The six virtual devices of mockup 04, in its order. */
export const SIM_DEVICES: SimDevice[] = [
  {
    device: device('oximeter'),
    name: 'Pulse oximeter',
    // SpO₂ 97 % inside Earth normal 95–100 % (health-indicators §4); pulse 63 bpm in-flight 24-h HR [S26].
    fields: fields('oximeter', {
      spo2_pct: { label: 'SpO₂', nominal: 97, decimals: 0 },
      pulse_bpm: { label: 'Pulse', nominal: 63, decimals: 0 },
    }),
  },
  {
    device: device('bracelet'),
    name: 'Wrist bracelet',
    // In-flight 24-h HR 63→64 bpm [S26].
    fields: fields('bracelet', { hr_bpm: { label: 'Heart rate', nominal: 63, decimals: 0 } }),
  },
  {
    device: device('bp-cuff'),
    name: 'BP cuff',
    // 108/70 mmHg: the #4 placeholder value (team choice); pulse as the bracelet.
    fields: fields('bp-cuff', {
      systolic_mmhg: { label: 'Systolic', nominal: 108, decimals: 0 },
      diastolic_mmhg: { label: 'Diastolic', nominal: 70, decimals: 0 },
      pulse_bpm: { label: 'Pulse', nominal: 63, decimals: 0 },
    }),
  },
  {
    device: device('thermometer'),
    name: 'Thermometer',
    // 36.8 °C inside Earth normal oral 36.1–37.2 °C (health-indicators §6).
    fields: fields('thermometer', { temp_c: { label: 'Temperature', nominal: 36.8, decimals: 1 } }),
  },
  {
    device: device('env-node'),
    name: 'Environment node',
    // CO₂ 2.3 mmHg: the #4 placeholder, under the 3 mmHg limit; 22 °C and 45 % RH inside 18–27 °C and 25–75 % RH (health-indicators §22).
    fields: fields('env-node', {
      co2_mmhg_1h: { label: 'CO₂ (1-h avg)', nominal: 2.3, decimals: 1 },
      temp_c: { label: 'Cabin temp', nominal: 22, decimals: 1 },
      rh_pct: { label: 'Humidity', nominal: 45, decimals: 0 },
    }),
  },
  {
    device: device('dosimeter'),
    name: 'Dosimeter',
    // 0.5 mSv/day: surface-mission environment (health-indicators §19 [S7]); 95 mGy-Eq is 38 % of the 250 mGy-Eq 30-day limit, the #4 placeholder share.
    fields: fields('dosimeter', {
      dose_rate_msv_day: { label: 'Dose rate', nominal: 0.5, decimals: 2 },
      dose_30d_mgy_eq: { label: '30-day BFO dose', nominal: 95, decimals: 1 },
    }),
  },
]

export const nominalValues = (sim: SimDevice): Record<string, number> =>
  Object.fromEntries(sim.fields.map(({ field, nominal }) => [field.key, nominal]))

/** A whole or decimal number (up to the field's decimals) within the device's input limits. */
export function isValidInput(value: string, { field, decimals }: SimField): boolean {
  const pattern = decimals === 0 ? /^\d+$/ : new RegExp(`^\\d+(\\.\\d{1,${decimals}})?$`)
  if (!pattern.test(value)) return false
  const number = Number(value)
  return number >= field.validMin && number <= field.validMax
}

/** The device's JSON payload, keys in contract order: `{id, t, <fields>, src}`. */
export function deviceMessage(sim: SimDevice, values: Record<string, number | undefined>, now: Date, newId: () => string): object {
  const message: Record<string, unknown> = { id: newId(), t: now.toISOString() }
  for (const { field } of sim.fields) {
    const value = values[field.key]
    if (value !== undefined) message[field.key] = value
  }
  message.src = 'synthetic'
  return message
}
