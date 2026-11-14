import type { CheckIn } from '../domain/checkIn'
import { STALE_AFTER_MS, type Rule, type Status, type SystemStatus } from '../domain/rules'

const SEVERITY: Record<Status, number> = { nominal: 0, caution: 1, warning: 2 }

interface Reading {
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
function compare(a: Reading, b: Reading): number {
  return b.time - a.time || SEVERITY[b.status] - SEVERITY[a.status] || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
}

function evaluateSystem(system: string, rows: Rule[], checkIns: CheckIn[], now: Date): SystemStatus {
  const { indicator, validMin, validMax, label, unit } = rows[0]
  const readings: Reading[] = []
  for (const checkIn of checkIns) {
    const value = checkIn[indicator]
    if (typeof value !== 'number' || !Number.isFinite(value) || value < validMin || value > validMax) continue
    readings.push({ id: checkIn.id, recordedAt: checkIn.recordedAt, time: Date.parse(checkIn.recordedAt), value, ...classify(rows, value) })
  }
  const latest = readings.sort(compare)[0]
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
