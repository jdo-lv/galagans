import { describe, expect, it } from 'vitest'
import rows from './rules.json'
import { JsonRuleSource } from './JsonRuleSource'

const valid = rows[0] as Record<string, unknown>
const cogRow = rows[2] as Record<string, unknown>
const withoutKeys = (row: Record<string, unknown>, key: string) => Object.fromEntries(Object.entries(row).filter(([k]) => k !== key))
const without = (key: string) => withoutKeys(valid, key)

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

  it.each([
    ['no entry', {}],
    ['a non-number value', { pvtMedianMs: { value: '265', source: 'synthetic' } }],
    ['a source other than synthetic', { pvtMedianMs: { value: 265, source: 'manual' } }],
  ])('AC4 (#28): a profile with %s for the indicator is rejected', async (_, profile) => {
    await expect(new JsonRuleSource([cogRow], profile).load()).rejects.toThrow('Rule row 0: no baseline for pvtMedianMs')
  })

  it.each([
    ['none', withoutKeys(cogRow, 'aboveBaselinePercent')],
    ['below and aboveBaselinePercent', { ...cogRow, below: 200 }],
    ['above and aboveBaselinePercent', { ...cogRow, above: 305 }],
  ])('AC5 (#28): a row with %s of the thresholds is rejected', async (_, row) => {
    await expect(new JsonRuleSource([row]).load()).rejects.toThrow(
      'Rule row 0: needs exactly one of below, above or aboveBaselinePercent',
    )
  })

  it.each(['15', 0, -5])('AC6 (#28): aboveBaselinePercent %s is rejected', async (percent) => {
    await expect(new JsonRuleSource([{ ...cogRow, aboveBaselinePercent: percent }]).load()).rejects.toThrow(
      'Rule row 0: aboveBaselinePercent must be a positive number',
    )
  })

  it('AC7 (#28): COG-01 texts are filled from the profile and the row', async () => {
    const cog = (await new JsonRuleSource().load())[2]

    expect(cog.what).toBe('Your PVT median is above 304.75 ms, 15 % slower than your pre-flight baseline (265 ms).')
    expect(cog.howDecided).toBe(
      'Rule COG-01: PVT median > 304.75 ms (pre-flight baseline 265 ms + 15 %) → caution. The baseline is a synthetic pre-loaded profile; +15 % is a team heuristic, not a NASA limit. No adaptation corridor yet.',
    )
  })

  it.each([
    ['what', '{baseline}'],
    ['howDecided', '{limit}'],
    ['next', '{percent}'],
  ])('AC8 (#28): %s with %s on a row without aboveBaselinePercent is rejected', async (field, placeholder) => {
    await expect(new JsonRuleSource([{ ...valid, [field]: `x ${placeholder} y` }]).load()).rejects.toThrow(
      'Rule row 0: {baseline}, {limit} and {percent} need aboveBaselinePercent',
    )
  })

  it('AC9 (#28): SPO-01 and SPO-02 keep their absolute thresholds and have no baseline', async () => {
    const [spo01, spo02] = await new JsonRuleSource().load()

    expect([spo01.below, spo02.below]).toEqual([94, 90])
    expect([spo01.baseline, spo02.baseline]).toEqual([undefined, undefined])
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
