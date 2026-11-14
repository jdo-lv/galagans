import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FakeConnectivity, FakePacketGateway, FakePacketRepository, packet } from '../test/fakes'
import { PacketUplink } from './PacketUplink'

const SENT_AT = new Date('2026-11-14T07:40:00Z')

describe('PacketUplink', () => {
  let repository: FakePacketRepository
  let gateway: FakePacketGateway
  let connectivity: FakeConnectivity
  let uplink: PacketUplink

  beforeEach(async () => {
    repository = new FakePacketRepository()
    gateway = new FakePacketGateway()
    connectivity = new FakeConnectivity()
    uplink = new PacketUplink(repository, gateway, connectivity, () => SENT_AT)
    // Added newest first, so the order comes from builtAt.
    await repository.add(packet('b', '2026-11-14T07:35:00.000Z'))
    await repository.add(packet('a', '2026-11-14T07:31:00.000Z'))
  })

  it('AC34: sends each queued packet alone, oldest builtAt first, and marks it sent at now()', async () => {
    await uplink.sync()

    expect(gateway.sent).toEqual([packet('a', '2026-11-14T07:31:00.000Z'), packet('b', '2026-11-14T07:35:00.000Z')].map((p) => ({ ...p, state: 'queued' })))
    expect(await repository.listQueued()).toEqual([])
    expect(repository.items.get('a')).toMatchObject({ state: 'sent', sentAt: '2026-11-14T07:40:00.000Z' })
  })

  it('AC34: start() sends at once, and again on each online event', async () => {
    connectivity.online = false
    const stop = uplink.start()
    await uplink.sync()
    expect(gateway.sent).toHaveLength(0)

    connectivity.set(true)
    await uplink.sync()
    expect(gateway.sent.map((p) => p.id)).toEqual(['a', 'b'])

    await repository.add(packet('c', '2026-11-14T07:50:00.000Z'))
    connectivity.set(false)
    connectivity.set(true)
    await uplink.sync()
    expect(gateway.sent.map((p) => p.id)).toEqual(['a', 'b', 'c'])
    stop()
  })

  it('AC35: a failed send leaves that packet queued and still sends the next', async () => {
    gateway.failCalls.add(0)

    await uplink.sync()

    expect(gateway.sent.map((p) => p.id)).toEqual(['b'])
    expect((await repository.listQueued()).map((p) => p.id)).toEqual(['a'])
    expect(repository.items.get('b')?.state).toBe('sent')
  })

  it('AC36: calls during a pass run exactly one more pass, which includes them', async () => {
    let release!: () => void
    const blocked = new Promise<void>((resolve) => (release = resolve))
    const send = gateway.send.bind(gateway)
    vi.spyOn(gateway, 'send').mockImplementationOnce(async (p) => {
      await blocked
      return send(p)
    })
    const listQueued = vi.spyOn(repository, 'listQueued')
    let passes = 0
    uplink.subscribe(() => passes++)

    const first = uplink.sync()
    await vi.waitFor(() => expect(gateway.send).toHaveBeenCalledTimes(1))
    await repository.add(packet('c', '2026-11-14T07:50:00.000Z'))
    const second = uplink.sync()
    const third = uplink.sync()
    release()

    await first
    expect(passes).toBe(1)
    expect(gateway.sent.map((p) => p.id)).toEqual(['a', 'b'])
    await Promise.all([second, third])
    expect(passes).toBe(2)
    expect(listQueued).toHaveBeenCalledTimes(2)
    expect(gateway.sent.map((p) => p.id)).toEqual(['a', 'b', 'c'])
  })

  it('AC36: listeners run after every pass, also an empty one', async () => {
    let passes = 0
    uplink.subscribe(() => passes++)

    await uplink.sync()
    await uplink.sync()

    expect(passes).toBe(2)
  })

  it('AC37: offline, nothing is sent and the packets stay queued', async () => {
    connectivity.online = false

    await uplink.sync()

    expect(gateway.calls).toBe(0)
    expect((await repository.listQueued()).map((p) => p.id)).toEqual(['a', 'b'])
  })
})
