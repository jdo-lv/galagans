import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CheckIn } from '../domain/checkIn'
import type { ReadingPlaceholder } from '../domain/readings'
import { setup } from '../test/renderApp'

// Local times, so the tests pass in any TZ.
const at = (h: number, m: number, s = 0, day = 14) => new Date(2026, 10, day, h, m, s)
const go = (hash: string) => window.history.replaceState(null, '', hash)

type Options = { now?: Date; seed?: CheckIn[]; online?: boolean; readingPlaceholders?: ReadingPlaceholder[] }
const setupAt = ({ now = at(7, 31), ...rest }: Options = {}) => setup({ ...rest, now: now.toISOString() })

const PILL_NAME = 'Surgeon packet. Ground link: one-way delay 14 min 05 s (demo)'
const pill = () => screen.getByRole('link', { name: PILL_NAME })
const heading = () => screen.getByRole('heading', { level: 2, name: 'Surgeon packet' })

async function openPacket(options: Options = {}) {
  go('#/packet')
  const s = setupAt(options)
  s.renderApp()
  await screen.findByRole('heading', { level: 2, name: 'Surgeon packet' })
  return s
}

afterEach(() => {
  vi.useRealTimers()
  go('/')
})

describe('Ground-link pill and route', () => {
  it.each([
    ['#/', undefined],
    ['#/systems/Respiratory', undefined],
    ['#/packet', 'page'],
  ])('AC1, AC3: on %s the ground-link pill links to #/packet beside the sync pill (aria-current %s)', async (hash, current) => {
    go(hash)
    setupAt().renderApp()

    const link = pill()
    expect(link.tagName).toBe('A')
    expect(link).toHaveClass('pill', 'pill--link')
    expect(link).toHaveAttribute('href', '#/packet')
    expect(link).toHaveTextContent('Ground link: one-way delay 14 min 05 s (demo)')
    expect(link.querySelector('svg.tabler-icon-satellite')).not.toBeNull()
    expect(link.parentElement).toContainElement(screen.getByRole('status'))
    if (current) expect(link).toHaveAttribute('aria-current', current)
    else expect(link).not.toHaveAttribute('aria-current')
  })

  it('AC3: #/packet shows the heading, focused once, and a ← Home link', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    await openPacket()

    expect(heading()).toHaveAttribute('tabindex', '-1')
    expect(heading()).toHaveFocus()
    const home = screen.getByRole('link', { name: '← Home' })
    expect(home).toHaveAttribute('href', '#/')
    expect(screen.queryByRole('region', { name: 'Body systems' })).toBeNull()

    home.focus()
    act(() => vi.advanceTimersByTime(60_000))
    await act(async () => {})
    expect(home).toHaveFocus()
  })

  it('AC3: following the pill from Home opens the packet screen', async () => {
    go('#/')
    setupAt().renderApp()

    await userEvent.click(pill())

    expect(await screen.findByRole('heading', { level: 2, name: 'Surgeon packet' })).toHaveFocus()
    expect(window.location.hash).toBe('#/packet')
  })

  it('AC4: #/packet/x goes Home', async () => {
    go('#/packet/x')
    setupAt().renderApp()

    expect(await screen.findByRole('region', { name: 'Body systems' })).toBeInTheDocument()
    await waitFor(() => expect(window.location.hash).toBe('#/'))
    expect(screen.queryByRole('heading', { name: 'Surgeon packet' })).toBeNull()
  })

  it('AC5: ← Home returns Home and focuses the Body systems heading', async () => {
    await openPacket()

    await userEvent.click(screen.getByRole('link', { name: '← Home' }))

    const systems = await screen.findByRole('heading', { name: 'Body systems' })
    await waitFor(() => expect(systems).toHaveFocus())
  })

  it('AC6: privacy line with the lock icon', async () => {
    await openPacket()

    const line = screen.getByText('Shared with flight medicine only · Mars transit, one-way delay 14 min 05 s (demo value)')
    expect(line.closest('div, p')?.querySelector('svg.tabler-icon-lock')).not.toBeNull()
  })
})
