import { activeRanges, drivenIndicators, SCENARIOS, stepAt } from './scenarios'

const scenario = SCENARIOS[0]

describe('scenarios', () => {
  it('AC13: step 1 only before 20 s', () => {
    expect(activeRanges(scenario, 0)).toEqual({ cabinCo2MmHg: { min: 3.2, max: 3.8 } })
    expect(activeRanges(scenario, 19.9)).toEqual({ cabinCo2MmHg: { min: 3.2, max: 3.8 } })
  })

  it('AC13: steps accumulate from 20 s', () => {
    const step2 = {
      cabinCo2MmHg: { min: 3.2, max: 3.8 },
      spo2Percent: { min: 91, max: 93 },
      heartRateBpm: { min: 105, max: 115 },
    }
    expect(activeRanges(scenario, 20)).toEqual(step2)
    expect(activeRanges(scenario, 120)).toEqual(step2)
  })

  it('AC6: the step in force at a time, 1-based', () => {
    expect(stepAt(scenario, 0)).toBe(1)
    expect(stepAt(scenario, 19.9)).toBe(1)
    expect(stepAt(scenario, 20)).toBe(2)
  })

  it('AC7: the indicators any step drives', () => {
    expect([...drivenIndicators(scenario)].sort()).toEqual(['cabinCo2MmHg', 'heartRateBpm', 'spo2Percent'])
  })
})
