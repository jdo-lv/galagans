import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { newId as generateId } from '../application/newId'
import { DeviceScreen } from '../device/DeviceScreen'
import type { DotFeed } from '../device/DotFeed'
import { validPct } from '../device/dotDisplay'
import type { DeviceId } from '../domain/devices'
import { deviceMessage, indicatorLevels, levelsFor, randomValues } from '../domain/levelValues'
import type { ReadingSource } from '../domain/ports'
import type { Rule, Status } from '../domain/rules'
import type { LinkState } from '../infrastructure/DeviceLink'
import { ThemeToggle } from '../ui/theme/ThemeToggle'
import type { Publisher } from './Publisher'
import { startRepeating } from './repeat'
import { activeRanges, drivenIndicators, SCENARIOS, type Scenario, stepAt } from './scenarios'
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
  /** The dot display's topic and its panel; without it there is no Dot display card. */
  display?: { source: ReadingSource; feed: DotFeed }
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

/** A checked scenario and when it was checked (ms). */
interface Running {
  scenario: Scenario
  checkedAt: number
}

const drives = (scenario: Scenario, sim: SimDevice) => {
  const indicators = drivenIndicators(scenario)
  return sim.device.fields.some((field) => indicators.has(field.indicator))
}

const initialLevels = () => Object.fromEntries(SIM_DEVICES.map((s) => [s.device.id, SIM_CONFIG[s.device.id].level])) as Record<DeviceId, Status>

export function SimulatorApp({ publisher, rules, display, now =() => new Date(), newId = generateId, random = Math.random }: Props) {
  const [linkState, setLinkState] = useState<LinkState>('disconnected')
  const linkStateRef = useRef(linkState)
  const [levels, setLevels] = useState(initialLevels)
  const levelsRef = useRef(levels)
  const [running, setRunning] = useState<Running | null>(null)
  const runningRef = useRef(running)
  const [, setTick] = useState(0)
  const stepTimers = useRef<ReturnType<typeof setTimeout>[]>([])

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
    const scenario = runningRef.current
    const ranges = scenario ? activeRanges(scenario.scenario, (at.getTime() - scenario.checkedAt) / 1000) : undefined
    const values = randomValues(sim.device, indicatorLevels(levelsRef.current, rules), rules, random, ranges)
    const sent = publisher.publish(sim.device.topic, deviceMessage(sim.device, values, at, newId))
    return sent ? { status: `Last sent ${clock(at)}`, values } : { status: `Not sent · device link ${linkStateRef.current} ${clock(at)}` }
  }

  function changeLevel(id: DeviceId, level: Status) {
    const next = { ...levelsRef.current, [id]: level }
    levelsRef.current = next
    setLevels(next)
  }

  function clearStepTimers() {
    stepTimers.current.forEach(clearTimeout)
    stepTimers.current = []
  }

  useEffect(() => clearStepTimers, [])

  /** Checking or unchecking puts the driven devices back at their SIM_CONFIG level. */
  function toggleScenario(scenario: Scenario) {
    clearStepTimers()
    const next = runningRef.current ? null : { scenario, checkedAt: now().getTime() }
    runningRef.current = next
    setRunning(next)
    const reset = { ...levelsRef.current }
    for (const sim of SIM_DEVICES) if (drives(scenario, sim)) reset[sim.device.id] = SIM_CONFIG[sim.device.id].level
    levelsRef.current = reset
    setLevels(reset)
    // The timers only re-render the step line; send() reads the elapsed time itself.
    if (next)
      stepTimers.current = scenario.steps
        .filter((step) => step.afterS > 0)
        .map((step) => setTimeout(() => setTick((n) => n + 1), step.afterS * 1000))
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

      {display && <DotDisplaySection source={display.source} feed={display.feed} now={now} />}

      <ScenariosSection running={running} now={now} onToggle={toggleScenario} />

      <div className="sim-devices">
        {SIM_DEVICES.map((sim) => {
          const id = sim.device.id
          return (
            <DeviceSection
              key={id}
              sim={sim}
              level={levels[id]}
              locked={running !== null && drives(running.scenario, sim)}
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
  /** A running scenario sets this device's values; its picker is read-only. */
  locked: boolean
  /** Levels with a rule row for one of the device's fields. */
  available: Status[]
  onLevel: (level: Status) => void
  send: (sim: SimDevice) => Sent
}

function DeviceSection({ sim, level, locked, available, onLevel, send }: DeviceSectionProps) {
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
        {running && <span className="tag">{`sending every ${running} s · ${locked ? 'Scenario' : LEVEL_WORD[level]}`}</span>}
      </div>
      <p className="muted">
        <span className="num">{sim.device.topic}</span> · source: synthetic
      </p>
      <fieldset className="sim-levels">
        <legend>{locked ? 'Level · Set by scenario' : 'Level'}</legend>
        {LEVELS.map(([value, word]) => {
          const enabled = !locked && available.includes(value)
          return (
            <button
              key={value}
              type="button"
              aria-pressed={value === level}
              disabled={!enabled}
              title={locked ? 'Set by scenario' : enabled ? undefined : 'No rule row for this level'}
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

interface ScenariosSectionProps {
  running: Running | null
  now: () => Date
  onToggle: (scenario: Scenario) => void
}

/** One checkbox per scenario; one runs at a time. */
function ScenariosSection({ running, now, onToggle }: ScenariosSectionProps) {
  const id = useId()
  return (
    <section className="card sim-scenarios" aria-labelledby={id}>
      <h2 id={id} className="card-heading">
        Scenarios
      </h2>
      {SCENARIOS.map((scenario) => {
        const on = running?.scenario.id === scenario.id
        const step = on ? stepAt(scenario, (now().getTime() - running.checkedAt) / 1000) : 0
        return (
          <div key={scenario.id} className="sim-scenario">
            <input
              type="checkbox"
              id={`${id}-${scenario.id}`}
              checked={on}
              disabled={running !== null && !on}
              aria-describedby={`${id}-${scenario.id}-caption`}
              onChange={() => onToggle(scenario)}
            />
            <div>
              <label htmlFor={`${id}-${scenario.id}`}>{scenario.name}</label>
              <p id={`${id}-${scenario.id}-caption`} className="muted">
                {scenario.caption}
              </p>
              {on && <p>{`Step ${step} / ${scenario.steps.length} · ${scenario.steps[step - 1].label}`}</p>}
            </div>
          </div>
        )
      })}
    </section>
  )
}

const DISPLAY_TOPIC = 'crew/a1/dot-display'
/** The dot display's STALE_MS: the tag shows while the last payload arrived less than this ago. */
const RECEIVING_MS = 30_000

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const isStatus = (value: unknown): value is Status => typeof value === 'string' && Object.hasOwn(LEVEL_WORD, value)

interface MetricRow {
  label: string
  value: string
  level: string
  nominal: boolean
  ruleId: string
  reading: string
  src: string
}

/** What the card shows of one accepted payload; `rows` only when it has metrics and a known level. */
interface DisplayPayload {
  pct: number
  src: string
  level?: Status
  rows?: MetricRow[]
}

function metricRow(entry: unknown): MetricRow | undefined {
  if (!isRecord(entry)) return undefined
  const { label, value, unit, level, lastLevel, ruleId, recordedAt, src } = entry
  if (typeof label !== 'string' || typeof value !== 'number') return undefined
  const stale = level === 'stale'
  const shown = stale ? lastLevel : level
  if (!isStatus(shown)) return undefined
  const at = typeof recordedAt === 'string' ? new Date(recordedAt) : undefined
  if (!at || Number.isNaN(at.getTime())) return undefined
  return {
    label,
    value: `${String(value)} ${typeof unit === 'string' ? unit : ''}`.trimEnd(),
    level: stale ? `Stale · ${LEVEL_WORD[shown]}` : LEVEL_WORD[shown],
    nominal: !stale && shown === 'nominal',
    ruleId: typeof ruleId === 'string' ? ruleId : '',
    reading: clock(at),
    src: typeof src === 'string' ? src : '',
  }
}

/** Undefined for a payload the display would ignore (no pct from 0 to 100). */
function readPayload(payload: unknown): DisplayPayload | undefined {
  if (!isRecord(payload) || !validPct(payload.pct)) return undefined
  const src = typeof payload.src === 'string' ? payload.src : '—'
  if (!Array.isArray(payload.metrics) || !isStatus(payload.level)) return { pct: payload.pct, src }
  const rows = payload.metrics.map(metricRow).filter((row): row is MetricRow => row !== undefined)
  return { pct: payload.pct, src, level: payload.level, rows }
}

interface DotDisplaySectionProps {
  source: ReadingSource
  feed: DotFeed
  now: () => Date
}

/** What the dot display shows, beside the metrics the backend judged to get there. */
function DotDisplaySection({ source, feed, now }: DotDisplaySectionProps) {
  const id = useId()
  const [payload, setPayload] = useState<DisplayPayload>()
  const [arrivedAt, setArrivedAt] = useState<number>()
  const [, setTick] = useState(0)
  const nowRef = useRef(now)
  nowRef.current = now

  useEffect(
    () =>
      source.subscribe((message) => {
        const read = readPayload(message)
        if (!read) return
        setPayload(read)
        setArrivedAt(nowRef.current().getTime())
      }),
    [source],
  )

  // Arrival time, not the payload's t: the tablet and the server clocks may differ.
  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  const receiving = arrivedAt !== undefined && now().getTime() - arrivedAt < RECEIVING_MS

  return (
    <section className="card sim-display" aria-labelledby={id}>
      <div className="sim-display__side">
        <div className="sim-device__top">
          <h2 id={id}>Dot display</h2>
          {receiving && <span className="tag">receiving</span>}
        </div>
        <p className="muted">
          <span className="num">{DISPLAY_TOPIC}</span> · source: {payload?.src ?? '—'}
        </p>
        <div className="sim-display__panel">
          <DeviceScreen feed={feed} />
        </div>
        <p className="sim-display__status">
          <StatusLine payload={payload} />
        </p>
      </div>
      {payload?.rows && <MetricTable rows={payload.rows} />}
    </section>
  )
}

function StatusLine({ payload }: { payload: DisplayPayload | undefined }) {
  if (!payload) return <>Waiting for {DISPLAY_TOPIC}</>
  const pct = (
    <>
      Health status <span className="sim-display__pct">{payload.pct}</span> %
    </>
  )
  if (!payload.rows || !payload.level) return <>{pct} · no metrics in payload</>
  const nominal = payload.rows.filter((row) => row.nominal).length
  return (
    <>
      {pct} · worst level {LEVEL_WORD[payload.level]} · {nominal} of {payload.rows.length} metrics nominal
    </>
  )
}

function MetricTable({ rows }: { rows: MetricRow[] }) {
  return (
    <table className="sim-display__table">
      <thead>
        <tr>
          <th>Metric</th>
          <th>Value</th>
          <th>Level</th>
          <th>Rule</th>
          <th>Reading</th>
          <th>Source</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            <td>{row.label}</td>
            <td className="num">{row.value}</td>
            <td>{row.level}</td>
            <td className="num">{row.ruleId}</td>
            <td className="num">{row.reading}</td>
            <td>{row.src}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
