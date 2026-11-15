import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { CheckIn } from '../domain/checkIn'
import { pvt, setup } from '../test/renderApp'

// 09:30 UTC is after the 07:00–09:00 window in every TZ the team uses, so a check-in not given today is overdue.
const NOW = '2026-11-14T09:30:00Z'
/** A check-in today and a fresh PVT: nothing owed, so Home is Nominal. */
const NOMINAL: CheckIn[] = [{ id: 'c', recordedAt: '2026-11-14T07:30:00Z', symptoms: [] }, pvt('p', '2026-11-14T07:40:00Z', 268)]

const panes = () => [...document.querySelectorAll<HTMLElement>('.shell-pane')]
const side = () => document.querySelector<HTMLElement>('.shell-side')!
const todo = () => screen.getByRole('region', { name: /^To do · \d$/ })
const itemButton = (title: string) => within(todo()).getByRole('button', { name: new RegExp(`^${title.replace(/[()]/g, '\\$&')}`) })
const tiles = (name: string) => within(screen.getByRole('region', { name })).getAllByRole('listitem')
const labelOf = (tile: HTMLElement) => tile.querySelector('.tile-label')?.childNodes[0].textContent
const figureItems = () => within(screen.getByRole('list', { name: 'Body figure' })).getAllByRole('listitem')
const todoOrgans = () => [...document.querySelectorAll('.body-figure .organ--todo')].map((o) => o.getAttribute('data-system')).sort()
const todoLabels = () =>
  figureItems()
    .filter((li) => li.querySelector('.badge--todo'))
    .map((li) => li.dataset.system)
    .sort()

/** Home with the check-in overdue and no PVT: both owed. */
async function owed() {
  setup({ now: NOW }).renderApp()
  return screen.findByRole('region', { name: 'To do · 2' })
}

async function nominal() {
  setup({ now: NOW, seed: NOMINAL }).renderApp()
  return screen.findByRole('region', { name: "Today's routine" })
}

describe('Home, To do (#52)', () => {
  it('AC10: "To do · 2" in the secondary pane, the check-in open with why, takes, source and its form, the PVT closed', async () => {
    const panel = await owed()

    expect(panes()[1]).toContainElement(panel)
    expect(itemButton('Morning check-in')).toHaveAttribute('aria-expanded', 'true')
    expect(itemButton('Morning check-in')).toHaveTextContent('Overdue since 09:00')
    expect(itemButton('PVT (3 min)')).toHaveAttribute('aria-expanded', 'false')
    expect(within(panel).getAllByRole('term').map((t) => t.textContent)).toEqual(['Why', 'Takes', 'Source'])
    const form = within(panel).getByRole('region', { name: 'Morning check-in' })
    expect(within(form).getByRole('heading', { name: 'What is your heart rate?' })).toBeInTheDocument()
    expect(within(form).getByRole('spinbutton')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: "Today's routine" })).toBeNull()
  })

  it('AC11: the side panel is "Relevant readings", the check-in\'s four readings first and the only ones marked To do', async () => {
    await owed()

    const readings = screen.getByRole('region', { name: 'Relevant readings' })
    expect(side()).toContainElement(readings)
    const labels = tiles('Relevant readings').map(labelOf)
    const order = ['Heart rate', 'SpO₂', 'Sleep', 'Mood', 'Reaction time', 'Blood pressure', 'Cabin CO₂']
    expect(labels.slice(0, 5)).toEqual(order.slice(0, 5))
    expect(labels.filter((l) => order.includes(l ?? ''))).toEqual(order)
    const marked = tiles('Relevant readings').filter((li) => li.classList.contains('metric-tile--todo'))
    expect(marked.map(labelOf)).toEqual(['Heart rate', 'SpO₂', 'Sleep', 'Mood'])
    marked.forEach((li) => expect(within(li).getByText('To do')).toHaveClass('badge', 'badge--todo'))
    expect(tiles('Relevant readings').filter((li) => li.querySelector('.badge--todo'))).toEqual(marked)
  })

  it('AC12: the body marks Cardiovascular, Cognition and Respiratory, each label with a To do badge', async () => {
    await owed()

    expect(todoOrgans()).toEqual(['Cardiovascular', 'Cognition', 'Respiratory'])
    expect(todoLabels()).toEqual(['Cardiovascular', 'Cognition', 'Respiratory'])
  })

  it('AC13: opening the PVT closes the check-in form, offers "Start PVT · 3 min" and marks only Reaction time and Cognition', async () => {
    const panel = await owed()

    await userEvent.click(itemButton('PVT (3 min)'))

    expect(itemButton('PVT (3 min)')).toHaveAttribute('aria-expanded', 'true')
    expect(itemButton('Morning check-in')).toHaveAttribute('aria-expanded', 'false')
    expect(within(panel).queryByRole('region', { name: 'Morning check-in' })).toBeNull()
    expect(within(panel).queryByRole('spinbutton')).toBeNull()
    expect(within(panel).getByRole('link', { name: 'Start PVT · 3 min' })).toHaveAttribute('href', '#/pvt')
    const readings = tiles('Relevant readings')
    expect(labelOf(readings[0])).toBe('Reaction time')
    expect(readings.filter((li) => li.classList.contains('metric-tile--todo'))).toEqual([readings[0]])
    expect(todoOrgans()).toEqual(['Cognition'])
    expect(todoLabels()).toEqual(['Cognition'])
  })

  it('AC14: saving the check-in in the panel leaves "To do · 1" with the PVT open', async () => {
    const panel = await owed()
    const form = within(panel).getByRole('region', { name: 'Morning check-in' })

    for (let step = 0; step < 5; step++) await userEvent.click(within(form).getByRole('button', { name: 'Next →' }))
    await userEvent.click(within(form).getByRole('button', { name: 'Save check-in' }))

    expect(await screen.findByRole('region', { name: 'To do · 1' })).toBeInTheDocument()
    expect(itemButton('PVT (3 min)')).toHaveAttribute('aria-expanded', 'true')
    expect(within(todo()).queryByRole('button', { name: /^Morning check-in/ })).toBeNull()
  })

  it('the embedded check-in leaves focus where it was and offers no Cancel', async () => {
    const panel = await owed()

    const form = within(panel).getByRole('region', { name: 'Morning check-in' })
    expect(form).not.toContainElement(document.activeElement as HTMLElement)
    expect(within(form).queryByRole('button', { name: 'Cancel' })).toBeNull()
  })
})

describe('Home, Nominal (#52)', () => {
  it('AC15: Today\'s routine and Latest readings, and no To do anywhere outside the legend', async () => {
    await nominal()

    expect(screen.getByRole('region', { name: 'Latest readings' })).toBeInTheDocument()
    await waitFor(() => expect(tiles('Latest readings').length).toBeGreaterThan(0))
    expect(screen.queryByRole('region', { name: /^To do/ })).toBeNull()
    expect(screen.queryByRole('region', { name: 'Relevant readings' })).toBeNull()
    expect(document.querySelector('.metric-tile--todo, .organ--todo')).toBeNull()
    expect([...document.querySelectorAll('.badge--todo')].every((b) => b.closest('.level-legend'))).toBe(true)
  })
})

describe('Home structure (#52)', () => {
  it.each([
    ['To do', owed],
    ['Nominal', nominal],
  ])('AC16: %s → the primary pane holds only the Body card (heading, figure, level legend); the secondary ends with Body systems', async (_, open) => {
    await open()

    const [primary, secondary] = panes()
    const body = screen.getByRole('region', { name: 'Body' })
    expect([...primary.children]).toEqual([body])
    expect([...body.children].map((c) => c.className)).toEqual(['card-heading', 'body-figure', 'level-legend'])
    const legend = body.querySelector<HTMLElement>('.level-legend')!
    expect(within(legend).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Nominal', 'To do', 'Watch', 'Check', 'Treat', 'Emergency'])
    expect(secondary.lastElementChild).toBe(screen.getByRole('region', { name: 'Body systems' }))
  })

  it.each([
    ['To do', owed],
    ['Nominal', nominal],
  ])('AC17: %s → no "Hazards" group on Home', async (_, open) => {
    await open()

    expect(screen.queryByRole('group', { name: 'Hazards' })).toBeNull()
  })
})
