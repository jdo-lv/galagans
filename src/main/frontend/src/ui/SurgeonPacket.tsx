import { useEffect, useId, useRef, type ReactNode } from 'react'
import { formatAge, formatDelay, formatStaleAge } from '../application/formatAge'
import { ONE_WAY_DELAY_MS, type PacketItem } from '../domain/packet'
import { PrivateIcon } from './icons'
import './packet.css'
import { useServices } from './ServicesContext'
import { Badge } from './SystemStatusList'
import { usePeriodicRead, type PeriodicState } from './usePeriodicRead'

function Card({ title, children }: { title: ReactNode; children: ReactNode }) {
  const id = useId()
  return (
    <section className="card" aria-labelledby={id}>
      <h3 id={id} className="card-heading">
        {title}
      </h3>
      {children}
    </section>
  )
}

function Dash({ meaning }: { meaning: string }) {
  return (
    <>
      <span aria-hidden="true">—</span>
      <span className="visually-hidden">{meaning}</span>
    </>
  )
}

// Urgency is the badge; who acts is a separate neutral pill (ui-guidelines §5 "Status badge").
function ItemStatus({ item }: { item: PacketItem }) {
  switch (item.state) {
    case 'unrated':
      return <Dash meaning="Not rated" />
    case 'synthetic':
      return <Dash meaning="No status" />
    case 'caution':
    case 'warning':
      return (
        <div className="packet-status">
          <Badge state={item.state} />
          <span className="tag tag--rule">{`rule · ${item.ruleId}`}</span>
          <span className="pill packet-tier">{item.tier}</span>
        </div>
      )
    default:
      return <Badge state={item.state} />
  }
}

function ItemValue({ item, now }: { item: PacketItem; now: Date }) {
  const shown = item.value !== undefined ? String(item.value) : item.text
  if (shown === undefined) return <Dash meaning="No reading" />
  const age = item.recordedAt && (item.state === 'stale' ? formatStaleAge(item.recordedAt, now) : formatAge(item.recordedAt, now))
  return (
    <>
      <span className="num">{shown}</span> {item.unit}
      {age && <span className="muted">{` · ${age}`}</span>}
    </>
  )
}

function PacketContents({ state }: { state: PeriodicState<PacketItem[]> }) {
  return (
    <Card title="Next packet · contents">
      {state.kind === 'unavailable' && <p className="muted">Packet contents unavailable</p>}
      {state.kind === 'ready' && (
        <table className="packet-table">
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Status</th>
              <th scope="col">Value</th>
              <th scope="col">Source</th>
            </tr>
          </thead>
          <tbody>
            {state.data.map((item) => (
              <tr key={item.key}>
                <th scope="row">{item.label}</th>
                <td>
                  <ItemStatus item={item} />
                </td>
                <td>
                  <ItemValue item={item} now={state.now} />
                </td>
                <td>{item.source && <span className="tag">{item.source}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}

/** The surgeon packet screen (F14, issue #19): the live draft, a crew note, inline send and the last packet's timeline. */
export function SurgeonPacket() {
  const { packetDraftReader } = useServices()
  const draft = usePeriodicRead(packetDraftReader)
  const headingId = useId()
  const heading = useRef<HTMLHeadingElement>(null)
  const contentsReady = draft.state.kind === 'ready'

  // Once per opening, so a re-read never steals focus.
  useEffect(() => heading.current?.focus(), [])

  return (
    <section className="packet stack" aria-labelledby={headingId}>
      <a href="#/" className="packet-home">
        ← Home
      </a>
      <div className="packet-head">
        <h2 id={headingId} ref={heading} tabIndex={-1} className="section-heading">
          Surgeon packet
        </h2>
        <p className="muted packet-privacy">
          <PrivateIcon size={18} />
          <span>{`Shared with flight medicine only · Mars transit, one-way delay ${formatDelay(ONE_WAY_DELAY_MS)} (demo value)`}</span>
        </p>
      </div>
      <div className="layout">
        <div className="stack">
          <PacketContents state={draft.state} />
        </div>
        <div className="stack">
          <div className="packet-actions">
            <button type="button" className="button-primary" disabled={!contentsReady}>
              Send packet
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
