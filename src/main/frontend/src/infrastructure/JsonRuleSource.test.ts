import { describe, expect, it } from 'vitest'
import rows from './rules.json'
import { JsonRuleSource } from './JsonRuleSource'

const valid = rows[0] as Record<string, unknown>
const without = (key: string) => Object.fromEntries(Object.entries(valid).filter(([k]) => k !== key))

const stringFields = ['id', 'system', 'indicator', 'label', 'unit', 'tier', 'what', 'why', 'howDecided', 'next', 'source']
const numberFields = ['validMin', 'validMax']

describe('JsonRuleSource', () => {
  it('loads the SpO₂ rows and, since #17, COG-01', async () => {
    const rules = await new JsonRuleSource().load()

    expect(rules.map((r) => [r.id, r.below ?? r.above, r.status, r.tier])).toEqual([
      ['SPO-01', 94, 'caution', 'CMO'],
      ['SPO-02', 90, 'warning', 'Urgent ground'],
      ['COG-01', 304.75, 'caution', 'CMO'],
    ])
  })

  it('AC1 (#28): COG-01 resolves against the 265 ms pre-flight profile', async () => {
    const cog = (await new JsonRuleSource().load())[2]

    expect(cog.above).toBe(304.75)
    expect(cog.baseline).toEqual({ value: 265, source: 'synthetic' })
    expect(Object.hasOwn(cog, 'aboveBaselinePercent')).toBe(false)
  })

  it('AC2: accepts pvtMedianMs and still rejects an unknown indicator', async () => {
    await expect(new JsonRuleSource([{ ...valid, indicator: 'pvtMedianMs' }]).load()).resolves.toHaveLength(1)
    await expect(new JsonRuleSource([{ ...valid, indicator: 'glucose' }]).load()).rejects.toThrow('unknown indicator')
  })

  it.each([
    ...stringFields.map((key) => [`missing ${key}`, without(key)]),
    ...stringFields.map((key) => [`non-string ${key}`, { ...valid, [key]: 1 }]),
    ...numberFields.map((key) => [`missing ${key}`, without(key)]),
    ...numberFields.map((key) => [`non-number ${key}`, { ...valid, [key]: '50' }]),
    ['status other than caution or warning', { ...valid, status: 'nominal' }],
    ['neither below nor above', without('below')],
    ['both below and above', { ...valid, above: 100 }],
    ['non-number below', { ...valid, below: '94' }],
    ['non-number above', { ...without('below'), above: '100' }],
    ['unknown indicator', { ...valid, indicator: 'glucose' }],
  ])('rejects a row with %s', async (_, row) => {
    await expect(new JsonRuleSource([row]).load()).rejects.toThrow()
  })
})
