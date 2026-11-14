import { useId, type ReactNode } from 'react'
import { formatDay } from '../application/formatAge'
import type { DayKind, RoutineStreak, StreakDay } from '../domain/streak'
import { PausedIcon, SymptomIcon } from './icons'
import type { PeriodicState } from './usePeriodicRead'

const STATE: Record<DayKind, string> = {
  done: 'check-in done',
  reported: 'check-in done, symptom reported',
  paused: 'paused',
  missed: 'no check-in',
}

const MARK: Record<DayKind, ReactNode> = {
  done: '✓',
  reported: (
    <>
      ✓<SymptomIcon size={18} />
    </>
  ),
  paused: <PausedIcon size={18} />,
  missed: '—',
}

/** The routine streak under the check-in completion (mockup 09): counts the process, never values. */
export function RoutineStreakCard({ state }: { state: PeriodicState<RoutineStreak> }) {
  const headingId = useId()
  return (
    <section className="card streak" aria-labelledby={headingId}>
      <h2 id={headingId} className="card-heading">
        Your routine streak
      </h2>
      {state.kind === 'unavailable' && <p className="muted">Streak unavailable</p>}
      {state.kind === 'ready' && <StreakBody streak={state.data} />}
    </section>
  )
}

function StreakBody({ streak }: { streak: RoutineStreak }) {
  const { count, days, seededBefore, counters } = streak
  return (
    <>
      <p className="muted">Counts what you do, never your values. No comparison with your crewmates.</p>
      <p className="streak__count">
        <b className="num">{count}</b>
        <span>{`${count === 1 ? 'check-in' : 'check-ins'} in a row · last ${days.length} days below`}</span>
      </p>
      <ol className="days" aria-label={`Last ${days.length} days`}>
        {days.map((day, i) => (
          <Day key={day.date} day={day} today={i === days.length - 1} />
        ))}
      </ol>
      <p className="legend">
        <span>✓ check-in done</span>
        <span>
          <SymptomIcon size={18} /> symptom reported (counts as done)
        </span>
        <span>
          <PausedIcon size={18} /> sick or rest day: paused, never reset
        </span>
        <span>— no check-in</span>
      </p>
      {seededBefore && (
        <p className="seed-note">
          <span className="tag">synthetic</span> Days before {formatDay(seededBefore)} are a pre-loaded demo history.
        </p>
      )}
      <ul className="counters" aria-label="Process counters">
        {counters.map((c) => (
          <li key={c.label}>
            <span>{c.label}</span>
            <span className="counters__value num">{c.value}</span>
            <span>
              <span className="muted">{c.detail}</span>
              {c.source && (
                <>
                  {' '}
                  <span className="tag">{c.source}</span>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
      <p className="streak__never muted">
        Never shown here: heart rate, SpO₂, sleep hours, mood or any health value. Nothing is scored as good or bad.
      </p>
    </>
  )
}

function Day({ day, today }: { day: StreakDay; today: boolean }) {
  return (
    <li className={today ? 'day day--today' : 'day'} aria-current={today ? 'date' : undefined}>
      <span className="day__mark" aria-hidden="true">
        {MARK[day.kind]}
      </span>
      <span className="day__date num" aria-hidden="true">
        {Number(day.date.slice(8))}
      </span>
      <span className="visually-hidden">{`${formatDay(day.date)}: ${STATE[day.kind]}${day.synthetic ? ', synthetic' : ''}`}</span>
    </li>
  )
}
