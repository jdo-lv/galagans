import type { Baseline } from '../domain/baseline'
import type { RuleSource } from '../domain/ports'
import type { Indicator, Rule } from '../domain/rules'
import baselineJson from './baseline.json'
import ruleRows from './rules.json'

const STRING_FIELDS = ['id', 'system', 'indicator', 'label', 'unit', 'tier', 'what', 'why', 'howDecided', 'next', 'source']
const NUMBER_FIELDS = ['validMin', 'validMax']
const INDICATORS: Indicator[] = [
  'heartRateBpm',
  'spo2Percent',
  'sleepHours',
  'mood',
  'pvtMedianMs',
  'systolicMmHg',
  'diastolicMmHg',
  'bodyTempC',
  'cabinCo2MmHg',
  'cabinTempC',
  'cabinHumidityPct',
  'doseRateMsvDay',
  'bfoDose30dMgyEq',
]
const LEVELS: Rule['status'][] = ['watch', 'check', 'treat', 'emergency']
const THRESHOLDS = ['below', 'above', 'aboveBaselinePercent', 'riseAboveBaseline'] as const
const TEXT_FIELDS = ['what', 'howDecided', 'next'] as const
const PLACEHOLDER = /\{(baseline|limit|percent|rise|days)\}/g

/** Keeps only well-formed entries, so a broken one reads as missing. */
function validBaseline(profile: unknown): Baseline {
  const baseline: Baseline = {}
  if (typeof profile !== 'object' || profile === null) return baseline
  for (const indicator of INDICATORS) {
    if (!Object.hasOwn(profile, indicator)) continue
    const entry = (profile as Record<string, unknown>)[indicator]
    if (typeof entry !== 'object' || entry === null) continue
    const { value, source } = entry as Record<string, unknown>
    if (typeof value === 'number' && Number.isFinite(value) && source === 'synthetic') baseline[indicator] = { value, source }
  }
  return baseline
}

function validate(row: unknown, index: number, baseline: Baseline): Rule {
  const fail = (reason: string): never => {
    throw new Error(`Rule row ${index}: ${reason}`)
  }
  if (typeof row !== 'object' || row === null) return fail('not an object')
  const r = row as Record<string, unknown>
  for (const key of STRING_FIELDS) if (typeof r[key] !== 'string') fail(`${key} must be a string`)
  for (const key of NUMBER_FIELDS) if (typeof r[key] !== 'number') fail(`${key} must be a number`)
  if (!LEVELS.includes(r.status as Rule['status'])) fail('status must be watch, check, treat or emergency')
  if (!INDICATORS.includes(r.indicator as Indicator)) fail(`unknown indicator ${String(r.indicator)}`)
  if (Object.hasOwn(r, 'atLeast')) fail('atLeast is computed, not a row field')
  const thresholds = THRESHOLDS.filter((key) => Object.hasOwn(r, key))
  if (thresholds.length !== 1) fail('needs exactly one of below, above, aboveBaselinePercent or riseAboveBaseline')
  const [threshold] = thresholds
  if (threshold !== 'riseAboveBaseline' && Object.hasOwn(r, 'days')) fail('days needs riseAboveBaseline')
  const uses = (...names: string[]) => TEXT_FIELDS.some((key) => names.some((name) => (r[key] as string).includes(`{${name}}`)))
  const relative = threshold === 'aboveBaselinePercent' || threshold === 'riseAboveBaseline'
  if (!relative && uses('baseline', 'limit')) fail('{baseline} and {limit} need aboveBaselinePercent or riseAboveBaseline')
  if (threshold !== 'aboveBaselinePercent' && uses('percent')) fail('{percent} needs aboveBaselinePercent')
  if (threshold !== 'riseAboveBaseline' && uses('rise', 'days')) fail('{rise} and {days} need riseAboveBaseline')
  if (!relative) {
    if (typeof r[threshold] !== 'number') fail(`${threshold} must be a number`)
    return r as unknown as Rule
  }

  const amount = r[threshold]
  if (typeof amount !== 'number' || !(amount > 0)) return fail(`${threshold} must be a positive number`)
  const { days } = r
  if (threshold === 'riseAboveBaseline' && !(Number.isInteger(days) && (days as number) >= 2)) fail('days must be an integer of 2 or more')
  const indicator = r.indicator as Indicator
  const entry = baseline[indicator] ?? fail(`no baseline for ${indicator}`)
  const limit = threshold === 'aboveBaselinePercent' ? entry.value * (1 + amount / 100) : entry.value + amount
  const values: Record<string, unknown> = { baseline: entry.value, limit, percent: amount, rise: amount, days }
  const fill = (text: string) => text.replace(PLACEHOLDER, (_, key: string) => String(values[key]))
  const { [threshold]: _, ...rest } = r
  const texts = Object.fromEntries(TEXT_FIELDS.map((key) => [key, fill(r[key] as string)]))
  const resolved = threshold === 'aboveBaselinePercent' ? { above: limit } : { atLeast: limit }
  return { ...rest, ...texts, ...resolved, baseline: entry } as unknown as Rule
}

/** A drift row's label differs from the system's value-row labels (the detail picks its chart by label), and there's one drift row per system and indicator. */
function checkGroups(rules: Rule[]) {
  rules.forEach((rule, index) => {
    const drift = rule.atLeast !== undefined
    const earlier = rules.slice(0, index).filter((r) => r.system === rule.system)
    if (earlier.some((r) => (r.atLeast !== undefined) !== drift && r.label === rule.label)) {
      throw new Error(`Rule row ${index}: label ${rule.label} is used by both drift and value rows of ${rule.system}`)
    }
    if (drift && earlier.some((r) => r.atLeast !== undefined && r.indicator === rule.indicator)) {
      throw new Error(`Rule row ${index}: only one riseAboveBaseline row per system and indicator`)
    }
  })
}

/** Validates the rule rows and resolves baseline-relative thresholds against the pre-flight profile. */
export function resolveRules(rows: unknown[], profile: unknown): Rule[] {
  const baseline = validBaseline(profile)
  const rules = rows.map((row, index) => validate(row, index, baseline))
  checkGroups(rules)
  return rules
}

export class JsonRuleSource implements RuleSource {
  constructor(
    private readonly rows: unknown[] = ruleRows,
    private readonly profile: unknown = baselineJson,
  ) {}

  async load(): Promise<Rule[]> {
    return resolveRules(this.rows, this.profile)
  }
}
