import { act, fireEvent, render, screen, within } from '@testing-library/react'
import type { LinkState } from '../infrastructure/DeviceLink'
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
