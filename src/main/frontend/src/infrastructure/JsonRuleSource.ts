import type { Baseline } from '../domain/baseline'
import type { RuleSource } from '../domain/ports'
import type { Indicator, Rule } from '../domain/rules'
import baselineJson from './baseline.json'
import ruleRows from './rules.json'

const STRING_FIELDS = ['id', 'system', 'indicator', 'label', 'unit', 'tier', 'what', 'why', 'howDecided', 'next', 'source']
const NUMBER_FIELDS = ['validMin', 'validMax']
const INDICATORS: Indicator[] = ['heartRateBpm', 'spo2Percent', 'sleepHours', 'mood', 'pvtMedianMs']
const THRESHOLDS = ['below', 'above', 'aboveBaselinePercent'] as const

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
  if (r.status !== 'caution' && r.status !== 'warning') fail('status must be caution or warning')
  if (!INDICATORS.includes(r.indicator as Indicator)) fail(`unknown indicator ${String(r.indicator)}`)
  const thresholds = THRESHOLDS.filter((key) => Object.hasOwn(r, key))
  if (thresholds.length !== 1) fail('needs exactly one of below, above or aboveBaselinePercent')
  const [threshold] = thresholds
  if (threshold !== 'aboveBaselinePercent') {
    if (typeof r[threshold] !== 'number') fail(`${threshold} must be a number`)
    return r as unknown as Rule
  }

  const percent = r.aboveBaselinePercent as number
  const indicator = r.indicator as Indicator
  const entry = baseline[indicator] ?? fail(`no baseline for ${indicator}`)
  const { aboveBaselinePercent: _, ...rest } = r
  return { ...rest, above: entry.value * (1 + percent / 100), baseline: entry } as unknown as Rule
}

/** Validates the rule rows and resolves baseline-relative thresholds against the pre-flight profile. */
export function resolveRules(rows: unknown[], profile: unknown): Rule[] {
  const baseline = validBaseline(profile)
  return rows.map((row, index) => validate(row, index, baseline))
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
