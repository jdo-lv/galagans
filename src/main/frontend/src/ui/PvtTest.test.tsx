import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setup } from '../test/renderApp'

const FAKE = ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance'] as const

const region = (name = 'Reaction test') => screen.getByRole('region', { name })
const target = () => screen.getByRole('button', { name: 'Respond' })
const go = (hash: string) => window.history.replaceState(null, '', hash)
const flush = () => act(async () => {})

/** Opens #/pvt, clicks "Start test" and returns a clock in ms since the click. */
async function startTest(options: Parameters<typeof setup>[0] = {}) {
  go('#/pvt')
  const s = setup(options)
  s.renderApp()
  await flush()
  fireEvent.click(screen.getByRole('button', { name: 'Start test' }))
  let at = 0
  const advanceTo = async (ms: number) => {
    act(() => vi.advanceTimersByTime(ms - at))
    at = ms
    await flush()
  }
  const respondAt = async (ms: number) => {
    await advanceTo(ms)
    fireEvent.pointerDown(target())
    await flush()
  }
  return { ...s, advanceTo, respondAt }
}

const newCheckIns = (s: ReturnType<typeof setup>) => [...s.repository.items.values()].map((i) => i.checkIn)
const rows = (name = 'Reaction test result') =>
  [...region(name).querySelectorAll('dt')].map((dt) => [dt.textContent, dt.nextElementSibling?.textContent])

beforeEach(() => vi.useFakeTimers({ toFake: [...FAKE] }))
afterEach(() => {
  vi.useRealTimers()
  go('/')
})

describe('Reaction test on Home', () => {
  it('AC9: a Reaction test card between Latest readings and Check-in, with a secondary start button', async () => {
    setup().renderApp()
    await flush()

    const card = region()
    expect(card).toHaveTextContent('3 minutes. Every 4th day.')
    expect(within(card).getByRole('button', { name: 'Start reaction test' })).toHaveClass('button-secondary')
    const column = card.parentElement as HTMLElement
    const order = [...column.children]
    expect(order.indexOf(card)).toBe(order.indexOf(screen.getByRole('region', { name: 'Latest readings' })) + 1)
    expect(order.indexOf(screen.getByRole('region', { name: 'Check-in' }))).toBe(order.indexOf(card) + 1)
    expect(document.querySelectorAll('.button-primary')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Save check-in' })).toHaveClass('button-primary')
  })

  it('AC10: Start reaction test opens #/pvt in place of Home', async () => {
    setup().renderApp()
    await flush()

    fireEvent.click(screen.getByRole('button', { name: 'Start reaction test' }))
    // jsdom queues hashchange on a timer, which the fake timers hold.
    act(() => void window.dispatchEvent(new HashChangeEvent('hashchange')))
    await flush()

    expect(window.location.hash).toBe('#/pvt')
    for (const name of ['Body systems', 'Latest readings', 'Check-in']) expect(screen.queryByRole('region', { name })).toBeNull()
  })

  it('AC11: the start screen explains the test and offers Start test and Home', async () => {
    go('#/pvt')
    setup().renderApp()
    await flush()

    expect(region()).toHaveTextContent("Tap the box or press Space as soon as the counter appears. Don't tap before it does.")
    expect(region()).toHaveTextContent('Use the same device each time: its screen delay changes your time.')
    expect(within(region()).getByRole('button', { name: 'Start test' })).toHaveClass('button-primary')
    expect(within(region()).getByRole('link', { name: '← Home' })).toHaveAttribute('href', '#/')
  })
})

describe('Reaction test running', () => {
  it('AC12: no digits during the wait, then a counter from 0 every 10 ms', async () => {
    const t = await startTest()

    expect(target().textContent).not.toMatch(/\d/)
    await t.advanceTo(2000)
    expect(target()).toHaveTextContent(/^0$/)
    await t.advanceTo(2310)
    expect(target()).toHaveTextContent(/^310$/)
  })

  it('AC13: a response freezes the RT until the next stimulus 2000 ms later', async () => {
    const t = await startTest()
    await t.respondAt(2310)

    await t.advanceTo(4300)
    expect(target()).toHaveTextContent(/^310$/)
    await t.advanceTo(4310)
    expect(target()).toHaveTextContent(/^0$/)
  })

  it('AC14: a response with no stimulus shows "Too early" and restarts the wait', async () => {
    const t = await startTest()
    await t.respondAt(1000)

    expect(target()).toHaveTextContent('Too early')
    await t.advanceTo(2990)
    expect(target()).toHaveTextContent('Too early')
    await t.advanceTo(3000)
    expect(target()).toHaveTextContent(/^0$/)
  })

  it('AC15: a response under 130 ms shows "Too early"; the next stimulus follows 2000 ms later', async () => {
    const t = await startTest()
    await t.respondAt(2100)

    expect(target()).toHaveTextContent('Too early')
    await t.advanceTo(4090)
    expect(target()).toHaveTextContent('Too early')
    await t.advanceTo(4100)
    expect(target()).toHaveTextContent(/^0$/)
  })

  it('AC16: Space on a focused target is one response; repeats and the click are ignored', async () => {
    const t = await startTest()
    target().focus()
    await t.advanceTo(2310)

    // userEvent.keyboard hangs on the faked performance clock, so replay what a browser sends for Space on a focused button.
    fireEvent.keyDown(target(), { key: ' ' })
    fireEvent.keyUp(target(), { key: ' ' })
    fireEvent.click(target())
    await flush()
    fireEvent.keyDown(document, { key: ' ', repeat: true })
    await flush()

    expect(target()).toHaveTextContent(/^310$/)
    await t.advanceTo(180_000)
    expect(rows()).toContainEqual(['Responses', '1'])
    expect(rows()).toContainEqual(['False starts', '0'])
  })

  it('AC17: time left counts down in whole seconds, rounded up', async () => {
    const t = await startTest()

    expect(region()).toHaveTextContent('3:00 left')
    await t.advanceTo(500)
    expect(region()).toHaveTextContent('3:00 left')
    await t.advanceTo(1000)
    expect(region()).toHaveTextContent('2:59 left')
    await t.advanceTo(179_500)
    expect(region()).toHaveTextContent('0:01 left')
  })

  it('AC18: Stop sets the hash to #/, Home shows and nothing is saved after 3 minutes', async () => {
    const t = await startTest()
    await t.respondAt(2310)

    const stop = within(region()).getByRole('button', { name: 'Stop' })
    expect(stop).toHaveClass('button-secondary')
    act(() => {
      fireEvent.click(stop)
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    await t.advanceTo(182_310)

    expect(window.location.hash).toBe('#/')
    expect(screen.getByRole('region', { name: 'Body systems' })).toBeInTheDocument()
    expect(newCheckIns(t)).toHaveLength(0)
  })

  it('AC19: leaving the route mid-test saves nothing', async () => {
    const t = await startTest()
    await t.respondAt(2310)

    act(() => {
      go('#/')
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    await t.advanceTo(182_310)

    expect(screen.getByRole('region', { name: 'Body systems' })).toBeInTheDocument()
    expect(newCheckIns(t)).toHaveLength(0)
  })

  it('AC20: going to the background stops the test and saves nothing', async () => {
    const t = await startTest()
    await t.respondAt(2310)

    const hidden = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    act(() => void document.dispatchEvent(new Event('visibilitychange')))
    hidden.mockRestore()
    await t.advanceTo(182_310)

    expect(newCheckIns(t)).toHaveLength(0)
    expect(region()).toHaveTextContent('Test stopped: the app went to the background. Nothing was saved.')
    expect(within(region()).getByRole('button', { name: 'Start test' })).toHaveClass('button-primary')
  })
})

describe('Reaction test result', () => {
  async function threeResponses(options: Parameters<typeof setup>[0] = {}) {
    const t = await startTest(options)
    await t.respondAt(2250)
    await t.respondAt(4550)
    await t.respondAt(6950)
    await t.advanceTo(180_000)
    return t
  }

  it('AC21: saves one check-in with the scores, the unanswered end stimulus as a lapse', async () => {
    const t = await threeResponses()

    const [saved, ...more] = newCheckIns(t)
    expect(more).toHaveLength(0)
    expect(saved).toEqual({
      id: expect.any(String),
      recordedAt: t.clock.now.toISOString(),
      pvtMedianMs: 350,
      pvtLapses: 2,
      pvtFalseStarts: 0,
      symptoms: [],
    })
  })

  it('AC23: shows the result rows, the saved line and Back to Home', async () => {
    await threeResponses()

    expect(rows()).toEqual([
      ['Median reaction time', '350 ms'],
      ['Lapses (≥ 355 ms)', '2'],
      ['False starts', '0'],
      ['Responses', '3'],
    ])
    expect(region('Reaction test result')).toHaveTextContent('Saved on this device · in-app test')
    const back = within(region('Reaction test result')).getByRole('button', { name: 'Back to Home' })
    expect(back).toHaveClass('button-primary')
    act(() => {
      fireEvent.click(back)
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(window.location.hash).toBe('#/')
  })

  it('AC24: a failed save keeps the scores and offers Try again', async () => {
    const t = await startTest()
    t.repository.failAdd = true
    await t.respondAt(2250)
    await t.respondAt(4550)
    await t.respondAt(6950)
    await t.advanceTo(180_000)

    const result = region('Reaction test result')
    expect(result).toHaveTextContent("Couldn't save the result on this device.")
    expect(rows()).toContainEqual(['Median reaction time', '350 ms'])
    expect(within(result).getByRole('button', { name: 'Try again' })).toHaveClass('button-primary')
    expect(within(result).getByRole('button', { name: 'Back to Home' })).toHaveClass('button-secondary')

    t.repository.failAdd = false
    fireEvent.click(within(result).getByRole('button', { name: 'Try again' }))
    await flush()

    expect(newCheckIns(t)).toHaveLength(1)
    expect(region('Reaction test result')).toHaveTextContent('Saved on this device · in-app test')
  })

  it('AC25: only false starts and a dropped last stimulus save nothing', async () => {
    const t = await startTest()
    for (let ms = 1000; ms <= 177_700; ms += 1900) await t.respondAt(ms)
    await t.advanceTo(180_000)

    const result = region('Reaction test result')
    expect(result).toHaveTextContent('No valid responses. Nothing was saved.')
    expect(within(result).getByRole('button', { name: 'Start test' })).toHaveClass('button-primary')
    expect(within(result).getByRole('link', { name: '← Home' })).toHaveAttribute('href', '#/')
    expect(newCheckIns(t)).toHaveLength(0)
  })

  it('AC26: a median over 10 000 ms is shown but not saved', async () => {
    const t = await startTest()
    await t.respondAt(17_000)
    await t.respondAt(34_000)
    await t.advanceTo(180_000)

    const result = region('Reaction test result')
    expect(rows()).toEqual([
      ['Median reaction time', '15000 ms'],
      ['Lapses (≥ 355 ms)', '3'],
      ['False starts', '0'],
      ['Responses', '2'],
    ])
    expect(result).toHaveTextContent('Median over 10 000 ms: looks like a broken session. Nothing was saved.')
    expect(within(result).getByRole('button', { name: 'Start test' })).toHaveClass('button-primary')
    expect(within(result).getByRole('link', { name: '← Home' })).toHaveAttribute('href', '#/')
    expect(newCheckIns(t)).toHaveLength(0)
  })

  it('AC27: offline, the result is saved, nothing is sent and the pill counts it', async () => {
    const t = await threeResponses({ online: false })

    expect(newCheckIns(t)).toHaveLength(1)
    expect(t.gateway.sent).toHaveLength(0)
    act(() => {
      fireEvent.click(within(region('Reaction test result')).getByRole('button', { name: 'Back to Home' }))
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    await flush()
    expect(screen.getByRole('status')).toHaveTextContent('Offline · 1 waiting to sync')
  })

  it('AC28: back on Home, the tile shows the new median without waiting for the re-read', async () => {
    await threeResponses()

    act(() => {
      fireEvent.click(within(region('Reaction test result')).getByRole('button', { name: 'Back to Home' }))
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    await flush()

    const tile = within(screen.getByRole('region', { name: 'Latest readings' }))
      .getAllByRole('listitem')
      .find((li) => li.textContent?.includes('Reaction time')) as HTMLElement
    expect(tile).toHaveTextContent('350 ms')
    expect(tile).toHaveTextContent('Reaction time / just now')
  })
})
