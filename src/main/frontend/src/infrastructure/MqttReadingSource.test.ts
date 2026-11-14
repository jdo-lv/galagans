import { EventEmitter } from 'node:events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { connect } = vi.hoisted(() => ({ connect: vi.fn() }))
vi.mock('mqtt', () => ({ connect }))

import { MqttReadingSource } from './MqttReadingSource'

class FakeClient extends EventEmitter {
  subscribe = vi.fn()
}

let client: FakeClient

beforeEach(() => {
  connect.mockReset()
  client = new FakeClient()
  connect.mockReturnValue(client)
})

describe('MqttReadingSource', () => {
  it('AC17: connects once, on the first subscribe, with a 5 s reconnect period', () => {
    const source = new MqttReadingSource('ws://broker:9001', () => 'http:')
    expect(connect).not.toHaveBeenCalled()

    source.subscribe(() => {})
    source.subscribe(() => {})

    expect(connect).toHaveBeenCalledOnce()
    expect(connect).toHaveBeenCalledWith('ws://broker:9001', { reconnectPeriod: 5000 })
  })

  it.each([undefined, ''])('AC18: URL %j falls back to ws://localhost:9001', (url) => {
    new MqttReadingSource(url, () => 'http:').subscribe(() => {})

    expect(connect).toHaveBeenCalledWith('ws://localhost:9001', { reconnectPeriod: 5000 })
  })

  it('AC19: a ws:// URL on an https: page creates no client, and unsubscribe still works', () => {
    const source = new MqttReadingSource('ws://broker:9001', () => 'https:')

    const unsubscribe = source.subscribe(() => {})
    source.subscribe(() => {})

    expect(connect).not.toHaveBeenCalled()
    expect(() => unsubscribe()).not.toThrow()
  })

  it('AC20: subscribes to the oximeter topic on every connect', () => {
    new MqttReadingSource('ws://broker:9001', () => 'http:').subscribe(() => {})

    client.emit('connect')
    client.emit('connect')

    expect(client.subscribe).toHaveBeenCalledTimes(2)
    expect(client.subscribe).toHaveBeenCalledWith('crew/a1/oximeter', { qos: 0 })
  })

  it('AC21: a JSON payload reaches the listener parsed; invalid JSON is dropped', () => {
    const listener = vi.fn()
    new MqttReadingSource('ws://broker:9001', () => 'http:').subscribe(listener)

    client.emit('message', 'crew/a1/oximeter', Buffer.from('{"a":1}'))
    expect(listener).toHaveBeenCalledExactlyOnceWith({ a: 1 })

    expect(() => client.emit('message', 'crew/a1/oximeter', Buffer.from('not json'))).not.toThrow()
    expect(listener).toHaveBeenCalledOnce()
  })

  it('AC22: a client error does not throw', () => {
    new MqttReadingSource('ws://broker:9001', () => 'http:').subscribe(() => {})

    expect(() => client.emit('error', new Error('broker down'))).not.toThrow()
  })

  it('stops calling an unsubscribed listener', () => {
    const listener = vi.fn()
    const unsubscribe = new MqttReadingSource('ws://broker:9001', () => 'http:').subscribe(listener)

    unsubscribe()
    client.emit('message', 'crew/a1/oximeter', Buffer.from('{}'))

    expect(listener).not.toHaveBeenCalled()
  })
})
