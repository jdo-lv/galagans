import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { newId as generateId } from '../application/newId'
import type { LinkState } from '../infrastructure/DeviceLink'
import { ThemeToggle } from '../ui/theme/ThemeToggle'
import { startNominalDay } from './nominalDay'
import type { Publisher } from './Publisher'
import { deviceMessage, isValidInput, nominalValues, SIM_DEVICES, type SimDevice, type SimField } from './simDevices'

const LOG_LINES = 50

const NOT_BUILT_SCENARIOS = ['CO₂ build-up', 'Resting HR drift', 'Orthostatic risk', 'Solar particle event', 'Sensor dropout']

/** Per device id, per payload key. */
type Values = Record<string, Record<string, number>>

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

const initialValues = (): Values => Object.fromEntries(SIM_DEVICES.map((sim) => [sim.device.id, nominalValues(sim)]))

const inputOk = (input: string, simField: SimField) =>
  simField.field.required ? isValidInput(input, simField) : input === '' || isValidInput(input, simField)

export function SimulatorApp({ publisher, now = () => new Date(), newId = generateId }: Props) {
  const [linkState, setLinkState] = useState<LinkState>('disconnected')
  const [values, setValues] = useState<Values>(initialValues)
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState<LogLine[]>([])
  const [injectId, setInjectId] = useState(SIM_DEVICES[0].device.id)
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const linkStateRef = useRef(linkState)
  const valuesRef = useRef(values)
  const stopRef = useRef<(() => void) | null>(null)
  const lineKey = useRef(0)

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

  function send(sim: SimDevice, reading: Record<string, number | undefined>) {
    const at = now()
    const payload = deviceMessage(sim, reading, at, newId)
    const sent = publisher.publish(sim.device.topic, payload)
    const line: LogLine = {
      key: ++lineKey.current,
      time: at.toISOString().slice(11, 19),
      text: sent ? `${sim.device.topic}  ${JSON.stringify(payload)}` : `not sent · device link ${linkStateRef.current}`,
    }
    setLog((lines) => [line, ...lines].slice(0, LOG_LINES))
  }

  function run() {
    stopRef.current = startNominalDay(() => SIM_DEVICES.forEach((sim) => send(sim, valuesRef.current[sim.device.id])))
    setRunning(true)
  }

  function stop() {
    stopRef.current?.()
    stopRef.current = null
    setRunning(false)
  }

  function override(sim: SimDevice, value: number) {
    const id = sim.device.id
    const next = { ...valuesRef.current, [id]: { ...valuesRef.current[id], [sim.override.key]: value } }
    valuesRef.current = next
    setValues(next)
  }

  const injectSim = SIM_DEVICES.find((sim) => sim.device.id === injectId)!
  const canPublish = injectSim.fields.every((simField) => inputOk(inputs[simField.field.key] ?? '', simField))

  function inject() {
    const reading = Object.fromEntries(injectSim.fields.map(({ field }) => [field.key, inputs[field.key] ? Number(inputs[field.key]) : undefined]))
    send(injectSim, reading)
  }

  function pickInjectDevice(id: string) {
    setInjectId(id)
    setInputs({})
  }

  const tag = running ? (linkState === 'connected' ? 'publishing' : 'not sending') : null

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
              {SIM_DEVICES.map((sim) => (
                <DeviceCard key={sim.device.id} sim={sim} values={values[sim.device.id]} tag={tag} onOverride={(value) => override(sim, value)} />
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
            <p className="muted">{`${injectSim.name} · source: synthetic`}</p>
            <label className="field-tile">
              <span className="tile-label">Device</span>
              <select className="sim-select" value={injectId} onChange={(event) => pickInjectDevice(event.target.value)}>
                {SIM_DEVICES.map((sim) => (
                  <option key={sim.device.id} value={sim.device.id}>
                    {sim.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="sim-inject">
              {injectSim.fields.map((simField) => (
                <label key={simField.field.key} className="field-tile">
                  <span className="tile-label">
                    {simField.label} <span className="tile-label__suffix">{simField.field.unit}</span>
                  </span>
                  <input
                    type="text"
                    inputMode={simField.decimals > 0 ? 'decimal' : 'numeric'}
                    value={inputs[simField.field.key] ?? ''}
                    onChange={(event) => setInputs({ ...inputs, [simField.field.key]: event.target.value })}
                  />
                </label>
              ))}
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

interface DeviceCardProps {
  sim: SimDevice
  values: Record<string, number>
  tag: string | null
  onOverride: (value: number) => void
}

function DeviceCard({ sim, values, tag, onOverride }: DeviceCardProps) {
  const id = useId()
  const sliderLabelId = useId()
  const { override } = sim
  const { decimals, field } = sim.fields.find((f) => f.field.key === override.key)!
  return (
    <section className="card sim-device" aria-labelledby={id}>
      <div className="sim-device__top">
        <h3 id={id}>{sim.name}</h3>
        {tag && <span className="tag">{tag}</span>}
      </div>
      <p className="muted">
        WebSocket JSON · <span className="num">{sim.device.topic}</span>
      </p>
      <p className="value">{sim.format(values)}</p>
      <p className="muted">source: synthetic</p>
      <input
        className="sim-slider"
        type="range"
        min={override.min}
        max={override.max}
        step={override.step}
        value={values[override.key]}
        aria-labelledby={sliderLabelId}
        // Range steps like 0.1 come back as 36.800000000000004; keep the field's decimals.
        onChange={(event) => onOverride(Number(Number(event.target.value).toFixed(decimals)))}
      />
      <p className="muted" id={sliderLabelId}>
        {override.label} override · <span className="num">{`${values[override.key].toFixed(decimals)} ${field.unit}`}</span>
      </p>
    </section>
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
