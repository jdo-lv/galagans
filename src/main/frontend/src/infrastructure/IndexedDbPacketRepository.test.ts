import { openDB } from 'idb'
import { describe, expect, it } from 'vitest'
import { checkIn, packet } from '../test/fakes'
import { IndexedDbCheckInRepository } from './IndexedDbCheckInRepository'
import { IndexedDbPacketRepository } from './IndexedDbPacketRepository'

let counter = 0
const newRepository = () => new IndexedDbPacketRepository(`test-packets-${counter++}`)

const A = packet('a', '2026-11-14T07:31:00.000Z')
const B = packet('b', '2026-11-14T07:40:00.000Z')

describe('IndexedDbPacketRepository', () => {
  it('AC39: latest() is undefined when the store is empty', async () => {
    expect(await newRepository().latest()).toBeUndefined()
  })

  it('AC39: an added packet is listed as queued', async () => {
    const repository = newRepository()

    await repository.add(A)

    expect(await repository.listQueued()).toEqual([{ ...A, state: 'queued' }])
  })

  it('AC39: queued packets come oldest builtAt first', async () => {
    const repository = newRepository()

    await repository.add(B)
    await repository.add(A)

    expect((await repository.listQueued()).map((p) => p.id)).toEqual(['a', 'b'])
  })

  it('AC39: a sent packet leaves the queue and is the latest with its sentAt', async () => {
    const repository = newRepository()
    await repository.add(A)

    await repository.markSent('a', '2026-11-14T07:35:00.000Z')

    expect(await repository.listQueued()).toEqual([])
    expect(await repository.latest()).toEqual({ ...A, state: 'sent', sentAt: '2026-11-14T07:35:00.000Z' })
  })

  it('AC39: latest() is the packet with the newer builtAt', async () => {
    const repository = newRepository()

    await repository.add(B)
    await repository.add(A)

    expect((await repository.latest())?.id).toBe('b')
  })

  it('AC40: packets live in their own database, so the check-in database is untouched', async () => {
    const checkIns = new IndexedDbCheckInRepository('crew-health')
    await checkIns.add(checkIn('c1'))

    const packets = new IndexedDbPacketRepository()
    await packets.add(A)

    expect(await checkIns.list()).toEqual([checkIn('c1')])
    const checkInDb = await openDB('crew-health')
    expect(checkInDb.version).toBe(1)
    expect([...checkInDb.objectStoreNames]).toEqual(['checkIns'])
    checkInDb.close()

    const packetDb = await openDB('crew-health-packets')
    expect([...packetDb.objectStoreNames]).toEqual(['packets'])
    expect(packetDb.transaction('packets').store.keyPath).toBe('id')
    expect(await packetDb.get('packets', 'a')).toMatchObject({ id: 'a', state: 'queued' })
    packetDb.close()
  })
})
