import { useEffect, useId, useRef } from 'react'
import { formatAge, formatStaleAge } from '../application/formatAge'
import { lensMark, type Hazard } from '../domain/hazards'
import type { Rule, SystemStatus } from '../domain/rules'
import {
  ChevronIcon,
  LevelCheckIcon,
  LevelEmergencyIcon,
  LevelTreatIcon,
  LevelWatchDownIcon,
  LevelWatchUpIcon,
  TodoIcon,
  type AppIcon,
} from './icons'
import { systemHref } from './useHashRoute'
import './status.css'
import type { StatusListState } from './useSystemStatuses'

export const LEVEL_WORDS: Record<Rule['status'], string> = { watch: 'Watch', check: 'Check', treat: 'Treat', emergency: 'Emergency' }

/** The icon of a level (ideas/alert-levels.md "Icon" column); Watch has one only when its rule gives a direction. */
export function levelIcon(level: SystemStatus['state'], rule?: Rule): AppIcon | undefined {
  switch (level) {
    case 'watch':
      if (rule?.above !== undefined || rule?.atLeast !== undefined) return LevelWatchUpIcon
      return rule?.below !== undefined ? LevelWatchDownIcon : undefined
    case 'check':
      return LevelCheckIcon
    case 'treat':
      return LevelTreatIcon
    case 'emergency':
      return LevelEmergencyIcon
  }
}

export function Badge({ state, rule }: { state: SystemStatus['state']; rule?: Rule }) {
  switch (state) {
    case 'no-data':
      return <span className="badge badge--quiet">No data</span>
    case 'stale':
      return <span className="badge badge--quiet">No recent data</span>
    case 'nominal':
      return <span className="badge badge--nominal">✓ Nominal</span>
  }
  const Icon = levelIcon(state, rule)
  return (
    <span className={`badge badge--${state}`}>
      {Icon && <Icon size={18} />}
      {LEVEL_WORDS[state]}
    </span>
  )
}

/** Level 1 (alert-levels.md): an input the astronaut owes. Not a health status, so no Badge state maps to it. */
export function TodoBadge() {
  return (
    <span className="badge badge--todo">
      <TodoIcon size={18} />
      To do
    </span>
  )
}

function StatusRow({ status, now, lens }: { status: SystemStatus; now: Date; lens: Hazard | null }) {
  const { state, recordedAt } = status
  const mark = lensMark(lens, status.system, state)
  const age = recordedAt && (state === 'stale' ? formatStaleAge(recordedAt, now) : formatAge(recordedAt, now))
  const head = (
    <div className="status-head">
      <div>
        <div className="status-system">{status.system}</div>
        {status.value !== undefined && (
          <div className="status-sub">
            <span>
              {status.label} <span className="num">{status.value}</span> {status.unit}
            </span>
            {' · '}
            <span>{status.source ? `${age} · ${status.source}` : age}</span>
          </div>
        )}
        {status.detail !== undefined && <div className="status-sub">{`${status.detail} · ${status.source}`}</div>}
      </div>
      <Badge state={state} rule={status.rule} />
    </div>
  )
  // Only flagged rows open the detail (F5); quiet rows stay plain.
  return (
    <li className={mark ? `status-${state} lens-${mark}` : `status-${state}`}>
      {status.rule ? (
        <a className="status-link" href={systemHref(status.system)}>
          {head}
          <ChevronIcon className="status-chevron" />
        </a>
      ) : (
        head
      )}
      {mark === 'affected' && <span className="visually-hidden">Affected by {lens?.name}</span>}
    </li>
  )
}

export function SystemStatusList({
  state,
  focusHeading = false,
  lens = null,
}: {
  state: StatusListState
  focusHeading?: boolean
  lens?: Hazard | null
}) {
  const headingId = useId()
  const heading = useRef<HTMLHeadingElement>(null)

  // Coming back from a detail lands on this heading.
  useEffect(() => {
    if (focusHeading) heading.current?.focus()
  }, [focusHeading])
  return (
    <section className="card systems" aria-labelledby={headingId}>
      <h2 id={headingId} ref={heading} tabIndex={-1} className="card-heading">
        Body systems
      </h2>
      {state.kind === 'unavailable' && <p className="status-unavailable">Status unavailable</p>}
      {state.kind === 'ready' && (
        <ul className="status-list">
          {state.data.map((status) => (
            <StatusRow key={status.system} status={status} now={state.now} lens={lens} />
          ))}
        </ul>
      )}
      {state.kind === 'ready' && lens && (
        <p className="muted lens-note">
          {lens.systems === 'all'
            ? 'Lens on: all systems marked. Status is unchanged by the lens.'
            : 'Lens on: affected systems marked, others dimmed. Status is unchanged by the lens.'}
        </p>
      )}
    </section>
  )
}
