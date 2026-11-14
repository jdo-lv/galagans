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

const card = (name: string) => screen.getByRole('region', { name })
const oximeterCard = () => card('Pulse oximeter')
const oximeterSlider = () => within(oximeterCard()).getByRole('slider')
const oximeterPayloads = (publisher: FakePublisher) => publisher.published.filter((m) => m.topic === 'crew/a1/oximeter').map((m) => JSON.stringify(m.payload))
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

  it('AC14: lists the six devices in order, each with its topic, nominal value and override slider, and an empty inject form', () => {
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
    const expected = [
      ['crew/a1/oximeter', '97 % · 63 bpm', 'SpO₂ override · 97 %'],
      ['crew/a1/wrist/hr', '63 bpm', 'Heart rate override · 63 bpm'],
      ['crew/a1/bp', '108/70 mmHg · 63 bpm', 'Systolic override · 108 mmHg'],
      ['crew/a1/thermometer', '36.8 °C', 'Temperature override · 36.8 °C'],
      ['module/hab/env', '2.3 mmHg · 22.0 °C · 45 % RH', 'CO₂ override · 2.3 mmHg'],
      ['module/hab/dose', '0.50 mSv/day', 'Dose rate override · 0.50 mSv/day'],
    ]
    cards.forEach((c, i) => {
      const [topic, value, slider] = expected[i]
      expect(c).toHaveTextContent(`WebSocket JSON · ${topic}`)
      expect(c).toHaveTextContent(value)
      expect(c).toHaveTextContent('source: synthetic')
      expect(within(c).getByRole('slider', { name: slider })).toBeInTheDocument()
      expect(within(c).queryByText('not built')).toBeNull()
    })

    const inject = screen.getByRole('region', { name: 'Inject one reading' })
    expect(inject).toHaveTextContent('Pulse oximeter · source: synthetic')
    expect(within(inject).getByRole('combobox', { name: 'Device' })).toHaveValue('oximeter')
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

    fireEvent.change(oximeterSlider(), { target: { value: '91' } })
    expect(within(oximeterCard()).getByRole('slider', { name: 'SpO₂ override · 91 %' })).toBeInTheDocument()
    expect(oximeterCard()).toHaveTextContent('91 % · 63 bpm')
    expect(publisher.published).toHaveLength(0)

    fireEvent.click(within(scenarioRow('Nominal day')).getByRole('button', { name: 'Run' }))
    fireEvent.change(oximeterSlider(), { target: { value: '93' } })
    advance(60_000)
    expect(oximeterPayloads(publisher).map((p) => JSON.parse(p).spo2_pct)).toEqual([91, 93])

    fireEvent.change(spo2Field(), { target: { value: '85' } })
    fireEvent.click(publishButton())
    expect(oximeterCard()).toHaveTextContent('93 % · 63 bpm')
  })

  it('AC18: Run publishes every device\'s nominal reading at once and shows the running row and tags', () => {
    const { publisher } = renderSimulator()

    fireEvent.click(within(scenarioRow('Nominal day')).getByRole('button', { name: 'Run' }))

    expect(publisher.published.map((m) => m.topic)).toEqual([
      'crew/a1/oximeter',
      'crew/a1/wrist/hr',
      'crew/a1/bp',
      'crew/a1/thermometer',
      'module/hab/env',
      'module/hab/dose',
    ])
    expect(publisher.payloads()).toEqual([
      '{"id":"id-1","t":"2026-11-14T09:30:00.000Z","spo2_pct":97,"pulse_bpm":63,"src":"synthetic"}',
      '{"id":"id-2","t":"2026-11-14T09:30:00.000Z","hr_bpm":63,"src":"synthetic"}',
      '{"id":"id-3","t":"2026-11-14T09:30:00.000Z","systolic_mmhg":108,"diastolic_mmhg":70,"pulse_bpm":63,"src":"synthetic"}',
      '{"id":"id-4","t":"2026-11-14T09:30:00.000Z","temp_c":36.8,"src":"synthetic"}',
      '{"id":"id-5","t":"2026-11-14T09:30:00.000Z","co2_mmhg_1h":2.3,"temp_c":22,"rh_pct":45,"src":"synthetic"}',
      '{"id":"id-6","t":"2026-11-14T09:30:00.000Z","dose_rate_msv_day":0.5,"src":"synthetic"}',
    ])
    const row = scenarioRow('Nominal day')
    expect(row).toHaveTextContent('running · every 60 s')
    expect(within(row).getByRole('button', { name: 'Stop' })).toBeInTheDocument()
    expect(screen.getAllByText('publishing')).toHaveLength(6)
  })

  it('AC19: one more reading every 60 000 ms with a new id and the clock at that moment', () => {
    const { publisher } = renderSimulator()
    fireEvent.click(within(scenarioRow('Nominal day')).getByRole('button', { name: 'Run' }))

    advance(60_000)

    expect(publisher.published).toHaveLength(12)
    expect(oximeterPayloads(publisher)[1]).toBe('{"id":"id-7","t":"2026-11-14T09:31:00.000Z","spo2_pct":97,"pulse_bpm":63,"src":"synthetic"}')
  })

  it('AC20: Stop ends the scenario, the row shows Run again and the tag goes', () => {
    const { publisher } = renderSimulator()
    fireEvent.click(within(scenarioRow('Nominal day')).getByRole('button', { name: 'Run' }))

    fireEvent.click(within(scenarioRow('Nominal day')).getByRole('button', { name: 'Stop' }))
    advance(60_000)

    expect(publisher.published).toHaveLength(6)
    expect(within(scenarioRow('Nominal day')).getByRole('button', { name: 'Run' })).toBeInTheDocument()
    expect(within(oximeterCard()).queryByText('publishing')).toBeNull()
  })

  it('AC20: unmounting while running publishes nothing more', () => {
    const { publisher, unmount } = renderSimulator()
    fireEvent.click(within(scenarioRow('Nominal day')).getByRole('button', { name: 'Run' }))

    unmount()
    advance(60_000)

    expect(publisher.published).toHaveLength(6)
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

    expect(publisher.payloads()[6]).toBe('{"id":"id-7","t":"2026-11-14T09:30:00.000Z","spo2_pct":88,"src":"synthetic"}')
  })

  it('AC23: the traffic card starts empty, then adds each message on top in UTC', () => {
    renderSimulator()
    expect(logLines()).toEqual(['No traffic yet'])

    fireEvent.click(within(scenarioRow('Nominal day')).getByRole('button', { name: 'Run' }))

    const lines = logLines()
    expect(lines).toHaveLength(6)
    expect(lines[0]).toBe('09:30:00  module/hab/dose  {"id":"id-6","t":"2026-11-14T09:30:00.000Z","dose_rate_msv_day":0.5,"src":"synthetic"}')
    expect(lines[5]).toBe('09:30:00  crew/a1/oximeter  {"id":"id-1","t":"2026-11-14T09:30:00.000Z","spo2_pct":97,"pulse_bpm":63,"src":"synthetic"}')
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
    expect(screen.getAllByText('not sending')).toHaveLength(6)

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

  it('each device\'s slider changes its own next reading: CO₂ 3.4 mmHg on the environment node', () => {
    const { publisher } = renderSimulator()

    fireEvent.change(within(card('Environment node')).getByRole('slider'), { target: { value: '3.4' } })
    fireEvent.click(within(scenarioRow('Nominal day')).getByRole('button', { name: 'Run' }))

    expect(card('Environment node')).toHaveTextContent('3.4 mmHg · 22.0 °C · 45 % RH')
    const env = publisher.published.find((m) => m.topic === 'module/hab/env')!
    expect(env.payload).toMatchObject({ co2_mmhg_1h: 3.4, temp_c: 22, rh_pct: 45 })
  })

  it('inject from another device: BP cuff needs systolic and diastolic, pulse is optional', () => {
    const { publisher } = renderSimulator()
    const inject = screen.getByRole('region', { name: 'Inject one reading' })

    fireEvent.change(within(inject).getByRole('combobox', { name: 'Device' }), { target: { value: 'bp-cuff' } })
    expect(inject).toHaveTextContent('BP cuff · source: synthetic')
    fireEvent.change(screen.getByLabelText('Systolic mmHg'), { target: { value: '150' } })
    expect(publishButton()).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Diastolic mmHg'), { target: { value: '95' } })
    fireEvent.click(publishButton())

    expect(publisher.published).toEqual([
      { topic: 'crew/a1/bp', payload: { id: 'id-1', t: '2026-11-14T09:30:00.000Z', systolic_mmhg: 150, diastolic_mmhg: 95, src: 'synthetic' } },
    ])
  })

  it('inject a decimal from the thermometer; switching device clears the fields', () => {
    const { publisher } = renderSimulator()
    const pick = () => within(screen.getByRole('region', { name: 'Inject one reading' })).getByRole('combobox', { name: 'Device' })
    fireEvent.change(spo2Field(), { target: { value: '91' } })

    fireEvent.change(pick(), { target: { value: 'thermometer' } })
    const temp = screen.getByLabelText('Temperature °C')
    expect(temp).toHaveValue('')
    expect(temp).toHaveAttribute('inputMode', 'decimal')
    fireEvent.change(temp, { target: { value: '38.4' } })
    fireEvent.click(publishButton())

    expect(publisher.published).toEqual([{ topic: 'crew/a1/thermometer', payload: { id: 'id-1', t: '2026-11-14T09:30:00.000Z', temp_c: 38.4, src: 'synthetic' } }])
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
