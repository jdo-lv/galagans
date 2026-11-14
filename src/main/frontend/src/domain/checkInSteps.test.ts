import { describe, expect, it } from 'vitest'
import { CHECK_IN_STEPS, checkNumber, secondsLeft, toDraft, type NumberStep } from './checkInSteps'
import { READINGS } from './readings'
import { CHECK_IN_ROUTINE } from './routine'

const heartRate = CHECK_IN_STEPS[0] as NumberStep

describe('CHECK_IN_STEPS', () => {
  it('AC43: six rows in mockup order, 15 s each, limits from READINGS, estimate ~90 s', () => {
    expect(CHECK_IN_STEPS.map((s) => s.field)).toEqual(['heartRateBpm', 'spo2Percent', 'sleepHours', 'kss', 'mood', 'symptoms'])
    expect(CHECK_IN_STEPS.map((s) => s.seconds)).toEqual([15, 15, 15, 15, 15, 15])
    for (const row of CHECK_IN_STEPS) {
      if (row.kind === 'choices') continue
      const reading = READINGS.find((r) => r.indicator === row.field)
      if (!reading || reading.indicator === null) continue // KSS has no tile
      expect([row.min, row.max]).toEqual([reading.validMin, reading.validMax])
    }
    expect(CHECK_IN_STEPS.filter((s) => s.kind !== 'choices' && READINGS.some((r) => r.indicator === s.field))).toHaveLength(4)
    expect(CHECK_IN_ROUTINE.estimate).toBe('~90 s')
  })

  it('AC44: seconds left counts the current and later steps', () => {
    expect([0, 1, 2, 3, 4, 5].map(secondsLeft)).toEqual([90, 75, 60, 45, 30, 15])
  })
})

describe('checkNumber', () => {
  it('AC19: unparseable text is an error, empty is not answered, a number is its value', () => {
    expect(checkNumber(heartRate, '', true)).toEqual({ error: 'Enter a whole number from 20 to 250 bpm, or skip.' })
    expect(checkNumber(heartRate, '', false)).toEqual({ value: undefined })
    expect(checkNumber(heartRate, '63', false)).toEqual({ value: 63 })
  })

  it.each([
    [0, '19'], [0, '251'], [0, '63.5'],
    [1, '49'], [1, '101'], [1, '97.5'],
    [2, '-1'], [2, '24.5'], [2, '6.3'],
  ])('AC16: step %i rejects %s', (index, raw) => {
    expect(checkNumber(CHECK_IN_STEPS[index] as NumberStep, raw, false)).toHaveProperty('error')
  })

  it('AC16: the error text follows the step attribute', () => {
    expect(checkNumber(CHECK_IN_STEPS[1] as NumberStep, '101', false)).toEqual({ error: 'Enter a whole number from 50 to 100 %, or skip.' })
    expect(checkNumber(CHECK_IN_STEPS[2] as NumberStep, '6.3', false)).toEqual({ error: 'Enter 0 to 24 h in steps of 0.5, or skip.' })
  })

  it.each([
    [0, '20', 20], [0, '250', 250], [1, '50', 50], [1, '100', 100], [2, '0', 0], [2, '24', 24], [2, '6.5', 6.5],
  ])('AC17: step %i accepts %s', (index, raw, value) => {
    expect(checkNumber(CHECK_IN_STEPS[index] as NumberStep, raw, false)).toEqual({ value })
  })
})

describe('toDraft', () => {
  it('AC45: symptoms in SYMPTOMS order with the answered flag; other fields absent', () => {
    expect(toDraft({ heartRateBpm: 63, kss: 7, symptoms: ['back-pain', 'headache'] })).toStrictEqual({
      heartRateBpm: 63,
      kss: 7,
      symptoms: ['headache', 'back-pain'],
      symptomsAnswered: true,
    })
  })

  it('AC45: "None of these" is answered with no symptoms; nothing picked is not answered', () => {
    expect(toDraft({ symptoms: 'none' })).toStrictEqual({ symptoms: [], symptomsAnswered: true })
    expect(toDraft({ symptoms: [] })).toStrictEqual({ symptoms: [] })
    expect(toDraft({})).toStrictEqual({ symptoms: [] })
  })
})
