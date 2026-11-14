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

const oximeterCard = () => screen.getByRole('region', { name: 'Pulse oximeter' })
const scenarioRow = (name: string) => screen.getAllByRole('listitem').find((li) => li.textContent?.includes(name))!
const spo2Field = () => screen.getByLabelText('SpO₂ %')
const pulseField = () => screen.getByLabelText('Pulse bpm')
const publishButton = () => screen.getByRole('button', { name: 'Publish' })
const logLines = () => within(screen.getByRole('region', { name: 'Device traffic' })).getByRole('log').textContent!.split('\n')
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms))

beforeEach(() => {
  ids = 0
  vi.useFakeTimers({ now: new Date('2026-11-14T09:30:00.000Z') })
  localStorage.clear()
  delete document.documentElement.dataset.theme
})
afterEach(() => vi.useRealTimers())

describe('SimulatorApp', () => {
  it('AC12: shows the heading, the device link and simulated pills, a theme toggle and the four cards', () => {
    const { publisher } = renderSimulator()

    expect(screen.getByRole('heading', { level: 1, name: 'Device Simulator' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(`Device link ${URL} · connected`)
    expect(screen.getByText('All data simulated')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Switch to (dark|light) mode/ })).toBeInTheDocument()
    for (const name of ['Virtual devices', 'Scenarios', 'Inject one reading', 'Device traffic']) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument()
    }

    publisher.setState('disconnected')
    expect(screen.getByRole('status')).toHaveTextContent(`Device link ${URL} · disconnected`)
  })

  it('AC14: lists the six devices in order, five not built, and an empty inject form', () => {
    renderSimulator()

    const cards = within(screen.getByRole('region', { name: 'Virtual devices' })).getAllByRole('region')
    expect(cards.map((c) => within(c).getByRole('heading', { level: 3 }).textContent)).toEqual([
      'Pulse oximeter',
      'Wrist bracelet',
      'BP cuff',
      'Thermometer',
      'Environment node',
      'Dosimeter',
    ])
    const lines = ['Live HR broadcast · GATT 0x180D · 0x2A37', 'GATT 0x1810 · char 0x2A35', 'GATT 0x1809 · char 0x2A1C', 'Wi-Fi · JSON', 'Wi-Fi · JSON']
    cards.slice(1).forEach((card, i) => {
      expect(card).toHaveTextContent(lines[i])
      expect(within(card).getByText('not built')).toBeInTheDocument()
      expect(within(card).queryByRole('slider')).toBeNull()
      expect(within(card).queryByRole('button')).toBeNull()
    })

    const inject = screen.getByRole('region', { name: 'Inject one reading' })
    expect(inject).toHaveTextContent('Pulse oximeter · source: synthetic')
    for (const field of [spo2Field(), pulseField()]) {
      expect(field).toHaveAttribute('type', 'text')
      expect(field).toHaveAttribute('inputMode', 'numeric')
      expect(field).toHaveValue('')
    }
  })

  it('AC15: lists the six scenarios in order, only Nominal day runnable', () => {
    renderSimulator()

    const rows = within(screen.getByRole('region', { name: 'Scenarios' })).getAllByRole('listitem')
    const names = ['Nominal day', 'CO₂ build-up', 'Resting HR drift', 'Orthostatic risk', 'Solar particle event', 'Sensor dropout']
    expect(rows).toHaveLength(6)
    rows.forEach((row, i) => {
      expect(row).toHaveTextContent(names[i])
      const run = within(row).getByRole('button', { name: 'Run' })
      if (i === 0) {
        expect(run).toBeEnabled()
        expect(within(row).queryByText('not built')).toBeNull()
      } else {
        expect(run).toBeDisabled()
        expect(within(row).getByText('not built')).toBeInTheDocument()
      }
    })
  })

  it('AC16: the oximeter card shows its topic, source, nominal value and the SpO₂ override slider', () => {
    renderSimulator()

    const card = oximeterCard()
    expect(card).toHaveTextContent('WebSocket JSON · crew/a1/oximeter')
    expect(card).toHaveTextContent('source: synthetic')
    expect(card).toHaveTextContent('97 % · 63 bpm')
    const slider = within(card).getByRole('slider', { name: 'SpO₂ override · 97 %' })
    expect(slider).toHaveAttribute('min', '80')
    expect(slider).toHaveAttribute('max', '100')
    expect(slider).toHaveAttribute('step', '1')
    expect(slider).toHaveValue('97')
  })

  it('AC17: the slider changes the label, the card value and the next tick, and publishes nothing itself', () => {
    const { publisher } = renderSimulator()

    fireEvent.change(screen.getByRole('slider'), { target: { value: '91' } })
    expect(screen.getByRole('slider', { name: 'SpO₂ override · 91 %' })).toBeInTheDocument()
    expect(oximeterCard()).toHaveTextContent('91 % · 63 bpm')
    expect(publisher.published).toHaveLength(0)

    fireEvent.click(within(scenarioRow('Nominal day')).getByRole('button', { name: 'Run' }))
    fireEvent.change(screen.getByRole('slider'), { target: { value: '93' } })
    advance(60_000)
    expect(publisher.published.map((m) => (m.payload as { spo2_pct: number }).spo2_pct)).toEqual([91, 93])

    fireEvent.change(spo2Field(), { target: { value: '85' } })
    fireEvent.click(publishButton())
    expect(oximeterCard()).toHaveTextContent('93 % · 63 bpm')
  })

  it('AC18: Run publishes one nominal reading at once and shows the running row and tag', () => {
    const { publisher } = renderSimulator()

    fireEvent.click(within(scenarioRow('Nominal day')).getByRole('button', { name: 'Run' }))

    expect(publisher.published.map((m) => m.topic)).toEqual(['crew/a1/oximeter'])
    expect(publisher.payloads()).toEqual(['{"id":"id-1","t":"2026-11-14T09:30:00.000Z","spo2_pct":97,"pulse_bpm":63,"src":"synthetic"}'])
    const row = scenarioRow('Nominal day')
    expect(row).toHaveTextContent('running · every 60 s')
    expect(within(row).getByRole('button', { name: 'Stop' })).toBeInTheDocument()
    expect(within(oximeterCard()).getByText('publishing')).toBeInTheDocument()
  })

  it('AC19: one more reading every 60 000 ms with a new id and the clock at that moment', () => {
    const { publisher } = renderSimulator()
    fireEvent.click(within(scenarioRow('Nominal day')).getByRole('button', { name: 'Run' }))

    advance(60_000)

    expect(publisher.payloads()[1]).toBe('{"id":"id-2","t":"2026-11-14T09:31:00.000Z","spo2_pct":97,"pulse_bpm":63,"src":"synthetic"}')
  })

  it('AC20: Stop ends the scenario, the row shows Run again and the tag goes', () => {
    const { publisher } = renderSimulator()
    fireEvent.click(within(scenarioRow('Nominal day')).getByRole('button', { name: 'Run' }))

    fireEvent.click(within(scenarioRow('Nominal day')).getByRole('button', { name: 'Stop' }))
    advance(60_000)

    expect(publisher.published).toHaveLength(1)
    expect(within(scenarioRow('Nominal day')).getByRole('button', { name: 'Run' })).toBeInTheDocument()
    expect(within(oximeterCard()).queryByText('publishing')).toBeNull()
  })

  it('AC20: unmounting while running publishes nothing more', () => {
    const { publisher, unmount } = renderSimulator()
    fireEvent.click(within(scenarioRow('Nominal day')).getByRole('button', { name: 'Run' }))

    unmount()
    advance(60_000)

    expect(publisher.published).toHaveLength(1)
  })

  it.each([
    ['91', '', true],
    ['91', '61', true],
    ['50', '20', true],
    ['100', '250', true],
    ['', '', false],
    ['91.0', '', false],
    [' 91', '', false],
    ['49', '', false],
    ['101', '', false],
    ['91', '19', false],
    ['91', '251', false],
    ['91', '6a', false],
  ])('AC21: SpO₂ %j and Pulse %j → Publish enabled %s', (spo2, pulse, enabled) => {
    renderSimulator()

    fireEvent.change(spo2Field(), { target: { value: spo2 } })
    fireEvent.change(pulseField(), { target: { value: pulse } })

    if (enabled) expect(publishButton()).toBeEnabled()
    else expect(publishButton()).toBeDisabled()
  })

  it('AC22: Publish sends the injected reading, keeps the fields, and a second click sends a new one', () => {
    const { publisher } = renderSimulator()
    fireEvent.change(spo2Field(), { target: { value: '91' } })
    fireEvent.change(pulseField(), { target: { value: '61' } })

    fireEvent.click(publishButton())
    advance(1_000)
    fireEvent.click(publishButton())

    expect(publisher.published.map((m) => m.topic)).toEqual(['crew/a1/oximeter', 'crew/a1/oximeter'])
    expect(publisher.payloads()).toEqual([
      '{"id":"id-1","t":"2026-11-14T09:30:00.000Z","spo2_pct":91,"pulse_bpm":61,"src":"synthetic"}',
      '{"id":"id-2","t":"2026-11-14T09:30:01.000Z","spo2_pct":91,"pulse_bpm":61,"src":"synthetic"}',
    ])
    expect(spo2Field()).toHaveValue('91')
    expect(pulseField()).toHaveValue('61')
  })

  it('AC22: with Pulse empty the payload has no pulse_bpm, while a scenario runs too', () => {
    const { publisher } = renderSimulator()
    fireEvent.click(within(scenarioRow('Nominal day')).getByRole('button', { name: 'Run' }))
    fireEvent.change(spo2Field(), { target: { value: '88' } })

    fireEvent.click(publishButton())

    expect(publisher.payloads()[1]).toBe('{"id":"id-2","t":"2026-11-14T09:30:00.000Z","spo2_pct":88,"src":"synthetic"}')
  })

  it('AC23: the traffic card starts empty, then adds each message on top in UTC', () => {
    renderSimulator()
    expect(logLines()).toEqual(['No traffic yet'])

    fireEvent.click(within(scenarioRow('Nominal day')).getByRole('button', { name: 'Run' }))
    advance(60_000)

    expect(logLines()).toEqual([
      '09:31:00  crew/a1/oximeter  {"id":"id-2","t":"2026-11-14T09:31:00.000Z","spo2_pct":97,"pulse_bpm":63,"src":"synthetic"}',
      '09:30:00  crew/a1/oximeter  {"id":"id-1","t":"2026-11-14T09:30:00.000Z","spo2_pct":97,"pulse_bpm":63,"src":"synthetic"}',
    ])
  })

  it('AC23: keeps the newest 50 lines, not-sent lines included', () => {
    const { publisher } = renderSimulator()
    fireEvent.change(spo2Field(), { target: { value: '91' } })
    for (let i = 0; i < 30; i++) fireEvent.click(publishButton())
    publisher.setState('disconnected')
    for (let i = 0; i < 25; i++) fireEvent.click(publishButton())

    const lines = logLines()
    expect(lines).toHaveLength(50)
    expect(lines[0]).toBe('09:30:00  not sent · device link disconnected')
    expect(lines.filter((l) => l.includes('not sent'))).toHaveLength(25)
  })

  it('AC24: an unsent tick is logged with the link state, the scenario keeps running and the tag reads not sending', () => {
    const { publisher } = renderSimulator(new FakePublisher('connecting'))

    fireEvent.click(within(scenarioRow('Nominal day')).getByRole('button', { name: 'Run' }))
    expect(logLines()[0]).toBe('09:30:00  not sent · device link connecting')
    expect(within(oximeterCard()).getByText('not sending')).toBeInTheDocument()

    publisher.setState('connected')
    expect(within(oximeterCard()).getByText('publishing')).toBeInTheDocument()

    publisher.setState('disconnected')
    advance(60_000)
    expect(logLines()[0]).toBe('09:31:00  not sent · device link disconnected')
    expect(scenarioRow('Nominal day')).toHaveTextContent('running · every 60 s')
    expect(publisher.published).toHaveLength(0)
  })

  it('AC24: an unsent inject is logged too', () => {
    renderSimulator(new FakePublisher('disconnected'))
    fireEvent.change(spo2Field(), { target: { value: '91' } })

    fireEvent.click(publishButton())

    expect(logLines()).toEqual(['09:30:00  not sent · device link disconnected'])
  })

  it('AC27: the theme toggle stores under simulator.theme and leaves crew-health.theme alone', () => {
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
