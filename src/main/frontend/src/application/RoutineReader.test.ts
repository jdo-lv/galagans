import { describe, expect, it } from 'vitest'
import type { RoutinePlaceholder } from '../domain/routine'
import { FakeRepository } from '../test/fakes'
import { RoutineReader } from './RoutineReader'

const at = (h: number, m = 0) => new Date(2026, 10, 14, h, m)
const placeholder = (label: string): RoutinePlaceholder => ({ kind: 'placeholder', label, detail: 'd', source: 'synthetic' })

describe('RoutineReader', () => {
  it('AC20: lists the check-in item, then the placeholders in order', async () => {
    const reader = new RoutineReader(new FakeRepository(), () => at(8), [placeholder('A'), placeholder('B')])

    const items = await reader.read()

    expect(items.map((i) => i.label)).toEqual(['Morning check-in', 'A', 'B'])
  })

  it('AC21: with no placeholders returns only the check-in item', async () => {
    const items = await new RoutineReader(new FakeRepository(), () => at(8)).read()

    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ kind: 'check-in', state: 'due' })
  })

  it('AC22: a check-in with an unparseable recordedAt is ignored', async () => {
    const repository = new FakeRepository()
    await repository.add({ id: 'a', recordedAt: 'not a date', symptoms: [] })

    const [item] = await new RoutineReader(repository, () => at(8)).read()

    expect(item).toMatchObject({ state: 'due' })
  })
})
