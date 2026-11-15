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

function toggled(symptoms: State['symptoms'], id: string | 'none'): State['symptoms'] {
  if (id === 'none') return symptoms === 'none' ? [] : 'none'
  const picked = symptoms === 'none' ? [] : symptoms
  return picked.includes(id) ? picked.filter((s) => s !== id) : [...picked, id]
}

/**
 * The morning check-in at #/check-in: one question per step (mockup 06), then its completion (mockup 09, #40).
 * Nothing is stored until save. `onSaved` refreshes home; Cancel and Done leave through `onExit`.
 */
export function CheckInScreen({ onSaved, onExit }: { onSaved: () => void; onExit: () => void }) {
  const { recorder, streakReader, checkInPrefill } = useServices()
  const [openedAt] = useState(() => streakReader.now())
  const [saved, setSaved] = useState<CheckIn>()
  const [index, setIndex] = useState(0)
  const [state, setState] = useState<State>(EMPTY)
  const [error, setError] = useState<string>()
  const [save, setSave] = useState<'idle' | 'saving' | 'failed'>('idle')
  const promptRef = useRef<HTMLHeadingElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // The step on screen when the prefill resolves, which the mount effect's closure can't see.
  const shownIndex = useRef(0)
  const headingId = useId()
  const promptId = useId()
  const errorId = useId()

  const step = CHECK_IN_STEPS[index]
  const last = index === CHECK_IN_STEPS.length - 1
  const saving = save === 'saving'
  const prefill = prefillShown(step, state)

  useEffect(() => promptRef.current?.focus(), [index])

  // Read once: readings stored later never change a field, and a failed read leaves every step empty, silently.
  useEffect(() => {
    let live = true
    checkInPrefill.read(openedAt).then(
      (read) => {
        const from = shownIndex.current
        if (live) setState((s) => withPrefill(s, read, from))
      },
      () => {},
    )
    return () => {
      live = false
    }
  }, [checkInPrefill, openedAt])

  function go(to: number) {
    shownIndex.current = to
    setError(undefined)
    setSave('idle')
    setIndex(to)
  }

  async function finish(final: State) {
    setSave('saving')
    let checkIn: CheckIn
    try {
      checkIn = await recorder.record(toDraft(answersOf(final)))
    } catch {
      setSave('failed')
      return
    }
    setSaved(checkIn)
    onSaved()
  }

  function advance(final: State) {
    if (last) void finish(final)
    else go(index + 1)
  }

  function onNext(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    if (step.kind === 'number') {
      const result = checkNumber(step, state.raw[step.field] ?? '', inputRef.current?.validity.badInput ?? false)
      if ('error' in result) {
        setError(result.error)
        inputRef.current?.focus()
        return
      }
    }
    advance(state)
  }

  function onSkip() {
    const next = without(step, state)
    setState(next)
    advance(next)
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
              onChange={(raw) => setState({ ...state, raw: { ...state.raw, [step.field]: raw } })}
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
              onPick={(n) => setState({ ...state, picks: { ...state.picks, [step.field]: n } })}
            />
          )}
          {step.kind === 'choices' && (
            <Choices
              step={step}
              symptoms={state.symptoms}
              disabled={saving}
              labelledBy={promptId}
              onToggle={(id) => setState({ ...state, symptoms: toggled(state.symptoms, id) })}
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
