import {
  CONNECT_GRACE_MS,
  SCENARIO_MS,
  STALE_MS,
  dataAgeText,
  dotsFor,
  levelFor,
  sameView,
  scenarioPct,
  scenarioPctLooped,
  validPct,
  viewFor,
  type DotState,
} from './dotDisplay'

// The same cases as the firmware's native tests (src/main/hardware/dot-display/test/test_core).

describe('dotsFor', () => {
  it.each([
    [0, 1], [16, 1], [16.6, 1], [16.7, 2], [33, 2], [34, 3], [49, 3],
    [50, 4], [66, 4], [67, 5], [83, 5], [84, 6], [100, 6],
  ])('%s %% → %s dots', (pct, dots) => {
    expect(dotsFor(pct)).toBe(dots)
  })
})

describe('validPct', () => {
  it('accepts a finite number from 0 to 100 and nothing else', () => {
    expect([0, 100, 72.5].map(validPct)).toEqual([true, true, true])
    expect([-0.1, 100.1, NaN, Infinity, '72', null, undefined].map(validPct)).toEqual([false, false, false, false, false, false, false])
  })
})

describe('levelFor', () => {
  it('follows the alert scale, dots = 6 − level', () => {
    expect([6, 5, 4, 3, 2, 1].map((d) => levelFor(d))).toEqual([
      { word: 'Nominal', colour: 'white', flashes: false },
      { word: 'To do', colour: 'blue', flashes: false },
      { word: 'Watch', colour: 'white', flashes: false },
      { word: 'Check', colour: 'yellow', flashes: false },
      { word: 'Treat', colour: 'red', flashes: false },
      { word: 'Emergency', colour: 'red', flashes: true },
    ])
  })

  it('turns 4 dots yellow only when asked', () => {
    expect(levelFor(4, true)).toEqual({ word: 'Watch', colour: 'yellow', flashes: false })
    expect(levelFor(5, true).colour).toBe('blue')
  })
})

describe('scenario', () => {
  it('changes dots at the mockup times: 6, 3 at 6 s, 2 at 30 s, 1 at 40 s, then back up to 6 by 87 s', () => {
    const changes: [number, number][] = []
    let previous = 0
    for (let s = 0; s <= 90; s++) {
      const dots = dotsFor(scenarioPct(s))
      if (dots !== previous) changes.push([s, dots])
      previous = dots
    }
    expect(changes).toEqual([[0, 6], [6, 3], [30, 2], [40, 1], [56, 2], [64, 3], [71, 4], [79, 5], [87, 6]])
  })

  it('stays in range and loops every 90 s', () => {
    for (let t = 0; t <= 90; t += 0.25) expect(validPct(scenarioPct(t))).toBe(true)
    expect(scenarioPctLooped(12_000)).toBe(scenarioPct(12))
    expect(scenarioPctLooped(SCENARIO_MS + 12_000)).toBe(scenarioPct(12))
    expect(scenarioPctLooped(5 * SCENARIO_MS + 12_000)).toBe(scenarioPct(12))
  })
})

const live = (pct: number, valueAtMs: number): DotState => ({
  simulated: false, connected: true, everConnected: true, hasValue: true, pct, valueAtMs,
})
const empty: DotState = { simulated: false, connected: false, everConnected: false, hasValue: false, pct: 0, valueAtMs: 0 }

describe('viewFor', () => {
  it('shows a fresh value as its dots, colour and word, with no banner and no age', () => {
    expect(viewFor(live(72, 1000), 2000)).toEqual({
      lit: 5, colour: 'blue', litOn: true, dim: false, banner: 'none', bannerOn: true, word: 'To do', ageS: undefined,
    })
  })

  it('says SIMULATED in simulation and never goes stale', () => {
    const view = viewFor({ ...live(42, 0), simulated: true, connected: false, everConnected: false }, 120_000)
    expect(view).toMatchObject({ banner: 'simulated', lit: 3, dim: false, ageS: undefined })
  })

  it('says Connecting for the first 10 s after start, then NO CONNECTION', () => {
    expect(viewFor(empty, CONNECT_GRACE_MS - 1)).toMatchObject({ banner: 'connecting', lit: 0, word: undefined })
    expect(viewFor(empty, CONNECT_GRACE_MS).banner).toBe('noConnection')
  })

  it('waits with empty slots once connected without a value', () => {
    expect(viewFor({ ...empty, connected: true, everConnected: true }, 3000)).toMatchObject({ banner: 'waiting', lit: 0, word: undefined })
  })

  it('flashes NO CONNECTION 1 s on, 1 s off when the link drops, keeping the last value and its age', () => {
    const lost = { ...live(72, 10_000), connected: false }
    expect(viewFor(lost, 20_000)).toMatchObject({ banner: 'noConnection', bannerOn: true, lit: 5, ageS: 10, dim: false })
    expect(viewFor(lost, 21_000).bannerOn).toBe(false)
  })

  it('dims a value older than 30 s and shows its age', () => {
    expect(viewFor(live(72, 0), STALE_MS).dim).toBe(false)
    expect(viewFor(live(72, 0), STALE_MS + 1000)).toMatchObject({ dim: true, ageS: 31, banner: 'none' })
  })

  it('flashes the Emergency dot at 1 Hz unless the value is stale', () => {
    expect(viewFor(live(8, 0), 1000).litOn).toBe(true)
    expect(viewFor(live(8, 0), 1500).litOn).toBe(false)
    expect(viewFor(live(8, 0), STALE_MS + 1500).litOn).toBe(true)
    expect(viewFor(live(25, 0), 1500).litOn).toBe(true)
  })

  it('treats views that draw the same as the same', () => {
    expect(sameView(viewFor(live(72, 0), 1000), viewFor(live(75, 0), 2000))).toBe(true)
    expect(sameView(viewFor(live(72, 0), 1000), viewFor(live(60, 0), 1000))).toBe(false)
  })
})

describe('dataAgeText', () => {
  it('reads in seconds, minutes or hours', () => {
    expect([47, 60, 3599, 7200].map(dataAgeText)).toEqual(['data 47 s old', 'data 1 min old', 'data 59 min old', 'data 2 h old'])
  })
})
