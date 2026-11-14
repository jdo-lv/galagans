import type { Observation } from '../domain/observation'
import type { ObservationHistory, RuleSource } from '../domain/ports'
import { READINGS, type LatestReading, type ReadingSpec } from '../domain/readings'
import type { Rule } from '../domain/rules'
import { latestReading } from './evaluate'

/** "108/70" when the same measurement stored the pair indicator (ids `<message>:<indicator>`). */
function pairText(spec: ReadingSpec, id: string, value: number, observations: Observation[]): string | undefined {
  if (!spec.pairIndicator) return undefined
  const pairId = `${id.slice(0, id.lastIndexOf(':'))}:${spec.pairIndicator}`
  const pair = observations.find((o) => o.id === pairId)
  return pair && `${value}/${pair.valueQuantity.value}`
}

function fromObservations(spec: ReadingSpec, rules: Rule[], observations: Observation[], now: Date): LatestReading {
  const rows = rules.filter((rule) => rule.indicator === spec.indicator)
  const rating = rows.length === 0 ? { unrated: true as const } : {}
  const latest = latestReading(observations, spec.indicator, spec.validMin, spec.validMax, rows)
  if (!latest) return { spec, state: 'no-data', ...rating }

  const text = pairText(spec, latest.id, latest.value, observations)
  const shown = { spec, value: latest.value, ...(text && { text }), recordedAt: latest.recordedAt, source: latest.source, ...rating }
  // A rule only judges fresh data, as in the body-systems list.
  if (now.getTime() - latest.time > spec.staleAfterMs) return { ...shown, state: 'stale' }
  return latest.rule ? { ...shown, state: latest.status, rule: latest.rule } : { ...shown, state: latest.status }
}

export class LatestReadingsReader {
  constructor(
    private readonly rules: RuleSource,
    private readonly history: ObservationHistory,
    /** Public so the UI prints ages against the same clock the rules used. */
    readonly now: () => Date = () => new Date(),
  ) {}

  async read(): Promise<LatestReading[]> {
    const [rules, observations] = await Promise.all([this.rules.load(), this.history.list()])
    const now = this.now()
    return READINGS.map((spec) => fromObservations(spec, rules, observations, now))
  }
}
