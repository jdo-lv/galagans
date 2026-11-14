import { oximeterMessage } from './oximeterMessage'

const NOW = new Date('2026-11-14T09:30:00.000Z')

describe('oximeterMessage', () => {
  it('keeps the contract key order', () => {
    expect(JSON.stringify(oximeterMessage({ spo2: 97, pulse: 63 }, NOW, () => 'id-1'))).toBe(
      '{"id":"id-1","t":"2026-11-14T09:30:00.000Z","spo2_pct":97,"pulse_bpm":63,"src":"synthetic"}',
    )
  })

  it('leaves out pulse_bpm when there is no pulse', () => {
    expect(JSON.stringify(oximeterMessage({ spo2: 91 }, NOW, () => 'id-1'))).toBe(
      '{"id":"id-1","t":"2026-11-14T09:30:00.000Z","spo2_pct":91,"src":"synthetic"}',
    )
  })
})
