import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { setup } from '../test/renderApp'

const findBar = () => screen.findByRole('navigation', { name: 'Main' })
const bar = () => screen.getByRole('navigation', { name: 'Main' })
const links = () => within(bar()).getAllByRole('link')

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
})
