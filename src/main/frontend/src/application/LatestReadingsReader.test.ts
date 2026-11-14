import { describe, expect, it } from 'vitest'
import type { CheckIn } from '../domain/checkIn'
import { READINGS, type ReadingPlaceholder } from '../domain/readings'
import type { Rule } from '../domain/rules'
import { mockReadings } from '../infrastructure/mockReadings'
import rules from '../infrastructure/rules.json'
import { FakeRepository, FakeRuleSource } from '../test/fakes'
import { LatestReadingsReader } from './LatestReadingsReader'

const now = new Date('2026-11-14T12:00:00Z')

async function read(checkIns: CheckIn[], { ruleRows = rules as Rule[], placeholders = [] as ReadingPlaceholder[] } = {}) {
  const repository = new FakeRepository()
  checkIns.forEach((c) => repository.items.set(c.id, { checkIn: c, pending: false }))
  return new LatestReadingsReader(new FakeRuleSource(ruleRows), repository, () => now, placeholders).read()
}

describe('LatestReadingsReader', () => {
  it('AC24: returns one reading per READINGS row, with the synthetic placeholders', async () => {
    const readings = await read([], { placeholders: mockReadings })

    expect(readings.map((r) => r.spec)).toEqual(READINGS)
    expect(readings.slice(4)).toEqual([
      { spec: READINGS[4], state: 'synthetic', text: '108/70', source: 'synthetic' },
      { spec: READINGS[5], state: 'synthetic', text: '2.3', source: 'synthetic' },
    ])
  })

  it('AC24: a row with no input and no placeholder has no data', async () => {
    const readings = await read([])

    expect(readings.slice(4).map((r) => [r.spec.key, r.state])).toEqual([
      ['bloodPressure', 'no-data'],
      ['cabinCo2', 'no-data'],
    ])
  })
})
