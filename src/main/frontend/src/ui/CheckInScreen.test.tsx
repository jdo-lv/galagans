import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Prefill } from '../application/CheckInPrefill'
import type { CheckIn } from '../domain/checkIn'
import type { Observation, ObservationSource } from '../domain/observation'
import { mockRoutine } from '../infrastructure/mockRoutine'
import { mockCounters, mockStreakSeed } from '../infrastructure/mockStreak'
import { openCheckIn, saveCheckIn, setup } from '../test/renderApp'

// Local times, so the tests pass in any TZ.
const at = (h: number, m = 0, day = 14) => new Date(2026, 10, day, h, m)
const setupAt = (now = at(8)) => setup({ now: now.toISOString(), routinePlaceholders: mockRoutine })

const checkIn = () => screen.getByRole('region', { name: 'Morning check-in' })
const tabItems = () => within(within(checkIn()).getByRole('list', { name: 'Steps' })).getAllByRole('listitem')
const prompt = () => within(checkIn()).getByRole('heading', { level: 3 })
const button = (name: string) => within(checkIn()).getByRole('button', { name })
const input = () => within(checkIn()).getByRole('spinbutton')
const pill = () => checkIn().querySelector('.pill')
const saved = (s: ReturnType<typeof setup>) => [...s.repository.items.values()].map((i) => i.checkIn)

async function open(s: ReturnType<typeof setup>) {
  s.renderApp()
  await openCheckIn()
  await screen.findByRole('region', { name: 'Morning check-in' })
}

async function expectStep(n: number, text: string) {
  await waitFor(() => expect(tabItems()[n - 1]).toHaveAttribute('aria-current', 'step'))
  expect(prompt()).toHaveTextContent(text)
}

const next = () => userEvent.click(button('Next →'))
const skip = () => userEvent.click(button('Skip'))
const back = () => userEvent.click(button('← Back'))
const type = (value: string) => userEvent.type(input(), value)

/** Moves from step 1 to step `n` with "Next →" on empty steps. */
async function goTo(n: number) {
  for (let i = 1; i < n; i++) await next()
}

const bodySystemsHeading = () => screen.getByRole('heading', { name: 'Body systems' })

describe('Home and navigation', () => {
  it('AC1: the due row offers Start · ~90 s as a secondary button', async () => {
    setupAt().renderApp()
    const card = await screen.findByRole('region', { name: "Today's routine" })
    expect(await within(card).findByRole('button', { name: 'Start · ~90 s' })).toHaveClass('button-secondary')
  })

  it('AC2: Start opens #/check-in at step 1 and saves nothing', async () => {
    const s = setupAt()
    s.renderApp()
    await userEvent.click(await screen.findByRole('button', { name: 'Start · ~90 s' }))
    await screen.findByRole('region', { name: 'Morning check-in' })
    expect(window.location.hash).toBe('#/check-in')
    await expectStep(1, 'What is your heart rate?')
    expect(s.repository.items.size).toBe(0)
  })

  it('AC4: the + then Morning check-in opens the check-in outside the window', async () => {
    const s = setupAt(at(10))
    await open(s)
    await expectStep(1, 'What is your heart rate?')
  })

  it("AC5: #/check-in at load shows step 1 and the bar's Add entry", async () => {
    window.history.replaceState(null, '', '#/check-in')
    setupAt().renderApp()
    await screen.findByRole('region', { name: 'Morning check-in' })
    await expectStep(1, 'What is your heart rate?')
    expect(within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', { name: 'Add entry' })).toBeInTheDocument()
  })

  it('AC6: Nominal home has no Check-in card, no input and no primary button (#52 shows the check-in only while it is owed)', async () => {
    const seed: CheckIn[] = [
      { id: 'c', recordedAt: at(7, 30).toISOString(), symptoms: [] },
      { id: 'p', recordedAt: at(7, 40).toISOString(), pvtMedianMs: 268, pvtLapses: 0, pvtFalseStarts: 0, symptoms: [] },
    ]
    const { container } = setup({ now: at(8).toISOString(), routinePlaceholders: mockRoutine, seed }).renderApp()
    await screen.findByRole('region', { name: "Today's routine" })
    expect(screen.queryByRole('region', { name: 'Check-in' })).toBeNull()
    expect(container.querySelector('main input')).toBeNull()
    expect(document.querySelectorAll('.button-primary')).toHaveLength(0)
  })
})

describe('Steps', () => {
  it('AC7: step 1 shows the heading, time left, six tabs, prompt, hint, input and buttons', async () => {
    await open(setupAt())
    expect(within(checkIn()).getByRole('heading', { level: 2 })).toHaveTextContent('Morning check-in')
    expect(pill()).toHaveTextContent('about 90 s left')
    expect(tabItems().map((li) => li.textContent)).toEqual(['1 · Heart rate', '2 · SpO₂', '3 · Sleep', '4 · Sleepiness', '5 · Mood', '6 · Symptoms'])
    expect(prompt()).toHaveTextContent('What is your heart rate?')
    expect(checkIn()).toHaveTextContent('Type the value from your device, or skip.')
    const field = within(checkIn()).getByLabelText('Heart rate / bpm')
    expect(field).toHaveValue(null)
    expect(field).toHaveAttribute('name', 'heartRate')
    expect(field).toHaveAttribute('min', '20')
    expect(field).toHaveAttribute('max', '250')
    expect(field).toHaveAttribute('step', '1')
    expect(within(checkIn()).getAllByRole('button').map((b) => b.textContent)).toEqual(['Cancel', 'Skip', 'Next →'])
  })

  it('AC8: Next → is the only submit button', async () => {
    await open(setupAt())
    const submits = checkIn().querySelectorAll('button[type="submit"]')
    expect(submits).toHaveLength(1)
    expect(submits[0]).toHaveTextContent('Next →')
  })

  it('AC9: the prompt takes focus on open and on each step change', async () => {
    await open(setupAt())
    await waitFor(() => expect(document.activeElement).toBe(prompt()))
    expect(prompt()).toHaveAttribute('tabindex', '-1')
    await next()
    await expectStep(2, 'What is your SpO₂?')
    await waitFor(() => expect(document.activeElement).toBe(prompt()))
  })

  it('AC10: Next with a value moves to step 2 and ticks step 1', async () => {
    await open(setupAt())
    await type('63')
    await next()
    await expectStep(2, 'What is your SpO₂?')
    expect(input()).toHaveValue(null)
    expect(input()).toHaveAttribute('name', 'spo2')
    expect(tabItems()[0]).toHaveTextContent('✓ Heart rate')
    expect(pill()).toHaveTextContent('about 75 s left')
    expect(within(checkIn()).getAllByRole('button').map((b) => b.textContent)).toEqual(['← Back', 'Skip', 'Next →'])
  })

  it('AC11: Enter in the input moves to step 2', async () => {
    await open(setupAt())
    await type('63{Enter}')
    await expectStep(2, 'What is your SpO₂?')
  })

  it('AC12: Skip moves on without a tick', async () => {
    await open(setupAt())
    await skip()
    await expectStep(2, 'What is your SpO₂?')
    expect(tabItems()[0]).toHaveTextContent('1 · Heart rate')
  })

  it('AC13: Back keeps the answer', async () => {
    await open(setupAt())
    await type('63')
    await next()
    await back()
    await expectStep(1, 'What is your heart rate?')
    expect(input()).toHaveValue(63)
  })

  it('AC14: Skip clears the answer', async () => {
    await open(setupAt())
    await type('63')
    await skip()
    await back()
    await expectStep(1, 'What is your heart rate?')
    expect(input()).toHaveValue(null)
  })

  it('AC15: the sleep step asks hours in steps of 0.5', async () => {
    await open(setupAt())
    await goTo(3)
    await expectStep(3, 'How long did you sleep last night?')
    expect(checkIn()).toHaveTextContent('Type the hours, or skip.')
    expect(input()).toHaveAttribute('name', 'sleep')
    expect(input()).toHaveAttribute('min', '0')
    expect(input()).toHaveAttribute('max', '24')
    expect(input()).toHaveAttribute('step', '0.5')
  })
})

describe('Validation', () => {
  it.each([
    [1, ['19', '251', '63.5'], 'Enter a whole number from 20 to 250 bpm, or skip.'],
    [2, ['49', '101', '97.5'], 'Enter a whole number from 50 to 100 %, or skip.'],
    [3, ['-1', '24.5', '6.3'], 'Enter 0 to 24 h in steps of 0.5, or skip.'],
  ])('AC16: step %i keeps the step and explains out-of-range values', async (step, values, text) => {
    await open(setupAt())
    await goTo(step)
    for (const value of values) {
      await userEvent.clear(input())
      await type(value)
      await next()
      const error = checkIn().querySelector('.field-error') as HTMLElement
      expect(error).toHaveTextContent(text)
      expect(error.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
      expect(input()).toHaveAccessibleDescription(text)
      expect(document.activeElement).toBe(input())
      expect(tabItems()[step - 1]).toHaveAttribute('aria-current', 'step')
    }
  })

  it.each([
    [1, '20'], [1, '250'], [2, '50'], [2, '100'], [3, '0'], [3, '24'], [3, '6.5'],
  ])('AC17: step %i accepts %s', async (step, value) => {
    await open(setupAt())
    await goTo(step)
    await type(value)
    await next()
    await waitFor(() => expect(tabItems()[step]).toHaveAttribute('aria-current', 'step'))
  })

  it('AC18: a corrected value moves on and clears the error', async () => {
    await open(setupAt())
    await type('19')
    await next()
    expect(checkIn().querySelector('.field-error')).not.toBeNull()
    await userEvent.clear(input())
    await type('63')
    await next()
    await expectStep(2, 'What is your SpO₂?')
    expect(checkIn().querySelector('.field-error')).toBeNull()
  })
})

describe('Scales and symptoms', () => {
  const words = (n: string) => button(n).closest('li') as HTMLElement

  it('AC20: the KSS step shows the instrument, nine buttons and the S56 words', async () => {
    await open(setupAt())
    await goTo(4)
    await expectStep(4, 'How sleepy do you feel right now?')
    expect(checkIn()).toHaveTextContent('Karolinska Sleepiness Scale (KSS)')
    expect(checkIn()).toHaveTextContent('Tap one number. Think about the last 5 minutes.')
    for (const n of ['1', '2', '3', '4', '5', '6', '7', '8', '9']) expect(button(n)).toHaveAttribute('aria-pressed', 'false')
    expect(pill()).toHaveTextContent('about 45 s left')
    expect(words('1')).toHaveTextContent('Extremely alert')
    expect(words('3')).toHaveTextContent('Alert')
    expect(words('5')).toHaveTextContent('Neither alert nor sleepy')
    expect(words('7')).toHaveTextContent('Sleepy, but no difficulty remaining awake')
    expect(words('9')).toHaveTextContent('Extremely sleepy, fighting sleep')
    for (const n of ['2', '4', '6', '8']) expect(words(n).textContent).toBe(n)
  })

  it('AC21: a tap presses one number', async () => {
    await open(setupAt())
    await goTo(4)
    await userEvent.click(button('7'))
    expect(within(checkIn()).getAllByRole('button', { pressed: true }).map((b) => b.textContent)).toEqual(['7'])
  })

  it('AC22: tapping the pressed number keeps it', async () => {
    await open(setupAt())
    await goTo(4)
    await userEvent.click(button('7'))
    await userEvent.click(button('7'))
    expect(button('7')).toHaveAttribute('aria-pressed', 'true')
  })

  it('AC23: Skip clears the pressed number', async () => {
    await open(setupAt())
    await goTo(4)
    await userEvent.click(button('7'))
    await skip()
    await back()
    await expectStep(4, 'How sleepy do you feel right now?')
    expect(within(checkIn()).queryAllByRole('button', { pressed: true })).toHaveLength(0)
  })

  it('AC24: the mood step shows five buttons with Very low and Very good', async () => {
    await open(setupAt())
    await goTo(5)
    await expectStep(5, 'How is your mood today?')
    expect(checkIn()).toHaveTextContent('Tap one number.')
    for (const n of ['1', '2', '3', '4', '5']) expect(button(n)).toBeInTheDocument()
    expect(within(checkIn()).queryByRole('button', { name: '6' })).toBeNull()
    expect(words('1')).toHaveTextContent('Very low')
    expect(words('5')).toHaveTextContent('Very good')
    expect(pill()).toHaveTextContent('about 30 s left')
  })

  const SYMPTOM_LABELS = ['Headache', 'Congestion', 'Rash', 'Neck or face swelling', 'Back pain', 'None of these']

  it('AC25: the symptoms step lists the checklist and Save check-in', async () => {
    await open(setupAt())
    await goTo(6)
    await expectStep(6, 'Any of these symptoms today?')
    expect(checkIn()).toHaveTextContent('Tap all that apply.')
    for (const label of SYMPTOM_LABELS) expect(button(label)).toHaveAttribute('aria-pressed', 'false')
    expect(button('← Back')).toBeInTheDocument()
    expect(button('Skip')).toBeInTheDocument()
    expect(button('Save check-in')).toBeInTheDocument()
    expect(pill()).toHaveTextContent('about 15 s left')
  })

  it('AC26: symptoms toggle', async () => {
    await open(setupAt())
    await goTo(6)
    await userEvent.click(button('Headache'))
    await userEvent.click(button('Back pain'))
    expect(button('Headache')).toHaveAttribute('aria-pressed', 'true')
    expect(button('Back pain')).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(button('Headache'))
    expect(button('Headache')).toHaveAttribute('aria-pressed', 'false')
  })

  it('AC27: None of these clears the symptoms', async () => {
    await open(setupAt())
    await goTo(6)
    await userEvent.click(button('Headache'))
    await userEvent.click(button('None of these'))
    expect(within(checkIn()).getAllByRole('button', { pressed: true }).map((b) => b.textContent)).toEqual(['None of these'])
  })

  it('AC28: a symptom clears None of these', async () => {
    await open(setupAt())
    await goTo(6)
    await userEvent.click(button('None of these'))
    await userEvent.click(button('Rash'))
    expect(within(checkIn()).getAllByRole('button', { pressed: true }).map((b) => b.textContent)).toEqual(['Rash'])
  })
})

describe('Save and leave', () => {
  async function answerAll() {
    await type('63')
    await next()
    await type('97')
    await next()
    await type('6.5')
    await next()
    await userEvent.click(button('7'))
    await next()
    await userEvent.click(button('4'))
    await next()
    await userEvent.click(button('Back pain'))
    await userEvent.click(button('Headache'))
    await userEvent.click(button('Save check-in'))
  }

  it('AC29: one check-in with every answer, symptoms in checklist order', async () => {
    const s = setupAt()
    await open(s)
    await answerAll()
    await waitFor(() => expect(s.repository.items.size).toBe(1))
    expect(saved(s)[0]).toMatchObject({
      heartRateBpm: 63,
      spo2Percent: 97,
      sleepHours: 6.5,
      kss: 7,
      mood: 4,
      symptoms: ['headache', 'back-pain'],
      symptomsAnswered: true,
    })
  })

  it('AC30: after save, home with focus on Body systems and the row done', async () => {
    const s = setupAt(at(8, 5))
    await open(s)
    await answerAll()
    await userEvent.click(await screen.findByRole('button', { name: 'Done' }))
    await screen.findByRole('region', { name: 'Body systems' })
    expect(window.location.hash).toBe('#/')
    await waitFor(() => expect(document.activeElement).toBe(bodySystemsHeading()))
    const card = screen.getByRole('region', { name: "Today's routine" })
    await waitFor(() => expect(within(card).getAllByRole('listitem')[0]).toHaveTextContent('done 08:05'))
  })

  it('AC31: None of these saves no symptoms, answered', async () => {
    const s = setupAt()
    await open(s)
    await goTo(6)
    await userEvent.click(button('None of these'))
    await userEvent.click(button('Save check-in'))
    await waitFor(() => expect(s.repository.items.size).toBe(1))
    expect(saved(s)[0].symptoms).toEqual([])
    expect(saved(s)[0].symptomsAnswered).toBe(true)
  })

  it('AC32: nothing pressed saves no symptoms, not answered', async () => {
    const s = setupAt()
    await open(s)
    await goTo(6)
    await userEvent.click(button('Save check-in'))
    await waitFor(() => expect(s.repository.items.size).toBe(1))
    expect(saved(s)[0].symptoms).toEqual([])
    expect(saved(s)[0]).not.toHaveProperty('symptomsAnswered')
  })

  it('AC33: Skip on the symptoms step drops a pressed symptom', async () => {
    const s = setupAt()
    await open(s)
    await goTo(6)
    await userEvent.click(button('Headache'))
    await skip()
    await waitFor(() => expect(s.repository.items.size).toBe(1))
    expect(saved(s)[0].symptoms).toEqual([])
    expect(saved(s)[0]).not.toHaveProperty('symptomsAnswered')
  })

  it('AC34: Skip on every step saves an empty check-in', async () => {
    const s = setupAt()
    await open(s)
    for (let i = 0; i < 6; i++) await skip()
    await screen.findByRole('region', { name: 'Check-in complete · 08:00' })
    expect(s.repository.items.size).toBe(1)
    const [c] = saved(s)
    for (const field of ['heartRateBpm', 'spo2Percent', 'sleepHours', 'kss', 'mood', 'symptomsAnswered'] as const) expect(c[field]).toBeUndefined()
    expect(c.symptoms).toEqual([])
  })

  it('AC35: Next on an empty field saves it as not answered', async () => {
    const s = setupAt()
    await open(s)
    await goTo(6)
    await userEvent.click(button('Save check-in'))
    await waitFor(() => expect(s.repository.items.size).toBe(1))
    expect(saved(s)[0].heartRateBpm).toBeUndefined()
  })

  it('AC36: Cancel goes home and saves nothing', async () => {
    const s = setupAt()
    await open(s)
    await type('63')
    await userEvent.click(button('Cancel'))
    await screen.findByRole('region', { name: 'Body systems' })
    expect(window.location.hash).toBe('#/')
    expect(s.repository.items.size).toBe(0)
    await waitFor(() => expect(document.activeElement).toBe(bodySystemsHeading()))
  })

  it('AC37: browser back goes home and saves nothing', async () => {
    const s = setupAt()
    await open(s)
    await type('63')
    await next()
    await type('97')
    await next()
    window.location.hash = '#/'
    await screen.findByRole('region', { name: 'Body systems' })
    expect(s.repository.items.size).toBe(0)
    await waitFor(() => expect(document.activeElement).toBe(bodySystemsHeading()))
  })

  it('AC38: reopening after leaving starts empty', async () => {
    const s = setupAt()
    await open(s)
    await type('63')
    await next()
    window.location.hash = '#/'
    await screen.findByRole('region', { name: 'Body systems' })
    await openCheckIn()
    await screen.findByRole('region', { name: 'Morning check-in' })
    await expectStep(1, 'What is your heart rate?')
    expect(input()).toHaveValue(null)
  })

  it('AC39: a failed save keeps the answers and says so', async () => {
    const s = setupAt()
    s.repository.failAdd = true
    await open(s)
    await goTo(6)
    await userEvent.click(button('Headache'))
    await userEvent.click(button('Save check-in'))
    expect(await within(checkIn()).findByRole('alert')).toHaveTextContent('Not saved. Try again.')
    expect(button('Headache')).toHaveAttribute('aria-pressed', 'true')
    expect(button('Save check-in')).toBeEnabled()
    await expectStep(6, 'Any of these symptoms today?')
  })

  it('AC40: a retry that works goes home', async () => {
    const s = setupAt()
    s.repository.failAdd = true
    await open(s)
    await goTo(6)
    await userEvent.click(button('Save check-in'))
    await within(checkIn()).findByRole('alert')
    s.repository.failAdd = false
    await userEvent.click(button('Save check-in'))
    await screen.findByRole('region', { name: 'Check-in complete · 08:00' })
    expect(s.repository.items.size).toBe(1)
  })

  it('AC41: every button is disabled while saving', async () => {
    const s = setupAt()
    vi.spyOn(s.repository, 'add').mockReturnValue(new Promise(() => {}))
    await open(s)
    await goTo(6)
    await userEvent.click(button('Save check-in'))
    await waitFor(() => expect(button('Save check-in')).toBeDisabled())
    for (const b of within(checkIn()).getAllByRole('button')) expect(b).toBeDisabled()
  })

  it('AC42: SpO₂ 88 through the steps flags Respiratory and the tile', async () => {
    setupAt().renderApp()
    await saveCheckIn({ spo2: 88 })
    const systems = screen.getByRole('region', { name: 'Body systems' })
    await waitFor(() => expect(within(systems).getAllByRole('listitem')[0]).toHaveTextContent('Emergency'))
    const tiles = screen.getByRole('region', { name: 'Latest readings' })
    await waitFor(() => expect(within(tiles).getAllByRole('listitem')[0]).toHaveTextContent('88 %'))
  })
})

describe('Reporting is a win (#40)', () => {
  const local = (h: number, m: number, s = 0, day = 14) => new Date(2026, 10, day, h, m, s)
  const setup40 = (options: Parameters<typeof setup>[0] = {}) => setup({ now: local(8, 5).toISOString(), routinePlaceholders: mockRoutine, ...options })
  const stored = (day: number, symptoms: string[], h = 8, m = 0): CheckIn => ({ id: `s${day}-${h}${m}`, recordedAt: local(h, m, 0, day).toISOString(), symptoms })
  const completion = () => document.querySelector('.check-in-complete') as HTMLElement
  const completeCard = () => screen.getByRole('region', { name: /^Check-in complete · / })
  const summary = () => completeCard().querySelector('.complete__summary')
  const ack = () => completeCard().querySelector('strong')
  const nextSteps = () => within(within(completeCard()).getByRole('list', { name: 'What happens next' })).getAllByRole('listitem').map((li) => li.textContent)
  const streakCard = () => screen.getByRole('region', { name: 'Your routine streak' })

  async function save(symptoms: string[] = []) {
    await goTo(6)
    for (const label of symptoms) await userEvent.click(button(label))
    await userEvent.click(button('Save check-in'))
    await screen.findByRole('region', { name: /^Check-in complete · / })
  }

  describe('Completion state', () => {
    it('AC1: the symptoms hint says a logged symptom always counts', async () => {
      await open(setup40())
      await goTo(6)
      expect(within(checkIn()).getByText('Tap all that apply. Logging a symptom always counts as a completed check-in.')).toBeInTheDocument()
    })

    it('AC4: after save the check-in shows its completion at #/check-in with focus on the heading', async () => {
      await open(setup40())
      await save()
      expect(window.location.hash).toBe('#/check-in')
      expect(screen.queryByRole('region', { name: 'Morning check-in' })).toBeNull()
      expect(screen.queryByRole('list', { name: 'Steps' })).toBeNull()
      const heading = within(completeCard()).getByRole('heading', { level: 2, name: 'Check-in complete · 08:05' })
      await waitFor(() => expect(document.activeElement).toBe(heading))
    })

    it('AC5: the summary counts the answered steps and the time since opening', async () => {
      const s = setup40({ now: local(8, 3, 38).toISOString() })
      await open(s)
      await type('63')
      await next()
      await type('97')
      await next()
      await type('6.5')
      await next()
      await userEvent.click(button('7'))
      await next()
      await next()
      await userEvent.click(button('Headache'))
      s.clock.now = local(8, 5)
      await userEvent.click(button('Save check-in'))
      await screen.findByRole('region', { name: 'Check-in complete · 08:05' })
      expect(summary()).toHaveTextContent('6 steps · 5 answered · 1 min 22 s')
    })

    it('AC6: under a minute the time reads in seconds; skipped steps are not answered', async () => {
      const s = setup40({ now: local(8, 5).toISOString() })
      await open(s)
      for (let i = 0; i < 5; i++) await skip()
      s.clock.now = local(8, 5, 48)
      await skip()
      await screen.findByRole('region', { name: /^Check-in complete · / })
      expect(summary()).toHaveTextContent('6 steps · 0 answered · 48 s')
    })

    it('AC7: a clock moved back reads 0 s', async () => {
      const s = setup40({ now: local(8, 5).toISOString() })
      await open(s)
      await goTo(6)
      s.clock.now = local(8, 4)
      await userEvent.click(button('Save check-in'))
      await screen.findByRole('region', { name: 'Check-in complete · 08:04' })
      expect(summary()?.textContent).toMatch(/· 0 s$/)
    })

    it('AC8: a decorative ✓ circle beside the heading and no status badge anywhere', async () => {
      await open(setup40())
      await save(['Headache'])
      const mark = completeCard().querySelector('span.done-mark')
      expect(mark).toHaveTextContent('✓')
      expect(mark).toHaveAttribute('aria-hidden', 'true')
      expect(completion().querySelector('.badge')).toBeNull()
    })
  })

  describe('Acknowledgement', () => {
    const RAISE = 'consider raising with your CMO, or at your next private medical conference.'

    it('AC9: a reported symptom is thanked, never breaks the streak, and gets its next step', async () => {
      await open(setup40())
      await save(['Headache', 'Back pain'])
      expect(ack()).toHaveTextContent('Logged: headache, back pain. Thanks for reporting.')
      const text = completeCard().textContent ?? ''
      const order = [
        'Logged: headache, back pain. Thanks for reporting.',
        'Reporting a symptom counts as a completed check-in and never breaks your streak.',
        'What happens next',
      ].map((t) => text.indexOf(t))
      expect(order.every((i, k) => i >= 0 && (k === 0 || i > order[k - 1]))).toBe(true)
      expect(within(completeCard()).getByRole('heading', { level: 3, name: 'What happens next' })).toBeInTheDocument()
      expect(nextSteps()).toEqual([`Headache, back pain: ${RAISE}`])
    })

    it('AC10: swelling gets its own CMO line after the shared line', async () => {
      await open(setup40())
      await save(['Headache', 'Neck or face swelling'])
      expect(nextSteps()).toEqual([`Headache: ${RAISE}`, 'Neck or face swelling: tell your CMO.'])
    })

    it('AC11: swelling alone goes to the CMO only', async () => {
      await open(setup40())
      await save(['Neck or face swelling'])
      expect(nextSteps()).toEqual(['Neck or face swelling: tell your CMO.'])
    })

    it('AC12: None of these thanks for checking in, with no next step', async () => {
      await open(setup40())
      await save(['None of these'])
      expect(ack()).toHaveTextContent('No symptoms logged. Thanks for checking in.')
      expect(completeCard()).not.toHaveTextContent('Reporting a symptom')
      expect(completeCard()).not.toHaveTextContent('What happens next')
    })

    it('AC13: a symptom step left empty or skipped is not answered', async () => {
      await open(setup40())
      await save()
      expect(ack()).toHaveTextContent('Symptoms not answered. Thanks for checking in.')
      expect(completeCard()).not.toHaveTextContent('Reporting a symptom')
      expect(completeCard()).not.toHaveTextContent('What happens next')
      await userEvent.click(screen.getByRole('button', { name: 'Done' }))
      await openCheckIn()
      await screen.findByRole('region', { name: 'Morning check-in' })
      await goTo(6)
      await userEvent.click(button('Headache'))
      await skip()
      await screen.findByRole('region', { name: /^Check-in complete · / })
      expect(ack()).toHaveTextContent('Symptoms not answered. Thanks for checking in.')
      expect(completeCard()).not.toHaveTextContent('What happens next')
    })

    it('AC14: a symptom logged on the days before counts its day', async () => {
      await open(setup40({ seed: [stored(12, ['headache']), stored(13, ['headache'])] }))
      await save(['Headache', 'Back pain'])
      await waitFor(() => expect(ack()).toHaveTextContent('Logged: headache (day 3), back pain. Thanks for reporting.'))
    })

    it('AC15: the second day in a row reads day 2', async () => {
      await open(setup40({ seed: [stored(13, ['headache'])] }))
      await save(['Headache'])
      await waitFor(() => expect(ack()).toHaveTextContent('Logged: headache (day 2). Thanks for reporting.'))
    })

    it('AC16: a skipped symptom step breaks the run', async () => {
      await open(setup40({ seed: [stored(12, ['headache']), stored(13, [])] }))
      await save(['Headache'])
      await screen.findByText(/check-ins? in a row/)
      expect(ack()).toHaveTextContent('Logged: headache. Thanks for reporting.')
    })

    it('AC17: no health value appears in the completion', async () => {
      await open(setup40())
      await type('63')
      await next()
      await type('97')
      await next()
      await type('6.5')
      await next()
      await userEvent.click(button('7'))
      await next()
      await userEvent.click(button('4'))
      await next()
      await userEvent.click(button('Save check-in'))
      await screen.findByText(/check-ins? in a row/)
      for (const value of ['63', '97', '6.5', 'bpm', '%']) expect(completion().textContent).not.toContain(value)
    })
  })

  describe('Leaving and saving', () => {
    it('AC18: Done is the only primary button and goes home with focus on Body systems and the row done', async () => {
      await open(setup40())
      await save()
      expect([...completion().querySelectorAll('.button-primary')].map((b) => b.textContent)).toEqual(['Done'])
      await userEvent.click(screen.getByRole('button', { name: 'Done' }))
      await screen.findByRole('region', { name: 'Body systems' })
      expect(window.location.hash).toBe('#/')
      await waitFor(() => expect(document.activeElement).toBe(bodySystemsHeading()))
      const card = screen.getByRole('region', { name: "Today's routine" })
      await waitFor(() => expect(within(card).getAllByRole('listitem')[0]).toHaveTextContent('done 08:05'))
    })

    it('AC19: browser back from the completion goes home, and the + then Morning check-in starts empty', async () => {
      await open(setup40())
      await save()
      window.location.hash = '#/'
      await screen.findByRole('region', { name: 'Body systems' })
      await waitFor(() => expect(document.activeElement).toBe(bodySystemsHeading()))
      await openCheckIn()
      await screen.findByRole('region', { name: 'Morning check-in' })
      await expectStep(1, 'What is your heart rate?')
      expect(input()).toHaveValue(null)
    })

    it('AC21: offline, the completion and streak show and the check-in waits to sync', async () => {
      const s = setup40({ online: false })
      await open(s)
      await save()
      expect(streakCard()).toBeInTheDocument()
      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Offline · 1 waiting to sync'))
      expect(s.gateway.sent).toEqual([])
    })
  })

  describe('Routine streak card', () => {
    const withSeed = () => setup40({ streakSeed: mockStreakSeed, counters: mockCounters })
    const items = () => within(within(streakCard()).getByRole('list', { name: 'Last 14 days' })).getAllByRole('listitem')
    const hidden = (li: HTMLElement) => li.querySelector('.visually-hidden')?.textContent
    const mark = (li: HTMLElement) => li.querySelector('.day__mark') as HTMLElement
    async function savedWithSeed(s = withSeed()) {
      await open(s)
      await save(['Headache'])
      await screen.findByText(/check-ins? in a row/)
      return s
    }

    it('AC22: the card counts check-ins, not values', async () => {
      await savedWithSeed()
      expect(streakCard()).toHaveTextContent('Counts what you do, never your values. No comparison with your crewmates.')
      expect(streakCard().querySelector('.streak__count b')).toHaveTextContent(/^12$/)
      expect(streakCard()).toHaveTextContent('check-ins in a row · last 14 days below')
    })

    it('AC23: 14 day cells from 1 Nov with a hidden day number and a hidden mark', async () => {
      await savedWithSeed()
      const cells = items()
      expect(cells).toHaveLength(14)
      cells.forEach((li, i) => {
        const date = li.querySelector('.day__date')
        expect(date).toHaveTextContent(new RegExp(`^${i + 1}$`))
        expect(date).toHaveAttribute('aria-hidden', 'true')
        expect(mark(li)).toHaveAttribute('aria-hidden', 'true')
      })
      const kind = (li: HTMLElement) =>
        mark(li).querySelector('.tabler-icon-player-pause') ? 'paused' : mark(li).querySelector('.tabler-icon-report-medical') ? 'reported' : mark(li).textContent
      expect(cells.map(kind)).toEqual(['✓', '✓', '✓', '✓', '✓', '✓', 'paused', 'paused', 'reported', 'reported', '✓', 'reported', 'reported', 'reported'])
      for (const li of cells.filter((c) => kind(c) === 'reported')) expect(mark(li)).toHaveTextContent('✓')
    })

    it('AC24: each cell names its date and state for screen readers', async () => {
      await savedWithSeed()
      expect(items().map(hidden)).toEqual([
        '1 Nov: check-in done, synthetic',
        '2 Nov: check-in done, synthetic',
        '3 Nov: check-in done, synthetic',
        '4 Nov: check-in done, synthetic',
        '5 Nov: check-in done, synthetic',
        '6 Nov: check-in done, synthetic',
        '7 Nov: paused, synthetic',
        '8 Nov: paused, synthetic',
        '9 Nov: check-in done, symptom reported, synthetic',
        '10 Nov: check-in done, symptom reported, synthetic',
        '11 Nov: check-in done, synthetic',
        '12 Nov: check-in done, symptom reported, synthetic',
        '13 Nov: check-in done, symptom reported, synthetic',
        '14 Nov: check-in done, symptom reported',
      ])
    })

    it('AC25: a day without a check-in shows — and says no check-in', async () => {
      await open(setup40({ seed: [stored(12, [], 7, 30), stored(14, [], 7, 30)] }))
      await save(['Headache'])
      await screen.findByText(/check-ins? in a row/)
      const cell = items()[12]
      expect(mark(cell)).toHaveTextContent(/^—$/)
      expect(hidden(cell)).toBe('13 Nov: no check-in')
    })

    it('AC26: only today is the current date', async () => {
      await savedWithSeed()
      const current = items().filter((li) => li.getAttribute('aria-current') === 'date')
      expect(current).toEqual([items()[13]])
      expect(items().filter((li) => li.classList.contains('day--today'))).toEqual([items()[13]])
    })

    it('AC27: the legend explains every mark', async () => {
      await savedWithSeed()
      const entries = [...(streakCard().querySelector('.legend')?.children ?? [])] as HTMLElement[]
      expect(entries.map((e) => e.textContent?.trim())).toEqual([
        '✓ check-in done',
        'symptom reported (counts as done)',
        'sick or rest day: paused, never reset',
        '— no check-in',
      ])
      expect(entries[1].querySelector('.tabler-icon-report-medical')).not.toBeNull()
      expect(entries[2].querySelector('.tabler-icon-player-pause')).not.toBeNull()
    })

    it('AC28: a caption labels the synthetic history', async () => {
      await savedWithSeed()
      const note = streakCard().querySelector('.seed-note')
      expect(note?.querySelector('.tag')).toHaveTextContent('synthetic')
      expect(note).toHaveTextContent('Days before 14 Nov are a pre-loaded demo history.')
    })

    it('AC29: without a seed there is no caption, and one check-in reads in the singular', async () => {
      await open(setup40())
      await save()
      await screen.findByText(/check-ins? in a row/)
      expect(streakCard().querySelector('.seed-note')).toBeNull()
      expect(streakCard()).not.toHaveTextContent('synthetic')
      expect(streakCard().querySelector('.streak__count b')).toHaveTextContent(/^1$/)
      expect(streakCard()).toHaveTextContent('check-in in a row · last 14 days below')
    })

    it('AC30: three process counters, the synthetic ones tagged', async () => {
      await savedWithSeed()
      const counters = within(within(streakCard()).getByRole('list', { name: 'Process counters' })).getAllByRole('listitem')
      expect(counters.map((li) => li.textContent)).toEqual([
        'Exercise this week540 / 600 mincountermeasure minutes done synthetic',
        'Fluid log4 of 7 daysdays you logged to target synthetic',
        'PVT sessions0 of 7every 4th day, last 28 days',
      ])
      expect(counters.map((li) => li.querySelector('.tag')?.textContent ?? null)).toEqual(['synthetic', 'synthetic', null])
    })

    it('AC31: the card ends by saying no health value is shown', async () => {
      await savedWithSeed()
      expect(streakCard().lastElementChild).toHaveTextContent(
        'Never shown here: heart rate, SpO₂, sleep hours, mood or any health value. Nothing is scored as good or bad.',
      )
    })

    it('AC32: while the streak is loading, only its heading shows and Done still works', async () => {
      const s = setup40({ seed: [stored(12, ['headache']), stored(13, ['headache'])] })
      vi.spyOn(s.streakReader, 'read').mockReturnValue(new Promise(() => {}))
      await open(s)
      await save(['Headache'])
      expect(streakCard().textContent).toBe('Your routine streak')
      expect(ack()).toHaveTextContent('Logged: headache. Thanks for reporting.')
      await userEvent.click(screen.getByRole('button', { name: 'Done' }))
      await screen.findByRole('region', { name: 'Body systems' })
    })

    it('AC33: a failed streak read says so, without a day count, and Done still works', async () => {
      const s = setup40({ seed: [stored(12, ['headache']), stored(13, ['headache'])] })
      vi.spyOn(s.streakReader, 'read').mockRejectedValue(new Error('IndexedDB unavailable'))
      await open(s)
      await save(['Headache'])
      expect(await within(streakCard()).findByText('Streak unavailable')).toBeInTheDocument()
      expect(ack()).toHaveTextContent('Logged: headache. Thanks for reporting.')
      await userEvent.click(screen.getByRole('button', { name: 'Done' }))
      await screen.findByRole('region', { name: 'Body systems' })
    })
  })
})

describe('Device prefill (#55)', () => {
  const MIN = 60_000
  const opened = at(8)
  const ago = (ms: number) => new Date(opened.getTime() - ms).toISOString()
  const device = (id: string, indicator: 'heartRateBpm' | 'spo2Percent', value: number, recordedAt: string, display: ObservationSource = 'oximeter · synthetic'): Observation => ({
    resourceType: 'Observation',
    id,
    status: 'final',
    code: { text: indicator },
    valueQuantity: { value, unit: indicator === 'heartRateBpm' ? 'bpm' : '%' },
    effectiveDateTime: recordedAt,
    device: { display },
  })
  const HR_63 = device('oximeter:m1:heartRateBpm', 'heartRateBpm', 63, ago(2 * MIN))
  const withDevices = (...observationSeed: Observation[]) => setup({ now: opened.toISOString(), routinePlaceholders: mockRoutine, observationSeed })
  const PREFILL_HINT = 'From your device. Next keeps it; type to correct it, or skip.'
  const DEVICE_HINT = 'Type the value from your device, or skip.'
  const hint = () => checkIn().querySelector('.step-hint')
  const sourceRow = () => checkIn().querySelector('.field-tile__source')
  const sourceRowText = () => [...(sourceRow()?.children ?? [])].map((c) => c.textContent)

  async function expectPrefilled(value: number, source: string, age: string) {
    await waitFor(() => expect(input()).toHaveValue(value))
    expect(sourceRowText()).toEqual([source, age])
    expect(sourceRow()?.children[0]).toHaveClass('tag')
    expect(sourceRow()?.children[1]).toHaveClass('tile-label__suffix')
    expect(hint()).toHaveTextContent(PREFILL_HINT)
  }

  function expectEmpty() {
    expect(input()).toHaveValue(null)
    expect(sourceRow()).toBeNull()
    expect(checkIn().querySelector('.tag')).toBeNull()
    expect(hint()).toHaveTextContent(DEVICE_HINT)
  }

  /** Opens the check-in and waits until the prefill read has settled. */
  async function openSettled(s: ReturnType<typeof setup>) {
    const read = vi.spyOn(s.checkInPrefill, 'read')
    await open(s)
    await waitFor(() => expect(read).toHaveBeenCalled())
    await act(() => Promise.allSettled(read.mock.results.map((r) => r.value)))
  }

  it('AC1: a heart rate 2 min old fills step 1 with its tag, age and the prefill hint', async () => {
    await open(withDevices(HR_63))
    await expectPrefilled(63, 'oximeter · synthetic', '2 min ago')
  })

  it('AC2: an SpO₂ 1 min old fills step 2', async () => {
    await open(withDevices(device('oximeter:m2:spo2Percent', 'spo2Percent', 97, ago(MIN))))
    await next()
    await expectStep(2, 'What is your SpO₂?')
    await expectPrefilled(97, 'oximeter · synthetic', '1 min ago')
  })

  it('AC3: the newest reading of any device wins', async () => {
    await open(
      withDevices(
        device('oximeter:m1:heartRateBpm', 'heartRateBpm', 63, ago(3 * MIN)),
        device('bracelet:b1:heartRateBpm', 'heartRateBpm', 70, ago(MIN), 'bracelet · synthetic'),
      ),
    )
    await expectPrefilled(70, 'bracelet · synthetic', '1 min ago')
  })

  it('AC4: a reading exactly 15 min old fills step 1', async () => {
    await open(withDevices(device('oximeter:m1:heartRateBpm', 'heartRateBpm', 63, ago(15 * MIN))))
    await expectPrefilled(63, 'oximeter · synthetic', '15 min ago')
  })

  it('AC5: a reading 15 min 1 s old leaves step 1 empty with the device hint and no tag', async () => {
    await openSettled(withDevices(device('oximeter:m1:heartRateBpm', 'heartRateBpm', 63, ago(15 * MIN + 1000))))
    expectEmpty()
  })

  it('AC6: a reading 30 s after the check-in opens fills step 1 and reads just now', async () => {
    await open(withDevices(device('oximeter:m1:heartRateBpm', 'heartRateBpm', 63, ago(-30_000))))
    await expectPrefilled(63, 'oximeter · synthetic', 'just now')
  })

  it("AC7: 63.5 is rounded to the step's increment", async () => {
    await open(withDevices(device('oximeter:m1:heartRateBpm', 'heartRateBpm', 63.5, ago(MIN))))
    await expectPrefilled(64, 'oximeter · synthetic', '1 min ago')
  })

  it('AC8: a saved check-in never prefills', async () => {
    const s = setup({
      now: opened.toISOString(),
      routinePlaceholders: mockRoutine,
      seed: [{ id: 'c1', recordedAt: ago(5 * MIN), heartRateBpm: 72, symptoms: [] }],
    })
    await openSettled(s)
    expectEmpty()
  })

  /** "Next →" on steps 2–5, then "Save check-in", and waits for the stored check-in. */
  async function saveFromStep2(s: ReturnType<typeof setup>) {
    await expectStep(2, 'What is your SpO₂?')
    for (let i = 2; i < 6; i++) await next()
    await userEvent.click(button('Save check-in'))
    await waitFor(() => expect(s.repository.items.size).toBe(1))
    return saved(s)[0]
  }

  async function correctTo(value: string) {
    await userEvent.clear(input())
    await type(value)
  }

  it('AC9: Next keeps the prefilled value, saved as a plain check-in value', async () => {
    const s = withDevices(HR_63)
    await open(s)
    await expectPrefilled(63, 'oximeter · synthetic', '2 min ago')
    await next()
    expect(await saveFromStep2(s)).toEqual({ id: expect.any(String), recordedAt: opened.toISOString(), heartRateBpm: 63, symptoms: [] })
  })

  it('AC10: a corrected value drops the tag, the age and the prefill hint', async () => {
    await open(withDevices(HR_63))
    await expectPrefilled(63, 'oximeter · synthetic', '2 min ago')
    await correctTo('70')
    expect(input()).toHaveValue(70)
    expect(sourceRow()).toBeNull()
    expect(checkIn()).not.toHaveTextContent('2 min ago')
    expect(hint()).toHaveTextContent(DEVICE_HINT)
  })

  it('AC11: typing the prefilled value back shows the tag, age and prefill hint again', async () => {
    await open(withDevices(HR_63))
    await expectPrefilled(63, 'oximeter · synthetic', '2 min ago')
    await correctTo('70')
    await correctTo('63')
    await expectPrefilled(63, 'oximeter · synthetic', '2 min ago')
  })

  it('AC12: the corrected value is saved', async () => {
    const s = withDevices(HR_63)
    await open(s)
    await expectPrefilled(63, 'oximeter · synthetic', '2 min ago')
    await correctTo('70')
    await next()
    expect((await saveFromStep2(s)).heartRateBpm).toBe(70)
  })

  it('AC13: Skip clears the prefilled value and Back shows no tag', async () => {
    await open(withDevices(HR_63))
    await expectPrefilled(63, 'oximeter · synthetic', '2 min ago')
    await skip()
    await back()
    await expectStep(1, 'What is your heart rate?')
    expect(input()).toHaveValue(null)
    expect(sourceRow()).toBeNull()
  })

  it('AC14: a skipped prefilled step saves no heart rate', async () => {
    const s = withDevices(HR_63)
    await open(s)
    await expectPrefilled(63, 'oximeter · synthetic', '2 min ago')
    await skip()
    expect(await saveFromStep2(s)).not.toHaveProperty('heartRateBpm')
  })

  const READ_HR: Prefill = { heartRateBpm: { value: 63, source: 'oximeter · synthetic', recordedAt: ago(2 * MIN) } }
  const READ_HR_SPO2: Prefill = { ...READ_HR, spo2Percent: { value: 97, source: 'oximeter · synthetic', recordedAt: ago(MIN) } }

  /** Holds `read` pending; the returned function resolves it. */
  function pendingRead(s: ReturnType<typeof setup>) {
    let resolve: (prefill: Prefill) => void = () => {}
    vi.spyOn(s.checkInPrefill, 'read').mockReturnValue(new Promise((r) => (resolve = r)))
    return (prefill: Prefill) => act(async () => resolve(prefill))
  }

  /** AC16's state: step 1 passed empty while `read` was pending, then `read` resolved with HR 63 and SpO₂ 97. */
  async function passedWhilePending() {
    const s = withDevices()
    const resolve = pendingRead(s)
    await open(s)
    await next()
    await expectStep(2, 'What is your SpO₂?')
    await resolve(READ_HR_SPO2)
  }

  it('AC15: a late prefill never overwrites typed text', async () => {
    const s = withDevices()
    const resolve = pendingRead(s)
    await open(s)
    await type('80')
    await resolve(READ_HR)
    expect(input()).toHaveValue(80)
    expect(sourceRow()).toBeNull()
  })

  it('AC16: a late prefill fills the step on screen', async () => {
    await passedWhilePending()
    await expectPrefilled(97, 'oximeter · synthetic', '1 min ago')
  })

  it('AC17: a late prefill leaves a step already passed empty', async () => {
    await passedWhilePending()
    await back()
    await expectStep(1, 'What is your heart rate?')
    expect(input()).toHaveValue(null)
    expect(sourceRow()).toBeNull()
  })

  it("AC18: typing the device's value into a passed step shows no tag", async () => {
    await passedWhilePending()
    await back()
    await expectStep(1, 'What is your heart rate?')
    await type('63')
    expect(sourceRow()).toBeNull()
    expect(hint()).toHaveTextContent(DEVICE_HINT)
  })

  it('AC19: a failed read is silent', async () => {
    const s = withDevices(HR_63)
    vi.spyOn(s.checkInPrefill, 'read').mockRejectedValue(new Error('IndexedDB unavailable'))
    await openSettled(s)
    expectEmpty()
    await next()
    await expectStep(2, 'What is your SpO₂?')
    expectEmpty()
    expect(within(checkIn()).queryByRole('alert')).toBeNull()
    expect(checkIn().querySelector('.field-error')).toBeNull()
  })

  it('AC20: readings stored after the check-in opens change nothing, and read runs once', async () => {
    const s = withDevices()
    const read = vi.spyOn(s.checkInPrefill, 'read')
    await open(s)
    await act(() => Promise.allSettled(read.mock.results.map((r) => r.value)))
    s.readings.emit({ id: 'm1', t: opened.toISOString(), spo2_pct: 97, pulse_bpm: 63, src: 'synthetic' })
    await waitFor(() => expect(s.observations.items.size).toBe(2))
    await expectStep(1, 'What is your heart rate?')
    expect(input()).toHaveValue(null)
    expect(read).toHaveBeenCalledTimes(1)
  })
})
