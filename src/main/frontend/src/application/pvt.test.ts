import { describe, expect, it } from 'vitest'
import { endTrial, nextIntervalMs, scorePvt } from './pvt'

describe('PVT-B scoring', () => {
  it('AC1: the wait is 2000 ms plus a floored share of 3000 ms', () => {
    expect(nextIntervalMs(0)).toBe(2000)
    expect(nextIntervalMs(0.5)).toBe(3500)
    expect(nextIntervalMs(0.999)).toBe(4997)
  })

  it('AC2: no trials score nothing', () => {
    expect(scorePvt([])).toEqual({ kind: 'none' })
  })

  it('AC3: median, lapses, false starts and responses', () => {
    expect(scorePvt([{ rtMs: 250 }, { rtMs: 300 }, { rtMs: 400 }])).toEqual({
      kind: 'ok',
      score: { medianMs: 300, lapses: 1, falseStarts: 0, responses: 3 },
    })
  })

  it('AC4: an even count averages the two middle RTs, rounded', () => {
    expect(scorePvt([{ rtMs: 251 }, { rtMs: 300 }])).toMatchObject({ kind: 'ok', score: { medianMs: 276 } })
  })

  it('AC5: 355 ms is a lapse, 354 ms is not', () => {
    expect(scorePvt([{ rtMs: 355 }])).toMatchObject({ score: { lapses: 1 } })
    expect(scorePvt([{ rtMs: 354 }])).toMatchObject({ score: { lapses: 0 } })
  })

  it('AC6: under 130 ms or no stimulus is a false start, outside the median and responses', () => {
    expect(scorePvt([{ rtMs: 129 }, { falseStart: true }, { rtMs: 130 }])).toEqual({
      kind: 'ok',
      score: { medianMs: 130, lapses: 0, falseStarts: 2, responses: 1 },
    })
  })

  it('AC7: only false starts score nothing', () => {
    expect(scorePvt([{ falseStart: true }, { rtMs: 100 }])).toEqual({ kind: 'none' })
  })

  it('AC8: a median over 10 000 ms is out of range; exactly 10 000 is ok', () => {
    expect(scorePvt([{ rtMs: 15000 }, { rtMs: 15000 }])).toMatchObject({ kind: 'out-of-range', score: { medianMs: 15000 } })
    expect(scorePvt([{ rtMs: 10000 }])).toMatchObject({ kind: 'ok', score: { medianMs: 10000 } })
  })

  it('AC8b: an unanswered end trial counts in the median and lapses, not in responses', () => {
    expect(scorePvt([{ rtMs: 250 }, { rtMs: 400, unanswered: true }])).toEqual({
      kind: 'ok',
      score: { medianMs: 325, lapses: 1, falseStarts: 0, responses: 1 },
    })
  })

  it('AC8c: zero answered responses score nothing, whatever the end trial', () => {
    expect(scorePvt([{ falseStart: true }, { rtMs: 400, unanswered: true }])).toEqual({ kind: 'none' })
    expect(scorePvt([{ rtMs: 178000, unanswered: true }])).toEqual({ kind: 'none' })
  })

  it('AC22: a stimulus left unanswered for 355 ms or more at the end is a lapse', () => {
    expect(endTrial(179_700, 180_000)).toBeUndefined()
    expect(endTrial(undefined, 180_000)).toBeUndefined()
    expect(endTrial(179_645, 180_000)).toEqual({ rtMs: 355, unanswered: true })
  })
})
