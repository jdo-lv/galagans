import { FakeWebSocket, fakeWebSocketCtor } from '../test/fakes'
import { DeviceLink } from './DeviceLink'
import { WebSocketReadingSource } from './WebSocketReadingSource'

beforeEach(() => FakeWebSocket.reset())

function connectedSource() {
  const source = new WebSocketReadingSource(new DeviceLink('ws://h/ws/devices', fakeWebSocketCtor))
  const listener = vi.fn()
  const unsubscribe = source.subscribe(listener)
  FakeWebSocket.last.open()
  return { source, listener, unsubscribe }
}

describe('WebSocketReadingSource', () => {
  it('AC9: starts the link on the first subscribe, once', () => {
    const source = new WebSocketReadingSource(new DeviceLink('ws://h/ws/devices', fakeWebSocketCtor))
    expect(FakeWebSocket.instances).toHaveLength(0)

    source.subscribe(() => {})
    source.subscribe(() => {})

    expect(FakeWebSocket.instances).toHaveLength(1)
  })

  it('AC9: unsubscribing removes the listener and keeps the link open', () => {
    const { listener, unsubscribe } = connectedSource()

    unsubscribe()
    FakeWebSocket.last.message('{"topic":"crew/a1/oximeter","payload":{"a":1}}')

    expect(listener).not.toHaveBeenCalled()
    expect(FakeWebSocket.instances).toHaveLength(1)
  })

  it('AC10: an oximeter frame passes its payload on', () => {
    const { listener } = connectedSource()

    FakeWebSocket.last.message('{"topic":"crew/a1/oximeter","payload":{"a":1}}')
    FakeWebSocket.last.message('{"topic":"crew/a1/oximeter","payload":null}')

    expect(listener.mock.calls).toEqual([[{ a: 1 }], [null]])
  })

  it.each([
    'not json',
    '[1]',
    '"text"',
    'null',
    '{"topic":"module/hab/env","payload":{"a":1}}',
    '{"topic":"crew/a1/oximeter"}',
  ])('AC10: frame %s calls no listener and throws nothing', (frame) => {
    const { listener } = connectedSource()

    expect(() => FakeWebSocket.last.message(frame)).not.toThrow()
    expect(listener).not.toHaveBeenCalled()
  })
})

describe('WebSocketReadingSource for another topic', () => {
  it('passes on only the payloads of its own topic', () => {
    const source = new WebSocketReadingSource(new DeviceLink('ws://h/ws/devices', fakeWebSocketCtor), 'crew/a1/bp')
    const listener = vi.fn()
    source.subscribe(listener)

    FakeWebSocket.last.message('{"topic":"crew/a1/oximeter","payload":{"a":1}}')
    FakeWebSocket.last.message('{"topic":"crew/a1/bp","payload":{"b":2}}')

    expect(listener).toHaveBeenCalledExactlyOnceWith({ b: 2 })
  })

  it('several sources share one link and one socket', () => {
    const link = new DeviceLink('ws://h/ws/devices', fakeWebSocketCtor)
    new WebSocketReadingSource(link, 'crew/a1/oximeter').subscribe(() => {})
    new WebSocketReadingSource(link, 'crew/a1/bp').subscribe(() => {})

    expect(FakeWebSocket.instances).toHaveLength(1)
  })
})
