import { activeRanges, drivenIndicators, SCENARIOS, stepAt } from './scenarios'

const scenario = SCENARIOS[0]

describe('scenarios', () => {
  it('the step delay defaults to 10 s', () => {
    expect(scenario.delayS).toBe(10)
  })

  it('AC13: step 1 only before the delay', () => {
    expect(activeRanges(scenario, 0, 20)).toEqual({ cabinCo2MmHg: { min: 3.2, max: 3.8 } })
    expect(activeRanges(scenario, 19.9, 20)).toEqual({ cabinCo2MmHg: { min: 3.2, max: 3.8 } })
  })

  it('AC13: steps accumulate from the delay', () => {
    const step2 = {
      cabinCo2MmHg: { min: 3.2, max: 3.8 },
      spo2Percent: { min: 91, max: 93 },
      heartRateBpm: { min: 105, max: 115 },
    }
    expect(activeRanges(scenario, 20, 20)).toEqual(step2)
    expect(activeRanges(scenario, 120, 20)).toEqual(step2)
    expect(activeRanges(scenario, 5, 5)).toEqual(step2)
  })

  it('AC6: the step in force at a time, 1-based', () => {
    expect(stepAt(scenario, 0, 20)).toBe(1)
    expect(stepAt(scenario, 19.9, 20)).toBe(1)
    expect(stepAt(scenario, 20, 20)).toBe(2)
    expect(stepAt(scenario, 9.9, 10)).toBe(1)
    expect(stepAt(scenario, 10, 10)).toBe(2)
  })

  it('AC7: the indicators any step drives', () => {
    expect([...drivenIndicators(scenario)].sort()).toEqual(['cabinCo2MmHg', 'heartRateBpm', 'spo2Percent'])
  })
})
