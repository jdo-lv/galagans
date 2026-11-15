import { useEffect, useId, useRef, useState, type FormEvent, type RefObject } from 'react'
import type { Prefill } from '../application/CheckInPrefill'
import { formatAge } from '../application/formatAge'
import {
  CHECK_IN_STEPS,
  checkNumber,
  PREFILL_HINT,
  secondsLeft,
  SYMPTOMS,
  toDraft,
  type Answers,
  type CheckInStep,
  type ChoicesStep,
  type NumberStep,
  type ScaleStep,
} from '../domain/checkInSteps'
import type { CheckIn } from '../domain/checkIn'
import type { CheckInForm } from '../domain/ports'
import type { StepAnswer } from '../domain/voice'
import { CheckInComplete } from './CheckInComplete'
import { InfoIcon } from './icons'
import { READING_ICONS } from './readingIcons'
import { useServices } from './ServicesContext'
import './checkin.css'

/** Raw text for number steps (Back shows what was typed), picks for scales, symptom ids or "none", and the device values the prefill filled in. */
type State = {
  raw: Partial<Record<NumberStep['field'], string>>
  picks: Partial<Record<ScaleStep['field'], number>>
  symptoms: string[] | 'none'
  prefilled: Prefill
}

const EMPTY: State = { raw: {}, picks: {}, symptoms: [], prefilled: {} }

/** Fills the untouched number steps from step `from` on; a step already passed stays as it was shown. */
function withPrefill(state: State, prefill: Prefill, from: number): State {
  const raw = { ...state.raw }
  const prefilled: Prefill = {}
  for (const step of CHECK_IN_STEPS.slice(from)) {
    if (step.kind !== 'number' || state.raw[step.field] !== undefined) continue
    const reading = prefill[step.field]
    if (!reading) continue
    raw[step.field] = String(reading.value)
    prefilled[step.field] = reading
  }
  return { ...state, raw, prefilled }
}

/** The device reading behind a number step, while its text is still the prefilled value. */
function prefillShown(step: CheckInStep, state: State) {
  if (step.kind !== 'number') return undefined
  const reading = state.prefilled[step.field]
  return reading && state.raw[step.field] === String(reading.value) ? reading : undefined
}

function isAnswered(step: CheckInStep, state: State): boolean {
  if (step.kind === 'number') return (state.raw[step.field] ?? '') !== ''
  if (step.kind === 'scale') return state.picks[step.field] !== undefined
  return state.symptoms === 'none' || state.symptoms.length > 0
}

function without(step: CheckInStep, state: State): State {
  if (step.kind === 'number') return { ...state, raw: { ...state.raw, [step.field]: '' } }
  if (step.kind === 'scale') return { ...state, picks: { ...state.picks, [step.field]: undefined } }
  return { ...state, symptoms: [] }
}

function answersOf(state: State): Answers {
  const answers: Answers = { symptoms: state.symptoms }
  for (const step of CHECK_IN_STEPS) {
    if (step.kind === 'number') {
      const result = checkNumber(step, state.raw[step.field] ?? '', false)
      if ('value' in result && result.value !== undefined) answers[step.field] = result.value
    } else if (step.kind === 'scale' && state.picks[step.field] !== undefined) {
      answers[step.field] = state.picks[step.field]
    }
  }
  return answers
}

/** The ids not yet picked are added; "None of these" gives way to a symptom. */
function added(symptoms: State['symptoms'], ids: string[]): string[] {
  const picked = symptoms === 'none' ? [] : symptoms
  return [...picked, ...ids.filter((id) => !picked.includes(id))]
}

const LAST = CHECK_IN_STEPS.length - 1

function toggled(symptoms: State['symptoms'], id: string | 'none'): State['symptoms'] {
  if (id === 'none') return symptoms === 'none' ? [] : 'none'
  const picked = symptoms === 'none' ? [] : symptoms
  return picked.includes(id) ? picked.filter((s) => s !== id) : [...picked, id]
}

/**
 * The morning check-in at #/check-in: one question per step (mockup 06), then its completion (mockup 09, #40).
 * Nothing is stored until save. `onSaved` refreshes home; Cancel and Done leave through `onExit`.
 * While a question shows, `registerForm` gives voice (#64) the same moves as the buttons; `onTouchSaved` follows a save by tap.
 */
export function CheckInScreen({
  onSaved,
  onExit,
  onTouchSaved,
  registerForm,
}: {
  onSaved: () => void
  onExit: () => void
  onTouchSaved: () => void
  registerForm: (form: CheckInForm | undefined) => void
}) {
  const { recorder, streakReader, checkInPrefill } = useServices()
  const [openedAt] = useState(() => streakReader.now())
  const [saved, setSaved] = useState<CheckIn>()
  const [index, setIndex] = useState(0)
  const [state, setState] = useState<State>(EMPTY)
  const [error, setError] = useState<string>()
  const [save, setSave] = useState<'idle' | 'saving' | 'failed'>('idle')
  const promptRef = useRef<HTMLHeadingElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // What is on screen right now, which voice reads between renders (and which the prefill effect's closure can't see).
  const shown = useRef({ index: 0, state: EMPTY, saving: false })
  const [prefillSettled] = useState(() => {
    let settle = () => {}
    return { promise: new Promise<void>((resolve) => (settle = resolve)), settle: () => settle() }
  })
  const headingId = useId()
  const promptId = useId()
  const errorId = useId()

  const step = CHECK_IN_STEPS[index]
  const last = index === LAST
  const saving = save === 'saving'
  const prefill = prefillShown(step, state)

  useEffect(() => promptRef.current?.focus(), [index])

  // Read once: readings stored later never change a field, and a failed read leaves every step empty, silently.
  useEffect(() => {
    let live = true
    checkInPrefill.read(openedAt).then(
      (read) => {
        if (live) update(withPrefill(shown.current.state, read, shown.current.index))
        prefillSettled.settle()
      },
      prefillSettled.settle,
    )
    return () => {
      live = false
    }
  }, [checkInPrefill, openedAt])

  function update(next: State) {
    shown.current.state = next
    setState(next)
  }

  function go(to: number) {
    shown.current.index = to
    setError(undefined)
    setSave('idle')
    setIndex(to)
  }

  async function finish(final: State): Promise<'saved' | 'failed'> {
    shown.current.saving = true
    setSave('saving')
    let checkIn: CheckIn
    try {
      checkIn = await recorder.record(toDraft(answersOf(final)))
    } catch {
      shown.current.saving = false
      setSave('failed')
      return 'failed'
    }
    setSaved(checkIn)
    onSaved()
    return 'saved'
  }

  async function advance(final: State): Promise<'moved' | 'saved' | 'failed'> {
    if (shown.current.index === LAST) return finish(final)
    go(shown.current.index + 1)
    return 'moved'
  }

  /** Next →, or "Save check-in" on the last step. */
  async function submit(): Promise<'moved' | 'refused' | 'saved' | 'failed'> {
    const { index: at, state: now, saving: busy } = shown.current
    if (busy) return 'failed'
    const row = CHECK_IN_STEPS[at]
    if (row.kind === 'number') {
      const result = checkNumber(row, now.raw[row.field] ?? '', inputRef.current?.validity.badInput ?? false)
      if ('error' in result) {
        setError(result.error)
        inputRef.current?.focus()
        return 'refused'
      }
    }
    return advance(now)
  }

  function skip() {
    const next = without(CHECK_IN_STEPS[shown.current.index], shown.current.state)
    update(next)
    return advance(next)
  }

  function fill(answer: StepAnswer) {
    const { index: at, state: now } = shown.current
    const row = CHECK_IN_STEPS[at]
    if (answer.kind === 'value' && row.kind === 'number') update({ ...now, raw: { ...now.raw, [row.field]: String(answer.value) } })
    else if (answer.kind === 'value' && row.kind === 'scale') update({ ...now, picks: { ...now.picks, [row.field]: answer.value } })
    else if (answer.kind === 'symptoms' && row.kind === 'choices') {
      update({ ...now, symptoms: answer.symptoms === 'none' ? 'none' : added(now.symptoms, answer.symptoms) })
    }
  }

  // One stable object for voice: its methods read the latest closures, so a voice session can hold it across renders.
  const moves = useRef<CheckInForm>(null!)
  useEffect(() => {
    moves.current = {
      current: () => ({ index: shown.current.index, prefilled: prefillShown(CHECK_IN_STEPS[shown.current.index], shown.current.state) !== undefined }),
      prefillSettled: prefillSettled.promise,
      fill,
      next: submit,
      skip: async () => (await skip()) as 'moved' | 'saved' | 'failed',
      back: () => shown.current.index > 0 && go(shown.current.index - 1),
      cancel: () => {
        // Cleared now, not after the next render, so voice never answers a screen that is gone.
        registerForm(undefined)
        onExit()
      },
    }
  })
  const [form] = useState<CheckInForm>(() => ({
    current: () => moves.current.current(),
    prefillSettled: prefillSettled.promise,
    fill: (answer) => moves.current.fill(answer),
    next: () => moves.current.next(),
    skip: () => moves.current.skip(),
    back: () => moves.current.back(),
    cancel: () => moves.current.cancel(),
  }))
  useEffect(() => {
    if (saved) return
    registerForm(form)
    return () => registerForm(undefined)
  }, [saved, form, registerForm])

  async function onNext(event: FormEvent) {
    event.preventDefault()
    if ((await submit()) === 'saved') onTouchSaved()
  }

  async function onSkip() {
    if ((await skip()) === 'saved') onTouchSaved()
  }

  if (saved) return <CheckInComplete checkIn={saved} openedAt={openedAt} onDone={onExit} />

  return (
    <section className="card check-in" aria-labelledby={headingId}>
      <div className="check-in__top">
        <h2 id={headingId} className="card-heading">
          Morning check-in
        </h2>
        <p className="pill">{`about ${secondsLeft(index)} s left`}</p>
      </div>
      <ol className="step-tabs" aria-label="Steps">
        {CHECK_IN_STEPS.map((s, i) => (
          <li key={s.field} aria-current={i === index ? 'step' : undefined}>
            {i < index && isAnswered(s, state) ? `✓ ${s.tab}` : `${i + 1} · ${s.tab}`}
          </li>
        ))}
      </ol>
      {step.kind === 'scale' && step.instrument && <p className="step-instrument muted">{step.instrument}</p>}
      <h3 ref={promptRef} id={promptId} tabIndex={-1} className="step-prompt">
        {step.prompt}
      </h3>
      <p className="step-hint muted">{prefill ? PREFILL_HINT : step.hint}</p>
      <form noValidate onSubmit={onNext}>
        <div className="step-body">
          {step.kind === 'number' && (
            <NumberInput
              key={step.field}
              step={step}
              value={state.raw[step.field] ?? ''}
              device={prefill && { source: prefill.source, age: formatAge(prefill.recordedAt, openedAt) }}
              inputRef={inputRef}
              errorId={error ? errorId : undefined}
              onChange={(raw) => update({ ...state, raw: { ...state.raw, [step.field]: raw } })}
            />
          )}
          {step.kind === 'number' && error && (
            <p className="field-error" id={errorId}>
              <InfoIcon />
              <span>{error}</span>
            </p>
          )}
          {step.kind === 'scale' && (
            <Scale
              step={step}
              picked={state.picks[step.field]}
              disabled={saving}
              labelledBy={promptId}
              onPick={(n) => update({ ...state, picks: { ...state.picks, [step.field]: n } })}
            />
          )}
          {step.kind === 'choices' && (
            <Choices
              step={step}
              symptoms={state.symptoms}
              disabled={saving}
              labelledBy={promptId}
              onToggle={(id) => update({ ...state, symptoms: toggled(state.symptoms, id) })}
            />
          )}
        </div>
        <div className="step-actions">
          <button type="button" className="button-secondary" disabled={saving} onClick={index === 0 ? onExit : () => go(index - 1)}>
            {index === 0 ? 'Cancel' : '← Back'}
          </button>
          <span className="step-actions__note muted">Skip is saved as "not answered", never as a value</span>
          <button type="button" className="button-secondary" disabled={saving} onClick={onSkip}>
            Skip
          </button>
          <button type="submit" className="button-primary" disabled={saving}>
            {last ? 'Save check-in' : 'Next →'}
          </button>
        </div>
        {save === 'failed' && (
          <p role="alert" className="check-in__alert">
            <InfoIcon />
            <span>Not saved. Try again.</span>
          </p>
        )}
      </form>
    </section>
  )
}

function NumberInput({
  step,
  value,
  device,
  inputRef,
  errorId,
  onChange,
}: {
  step: NumberStep
  value: string
  /** The source and age of a prefilled value. */
  device?: { source: string; age: string }
  inputRef: RefObject<HTMLInputElement | null>
  errorId?: string
  onChange: (raw: string) => void
}) {
  const Icon = READING_ICONS[step.name]
  return (
    <label className="field-tile">
      <span className="field-tile__top">
        <input
          ref={inputRef}
          name={step.name}
          type="number"
          inputMode="decimal"
          min={step.min}
          max={step.max}
          step={step.step}
          placeholder="—"
          value={value}
          aria-describedby={errorId}
          onChange={(event) => onChange(event.target.value)}
        />
        {Icon && <Icon />}
      </span>
      <span className="tile-label">
        {step.label} <span className="tile-label__suffix">/ {step.unit}</span>
      </span>
      {device && (
        <span className="field-tile__source">
          <span className="tag">{device.source}</span>
          <span className="tile-label__suffix">{device.age}</span>
        </span>
      )}
    </label>
  )
}

function Scale(props: { step: ScaleStep; picked?: number; disabled: boolean; labelledBy: string; onPick: (n: number) => void }) {
  const { step, picked, disabled, labelledBy, onPick } = props
  const numbers = Array.from({ length: step.max - step.min + 1 }, (_, i) => step.min + i)
  return (
    <ol className="scale" aria-labelledby={labelledBy}>
      {numbers.map((n) => (
        <li key={n}>
          <button type="button" aria-pressed={picked === n} disabled={disabled} onClick={() => onPick(n)}>
            {n}
          </button>
          {step.words[n] && <span>{step.words[n]}</span>}
        </li>
      ))}
    </ol>
  )
}

function Choices(props: { step: ChoicesStep; symptoms: State['symptoms']; disabled: boolean; labelledBy: string; onToggle: (id: string) => void }) {
  const { step, symptoms, disabled, labelledBy, onToggle } = props
  const options = [...SYMPTOMS.map((s) => ({ id: s.id as string, label: s.label as string })), { id: 'none', label: step.noneLabel }]
  const pressed = (id: string) => (id === 'none' ? symptoms === 'none' : symptoms !== 'none' && symptoms.includes(id))
  return (
    <ul className="choices" aria-labelledby={labelledBy}>
      {options.map((o) => (
        <li key={o.id}>
          <button type="button" aria-pressed={pressed(o.id)} disabled={disabled} onClick={() => onToggle(o.id)}>
            {o.label}
          </button>
        </li>
      ))}
    </ul>
  )
}
