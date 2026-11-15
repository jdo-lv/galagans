import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { newId as generateId } from '../application/newId'
import type { DeviceId } from '../domain/devices'
import { deviceMessage, indicatorLevels, levelsFor, randomValues } from '../domain/levelValues'
import type { Rule, Status } from '../domain/rules'
import type { LinkState } from '../infrastructure/DeviceLink'
import { ThemeToggle } from '../ui/theme/ThemeToggle'
import type { Publisher } from './Publisher'
import { startRepeating } from './repeat'
import { SIM_CONFIG, SIM_DEVICES, type SimDevice } from './simDevices'

const EVERY_MIN_S = 1
const EVERY_MAX_S = 3600

const LEVELS: [Status, string][] = [
  ['nominal', 'Nominal'],
  ['watch', 'Watch'],
  ['check', 'Check'],
  ['treat', 'Treat'],
  ['emergency', 'Emergency'],
]
const LEVEL_WORD = Object.fromEntries(LEVELS) as Record<Status, string>

interface Props {
  publisher: Publisher
  rules: Rule[]
  now?: () => Date
  newId?: () => string
  /** In [0, 1); draws the values inside each level's range. */
  random?: () => number
}

/** What one send did: the status line, and the values when the link took the message. */
interface Sent {
  status: string
  values?: Record<string, number>
}

const everyOk = (input: string) => /^\d+$/.test(input) && Number(input) >= EVERY_MIN_S && Number(input) <= EVERY_MAX_S

const clock = (at: Date) => at.toISOString().slice(11, 19)

const initialLevels = () => Object.fromEntries(SIM_DEVICES.map((s) => [s.device.id, SIM_CONFIG[s.device.id].level])) as Record<DeviceId, Status>

export function SimulatorApp({ publisher, rules, now = () => new Date(), newId = generateId, random = Math.random }: Props) {
  const [linkState, setLinkState] = useState<LinkState>('disconnected')
  const linkStateRef = useRef(linkState)
  const [levels, setLevels] = useState(initialLevels)
  const levelsRef = useRef(levels)

  // A layout effect, so the link state is known before the device sections auto-start in their effects.
  useLayoutEffect(
    () =>
      publisher.onState((state) => {
        linkStateRef.current = state
        setLinkState(state)
      }),
    [publisher],
  )

  /** Publishes one message at the current levels of all devices. */
  function send(sim: SimDevice): Sent {
    const at = now()
    const values = randomValues(sim.device, indicatorLevels(levelsRef.current, rules), rules, random)
    const sent = publisher.publish(sim.device.topic, deviceMessage(sim.device, values, at, newId))
    return sent ? { status: `Last sent ${clock(at)}`, values } : { status: `Not sent · device link ${linkStateRef.current} ${clock(at)}` }
  }

  function changeLevel(id: DeviceId, level: Status) {
    const next = { ...levelsRef.current, [id]: level }
    levelsRef.current = next
    setLevels(next)
  }

  return (
    <div className="sim">
      <header className="sim-top">
        <h1>Device Simulator</h1>
        <span className="pill" role="status">
          <span>
            Device link <b className="num">{publisher.url}</b> · {linkState}
          </span>
        </span>
        <span className="pill">All data simulated</span>
        <ThemeToggle storageKey="simulator.theme" />
      </header>

      <div className="sim-devices">
        {SIM_DEVICES.map((sim) => {
          const id = sim.device.id
          return (
            <DeviceSection
              key={id}
              sim={sim}
              level={levels[id]}
              available={levelsFor(sim.device, rules)}
              onLevel={(level) => changeLevel(id, level)}
              send={send}
            />
          )
        })}
      </div>
    </div>
  )
}

interface DeviceSectionProps {
  sim: SimDevice
  level: Status
  /** Levels with a rule row for one of the device's fields. */
  available: Status[]
  onLevel: (level: Status) => void
  send: (sim: SimDevice) => Sent
}

function DeviceSection({ sim, level, available, onLevel, send }: DeviceSectionProps) {
  const id = useId()
  const [every, setEvery] = useState(() => String(SIM_CONFIG[sim.device.id].everyS))
  const [running, setRunning] = useState<string | null>(null)
  const [status, setStatus] = useState('Not sent yet')
  const [values, setValues] = useState<Record<string, number>>()
  const stopRef = useRef<(() => void) | null>(null)
  const sendRef = useRef(send)
  sendRef.current = send

  function tick() {
    const sent = sendRef.current(sim)
    setStatus(sent.status)
    if (sent.values) setValues(sent.values)
  }

  function start(input: string) {
    stopRef.current = startRepeating(tick, Number(input) * 1000)
    setRunning(input)
  }

  function stop() {
    stopRef.current?.()
    stopRef.current = null
    setRunning(null)
  }

  // Sends from page load; in dev StrictMode the remount can send one extra first message.
  useEffect(() => {
    start(String(SIM_CONFIG[sim.device.id].everyS))
    return () => stopRef.current?.()
  }, [])

  return (
    <section className="card sim-device" aria-labelledby={id}>
      <div className="sim-device__top">
        <h2 id={id}>{sim.name}</h2>
        {running && <span className="tag">{`sending every ${running} s · ${LEVEL_WORD[level]}`}</span>}
      </div>
      <p className="muted">
        <span className="num">{sim.device.topic}</span> · source: synthetic
      </p>
      <fieldset className="sim-levels">
        <legend>Level</legend>
        {LEVELS.map(([value, word]) => {
          const enabled = available.includes(value)
          return (
            <button
              key={value}
              type="button"
              aria-pressed={value === level}
              disabled={!enabled}
              title={enabled ? undefined : 'No rule row for this level'}
              onClick={() => onLevel(value)}
            >
              {word}
            </button>
          )
        })}
      </fieldset>
      <div className="sim-metrics">
        {sim.fields.map(({ field, label }) => (
          <div key={field.key} className="field-tile">
            <span className="tile-label">
              {label} <span className="tile-label__suffix">{field.unit}</span>
            </span>
            <span className="value">{values?.[field.key] ?? '—'}</span>
          </div>
        ))}
      </div>
      <div className="sim-send">
        <label className="sim-every">
          Every
          <input type="text" inputMode="numeric" value={every} disabled={running !== null} onChange={(event) => setEvery(event.target.value)} />
          s
        </label>
        {running ? (
          <button type="button" className="button-secondary" onClick={stop}>
            Stop
          </button>
        ) : (
          <button type="button" className="button-secondary" disabled={!everyOk(every)} onClick={() => start(every)}>
            Start
          </button>
        )}
        <button type="button" className="button-secondary sim-send__now" onClick={tick}>
          Send now
        </button>
      </div>
      <p className="muted" role="status">
        {status}
      </p>
    </section>
  )
}
