import type { Observation, ObservationSource } from '../domain/observation'
import { readingSpec } from '../domain/readings'
import type { ChartPoint, Indicator, Rule, Status, SystemStatus } from '../domain/rules'

const SEVERITY: Record<Status, number> = { nominal: 0, watch: 2, check: 3, treat: 4, emergency: 5 }

export interface IndicatorReading {
  id: string
  recordedAt: string
  time: number
  value: number
  source: ObservationSource
  status: Status
  rule?: Rule
}

const matches = (rule: Rule, value: number) =>
  rule.below !== undefined ? value < rule.below : rule.above !== undefined && value > rule.above

/** Most severe matching row; equal severity keeps table order. */
function classify(rows: Rule[], value: number): { status: Status; rule?: Rule } {
  let match: Rule | undefined
  for (const rule of rows) {
    if (matches(rule, value) && (!match || SEVERITY[rule.status] > SEVERITY[match.status])) match = rule
  }
  return match ? { status: match.status, rule: match } : { status: 'nominal' }
}

/** Newest first; equal timestamps → more severe, then lower id. */
function compare(a: IndicatorReading, b: IndicatorReading): number {
  return b.time - a.time || SEVERITY[b.status] - SEVERITY[a.status] || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
}

/** Finite values of `indicator` within [validMin, validMax], classified against `rows`. */
function validReadings(
  observations: Observation[],
  indicator: Indicator,
  validMin: number,
  validMax: number,
  rows: Rule[],
): IndicatorReading[] {
  const readings: IndicatorReading[] = []
  for (const observation of observations) {
    if (observation.code.text !== indicator) continue
    const { value } = observation.valueQuantity
    if (!Number.isFinite(value) || value < validMin || value > validMax) continue
    readings.push({
      id: observation.id,
      recordedAt: observation.effectiveDateTime,
      time: Date.parse(observation.effectiveDateTime),
      value,
      source: observation.device.display,
      ...classify(rows, value),
    })
  }
  return readings
}

/** Newest finite value of `indicator` within [validMin, validMax], classified against `rows`. */
export function latestReading(
  observations: Observation[],
  indicator: Indicator,
  validMin: number,
  validMax: number,
  rows: Rule[],
): IndicatorReading | undefined {
  return validReadings(observations, indicator, validMin, validMax, rows).sort(compare)[0]
}

/** Valid readings in [now − windowMs, now], oldest first; the newest is 'stale' when the system status is. */
export function chartPoints(rows: Rule[], observations: Observation[], now: Date, stale: boolean, windowMs: number): ChartPoint[] {
  const from = now.getTime() - windowMs
  const { indicator, validMin, validMax } = rows[0]
  const readings = validReadings(observations, indicator, validMin, validMax, rows)
    .filter((r) => r.time >= from && r.time <= now.getTime())
    .sort((a, b) => compare(b, a))
  return readings.map((r, i) => {
    const point = { recordedAt: r.recordedAt, value: r.value, source: r.source }
    if (stale && i === readings.length - 1) return { ...point, status: 'stale' }
    return r.rule ? { ...point, status: r.status, rule: r.rule } : { ...point, status: r.status }
  })
}

/** Data age comes from the indicator's reading spec, so a PVT ages in 4 days and an SpO₂ in 24 h; the source label is the shown Observation's. */
function evaluateIndicator(system: string, rows: Rule[], observations: Observation[], now: Date): SystemStatus {
  const { indicator, validMin, validMax, label, unit } = rows[0]
  const latest = latestReading(observations, indicator, validMin, validMax, rows)
  if (!latest) return { system, state: 'no-data' }

  const shown = { system, label, unit, value: latest.value, recordedAt: latest.recordedAt, source: latest.source }
  if (now.getTime() - latest.time > readingSpec(indicator).staleAfterMs) return { ...shown, state: 'stale' }
  return latest.rule ? { ...shown, state: latest.status, rule: latest.rule } : { ...shown, state: latest.status }
}

const RANK: Record<SystemStatus['state'], number> = { 'no-data': 0, stale: 1, nominal: 2, watch: 3, check: 4, treat: 5, emergency: 6 }

/** A system's rows grouped by indicator, in table order. */
export function byIndicator(rows: Rule[]): Rule[][] {
  const groups = new Map<string, Rule[]>()
  for (const rule of rows) groups.set(rule.indicator, [...(groups.get(rule.indicator) ?? []), rule])
  return [...groups.values()]
}

/** The worst indicator of the system (Cabin air: CO₂, temperature, humidity); equal states keep table order. */
function evaluateSystem(system: string, rows: Rule[], observations: Observation[], now: Date): SystemStatus {
  const statuses = byIndicator(rows).map((group) => evaluateIndicator(system, group, observations, now))
  return statuses.reduce((worst, status) => (RANK[status.state] > RANK[worst.state] ? status : worst))
}

/** One status per distinct `system`, in table order. */
export function evaluate(rules: Rule[], observations: Observation[], now: Date): SystemStatus[] {
  const bySystem = new Map<string, Rule[]>()
  for (const rule of rules) bySystem.set(rule.system, [...(bySystem.get(rule.system) ?? []), rule])
  return [...bySystem].map(([system, rows]) => evaluateSystem(system, rows, observations, now))
}
