import { render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CheckInRecorder } from '../application/CheckInRecorder'
import { LatestReadingsReader } from '../application/LatestReadingsReader'
import { SyncService } from '../application/SyncService'
import { SystemStatusReader } from '../application/SystemStatusReader'
import type { CheckIn } from '../domain/checkIn'
import type { Rule } from '../domain/rules'
import { mockReadings } from '../infrastructure/mockReadings'
import rules from '../infrastructure/rules.json'
import { FakeConnectivity, FakeGateway, FakeRepository, FakeRuleSource } from '../test/fakes'
import { App } from './App'
import { ServicesProvider } from './ServicesContext'

const LABELS = ['SpO₂', 'Heart rate', 'Sleep', 'Mood', 'Blood pressure', 'Cabin CO₂']

function setup({ now = '2026-11-14T09:30:00Z', seed = [] as CheckIn[], online = true } = {}) {
  const clock = { now: new Date(now) }
  const repository = new FakeRepository()
  seed.forEach((c) => repository.items.set(c.id, { checkIn: c, pending: false }))
  const connectivity = new FakeConnectivity()
  connectivity.online = online
  const gateway = new FakeGateway()
  const ruleSource = new FakeRuleSource(rules as Rule[])
  const synchronizer = new SyncService(repository, gateway, connectivity)
  const services = {
    repository,
    connectivity,
    synchronizer,
    recorder: new CheckInRecorder(repository, synchronizer, undefined, () => clock.now),
    statusReader: new SystemStatusReader(ruleSource, repository, () => clock.now),
    readingsReader: new LatestReadingsReader(ruleSource, repository, () => clock.now, mockReadings),
  }
  return {
    clock,
    repository,
    gateway,
    ruleSource,
    readingsReader: services.readingsReader,
    renderApp: () =>
      render(
        <ServicesProvider services={services}>
          <App />
        </ServicesProvider>,
      ),
  }
}

const panel = () => screen.getByRole('region', { name: 'Latest readings' })
const tiles = () => within(panel()).findAllByRole('listitem')
const tile = (label: string) => {
  const found = within(panel())
    .getAllByRole('listitem')
    .find((li) => li.textContent?.includes(label))
  if (!found) throw new Error(`no ${label} tile`)
  return found
}

describe('LatestReadings', () => {
  afterEach(() => vi.useRealTimers())

  it('AC1: lists six tiles in READINGS order, Cabin CO₂ as a 1-h average', async () => {
    setup().renderApp()

    const items = await tiles()
    expect(items).toHaveLength(6)
    expect(items.map((li) => LABELS.find((label) => li.textContent?.includes(label)))).toEqual(LABELS)
    expect(tile('Cabin CO₂').querySelector('.tile-label__suffix')).toHaveTextContent('(1-h avg)')
  })

  it.each(['SpO₂', 'Heart rate', 'Sleep', 'Mood'])('AC2: %s shows "—" read as "No reading", with no unit, age, tag or badge', async (label) => {
    setup().renderApp()
    await tiles()

    const t = tile(label)
    expect(within(t).getByText('—').closest('[aria-hidden="true"]')).not.toBeNull()
    expect(t.querySelector('.visually-hidden')).toHaveTextContent('No reading')
    expect(t.querySelector('.badge')).toBeNull()
    expect(t.querySelector('.metric-tile__unit')).toBeNull()
    expect(t.querySelector('.tag')).toBeNull()
    expect(t.textContent).not.toMatch(/ago|old/)
  })

  it.each([
    ['Blood pressure', '108/70 mmHg'],
    ['Cabin CO₂', '2.3 mmHg'],
  ])('AC3: %s shows the synthetic %s with its tag, no badge and no age', async (label, shown) => {
    setup().renderApp()
    await tiles()

    const t = tile(label)
    expect(t).toHaveTextContent(shown)
    const tags = t.querySelectorAll('.tag')
    expect(tags).toHaveLength(1)
    expect(tags[0]).toHaveTextContent('synthetic')
    expect(t.querySelector('.badge')).toBeNull()
    expect(t.textContent).not.toMatch(/ago|old/)
  })

  it.each(LABELS)('AC4: %s has an icon with no data', async (label) => {
    setup().renderApp()
    await tiles()

    expect(tile(label).querySelector('.metric-tile__icon')).not.toBeNull()
  })
})
