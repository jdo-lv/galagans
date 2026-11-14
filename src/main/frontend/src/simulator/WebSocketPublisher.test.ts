import { DeviceLink } from '../infrastructure/DeviceLink'
import { FakeWebSocket, fakeWebSocketCtor } from '../test/fakes'
import { WebSocketPublisher } from './WebSocketPublisher'

const URL = 'ws://192.168.1.20:8080/ws/devices'

beforeEach(() => FakeWebSocket.reset())

describe('WebSocketPublisher', () => {
  it('AC25: starts the link when created and exposes its URL and states', () => {
    const publisher = new WebSocketPublisher(new DeviceLink(URL, fakeWebSocketCtor))
    const states: string[] = []
    publisher.onState((state) => states.push(state))

    FakeWebSocket.last.open()

    expect(FakeWebSocket.instances).toHaveLength(1)
    expect(publisher.url).toBe(URL)
    expect(states).toEqual(['connecting', 'connected'])
  })

  it('AC25: publish sends the topic envelope and returns the link result', () => {
    const publisher = new WebSocketPublisher(new DeviceLink(URL, fakeWebSocketCtor))
    expect(publisher.publish('crew/a1/oximeter', { spo2_pct: 91 })).toBe(false)

    FakeWebSocket.last.open()

    expect(publisher.publish('crew/a1/oximeter', { spo2_pct: 91 })).toBe(true)
    expect(FakeWebSocket.last.sent).toEqual(['{"topic":"crew/a1/oximeter","payload":{"spo2_pct":91}}'])
  })
})
