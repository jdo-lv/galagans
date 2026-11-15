import { DEVICES, type DeviceField, type DeviceId, type DeviceSpec } from './devices'
import type { Indicator, Rule, Status } from './rules'

/** Health levels in order of severity (ideas/alert-levels.md). */
const LEVELS: Status[] = ['nominal', 'watch', 'check', 'treat', 'emergency']
const severity = (level: Status) => LEVELS.indexOf(level)

const rowsOf = (indicator: Indicator, rules: Rule[]) => rules.filter((r) => r.indicator === indicator)

/** Nominal plus each level that has a rule row for one of the device's fields; a level without a row is never invented. */
export function levelsFor(device: DeviceSpec, rules: Rule[]): Status[] {
  const indicators = new Set(device.fields.map((f) => f.indicator))
  return LEVELS.filter((level) => level === 'nominal' || rules.some((r) => r.status === level && indicators.has(r.indicator)))
}

/** Per indicator, the most severe device level that has a row for it, so devices sharing an indicator agree. */
export function indicatorLevels(levels: Partial<Record<DeviceId, Status>>, rules: Rule[]): Partial<Record<Indicator, Status>> {
  const result: Partial<Record<Indicator, Status>> = {}
  for (const device of DEVICES) {
    const level = levels[device.id]
    if (!level || level === 'nominal') continue
    for (const { indicator } of device.fields) {
      if (!rowsOf(indicator, rules).some((r) => r.status === level)) continue
      const current = result[indicator]
      if (!current || severity(level) > severity(current)) result[indicator] = level
    }
  }
  return result
}

interface Interval {
  lo: number
  hi: number
  loOpen: boolean
  hiOpen: boolean
}

/** Nominal: ±3 % around the field's nominal. Otherwise the band between the level's first row and the next more severe row. */
function interval(field: DeviceField, level: Status, rules: Rule[]): Interval {
  const rows = rowsOf(field.indicator, rules)
  const row = rows.find((r) => r.status === level)
  if (!row) return { lo: field.nominal * 0.97, hi: field.nominal * 1.03, loOpen: false, hiOpen: false }
  const higher = rows.filter((r) => severity(r.status) > severity(level))
  if (row.above !== undefined) {
    const limit = row.above
    const caps = higher.flatMap((r) => (r.above !== undefined && r.above > limit ? [r.above] : []))
    return { lo: limit, loOpen: true, hi: caps.length > 0 ? Math.min(...caps) : limit * 1.1, hiOpen: false }
  }
  const limit = row.below as number
  const floors = higher.flatMap((r) => (r.below !== undefined && r.below < limit ? [r.below] : []))
  return { lo: floors.length > 0 ? Math.max(...floors) : limit * 0.9, loOpen: false, hi: limit, hiOpen: true }
}

/** A value `k / 10^decimals` drawn uniformly inside the interval and the field's input limits. */
function draw(field: DeviceField, { lo, hi, loOpen, hiOpen }: Interval, random: () => number): number {
  const scale = 10 ** field.decimals
  const inside = (k: number) => {
    const v = k / scale
    return (loOpen ? v > lo : v >= lo) && (hiOpen ? v < hi : v <= hi) && v >= field.validMin && v <= field.validMax
  }
  let min = Math.floor(Math.max(lo, field.validMin) * scale) - 1
  let max = Math.ceil(Math.min(hi, field.validMax) * scale) + 1
  while (min <= max && !inside(min)) min++
  while (max >= min && !inside(max)) max--
  return (min + Math.floor(random() * (max - min + 1))) / scale
}

/** One synthetic value per field at its indicator's level (nominal when absent or without a row at that level). */
export function randomValues(
  device: DeviceSpec,
  levels: Partial<Record<Indicator, Status>>,
  rules: Rule[],
  random: () => number,
): Record<string, number> {
  return Object.fromEntries(device.fields.map((field) => [field.key, draw(field, interval(field, levels[field.indicator] ?? 'nominal', rules), random)]))
}

/** The device's JSON payload, keys in contract order: `{id, t, <fields>, src}`. */
export function deviceMessage(device: DeviceSpec, values: Record<string, number | undefined>, now: Date, newId: () => string): object {
  const message: Record<string, unknown> = { id: newId(), t: now.toISOString() }
  for (const field of device.fields) {
    const value = values[field.key]
    if (value !== undefined) message[field.key] = value
  }
  message.src = 'synthetic'
  return message
}
