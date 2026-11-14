import { describe, expect, it } from 'vitest'
import { FakeRepository } from '../test/fakes'
import { CheckInRecorder } from './CheckInRecorder'

describe('CheckInRecorder', () => {
  it('stores the check-in with an id and timestamp, then requests a sync', async () => {
    const repository = new FakeRepository()
    let syncs = 0
    const synchronizer = { sync: async () => void syncs++, subscribe: () => () => {} }
    const recorder = new CheckInRecorder(repository, synchronizer, () => 'id-1', () => new Date('2026-11-14T08:00:00Z'))

    const saved = await recorder.record({ mood: 4, symptoms: [] })

    expect(saved).toEqual({ id: 'id-1', recordedAt: '2026-11-14T08:00:00.000Z', mood: 4, symptoms: [] })
    expect(await repository.countPending()).toBe(1)
    expect(syncs).toBe(1)
  })
})
