import { useId } from 'react'
import { formatAge, formatStaleAge } from '../application/formatAge'
import type { SystemStatus } from '../domain/rules'
import './status.css'
import type { StatusListState } from './useSystemStatuses'

function Octagon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
      <polygon points="7,1 17,1 23,7 23,17 17,23 7,23 1,17 1,7" fill="currentColor" />
    </svg>
  )
}

function Badge({ state }: { state: SystemStatus['state'] }) {
  switch (state) {
    case 'no-data':
      return <span className="badge badge--quiet">No data</span>
    case 'stale':
      return <span className="badge badge--quiet">No recent data</span>
    case 'nominal':
      return <span className="badge badge--nominal">✓ Nominal</span>
    case 'caution':
      return <span className="badge badge--caution">▲ CAUTION</span>
    case 'warning':
      return (
        <span className="badge badge--warning">
          <Octagon />
          <span>WARNING</span>
        </span>
      )
  }
}

// Routing is a neutral pill and the rule id a tag (ui-guidelines §5); urgency stays on the badge.
const CHIP_CLASS: Partial<Record<string, string>> = { 'Who to involve': 'pill', Rule: 'tag' }

function StatusRow({ status, now }: { status: SystemStatus; now: Date }) {
  const { state, rule, recordedAt } = status
  const age = recordedAt && (state === 'stale' ? formatStaleAge(recordedAt, now) : formatAge(recordedAt, now))
  return (
    <li className={`status-${state}`}>
      <div className="status-head">
        <div>
          <div className="status-system">{status.system}</div>
          {status.value !== undefined && (
            <div className="status-sub">
              <span>
                {status.label} <span className="num">{status.value}</span> {status.unit}
              </span>
              {' · '}
              <span>{`${age} · ${status.source}`}</span>
            </div>
          )}
        </div>
        <Badge state={state} />
      </div>
      {rule && (
        <dl className="status-explanation">
          {(
            [
              ['What', rule.what],
              ['Why it matters', rule.why],
              ['How decided', rule.howDecided],
              ['What next', rule.next],
              ['Who to involve', rule.tier],
              ['Rule', rule.id],
            ] as const
          ).map(([term, text]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{CHIP_CLASS[term] ? <span className={CHIP_CLASS[term]}>{text}</span> : text}</dd>
            </div>
          ))}
        </dl>
      )}
    </li>
  )
}

export function SystemStatusList({ state }: { state: StatusListState }) {
  const headingId = useId()
  return (
    <section className="card" aria-labelledby={headingId}>
      <h2 id={headingId} className="card-heading">
        Body systems
      </h2>
      {state.kind === 'unavailable' && <p className="status-unavailable">Status unavailable</p>}
      {state.kind === 'ready' && (
        <ul className="status-list">
          {state.statuses.map((status) => (
            <StatusRow key={status.system} status={status} now={state.now} />
          ))}
        </ul>
      )}
    </section>
  )
}
