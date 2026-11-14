import { describe, expect, it } from 'vitest'
import rules from '../infrastructure/rules.json'
import { READINGS } from './readings'
import type { Rule } from './rules'

describe('READINGS', () => {
  it.each((rules as Rule[]).map((rule) => [rule.id, rule] as const))(
    'AC26: %s has the same unit and valid range as its READINGS row',
    (_, rule) => {
      const spec = READINGS.find((r) => r.indicator === rule.indicator)

      expect(spec).toMatchObject({ unit: rule.unit, validMin: rule.validMin, validMax: rule.validMax })
    },
  )
})
