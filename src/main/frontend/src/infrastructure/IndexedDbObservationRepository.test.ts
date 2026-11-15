import { describe, expect, it } from 'vitest'
import type { Observation } from '../domain/observation'
import { IndexedDbObservationRepository } from './IndexedDbObservationRepository'

let counter = 0
const newRepository = () => new IndexedDbObservationRepository(`test-observations-${counter++}`)

const observation = (id: string, value = 91): Observation => ({
  resourceType: 'Observation',
  id,
  status: 'final',
  code: { text: 'spo2Percent' },
  valueQuantity: { value, unit: '%' },
  effectiveDateTime: '2026-11-14T09:59:30Z',
  device: { display: 'oximeter · synthetic' },
})

describe('IndexedDbObservationRepository', () => {
  it('lists what was put', async () => {
    const repository = newRepository()
    await repository.put(observation('a'))
    await repository.put(observation('b'))

    expect((await repository.list()).map((o) => o.id).sort()).toEqual(['a', 'b'])
  })

  it('replaces an Observation put again with the same id', async () => {
    const repository = newRepository()
    await repository.put(observation('a', 91))
    await repository.put(observation('a', 92))

    expect(await repository.list()).toEqual([observation('a', 92)])
  })

  it('#43 AC25: deleteBefore removes every Observation strictly older than the time, whatever its offset', async () => {
    const repository = newRepository()
    const at = (id: string, effectiveDateTime: string) => ({ ...observation(id), effectiveDateTime })
    await repository.put(at('old', '2026-11-14T09:49:59Z'))
    await repository.put(at('offset', '2026-11-14T10:49:00+01:00'))
    await repository.put(at('edge', '2026-11-14T09:50:00.000Z'))
    await repository.put(at('new', '2026-11-14T09:59:30Z'))

    await repository.deleteBefore('2026-11-14T09:50:00.000Z')

    expect((await repository.list()).map((o) => o.id).sort()).toEqual(['edge', 'new'])
  })
})
