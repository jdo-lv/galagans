import { expect, it } from 'vitest'
import { HAZARDS } from '../domain/hazards'
import { mockStatuses } from './mockStatuses'
import rules from './rules.json'

it('every system a hazard names is a row of the Body systems list', () => {
  const rows = new Set([...rules.map((r) => r.system), ...mockStatuses.map((p) => p.system)])
  const named = HAZARDS.flatMap((h) => (h.systems === 'all' ? [] : h.systems))

  expect(named.filter((system) => !rows.has(system))).toEqual([])
})
