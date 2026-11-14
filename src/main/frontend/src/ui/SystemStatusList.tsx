import { useId } from 'react'
import { formatAge, formatStaleAge } from '../application/formatAge'
import type { SystemStatus } from '../domain/rules'
import './status.css'
import type { StatusListState } from './useSystemStatuses'

function Octagon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
      <polygon points="7,1 17,1 23,7 23,17 17,23 7,23 1,17 1,7" fill="currentColor" />
    </svg>
  )
}

function Badge({ state }: { state: SystemStatus['state'] }) {
  switch (state) {
    case 'no-data':
      return <span className="status-badge">No data</span>
    case 'stale':
      return <span className="status-badge">No recent data</span>
    case 'nominal':
      return <span className="status-badge">✓ Nominal</span>
    case 'caution':
      return <span className="status-badge">▲ CAUTION</span>
    case 'warning':
      return (
        <span className="status-badge">
          <Octagon />
          <span>WARNING</span>
        </span>
      )
  }
}

function StatusRow({ status, now }: { status: SystemStatus; now: Date }) {
  const { state, rule, recordedAt } = status
  const age = recordedAt && (state === 'stale' ? formatStaleAge(recordedAt, now) : formatAge(recordedAt, now))
  return (
    <li className={`status-${state}`}>
      <span className="status-system">{status.system}</span>
      <Badge state={state} />
      {status.value !== undefined && <span className="status-reading">{`${status.label} ${status.value} ${status.unit}`}</span>}
      {age && <span className="status-age">{`${age} · ${status.source}`}</span>}
      {rule && (
        <dl className="status-explanation">
          <dt>What</dt>
          <dd>{rule.what}</dd>
          <dt>Why</dt>
          <dd>{rule.why}</dd>
          <dt>How decided</dt>
          <dd>{rule.howDecided}</dd>
          <dt>Next</dt>
          <dd>{rule.next}</dd>
          <dt>Tier</dt>
          <dd>{rule.tier}</dd>
          <dt>Rule</dt>
          <dd>{rule.id}</dd>
        </dl>
      )}
    </li>
  )
}

export function SystemStatusList({ state }: { state: StatusListState }) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>Body systems</h2>
      {state.kind === 'unavailable' && <p>Status unavailable</p>}
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
