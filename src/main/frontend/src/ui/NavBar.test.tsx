import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { reading, setup } from '../test/renderApp'

const load = (hash: string) => window.history.replaceState(null, '', hash)
const findBar = () => screen.findByRole('navigation', { name: 'Main' })
const bar = () => screen.getByRole('navigation', { name: 'Main' })
const links = () => within(bar()).getAllByRole('link')
const barLink = (name: string) => within(bar()).getByRole('link', { name })
const iconClass = (svg: Element) => [...svg.classList].find((c) => c.startsWith('tabler-icon-'))

describe('Navigation bar (#57)', () => {
  it('AC1: the bar holds one list of five items: Home, Stats, Add entry, Rewards, Ground', async () => {
    setup().renderApp()

    const nav = await findBar()

    expect(within(nav).getAllByRole('list')).toHaveLength(1)
    const items = within(nav).getAllByRole('listitem').map((li) => {
      expect(li.children).toHaveLength(1)
      return li.firstElementChild as HTMLElement
    })
    expect(items).toHaveLength(5)
    expect(items[0]).toBe(barLink('Home'))
    expect(items[0]).toHaveAttribute('href', '#/')
    expect(items[1]).toBe(barLink('Stats'))
    expect(items[1]).toHaveAttribute('href', '#/statistics')
    expect(items[2]).toBe(barLink('Add entry'))
    expect(items[2]).toHaveAttribute('href', '#/add')
    expect(items[3].tagName).toBe('SPAN')
    expect(items[3]).toHaveClass('nav-bar__soon')
    expect(items[3]).toHaveTextContent(/^Rewards/)
    expect(items[4]).toBe(barLink('Ground'))
    expect(items[4]).toHaveAttribute('href', '#/ground')
  })

  it.each([
    ['Home', 'tabler-icon-man'],
    ['Stats', 'tabler-icon-chart-bar'],
    ['Ground', 'tabler-icon-satellite'],
  ])('AC2: %s is a 24 px decorative icon over its word, which names the link', async (name, icon) => {
    setup().renderApp()
    await findBar()

    const link = barLink(name)

    expect(link).not.toHaveAttribute('aria-label')
    const [svg, word] = [...link.children]
    expect(link.children).toHaveLength(2)
    expect(svg.tagName).toBe('svg')
    expect(svg).toHaveAttribute('width', '24')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(iconClass(svg)).toBe(icon)
    expect(word.tagName).toBe('SPAN')
    expect(word).toHaveTextContent(new RegExp(`^${name}$`))
  })

  it('AC3: Add entry is a 30 px plus with an aria-label and no text', async () => {
    setup().renderApp()
    await findBar()

    const add = barLink('Add entry')

    expect(add).toHaveClass('nav-bar__add')
    expect(add).toHaveAttribute('aria-label', 'Add entry')
    expect(add).toHaveTextContent(/^$/)
    expect(add.children).toHaveLength(1)
    const svg = add.firstElementChild as Element
    expect(svg.tagName).toBe('svg')
    expect(svg).toHaveAttribute('width', '30')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(iconClass(svg)).toBe('tabler-icon-plus')
  })

  it('AC4: Rewards is a plain span, not a link, that says it is not available yet', async () => {
    setup().renderApp()
    await findBar()

    const rewards = bar().querySelector('.nav-bar__soon') as HTMLElement

    expect(rewards.tagName).toBe('SPAN')
    for (const attribute of ['href', 'tabindex', 'aria-disabled', 'role']) expect(rewards).not.toHaveAttribute(attribute)
    const [svg, word, hidden] = [...rewards.children]
    expect(rewards.children).toHaveLength(3)
    expect(svg.tagName).toBe('svg')
    expect(svg).toHaveAttribute('width', '24')
    expect(iconClass(svg)).toBe('tabler-icon-gift')
    expect(word.tagName).toBe('SPAN')
    expect(word.textContent).toBe('Rewards')
    expect(hidden.tagName).toBe('SPAN')
    expect(hidden).toHaveClass('visually-hidden')
    expect(hidden.textContent).toBe(' (not available yet)')
    expect(within(bar()).queryByRole('link', { name: /Rewards/ })).toBeNull()
  })

  it.each([
    ['#/', 'Home', 'page'],
    ['#/statistics', 'Stats', 'page'],
    ['#/add', 'Add entry', 'page'],
    ['#/check-in', 'Add entry', 'true'],
    ['#/symptoms', 'Add entry', 'true'],
    ['#/ground', 'Ground', 'page'],
    ['#/packet', 'Ground', 'true'],
  ])('AC5: at %s only %s has aria-current="%s"', async (hash, name, value) => {
    load(hash)
    setup().renderApp()
    await findBar()

    await waitFor(() => expect(barLink(name)).toHaveAttribute('aria-current', value))
    expect(links().filter((a) => a.hasAttribute('aria-current'))).toEqual([barLink(name)])
    expect(window.location.hash).toBe(hash)
  })
})

describe('Navigation bar (#46)', () => {
  it('AC4: no link is current on a system detail', async () => {
    load('#/systems/Respiratory')
    setup({ seed: [reading('r1', '2026-11-14T09:00:00Z', 92)] }).renderApp()

    await screen.findByRole('region', { name: 'Respiratory detail' })

    for (const link of links()) expect(link).not.toHaveAttribute('aria-current')
  })

  it('AC5: no bar on the reaction test', async () => {
    load('#/pvt')
    setup().renderApp()

    await screen.findByRole('heading', { name: 'Reaction test' })

    expect(screen.queryByRole('navigation', { name: 'Main' })).toBeNull()
  })

  it('AC6: the bar comes back with Home current after the reaction test', async () => {
    load('#/pvt')
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
})
