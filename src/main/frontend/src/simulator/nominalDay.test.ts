import { startNominalDay } from './nominalDay'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('startNominalDay', () => {
  it('ticks at once, then every 60 000 ms, until stopped', () => {
    const tick = vi.fn()
    const stop = startNominalDay(tick)
    expect(tick).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(60_000)
    expect(tick).toHaveBeenCalledTimes(2)

    stop()
    vi.advanceTimersByTime(60_000)
    expect(tick).toHaveBeenCalledTimes(2)
  })
})
