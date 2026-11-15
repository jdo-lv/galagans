import { describe, expect, it } from 'vitest'
import { JsonRuleSource } from '../infrastructure/JsonRuleSource'
import type { Observation } from '../domain/observation'
import { combinedHistory, FakeObservationRepository, FakeRepository, FakeRuleSource } from '../test/fakes'
import { CHART_WINDOW_MS, type Placeholder, type Rule } from '../domain/rules'
import { mockStatuses } from '../infrastructure/mockStatuses'
import { SystemStatusReader } from './SystemStatusReader'

describe('SystemStatusReader', () => {
  it('evaluates the stored check-ins against the loaded rules at the injected time', async () => {
    const repository = new FakeRepository()
    await repository.add({ id: 'a', recordedAt: '2026-11-14T08:00:00Z', spo2Percent: 88, symptoms: [] })
    const rules = new FakeRuleSource(await new JsonRuleSource().load())
    const reader = new SystemStatusReader(rules, combinedHistory(repository), () => new Date('2026-11-14T09:00:00Z'))

    const [status] = await reader.read()

    expect(status).toMatchObject({ system: 'Respiratory', state: 'emergency', value: 88 })
    expect(status.rule?.id).toBe('SPO-02')
  })

  it('AC5: a system with rules drops its placeholder and keeps its rule-table position', async () => {
    const [spo01] = await new JsonRuleSource().load()
    const sleepRule: Rule = { ...spo01, id: 'TEST-SLEEP', system: 'Sleep', indicator: 'sleepHours', validMin: 0, validMax: 24, below: 6 }
    const placeholders: Placeholder[] = [
      { system: 'Cognition', state: 'nominal', detail: 'c', source: 'synthetic' },
      { system: 'Sleep', state: 'nominal', detail: 's', source: 'synthetic' },
    ]
    const reader = new SystemStatusReader(new FakeRuleSource([spo01, sleepRule]), combinedHistory(new FakeRepository()), undefined, placeholders)

    const statuses = await reader.read()

    expect(statuses.map((s) => [s.system, s.source])).toEqual([
      ['Respiratory', undefined],
      ['Sleep', undefined],
      ['Cognition', 'synthetic'],
    ])
  })

  it('#43 AC6: Cardiovascular and Immune follow Radiation in rule order with no data; their placeholders are gone', async () => {
    const reader = new SystemStatusReader(new JsonRuleSource(), combinedHistory(new FakeRepository()), undefined, mockStatuses)

    const statuses = await reader.read()

    expect(statuses.map((s) => [s.system, s.state])).toEqual([
      ['Respiratory', 'no-data'],
      ['Cognition', 'no-data'],
      ['Cabin air', 'no-data'],
      ['Radiation', 'no-data'],
      ['Cardiovascular', 'no-data'],
      ['Immune', 'no-data'],
      ['Sleep', 'nominal'],
      ['Bone & muscle', 'nominal'],
      ['Vision (SANS)', 'nominal'],
      ['Kidney & hydration', 'nominal'],
    ])
  })

  it('AC7: placeholders can only be nominal and carry no rule (checked by tsc -b)', () => {
    const invalid = [
      // @ts-expect-error a placeholder is never a caution
      { system: 'Sleep', state: 'check', detail: 's', source: 'synthetic' },
      // @ts-expect-error a placeholder has no rule to explain
      { system: 'Sleep', state: 'nominal', detail: 's', source: 'synthetic', rule: undefined },
    ] satisfies Placeholder[]
    expect(invalid).toHaveLength(2)
  })

  describe('readDetail', () => {
    const NOW = new Date('2026-11-14T09:30:00Z')
    const store = (...items: [string, string, number][]) => {
      const repository = new FakeRepository()
      items.forEach(([id, recordedAt, spo2Percent]) =>
        repository.items.set(id, { checkIn: { id, recordedAt, spo2Percent, symptoms: [] }, pending: false }),
      )
      return repository
    }
    const reader = async (repository: FakeRepository) =>
      new SystemStatusReader(new FakeRuleSource(await new JsonRuleSource().load()), combinedHistory(repository), () => NOW, mockStatuses)

    it('AC31: returns the list status, the system rules and the 7-day points oldest first', async () => {
      const r = await reader(
        store(['c', '2026-11-14T09:20:00Z', 92], ['a', '2026-11-08T08:00:00Z', 97], ['b', '2026-11-13T08:15:00Z', 93]),
      )
      const rules = await new JsonRuleSource().load()

      const detail = await r.readDetail('Respiratory')

      expect(detail?.status).toEqual((await r.read()).find((s) => s.system === 'Respiratory'))
      expect(detail?.rules).toEqual(rules.filter((r) => r.system === 'Respiratory'))
      const spo01 = rules.find((rule) => rule.id === 'SPO-01')
      expect(detail?.points).toEqual([
        { recordedAt: '2026-11-08T08:00:00Z', value: 97, source: 'manual', status: 'nominal' },
        { recordedAt: '2026-11-13T08:15:00Z', value: 93, source: 'manual', status: 'check', rule: spo01 },
        { recordedAt: '2026-11-14T09:20:00Z', value: 92, source: 'manual', status: 'check', rule: spo01 },
      ])
      expect(detail?.windowMs).toBe(CHART_WINDOW_MS)
    })

    it('#43 AC9: points at levels 2–5 carry their rule; nominal and stale points carry none', async () => {
      const detail = await (await reader(store(['a', '2026-11-12T09:00:00Z', 97], ['b', '2026-11-12T10:00:00Z', 88], ['c', '2026-11-13T09:29:00Z', 92]))).readDetail(
        'Respiratory',
      )

      expect(detail?.points.map((p) => [p.status, p.rule?.id])).toEqual([
        ['nominal', undefined],
        ['emergency', 'SPO-02'],
        ['stale', undefined],
      ])
      expect(detail?.points.filter((p) => Object.hasOwn(p, 'rule'))).toHaveLength(1)
    })

    it('#43 AC22: a 60 s chart window keeps readings in [now − 60 s, now] and is returned as windowMs', async () => {
      const r = new SystemStatusReader(
        new FakeRuleSource(await new JsonRuleSource().load()),
        combinedHistory(store(['a', '2026-11-14T09:28:59Z', 96], ['b', '2026-11-14T09:29:00Z', 95], ['c', '2026-11-14T09:30:00Z', 97])),
        () => NOW,
        [],
        60_000,
      )

      const detail = await r.readDetail('Respiratory')

      expect(detail?.windowMs).toBe(60_000)
      expect(detail?.points.map((p) => p.value)).toEqual([95, 97])
    })

    it('Cabin air charts the indicator its status shows: a 28 °C cabin → the temperature rows and points', async () => {
      const observations = new FakeObservationRepository()
      const env = (indicator: 'cabinCo2MmHg' | 'cabinTempC', value: number): Observation => ({
        resourceType: 'Observation', id: `env-node:m1:${indicator}`, status: 'final', code: { text: indicator },
        valueQuantity: { value, unit: '' }, effectiveDateTime: '2026-11-14T09:29:00Z', device: { display: 'environment node · synthetic' },
      })
      ;[env('cabinCo2MmHg', 2.3), env('cabinTempC', 28)].forEach((o) => observations.items.set(o.id, o))
      const r = new SystemStatusReader(new FakeRuleSource(await new JsonRuleSource().load()), combinedHistory(store(), observations), () => NOW)

      const detail = await r.readDetail('Cabin air')

      expect([detail?.status.state, detail?.status.rule?.id]).toEqual(['check', 'CAB-03'])
      expect(detail?.rules.map((rule) => rule.id)).toEqual(['CAB-02', 'CAB-03'])
      expect(detail?.points.map((p) => p.value)).toEqual([28])
    })

    it('AC32: a placeholder or unknown system has no detail', async () => {
      const r = await reader(store())

      expect(await r.readDetail('Sleep')).toBeUndefined()
      expect(await r.readDetail('Nope')).toBeUndefined()
    })

    it('AC33: an empty store gives no data, the rules and no points', async () => {
      const detail = await (await reader(store())).readDetail('Respiratory')

      expect(detail?.status.state).toBe('no-data')
      expect(detail?.rules.map((r) => r.id)).toEqual(['SPO-01', 'SPO-02'])
      expect(detail?.points).toEqual([])
    })

    it('AC34: equal times put the less severe reading first', async () => {
      const detail = await (await reader(store(['b', '2026-11-14T09:00:00Z', 96], ['a', '2026-11-14T09:00:00Z', 88]))).readDetail(
        'Respiratory',
      )

      expect(detail?.points.map((p) => p.value)).toEqual([96, 88])
    })

    it('the newest point of a stale status is stale; older points keep their status', async () => {
      const detail = await (
        await reader(store(['a', '2026-11-12T09:00:00Z', 92], ['b', '2026-11-13T09:29:00Z', 88]))
      ).readDetail('Respiratory')

      expect(detail?.points.map((p) => p.status)).toEqual(['check', 'stale'])
    })

    it('keeps readings from exactly 7 days ago, drops older and out-of-range values', async () => {
      const detail = await (
        await reader(
          store(
            ['a', '2026-11-07T09:29:00Z', 96],
            ['b', '2026-11-07T09:30:00Z', 95],
            ['c', '2026-11-14T08:30:00Z', 101],
            ['d', '2026-11-14T08:30:00Z', 40],
          ),
        )
      ).readDetail('Respiratory')

      expect(detail?.points.map((p) => p.value)).toEqual([95])
    })
  })

  it('rejects when the rules fail to load', async () => {
    const rules = new FakeRuleSource()
    rules.fail = true

    await expect(new SystemStatusReader(rules, combinedHistory(new FakeRepository())).read()).rejects.toThrow()
  })
})
