import { describe, expect, it, vi } from 'vitest'
import { checkIn } from '../test/fakes'
import { HttpCheckInGateway } from './HttpCheckInGateway'

describe('HttpCheckInGateway', () => {
  it('posts the check-ins and returns the accepted ids', async () => {
    const fetchFn = vi.fn(async () => new Response(JSON.stringify({ acceptedIds: ['a'] }), { status: 200 }))
    const gateway = new HttpCheckInGateway('', fetchFn as unknown as typeof fetch)

    expect(await gateway.send([checkIn('a')])).toEqual(['a'])
    expect(fetchFn).toHaveBeenCalledWith('/api/checkins/sync', expect.objectContaining({ method: 'POST' }))
  })

  it('AC38: posts the PVT fields unchanged (#16)', async () => {
    const fetchFn = vi.fn(async () => new Response(JSON.stringify({ acceptedIds: ['p'] }), { status: 200 }))
    const gateway = new HttpCheckInGateway('', fetchFn as unknown as typeof fetch)
    const pvt = { ...checkIn('p'), pvtMedianMs: 312, pvtLapses: 6, pvtFalseStarts: 1 }

    await gateway.send([pvt])

    const init = (fetchFn.mock.calls[0] as unknown as [string, RequestInit])[1]
    expect(JSON.parse(init.body as string)).toEqual({ checkIns: [pvt] })
  })

  it('throws when the server answers with an error', async () => {
    const fetchFn = vi.fn(async () => new Response('', { status: 500 }))
    const gateway = new HttpCheckInGateway('', fetchFn as unknown as typeof fetch)

    await expect(gateway.send([checkIn('a')])).rejects.toThrow('500')
  })
})
