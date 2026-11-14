import { describe, expect, it } from 'vitest'
import { checkIn } from '../test/fakes'
import { IndexedDbCheckInRepository } from './IndexedDbCheckInRepository'

let counter = 0
const newRepository = () => new IndexedDbCheckInRepository(`test-db-${counter++}`)

describe('IndexedDbCheckInRepository', () => {
  it('lists added check-ins as pending without storage fields', async () => {
    const repository = newRepository()
    await repository.add(checkIn('a'))

    expect(await repository.listPending()).toEqual([checkIn('a')])
    expect(await repository.countPending()).toBe(1)
  })

  it('stops listing a check-in once it is marked synced', async () => {
    const repository = newRepository()
    await repository.add(checkIn('a'))
    await repository.add(checkIn('b'))

    await repository.markSynced(['a'])

    expect(await repository.listPending()).toEqual([checkIn('b')])
  })
})
