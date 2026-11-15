import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { reading, setup } from '../test/renderApp'

const NOW = '2026-11-14T09:30:00Z'

/** Every route, how many panes its main panel holds, and what to wait for before it has drawn. */
const ROUTES: [hash: string, panes: number, ready: () => Promise<unknown>][] = [
  ['#/', 2, () => screen.findByRole('region', { name: 'Body systems' })],
  ['#/stats', 2, () => screen.findByRole('region', { name: 'Body systems' })],
  ['#/systems/Respiratory', 2, () => screen.findByRole('heading', { name: 'Respiratory' })],
  ['#/packet', 2, () => screen.findByRole('heading', { name: 'Surgeon packet' })],
  ['#/check-in', 1, () => screen.findByRole('region', { name: 'Morning check-in' })],
  ['#/add', 1, () => screen.findByRole('region', { name: 'Add entry' })],
  ['#/symptoms', 1, () => screen.findByRole('region', { name: 'Log symptoms' })],
  ['#/ground', 1, () => screen.findByRole('region', { name: 'Ground' })],
  ['#/pvt', 1, () => screen.findByRole('region', { name: 'Reaction test' })],
]

/** The app on `hash`, with SpO₂ 92 % now so Respiratory has a detail screen. */
async function open(hash: string, ready: () => Promise<unknown>) {
  window.history.replaceState(null, '', `/${hash}`)
  const { container } = setup({ now: NOW, seed: [reading('r1', NOW, 92)] }).renderApp()
  await ready()
  return container.querySelector<HTMLElement>('main.app-body > .screen')!
}

describe('App shell (#52)', () => {
  it.each(ROUTES)('AC1: %s is a .screen with the side panel first, then the main panel holding %i pane(s)', async (hash, panes, ready) => {
    const shell = await open(hash, ready)

    expect([...shell.children].map((c) => c.className)).toEqual(['shell-side', panes === 2 ? 'shell-main shell-main--split' : 'shell-main'])
    const main = shell.children[1]
    expect([...main.children].map((c) => c.className)).toEqual(Array(panes).fill('shell-pane'))
  })

  it.each(ROUTES)('AC2: on %s the connection and ground-link pills come first in the side panel', async (hash, _, ready) => {
    const shell = await open(hash, ready)

    const [first, second] = shell.querySelector('.shell-side')!.children
    expect(first).toHaveAttribute('role', 'status')
    expect(first).toHaveTextContent('Online')
    expect(second).toHaveAccessibleName('Surgeon packet. Ground link: one-way delay 14 min 05 s (demo)')
  })

  it('AC3: the header shows the brand mark, "Health" centred, then voice control and the theme toggle', () => {
    setup({ now: NOW }).renderApp()

    const header = screen.getByRole('banner')
    const [brand, wordmark, actions] = header.children
    expect(brand).toHaveClass('brand-mark')
    expect(wordmark).toHaveTextContent('Health')
    expect(wordmark).toHaveClass('wordmark')
    expect(within(actions as HTMLElement).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
      'Voice control',
      'Switch to dark mode',
    ])
  })
})
