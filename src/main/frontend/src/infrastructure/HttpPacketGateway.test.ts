import { describe, expect, it, vi } from 'vitest'
import type { StoredPacket } from '../domain/packet'
import { HttpPacketGateway } from './HttpPacketGateway'

const stored: StoredPacket = {
  id: 'p1',
  builtAt: '2026-11-14T07:31:00.000Z',
  oneWayDelayMs: 845_000,
  note: 'Slept badly.',
  items: [{ key: 'spo2', label: 'SpO₂', unit: '%', state: 'check', value: 92, recordedAt: '2026-11-14T07:21:00.000Z', source: 'manual', ruleId: 'SPO-01', tier: 'CMO' }],
  state: 'sent',
  sentAt: '2026-11-14T07:40:00.000Z',
}

const gatewayAnswering = (response: Response) => {
  const fetchFn = vi.fn(async () => response)
  return { fetchFn, gateway: new HttpPacketGateway('', fetchFn as unknown as typeof fetch) }
}

describe('HttpPacketGateway', () => {
  it('AC38: POSTs the packet as JSON without state or sentAt', async () => {
    const { fetchFn, gateway } = gatewayAnswering(new Response(JSON.stringify({ id: 'p1' }), { status: 200 }))

    await gateway.send(stored)

    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/packets')
    expect(init.method).toBe('POST')
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(JSON.parse(init.body as string)).toEqual({
      id: 'p1',
      builtAt: '2026-11-14T07:31:00.000Z',
      oneWayDelayMs: 845_000,
      note: 'Slept badly.',
      items: stored.items,
    })
  })

  it('AC38: resolves on a 2xx and ignores the body', async () => {
    const { gateway } = gatewayAnswering(new Response('not json', { status: 201 }))

    await expect(gateway.send(stored)).resolves.toBeUndefined()
  })

  it.each([400, 500])('AC38: throws on %i', async (status) => {
    const { gateway } = gatewayAnswering(new Response('', { status }))

    await expect(gateway.send(stored)).rejects.toThrow(String(status))
  })
})
