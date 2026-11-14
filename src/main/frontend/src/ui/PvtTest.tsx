import { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  endTrial,
  FALSE_START_MS,
  nextIntervalMs,
  PVT_DURATION_MS,
  scorePvt,
  type PvtResult,
  type PvtScore,
  type PvtTrial,
} from '../application/pvt'
import { useServices } from './ServicesContext'
import './pvt.css'

const TICK_MS = 10

type Phase = 'ready' | 'running' | 'background' | 'result'
type Save = 'saving' | 'saved' | 'failed'

const goHome = () => (window.location.hash = '#/')
const timeLeft = (remainingMs: number) => {
  const s = Math.ceil(Math.max(remainingMs, 0) / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} left`
}

function ScoreRows({ score }: { score: PvtScore }) {
  return (
    <dl className="pvt-result">
      <dt>Median reaction time</dt>
      <dd>
        <span className="num">{score.medianMs}</span> ms
      </dd>
      <dt>Lapses (≥ 355 ms)</dt>
      <dd className="num">{score.lapses}</dd>
      <dt>False starts</dt>
      <dd className="num">{score.falseStarts}</dd>
      <dt>Responses</dt>
      <dd className="num">{score.responses}</dd>
    </dl>
  )
}

function HomeLink() {
  return (
    <a href="#/" className="pvt-home">
      ← Home
    </a>
  )
}

function Result({ result, save, onRetry, onRestart }: { result: PvtResult; save?: Save; onRetry: () => void; onRestart: () => void }) {
  const headingId = useId()
  return (
    <section className="card stack" aria-labelledby={headingId}>
      <h2 id={headingId} className="card-heading">
        Reaction test result
      </h2>
      {result.kind !== 'none' && <ScoreRows score={result.score} />}
      {result.kind === 'none' && <p>No valid responses. Nothing was saved.</p>}
      {result.kind === 'out-of-range' && <p>Median over 10 000 ms: looks like a broken session. Nothing was saved.</p>}
      {result.kind === 'ok' && save === 'saved' && <p className="muted">Saved on this device · in-app test</p>}
      {result.kind === 'ok' && save === 'failed' && <p>Couldn't save the result on this device.</p>}
      {result.kind === 'ok' && save === 'failed' && (
        <button type="button" className="button-primary" onClick={onRetry}>
          Try again
        </button>
      )}
      {result.kind === 'ok' && (
        <button type="button" className={save === 'failed' ? 'button-secondary' : 'button-primary'} onClick={goHome}>
          Back to Home
        </button>
      )}
      {result.kind !== 'ok' && (
        <>
          <button type="button" className="button-primary" onClick={onRestart}>
            Start test
          </button>
          <HomeLink />
        </>
      )}
    </section>
  )
}

/** The 3-minute PVT-B (F7). Rules and numbers live in application/pvt.ts; this only times and renders. */
export function PvtTest({ onSaved }: { onSaved: () => void }) {
  const { recorder, random } = useServices()
  const headingId = useId()
  const [phase, setPhase] = useState<Phase>('ready')
  const [display, setDisplay] = useState('')
  const [remaining, setRemaining] = useState(PVT_DURATION_MS)
  const [result, setResult] = useState<PvtResult>()
  const [save, setSave] = useState<Save>()

  const run = useRef({ startAt: 0, stimulusAt: undefined as number | undefined, trials: [] as PvtTrial[], timers: [] as number[] })
  const wait = useRef<number>(undefined)

  const stopTimers = useCallback(() => {
    run.current.timers.forEach((id) => (clearTimeout(id), clearInterval(id)))
    clearTimeout(wait.current)
    run.current.timers = []
  }, [])

  const saveScore = useCallback(
    async (score: PvtScore) => {
      setSave('saving')
      try {
        await recorder.record({ pvtMedianMs: score.medianMs, pvtLapses: score.lapses, pvtFalseStarts: score.falseStarts, symptoms: [] })
        setSave('saved')
        onSaved()
      } catch {
        setSave('failed')
      }
    },
    [recorder, onSaved],
  )

  const scheduleStimulus = useCallback(() => {
    clearTimeout(wait.current)
    wait.current = window.setTimeout(() => {
      run.current.stimulusAt = performance.now()
      setDisplay('0')
    }, nextIntervalMs(random()))
  }, [random])

  const finish = useCallback(() => {
    stopTimers()
    const end = endTrial(run.current.stimulusAt, run.current.startAt + PVT_DURATION_MS)
    const scored = scorePvt(end ? [...run.current.trials, end] : run.current.trials)
    setResult(scored)
    setPhase('result')
    if (scored.kind === 'ok') void saveScore(scored.score)
  }, [stopTimers, saveScore])

  const start = useCallback(() => {
    stopTimers()
    run.current = { startAt: performance.now(), stimulusAt: undefined, trials: [], timers: [] }
    setDisplay('')
    setRemaining(PVT_DURATION_MS)
    setResult(undefined)
    setSave(undefined)
    setPhase('running')
    scheduleStimulus()
    run.current.timers.push(
      window.setInterval(() => {
        const now = performance.now()
        setRemaining(run.current.startAt + PVT_DURATION_MS - now)
        if (run.current.stimulusAt !== undefined) setDisplay(String(Math.floor(now - run.current.stimulusAt)))
      }, TICK_MS),
      window.setTimeout(finish, PVT_DURATION_MS),
    )
  }, [stopTimers, scheduleStimulus, finish])

  const respond = useCallback(() => {
    const { stimulusAt } = run.current
    if (stimulusAt === undefined) {
      run.current.trials.push({ falseStart: true })
      setDisplay('Too early')
    } else {
      const rtMs = Math.round(performance.now() - stimulusAt)
      run.current.trials.push({ rtMs })
      run.current.stimulusAt = undefined
      setDisplay(rtMs < FALSE_START_MS ? 'Too early' : String(rtMs))
    }
    scheduleStimulus()
  }, [scheduleStimulus])

  useEffect(() => {
    if (phase !== 'running') return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== ' ') return
      event.preventDefault()
      if (!event.repeat) respond()
    }
    // Hidden tabs throttle timers, so the times would be wrong.
    const onVisibility = () => {
      if (document.visibilityState !== 'hidden') return
      stopTimers()
      setPhase('background')
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [phase, respond, stopTimers])

  useEffect(() => stopTimers, [stopTimers])

  if (phase === 'result' && result) return <Result result={result} save={save} onRetry={() => result.kind === 'ok' && void saveScore(result.score)} onRestart={start} />

  return (
    <section className="card stack pvt" aria-labelledby={headingId}>
      <div className="pvt-head">
        <h2 id={headingId} className="card-heading">
          Reaction test
        </h2>
        {phase === 'running' && <span className="num">{timeLeft(remaining)}</span>}
      </div>
      {phase === 'running' ? (
        <>
          <button type="button" className="pvt-target" aria-label="Respond" onPointerDown={respond}>
            <span className="value">{display}</span>
          </button>
          <p className="muted">Tap the box or press Space as soon as the counter appears.</p>
          <button type="button" className="button-secondary" onClick={goHome}>
            Stop
          </button>
        </>
      ) : (
        <>
          {phase === 'background' && <p>Test stopped: the app went to the background. Nothing was saved.</p>}
          <p>Tap the box or press Space as soon as the counter appears. Don't tap before it does.</p>
          <p className="muted">Use the same device each time: its screen delay changes your time.</p>
          <button type="button" className="button-primary" onClick={start}>
            Start test
          </button>
          <HomeLink />
        </>
      )}
    </section>
  )
}
