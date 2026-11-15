import { describe, expect, it, vi } from 'vitest'
import { FakePacketRepository, packet } from '../test/fakes'
import { PacketHistoryReader } from './PacketHistoryReader'

describe('PacketHistoryReader', () => {
  it('AC20: read() returns listAll() as it is, and now() is the injected clock', async () => {
    const repository = new FakePacketRepository()
    await repository.add(packet('old', '2026-11-14T07:00:00.000Z'))
    await repository.add(packet('new', '2026-11-14T07:50:00.000Z'))
    const listed = await repository.listAll()
    // Oldest first on purpose: the reader must not sort again.
    const reversed = [...listed].reverse()
    vi.spyOn(repository, 'listAll').mockResolvedValue(reversed)
    const now = new Date('2026-11-14T08:00:00Z')

    const reader = new PacketHistoryReader(repository, () => now)

    expect(listed.map((p) => p.id)).toEqual(['new', 'old'])
    expect(await reader.read()).toBe(reversed)
    expect(reader.now()).toBe(now)
  })
})
