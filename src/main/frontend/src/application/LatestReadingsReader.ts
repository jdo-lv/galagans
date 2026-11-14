import type { CheckIn } from '../domain/checkIn'
import type { CheckInHistory, RuleSource } from '../domain/ports'
import { READINGS, type LatestReading, type ReadingPlaceholder, type ReadingSpec } from '../domain/readings'
import type { Rule } from '../domain/rules'
import { latestReading } from './evaluate'

type IndicatorSpec = Extract<ReadingSpec, { indicator: string }>

function fromCheckIns(spec: IndicatorSpec, rules: Rule[], checkIns: CheckIn[], now: Date): LatestReading {
  const rows = rules.filter((rule) => rule.indicator === spec.indicator)
  const rating = rows.length === 0 ? { unrated: true as const } : {}
  const latest = latestReading(checkIns, spec.indicator, spec.validMin, spec.validMax, rows)
  if (!latest) return { spec, state: 'no-data', ...rating }

  const shown = { spec, value: latest.value, recordedAt: latest.recordedAt, source: spec.source ?? 'manual', ...rating }
  // A rule only judges fresh data, as in the body-systems list.
  if (now.getTime() - latest.time > spec.staleAfterMs) return { ...shown, state: 'stale' }
  return latest.rule ? { ...shown, state: latest.status, rule: latest.rule } : { ...shown, state: latest.status }
}

export class LatestReadingsReader {
  constructor(
    private readonly rules: RuleSource,
    private readonly history: CheckInHistory,
    /** Public so the UI prints ages against the same clock the rules used. */
    readonly now: () => Date = () => new Date(),
    /** Fill the rows with no input in the app; a row without one has no data. */
    private readonly placeholders: ReadingPlaceholder[] = [],
  ) {}

  async read(): Promise<LatestReading[]> {
    const [rules, checkIns] = await Promise.all([this.rules.load(), this.history.list()])
    const now = this.now()
    return READINGS.map((spec) => (spec.indicator === null ? this.fromPlaceholder(spec) : fromCheckIns(spec, rules, checkIns, now)))
  }

  private fromPlaceholder(spec: ReadingSpec): LatestReading {
    const placeholder = this.placeholders.find((p) => p.key === spec.key)
    return placeholder ? { spec, state: 'synthetic', text: placeholder.text, source: placeholder.source } : { spec, state: 'no-data' }
  }
}
