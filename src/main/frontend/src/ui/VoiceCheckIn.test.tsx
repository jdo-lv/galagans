import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Prefill } from '../application/CheckInPrefill'
import type { Observation } from '../domain/observation'
import type { StepAnswer } from '../domain/voice'
import { mockRoutine } from '../infrastructure/mockRoutine'
import { setup } from '../test/renderApp'

// Local times, so the tests pass in any TZ.
const NOW = new Date(2026, 10, 14, 8)
const MIN = 60_000
type Harness = ReturnType<typeof setup>

const device = (indicator: 'heartRateBpm' | 'spo2Percent', value: number, agoMs: number): Observation => ({
  resourceType: 'Observation',
  id: `oximeter:m:${indicator}`,
  status: 'final',
  code: { text: indicator },
  valueQuantity: { value, unit: indicator === 'heartRateBpm' ? 'bpm' : '%' },
  effectiveDateTime: new Date(NOW.getTime() - agoMs).toISOString(),
  device: { display: 'oximeter · synthetic' },
})
const HR_63 = device('heartRateBpm', 63, 2 * MIN)
const SPO2_97 = device('spo2Percent', 97, MIN)

/** Opens `#/check-in` (or Home) in the app on fakes. */
async function start({ observationSeed = [] as Observation[], home = false } = {}): Promise<Harness> {
  window.location.hash = home ? '' : '#/check-in'
  const s = setup({ now: NOW.toISOString(), routinePlaceholders: mockRoutine, observationSeed })
  s.renderApp()
  if (!home) await screen.findByRole('region', { name: 'Morning check-in' })
  return s
}

const mic = () => screen.getByRole('button', { name: 'Voice control' })
const region = () => screen.getByRole('region', { name: 'Morning check-in' })
const input = () => within(region()).getByRole('spinbutton')
const stepNumber = () => within(region()).getAllByRole('listitem').findIndex((li) => li.getAttribute('aria-current') === 'step') + 1
const pressed = () => within(region()).getAllByRole('button', { pressed: true }).map((b) => b.textContent)
const fieldError = () => region().querySelector('.field-error')
const stored = (s: Harness) => [...s.repository.items.values()].map((i) => i.checkIn)
const spoken = (s: Harness) => s.voice.output.spoken
const next = () => userEvent.click(within(region()).getByRole('button', { name: 'Next →' }))
const touchTo = async (n: number) => {
  while (stepNumber() < n) await next()
}
const said = (s: Harness, text: string, answer?: StepAnswer) => {
  if (answer) s.voice.interpreter.answers[text] = answer
  s.voice.input.hear(text)
}
const value = (v: number): StepAnswer => ({ kind: 'value', value: v })
const symptoms = (...ids: string[]): StepAnswer => ({ kind: 'symptoms', symptoms: ids })
const NOT_VALID = 'Not valid. Say it again.'
const SAY_AGAIN = 'Say it again.'

async function micOn(s: Harness, firstQuestion?: string) {
  await userEvent.click(mic())
  if (firstQuestion) await waitFor(() => expect(spoken(s)[0]).toBe(firstQuestion))
}
const lastSpoken = (s: Harness, text: string) => waitFor(() => expect(spoken(s).at(-1)).toBe(text))
/** Skips the steps left, then says "Save." (AC30's end). */
async function saveBySaying(s: Harness) {
  for (let i = stepNumber(); i < 6; i++) said(s, 'Skip.')
  said(s, 'Save.')
  await waitFor(() => expect(stored(s)).toHaveLength(1))
}
const settled = () => act(async () => {})
const BRIEFING = /What would you like to do next\?$/

beforeEach(() => {
  window.location.hash = ''
})

describe('Start', () => {
  it('AC1: the mic on step 1 asks "Heart rate value?" with no briefing, then listens', async () => {
    const s = await start()

    await micOn(s)

    expect(await screen.findByText('Voice: listening')).toBeInTheDocument()
    expect(spoken(s)).toEqual(['Heart rate value?'])
  })

  it('AC2: the mic on step 3 reached by touch asks "Sleep hours?"', async () => {
    const s = await start()
    await touchTo(3)

    await micOn(s, 'Sleep hours?')
  })

  it('AC3: "Start my check-in" on Home opens it and asks step 1, saying nothing for the opening', async () => {
    const s = await start({ home: true })
    s.voice.interpreter.commands['Start my check-in'] = { kind: 'open', target: { screen: 'check-in' } }
    await userEvent.click(mic())
    await waitFor(() => expect(spoken(s)).toHaveLength(1))

    said(s, 'Start my check-in')

    await lastSpoken(s, 'Heart rate value?')
    expect(window.location.hash).toBe('#/check-in')
    expect(spoken(s)).toHaveLength(2)
  })

  it('AC4: tapping Today\'s routine "Start · …" with voice on asks step 1 once the listen ends', async () => {
    const s = await start({ home: true })
    await userEvent.click(mic())
    await waitFor(() => expect(spoken(s)).toHaveLength(1))
    const routine = await screen.findByRole('region', { name: "Today's routine" })

    await userEvent.click(await within(routine).findByRole('button', { name: /^Start/ }))
    s.voice.input.hear('')

    await lastSpoken(s, 'Heart rate value?')
  })

  it('AC5: nothing is spoken until the device read resolves, then the first text confirms the heart rate', async () => {
    let resolve = (_: Prefill) => {}
    const s = setup({ now: NOW.toISOString(), routinePlaceholders: mockRoutine })
    vi.spyOn(s.checkInPrefill, 'read').mockReturnValue(new Promise((r) => (resolve = r)))
    window.location.hash = '#/check-in'
    s.renderApp()
    await screen.findByRole('region', { name: 'Morning check-in' })

    await micOn(s)
    await settled()
    expect(spoken(s)).toEqual([])
    await act(async () => resolve({ heartRateBpm: { value: 63, source: 'oximeter · synthetic', recordedAt: HR_63.effectiveDateTime } }))

    await lastSpoken(s, 'Confirm or update heart rate value.')
  })

  it('AC6: a rejected device read asks "Heart rate value?"', async () => {
    const s = setup({ now: NOW.toISOString(), routinePlaceholders: mockRoutine })
    vi.spyOn(s.checkInPrefill, 'read').mockRejectedValue(new Error('storage failed'))
    window.location.hash = '#/check-in'
    s.renderApp()
    await screen.findByRole('region', { name: 'Morning check-in' })

    await micOn(s, 'Heart rate value?')
  })

  it('AC7: from the completion screen a check-in command opens nothing and gets "Say it again."', async () => {
    const s = await start()
    await touchTo(6)
    await userEvent.click(within(region()).getByRole('button', { name: 'Save check-in' }))
    await screen.findByText(/Check-in complete/)
    await userEvent.click(mic())
    await waitFor(() => expect(spoken(s)).toHaveLength(1))
    s.voice.interpreter.commands['again'] = { kind: 'open', target: { screen: 'check-in' } }

    said(s, 'again')

    await lastSpoken(s, SAY_AGAIN)
    expect(window.location.hash).toBe('#/check-in')
    expect(screen.getByText(/Check-in complete/)).toBeInTheDocument()
  })
})

describe('Asking', () => {
  it('AC8: with device readings the heart rate and SpO₂ steps ask to confirm or update', async () => {
    const s = await start({ observationSeed: [HR_63, SPO2_97] })
    await micOn(s, 'Confirm or update heart rate value.')

    said(s, 'Yes.')

    await lastSpoken(s, 'Confirm or update SpO₂ value.')
  })

  it('AC9: without a prefill the six steps are asked exactly', async () => {
    const s = await start()
    s.voice.input.said = ['Yes.', 'Yes.', 'Yes.', 'Yes.', 'Yes.']

    await micOn(s)

    await waitFor(() => expect(spoken(s)).toHaveLength(6))
    expect(spoken(s)).toEqual(['Heart rate value?', 'SpO₂ value?', 'Sleep hours?', 'Sleepiness, 1 to 9?', 'Mood, 1 to 5?', 'Symptoms, or none? Then say save.'])
  })

  it('AC10: a typed correction drops the tag, so going back asks "Heart rate value?"', async () => {
    const s = await start({ observationSeed: [HR_63, SPO2_97] })
    await userEvent.clear(input())
    await userEvent.type(input(), '70')
    await next()
    await micOn(s, 'Confirm or update SpO₂ value.')

    said(s, 'Go back.')

    await lastSpoken(s, 'Heart rate value?')
  })

  it('AC11: silence says nothing and listens again', async () => {
    const s = await start()
    let listens = 0
    s.voice.input.onListen = () => listens++
    await micOn(s, 'Heart rate value?')
    await waitFor(() => expect(listens).toBe(1))

    s.voice.input.hear('')

    await waitFor(() => expect(listens).toBe(2))
    expect(spoken(s)).toEqual(['Heart rate value?'])
    expect(stepNumber()).toBe(1)
  })
})

describe('Number steps', () => {
  it('AC12: "Seventy two." fills step 1, moves on without an echo and is saved', async () => {
    const s = await start()
    await micOn(s, 'Heart rate value?')

    said(s, 'Seventy two.', value(72))

    await lastSpoken(s, 'SpO₂ value?')
    expect(spoken(s)).toEqual(['Heart rate value?', 'SpO₂ value?'])
    expect(stepNumber()).toBe(2)
    await saveBySaying(s)
    expect(stored(s)[0].heartRateBpm).toBe(72)
  })

  it.each(['Yes.', 'Keep it.', 'Correct.', 'Confirm.'])('AC13: "%s" keeps the prefilled 63', async (words) => {
    const s = await start({ observationSeed: [HR_63, SPO2_97] })
    await micOn(s, 'Confirm or update heart rate value.')

    said(s, words)

    await waitFor(() => expect(stepNumber()).toBe(2))
    await saveBySaying(s)
    expect(stored(s)[0].heartRateBpm).toBe(63)
  })

  it('AC14: "No, it\'s 70." replaces the prefilled value', async () => {
    const s = await start({ observationSeed: [HR_63] })
    await micOn(s, 'Confirm or update heart rate value.')

    said(s, "No, it's 70.", value(70))

    await waitFor(() => expect(stepNumber()).toBe(2))
    await saveBySaying(s)
    expect(stored(s)[0].heartRateBpm).toBe(70)
  })

  it('AC15: "No." keeps step 1 with 63 and says it again', async () => {
    const s = await start({ observationSeed: [HR_63] })
    await micOn(s, 'Confirm or update heart rate value.')

    said(s, 'No.')

    await lastSpoken(s, SAY_AGAIN)
    expect(stepNumber()).toBe(1)
    expect(input()).toHaveValue(63)
  })

  it('AC16: "Yes." on an empty step 1 moves on with no heart rate', async () => {
    const s = await start()
    await micOn(s, 'Heart rate value?')

    said(s, 'Yes.')

    await waitFor(() => expect(stepNumber()).toBe(2))
    await saveBySaying(s)
    expect(stored(s)[0].heartRateBpm).toBeUndefined()
  })

  it('AC17: sleep 6.33 rounds to 6.5', async () => {
    const s = await start()
    await touchTo(3)
    await micOn(s, 'Sleep hours?')

    said(s, 'Six point three three.', value(6.33))

    await waitFor(() => expect(stepNumber()).toBe(4))
    await saveBySaying(s)
    expect(stored(s)[0].sleepHours).toBe(6.5)
  })

  it('AC18: heart rate 72.4 is saved as 72', async () => {
    const s = await start()
    await micOn(s, 'Heart rate value?')

    said(s, 'Seventy two point four.', value(72.4))

    await waitFor(() => expect(stepNumber()).toBe(2))
    await saveBySaying(s)
    expect(stored(s)[0].heartRateBpm).toBe(72)
  })

  it('AC19: SpO₂ 45 stays on step 2 with the field error and "Not valid. Say it again."', async () => {
    const s = await start()
    await touchTo(2)
    await micOn(s, 'SpO₂ value?')

    said(s, 'Forty five.', value(45))

    await lastSpoken(s, NOT_VALID)
    expect(stepNumber()).toBe(2)
    expect(input()).toHaveValue(45)
    expect(fieldError()).toHaveTextContent('Enter a whole number from 50 to 100 %, or skip.')
  })

  it('AC20: a valid answer after AC19 clears the error and moves on, keeping 97', async () => {
    const s = await start()
    await touchTo(2)
    await micOn(s, 'SpO₂ value?')
    said(s, 'Forty five.', value(45))
    await lastSpoken(s, NOT_VALID)

    said(s, 'Ninety seven.', value(97))

    await waitFor(() => expect(stepNumber()).toBe(3))
    expect(fieldError()).toBeNull()
    await userEvent.click(within(region()).getByRole('button', { name: '← Back' }))
    expect(input()).toHaveValue(97)
    expect(fieldError()).toBeNull()
  })

  it('AC21: sleep 30 is refused with its field error', async () => {
    const s = await start()
    await touchTo(3)
    await micOn(s, 'Sleep hours?')

    said(s, 'Thirty.', value(30))

    await lastSpoken(s, NOT_VALID)
    expect(fieldError()).toHaveTextContent('Enter 0 to 24 h in steps of 0.5, or skip.')
  })

  it('AC22: "Yes." on a typed 300 stays on step 1 with the field error', async () => {
    const s = await start()
    await userEvent.type(input(), '300')
    await micOn(s, 'Heart rate value?')

    said(s, 'Yes.')

    await lastSpoken(s, NOT_VALID)
    expect(stepNumber()).toBe(1)
    expect(fieldError()).toHaveTextContent('Enter a whole number from 20 to 250 bpm, or skip.')
  })
})

describe('Scale steps', () => {
  it('AC23: KSS 7 picks 7, asks the mood and is saved', async () => {
    const s = await start()
    await touchTo(4)
    await micOn(s, 'Sleepiness, 1 to 9?')

    said(s, 'Seven.', value(7))

    await lastSpoken(s, 'Mood, 1 to 5?')
    await saveBySaying(s)
    expect(stored(s)[0].kss).toBe(7)
  })

  it.each([12, 0])('AC24: the value %i picks nothing and says "Not valid. Say it again."', async (n) => {
    const s = await start()
    await touchTo(4)
    await micOn(s, 'Sleepiness, 1 to 9?')

    said(s, 'Out of range.', value(n))

    await lastSpoken(s, NOT_VALID)
    expect(stepNumber()).toBe(4)
    expect(within(region()).queryAllByRole('button', { pressed: true })).toHaveLength(0)
  })

  it('AC25: mood 6 leaves the tapped 3 pressed', async () => {
    const s = await start()
    await touchTo(5)
    await userEvent.click(within(region()).getByRole('button', { name: '3' }))
    await micOn(s, 'Mood, 1 to 5?')

    said(s, 'Six.', value(6))

    await lastSpoken(s, NOT_VALID)
    expect(stepNumber()).toBe(5)
    expect(pressed()).toEqual(['3'])
  })
})

describe('Symptoms and save', () => {
  const onSymptoms = async (observationSeed: Observation[] = []) => {
    const s = await start({ observationSeed })
    await touchTo(6)
    await micOn(s, 'Symptoms, or none? Then say save.')
    return s
  }
  const complete = () => screen.findByText(/^Check-in complete · \d\d:\d\d$/)
  const endsWithSaved = async (s: Harness) => {
    await complete()
    await lastSpoken(s, 'Check-in saved.')
    await waitFor(() => expect(mic()).toHaveAttribute('aria-pressed', 'false'))
    expect(screen.queryByText(/^Voice:/)).not.toBeInTheDocument()
  }

  it('AC26: symptoms heard are pressed, step 6 stays, nothing is stored or spoken', async () => {
    const s = await onSymptoms()

    said(s, 'A headache and back pain.', symptoms('headache', 'back-pain'))

    await waitFor(() => expect(pressed()).toEqual(['Headache', 'Back pain']))
    expect(stepNumber()).toBe(6)
    expect(stored(s)).toEqual([])
    expect(spoken(s)).toHaveLength(1)
  })

  it('AC27: a later answer adds to the picks', async () => {
    const s = await onSymptoms()
    said(s, 'A headache and back pain.', symptoms('headache', 'back-pain'))
    await waitFor(() => expect(pressed()).toHaveLength(2))

    said(s, 'And a rash.', symptoms('rash'))

    await waitFor(() => expect(pressed()).toEqual(['Headache', 'Rash', 'Back pain']))
  })

  it('AC28: the same symptom twice stays pressed', async () => {
    const s = await onSymptoms()
    said(s, 'Headache.', symptoms('headache'))
    await waitFor(() => expect(s.voice.interpreter.answered).toHaveLength(1))

    said(s, 'Headache.')

    await waitFor(() => expect(s.voice.interpreter.answered).toHaveLength(2))

    expect(pressed()).toEqual(['Headache'])
  })

  it('AC29: "None." leaves only "None of these" pressed', async () => {
    const s = await onSymptoms()
    said(s, 'A headache and back pain.', symptoms('headache', 'back-pain'))
    await waitFor(() => expect(pressed()).toHaveLength(2))

    said(s, 'None.', { kind: 'symptoms', symptoms: 'none' })

    await waitFor(() => expect(pressed()).toEqual(['None of these']))
  })

  it('AC30: "Save." stores the picks and ends voice after "Check-in saved."', async () => {
    const s = await onSymptoms()
    said(s, 'A headache and back pain.', symptoms('headache', 'back-pain'))
    await waitFor(() => expect(pressed()).toHaveLength(2))

    said(s, 'Save.')

    await endsWithSaved(s)
    expect(stored(s)).toHaveLength(1)
    expect(stored(s)[0]).toMatchObject({ symptoms: ['headache', 'back-pain'], symptomsAnswered: true })
  })

  it('AC31: "Headache, save check-in." fills and saves', async () => {
    const s = await onSymptoms()

    said(s, 'Headache, save check-in.', symptoms('headache'))

    await endsWithSaved(s)
    expect(stored(s)[0].symptoms).toEqual(['headache'])
  })

  it('AC32: "No symptoms, save." saves an answered empty list', async () => {
    const s = await onSymptoms()

    said(s, 'No symptoms, save.', { kind: 'symptoms', symptoms: 'none' })

    await endsWithSaved(s)
    expect(stored(s)[0]).toMatchObject({ symptoms: [], symptomsAnswered: true })
  })

  it('AC33: "Headache, don\'t save." fills but saves nothing and says nothing', async () => {
    const s = await onSymptoms()

    said(s, "Headache, don't save.", symptoms('headache'))

    await waitFor(() => expect(pressed()).toEqual(['Headache']))
    expect(stored(s)).toEqual([])
    expect(spoken(s)).toHaveLength(1)
  })

  it.each(["Don't save.", 'Yes.'])('AC34: "%s" stores nothing and says it again', async (words) => {
    const s = await onSymptoms()

    said(s, words)

    await lastSpoken(s, SAY_AGAIN)
    expect(stored(s)).toEqual([])
    expect(stepNumber()).toBe(6)
  })

  it('AC35: "Save." on step 1 stores nothing and says it again', async () => {
    const s = await start()
    await micOn(s, 'Heart rate value?')

    said(s, 'Save.')

    await lastSpoken(s, SAY_AGAIN)
    expect(stored(s)).toEqual([])
    expect(stepNumber()).toBe(1)
  })

  it('AC36: a failed save shows and says "Not saved. Try again." and voice stays on', async () => {
    const s = await onSymptoms()
    s.repository.failAdd = true

    said(s, 'Save.')

    await lastSpoken(s, 'Not saved. Try again.')
    expect(await screen.findByRole('alert')).toHaveTextContent('Not saved. Try again.')
    expect(mic()).toHaveAttribute('aria-pressed', 'true')
  })

  it('AC37: "Save." again after a failed save stores it', async () => {
    const s = await onSymptoms()
    s.repository.failAdd = true
    said(s, 'Save.')
    await lastSpoken(s, 'Not saved. Try again.')
    s.repository.failAdd = false

    said(s, 'Save.')

    await endsWithSaved(s)
    expect(stored(s)).toHaveLength(1)
  })
})

describe('Control words', () => {
  it('AC38: "Skip." on step 1 moves on with no heart rate', async () => {
    const s = await start()
    await micOn(s, 'Heart rate value?')

    said(s, 'Skip.')

    await waitFor(() => expect(stepNumber()).toBe(2))
    await saveBySaying(s)
    expect(stored(s)[0].heartRateBpm).toBeUndefined()
  })

  it('AC39: "Skip." on Symptoms stores the check-in without symptomsAnswered', async () => {
    const s = await start()
    await touchTo(6)
    await micOn(s, 'Symptoms, or none? Then say save.')

    said(s, 'Skip.')

    await screen.findByText(/^Check-in complete/)
    expect(stored(s)).toHaveLength(1)
    expect(stored(s)[0].symptomsAnswered).toBeUndefined()
    await lastSpoken(s, 'Check-in saved.')
  })

  it.each(['Go back.', 'Back.', 'Previous.'])('AC40: "%s" on step 3 shows step 2 and asks it', async (words) => {
    const s = await start()
    await touchTo(3)
    await micOn(s, 'Sleep hours?')

    said(s, words)

    await lastSpoken(s, 'SpO₂ value?')
    expect(stepNumber()).toBe(2)
  })

  it('AC41: "Go back." on step 1 stays and asks it again', async () => {
    const s = await start()
    await micOn(s, 'Heart rate value?')

    said(s, 'Go back.')

    await waitFor(() => expect(spoken(s)).toEqual(['Heart rate value?', 'Heart rate value?']))
    expect(stepNumber()).toBe(1)
  })

  it('AC42: "Back pain." is a symptom, not a back', async () => {
    const s = await start()
    await touchTo(6)
    await micOn(s, 'Symptoms, or none? Then say save.')

    said(s, 'Back pain.', symptoms('back-pain'))

    await waitFor(() => expect(pressed()).toEqual(['Back pain']))
    expect(stepNumber()).toBe(6)
  })

  it('AC43: "Cancel." goes Home, stores nothing and keeps voice on', async () => {
    const s = await start()
    await touchTo(2)
    await micOn(s, 'SpO₂ value?')

    said(s, 'Cancel.')

    await lastSpoken(s, 'Check-in cancelled.')
    expect(window.location.hash).toBe('#/')
    expect(stored(s)).toEqual([])
    expect(mic()).toHaveAttribute('aria-pressed', 'true')
  })

  it('AC44: after "Cancel." a briefing command gives the full briefing', async () => {
    const s = await start()
    await micOn(s, 'Heart rate value?')
    said(s, 'Cancel.')
    await lastSpoken(s, 'Check-in cancelled.')
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Morning check-in' })).not.toBeInTheDocument())

    said(s, 'How am I doing?')
    s.voice.interpreter.commands['How am I doing?'] = { kind: 'briefing' }

    await waitFor(() => expect(spoken(s).at(-1)).toMatch(BRIEFING))
  })

  it('AC45: "Okay, stop." turns voice off and leaves the step', async () => {
    const s = await start()
    await touchTo(2)
    await micOn(s, 'SpO₂ value?')

    said(s, 'Okay, stop.')

    await lastSpoken(s, 'Voice off.')
    await waitFor(() => expect(mic()).toHaveAttribute('aria-pressed', 'false'))
    expect(stepNumber()).toBe(2)
    expect(stored(s)).toEqual([])
  })

  it.each(['Go home.', 'Um.'])('AC46: "%s" is not understood: say it again, same step, same screen', async (words) => {
    const s = await start()
    await touchTo(2)
    await micOn(s, 'SpO₂ value?')

    said(s, words)

    await lastSpoken(s, SAY_AGAIN)
    expect(stepNumber()).toBe(2)
    expect(window.location.hash).toBe('#/check-in')
  })
})

describe('Touch and timing', () => {
  it('AC47: Next → while listening drops the answer heard for the old step and asks the new one', async () => {
    const s = await start()
    await micOn(s, 'Heart rate value?')
    await next()

    said(s, 'Seventy two.', value(72))

    await lastSpoken(s, 'SpO₂ value?')
    expect(s.voice.interpreter.answered).toEqual([])
    expect(input()).toHaveValue(null)
    await userEvent.click(within(region()).getByRole('button', { name: '← Back' }))
    expect(input()).toHaveValue(null)
  })

  it('AC48: Next → while the model thinks drops its answer', async () => {
    const s = await start()
    const release = s.voice.interpreter.holdAnswer()
    await micOn(s, 'Heart rate value?')
    said(s, 'Seventy two.', value(72))
    await waitFor(() => expect(s.voice.interpreter.answered).toHaveLength(1))
    await next()

    release()

    await lastSpoken(s, 'SpO₂ value?')
    expect(input()).toHaveValue(null)
    await userEvent.click(within(region()).getByRole('button', { name: '← Back' }))
    expect(input()).toHaveValue(null)
  })

  it('AC49: typing 80 then "Yes." keeps the typed value', async () => {
    const s = await start()
    await micOn(s, 'Heart rate value?')
    await userEvent.type(input(), '80')

    said(s, 'Yes.')

    await waitFor(() => expect(stepNumber()).toBe(2))
    await saveBySaying(s)
    expect(stored(s)[0].heartRateBpm).toBe(80)
  })

  it('AC50: tapping "Save check-in" stores it and ends voice without a word', async () => {
    const s = await start()
    await touchTo(6)
    await micOn(s, 'Symptoms, or none? Then say save.')

    await userEvent.click(within(region()).getByRole('button', { name: 'Save check-in' }))

    await screen.findByText(/^Check-in complete/)
    expect(stored(s)).toHaveLength(1)
    await waitFor(() => expect(mic()).toHaveAttribute('aria-pressed', 'false'))
    expect(spoken(s)).toHaveLength(1)
  })

  it('AC51: a failed tap on "Save check-in" says nothing and keeps voice on', async () => {
    const s = await start()
    await touchTo(6)
    await micOn(s, 'Symptoms, or none? Then say save.')
    s.repository.failAdd = true

    await userEvent.click(within(region()).getByRole('button', { name: 'Save check-in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Not saved. Try again.')
    expect(spoken(s)).toHaveLength(1)
    expect(mic()).toHaveAttribute('aria-pressed', 'true')
  })

  it('AC52: Cancel by tap drops the answer heard afterwards; voice stays on at Home', async () => {
    const s = await start()
    await micOn(s, 'Heart rate value?')
    await userEvent.click(within(region()).getByRole('button', { name: 'Cancel' }))

    said(s, 'Seventy two.', value(72))

    await settled()
    expect(s.voice.interpreter.answered).toEqual([])
    expect(spoken(s)).toEqual(['Heart rate value?'])
    expect(mic()).toHaveAttribute('aria-pressed', 'true')
    expect(window.location.hash).toBe('#/')
  })

  it('AC53: stop is checked before the touch check', async () => {
    const s = await start()
    await micOn(s, 'Heart rate value?')
    await next()

    said(s, 'Okay, stop.')

    await lastSpoken(s, 'Voice off.')
    await waitFor(() => expect(mic()).toHaveAttribute('aria-pressed', 'false'))
  })

  it('AC54: turning voice off while the model thinks drops its answer', async () => {
    const s = await start()
    const release = s.voice.interpreter.holdAnswer()
    await micOn(s, 'Heart rate value?')
    said(s, 'Seventy two.', value(72))
    await waitFor(() => expect(s.voice.interpreter.answered).toHaveLength(1))
    await userEvent.click(mic())

    release()

    await settled()
    expect(input()).toHaveValue(null)
    expect(stepNumber()).toBe(1)
    expect(spoken(s)).toHaveLength(1)
  })

  it('AC55: turning voice off while the device read is pending speaks nothing when it resolves', async () => {
    let resolve = (_: Prefill) => {}
    const s = setup({ now: NOW.toISOString(), routinePlaceholders: mockRoutine })
    vi.spyOn(s.checkInPrefill, 'read').mockReturnValue(new Promise((r) => (resolve = r)))
    window.location.hash = '#/check-in'
    s.renderApp()
    await screen.findByRole('region', { name: 'Morning check-in' })
    await micOn(s)
    await userEvent.click(mic())

    await act(async () => resolve({}))

    expect(spoken(s)).toEqual([])
  })

  it('AC56: an unreachable voice host turns voice off and keeps what was answered', async () => {
    const s = await start()
    await micOn(s, 'Heart rate value?')
    said(s, 'Seventy two.', value(72))
    await lastSpoken(s, 'SpO₂ value?')
    s.voice.interpreter.unreachable = true

    said(s, 'Ninety seven.')

    expect(await screen.findByText('Voice host unreachable')).toBeInTheDocument()
    expect(mic()).toHaveAttribute('aria-pressed', 'false')
    expect(stepNumber()).toBe(2)
    await touchTo(6)
    await userEvent.click(within(region()).getByRole('button', { name: 'Save check-in' }))
    await screen.findByText(/^Check-in complete/)
    expect(stored(s)[0].heartRateBpm).toBe(72)
  })

  it('AC57: the mic on the completion screen starts with the full briefing', async () => {
    const s = await start()
    await touchTo(6)
    await userEvent.click(within(region()).getByRole('button', { name: 'Save check-in' }))
    await screen.findByText(/^Check-in complete/)
    expect(mic()).toBeEnabled()

    await userEvent.click(mic())

    await waitFor(() => expect(spoken(s)[0]).toMatch(BRIEFING))
  })
})
