import { describe, expect, it } from 'vitest'
import rules from '../infrastructure/rules.json'
import { DEVICES } from './devices'
import { READINGS, readingSpec } from './readings'
import type { Rule } from './rules'

const tiled = (rules as Rule[]).filter((rule) => READINGS.some((r) => r.indicator === rule.indicator))
const paired = (rules as Rule[]).filter((rule) => !tiled.includes(rule))

describe('READINGS', () => {
  it.each(tiled.map((rule) => [rule.id, rule] as const))('AC26: %s has the same unit and valid range as its READINGS row', (_, rule) => {
    const spec = READINGS.find((r) => r.indicator === rule.indicator)

    expect(spec).toMatchObject({ unit: rule.unit, validMin: rule.validMin, validMax: rule.validMax })
  })

  it.each(paired.map((rule) => [rule.id, rule] as const))('%s is the second value of a tile and has its device field limits', (_, rule) => {
    const field = DEVICES.flatMap((d) => d.fields as readonly { indicator: string }[]).find((f) => f.indicator === rule.indicator)

    expect(readingSpec(rule.indicator)).toMatchObject({ pairIndicator: rule.indicator, unit: rule.unit })
    expect(field).toMatchObject({ validMin: rule.validMin, validMax: rule.validMax })
  })
})
