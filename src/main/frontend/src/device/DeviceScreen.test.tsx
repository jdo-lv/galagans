import { act, render, screen } from '@testing-library/react'
import { DeviceScreen, DotDisplay } from './DeviceScreen'
import type { DotFeed, DotFeedListener } from './DotFeed'
import { ScenarioFeed } from './ScenarioFeed'
import { viewFor, type DotState, type DotView } from './dotDisplay'

const live = (pct: number): DotState => ({ simulated: false, connected: true, everConnected: true, hasValue: true, pct, valueAtMs: 0 })
const dots = (container: HTMLElement, kind: string) => container.querySelectorAll(`circle.dot--${kind}`).length

describe('DotDisplay', () => {
  it('draws 72 % as 5 blue dots, 1 empty slot and the word To do, quietly', () => {
    const { container } = render(<DotDisplay view={viewFor(live(72), 1000)} />)

    expect(dots(container, 'blue')).toBe(5)
    expect(dots(container, 'empty')).toBe(1)
    expect(screen.getByText('To do')).toBeInTheDocument()
    expect(screen.queryByText('NO CONNECTION')).not.toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAccessibleName('5 of 6 dots, To do')
  })

  it('flashes NO CONNECTION above the dots and shows the data age under them', () => {
    const lost: DotState = { ...live(72), connected: false }
    const on = render(<DotDisplay view={viewFor(lost, 20_000)} />)
    expect(screen.getByText('NO CONNECTION')).toBeInTheDocument()
    expect(screen.getByText('data 20 s old')).toBeInTheDocument()
    on.unmount()

    render(<DotDisplay view={viewFor(lost, 21_000)} />)
    expect(screen.queryByText('NO CONNECTION')).not.toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAccessibleName('5 of 6 dots, To do, no connection, data 21 s old')
  })

  it('dims stale dots and draws the dark half of the Emergency flash as empty slots', () => {
    const stale = render(<DotDisplay view={viewFor(live(72), 31_000)} />)
    expect(stale.container.querySelector('.dot-display__dots')).toHaveClass('is-dim')
    stale.unmount()

    const { container } = render(<DotDisplay view={viewFor(live(8), 1500)} />)
    expect(dots(container, 'red')).toBe(0)
    expect(dots(container, 'empty')).toBe(6)
  })

  it('shows empty slots and the banner before the first value', () => {
    const view: DotView = viewFor({ ...live(0), hasValue: false }, 1000)
    const { container } = render(<DotDisplay view={view} />)

    expect(dots(container, 'empty')).toBe(6)
    expect(screen.getByText('Waiting for data')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAccessibleName('No value yet, waiting for data')
  })
})

describe('DeviceScreen', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('in simulation says SIMULATED and drops from 6 white dots to 3 yellow ones 10 s in', () => {
    let now = 0
    const clock = () => now
    const { container } = render(<DeviceScreen feed={new ScenarioFeed(clock)} now={clock} />)

    expect(screen.getByText('SIMULATED')).toBeInTheDocument()
    expect(dots(container, 'white')).toBe(6)

    act(() => {
      now = 10_000
      vi.advanceTimersByTime(10_000)
    })
    expect(dots(container, 'yellow')).toBe(3)
    expect(screen.getByText('Check')).toBeInTheDocument()
  })

  it('on the device link goes Connecting, Waiting for data, the value, then NO CONNECTION when the link drops', () => {
    let now = 0
    const clock = () => now
    let feedListener: DotFeedListener | undefined
    const feed: DotFeed = { simulated: false, start: (listener) => ((feedListener = listener), () => {}) }
    const { container } = render(<DeviceScreen feed={feed} now={clock} />)
    expect(screen.getByText('Connecting...')).toBeInTheDocument()

    act(() => feedListener!.link(true))
    expect(screen.getByText('Waiting for data')).toBeInTheDocument()

    act(() => feedListener!.value(25))
    expect(dots(container, 'red')).toBe(2)
    expect(screen.getByText('Treat')).toBeInTheDocument()

    act(() => {
      now = 4_000
      feedListener!.link(false)
    })
    expect(screen.getByText('NO CONNECTION')).toBeInTheDocument()
    expect(screen.getByText('data 4 s old')).toBeInTheDocument()
  })
})
