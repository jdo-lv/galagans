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
})
