import { useEffect, useId, useRef, useState } from 'react'
import { newId as generateId } from '../application/newId'
import type { LinkState } from '../infrastructure/DeviceLink'
import { ThemeToggle } from '../ui/theme/ThemeToggle'
import type { Publisher } from './Publisher'
import { startRepeating } from './repeat'
import { deviceMessage, isValidInput, SIM_DEVICES, type SimDevice, type SimField } from './simDevices'

const DEFAULT_EVERY_S = '60'
const EVERY_MIN_S = 1
const EVERY_MAX_S = 3600

interface Props {
  publisher: Publisher
  now?: () => Date
  newId?: () => string
}

const inputOk = (input: string, simField: SimField) =>
  simField.field.required ? isValidInput(input, simField) : input === '' || isValidInput(input, simField)

const everyOk = (input: string) => /^\d+$/.test(input) && Number(input) >= EVERY_MIN_S && Number(input) <= EVERY_MAX_S

const clock = (at: Date) => at.toISOString().slice(11, 19)

export function SimulatorApp({ publisher, now = () => new Date(), newId = generateId }: Props) {
  const [linkState, setLinkState] = useState<LinkState>('disconnected')
  const linkStateRef = useRef(linkState)

  useEffect(
    () =>
      publisher.onState((state) => {
        linkStateRef.current = state
        setLinkState(state)
      }),
    [publisher],
  )

  /** Publishes one reading now; returns the device's new status line. */
  function send(sim: SimDevice, inputs: Record<string, string>): string {
    const at = now()
    const reading = Object.fromEntries(sim.fields.map(({ field }) => [field.key, inputs[field.key] ? Number(inputs[field.key]) : undefined]))
    const sent = publisher.publish(sim.device.topic, deviceMessage(sim, reading, at, newId))
    return sent ? `Last sent ${clock(at)}` : `Not sent · device link ${linkStateRef.current} ${clock(at)}`
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
        {SIM_DEVICES.map((sim) => (
          <DeviceSection key={sim.device.id} sim={sim} send={send} now={now} />
        ))}
      </div>
    </div>
  )
}

interface DeviceSectionProps {
  sim: SimDevice
  send: (sim: SimDevice, inputs: Record<string, string>) => string
  now: () => Date
}

function DeviceSection({ sim, send, now }: DeviceSectionProps) {
  const id = useId()
  const [inputs, setInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(sim.fields.map(({ field, nominal }) => [field.key, String(nominal)])),
  )
  const [every, setEvery] = useState(DEFAULT_EVERY_S)
  const [running, setRunning] = useState<string | null>(null)
  const [status, setStatus] = useState('Not sent yet')
  const inputsRef = useRef(inputs)
  const stopRef = useRef<(() => void) | null>(null)

  // The timer starts on Start, not in an effect, so StrictMode's double effects can't send twice.
  useEffect(() => () => stopRef.current?.(), [])

  const valuesOk = (values: Record<string, string>) => sim.fields.every((f) => inputOk(values[f.field.key] ?? '', f))
  const canSend = valuesOk(inputs)

  function tick() {
    // Values edited while running go out on the next tick; a value made invalid skips it.
    if (!valuesOk(inputsRef.current)) {
      setStatus(`Not sent · check the values ${clock(now())}`)
      return
    }
    setStatus(send(sim, inputsRef.current))
  }

  function start() {
    stopRef.current = startRepeating(tick, Number(every) * 1000)
    setRunning(every)
  }

  function stop() {
    stopRef.current?.()
    stopRef.current = null
    setRunning(null)
  }

  function change(key: string, value: string) {
    const next = { ...inputsRef.current, [key]: value }
    inputsRef.current = next
    setInputs(next)
  }

  return (
    <section className="card sim-device" aria-labelledby={id}>
      <div className="sim-device__top">
        <h2 id={id}>{sim.name}</h2>
        {running && <span className="tag">{`sending every ${running} s`}</span>}
      </div>
      <p className="muted">
        <span className="num">{sim.device.topic}</span> · source: synthetic
      </p>
      <div className="sim-metrics">
        {sim.fields.map(({ field, label, decimals }) => (
          <label key={field.key} className="field-tile">
            <span className="tile-label">
              {label} <span className="tile-label__suffix">{field.unit}</span>
            </span>
            <input
              type="text"
              inputMode={decimals > 0 ? 'decimal' : 'numeric'}
              value={inputs[field.key]}
              onChange={(event) => change(field.key, event.target.value)}
            />
          </label>
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
          <button type="button" className="button-secondary" disabled={!canSend || !everyOk(every)} onClick={start}>
            Start
          </button>
        )}
        <button type="button" className="button-secondary sim-send__now" disabled={!canSend} onClick={() => setStatus(send(sim, inputs))}>
          Send now
        </button>
      </div>
      <p className="muted" role="status">
        {status}
      </p>
    </section>
  )
}
