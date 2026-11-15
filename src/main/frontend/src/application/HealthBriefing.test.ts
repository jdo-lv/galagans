import { beforeEach, describe, expect, it } from 'vitest'
import type { RoutineItem } from '../domain/routine'
import type { Rule, SystemStatus } from '../domain/rules'
import { HealthBriefing } from './HealthBriefing'

const spo01: Rule = {
  id: 'SPO-01',
  system: 'Respiratory',
  indicator: 'spo2Percent',
  label: 'SpO₂',
  unit: '%',
  validMin: 50,
  validMax: 100,
  below: 94,
  status: 'check',
  tier: 'CMO',
  what: 'SpO₂ is below 94 %.',
  why: 'Low oxygen saturation can mean hypoxia.',
  next: 'Re-measure. Still below 94 % → tell the CMO now.',
  howDecided: 'Rule SPO-01',
  source: 'research/health-indicators.md §4',
}

const hr: Rule = { ...spo01, id: 'HR-02', system: 'Cardiovascular', label: 'HR', unit: 'bpm', status: 'emergency', tier: 'Urgent ground', what: 'HR is above 120 bpm.', why: 'Why HR.', next: 'Next HR.' }

const sleep: SystemStatus = { system: 'Sleep', state: 'nominal', detail: '7.1 h last night', source: 'synthetic' }
const lowSpo2: SystemStatus = { system: 'Respiratory', state: 'check', label: 'SpO₂', unit: '%', value: 92, source: 'manual', rule: spo01 }
const routine: RoutineItem[] = [
  { kind: 'check-in', label: 'Morning check-in', window: { start: '07:00', end: '09:00' }, estimate: '~1.5 min', state: 'due' },
  { kind: 'pvt', label: 'PVT (3 min)', due: true },
]

describe('HealthBriefing', () => {
  let statuses: SystemStatus[]
  let todo: RoutineItem[]
  let briefing: HealthBriefing

  beforeEach(() => {
    statuses = [lowSpo2, sleep]
    todo = routine
    briefing = new HealthBriefing({ read: async () => statuses }, { read: async () => todo })
  })

  it('everything nominal → says so, lists what is still to do, and asks what next', async () => {
    statuses = [sleep]

    expect(await briefing.brief()).toBe(
      'All your readings are nominal. To do today: your morning check-in and the reaction test. What would you like to do next?',
    )
  })

  it('nothing to do → only nominal and the question', async () => {
    statuses = [sleep]
    todo = []

    expect(await briefing.brief()).toBe('All your readings are nominal. What would you like to do next?')
  })

  it('SpO₂ 92 % → rule SPO-01 word for word first, then the rest, and decision support', async () => {
    expect(await briefing.brief()).toBe(
      'Check, Respiratory. SpO₂ is below 94 %. Yours is 92 %. Low oxygen saturation can mean hypoxia. ' +
        'Re-measure. Still below 94 % → tell the CMO now. Who to involve: CMO. ' +
        'All your other readings are nominal. To do today: your morning check-in and the reaction test. ' +
        'This is decision support; your flight surgeon has the final word. What would you like to do next?',
    )
  })

  it('names systems without data, never as nominal', async () => {
    statuses = [sleep, { system: 'Cognition', state: 'no-data', source: 'in-app test' }, { system: 'Respiratory', state: 'no-data', source: 'manual' }]
    todo = []

    expect(await briefing.brief()).toBe(
      'All your readings are nominal. There is no Cognition or Respiratory reading yet. What would you like to do next?',
    )
  })

  it('#43 AC12: speaks alerts most severe first: Emergency, Treat, Check, Watch', async () => {
    const at = (system: string, state: SystemStatus['state']): SystemStatus => ({ system, state })
    statuses = [at('Cabin air', 'watch'), lowSpo2, at('Immune', 'treat'), { system: 'Cardiovascular', state: 'emergency', label: 'HR', unit: 'bpm', value: 131, source: 'manual', rule: hr }]

    expect(await briefing.brief()).toMatch(/^Emergency, Cardiovascular\. .* Treat, Immune\. Check, Respiratory\. .* Watch, Cabin air\. /)
  })

  it('a briefing on Sleep gives its reading', async () => {
    expect(await briefing.brief('Sleep')).toBe('Sleep is nominal: 7.1 h last night. What would you like to do next?')
  })

  it('a briefing on Respiratory gives its caution word for word, with decision support', async () => {
    expect(await briefing.brief('Respiratory')).toBe(
      'Check, Respiratory. SpO₂ is below 94 %. Yours is 92 %. Low oxygen saturation can mean hypoxia. ' +
        'Re-measure. Still below 94 % → tell the CMO now. Who to involve: CMO. ' +
        'This is decision support; your flight surgeon has the final word. What would you like to do next?',
    )
  })

  it('a rule-decided nominal system gives its reading', async () => {
    statuses = [{ system: 'Respiratory', state: 'nominal', label: 'SpO₂', unit: '%', value: 97, source: 'manual' }]

    expect(await briefing.brief('Respiratory')).toBe('Respiratory is nominal: SpO₂ 97 %. What would you like to do next?')
  })

  it('a missed morning check-in is still to do; a routine placeholder never is', async () => {
    statuses = [sleep]
    todo = [
      { kind: 'check-in', label: 'Morning check-in', window: { start: '07:00', end: '09:00' }, estimate: '~1.5 min', state: 'missed' },
      { kind: 'placeholder', label: 'Exercise · resistance 45 min', detail: '14:00', source: 'synthetic' },
    ]

    expect(await briefing.brief()).toBe('All your readings are nominal. To do today: your morning check-in. What would you like to do next?')
  })

  it('a PVT that is not due is not to do', async () => {
    statuses = [sleep]
    todo = [routine[0], { kind: 'pvt', label: 'PVT (3 min)', due: false }]

    expect(await briefing.brief()).toBe('All your readings are nominal. To do today: your morning check-in. What would you like to do next?')
  })

  it('an old Sleep reading is named old, never nominal', async () => {
    statuses = [{ system: 'Sleep', state: 'stale', label: 'Sleep', unit: 'h', value: 7, source: 'manual' }]
    todo = []

    expect(await briefing.brief()).toBe('Nothing to act on now. The last Sleep reading is old. What would you like to do next?')
    expect(await briefing.brief('Sleep')).toBe('The last Sleep reading is old. What would you like to do next?')
  })

  it('a briefing on a system without data says so', async () => {
    statuses = [{ system: 'Cognition', state: 'no-data', source: 'in-app test' }]

    expect(await briefing.brief('Cognition')).toBe('There is no Cognition data yet. What would you like to do next?')
  })
})
