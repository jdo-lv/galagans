import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { clickBarLink, reading, setup } from '../test/renderApp'

const at = (hash: string) => window.history.replaceState(null, '', hash)
const findBar = () => screen.findByRole('navigation', { name: 'Main' })
const bar = () => screen.getByRole('navigation', { name: 'Main' })
const links = () => within(bar()).getAllByRole('link')
const barLink = (name: string) => within(bar()).getByRole('link', { name })

describe('Navigation bar (#46)', () => {
  it('AC1: the bar holds one list with four links in order', async () => {
    setup().renderApp()

    const nav = await findBar()

    expect(within(nav).getAllByRole('list')).toHaveLength(1)
    expect(links().map((a) => [a.getAttribute('aria-label'), a.getAttribute('href')])).toEqual([
      ['Home', '#/'],
      ['Check-in', '#/check-in'],
      ['Messages', '#/packet'],
      ['Statistics', '#/statistics'],
    ])
  })

  it('AC2: each link is a 24 px decorative icon and no text', async () => {
    setup().renderApp()
    await findBar()

    const icons = links().map((a) => {
      expect(a).toHaveTextContent(/^$/)
      expect(a.children).toHaveLength(1)
      const svg = a.firstElementChild as Element
      expect(svg.tagName).toBe('svg')
      expect(svg).toHaveAttribute('aria-hidden', 'true')
      expect(svg).toHaveAttribute('width', '24')
      return [...svg.classList].find((c) => c.startsWith('tabler-icon-'))
    })
    expect(icons).toEqual(['tabler-icon-home', 'tabler-icon-clipboard-list', 'tabler-icon-satellite', 'tabler-icon-chart-bar'])
  })

  it.each([
    ['#/', 'Home'],
    ['#/check-in', 'Check-in'],
    ['#/packet', 'Messages'],
    ['#/statistics', 'Statistics'],
  ])('AC3: at %s only %s is current', async (hash, name) => {
    at(hash)
    setup().renderApp()
    await findBar()

    await waitFor(() => expect(barLink(name)).toHaveAttribute('aria-current', 'page'))
    for (const other of links().filter((a) => a.getAttribute('aria-label') !== name)) {
      expect(other).not.toHaveAttribute('aria-current')
    }
    expect(window.location.hash).toBe(hash)
  })

  it('AC4: no link is current on a system detail', async () => {
    at('#/systems/Respiratory')
    setup({ seed: [reading('r1', '2026-11-14T09:00:00Z', 92)] }).renderApp()

    await screen.findByRole('region', { name: 'Respiratory detail' })

    for (const link of links()) expect(link).not.toHaveAttribute('aria-current')
  })

  it('AC5: no bar on the reaction test', async () => {
    at('#/pvt')
    setup().renderApp()

    await screen.findByRole('heading', { name: 'Reaction test' })

    expect(screen.queryByRole('navigation', { name: 'Main' })).toBeNull()
  })

  it('AC6: the bar comes back with Home current after the reaction test', async () => {
    at('#/pvt')
    setup().renderApp()
    await screen.findByRole('heading', { name: 'Reaction test' })

    window.location.hash = '#/'

    await findBar()
    expect(barLink('Home')).toHaveAttribute('aria-current', 'page')
  })

  it('AC7: the header holds Voice control, then the theme toggle', async () => {
    setup().renderApp()

    const voice = await screen.findByRole('button', { name: 'Voice control' })
    const actions = voice.parentElement as HTMLElement

    expect(actions).toHaveClass('header-actions')
    expect([...actions.children]).toEqual([voice, screen.getByRole('button', { name: /switch to (light|dark) mode/i })])
  })

  it.each(['#/', '#/check-in', '#/packet', '#/statistics'])('AC8: no Add entry at %s', async (hash) => {
    at(hash)
    setup().renderApp()
    await findBar()

    expect(screen.queryByRole('link', { name: 'Add entry' })).toBeNull()
  })
})

describe('Navigation bar: moving between screens (#46)', () => {
  const checkIn = () => screen.getByRole('region', { name: 'Morning check-in' })
  const findCheckIn = () => screen.findByRole('region', { name: 'Morning check-in' })
  const prompt = () => within(checkIn()).getByRole('heading', { level: 3 })
  const bodySystemsHeading = () => screen.getByRole('heading', { name: 'Body systems' })

  /** Opens the check-in from the bar, types 63 on step 1 and moves to step 2. */
  async function toStep2(s: ReturnType<typeof setup>) {
    s.renderApp()
    await clickBarLink('Check-in')
    await findCheckIn()
    await userEvent.type(within(checkIn()).getByRole('spinbutton'), '63')
    await userEvent.click(within(checkIn()).getByRole('button', { name: 'Next →' }))
    await waitFor(() => expect(prompt()).toHaveTextContent('SpO₂'))
  }

  it('AC9: Check-in opens step 1 and becomes current', async () => {
    setup().renderApp()

    await clickBarLink('Check-in')

    await findCheckIn()
    expect(window.location.hash).toBe('#/check-in')
    expect(prompt()).toHaveTextContent('What is your heart rate?')
    expect(barLink('Check-in')).toHaveAttribute('aria-current', 'page')
  })

  it('AC10: clicking the current Check-in keeps the step', async () => {
    await toStep2(setup())

    await clickBarLink('Check-in')

    expect(prompt()).toHaveTextContent('What is your SpO₂?')
    expect(window.location.hash).toBe('#/check-in')
  })

  it('AC11: Home mid-check-in drops the draft and focuses Body systems', async () => {
    const s = setup()
    await toStep2(s)

    await clickBarLink('Home')

    await screen.findByRole('region', { name: 'Body systems' })
    await waitFor(() => expect(document.activeElement).toBe(bodySystemsHeading()))
    expect(s.repository.items.size).toBe(0)
  })

  it('AC12: Check-in after leaving starts empty at step 1', async () => {
    await toStep2(setup())
    await clickBarLink('Home')
    await screen.findByRole('region', { name: 'Body systems' })

    await clickBarLink('Check-in')

    await findCheckIn()
    expect(prompt()).toHaveTextContent('What is your heart rate?')
    expect(within(checkIn()).getByRole('spinbutton')).toHaveValue(null)
  })

  it('AC13: Check-in stays current on the completion', async () => {
    setup().renderApp()
    await clickBarLink('Check-in')
    await findCheckIn()
    for (let step = 1; step < 6; step++) await userEvent.click(within(checkIn()).getByRole('button', { name: 'Next →' }))

    await userEvent.click(within(checkIn()).getByRole('button', { name: 'Save check-in' }))

    await screen.findByRole('region', { name: /^Check-in complete · / })
    expect(window.location.hash).toBe('#/check-in')
    expect(barLink('Check-in')).toHaveAttribute('aria-current', 'page')
  })

  it('AC14: Messages opens the surgeon packet, and the ground-link pill is current too', async () => {
    setup().renderApp()

    await clickBarLink('Messages')

    await screen.findByRole('heading', { name: 'Surgeon packet' })
    expect(window.location.hash).toBe('#/packet')
    expect(barLink('Messages')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /^Surgeon packet\./ })).toHaveAttribute('aria-current', 'page')
  })

  it('AC15: Statistics shows a focused heading and "Not built yet."', async () => {
    setup().renderApp()

    await clickBarLink('Statistics')

    const region = await screen.findByRole('region', { name: 'Statistics' })
    expect(window.location.hash).toBe('#/statistics')
    const [heading, text] = [...region.children]
    expect(region.children).toHaveLength(2)
    expect(heading.tagName).toBe('H2')
    expect(heading).toHaveTextContent('Statistics')
    await waitFor(() => expect(document.activeElement).toBe(heading))
    expect(text.tagName).toBe('P')
    expect(text).toHaveClass('muted')
    expect(text).toHaveTextContent(/^Not built yet\.$/)
    expect(barLink('Statistics')).toHaveAttribute('aria-current', 'page')
  })

  it('AC16: Home from Statistics focuses Body systems', async () => {
    setup().renderApp()
    await clickBarLink('Statistics')
    await screen.findByRole('region', { name: 'Statistics' })

    await clickBarLink('Home')

    await screen.findByRole('region', { name: 'Body systems' })
    await waitFor(() => expect(document.activeElement).toBe(bodySystemsHeading()))
  })
})
