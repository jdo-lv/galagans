import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { CheckIn } from '../domain/checkIn'
import type { Observation } from '../domain/observation'
import { mockStatuses } from '../infrastructure/mockStatuses'
import { reading, readingsPanel, setup } from '../test/renderApp'

const NOW = '2026-11-14T09:30:00Z'
const go = (hash: string) => window.history.replaceState(null, '', hash)

const bp = (indicator: 'systolicMmHg' | 'diastolicMmHg', value: number): Observation => ({
  resourceType: 'Observation',
  id: `bp-cuff:m1:${indicator}`,
  status: 'final',
  code: { text: indicator },
  valueQuantity: { value, unit: 'mmHg' },
  effectiveDateTime: '2026-11-14T09:29:00Z',
  device: { display: 'BP cuff · synthetic' },
})

function show({ seed = [] as CheckIn[], observationSeed = [] as Observation[] } = {}) {
  setup({ now: NOW, placeholders: mockStatuses, seed, observationSeed }).renderApp()
}

const list = () => screen.getByRole('region', { name: 'Body systems' })
const rowOf = (system: string) =>
  within(list())
    .getAllByRole('listitem')
    .find((li) => li.querySelector('.status-system')?.textContent === system)!
const tileOf = (label: string) =>
  within(readingsPanel())
    .getAllByRole('listitem')
    .find((li) => li.textContent?.includes(label))!

/** The AC1 badge: class, word, and its decorative 18 px level icon. */
async function expectBadge(scope: () => HTMLElement, className: string, word: string, icon: string) {
  await waitFor(() => expect(scope().querySelector('.badge')).toHaveTextContent(word))
  const badge = scope().querySelector('.badge')!
  const svg = badge.querySelector('svg')
  expect([badge.className, badge.textContent]).toEqual([className, word])
  expect(svg).toHaveClass(icon)
  expect(svg).toHaveAttribute('aria-hidden', 'true')
  expect(svg).toHaveAttribute('width', '18')
}

afterEach(() => go('/'))

describe('#33 AC2: the level badge everywhere Badge renders', () => {
  it.each([
    [92, 'badge badge--check', 'Check', 'tabler-icon-alert-triangle'],
    [88, 'badge badge--emergency', 'Emergency', 'tabler-icon-alert-octagon'],
  ])('Home list: Respiratory with SpO₂ %s', async (spo2, className, word, icon) => {
    show({ seed: [reading('a', NOW, spo2)] })
    await within(list()).findByText('Respiratory')

    await expectBadge(() => rowOf('Respiratory'), className, word, icon)
  })

  it('Home list: Cardiovascular with systolic 125, diastolic 70 and no heart rate', async () => {
    show({ observationSeed: [bp('systolicMmHg', 125), bp('diastolicMmHg', 70)] })
    await within(list()).findByText('Cardiovascular')

    await expectBadge(() => rowOf('Cardiovascular'), 'badge badge--watch', 'Watch', 'tabler-icon-trending-up')
  })

  it('Latest readings: Blood pressure tile with systolic 145, diastolic 70', async () => {
    show({ observationSeed: [bp('systolicMmHg', 145), bp('diastolicMmHg', 70)] })
    await waitFor(() => readingsPanel())

    await expectBadge(() => tileOf('Blood pressure'), 'badge badge--treat', 'Treat', 'tabler-icon-first-aid-kit')
  })

  it('Detail header with SpO₂ 92', async () => {
    go('#/systems/Respiratory')
    show({ seed: [reading('a', NOW, 92)] })
    const detail = await screen.findByRole('region', { name: 'Respiratory detail' })

    await expectBadge(() => detail.querySelector<HTMLElement>('.detail-title')!, 'badge badge--check', 'Check', 'tabler-icon-alert-triangle')
  })

  it('Body figure: Lungs with SpO₂ 92', async () => {
    show({ seed: [reading('a', NOW, 92)] })
    const item = () => document.querySelector<HTMLElement>('div.body-figure li[data-system="Respiratory"]')!
    await waitFor(() => expect(item()).toHaveTextContent('Lungs'))

    await expectBadge(item, 'badge badge--check', 'Check', 'tabler-icon-alert-triangle')
  })

  it('Surgeon packet: SpO₂ 88 row keeps its rule tag and tier pill', async () => {
    go('#/packet')
    show({ seed: [reading('a', NOW, 88)] })
    const contents = await screen.findByRole('region', { name: 'Next packet · contents' })
    await within(contents).findByRole('table')
    const status = () => within(contents).getByRole('rowheader', { name: 'SpO₂' }).closest('tr')!.querySelector('td')!

    await expectBadge(status, 'badge badge--emergency', 'Emergency', 'tabler-icon-alert-octagon')
    expect(within(status()).getByText('rule · SPO-02')).toHaveClass('tag', 'tag--rule')
    expect(within(status()).getByText('Urgent ground')).toHaveClass('pill')
  })
})
