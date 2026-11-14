import { FakeWebSocket, fakeWebSocketCtor } from '../test/fakes'
import { DeviceLink, type LinkState } from './DeviceLink'

const URL = 'ws://192.168.1.20:8080/ws/devices'

function linkWithStates() {
  const link = new DeviceLink(URL, fakeWebSocketCtor)
  const states: LinkState[] = []
  link.onState((state) => states.push(state))
  return { link, states }
}

beforeEach(() => {
  FakeWebSocket.reset()
  vi.useFakeTimers()
})
afterEach(() => vi.useRealTimers())

describe('DeviceLink', () => {
  it('AC6: is disconnected before start, and onState reports the current state at once', () => {
    const { states } = linkWithStates()

    expect(states).toEqual(['disconnected'])
    expect(FakeWebSocket.instances).toHaveLength(0)
  })

  it('AC6: start twice creates one socket; connecting → connected → disconnected', () => {
    const { link, states } = linkWithStates()

    link.start()
    link.start()
    expect(FakeWebSocket.instances.map((s) => s.url)).toEqual([URL])
    expect(states).toEqual(['disconnected', 'connecting'])

    FakeWebSocket.last.open()
    FakeWebSocket.last.close()
    expect(states).toEqual(['disconnected', 'connecting', 'connected', 'disconnected'])
  })

  it('AC6: 5 000 ms after close a new socket is created and the state is connecting again', () => {
    const { link, states } = linkWithStates()
    link.start()
    FakeWebSocket.last.open()
    FakeWebSocket.last.close()

    vi.advanceTimersByTime(4_999)
    expect(FakeWebSocket.instances).toHaveLength(1)
    vi.advanceTimersByTime(1)

    expect(FakeWebSocket.instances).toHaveLength(2)
    expect(states.at(-1)).toBe('connecting')
  })

  it('AC6: an error event throws nothing and changes no state', () => {
    const { link, states } = linkWithStates()
    link.start()
    FakeWebSocket.last.open()

    expect(() => FakeWebSocket.last.error()).not.toThrow()
    expect(states.at(-1)).toBe('connected')
  })

  it('AC6: a throwing constructor leaves it disconnected and retries after 5 000 ms', () => {
    const { link, states } = linkWithStates()
    FakeWebSocket.throwOnCreate = true

    expect(() => link.start()).not.toThrow()
    expect(states).toEqual(['disconnected'])

    FakeWebSocket.throwOnCreate = false
    vi.advanceTimersByTime(5_000)
    expect(FakeWebSocket.instances).toHaveLength(1)
    expect(states.at(-1)).toBe('connecting')
  })

  it('AC7: sends only while connected, and never later', () => {
    const link = new DeviceLink(URL, fakeWebSocketCtor)
    expect(link.send('before start')).toBe(false)

    link.start()
    expect(link.send('connecting')).toBe(false)

    FakeWebSocket.last.open()
    expect(link.send('frame')).toBe(true)
    expect(FakeWebSocket.last.sent).toEqual(['frame'])

    FakeWebSocket.last.close()
    expect(link.send('closed')).toBe(false)
    vi.advanceTimersByTime(5_000)
    FakeWebSocket.last.open()
    expect(FakeWebSocket.instances.flatMap((s) => s.sent)).toEqual(['frame'])
  })

  it('AC8: string frames reach the listeners; non-string data and unsubscribed listeners get nothing', () => {
    const link = new DeviceLink(URL, fakeWebSocketCtor)
    const kept = vi.fn()
    const dropped = vi.fn()
    link.onFrame(kept)
    link.onFrame(dropped)()
    link.start()

    FakeWebSocket.last.message('{"a":1}')
    FakeWebSocket.last.message(new Blob(['x']))

    expect(kept).toHaveBeenCalledExactlyOnceWith('{"a":1}')
    expect(dropped).not.toHaveBeenCalled()
  })
})
