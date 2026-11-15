import { describe, expect, it } from 'vitest'
import baselineJson from './baseline.json'
import rows from './rules.json'
import { JsonRuleSource, resolveRules } from './JsonRuleSource'

const valid = rows[0] as Record<string, unknown>
const cogRow = rows[2] as Record<string, unknown>
const cv03Row = rows.find((r) => r.id === 'CV-03') as Record<string, unknown>
const withoutKeys = (row: Record<string, unknown>, key: string) => Object.fromEntries(Object.entries(row).filter(([k]) => k !== key))
const without = (key: string) => withoutKeys(valid, key)

const stringFields = ['id', 'system', 'indicator', 'label', 'unit', 'tier', 'what', 'why', 'howDecided', 'next', 'source']
const numberFields = ['validMin', 'validMax']

describe('JsonRuleSource', () => {
  it('AC3, AC4: loads the 23 rows; existing rows map caution → check and warning → emergency', async () => {
    const rules = await new JsonRuleSource().load()

    expect(rules.map((r) => [r.id, r.below ?? r.above ?? r.atLeast, r.status, r.tier])).toEqual([
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
      ['CV-03', 69, 'watch', 'Self-care'],
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
    const added = rules.slice(10, 22)

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
      'Rule row 0: needs exactly one of below, above, aboveBaselinePercent or riseAboveBaseline',
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
    ['what', '{baseline}', '{baseline} and {limit} need aboveBaselinePercent or riseAboveBaseline'],
    ['howDecided', '{limit}', '{baseline} and {limit} need aboveBaselinePercent or riseAboveBaseline'],
    ['next', '{percent}', '{percent} needs aboveBaselinePercent'],
  ])('AC8 (#28), AC4: %s with %s on a row without aboveBaselinePercent is rejected', async (field, placeholder, reason) => {
    await expect(new JsonRuleSource([{ ...valid, [field]: `x ${placeholder} y` }]).load()).rejects.toThrow(`Rule row 0: ${reason}`)
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

  it('AC1: the pre-flight profile has a synthetic 61 bpm heart rate next to the PVT median', () => {
    expect(baselineJson).toEqual({
      pvtMedianMs: { value: 265, source: 'synthetic' },
      heartRateBpm: { value: 61, source: 'synthetic' },
    })
  })

  it('AC2: CV-03 is the 23rd row, appended after RAD-03', () => {
    expect(rows).toHaveLength(23)
    expect(rows[21].id).toBe('RAD-03')
    expect(rows[22]).toEqual({
      id: 'CV-03',
      system: 'Cardiovascular',
      indicator: 'heartRateBpm',
      label: 'Resting HR',
      unit: 'bpm',
      validMin: 20,
      validMax: 250,
      riseAboveBaseline: 8,
      days: 3,
      status: 'watch',
      tier: 'Self-care',
      what: 'Your resting heart rate has been {limit} bpm or more on {days} days running, {rise} bpm or more above your pre-flight baseline ({baseline} bpm).',
      why: '24-h average heart rate barely changed in flight (63 → 64 bpm, n = 8, pre-flight vs flight days 85–192 on the ISS), so a rise that lasts several days stands out against your own baseline.',
      howDecided:
        'Rule CV-03: lowest heart rate of the day ≥ {limit} bpm (pre-flight baseline {baseline} bpm + {rise}) on {days} days running → level 2, watch. The baseline is a synthetic pre-loaded profile; +{rise} bpm for {days} days is a team heuristic, not a NASA rule.',
      next: 'Re-measure at rest, seated, 5 min after waking. Drink to your fluid target, no caffeine 6–12 h before sleep, and protect your sleep window. A fever or new symptoms → tell the CMO today.',
      source: 'research/health-indicators.md §1 [S26]; research/countermeasures.md [C6]; ideas/crew-health-companion.md check-and-act table',
    })
  })

  it('AC3: CV-03 resolves to at least 69 bpm on 3 days against the 61 bpm baseline, texts filled', async () => {
    const rules = await new JsonRuleSource().load()
    const cv03 = rules.find((r) => r.id === 'CV-03')!

    expect(rules).toHaveLength(23)
    expect([cv03.atLeast, cv03.days, cv03.baseline]).toEqual([69, 3, { value: 61, source: 'synthetic' }])
    expect(Object.hasOwn(cv03, 'riseAboveBaseline')).toBe(false)
    expect(cv03.what).toBe(
      'Your resting heart rate has been 69 bpm or more on 3 days running, 8 bpm or more above your pre-flight baseline (61 bpm).',
    )
    expect(cv03.howDecided).toBe(
      'Rule CV-03: lowest heart rate of the day ≥ 69 bpm (pre-flight baseline 61 bpm + 8) on 3 days running → level 2, watch. The baseline is a synthetic pre-loaded profile; +8 bpm for 3 days is a team heuristic, not a NASA rule.',
    )
  })

  const reject = (rowsIn: unknown[], message: string, profile: unknown = baselineJson) =>
    expect(() => resolveRules(rowsIn, profile)).toThrow(new Error(message))

  it('AC4: a row with both riseAboveBaseline and above is rejected', () => {
    reject([{ ...cv03Row, above: 100 }], 'Rule row 0: needs exactly one of below, above, aboveBaselinePercent or riseAboveBaseline')
  })

  it.each([0, -8, '8'])('AC4: riseAboveBaseline %j is rejected', (rise) => {
    reject([{ ...cv03Row, riseAboveBaseline: rise }], 'Rule row 0: riseAboveBaseline must be a positive number')
  })

  it.each([
    ['missing', withoutKeys(cv03Row, 'days')],
    ['not an integer', { ...cv03Row, days: 2.5 }],
    ['a string', { ...cv03Row, days: '3' }],
    ['below 2', { ...cv03Row, days: 1 }],
  ])('AC4: riseAboveBaseline with days %s is rejected', (_, row) => {
    reject([row], 'Rule row 0: days must be an integer of 2 or more')
  })

  it('AC4: days on a row without riseAboveBaseline is rejected', () => {
    reject([{ ...valid, days: 3 }], 'Rule row 0: days needs riseAboveBaseline')
  })

  it('AC4: a raw row with an atLeast key is rejected', () => {
    reject([{ ...valid, atLeast: 69 }], 'Rule row 0: atLeast is computed, not a row field')
  })

  it.each([
    ['{percent} in next of CV-03', { ...cv03Row, next: 'x {percent}' }, '{percent} needs aboveBaselinePercent'],
    ['{rise} in what of an absolute row', { ...valid, what: 'x {rise}' }, '{rise} and {days} need riseAboveBaseline'],
    ['{days} in next of COG-01', { ...cogRow, next: 'x {days}' }, '{rise} and {days} need riseAboveBaseline'],
    ['{limit} in howDecided of an absolute row', { ...valid, howDecided: 'x {limit}' }, '{baseline} and {limit} need aboveBaselinePercent or riseAboveBaseline'],
  ])('AC4: %s is rejected', (_, row, reason) => {
    reject([row], `Rule row 0: ${reason}`)
  })

  it('AC4: CV-03 with a profile without heartRateBpm is rejected', () => {
    reject([cv03Row], 'Rule row 0: no baseline for heartRateBpm', { pvtMedianMs: { value: 265, source: 'synthetic' } })
  })

  it('AC4: a second riseAboveBaseline row on the same system and indicator is rejected', () => {
    reject([cv03Row, { ...cv03Row, id: 'CV-04' }], 'Rule row 1: only one riseAboveBaseline row per system and indicator')
  })

  it('AC5: a drift row sharing a value row label in the same system is rejected at the row that makes the clash', () => {
    reject(
      [...rows, { ...cv03Row, id: 'T-HR-D', label: 'Heart rate' }],
      'Rule row 23: label Heart rate is used by both drift and value rows of Cardiovascular',
    )
    reject(
      [{ ...cv03Row, label: 'Heart rate' }, rows.find((r) => r.id === 'CV-01')],
      'Rule row 1: label Heart rate is used by both drift and value rows of Cardiovascular',
    )
  })
})
