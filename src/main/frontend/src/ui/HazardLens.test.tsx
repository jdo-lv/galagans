import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockStatuses } from '../infrastructure/mockStatuses'
import { pvt, reading, setup } from '../test/renderApp'

const NOW = '2026-11-14T09:30:00Z'
const KEY = 'crew-health.hazard-lens'

/** Stats (#52) with the nine placeholders and, unless `spo2` is undefined, one SpO₂ check-in recorded at `now`. */
function stats({ spo2 = 97 as number | undefined } = {}) {
  window.history.replaceState(null, '', '/#/stats')
  return setup({ now: NOW, placeholders: mockStatuses, seed: spo2 === undefined ? [] : [reading('r1', NOW, spo2)] })
}

/** Home, where the body figure lives since #52. */
function home(seed = [reading('r1', NOW, 97)]) {
  return setup({ now: NOW, placeholders: mockStatuses, seed })
}

const lens = () => screen.getByRole('region', { name: 'Hazard lens · NASA HRP five hazards' })
const hazards = () => within(lens()).getByRole('group', { name: 'Hazards' })
const chip = (name: string) => within(hazards()).getByRole('button', { name })
const chips = () => within(hazards()).getAllByRole('button')
const captionLines = () => [...lens().querySelectorAll('[aria-live="polite"] p')].map((p) => p.textContent)

const list = () => screen.getByRole('region', { name: 'Body systems' })
const rows = () => within(list()).getAllByRole('listitem')
const rowOf = (system: string) => rows().find((li) => li.querySelector('.status-system')?.textContent === system)!
const systemsWith = (className: string) =>
  rows()
    .filter((li) => li.classList.contains(className))
    .map((li) => li.querySelector('.status-system')?.textContent)
const badges = () => rows().map((li) => li.querySelector('.badge')?.textContent)
// Rule-driven systems first (Respiratory, Cognition, Cabin air, Radiation), then the placeholders they don't cover.
const ALL_ROWS = ['Respiratory', 'Cognition', 'Cabin air', 'Radiation', 'Cardiovascular', 'Immune', ...mockStatuses.map((p) => p.system).filter((s) => s !== 'Cognition')]

const figure = () => document.querySelector<HTMLElement>('.body-card div.body-figure')!
const items = () => within(screen.getByRole('list', { name: 'Body figure' })).getAllByRole('listitem')
const itemOf = (system: string) => figure().querySelector<HTMLElement>(`li[data-system="${system}"]`)!
// A label's level badge (2–5); an owed input adds the To do badge (level 1, #52), which these tests don't cover.
const LEVEL_BADGE = '.badge:not(.badge--todo)'
const LENS_CLASSES = ['lens-affected', 'lens-dimmed']
const sidePanel = () => document.querySelector<HTMLElement>('.shell-side')!
const panes = () => [...document.querySelectorAll<HTMLElement>('.shell-pane')]
const LENS_NOTE = 'Lens on: affected systems marked, others dimmed. Status is unchanged by the lens.'

/** The Systems cell of each hazard row in issue #14's Design notes; Distance from Earth marks all rows. */
const HAZARD_ROWS: Record<string, string[]> = {
  Radiation: ['Radiation', 'Immune', 'Vision (SANS)', 'Cardiovascular', 'Cognition'],
  'Isolation & confinement': ['Sleep', 'Cognition'],
  'Gravity fields': ['Bone & muscle', 'Vision (SANS)', 'Kidney & hydration', 'Cardiovascular'],
  'Hostile/closed environment': ['Cognition', 'Cabin air', 'Sleep', 'Immune'],
}

describe('Hazard lens on Stats (#14, #52 AC19)', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('AC1: five hazard buttons in NASA order, each with its icon', () => {
    stats().renderApp()

    expect(chips().map((b) => b.textContent)).toEqual([
      'Radiation',
      'Isolation & confinement',
      'Distance from Earth',
      'Gravity fields',
      'Hostile/closed environment',
    ])
    expect(chips().map((b) => b.querySelector('svg')?.getAttribute('class'))).toEqual([
      expect.stringContaining('tabler-icon-radioactive'),
      expect.stringContaining('tabler-icon-users-group'),
      expect.stringContaining('tabler-icon-world'),
      expect.stringContaining('tabler-icon-arrow-bar-to-down'),
      expect.stringContaining('tabler-icon-biohazard'),
    ])
  })

  it('AC2: nothing stored → lens off: no button pressed, prompt caption, no marks, no note', async () => {
    const { container } = stats().renderApp()
    await screen.findByText('Respiratory')

    expect(chips().map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'false', 'false', 'false'])
    expect(captionLines()).toEqual(['Pick a hazard to see which body systems it affects.'])
    expect(container.querySelector('.lens-affected, .lens-dimmed')).toBeNull()
    expect(screen.queryByText(/^Lens on:/)).toBeNull()
  })

  it('AC3: selecting Hostile/closed environment presses it and shows its caption', async () => {
    stats().renderApp()

    await userEvent.click(chip('Hostile/closed environment'))

    expect(chips().map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'false', 'false', 'true'])
    expect(captionLines()).toEqual([
      'Hostile/closed environment: Altered microbes, raised stress hormones, immune dysregulation, CO₂, noise, toxic contaminants.',
      'Affects: Cognition · Cabin air · Sleep · Immune',
      'Watched by: cabin CO₂ · temperature · humidity · noise',
      'Source: NASA HRP five hazards (research/nasa-hrp.md §1); CO₂ and noise effects (research/health-indicators.md, Summary table)',
    ])
  })

  it('AC4: switching from Hostile/closed environment to Gravity fields', async () => {
    stats().renderApp()
    await userEvent.click(chip('Hostile/closed environment'))

    await userEvent.click(chip('Gravity fields'))

    expect(chips().map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'false', 'true', 'false'])
    expect(captionLines()).toEqual([
      'Gravity fields: Bone loss, muscle loss, headward fluid shift (vision), kidney stones, orthostatic intolerance after landing, balance and motion sickness.',
      'Affects: Bone & muscle · Vision (SANS) · Kidney & hydration · Cardiovascular',
      'Watched by: BP · fluids · vision self-test · body mass · exercise minutes',
      'Source: NASA HRP five hazards (research/nasa-hrp.md §1)',
    ])
  })

  it('AC5: clicking the pressed hazard clears the lens', async () => {
    const { container } = stats().renderApp()
    await screen.findByText('Respiratory')
    await userEvent.click(chip('Gravity fields'))

    await userEvent.click(chip('Gravity fields'))

    expect(chips().every((b) => b.getAttribute('aria-pressed') === 'false')).toBe(true)
    expect(captionLines()).toEqual(['Pick a hazard to see which body systems it affects.'])
    expect(container.querySelector('.lens-affected, .lens-dimmed')).toBeNull()
    expect(screen.queryByText(/^Lens on:/)).toBeNull()
  })

  it('AC6: SpO₂ 97 % → each hazard marks exactly its rows and dims the rest', async () => {
    stats().renderApp()
    await within(list()).findByText('Respiratory')
    expect(rows().map((li) => li.querySelector('.status-system')?.textContent)).toEqual(ALL_ROWS)

    for (const [name, systems] of Object.entries(HAZARD_ROWS)) {
      await userEvent.click(chip(name))

      expect(systemsWith('lens-affected').sort()).toEqual([...systems].sort())
      expect(systemsWith('lens-dimmed').sort()).toEqual(ALL_ROWS.filter((s) => !systems.includes(s)).sort())
      systems.forEach((system) => expect(within(rowOf(system)).getByText(`Affected by ${name}`)).toHaveClass('visually-hidden'))
    }
  })

  it('AC8: SpO₂ 97 % → a hazard never changes a status, and the card ends with the lens note', async () => {
    stats().renderApp()
    await within(list()).findByText('Respiratory')
    const before = badges()

    for (const name of Object.keys(HAZARD_ROWS)) {
      await userEvent.click(chip(name))

      expect(badges()).toEqual(before)
      expect(list().lastElementChild).toHaveTextContent(LENS_NOTE)
    }
  })

  it('AC7: SpO₂ 92 % and Distance from Earth → every row marked, the caution kept', async () => {
    stats({ spo2: 92 }).renderApp()
    await within(list()).findByText('Respiratory')

    await userEvent.click(chip('Distance from Earth'))

    expect(systemsWith('lens-affected')).toEqual(ALL_ROWS)
    expect(lens().ownerDocument.querySelector('.lens-dimmed')).toBeNull()
    rows().forEach((li) => expect(within(li).getByText('Affected by Distance from Earth')).toBeInTheDocument())
    expect(rowOf('Respiratory')).toHaveTextContent('Check')
    expect(captionLines()[1]).toBe('Affects: all systems, indirectly')
    expect(list().lastElementChild).toHaveTextContent('Lens on: all systems marked. Status is unchanged by the lens.')
  })

  it.each([
    [92, 'Check'],
    [88, 'Emergency'],
  ])('AC9: SpO₂ %i % and Gravity fields → Respiratory row keeps "%s", unmarked and undimmed', async (spo2, badge) => {
    stats({ spo2 }).renderApp()
    await within(list()).findByText('Respiratory')

    await userEvent.click(chip('Gravity fields'))

    LENS_CLASSES.forEach((c) => expect(rowOf('Respiratory')).not.toHaveClass(c))
    expect(rowOf('Respiratory')).toHaveTextContent(badge)
  })

  it('AC10: selecting Isolation & confinement stores its raw id', async () => {
    stats().renderApp()

    await userEvent.click(chip('Isolation & confinement'))

    expect(localStorage.getItem(KEY)).toBe('isolation')
  })

  it('AC11: a stored isolation id is pressed when the app starts', () => {
    localStorage.setItem(KEY, 'isolation')

    stats().renderApp()

    expect(chip('Isolation & confinement')).toHaveAttribute('aria-pressed', 'true')
  })

  it('AC12: deselecting removes the stored id', async () => {
    stats().renderApp()
    await userEvent.click(chip('Isolation & confinement'))

    await userEvent.click(chip('Isolation & confinement'))

    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('AC13: an unknown stored value selects nothing', () => {
    localStorage.setItem(KEY, 'foo')

    stats().renderApp()

    expect(chips().every((b) => b.getAttribute('aria-pressed') === 'false')).toBe(true)
  })

  it('AC14: storage that throws on read selects nothing and the app still renders', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked')
    })

    expect(() => stats().renderApp()).not.toThrow()
    expect(chips().every((b) => b.getAttribute('aria-pressed') === 'false')).toBe(true)
  })

  it('AC15: storage that throws on write still selects Radiation', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked')
    })
    stats().renderApp()

    await userEvent.click(chip('Radiation'))

    expect(chip('Radiation')).toHaveAttribute('aria-pressed', 'true')
  })

  it('#52 AC18: Stats is the "Stats" heading beside the lens card, then Body systems, with no body figure', async () => {
    stats().renderApp()
    await within(list()).findByText('Respiratory')

    expect(within(sidePanel()).getByRole('heading', { level: 2 })).toHaveTextContent('Stats')
    expect(panes().map((pane) => [...pane.children])).toEqual([[lens()], [list()]])
    expect(within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', { name: 'Stats' })).toHaveAttribute('aria-current', 'page')
    expect(document.querySelector('.body-figure')).toBeNull()
  })
})

describe('Body figure on Home (#14, moved by #52)', () => {
  it('AC16: the body figure is a hidden drawing plus six labelled items, each tied to a system', () => {
    home().renderApp()

    expect(figure().querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(items().map((li) => [li.querySelector('.hotspot__label')?.textContent, li.dataset.system])).toEqual([
      ['Cognition', 'Cognition'],
      ['Eyes', 'Vision (SANS)'],
      ['Lungs', 'Respiratory'],
      ['Heart', 'Cardiovascular'],
      ['Kidneys', 'Kidney & hydration'],
      ['Bone & muscle', 'Bone & muscle'],
    ])
  })

  it.each([
    ['SpO₂ 97 %', 'none', [reading('r1', NOW, 97)]],
    ['SpO₂ 92 %', 'Check', [reading('r1', NOW, 92)]],
    ['SpO₂ 88 %', 'Emergency', [reading('r1', NOW, 88)]],
    ['no SpO₂ reading', 'none', []],
    ['SpO₂ 92 % recorded 24 h 1 min ago', 'none', [reading('r1', '2026-11-13T09:29:00Z', 92)]],
  ])('AC17: %s → Lungs item badge: %s', async (_, badge, seed) => {
    setup({ now: NOW, placeholders: mockStatuses, seed }).renderApp()
    await within(list()).findByText('Respiratory')

    expect(itemOf('Respiratory').querySelector(LEVEL_BADGE)?.textContent ?? 'none').toBe(badge)
  })

  it.each([
    [119, 'none'],
    [125, 'Watch'],
    [150, 'Treat'],
  ])('#43 AC10: systolic %s → Heart item badge: %s, flagged at levels 2–5', async (systolic, badge) => {
    const observationSeed = [
      {
        resourceType: 'Observation' as const, id: 'bp-cuff:m1:systolicMmHg', status: 'final' as const, code: { text: 'systolicMmHg' as const },
        valueQuantity: { value: systolic, unit: 'mmHg' }, effectiveDateTime: NOW, device: { display: 'BP cuff · synthetic' as const },
      },
    ]
    setup({ now: NOW, placeholders: mockStatuses, observationSeed }).renderApp()
    await within(list()).findByText('Respiratory')
    await within(list()).findByText(`Systolic`, { exact: false })

    expect(itemOf('Cardiovascular').querySelector(LEVEL_BADGE)?.textContent ?? 'none').toBe(badge)
    expect(itemOf('Cardiovascular').classList.contains('hotspot--flagged')).toBe(badge !== 'none')
  })

  it.each(['loading', 'failed'])('AC18: statuses %s → figure shows the six names and no badge', async (kind) => {
    const app = home()
    if (kind === 'loading') vi.spyOn(app.statusReader, 'read').mockReturnValue(new Promise(() => {}))
    else app.ruleSource.fail = true
    app.renderApp()
    if (kind === 'failed') await within(list()).findByText('Status unavailable')

    expect(items().map((li) => li.dataset.system)).toEqual(['Cognition', 'Vision (SANS)', 'Respiratory', 'Cardiovascular', 'Kidney & hydration', 'Bone & muscle'])
    expect(items().map((li) => li.querySelector(LEVEL_BADGE))).toEqual([null, null, null, null, null, null])
  })

  it('AC21: the figure is display-only', () => {
    home().renderApp()

    expect(figure().querySelector('button, a')).toBeNull()
  })
})

describe('Body figure with COG-01 (#17)', () => {
  it.each([
    [312, 'Check'],
    [268, undefined],
  ])('AC17: a PVT of %s gives the Cognition label badge %s', async (ms, badge) => {
    setup({ now: NOW, placeholders: mockStatuses, seed: [pvt('p', NOW, ms)] }).renderApp()
    await within(screen.getByRole('region', { name: 'Body systems' })).findAllByRole('listitem')

    await vi.waitFor(() => expect(itemOf('Cognition').querySelector(LEVEL_BADGE)?.textContent).toBe(badge))
  })

  it.each([
    ['HR 70 on 12–14 Nov (AC6)', false, 'Watch'],
    ['plus HR 66 on 14 Nov 08:00 (AC8)', true, 'none'],
  ])('#35 AC19: %s → Heart item badge: %s', async (_, lower, badge) => {
    const seed = [12, 13, 14].map((day) => ({ id: `hr-${day}`, recordedAt: `2026-11-${day}T07:00:00Z`, heartRateBpm: 70, symptoms: [] }))
    if (lower) seed.push({ id: 'hr-14-08', recordedAt: '2026-11-14T08:00:00Z', heartRateBpm: 66, symptoms: [] })
    setup({ now: NOW, placeholders: mockStatuses, seed }).renderApp()
    await within(list()).findByText(badge === 'none' ? 'Heart rate' : 'Resting HR', { exact: false })

    const element = itemOf('Cardiovascular').querySelector(LEVEL_BADGE)
    expect(element?.textContent ?? 'none').toBe(badge)
    if (element) {
      expect(element).toHaveClass('badge', 'badge--watch')
      expect(element.querySelector('svg')).toHaveClass('tabler-icon-trending-up')
    }
  })
})

