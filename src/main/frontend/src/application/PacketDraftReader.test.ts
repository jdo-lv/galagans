import { describe, expect, it } from 'vitest'
import { READINGS } from '../domain/readings'
import { RULES } from '../test/rules'
import { combinedHistory, FakeRepository, FakeRuleSource } from '../test/fakes'
import { LatestReadingsReader } from './LatestReadingsReader'
import { PacketDraftReader } from './PacketDraftReader'

const NOW = new Date('2026-11-14T07:31:00Z')

describe('PacketDraftReader', () => {
  it('AC7: one item per READINGS row, in order, on the readings clock', async () => {
    const history = new FakeRepository()
    history.items.set('a', { checkIn: { id: 'a', recordedAt: '2026-11-14T07:21:00Z', spo2Percent: 88, symptoms: [] }, pending: false })
    const draft = new PacketDraftReader(new LatestReadingsReader(new FakeRuleSource(RULES), combinedHistory(history), () => NOW))

    const { items } = await draft.read()

    expect(items.map((i) => i.key)).toEqual(READINGS.map((s) => s.key))
    expect(items[0]).toMatchObject({ key: 'spo2', state: 'emergency', ruleId: 'SPO-02', tier: 'Urgent ground' })
    expect(draft.now()).toBe(NOW)
  })

  it('#43 AC11: returns the distinct rules of the readings with the items', async () => {
    const history = new FakeRepository()
    history.items.set('a', { checkIn: { id: 'a', recordedAt: '2026-11-14T07:21:00Z', spo2Percent: 92, heartRateBpm: 120, symptoms: [] }, pending: false })
    history.items.set('b', { checkIn: { id: 'b', recordedAt: '2026-11-14T07:22:00Z', spo2Percent: 93, symptoms: [] }, pending: false })
    const draft = new PacketDraftReader(new LatestReadingsReader(new FakeRuleSource(RULES), combinedHistory(history), () => NOW))

    const { rules } = await draft.read()

    expect(rules.map((r) => r.id)).toEqual(['SPO-01', 'CV-01'])
  })

  it('#43 AC11: no flagged reading → no rules', async () => {
    const draft = new PacketDraftReader(new LatestReadingsReader(new FakeRuleSource(RULES), combinedHistory(new FakeRepository()), () => NOW))

    expect((await draft.read()).rules).toEqual([])
  })
})
