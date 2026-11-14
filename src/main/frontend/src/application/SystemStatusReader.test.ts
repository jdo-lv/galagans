import { describe, expect, it } from 'vitest'
import { JsonRuleSource } from '../infrastructure/JsonRuleSource'
import { FakeRepository, FakeRuleSource } from '../test/fakes'
import type { Placeholder, Rule } from '../domain/rules'
import { SystemStatusReader } from './SystemStatusReader'

describe('SystemStatusReader', () => {
  it('evaluates the stored check-ins against the loaded rules at the injected time', async () => {
    const repository = new FakeRepository()
    await repository.add({ id: 'a', recordedAt: '2026-11-14T08:00:00Z', spo2Percent: 88, symptoms: [] })
    const rules = new FakeRuleSource(await new JsonRuleSource().load())
    const reader = new SystemStatusReader(rules, repository, () => new Date('2026-11-14T09:00:00Z'))

    const [status] = await reader.read()

    expect(status).toMatchObject({ system: 'Respiratory', state: 'warning', value: 88 })
    expect(status.rule?.id).toBe('SPO-02')
  })

  it('AC5: a system with rules drops its placeholder and keeps its rule-table position', async () => {
    const [spo01] = await new JsonRuleSource().load()
    const sleepRule: Rule = { ...spo01, id: 'TEST-SLEEP', system: 'Sleep', indicator: 'sleepHours', validMin: 0, validMax: 24, below: 6 }
    const placeholders: Placeholder[] = [
      { system: 'Cognition', state: 'nominal', detail: 'c', source: 'synthetic' },
      { system: 'Sleep', state: 'nominal', detail: 's', source: 'synthetic' },
    ]
    const reader = new SystemStatusReader(new FakeRuleSource([spo01, sleepRule]), new FakeRepository(), undefined, placeholders)

    const statuses = await reader.read()

    expect(statuses.map((s) => [s.system, s.source])).toEqual([
      ['Respiratory', 'manual'],
      ['Sleep', 'manual'],
      ['Cognition', 'synthetic'],
    ])
  })

  it('AC7: placeholders can only be nominal and carry no rule (checked by tsc -b)', () => {
    const invalid = [
      // @ts-expect-error a placeholder is never a caution
      { system: 'Sleep', state: 'caution', detail: 's', source: 'synthetic' },
      // @ts-expect-error a placeholder has no rule to explain
      { system: 'Sleep', state: 'nominal', detail: 's', source: 'synthetic', rule: undefined },
    ] satisfies Placeholder[]
    expect(invalid).toHaveLength(2)
  })

  it('rejects when the rules fail to load', async () => {
    const rules = new FakeRuleSource()
    rules.fail = true

    await expect(new SystemStatusReader(rules, new FakeRepository()).read()).rejects.toThrow()
  })
})
