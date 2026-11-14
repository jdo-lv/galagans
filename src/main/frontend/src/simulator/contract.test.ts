import { PersonalHealthGateway } from '../application/PersonalHealthGateway'
import { DeviceLink } from '../infrastructure/DeviceLink'
import { WebSocketReadingSource } from '../infrastructure/WebSocketReadingSource'
import { FakeObservationRepository, FakeWebSocket, fakeWebSocketCtor } from '../test/fakes'
import { deviceMessage, nominalValues, SIM_DEVICES } from './simDevices'
import { WebSocketPublisher } from './WebSocketPublisher'

beforeEach(() => FakeWebSocket.reset())

const now = new Date('2026-11-14T09:30:00.000Z')

/** Simulator publisher and crew gateway on two fake sockets; frames are carried across by hand. */
function wire(sim: (typeof SIM_DEVICES)[number]) {
  const publisher = new WebSocketPublisher(new DeviceLink('ws://h/ws/devices', fakeWebSocketCtor))
  const simulatorSocket = FakeWebSocket.last
  simulatorSocket.open()
  const repository = new FakeObservationRepository()
  const link = new DeviceLink('ws://h/ws/devices', fakeWebSocketCtor)
  new PersonalHealthGateway(new WebSocketReadingSource(link, sim.device.topic), repository, () => now, sim.device).start()
  const tabletSocket = FakeWebSocket.last
  tabletSocket.open()
  return { publisher, repository, deliver: () => simulatorSocket.sent.forEach((frame) => tabletSocket.message(frame)) }
}

describe('simulator → gateway contract', () => {
  it('AC26: a published oximeter frame is stored by the Personal Health Gateway', async () => {
    const oximeter = SIM_DEVICES[0]
    const { publisher, repository, deliver } = wire(oximeter)

    publisher.publish(oximeter.device.topic, deviceMessage(oximeter, { spo2_pct: 91, pulse_bpm: 61 }, now, () => 'r-1'))
    deliver()

    await vi.waitFor(() => expect(repository.items.size).toBe(2))
    const spo2 = repository.items.get('oximeter:r-1:spo2Percent')
    const pulse = repository.items.get('oximeter:r-1:heartRateBpm')
    expect([spo2?.valueQuantity.value, spo2?.device.display]).toEqual([91, 'oximeter · synthetic'])
    expect([pulse?.valueQuantity.value, pulse?.device.display]).toEqual([61, 'oximeter · synthetic'])
  })

  it.each(SIM_DEVICES.map((s) => [s.name, s] as const))('%s: the nominal reading is stored field by field', async (_, sim) => {
    const { publisher, repository, deliver } = wire(sim)

    publisher.publish(sim.device.topic, deviceMessage(sim, nominalValues(sim), now, () => 'r-1'))
    deliver()

    await vi.waitFor(() => expect(repository.items.size).toBe(sim.fields.length))
    for (const { field, nominal } of sim.fields) {
      const stored = repository.items.get(`${sim.device.id}:r-1:${field.indicator}`)
      expect([stored?.valueQuantity.value, stored?.device.display]).toEqual([nominal, `${sim.device.label} · synthetic`])
    }
  })
})
