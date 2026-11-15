import type { IndicatorRange } from '../domain/levelValues'
import type { Indicator } from '../domain/rules'

type Ranges = Partial<Record<Indicator, IndicatorRange>>

export interface ScenarioStep {
  /** Seconds after the scenario is checked. */
  afterS: number
  label: string
  ranges: Ranges
}

export interface Scenario {
  id: string
  name: string
  caption: string
  steps: ScenarioStep[]
}

/** The only place scenarios are defined. Ranges: research/health-indicators.md §22 (CO₂ over CAB-01), §4 (SpO₂ between SPO-01 and SPO-02), §1 (HR over CV-01); the timeline is a team heuristic. */
export const SCENARIOS: Scenario[] = [
  {
    id: 'cabin-atmosphere-fault',
    name: 'Cabin atmosphere fault',
    caption: 'CO₂ rises, then after 20 s SpO₂ drops and heart rate rises · synthetic demo timeline, not a physiological model',
    steps: [
      { afterS: 0, label: 'CO₂ rising', ranges: { cabinCo2MmHg: { min: 3.2, max: 3.8 } } },
      { afterS: 20, label: 'SpO₂ and heart rate', ranges: { spo2Percent: { min: 91, max: 93 }, heartRateBpm: { min: 105, max: 115 } } },
    ],
  },
]

const reached = (scenario: Scenario, elapsedS: number) => scenario.steps.filter((step) => step.afterS <= elapsedS)

/** Every reached step's ranges merged; a later step overrides an indicator. */
export function activeRanges(scenario: Scenario, elapsedS: number): Ranges {
  return Object.assign({}, ...reached(scenario, elapsedS).map((step) => step.ranges)) as Ranges
}

/** 1-based number of the step in force. */
export const stepAt = (scenario: Scenario, elapsedS: number) => reached(scenario, elapsedS).length

export const drivenIndicators = (scenario: Scenario) =>
  new Set(scenario.steps.flatMap((step) => Object.keys(step.ranges) as Indicator[]))
