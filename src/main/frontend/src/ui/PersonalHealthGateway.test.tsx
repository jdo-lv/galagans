import { act, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Observation } from '../domain/observation'
import { reading, readingsPanel, setup } from '../test/renderApp'

const NOW = '2026-11-14T10:00:00Z'
const DEVICE = 'oximeter · synthetic'

const observation = (id: string, effectiveDateTime: string, value: number): Observation => ({
  resourceType: 'Observation',
  id: `oximeter:${id}:spo2Percent`,
  status: 'final',
  code: { text: 'spo2Percent' },
  valueQuantity: { value, unit: '%' },
  effectiveDateTime,
  device: { display: DEVICE },
})
const message = (id: string, spo2: number) => ({ id, t: '2026-11-14T09:59:30Z', spo2_pct: spo2, pulse_bpm: 61, src: 'synthetic' })

const list = () => screen.getByRole('region', { name: 'Body systems' })
const respiratory = () => {
  const found = within(list())
    .getAllByRole('listitem')
    .find((li) => li.querySelector('.status-system')?.textContent === 'Respiratory')
  if (!found) throw new Error('no Respiratory row')
  return found
}
const tile = (label: string) => {
  const panel = readingsPanel()
  const found = within(panel)
    .getAllByRole('listitem')
    .find((li) => li.querySelector('.tile-label')?.textContent?.startsWith(label))
  if (!found) throw new Error(`no ${label} tile`)
  return found
}
const go = (hash: string) => window.history.replaceState(null, '', hash)

afterEach(() => go('/'))

describe('Device readings on Home', () => {
  it('AC10: a newer oximeter reading shows over an older manual one, with its source', async () => {
    setup({ now: NOW, seed: [reading('a', '2026-11-14T09:00:00Z', 97)], observationSeed: [observation('m1', '2026-11-14T09:59:30Z', 91)] }).renderApp()

    await vi.waitFor(() => expect(respiratory()).toHaveTextContent('Check'))
    expect(respiratory().querySelector('.num')).toHaveTextContent('91')
    expect(respiratory()).toHaveTextContent(DEVICE)
    expect(tile('SpO₂')).toHaveTextContent('91')
    expect(within(tile('SpO₂')).getByText(DEVICE)).toHaveClass('tag')
  })

  it('AC11: a newer manual reading shows over an older oximeter one', async () => {
    setup({ now: NOW, seed: [reading('a', '2026-11-14T09:30:00Z', 97)], observationSeed: [observation('m1', '2026-11-14T09:00:00Z', 91)] }).renderApp()

    await vi.waitFor(() => expect(respiratory()).toHaveTextContent('Nominal'))
    expect(respiratory().querySelector('.num')).toHaveTextContent('97')
    expect(respiratory()).toHaveTextContent('manual')
    expect(respiratory()).not.toHaveTextContent('oximeter')
  })

  it('AC12: a reading emitted while Home is open updates the systems list and the tiles at once', async () => {
    const { readings, renderApp } = setup({ now: NOW, seed: [reading('a', '2026-11-14T09:00:00Z', 97)] })
    renderApp()
    await vi.waitFor(() => expect(respiratory()).toHaveTextContent('Nominal'))

    act(() => readings.emit(message('m1', 91)))

    await vi.waitFor(() => expect(respiratory()).toHaveTextContent('Check'))
    expect(tile('SpO₂')).toHaveTextContent('91')
    expect(within(tile('SpO₂')).getByText(DEVICE)).toBeInTheDocument()
  })

  it('AC15: a source that never emits leaves the manual statuses and readings, with no error text', async () => {
    setup({ now: NOW, seed: [reading('a', '2026-11-14T09:30:00Z', 97)] }).renderApp()

    await vi.waitFor(() => expect(respiratory()).toHaveTextContent('Nominal'))
    expect(tile('SpO₂')).toHaveTextContent('97')
    expect(screen.queryByText(/unavailable|error|broker/i)).toBeNull()
  })
})

describe('Device readings on the Respiratory detail', () => {
  const open = async (options: Parameters<typeof setup>[0]) => {
    go('#/systems/Respiratory')
    const s = setup({ now: NOW, ...options })
    s.renderApp()
    await screen.findByRole('region', { name: 'Respiratory detail' })
    return s
  }
  const detail = () => screen.getByRole('region', { name: 'Respiratory detail' })

  it('AC13: a reading emitted while the detail is open updates it at once', async () => {
    const { readings } = await open({ seed: [reading('a', '2026-11-14T09:00:00Z', 97)] })
    await vi.waitFor(() => expect(detail()).toHaveTextContent('Nominal'))

    act(() => readings.emit(message('m1', 91)))

    await vi.waitFor(() => expect(detail()).toHaveTextContent('Check'))
    expect(detail().querySelector('.detail-head .num')).toHaveTextContent('91')
    expect(detail()).toHaveTextContent(DEVICE)
  })

  it('AC14: each chart point names its own source', async () => {
    await open({ seed: [reading('a', '2026-11-13T09:00:00Z', 97)], observationSeed: [observation('m1', '2026-11-14T09:59:30Z', 91)] })

    await vi.waitFor(() => expect(detail().querySelectorAll('circle.chart-point')).toHaveLength(2))
    const titles = [...detail().querySelectorAll('circle.chart-point title')].map((t) => t.textContent ?? '')
    expect(titles[0]).toMatch(/ · manual$/)
    expect(titles[1]).toMatch(new RegExp(` · ${DEVICE}$`))
  })
})
