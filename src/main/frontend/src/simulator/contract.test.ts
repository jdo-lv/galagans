import { PersonalHealthGateway } from '../application/PersonalHealthGateway'
import { DeviceLink } from '../infrastructure/DeviceLink'
import { WebSocketReadingSource } from '../infrastructure/WebSocketReadingSource'
import { FakeObservationRepository, FakeWebSocket, fakeWebSocketCtor } from '../test/fakes'
import { oximeterMessage } from './oximeterMessage'
import { WebSocketPublisher } from './WebSocketPublisher'

beforeEach(() => FakeWebSocket.reset())

describe('simulator → gateway contract', () => {
  it('AC26: a published oximeter frame is stored by the Personal Health Gateway', async () => {
    const now = new Date('2026-11-14T09:30:00.000Z')
    const publisher = new WebSocketPublisher(new DeviceLink('ws://h/ws/devices', fakeWebSocketCtor))
    const simulatorSocket = FakeWebSocket.last
    simulatorSocket.open()
    const repository = new FakeObservationRepository()
    const gateway = new PersonalHealthGateway(new WebSocketReadingSource(new DeviceLink('ws://h/ws/devices', fakeWebSocketCtor)), repository, () => now)
    gateway.start()
    const tabletSocket = FakeWebSocket.last
    tabletSocket.open()

    publisher.publish('crew/a1/oximeter', oximeterMessage({ spo2: 91, pulse: 61 }, now, () => 'r-1'))
    tabletSocket.message(simulatorSocket.sent[0])

    await vi.waitFor(() => expect(repository.items.size).toBe(2))
    const spo2 = repository.items.get('oximeter:r-1:spo2Percent')
    const pulse = repository.items.get('oximeter:r-1:heartRateBpm')
    expect([spo2?.valueQuantity.value, spo2?.device.display]).toEqual([91, 'oximeter · synthetic'])
    expect([pulse?.valueQuantity.value, pulse?.device.display]).toEqual([61, 'oximeter · synthetic'])
  })
})
