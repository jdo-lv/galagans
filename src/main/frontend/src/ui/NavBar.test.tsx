import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { clickBarLink, openCheckIn, reading, setup } from '../test/renderApp'

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
    expect(items[1]).toHaveAttribute('href', '#/stats')
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
    ['#/stats', 'Stats', 'page'],
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

  const chooser = () => screen.getByRole('region', { name: 'Add entry' })
  const checkIn = () => screen.getByRole('region', { name: 'Morning check-in' })
  const findCheckIn = () => screen.findByRole('region', { name: 'Morning check-in' })
  const prompt = () => within(checkIn()).getByRole('heading', { level: 3 })
  const bodySystemsHeading = () => screen.getByRole('heading', { name: 'Body systems' })

  it('AC6: Add entry opens the chooser: a focused heading, Morning check-in and Log symptoms', async () => {
    setup().renderApp()

    await clickBarLink('Add entry')

    const region = await screen.findByRole('region', { name: 'Add entry' })
    expect(window.location.hash).toBe('#/add')
    expect(region.tagName).toBe('SECTION')
    const heading = within(region).getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent(/^Add entry$/)
    expect(region).toHaveAttribute('aria-labelledby', heading.id)
    await waitFor(() => expect(document.activeElement).toBe(heading))
    const [checkInLink, symptomsLink] = within(region).getAllByRole('link')
    expect(within(region).getAllByRole('link')).toHaveLength(2)
    expect(checkInLink).toHaveAccessibleName('Morning check-in')
    expect(checkInLink).toHaveAttribute('href', '#/check-in')
    expect(checkInLink).toHaveClass('button-primary')
    expect(checkInLink.querySelector('svg')).toHaveClass('tabler-icon-clipboard-list')
    expect(symptomsLink).toHaveAccessibleName('Log symptoms')
    expect(symptomsLink).toHaveAttribute('href', '#/symptoms')
    expect(symptomsLink).toHaveClass('button-secondary')
    expect(symptomsLink.querySelector('svg')).toHaveClass('tabler-icon-report-medical')
    expect(screen.queryByRole('link', { name: '← Home' })).toBeNull()
  })

  it('AC7: Morning check-in opens step 1, and Add entry stays current', async () => {
    load('#/add')
    setup().renderApp()

    await userEvent.click(within(await screen.findByRole('region', { name: 'Add entry' })).getByRole('link', { name: 'Morning check-in' }))

    await findCheckIn()
    expect(prompt()).toHaveTextContent('What is your heart rate?')
    expect(barLink('Add entry')).toHaveAttribute('aria-current', 'true')
  })

  /** Opens the check-in through the +, types 63 on step 1 and moves to step 2. */
  async function toStep2(s: ReturnType<typeof setup>) {
    s.renderApp()
    await openCheckIn()
    await findCheckIn()
    await userEvent.type(within(checkIn()).getByRole('spinbutton'), '63')
    await userEvent.click(within(checkIn()).getByRole('button', { name: 'Next →' }))
    await waitFor(() => expect(prompt()).toHaveTextContent('SpO₂'))
  }

  it('AC8: Add entry mid-check-in drops the draft and shows the chooser', async () => {
    const s = setup()
    await toStep2(s)

    await clickBarLink('Add entry')

    await screen.findByRole('region', { name: 'Add entry' })
    expect(window.location.hash).toBe('#/add')
    expect(s.repository.items.size).toBe(0)
  })

  it('AC9: Morning check-in after leaving starts empty at step 1', async () => {
    await toStep2(setup())
    await clickBarLink('Add entry')
    await screen.findByRole('region', { name: 'Add entry' })

    await userEvent.click(within(chooser()).getByRole('link', { name: 'Morning check-in' }))

    await findCheckIn()
    expect(prompt()).toHaveTextContent('What is your heart rate?')
    expect(within(checkIn()).getByRole('spinbutton')).toHaveValue(null)
  })

  it.each(['#/add', '#/symptoms', '#/ground'])('AC22: Home from %s focuses Body systems', async (hash) => {
    load(hash)
    setup().renderApp()
    await findBar()
    await waitFor(() => expect(window.location.hash).toBe(hash))

    await clickBarLink('Home')

    await screen.findByRole('region', { name: 'Body systems' })
    await waitFor(() => expect(document.activeElement).toBe(bodySystemsHeading()))
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
