import { act, fireEvent, render, screen, within } from '@testing-library/react'
import type { LinkState } from '../infrastructure/DeviceLink'
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
  payloads() {
    return this.published.map((m) => JSON.stringify(m.payload))
  }
}

let ids: number
function renderSimulator(publisher = new FakePublisher()) {
  const view = render(<SimulatorApp publisher={publisher} newId={() => `id-${++ids}`} />)
  return { publisher, ...view }
}

const section = (name: string) => screen.getByRole('region', { name })
const field = (device: string, label: string) => within(section(device)).getByLabelText(label)
const every = (device: string) => within(section(device)).getByLabelText(/Every/)
const button = (device: string, name: string) => within(section(device)).getByRole('button', { name })
const statusLine = (device: string) => within(section(device)).getByRole('status')
const linkPill = () => screen.getByText(/^Device link/).closest('.pill')!
const type = (input: HTMLElement, value: string) => fireEvent.change(input, { target: { value } })
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms))

const DEVICES = ['Pulse oximeter', 'Wrist bracelet', 'BP cuff', 'Thermometer', 'Environment node', 'Dosimeter']

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
    expect(screen.queryByText('Scenarios')).toBeNull()

    publisher.setState('disconnected')
    expect(linkPill()).toHaveTextContent(`Device link ${URL} · disconnected`)
  })

  it.each([
    ['Pulse oximeter', 'crew/a1/oximeter', [['SpO₂ %', '97'], ['Pulse bpm', '63']]],
    ['Wrist bracelet', 'crew/a1/wrist/hr', [['Heart rate bpm', '63']]],
    ['BP cuff', 'crew/a1/bp', [['Systolic mmHg', '108'], ['Diastolic mmHg', '70'], ['Pulse bpm', '63']]],
    ['Thermometer', 'crew/a1/thermometer', [['Temperature °C', '36.8']]],
    ['Environment node', 'module/hab/env', [['CO₂ (1-h avg) mmHg', '2.3'], ['Cabin temp °C', '22'], ['Humidity % RH', '45']]],
    ['Dosimeter', 'module/hab/dose', [['Dose rate mSv/day', '0.5'], ['30-day BFO dose mGy-Eq', '95']]],
  ])('%s shows its topic, every metric at its starting value, Every 60 s, Start, Send now and "Not sent yet"', (device, topic, metrics) => {
    renderSimulator()

    expect(section(device)).toHaveTextContent(`${topic} · source: synthetic`)
    for (const [label, value] of metrics) expect(field(device, label)).toHaveValue(value)
    expect(every(device)).toHaveValue('60')
    expect(button(device, 'Start')).toBeEnabled()
    expect(button(device, 'Send now')).toBeEnabled()
    expect(statusLine(device)).toHaveTextContent('Not sent yet')
    expect(within(section(device)).queryByText(/sending every/)).toBeNull()
  })

  it('Send now publishes the current values once on the device topic, keys in contract order', () => {
    const { publisher } = renderSimulator()
    type(field('BP cuff', 'Systolic mmHg'), '150')
    type(field('BP cuff', 'Pulse bpm'), '')

    fireEvent.click(button('BP cuff', 'Send now'))

    expect(publisher.published.map((m) => m.topic)).toEqual(['crew/a1/bp'])
    expect(publisher.payloads()).toEqual(['{"id":"id-1","t":"2026-11-14T09:30:00.000Z","systolic_mmhg":150,"diastolic_mmhg":70,"src":"synthetic"}'])
    expect(statusLine('BP cuff')).toHaveTextContent('Last sent 09:30:00')
  })

  it('decimals go out as numbers: the dosimeter sends rate and 30-day dose', () => {
    const { publisher } = renderSimulator()
    type(field('Dosimeter', '30-day BFO dose mGy-Eq'), '130.5')

    fireEvent.click(button('Dosimeter', 'Send now'))

    expect(publisher.payloads()).toEqual(['{"id":"id-1","t":"2026-11-14T09:30:00.000Z","dose_rate_msv_day":0.5,"dose_30d_mgy_eq":130.5,"src":"synthetic"}'])
  })

  it.each([
    ['Pulse oximeter', 'SpO₂ %', ''],
    ['Pulse oximeter', 'SpO₂ %', '91.0'],
    ['Pulse oximeter', 'SpO₂ %', '49'],
    ['Thermometer', 'Temperature °C', '36.85'],
    ['Environment node', 'Humidity % RH', '101'],
    ['Dosimeter', 'Dose rate mSv/day', 'abc'],
  ])('%s %s %j disables Start and Send now', (device, label, value) => {
    renderSimulator()

    type(field(device, label), value)

    expect(button(device, 'Start')).toBeDisabled()
    expect(button(device, 'Send now')).toBeDisabled()
  })

  it('an empty optional field is left out of the payload', () => {
    const { publisher } = renderSimulator()
    type(field('Pulse oximeter', 'Pulse bpm'), '')

    fireEvent.click(button('Pulse oximeter', 'Send now'))

    expect(publisher.payloads()).toEqual(['{"id":"id-1","t":"2026-11-14T09:30:00.000Z","spo2_pct":97,"src":"synthetic"}'])
  })

  it.each(['0', '3601', '1.5', '', 'x'])('Every %j disables Start but not Send now', (value) => {
    renderSimulator()

    type(every('Wrist bracelet'), value)

    expect(button('Wrist bracelet', 'Start')).toBeDisabled()
    expect(button('Wrist bracelet', 'Send now')).toBeEnabled()
  })

  it('Start sends at once, then every N s with the values of that moment; the tag shows the period', () => {
    const { publisher } = renderSimulator()
    type(every('Wrist bracelet'), '5')

    fireEvent.click(button('Wrist bracelet', 'Start'))
    expect(within(section('Wrist bracelet')).getByText('sending every 5 s')).toHaveClass('tag')
    expect(every('Wrist bracelet')).toBeDisabled()
    type(field('Wrist bracelet', 'Heart rate bpm'), '120')
    advance(5_000)

    expect(publisher.payloads()).toEqual([
      '{"id":"id-1","t":"2026-11-14T09:30:00.000Z","hr_bpm":63,"src":"synthetic"}',
      '{"id":"id-2","t":"2026-11-14T09:30:05.000Z","hr_bpm":120,"src":"synthetic"}',
    ])
    expect(statusLine('Wrist bracelet')).toHaveTextContent('Last sent 09:30:05')
  })

  it('devices run on their own periods', () => {
    const { publisher } = renderSimulator()
    type(every('Wrist bracelet'), '5')
    fireEvent.click(button('Wrist bracelet', 'Start'))
    fireEvent.click(button('Environment node', 'Start'))

    advance(60_000)

    const count = (topic: string) => publisher.published.filter((m) => m.topic === topic).length
    expect([count('crew/a1/wrist/hr'), count('module/hab/env'), count('crew/a1/oximeter')]).toEqual([13, 2, 0])
  })

  it('Stop ends the sending, the tag goes and Start comes back', () => {
    const { publisher } = renderSimulator()
    fireEvent.click(button('Thermometer', 'Start'))

    fireEvent.click(button('Thermometer', 'Stop'))
    advance(60_000)

    expect(publisher.published).toHaveLength(1)
    expect(button('Thermometer', 'Start')).toBeInTheDocument()
    expect(within(section('Thermometer')).queryByText(/sending every/)).toBeNull()
    expect(every('Thermometer')).toBeEnabled()
  })

  it('unmounting while sending sends nothing more', () => {
    const { publisher, unmount } = renderSimulator()
    fireEvent.click(button('Thermometer', 'Start'))

    unmount()
    advance(60_000)

    expect(publisher.published).toHaveLength(1)
  })

  it('a value made invalid while sending skips the tick and says so', () => {
    const { publisher } = renderSimulator()
    fireEvent.click(button('Thermometer', 'Start'))
    type(field('Thermometer', 'Temperature °C'), '')

    advance(60_000)

    expect(publisher.published).toHaveLength(1)
    expect(statusLine('Thermometer')).toHaveTextContent('Not sent · check the values 09:31:00')
  })

  it('with the device link down nothing is sent or queued, and the status says so', () => {
    const { publisher } = renderSimulator(new FakePublisher('disconnected'))

    fireEvent.click(button('Dosimeter', 'Send now'))
    fireEvent.click(button('Pulse oximeter', 'Start'))
    expect(statusLine('Dosimeter')).toHaveTextContent('Not sent · device link disconnected 09:30:00')

    publisher.setState('connecting')
    advance(60_000)
    expect(statusLine('Pulse oximeter')).toHaveTextContent('Not sent · device link connecting 09:31:00')
    expect(within(section('Pulse oximeter')).getByText('sending every 60 s')).toBeInTheDocument()
    expect(publisher.published).toHaveLength(0)
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
