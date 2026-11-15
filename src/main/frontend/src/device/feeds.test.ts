import { FakeReadingSource } from '../test/fakes'
import type { LinkState } from '../infrastructure/DeviceLink'
import type { DotFeedListener } from './DotFeed'
import { LinkFeed } from './LinkFeed'
import { ScenarioFeed } from './ScenarioFeed'
import { dotsFor, scenarioPct } from './dotDisplay'

const recorder = () => {
  const values: number[] = []
  const links: boolean[] = []
  const listener: DotFeedListener = { value: (pct) => values.push(pct), link: (connected) => links.push(connected) }
  return { values, links, listener }
}

describe('ScenarioFeed', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('is simulated and plays the scenario from its start: 6 dots at once, 3 dots 10 s later', () => {
    let now = 5_000
    const feed = new ScenarioFeed(() => now)
    const { values, listener } = recorder()

    feed.start(listener)
    now += 10_000
    vi.advanceTimersByTime(10_000)

    expect(feed.simulated).toBe(true)
    expect(dotsFor(values[0])).toBe(6)
    expect(values.at(-1)).toBe(scenarioPct(10))
    expect(dotsFor(values.at(-1)!)).toBe(3)
  })

  it('stops sending when stopped', () => {
    const feed = new ScenarioFeed(() => 0)
    const { values, listener } = recorder()

    const stop = feed.start(listener)
    stop()
    const count = values.length
    vi.advanceTimersByTime(5_000)

    expect(values).toHaveLength(count)
  })
})

describe('LinkFeed', () => {
  class FakeLink {
    private listeners = new Set<(state: LinkState) => void>()
    onState(listener: (state: LinkState) => void) {
      this.listeners.add(listener)
      listener('disconnected')
      return () => this.listeners.delete(listener)
    }
    emit(state: LinkState) {
      this.listeners.forEach((l) => l(state))
    }
  }

  it('is not simulated and reports the link as connected only when it is', () => {
    const link = new FakeLink()
    const feed = new LinkFeed(link, new FakeReadingSource())
    const { links, listener } = recorder()

    feed.start(listener)
    link.emit('connecting')
    link.emit('connected')
    link.emit('disconnected')

    expect(feed.simulated).toBe(false)
    expect(links).toEqual([false, false, true, false])
  })

  it('passes on a payload pct from 0 to 100 and ignores anything else', () => {
    const source = new FakeReadingSource()
    const feed = new LinkFeed(new FakeLink(), source)
    const { values, listener } = recorder()

    feed.start(listener)
    ;[{ id: 'a', t: '2026-11-15T09:31:00Z', pct: 72, src: 'synthetic' }, { pct: 41.5 }, { pct: 140 }, { pct: -1 }, { pct: '72' },
      { pct: null }, {}, null, 'pct'].forEach((payload) => source.emit(payload))

    expect(values).toEqual([72, 41.5])
  })

  it('stops listening when stopped', () => {
    const link = new FakeLink()
    const source = new FakeReadingSource()
    const feed = new LinkFeed(link, source)
    const { values, links, listener } = recorder()

    feed.start(listener)()
    link.emit('connected')
    source.emit({ pct: 50 })

    expect(links).toEqual([false])
    expect(values).toEqual([])
  })
})
