import type { IndicatorRange } from '../domain/levelValues'
import type { Indicator } from '../domain/rules'

type Ranges = Partial<Record<Indicator, IndicatorRange>>

export interface ScenarioStep {
  label: string
  ranges: Ranges
}

export interface Scenario {
  id: string
  name: string
  caption: string
  /** Default seconds from one step to the next; the operator can change it before checking. */
  delayS: number
  steps: ScenarioStep[]
}

/** The only place scenarios are defined. Ranges: research/health-indicators.md §22 (CO₂ over CAB-01), §4 (SpO₂ between SPO-01 and SPO-02), §1 (HR over CV-01); the timeline is a team heuristic. */
export const SCENARIOS: Scenario[] = [
  {
    id: 'cabin-atmosphere-fault',
    name: 'Cabin atmosphere fault',
    caption: 'CO₂ rises, then SpO₂ drops and heart rate rises · synthetic demo timeline, not a physiological model',
    delayS: 10,
    steps: [
      { label: 'CO₂ rising', ranges: { cabinCo2MmHg: { min: 3.2, max: 3.8 } } },
      { label: 'SpO₂ and heart rate', ranges: { spo2Percent: { min: 91, max: 93 }, heartRateBpm: { min: 105, max: 115 } } },
    ],
  },
]

/** Step i starts i × delayS seconds after the check. */
const reached = (scenario: Scenario, elapsedS: number, delayS: number) => scenario.steps.filter((_, i) => i * delayS <= elapsedS)

/** Every reached step's ranges merged; a later step overrides an indicator. */
export function activeRanges(scenario: Scenario, elapsedS: number, delayS: number): Ranges {
  return Object.assign({}, ...reached(scenario, elapsedS, delayS).map((step) => step.ranges)) as Ranges
}

/** 1-based number of the step in force. */
export const stepAt = (scenario: Scenario, elapsedS: number, delayS: number) => reached(scenario, elapsedS, delayS).length

export const drivenIndicators = (scenario: Scenario) =>
  new Set(scenario.steps.flatMap((step) => Object.keys(step.ranges) as Indicator[]))
