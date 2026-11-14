import { startRepeating } from './repeat'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('startRepeating', () => {
  it('ticks at once, then every period, until stopped', () => {
    const tick = vi.fn()
    const stop = startRepeating(tick, 5_000)
    expect(tick).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(5_000)
    expect(tick).toHaveBeenCalledTimes(2)

    stop()
    vi.advanceTimersByTime(5_000)
    expect(tick).toHaveBeenCalledTimes(2)
  })
})
