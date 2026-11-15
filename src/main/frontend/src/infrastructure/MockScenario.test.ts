import { RULES } from '../test/rules'
import { MockScenario } from './MockScenario'

const START = Date.parse('2026-11-14T09:00:00Z')

function scenario(draws: number[]) {
  const clock = { now: START }
  const random = vi.fn(() => {
    const next = draws.shift()
    if (next === undefined) throw new Error('no scripted draw left')
    return next
  })
  const s = new MockScenario(RULES, random, () => new Date(clock.now))
  return { s, random, at: (seconds: number) => ((clock.now = START + seconds * 1000), s.levels()) }
}

describe('MockScenario', () => {
  it('AC26: quiet until 300 s, one device at one level for 60 s, then quiet; the next episode picks again', () => {
    // Six devices; 0 → oximeter, 0.99 → its last non-nominal level; 0.5 → thermometer, 0 → its first.
    const { at, random } = scenario([0, 0.99, 0.5, 0])

    expect(at(0)).toEqual({})
    expect(at(299)).toEqual({})
    expect(at(300)).toEqual({ oximeter: 'emergency' })
    expect(at(359)).toEqual({ oximeter: 'emergency' })
    expect(at(360)).toEqual({})
    expect(at(599)).toEqual({})
    expect(at(600)).toEqual({ thermometer: 'check' })
    expect(at(659.999)).toEqual({ thermometer: 'check' })
    expect(at(660)).toEqual({})
    expect(random).toHaveBeenCalledTimes(4)
  })

  it('AC26: draws only on the first call inside an episode', () => {
    const { at, random } = scenario([0.2, 0.5])

    at(320)
    at(330)
    at(340)

    expect(random).toHaveBeenCalledTimes(2)
    expect(at(350)).toEqual({ bracelet: 'check' })
  })
})
