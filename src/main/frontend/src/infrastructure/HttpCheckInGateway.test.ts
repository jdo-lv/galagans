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

  it('throws when the server answers with an error', async () => {
    const fetchFn = vi.fn(async () => new Response('', { status: 500 }))
    const gateway = new HttpCheckInGateway('', fetchFn as unknown as typeof fetch)

    await expect(gateway.send([checkIn('a')])).rejects.toThrow('500')
  })
})
