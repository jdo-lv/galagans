import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CheckIn } from '../domain/checkIn'
import { mockReadings } from '../infrastructure/mockReadings'
import { RULES } from '../test/rules'
import { combinedHistory, FakePacketRepository, FakeRepository, FakeRuleSource } from '../test/fakes'
import { LatestReadingsReader } from './LatestReadingsReader'
import { toPacketItem } from './packetItems'
import { PacketSender } from './PacketSender'
import type { Synchronizer } from './Synchronizer'

const NOW = new Date('2026-11-14T07:31:00Z')
const stored = (id: string, fields: Partial<CheckIn>): CheckIn => ({ id, recordedAt: '2026-11-14T07:21:00.000Z', symptoms: [], ...fields })

describe('PacketSender', () => {
  let history: FakeRepository
  let readings: LatestReadingsReader
  let repository: FakePacketRepository
  let uplink: Synchronizer
  let sender: PacketSender

  beforeEach(() => {
    history = new FakeRepository()
    history.items.set('a', { checkIn: stored('a', { spo2Percent: 92, heartRateBpm: 63 }), pending: false })
    readings = new LatestReadingsReader(new FakeRuleSource(RULES), combinedHistory(history), () => NOW, mockReadings)
    repository = new FakePacketRepository()
    uplink = { sync: vi.fn(async () => {}), subscribe: () => () => {} }
    sender = new PacketSender(readings, repository, uplink, () => 'id-1', () => NOW)
  })

  it('AC21: stores one queued packet: id, builtAt, delay, trimmed note and the readings as items', async () => {
    const expectedItems = (await readings.read()).map(toPacketItem)

    const sent = await sender.send('  Slept badly.  ')

    expect(sent).toEqual({ id: 'id-1', builtAt: '2026-11-14T07:31:00.000Z', oneWayDelayMs: 845_000, note: 'Slept badly.', items: expectedItems })
    expect([...repository.items.values()]).toEqual([{ ...sent, state: 'queued' }])
    expect(sent.items.find((i) => i.key === 'spo2')).toMatchObject({ state: 'caution', ruleId: 'SPO-01', tier: 'CMO' })
  })

  it('AC21: a blank note is stored as ""', async () => {
    expect((await sender.send('   \n ')).note).toBe('')
  })

  it('AC21: the default id is a new UUID', async () => {
    const withUuid = new PacketSender(readings, repository, uplink, undefined, () => NOW)

    const [a, b] = [await withUuid.send(''), await withUuid.send('')]

    expect(a.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(a.id).not.toBe(b.id)
  })

  it('AC23: the stored items are a snapshot; later check-ins leave them as stored', async () => {
    const sent = await sender.send('')
    const before = structuredClone(repository.items.get(sent.id))

    history.items.set('b', { checkIn: stored('b', { spo2Percent: 85 }), pending: false })
    await readings.read()

    expect(repository.items.get(sent.id)).toEqual(before)
  })

  it('AC34: asks the uplink to sync after storing', async () => {
    await sender.send('')

    expect(uplink.sync).toHaveBeenCalledTimes(1)
  })

  it('AC24: nothing is stored and the uplink is not asked when the readings fail to load', async () => {
    history.failList = true

    await expect(sender.send('note')).rejects.toThrow()

    expect(repository.items.size).toBe(0)
    expect(uplink.sync).not.toHaveBeenCalled()
  })

  it('AC24: the uplink is not asked when the store rejects', async () => {
    repository.failAdd = true

    await expect(sender.send('note')).rejects.toThrow()

    expect(uplink.sync).not.toHaveBeenCalled()
  })
})
