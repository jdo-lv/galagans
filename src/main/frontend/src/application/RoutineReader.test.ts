import { describe, expect, it } from 'vitest'
import type { RoutinePlaceholder } from '../domain/routine'
import { FakeRepository } from '../test/fakes'
import { RoutineReader } from './RoutineReader'

const at = (h: number, m = 0) => new Date(2026, 10, 14, h, m)
const placeholder = (label: string): RoutinePlaceholder => ({ kind: 'placeholder', label, detail: 'd', source: 'synthetic' })

describe('RoutineReader', () => {
  it('AC20: lists the check-in item, the PVT item (#16), then the placeholders in order', async () => {
    const reader = new RoutineReader(new FakeRepository(), () => at(8), [placeholder('A'), placeholder('B')])

    const items = await reader.read()

    expect(items.map((i) => i.label)).toEqual(['Morning check-in', 'PVT (3 min)', 'A', 'B'])
  })

  it('AC21: with no placeholders returns the check-in and PVT items (#16)', async () => {
    const items = await new RoutineReader(new FakeRepository(), () => at(8)).read()

    expect(items).toHaveLength(2)
    expect(items[0]).toMatchObject({ kind: 'check-in', state: 'due' })
    expect(items[1]).toEqual({ kind: 'pvt', label: 'PVT (3 min)' })
  })

  it('AC22: a check-in with an unparseable recordedAt is ignored', async () => {
    const repository = new FakeRepository()
    await repository.add({ id: 'a', recordedAt: 'not a date', symptoms: [] })

    const [item] = await new RoutineReader(repository, () => at(8)).read()

    expect(item).toMatchObject({ state: 'due' })
  })
})
