import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { formatAge, formatDelay, formatStaleAge, formatTime } from '../application/formatAge'
import { NOTE_MAX, ONE_WAY_DELAY_MS, type PacketItem } from '../domain/packet'
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

type SendPhase = { kind: 'idle' } | { kind: 'confirm' | 'saving'; label: string }

// Consequential action, so an inline confirm (ui-guidelines §5 "Buttons"). The note lives here only: leaving drops it.
function NoteAndSend({ contentsReady, onSent }: { contentsReady: boolean; onSent: () => void }) {
  const { packetSender, connectivity } = useServices()
  const [note, setNote] = useState('')
  const [phase, setPhase] = useState<SendPhase>({ kind: 'idle' })
  const [failed, setFailed] = useState(false)
  const saving = useRef(false)
  const moveFocus = useRef(false)
  const sendButton = useRef<HTMLButtonElement>(null)
  const confirmButton = useRef<HTMLButtonElement>(null)
  const headingId = useId()
  const noteId = useId()
  const counterId = useId()

  // The button that replaces the one just pressed takes the focus.
  useEffect(() => {
    if (!moveFocus.current) return
    moveFocus.current = false
    ;(phase.kind === 'idle' ? sendButton : confirmButton).current?.focus()
  }, [phase.kind])

  const show = (next: SendPhase) => {
    moveFocus.current = true
    setPhase(next)
  }

  const askConfirm = () => {
    setFailed(false)
    // Fixed now: the estimate doesn't move with the clock or the link during the confirm step.
    const arrival = new Date(packetSender.now().getTime() + ONE_WAY_DELAY_MS).toISOString()
    show({ kind: 'confirm', label: connectivity.isOnline() ? `Confirm send · arrives ~${formatTime(arrival)}` : 'Confirm send · waits for ground link' })
  }

  const confirm = async (label: string) => {
    if (saving.current) return
    saving.current = true
    setPhase({ kind: 'saving', label })
    try {
      await packetSender.send(note)
      setNote('')
      onSent()
    } catch {
      setFailed(true)
    } finally {
      saving.current = false
      show({ kind: 'idle' })
    }
  }

  return (
    <>
      <section className="card" aria-labelledby={headingId}>
        <h3 id={headingId} className="card-heading">
          <label htmlFor={noteId}>Crew note (optional)</label>
        </h3>
        <textarea
          id={noteId}
          className="packet-note"
          maxLength={NOTE_MAX}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          aria-describedby={counterId}
        />
        <p id={counterId} className="muted num packet-counter">{`${note.length} / ${NOTE_MAX}`}</p>
      </section>
      <div className="packet-actions">
        {phase.kind === 'idle' ? (
          <button ref={sendButton} type="button" className="button-primary" disabled={!contentsReady} onClick={askConfirm}>
            Send packet
          </button>
        ) : (
          <>
            <button
              ref={confirmButton}
              type="button"
              className="button-primary"
              disabled={phase.kind === 'saving' || !contentsReady}
              onClick={() => void confirm(phase.label)}
            >
              {phase.label}
            </button>
            <button type="button" className="button-secondary" disabled={phase.kind === 'saving'} onClick={() => show({ kind: 'idle' })}>
              Cancel
            </button>
          </>
        )}
      </div>
      {failed && (
        <p role="alert" className="packet-alert">
          Packet not saved. Try again.
        </p>
      )}
    </>
  )
}

/** The surgeon packet screen (F14, issue #19): the live draft, a crew note, inline send and the last packet's timeline. */
export function SurgeonPacket() {
  const { packetDraftReader } = useServices()
  const draft = usePeriodicRead(packetDraftReader)
  const headingId = useId()
  const heading = useRef<HTMLHeadingElement>(null)

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
          <NoteAndSend contentsReady={draft.state.kind === 'ready'} onSent={() => {}} />
        </div>
      </div>
    </section>
  )
}
