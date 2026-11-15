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
  it('AC3, AC4: loads the 22 rows; existing rows map caution → check and warning → emergency', async () => {
    const rules = await new JsonRuleSource().load()

    expect(rules.map((r) => [r.id, r.below ?? r.above, r.status, r.tier])).toEqual([
      ['SPO-01', 94, 'check', 'CMO'],
      ['SPO-02', 90, 'emergency', 'Urgent ground'],
      ['COG-01', 304.75, 'check', 'CMO'],
      ['CAB-01', 3, 'check', 'CMO'],
      ['CAB-02', 18, 'check', 'CMO'],
      ['CAB-03', 27, 'check', 'CMO'],
      ['CAB-04', 25, 'check', 'CMO'],
      ['CAB-05', 75, 'check', 'CMO'],
      ['RAD-01', 125, 'check', 'CMO'],
      ['RAD-02', 250, 'emergency', 'Urgent ground'],
      ['CV-01', 100, 'check', 'CMO'],
      ['CV-02', 40, 'check', 'CMO'],
      ['BP-01', 119, 'watch', 'Self-care'],
      ['BP-02', 129, 'check', 'CMO'],
      ['BP-03', 79, 'check', 'CMO'],
      ['BP-04', 139, 'treat', 'CMO'],
      ['BP-05', 89, 'treat', 'CMO'],
      ['BP-06', 179, 'emergency', 'Urgent ground'],
      ['BP-07', 119, 'emergency', 'Urgent ground'],
      ['TMP-01', 37.9, 'check', 'CMO'],
      ['CAB-06', 2.5, 'watch', 'Self-care'],
      ['RAD-03', 0.9, 'check', 'CMO'],
    ])
  })

  it('AC3: existing howDecided texts name the level instead of caution or warning', async () => {
    const rules = await new JsonRuleSource().load()
    const howDecided = (id: string) => rules.find((r) => r.id === id)!.howDecided

    expect(howDecided('SPO-01')).toBe('Rule SPO-01: SpO₂ < 94 % → level 3, check. Earth clinical convention, not a NASA in-flight limit (health-indicators §4).')
    expect(howDecided('RAD-02')).toBe(
      'Rule RAD-02: 30-day BFO dose > 250 mGy-Eq → level 5, emergency. NASA-STD-3001 Vol 1 30-day limit for blood-forming organs (health-indicators §19).',
    )
    expect(rules.filter((r) => /caution|warning/.test(r.howDecided))).toEqual([])
  })

  it('AC4: new rows carry the system, indicator, label, unit, device limits, source and texts', async () => {
    const rules = await new JsonRuleSource().load()
    const added = rules.slice(10)

    expect(added.map((r) => [r.id, r.system, r.indicator, r.label, r.unit, r.validMin, r.validMax, r.source])).toEqual([
      ['CV-01', 'Cardiovascular', 'heartRateBpm', 'Heart rate', 'bpm', 20, 250, 'research/health-indicators.md §1'],
      ['CV-02', 'Cardiovascular', 'heartRateBpm', 'Heart rate', 'bpm', 20, 250, 'research/health-indicators.md §1'],
      ['BP-01', 'Cardiovascular', 'systolicMmHg', 'Systolic', 'mmHg', 50, 250, 'research/health-indicators.md §3'],
      ['BP-02', 'Cardiovascular', 'systolicMmHg', 'Systolic', 'mmHg', 50, 250, 'research/health-indicators.md §3'],
      ['BP-03', 'Cardiovascular', 'diastolicMmHg', 'Diastolic', 'mmHg', 30, 150, 'research/health-indicators.md §3'],
      ['BP-04', 'Cardiovascular', 'systolicMmHg', 'Systolic', 'mmHg', 50, 250, 'research/health-indicators.md §3'],
      ['BP-05', 'Cardiovascular', 'diastolicMmHg', 'Diastolic', 'mmHg', 30, 150, 'research/health-indicators.md §3'],
      ['BP-06', 'Cardiovascular', 'systolicMmHg', 'Systolic', 'mmHg', 50, 250, 'research/health-indicators.md §3'],
      ['BP-07', 'Cardiovascular', 'diastolicMmHg', 'Diastolic', 'mmHg', 30, 150, 'research/health-indicators.md §3'],
      ['TMP-01', 'Immune', 'bodyTempC', 'Temperature', '°C', 30, 43, 'research/health-indicators.md §6'],
      ['CAB-06', 'Cabin air', 'cabinCo2MmHg', 'CO₂ (1-h avg)', 'mmHg', 0, 20, 'research/health-indicators.md §22'],
      ['RAD-03', 'Radiation', 'doseRateMsvDay', 'Dose rate', 'mSv/day', 0, 100, 'research/health-indicators.md §19'],
    ])
    expect(added.map((r) => [r.below === undefined ? 'above' : 'below'])).toEqual([
      ['above'], ['below'], ['above'], ['above'], ['above'], ['above'], ['above'], ['above'], ['above'], ['above'], ['above'], ['above'],
    ])
    const texts = (id: string) => {
      const r = rules.find((rule) => rule.id === id)!
      return [r.what, r.why, r.howDecided, r.next]
    }
    expect(texts('CV-01')).toEqual([
      'Heart rate is above 100 bpm.',
      'A resting heart rate above 100 bpm is tachycardia.',
      'Rule CV-01: heart rate > 100 bpm → level 3, check. Earth clinical convention for resting tachycardia, not a NASA in-flight limit (health-indicators §1).',
      'Sit still for 5 minutes and re-measure. Still above 100 bpm → tell the CMO today.',
    ])
    expect(texts('CV-02')).toEqual([
      'Heart rate is below 40 bpm.',
      'A heart rate below 40 bpm is bradycardia; with dizziness or fainting it needs attention.',
      'Rule CV-02: heart rate < 40 bpm → level 3, check. Earth clinical convention (bradycardia below 40–50 bpm with symptoms), not a NASA in-flight limit (health-indicators §1).',
      'Re-measure. Still below 40 bpm, or dizzy → tell the CMO today.',
    ])
    expect(texts('BP-01')).toEqual([
      'Systolic blood pressure is above 119 mmHg.',
      'Blood pressure is drifting up from normal. In flight blood pressure usually drops, so a rise is unusual.',
      'Rule BP-01: systolic > 119 mmHg → level 2, watch. 2017 AHA "elevated" category, an Earth band that applies poorly in flight (health-indicators §3).',
      'Re-measure tomorrow at the same time, seated and rested.',
    ])
    expect(texts('BP-02')).toEqual([
      'Systolic blood pressure is above 129 mmHg.',
      'Blood pressure is in the AHA stage 1 range.',
      'Rule BP-02: systolic > 129 mmHg → level 3, check. 2017 AHA stage 1, an Earth band that applies poorly in flight (health-indicators §3).',
      'Re-measure after 5 minutes seated. Still high → tell the CMO today.',
    ])
    expect(texts('BP-03')).toEqual([
      'Diastolic blood pressure is above 79 mmHg.',
      'Blood pressure is in the AHA stage 1 range.',
      'Rule BP-03: diastolic > 79 mmHg → level 3, check. 2017 AHA stage 1, an Earth band that applies poorly in flight (health-indicators §3).',
      'Re-measure after 5 minutes seated. Still high → tell the CMO today.',
    ])
    expect(texts('BP-04')).toEqual([
      'Systolic blood pressure is above 139 mmHg.',
      'Blood pressure is in the AHA stage 2 range.',
      'Rule BP-04: systolic > 139 mmHg → level 4, treat. 2017 AHA stage 2, an Earth band that applies poorly in flight (health-indicators §3).',
      "Re-measure now. Still high → CMO now and add it to today's medical conference.",
    ])
    expect(texts('BP-05')).toEqual([
      'Diastolic blood pressure is above 89 mmHg.',
      'Blood pressure is in the AHA stage 2 range.',
      'Rule BP-05: diastolic > 89 mmHg → level 4, treat. 2017 AHA stage 2, an Earth band that applies poorly in flight (health-indicators §3).',
      "Re-measure now. Still high → CMO now and add it to today's medical conference.",
    ])
    expect(texts('BP-06')).toEqual([
      'Systolic blood pressure is above 179 mmHg.',
      'Blood pressure is in the severe range.',
      'Rule BP-06: systolic > 179 mmHg → level 5, emergency. 2017 AHA severe ("crisis") definition, an Earth band (health-indicators §3).',
      'CMO now and notify ground.',
    ])
    expect(texts('BP-07')).toEqual([
      'Diastolic blood pressure is above 119 mmHg.',
      'Blood pressure is in the severe range.',
      'Rule BP-07: diastolic > 119 mmHg → level 5, emergency. 2017 AHA severe ("crisis") definition, an Earth band (health-indicators §3).',
      'CMO now and notify ground.',
    ])
    expect(texts('TMP-01')).toEqual([
      'Body temperature is above 37.9 °C.',
      'A fever can mean an infection. In flight resting core temperature runs about 1 °C higher, so an Earth cut-off may false-alarm.',
      'Rule TMP-01: body temperature > 37.9 °C → level 3, check. Earth fever cut-off of 38.0 °C, not a NASA in-flight limit (health-indicators §6).',
      'Re-measure in 30 minutes and note any symptoms in your check-in. Still above 37.9 °C → tell the CMO today.',
    ])
    expect(texts('CAB-06')).toEqual([
      'Cabin CO₂ is above 2.5 mmHg as a 1-hour average.',
      'Keeping CO₂ below 2.5 mmHg holds headache risk below 1 % in ISS crews.',
      'Rule CAB-06: CO₂ 1-h average > 2.5 mmHg → level 2, watch. 2.5 mmHg is a 7-day-average value applied to the 1-h average, a team heuristic (health-indicators §22).',
      'Note any headache in your check-in.',
    ])
    expect(texts('RAD-03')).toEqual([
      'Dose rate is above 0.9 mSv/day.',
      'NASA designs habitats to keep the galactic cosmic ray dose rate below 0.9 mSv/day on surfaces.',
      'Rule RAD-03: dose rate > 0.9 mSv/day → level 3, check. NASA-STD-3001 [V1 4033] surface habitat design limit, not a crew exposure limit (health-indicators §19).',
      'Tell the CMO today. The CMO checks the dose trend and shielding with ground.',
    ])
  })

  it.each(['watch', 'check', 'treat', 'emergency'])('AC2: accepts status %s', async (status) => {
    await expect(new JsonRuleSource([{ ...valid, status }]).load()).resolves.toHaveLength(1)
  })

  it.each(['caution', 'warning', 'nominal', ''])('AC2: rejects status %j', async (status) => {
    await expect(new JsonRuleSource([{ ...valid, status }]).load()).rejects.toThrow(
      'Rule row 0: status must be watch, check, treat or emergency',
    )
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
      'Rule COG-01: PVT median > 304.75 ms (pre-flight baseline 265 ms + 15 %) → level 3, check. The baseline is a synthetic pre-loaded profile; +15 % is a team heuristic, not a NASA limit. No adaptation corridor yet.',
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
        ['neither below nor above', without('below')],
    ['both below and above', { ...valid, above: 100 }],
    ['non-number below', { ...valid, below: '94' }],
    ['non-number above', { ...without('below'), above: '100' }],
    ['unknown indicator', { ...valid, indicator: 'glucose' }],
  ])('rejects a row with %s', async (_, row) => {
    await expect(new JsonRuleSource([row]).load()).rejects.toThrow()
  })
})
