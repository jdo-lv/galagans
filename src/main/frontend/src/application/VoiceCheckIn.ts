import { CHECK_IN_STEPS, type CheckInStep } from '../domain/checkInSteps'
import type { CheckInForm, VoiceInterpreter } from '../domain/ports'

/** What voice does after an answer: say `say`, then end when `end`, or ask the step on screen again when `ask`. */
export type Turn = { say?: string; end?: boolean; ask?: boolean }

const SAY_AGAIN = 'Say it again.'
const NOT_VALID = 'Not valid. Say it again.'
const KEEP = /\b(yes|keep|correct|confirm)\b/i
const NOT_KEEP = /\b(no|not|don[’']t)\b/i
const SAVE = /\bsave\b/i
// Only these block a save, so "No symptoms, save." saves.
const NOT_SAVE = /\b(not|don[’']t)\b/i
const BACK = /\b(go back|previous)\b|^\W*back\W*$/i

/** The spoken side of the on-screen check-in (#64): what to ask, and what an answer does to the form. */
export class VoiceCheckIn {
  constructor(private readonly interpreter: VoiceInterpreter) {}

  question(form: CheckInForm): string {
    const { index, prefilled } = form.current()
    const step = CHECK_IN_STEPS[index]
    return step.kind === 'number' && prefilled ? step.spokenPrefilled : step.spoken
  }

  /** `current` says the heard answer still belongs to the step on screen; false drops it after the model's reply. */
  async apply(form: CheckInForm, heard: string, current: () => boolean): Promise<Turn> {
    const step = CHECK_IN_STEPS[form.current().index]
    if (/\bcancel\b/i.test(heard)) {
      form.cancel()
      return { say: 'Check-in cancelled.' }
    }
    if (/\bskip\b/i.test(heard)) return outcome(await form.skip())
    if (BACK.test(heard)) {
      form.back()
      return { ask: true }
    }

    const answer = await this.interpreter.answer(step, heard)
    if (!current()) return {}
    if (answer.kind === 'value' && step.kind !== 'choices') {
      const value = step.kind === 'number' ? Math.round(answer.value / step.step) * step.step : answer.value
      if (step.kind === 'scale' && !(Number.isInteger(value) && value >= step.min && value <= step.max)) return { say: NOT_VALID }
      form.fill({ kind: 'value', value })
      return outcome(await form.next())
    }
    if (answer.kind === 'symptoms' && step.kind === 'choices') form.fill(answer)
    return this.control(form, step, heard, answer.kind === 'symptoms')
  }

  /** "save" on Symptoms, a keep word elsewhere; anything else is not understood, unless it filled something. */
  private async control(form: CheckInForm, step: CheckInStep, heard: string, filled: boolean): Promise<Turn> {
    const asked = step.kind === 'choices' ? SAVE.test(heard) && !NOT_SAVE.test(heard) : KEEP.test(heard) && !NOT_KEEP.test(heard)
    if (asked) return outcome(await form.next())
    return filled ? {} : { say: SAY_AGAIN }
  }
}

function outcome(result: 'moved' | 'refused' | 'saved' | 'failed'): Turn {
  switch (result) {
    case 'moved':
      return {}
    case 'refused':
      return { say: NOT_VALID }
    case 'saved':
      return { say: 'Check-in saved.', end: true }
    case 'failed':
      return { say: 'Not saved. Try again.' }
  }
}
