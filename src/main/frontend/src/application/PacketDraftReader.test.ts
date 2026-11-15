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

    const items = await draft.read()

    expect(items.map((i) => i.key)).toEqual(READINGS.map((s) => s.key))
    expect(items[0]).toMatchObject({ key: 'spo2', state: 'emergency', ruleId: 'SPO-02', tier: 'Urgent ground' })
    expect(draft.now()).toBe(NOW)
  })
})
