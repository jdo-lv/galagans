import type { RuleSource } from '../domain/ports'
import type { Indicator, Rule } from '../domain/rules'
import ruleRows from './rules.json'

const STRING_FIELDS = ['id', 'system', 'indicator', 'label', 'unit', 'tier', 'what', 'why', 'howDecided', 'next', 'source']
const NUMBER_FIELDS = ['validMin', 'validMax']
const INDICATORS: Indicator[] = ['heartRateBpm', 'spo2Percent', 'sleepHours', 'mood']

function validate(row: unknown, index: number): Rule {
  const fail = (reason: string): never => {
    throw new Error(`Rule row ${index}: ${reason}`)
  }
  if (typeof row !== 'object' || row === null) return fail('not an object')
  const r = row as Record<string, unknown>
  for (const key of STRING_FIELDS) if (typeof r[key] !== 'string') fail(`${key} must be a string`)
  for (const key of NUMBER_FIELDS) if (typeof r[key] !== 'number') fail(`${key} must be a number`)
  if (r.status !== 'caution' && r.status !== 'warning') fail('status must be caution or warning')
  if (!INDICATORS.includes(r.indicator as Indicator)) fail(`unknown indicator ${String(r.indicator)}`)
  const thresholds = (['below', 'above'] as const).filter((key) => key in r)
  if (thresholds.length !== 1) fail('needs exactly one of below or above')
  if (typeof r[thresholds[0]] !== 'number') fail(`${thresholds[0]} must be a number`)
  return r as unknown as Rule
}

export class JsonRuleSource implements RuleSource {
  constructor(private readonly rows: unknown[] = ruleRows) {}

  async load(): Promise<Rule[]> {
    return this.rows.map(validate)
  }
}
