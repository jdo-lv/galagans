import type { CheckIn } from '../domain/checkIn'
import { CHART_WINDOW_MS, STALE_AFTER_MS, type ChartPoint, type Indicator, type Rule, type Status, type SystemStatus } from '../domain/rules'

const SEVERITY: Record<Status, number> = { nominal: 0, caution: 1, warning: 2 }

export interface IndicatorReading {
  id: string
  recordedAt: string
  time: number
  value: number
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
  checkIns: CheckIn[],
  indicator: Indicator,
  validMin: number,
  validMax: number,
  rows: Rule[],
): IndicatorReading[] {
  const readings: IndicatorReading[] = []
  for (const checkIn of checkIns) {
    const value = checkIn[indicator]
    if (typeof value !== 'number' || !Number.isFinite(value) || value < validMin || value > validMax) continue
    readings.push({ id: checkIn.id, recordedAt: checkIn.recordedAt, time: Date.parse(checkIn.recordedAt), value, ...classify(rows, value) })
  }
  return readings
}

/** Newest finite value of `indicator` within [validMin, validMax], classified against `rows`. */
export function latestReading(
  checkIns: CheckIn[],
  indicator: Indicator,
  validMin: number,
  validMax: number,
  rows: Rule[],
): IndicatorReading | undefined {
  return validReadings(checkIns, indicator, validMin, validMax, rows).sort(compare)[0]
}

/** Valid readings of the last 7 days, oldest first; the newest is 'stale' when the system status is. */
export function chartPoints(rows: Rule[], checkIns: CheckIn[], now: Date, stale: boolean): ChartPoint[] {
  const from = now.getTime() - CHART_WINDOW_MS
  const { indicator, validMin, validMax } = rows[0]
  const readings = validReadings(checkIns, indicator, validMin, validMax, rows)
    .filter((r) => r.time >= from && r.time <= now.getTime())
    .sort((a, b) => compare(b, a))
  return readings.map((r, i) => ({
    recordedAt: r.recordedAt,
    value: r.value,
    status: stale && i === readings.length - 1 ? 'stale' : r.status,
  }))
}

function evaluateSystem(system: string, rows: Rule[], checkIns: CheckIn[], now: Date): SystemStatus {
  const { indicator, validMin, validMax, label, unit } = rows[0]
  const latest = latestReading(checkIns, indicator, validMin, validMax, rows)
  if (!latest) return { system, state: 'no-data', source: 'manual' }

  const shown = { system, label, unit, value: latest.value, recordedAt: latest.recordedAt, source: 'manual' as const }
  if (now.getTime() - latest.time > STALE_AFTER_MS) return { ...shown, state: 'stale' }
  return latest.rule ? { ...shown, state: latest.status, rule: latest.rule } : { ...shown, state: latest.status }
}

/** One status per distinct `system`, in table order. All rows of a system share its first row's indicator. */
export function evaluate(rules: Rule[], checkIns: CheckIn[], now: Date): SystemStatus[] {
  const bySystem = new Map<string, Rule[]>()
  for (const rule of rules) bySystem.set(rule.system, [...(bySystem.get(rule.system) ?? []), rule])
  return [...bySystem].map(([system, rows]) => evaluateSystem(system, rows, checkIns, now))
}
