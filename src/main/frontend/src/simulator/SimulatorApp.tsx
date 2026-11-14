import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { newId as generateId } from '../application/newId'
import { readingSpec } from '../domain/readings'
import type { Indicator } from '../domain/rules'
import type { LinkState } from '../infrastructure/DeviceLink'
import { ThemeToggle } from '../ui/theme/ThemeToggle'
import { startNominalDay } from './nominalDay'
import { oximeterMessage } from './oximeterMessage'
import type { Publisher } from './Publisher'

const TOPIC = 'crew/a1/oximeter'
const NOMINAL_SPO2 = 97
const NOMINAL_PULSE = 63
const LOG_LINES = 50

const NOT_BUILT_DEVICES = [
  ['Wrist bracelet', 'Live HR broadcast · GATT 0x180D · 0x2A37'],
  ['BP cuff', 'GATT 0x1810 · char 0x2A35'],
  ['Thermometer', 'GATT 0x1809 · char 0x2A1C'],
  ['Environment node', 'Wi-Fi · JSON'],
  ['Dosimeter', 'Wi-Fi · JSON'],
]
const NOT_BUILT_SCENARIOS = ['CO₂ build-up', 'Resting HR drift', 'Orthostatic risk', 'Solar particle event', 'Sensor dropout']

/** Whole numbers within the READINGS input limits (the ones #22's gateway validates against). */
function isValid(value: string, indicator: Indicator): boolean {
  if (!/^\d+$/.test(value)) return false
  const { validMin, validMax } = readingSpec(indicator)
  const number = Number(value)
  return number >= validMin && number <= validMax
}

interface LogLine {
  key: number
  time: string
  text: string
}

interface Props {
  publisher: Publisher
  now?: () => Date
  newId?: () => string
}

export function SimulatorApp({ publisher, now = () => new Date(), newId = generateId }: Props) {
  const [linkState, setLinkState] = useState<LinkState>('disconnected')
  const [spo2, setSpo2] = useState(NOMINAL_SPO2)
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState<LogLine[]>([])
  const [injectSpo2, setInjectSpo2] = useState('')
  const [injectPulse, setInjectPulse] = useState('')
  const linkStateRef = useRef(linkState)
  const spo2Ref = useRef(spo2)
  const stopRef = useRef<(() => void) | null>(null)
  const lineKey = useRef(0)
  const sliderLabelId = useId()

  useEffect(
    () =>
      publisher.onState((state) => {
        linkStateRef.current = state
        setLinkState(state)
      }),
    [publisher],
  )
  // The timer starts on Run, not in an effect, so StrictMode's double effects can't publish twice.
  useEffect(() => () => stopRef.current?.(), [])

  function send(reading: { spo2: number; pulse?: number }) {
    const at = now()
    const payload = oximeterMessage(reading, at, newId)
    const sent = publisher.publish(TOPIC, payload)
    const line: LogLine = {
      key: ++lineKey.current,
      time: at.toISOString().slice(11, 19),
      text: sent ? `${TOPIC}  ${JSON.stringify(payload)}` : `not sent · device link ${linkStateRef.current}`,
    }
    setLog((lines) => [line, ...lines].slice(0, LOG_LINES))
  }

  function run() {
    stopRef.current = startNominalDay(() => send({ spo2: spo2Ref.current, pulse: NOMINAL_PULSE }))
    setRunning(true)
  }

  function stop() {
    stopRef.current?.()
    stopRef.current = null
    setRunning(false)
  }

  function changeSpo2(value: number) {
    spo2Ref.current = value
    setSpo2(value)
  }

  const canPublish = isValid(injectSpo2, 'spo2Percent') && (injectPulse === '' || isValid(injectPulse, 'heartRateBpm'))
  function inject() {
    send({ spo2: Number(injectSpo2), ...(injectPulse === '' ? {} : { pulse: Number(injectPulse) }) })
  }

  const oximeterTag = running ? (linkState === 'connected' ? 'publishing' : 'not sending') : null

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

      <div className="sim-cols">
        <div className="stack">
          <Region title="Virtual devices" className="sim-devices-region">
            <div className="sim-devices">
              <Device name="Pulse oximeter" tag={oximeterTag}>
                <p className="muted">
                  WebSocket JSON · <span className="num">{TOPIC}</span>
                </p>
                <p className="value">
                  {spo2} % · {NOMINAL_PULSE} bpm
                </p>
                <p className="muted">source: synthetic</p>
                <input
                  className="sim-slider"
                  type="range"
                  min={80}
                  max={100}
                  step={1}
                  value={spo2}
                  aria-labelledby={sliderLabelId}
                  onChange={(event) => changeSpo2(Number(event.target.value))}
                />
                <p className="muted" id={sliderLabelId}>
                  SpO₂ override · <span className="num">{spo2} %</span>
                </p>
              </Device>
              {NOT_BUILT_DEVICES.map(([name, line]) => (
                <Device key={name} name={name} tag="not built" off>
                  <p className="muted">{line}</p>
                </Device>
              ))}
            </div>
          </Region>

          <Region title="Device traffic" className="card">
            <pre className="sim-log" role="log">
              {log.length === 0
                ? 'No traffic yet'
                : log.map((line, i) => (
                    <span key={line.key}>
                      {i > 0 && '\n'}
                      <span className="muted">{line.time}</span>
                      {`  ${line.text}`}
                    </span>
                  ))}
            </pre>
          </Region>
        </div>

        <div className="stack">
          <Region title="Scenarios" className="card">
            <ul className="sim-scenarios">
              <li>
                <span>
                  <b>Nominal day</b>
                  {running && <span className="muted sim-scenarios__state">running · every 60 s</span>}
                </span>
                {running ? (
                  <button type="button" className="button-secondary" onClick={stop}>
                    Stop
                  </button>
                ) : (
                  <button type="button" className="button-secondary" onClick={run}>
                    Run
                  </button>
                )}
              </li>
              {NOT_BUILT_SCENARIOS.map((name) => (
                <li key={name}>
                  <span>
                    {name} <span className="tag">not built</span>
                  </span>
                  <button type="button" className="button-secondary" disabled>
                    Run
                  </button>
                </li>
              ))}
            </ul>
          </Region>

          <Region title="Inject one reading" className="card stack">
            <p className="muted">Pulse oximeter · source: synthetic</p>
            <div className="sim-inject">
              <label className="field-tile">
                <span className="tile-label">
                  SpO₂ <span className="tile-label__suffix">%</span>
                </span>
                <input type="text" inputMode="numeric" value={injectSpo2} onChange={(event) => setInjectSpo2(event.target.value)} />
              </label>
              <label className="field-tile">
                <span className="tile-label">
                  Pulse <span className="tile-label__suffix">bpm</span>
                </span>
                <input type="text" inputMode="numeric" value={injectPulse} onChange={(event) => setInjectPulse(event.target.value)} />
              </label>
            </div>
            <button type="button" className="button-primary" disabled={!canPublish} onClick={inject}>
              Publish
            </button>
          </Region>
        </div>
      </div>
    </div>
  )
}

function Region({ title, className, children }: { title: string; className: string; children: ReactNode }) {
  const id = useId()
  return (
    <section className={className} aria-labelledby={id}>
      <h2 className="card-heading" id={id}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Device({ name, tag, off = false, children }: { name: string; tag: string | null; off?: boolean; children: ReactNode }) {
  const id = useId()
  return (
    <section className={off ? 'card sim-device sim-device--off' : 'card sim-device'} aria-labelledby={id}>
      <div className="sim-device__top">
        <h3 id={id}>{name}</h3>
        {tag && <span className="tag">{tag}</span>}
      </div>
      {children}
    </section>
  )
}
