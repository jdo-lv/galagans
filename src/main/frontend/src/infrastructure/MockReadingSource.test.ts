import { PersonalHealthGateway } from '../application/PersonalHealthGateway'
import { DEVICES, type DeviceId } from '../domain/devices'
import type { Status } from '../domain/rules'
import { FakeObservationRepository } from '../test/fakes'
import { RULES } from '../test/rules'
import { MockReadingSource } from './MockReadingSource'

const NOW = new Date('2026-11-14T09:30:00.000Z')
const device = (id: DeviceId) => DEVICES.find((d) => d.id === id)!

function source(id: DeviceId, levels: Partial<Record<DeviceId, Status>> = {}) {
  let n = 0
  const scenario = { levels: vi.fn(() => levels) }
  return { scenario, source: new MockReadingSource(device(id), scenario, RULES, () => 0, () => new Date(Date.now()), () => `id-${++n}`) }
}

beforeEach(() => vi.useFakeTimers({ now: NOW }))
afterEach(() => vi.useRealTimers())

describe('MockReadingSource', () => {
  it('AC27: emits a device message at the first subscribe, then every 1 000 ms, at the scenario levels', () => {
    const { source: s } = source('oximeter', { bracelet: 'check' })
    const messages: unknown[] = []

    s.subscribe((m) => messages.push(m))
    expect(messages).toEqual([{ id: 'id-1', t: '2026-11-14T09:30:00.000Z', spo2_pct: 95, pulse_bpm: 101, src: 'synthetic' }])

    vi.advanceTimersByTime(2_000)
    expect(messages).toEqual([
      { id: 'id-1', t: '2026-11-14T09:30:00.000Z', spo2_pct: 95, pulse_bpm: 101, src: 'synthetic' },
      { id: 'id-2', t: '2026-11-14T09:30:01.000Z', spo2_pct: 95, pulse_bpm: 101, src: 'synthetic' },
      { id: 'id-3', t: '2026-11-14T09:30:02.000Z', spo2_pct: 95, pulse_bpm: 101, src: 'synthetic' },
    ])
  })

  it('AC27: a second listener shares the timer; removing the last listener stops it', () => {
    const { source: s, scenario } = source('thermometer')
    const a = vi.fn()
    const b = vi.fn()

    const stopA = s.subscribe(a)
    const stopB = s.subscribe(b)
    vi.advanceTimersByTime(1_000)
    stopA()
    vi.advanceTimersByTime(1_000)
    stopB()
    vi.advanceTimersByTime(5_000)

    expect([a.mock.calls.length, b.mock.calls.length]).toEqual([2, 2])
    expect(scenario.levels).toHaveBeenCalledTimes(3)
  })

  it('AC29: the gateway stores mock messages as "<device label> · synthetic"', async () => {
    const repository = new FakeObservationRepository()
    const { source: s } = source('env-node')
    new PersonalHealthGateway(s, repository, () => NOW, device('env-node')).start()

    await vi.waitFor(() => expect(repository.items.size).toBe(3))

    expect([...repository.items.values()].map((o) => o.device.display)).toEqual([
      'environment node · synthetic',
      'environment node · synthetic',
      'environment node · synthetic',
    ])
  })
})
