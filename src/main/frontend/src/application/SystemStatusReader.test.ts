import { describe, expect, it } from 'vitest'
import { JsonRuleSource } from '../infrastructure/JsonRuleSource'
import { FakeRepository, FakeRuleSource } from '../test/fakes'
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

  it('rejects when the rules fail to load', async () => {
    const rules = new FakeRuleSource()
    rules.fail = true

    await expect(new SystemStatusReader(rules, new FakeRepository()).read()).rejects.toThrow()
  })
})
