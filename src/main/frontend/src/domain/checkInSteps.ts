import type { CheckInDraft } from './checkIn'
import { READINGS } from './readings'
import type { Indicator } from './rules'

// The morning check-in, one question per screen (mockup 06; crew-health-companion.md "Rendering rules").
// A new question is a new row here; the screen renders rows by kind.

type Base = { tab: string; prompt: string; hint: string; seconds: number }

export type NumberStep = Base & {
  kind: 'number'
  field: 'heartRateBpm' | 'spo2Percent' | 'sleepHours'
  /** Input name, the READINGS key. */
  name: string
  label: string
  unit: string
  min: number
  max: number
  step: number
}

export type ScaleStep = Base & {
  kind: 'scale'
  field: 'kss' | 'mood'
  instrument?: string
  min: number
  max: number
  /** Words under some of the numbers, keyed by number. */
  words: Record<number, string>
}

export type ChoicesStep = Base & { kind: 'choices'; field: 'symptoms'; noneLabel: string }

export type CheckInStep = NumberStep | ScaleStep | ChoicesStep

// Escalation after a logged symptom: CMO, then the private medical conference, weekly or on request
// (research/existing-systems.md [S8, S14, S15], research/countermeasures.md [C15]).
const RAISE = 'consider raising with your CMO, or at your next private medical conference.'

/**
 * research/health-indicators.md "Symptom checklist" row; ids are stored, so rewording a label doesn't change data.
 * `next` is the step shown after the symptom is logged (#40).
 */
export const SYMPTOMS = [
  { id: 'headache', label: 'Headache', next: RAISE },
  { id: 'congestion', label: 'Congestion', next: RAISE },
  { id: 'rash', label: 'Rash', next: RAISE },
  // Possible jugular clot: flag neck swelling for the CMO (research/long-duration-literature.md "Veins / clotting" [L4]).
  { id: 'neck-face-swelling', label: 'Neck or face swelling', next: 'tell your CMO.' },
  { id: 'back-pain', label: 'Back pain', next: RAISE },
] as const

// 15 s per step is a team heuristic: the research times the full sleep diary and checklist at 1 min, these are shorter.
const SECONDS = 15
const DEVICE_HINT = 'Type the value from your device, or skip.'

/** Input limits shared with the Latest readings tiles and the server DTO, not clinical thresholds. */
function reading(field: Indicator) {
  const row = READINGS.find((r) => r.indicator === field)
  if (!row || row.indicator === null) throw new Error(`No READINGS row for ${field}`)
  return { name: row.key, label: row.label, unit: row.unit, min: row.validMin, max: row.validMax }
}

function numberStep(field: NumberStep['field'], tab: string, prompt: string, hint: string, step: number): NumberStep {
  return { kind: 'number', field, tab, prompt, hint, step, seconds: SECONDS, ...reading(field) }
}

export const CHECK_IN_STEPS: CheckInStep[] = [
  numberStep('heartRateBpm', 'Heart rate', 'What is your heart rate?', DEVICE_HINT, 1),
  numberStep('spo2Percent', 'SpO₂', 'What is your SpO₂?', DEVICE_HINT, 1),
  numberStep('sleepHours', 'Sleep', 'How long did you sleep last night?', 'Type the hours, or skip.', 0.5),
  {
    kind: 'scale',
    field: 'kss',
    tab: 'Sleepiness',
    instrument: 'Karolinska Sleepiness Scale (KSS)',
    prompt: 'How sleepy do you feel right now?',
    hint: 'Tap one number. Think about the last 5 minutes.',
    min: 1,
    max: 9,
    // S56 (research/health-indicators.md): words on the odd numbers only, typo and punctuation fixed.
    words: {
      1: 'Extremely alert',
      3: 'Alert',
      5: 'Neither alert nor sleepy',
      7: 'Sleepy, but no difficulty remaining awake',
      9: 'Extremely sleepy, fighting sleep',
    },
    seconds: SECONDS,
  },
  {
    kind: 'scale',
    field: 'mood',
    tab: 'Mood',
    prompt: 'How is your mood today?',
    hint: 'Tap one number.',
    min: reading('mood').min,
    max: reading('mood').max,
    words: { 1: 'Very low', 5: 'Very good' },
    seconds: SECONDS,
  },
  {
    kind: 'choices',
    field: 'symptoms',
    tab: 'Symptoms',
    prompt: 'Any of these symptoms today?',
    hint: 'Tap all that apply. Logging a symptom always counts as a completed check-in.',
    noneLabel: 'None of these',
    seconds: SECONDS,
  },
]

export const CHECK_IN_SECONDS = CHECK_IN_STEPS.reduce((sum, s) => sum + s.seconds, 0)

/** Seconds for the step at `index` and every step after it. */
export function secondsLeft(index: number): number {
  return CHECK_IN_STEPS.slice(index).reduce((sum, s) => sum + s.seconds, 0)
}

export type NumberCheck = { value: number | undefined } | { error: string }

/** An empty field is "not answered"; text the browser can't parse (`badInput`) is an error. */
export function checkNumber(row: NumberStep, raw: string, badInput: boolean): NumberCheck {
  if (!badInput && raw.trim() === '') return { value: undefined }
  const value = Number(raw)
  const multiple = value / row.step
  const valid = !badInput && Number.isFinite(value) && value >= row.min && value <= row.max && Math.abs(multiple - Math.round(multiple)) < 1e-9
  if (valid) return { value }
  return {
    error:
      row.step === 1
        ? `Enter a whole number from ${row.min} to ${row.max} ${row.unit}, or skip.`
        : `Enter ${row.min} to ${row.max} ${row.unit} in steps of ${row.step}, or skip.`,
  }
}

export type Answers = Partial<{
  heartRateBpm: number
  spo2Percent: number
  sleepHours: number
  kss: number
  mood: number
  symptoms: string[] | 'none'
}>

/** How many steps of `CHECK_IN_STEPS` the saved check-in answered; the symptom step counts only when answered. */
export function answeredCount(draft: CheckInDraft): number {
  return CHECK_IN_STEPS.filter((step) => (step.kind === 'choices' ? draft.symptomsAnswered === true : draft[step.field] !== undefined)).length
}

/** Skipped answers stay absent: "not answered" is never stored as a value. */
export function toDraft(answers: Answers): CheckInDraft {
  const { symptoms, ...values } = answers
  const draft: CheckInDraft = { symptoms: [] }
  for (const [field, value] of Object.entries(values)) {
    if (value !== undefined) Object.assign(draft, { [field]: value })
  }
  if (symptoms === 'none') return { ...draft, symptomsAnswered: true }
  if (symptoms && symptoms.length > 0) {
    return { ...draft, symptoms: SYMPTOMS.map((s) => s.id).filter((id) => symptoms.includes(id)), symptomsAnswered: true }
  }
  return draft
}
