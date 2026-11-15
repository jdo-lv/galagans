import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { LinkFeed } from '../device/LinkFeed'
import type { LinkState } from '../infrastructure/DeviceLink'
import { FakeReadingSource } from '../test/fakes'
import { RULES } from '../test/rules'
import type { Publisher } from './Publisher'
import { SimulatorApp } from './SimulatorApp'

const URL = 'ws://192.168.1.20:8080/ws/devices'

class FakePublisher implements Publisher {
  readonly url = URL
  readonly published: { topic: string; payload: object }[] = []
  private state: LinkState
  private readonly listeners = new Set<(state: LinkState) => void>()

  constructor(state: LinkState = 'connected') {
    this.state = state
  }

  publish(topic: string, payload: object) {
    if (this.state !== 'connected') return false
    this.published.push({ topic, payload })
    return true
  }
  onState(listener: (state: LinkState) => void) {
    this.listeners.add(listener)
    listener(this.state)
    return () => this.listeners.delete(listener)
  }
  setState(state: LinkState) {
    this.state = state
    act(() => this.listeners.forEach((listener) => listener(state)))
  }
  payloads(topic?: string) {
    return this.published.filter((m) => !topic || m.topic === topic).map((m) => m.payload as Record<string, unknown>)
  }
  clear() {
    this.published.length = 0
  }
}

let ids: number
function renderSimulator(publisher = new FakePublisher(), random: () => number = Math.random) {
  const view = render(<SimulatorApp publisher={publisher} rules={RULES} newId={() => `id-${++ids}`} random={random} />)
  return { publisher, ...view }
}

const section = (name: string) => screen.getByRole('region', { name })
const every = (device: string) => within(section(device)).getByLabelText(/Every/)
const button = (device: string, name: string) => within(section(device)).getByRole('button', { name })
const levelButtons = (device: string) => within(within(section(device)).getByRole('group', { name: 'Level' })).getAllByRole('button')
const statusLine = (device: string) => within(section(device)).getByRole('status')
const tag = (device: string) => section(device).querySelector('.tag')
const tiles = (device: string) =>
  [...section(device).querySelectorAll('.field-tile')].map((t) => [t.querySelector('.tile-label')?.textContent, t.querySelector('.value')?.textContent])
const linkPill = () => screen.getByText(/^Device link/).closest('.pill')!
const type = (input: HTMLElement, value: string) => fireEvent.change(input, { target: { value } })
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms))

const DEVICES = ['Pulse oximeter', 'Wrist bracelet', 'BP cuff', 'Thermometer', 'Environment node', 'Dosimeter']
const TOPICS = ['crew/a1/oximeter', 'crew/a1/wrist/hr', 'crew/a1/bp', 'crew/a1/thermometer', 'module/hab/env', 'module/hab/dose']
const between = (value: unknown, min: number, max: number) => typeof value === 'number' && value >= min && value <= max

beforeEach(() => {
  ids = 0
  vi.useFakeTimers({ now: new Date('2026-11-14T09:30:00.000Z') })
  localStorage.clear()
  delete document.documentElement.dataset.theme
})
afterEach(() => vi.useRealTimers())

describe('SimulatorApp', () => {
  it('shows the heading, the device link and simulated pills, a theme toggle and one section per device', () => {
    const { publisher } = renderSimulator()

    expect(screen.getByRole('heading', { level: 1, name: 'Device Simulator' })).toBeInTheDocument()
    expect(linkPill()).toHaveTextContent(`Device link ${URL} · connected`)
    expect(screen.getByText('All data simulated')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Switch to (dark|light) mode/ })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(DEVICES)

    publisher.setState('disconnected')
    expect(linkPill()).toHaveTextContent(`Device link ${URL} · disconnected`)
  })

  it('AC31: on load every device sends at once at its SIM_CONFIG level, then every 1 s', () => {
    const { publisher } = renderSimulator()

    expect(publisher.published.map((m) => m.topic)).toEqual(TOPICS)
    for (const device of DEVICES) {
      expect(tag(device)).toHaveTextContent('sending every 1 s · Nominal')
      expect(every(device)).toHaveValue('1')
      expect(every(device)).toBeDisabled()
      expect(button(device, 'Stop')).toBeInTheDocument()
      expect(statusLine(device)).toHaveTextContent('Last sent 09:30:00')
    }

    advance(1_000)
    expect(publisher.published).toHaveLength(12)
    expect(statusLine('Dosimeter')).toHaveTextContent('Last sent 09:30:01')
  })

  it.each(['connecting', 'disconnected'] as const)('AC31: with the link %s the first message is not sent and says so', (state) => {
    const { publisher } = renderSimulator(new FakePublisher(state))

    expect(publisher.published).toHaveLength(0)
    expect(statusLine('Pulse oximeter')).toHaveTextContent(`Not sent · device link ${state} 09:30:00`)
    expect(tiles('Pulse oximeter')).toEqual([
      ['SpO₂ %', '—'],
      ['Pulse bpm', '—'],
    ])
  })

  it.each([
    ['Pulse oximeter', ['Nominal', 'Check', 'Emergency']],
    ['Wrist bracelet', ['Nominal', 'Check']],
    ['BP cuff', ['Nominal', 'Watch', 'Check', 'Treat', 'Emergency']],
    ['Thermometer', ['Nominal', 'Check']],
    ['Environment node', ['Nominal', 'Watch', 'Check']],
    ['Dosimeter', ['Nominal', 'Check', 'Emergency']],
  ])('AC32: %s has a Level fieldset; only %j have rule rows', (device, enabled) => {
    renderSimulator()

    const buttons = levelButtons(device)
    expect(buttons.map((b) => b.textContent)).toEqual(['Nominal', 'Watch', 'Check', 'Treat', 'Emergency'])
    expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'false', 'false', 'false'])
    for (const b of buttons) {
      const on = enabled.includes(b.textContent!)
      expect(b).toHaveProperty('disabled', !on)
      expect(b.getAttribute('title')).toBe(on ? null : 'No rule row for this level')
    }
  })

  it('AC32: a level applies from the next message without restarting the timer', () => {
    const { publisher } = renderSimulator()
    advance(500)

    fireEvent.click(button('Thermometer', 'Check'))
    expect(levelButtons('Thermometer').map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'true', 'false', 'false'])
    expect(tag('Thermometer')).toHaveTextContent('sending every 1 s · Check')
    expect(publisher.payloads('crew/a1/thermometer')).toHaveLength(1)

    advance(500)
    const temps = publisher.payloads('crew/a1/thermometer').map((p) => p.temp_c)
    expect(temps).toHaveLength(2)
    expect(between(temps[0], 35.7, 37.9)).toBe(true)
    expect(between(temps[1], 38, 41.6)).toBe(true)
  })

  it('AC32: the bracelet at Check puts every pulse field in 101–110', () => {
    const { publisher } = renderSimulator()
    fireEvent.click(button('Wrist bracelet', 'Check'))
    publisher.clear()

    advance(5_000)

    const pulses = [
      ...publisher.payloads('crew/a1/wrist/hr').map((p) => p.hr_bpm),
      ...publisher.payloads('crew/a1/oximeter').map((p) => p.pulse_bpm),
      ...publisher.payloads('crew/a1/bp').map((p) => p.pulse_bpm),
    ]
    expect(pulses).toHaveLength(15)
    expect(pulses.every((v) => between(v, 101, 110))).toBe(true)
  })

  it('AC35: only the oximeter at Check: every oximeter payload has SpO₂ 90–93 and pulse 101–110', () => {
    const { publisher } = renderSimulator()
    fireEvent.click(button('Pulse oximeter', 'Check'))
    publisher.clear()

    advance(20_000)

    const payloads = publisher.payloads('crew/a1/oximeter')
    expect(payloads).toHaveLength(20)
    expect(payloads.every((p) => between(p.spo2_pct, 90, 93) && between(p.pulse_bpm, 101, 110))).toBe(true)
  })

  it('AC33: no value inputs; each tile shows the values of the last message the link took', () => {
    const { publisher } = renderSimulator(new FakePublisher(), () => 0)

    expect(within(section('BP cuff')).getAllByRole('textbox')).toEqual([every('BP cuff')])
    expect(tiles('BP cuff')).toEqual([
      ['Systolic mmHg', '105'],
      ['Diastolic mmHg', '68'],
      ['Pulse bpm', '62'],
    ])
    expect(publisher.payloads('crew/a1/bp')).toEqual([{ id: 'id-3', t: '2026-11-14T09:30:00.000Z', systolic_mmhg: 105, diastolic_mmhg: 68, pulse_bpm: 62, src: 'synthetic' }])

    fireEvent.click(button('BP cuff', 'Treat'))
    publisher.setState('disconnected')
    advance(1_000)
    expect(tiles('BP cuff')[0]).toEqual(['Systolic mmHg', '105'])

    publisher.setState('connected')
    advance(1_000)
    expect(tiles('BP cuff')[0]).toEqual(['Systolic mmHg', '140'])
  })

  it('AC34: Stop ends the sending, the tag goes and Start comes back with Every enabled', () => {
    const { publisher } = renderSimulator()

    fireEvent.click(button('Thermometer', 'Stop'))
    advance(60_000)

    expect(publisher.payloads('crew/a1/thermometer')).toHaveLength(1)
    expect(button('Thermometer', 'Start')).toBeInTheDocument()
    expect(tag('Thermometer')).toBeNull()
    expect(every('Thermometer')).toBeEnabled()
  })

  it.each(['0', '3601', '1.5', '', 'x'])('AC34: Every %j disables Start but not Send now', (value) => {
    renderSimulator()
    fireEvent.click(button('Wrist bracelet', 'Stop'))

    type(every('Wrist bracelet'), value)

    expect(button('Wrist bracelet', 'Start')).toBeDisabled()
    expect(button('Wrist bracelet', 'Send now')).toBeEnabled()
  })

  it('AC34: Start sends at once, then every N s; devices run on their own periods', () => {
    const { publisher } = renderSimulator()
    fireEvent.click(button('Wrist bracelet', 'Stop'))
    type(every('Wrist bracelet'), '5')
    publisher.clear()

    fireEvent.click(button('Wrist bracelet', 'Start'))
    expect(tag('Wrist bracelet')).toHaveTextContent('sending every 5 s · Nominal')
    advance(10_000)

    expect(publisher.payloads('crew/a1/wrist/hr')).toHaveLength(3)
    expect(publisher.payloads('module/hab/env')).toHaveLength(10)
    expect(statusLine('Wrist bracelet')).toHaveTextContent('Last sent 09:30:10')
  })

  it('AC34: Send now publishes one message at the current levels, keys in contract order', () => {
    const { publisher } = renderSimulator(new FakePublisher(), () => 0)
    fireEvent.click(button('Dosimeter', 'Stop'))
    fireEvent.click(button('Dosimeter', 'Emergency'))
    publisher.clear()

    fireEvent.click(button('Dosimeter', 'Send now'))

    expect(publisher.published.map((m) => [m.topic, JSON.stringify(m.payload)])).toEqual([
      ['module/hab/dose', '{"id":"id-7","t":"2026-11-14T09:30:00.000Z","dose_rate_msv_day":0.49,"dose_30d_mgy_eq":250.1,"src":"synthetic"}'],
    ])
    expect(statusLine('Dosimeter')).toHaveTextContent('Last sent 09:30:00')
  })

  it('AC34: with the device link down nothing is sent or queued, and the status says so', () => {
    const { publisher } = renderSimulator(new FakePublisher('disconnected'))

    fireEvent.click(button('Dosimeter', 'Send now'))
    expect(statusLine('Dosimeter')).toHaveTextContent('Not sent · device link disconnected 09:30:00')

    publisher.setState('connecting')
    advance(60_000)
    expect(statusLine('Pulse oximeter')).toHaveTextContent('Not sent · device link connecting 09:31:00')
    expect(tag('Pulse oximeter')).toHaveTextContent('sending every 1 s · Nominal')
    expect(publisher.published).toHaveLength(0)
  })

  it('unmounting while sending sends nothing more', () => {
    const { publisher, unmount } = renderSimulator()

    unmount()
    advance(60_000)

    expect(publisher.published).toHaveLength(6)
  })

  it('the theme toggle stores under simulator.theme and leaves crew-health.theme alone', () => {
    localStorage.setItem('crew-health.theme', 'light')
    renderSimulator()

    fireEvent.click(screen.getByRole('button', { name: /Switch to (dark|light) mode/ }))
    const first = localStorage.getItem('simulator.theme')
    fireEvent.click(screen.getByRole('button', { name: /Switch to (dark|light) mode/ }))

    expect(first).not.toBeNull()
    expect(localStorage.getItem('simulator.theme')).not.toBe(first)
    expect(document.documentElement.dataset.theme).toBe(localStorage.getItem('simulator.theme'))
    expect(localStorage.getItem('crew-health.theme')).toBe('light')
  })
})

describe('SimulatorApp Dot display card (#45)', () => {
  const metric = (label: string, value: number, unit: string, level: string, ruleId: string | undefined, at: string, src: string) => ({
    indicator: label,
    label,
    value,
    unit,
    level,
    ...(ruleId ? { ruleId } : {}),
    recordedAt: `2026-11-14T09:31:0${at}Z`,
    src,
  })
  // The mock's payload (docs/features/img/dot-display-status-mock.png).
  const MOCK = {
    id: 'status-1',
    t: '2026-11-14T09:31:08Z',
    pct: 46,
    level: 'check',
    src: 'backend-rules',
    metrics: [
      metric('SpO₂', 92, '%', 'check', 'SPO-01', '6', 'oximeter · synthetic'),
      metric('Heart rate', 104, 'bpm', 'check', 'CV-01', '7', 'bracelet · synthetic'),
      metric('Systolic', 110, 'mmHg', 'nominal', undefined, '7', 'BP cuff · synthetic'),
      metric('Diastolic', 69, 'mmHg', 'nominal', undefined, '7', 'BP cuff · synthetic'),
      metric('Temperature', 36.9, '°C', 'nominal', undefined, '6', 'thermometer · synthetic'),
      metric('CO₂ (1-h avg)', 2.3, 'mmHg', 'nominal', undefined, '7', 'environment node · synthetic'),
      metric('Cabin temp', 22.3, '°C', 'nominal', undefined, '7', 'environment node · synthetic'),
      metric('Cabin humidity', 46, '% RH', 'nominal', undefined, '7', 'environment node · synthetic'),
      metric('Dose rate', 0.51, 'mSv/day', 'nominal', undefined, '6', 'dosimeter · synthetic'),
      metric('30-day BFO dose', 96.2, 'mGy-Eq', 'nominal', undefined, '6', 'dosimeter · synthetic'),
    ],
  }
  const MOCK_ROWS = [
    ['SpO₂', '92 %', 'Check', 'SPO-01', '09:31:06', 'oximeter · synthetic'],
    ['Heart rate', '104 bpm', 'Check', 'CV-01', '09:31:07', 'bracelet · synthetic'],
    ['Systolic', '110 mmHg', 'Nominal', '', '09:31:07', 'BP cuff · synthetic'],
    ['Diastolic', '69 mmHg', 'Nominal', '', '09:31:07', 'BP cuff · synthetic'],
    ['Temperature', '36.9 °C', 'Nominal', '', '09:31:06', 'thermometer · synthetic'],
    ['CO₂ (1-h avg)', '2.3 mmHg', 'Nominal', '', '09:31:07', 'environment node · synthetic'],
    ['Cabin temp', '22.3 °C', 'Nominal', '', '09:31:07', 'environment node · synthetic'],
    ['Cabin humidity', '46 % RH', 'Nominal', '', '09:31:07', 'environment node · synthetic'],
    ['Dose rate', '0.51 mSv/day', 'Nominal', '', '09:31:06', 'dosimeter · synthetic'],
    ['30-day BFO dose', '96.2 mGy-Eq', 'Nominal', '', '09:31:06', 'dosimeter · synthetic'],
  ]

  const connectedLink = { onState: (listener: (state: LinkState) => void) => (listener('connected'), () => {}) }

  function renderWithDisplay() {
    const source = new FakeReadingSource()
    const display = { source, feed: new LinkFeed(connectedLink, source) }
    render(<SimulatorApp publisher={new FakePublisher()} rules={RULES} display={display} newId={() => `id-${++ids}`} />)
    return { emit: (payload: unknown) => act(() => source.emit(payload)) }
  }

  const card = () => screen.getByRole('region', { name: 'Dot display' })
  const statusText = () => card().querySelector('.sim-display__status')?.textContent?.replace(/\s+/g, ' ')
  const subLine = () => card().querySelector('p.muted')?.textContent
  const rows = () => [...card().querySelectorAll('tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent))
  const panelLabel = () => card().querySelector('.sim-display__panel svg.dot-display')?.getAttribute('aria-label')

  it('AC17: without display there is no Dot display card', () => {
    renderSimulator()
    expect(screen.queryByRole('region', { name: 'Dot display' })).not.toBeInTheDocument()
    expect(document.querySelector('.sim-display')).toBeNull()
  })

  it('AC18, AC21: before any payload the card is first, waits and has no tag or table', () => {
    renderWithDisplay()

    expect(screen.getAllByRole('heading', { level: 2 })[0]).toHaveTextContent('Dot display')
    expect(card()).toHaveClass('card', 'sim-display')
    expect(subLine()).toBe('crew/a1/dot-display · source: —')
    expect(statusText()).toBe('Waiting for crew/a1/dot-display')
    expect(card().querySelector('.tag')).toBeNull()
    expect(card().querySelector('table')).toBeNull()
  })

  it('AC18: tags receiving while the last payload arrived under 30 s ago, by arrival time', () => {
    const { emit } = renderWithDisplay()

    emit({ ...MOCK, t: '2020-01-01T00:00:00Z' })
    expect(subLine()).toBe('crew/a1/dot-display · source: backend-rules')
    expect(card().querySelector('.tag')).toHaveTextContent('receiving')

    advance(29_000)
    expect(card().querySelector('.tag')).toHaveTextContent('receiving')
    advance(1_000)
    expect(card().querySelector('.tag')).toBeNull()
  })

  it('AC19: the panel inside .sim-display__panel shows pct 46 as 3 of 6 dots, Check', () => {
    const { emit } = renderWithDisplay()

    emit(MOCK)

    expect(panelLabel()).toBe('3 of 6 dots, Check')
  })

  it('AC20, AC22: the mock payload gives the status line and its 10 rows in payload order', () => {
    const { emit } = renderWithDisplay()

    emit(MOCK)

    expect(statusText()).toBe('Health status 46 % · worst level Check · 8 of 10 metrics nominal')
    expect([...card().querySelectorAll('thead th')].map((th) => th.textContent)).toEqual(['Metric', 'Value', 'Level', 'Rule', 'Reading', 'Source'])
    expect(rows()).toEqual(MOCK_ROWS)
  })

  it('AC20: a stale entry reads Stale · <last level>; bad entries are skipped and not counted', () => {
    const { emit } = renderWithDisplay()
    const spo2 = { ...MOCK.metrics[0], level: 'stale', lastLevel: 'check' }
    const temp = MOCK.metrics[4]

    emit({
      ...MOCK,
      pct: 48,
      metrics: [
        spo2,
        temp,
        { ...temp, label: 7 },
        { ...temp, value: '36.9' },
        { ...temp, level: 'caution' },
        { ...temp, recordedAt: 'yesterday' },
        { ...temp, recordedAt: undefined },
        { ...spo2, lastLevel: 'stale' },
        { ...spo2, lastLevel: undefined },
        'not an entry',
      ],
    })

    expect(rows()).toEqual([
      ['SpO₂', '92 %', 'Stale · Check', 'SPO-01', '09:31:06', 'oximeter · synthetic'],
      MOCK_ROWS[4],
    ])
    expect(statusText()).toBe('Health status 48 % · worst level Check · 1 of 2 metrics nominal')
  })

  it('AC20, AC21: a payload whose level is not one of the five levels shows no table', () => {
    const { emit } = renderWithDisplay()

    emit({ ...MOCK, level: 'stale' })

    expect(statusText()).toBe('Health status 46 % · no metrics in payload')
    expect(card().querySelector('table')).toBeNull()
  })

  it('AC21: a pct-only payload shows pct and no table; a payload without a valid pct is ignored', () => {
    const { emit } = renderWithDisplay()

    emit({ id: 'a', t: '2026-11-14T09:30:00Z', pct: 72, src: 'synthetic' })
    expect(statusText()).toBe('Health status 72 % · no metrics in payload')
    expect(subLine()).toBe('crew/a1/dot-display · source: synthetic')
    expect(panelLabel()).toBe('5 of 6 dots, To do')
    expect(card().querySelector('table')).toBeNull()

    for (const bad of [{ ...MOCK, pct: 140 }, { ...MOCK, pct: '46' }, { ...MOCK, pct: undefined }, null, 'x']) emit(bad)

    expect(statusText()).toBe('Health status 72 % · no metrics in payload')
    expect(panelLabel()).toBe('5 of 6 dots, To do')
  })
})
