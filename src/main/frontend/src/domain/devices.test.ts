import { DEVICES, type DeviceId } from './devices'
import { READINGS, readingSpec } from './readings'

const fields = DEVICES.flatMap((device) => device.fields.map((field) => [`${device.id}.${field.key}`, field] as const))

describe('DEVICES', () => {
  it.each(fields.filter(([, field]) => field.indicator !== 'diastolicMmHg'))('%s has the unit and input limits of its READINGS tile', (_, field) => {
    const { unit, validMin, validMax } = readingSpec(field.indicator)
    expect(field).toMatchObject({ unit, validMin, validMax })
  })

  it('diastolic BP has no tile of its own: it is the Blood pressure tile pair', () => {
    expect(READINGS.find((r) => r.key === 'bloodPressure')).toMatchObject({ indicator: 'systolicMmHg', pairIndicator: 'diastolicMmHg' })
  })

  it('#43 AC13: every field has its nominal value and decimals', () => {
    expect(DEVICES.flatMap((d) => d.fields.map((f) => [`${d.id}.${f.key}`, f.nominal, f.decimals]))).toEqual([
      ['oximeter.spo2_pct', 97, 0],
      ['oximeter.pulse_bpm', 63, 0],
      ['bracelet.hr_bpm', 63, 0],
      ['bp-cuff.systolic_mmhg', 108, 0],
      ['bp-cuff.diastolic_mmhg', 70, 0],
      ['bp-cuff.pulse_bpm', 63, 0],
      ['thermometer.temp_c', 36.8, 1],
      ['env-node.co2_mmhg_1h', 2.3, 1],
      ['env-node.temp_c', 22, 1],
      ['env-node.rh_pct', 45, 0],
      ['dosimeter.dose_rate_msv_day', 0.5, 2],
      ['dosimeter.dose_30d_mgy_eq', 95, 1],
    ])
  })

  it('#43 AC13: DeviceId is the union of the device ids', () => {
    const ids: DeviceId[] = ['oximeter', 'bracelet', 'bp-cuff', 'thermometer', 'env-node', 'dosimeter']
    // @ts-expect-error not a device id
    const unknown: DeviceId = 'glucometer'

    expect(DEVICES.map((d) => d.id)).toEqual(ids)
    expect(unknown).toBe('glucometer')
  })

  it('every topic is unique', () => {
    expect(new Set(DEVICES.map((d) => d.topic)).size).toBe(DEVICES.length)
  })
})
