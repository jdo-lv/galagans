import { describe, expect, it } from 'vitest'
import { mockReadings } from './mockReadings'
import { mockStatuses } from './mockStatuses'

const text = (key: string) => mockReadings.find((r) => r.key === key)?.text
const detail = (system: string) => mockStatuses.find((s) => s.system === system)?.detail

describe('mockReadings', () => {
  it('AC28: the synthetic tiles show the same values as the #4 placeholder rows', () => {
    expect(detail('Cardiovascular')).toContain(`BP ${text('bloodPressure')}`)
    expect(detail('Cabin air')).toContain(`CO₂ ${text('cabinCo2')} mmHg`)
  })
})
