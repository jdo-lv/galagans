import type { Indicator } from './rules'

/** The astronaut's pre-flight value for one indicator (F3). */
export interface BaselineEntry {
  value: number
  source: 'synthetic'
}

export type Baseline = Partial<Record<Indicator, BaselineEntry>>
