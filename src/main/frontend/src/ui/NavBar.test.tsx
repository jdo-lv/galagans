import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { reading, setup } from '../test/renderApp'

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
})
