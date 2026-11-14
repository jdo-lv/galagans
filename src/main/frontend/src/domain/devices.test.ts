import { DEVICES } from './devices'
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

  it('every topic is unique', () => {
    expect(new Set(DEVICES.map((d) => d.topic)).size).toBe(DEVICES.length)
  })
})
