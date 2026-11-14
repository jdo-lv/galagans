import { describe, expect, it } from 'vitest'
import { FakePacketRepository, packet } from '../test/fakes'
import { LastPacketReader } from './LastPacketReader'

describe('LastPacketReader', () => {
  it('AC32: reads the packet with the newest builtAt', async () => {
    const repository = new FakePacketRepository()
    await repository.add(packet('new', '2026-11-14T07:40:00.000Z'))
    await repository.add(packet('old', '2026-11-14T07:31:00.000Z'))
    const now = new Date('2026-11-14T08:00:00Z')

    const reader = new LastPacketReader(repository, () => now)

    expect((await reader.read())?.id).toBe('new')
    expect(reader.now()).toBe(now)
  })

  it('AC25: reads undefined when no packet was stored', async () => {
    expect(await new LastPacketReader(new FakePacketRepository()).read()).toBeUndefined()
  })
})
