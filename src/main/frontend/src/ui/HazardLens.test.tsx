import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockStatuses } from '../infrastructure/mockStatuses'
import { reading, setup } from '../test/renderApp'

const NOW = '2026-11-14T09:30:00Z'
const KEY = 'crew-health.hazard-lens'

/** Home with the nine placeholders and, unless `spo2` is undefined, one SpO₂ check-in recorded at `now`. */
function home({ spo2 = 97 as number | undefined } = {}) {
  return setup({ now: NOW, placeholders: mockStatuses, seed: spo2 === undefined ? [] : [reading('r1', NOW, spo2)] })
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
const ALL_ROWS = ['Respiratory', ...mockStatuses.map((p) => p.system)]

const figure = () => lens().querySelector<HTMLElement>('div.body-figure')!
const items = () => within(screen.getByRole('list', { name: 'Body figure' })).getAllByRole('listitem')
const itemOf = (system: string) => figure().querySelector<HTMLElement>(`li[data-system="${system}"]`)!
const itemsWith = (className: string) =>
  items()
    .filter((li) => li.classList.contains(className))
    .map((li) => li.dataset.system)
const LENS_CLASSES = ['lens-affected', 'lens-dimmed']
const LENS_NOTE = 'Lens on: affected systems marked, others dimmed. Status is unchanged by the lens.'

/** The Systems cell of each hazard row in issue #14's Design notes; Distance from Earth marks all rows. */
const HAZARD_ROWS: Record<string, string[]> = {
  Radiation: ['Radiation', 'Immune', 'Vision (SANS)', 'Cardiovascular', 'Cognition'],
  'Isolation & confinement': ['Sleep', 'Cognition'],
  'Gravity fields': ['Bone & muscle', 'Vision (SANS)', 'Kidney & hydration', 'Cardiovascular'],
  'Hostile/closed environment': ['Cognition', 'Cabin air', 'Sleep', 'Immune'],
}

describe('Hazard lens', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('AC1: five hazard buttons in NASA order, each with its icon', () => {
    home().renderApp()

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
    const { container } = home().renderApp()
    await screen.findByText('Respiratory')

    expect(chips().map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'false', 'false', 'false'])
    expect(captionLines()).toEqual(['Pick a hazard to see which body systems it affects.'])
    expect(container.querySelector('.lens-affected, .lens-dimmed')).toBeNull()
    expect(screen.queryByText(/^Lens on:/)).toBeNull()
  })

  it('AC3: selecting Hostile/closed environment presses it and shows its caption', async () => {
    home().renderApp()

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
    home().renderApp()
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
    const { container } = home().renderApp()
    await screen.findByText('Respiratory')
    await userEvent.click(chip('Gravity fields'))

    await userEvent.click(chip('Gravity fields'))

    expect(chips().every((b) => b.getAttribute('aria-pressed') === 'false')).toBe(true)
    expect(captionLines()).toEqual(['Pick a hazard to see which body systems it affects.'])
    expect(container.querySelector('.lens-affected, .lens-dimmed')).toBeNull()
    expect(screen.queryByText(/^Lens on:/)).toBeNull()
  })

  it('AC6: SpO₂ 97 % → each hazard marks exactly its rows and dims the rest', async () => {
    home().renderApp()
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
    home().renderApp()
    await within(list()).findByText('Respiratory')
    const before = badges()

    for (const name of Object.keys(HAZARD_ROWS)) {
      await userEvent.click(chip(name))

      expect(badges()).toEqual(before)
      expect(list().lastElementChild).toHaveTextContent(LENS_NOTE)
    }
  })

  it('AC7: SpO₂ 92 % and Distance from Earth → every row and figure item marked, the caution kept', async () => {
    home({ spo2: 92 }).renderApp()
    await within(list()).findByText('Respiratory')

    await userEvent.click(chip('Distance from Earth'))

    expect(systemsWith('lens-affected')).toEqual(ALL_ROWS)
    expect(itemsWith('lens-affected')).toHaveLength(6)
    expect(lens().ownerDocument.querySelector('.lens-dimmed')).toBeNull()
    rows().forEach((li) => expect(within(li).getByText('Affected by Distance from Earth')).toBeInTheDocument())
    items().forEach((li) => expect(within(li).getByText('Affected by Distance from Earth')).toBeInTheDocument())
    expect(rowOf('Respiratory')).toHaveTextContent('▲ CAUTION')
    expect(itemOf('Respiratory')).toHaveTextContent('▲ CAUTION')
    expect(captionLines()[1]).toBe('Affects: all systems, indirectly')
    expect(list().lastElementChild).toHaveTextContent('Lens on: all systems marked. Status is unchanged by the lens.')
  })

  it.each([
    [92, '▲ CAUTION'],
    [88, 'WARNING'],
  ])('AC9: SpO₂ %i % and Gravity fields → Respiratory row and Lungs item keep "%s", unmarked and undimmed', async (spo2, badge) => {
    home({ spo2 }).renderApp()
    await within(list()).findByText('Respiratory')

    await userEvent.click(chip('Gravity fields'))

    for (const element of [rowOf('Respiratory'), itemOf('Respiratory')]) {
      LENS_CLASSES.forEach((c) => expect(element).not.toHaveClass(c))
      expect(element).toHaveTextContent(badge)
    }
  })

  it('AC10: selecting Isolation & confinement stores its raw id', async () => {
    home().renderApp()

    await userEvent.click(chip('Isolation & confinement'))

    expect(localStorage.getItem(KEY)).toBe('isolation')
  })

  it('AC11: a stored isolation id is pressed when the app starts', () => {
    localStorage.setItem(KEY, 'isolation')

    home().renderApp()

    expect(chip('Isolation & confinement')).toHaveAttribute('aria-pressed', 'true')
  })

  it('AC12: deselecting removes the stored id', async () => {
    home().renderApp()
    await userEvent.click(chip('Isolation & confinement'))

    await userEvent.click(chip('Isolation & confinement'))

    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('AC13: an unknown stored value selects nothing', () => {
    localStorage.setItem(KEY, 'foo')

    home().renderApp()

    expect(chips().every((b) => b.getAttribute('aria-pressed') === 'false')).toBe(true)
  })

  it('AC14: storage that throws on read selects nothing and the app still renders', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked')
    })

    expect(() => home().renderApp()).not.toThrow()
    expect(chips().every((b) => b.getAttribute('aria-pressed') === 'false')).toBe(true)
  })

  it('AC15: storage that throws on write still selects Radiation', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked')
    })
    home().renderApp()

    await userEvent.click(chip('Radiation'))

    expect(chip('Radiation')).toHaveAttribute('aria-pressed', 'true')
  })

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
    ['SpO₂ 92 %', '▲ CAUTION', [reading('r1', NOW, 92)]],
    ['SpO₂ 88 %', 'WARNING', [reading('r1', NOW, 88)]],
    ['no SpO₂ reading', 'none', []],
    ['SpO₂ 92 % recorded 24 h 1 min ago', 'none', [reading('r1', '2026-11-13T09:29:00Z', 92)]],
  ])('AC17: %s → Lungs item badge: %s', async (_, badge, seed) => {
    setup({ now: NOW, placeholders: mockStatuses, seed }).renderApp()
    await within(list()).findByText('Respiratory')

    expect(itemOf('Respiratory').querySelector('.badge')?.textContent ?? 'none').toBe(badge)
  })

  it.each(['loading', 'failed'])('AC18: statuses %s → figure shows names, still marked by Radiation, no lens note', async (kind) => {
    localStorage.setItem(KEY, 'radiation')
    const app = home()
    if (kind === 'loading') vi.spyOn(app.statusReader, 'read').mockReturnValue(new Promise(() => {}))
    else app.ruleSource.fail = true
    app.renderApp()
    if (kind === 'failed') await within(list()).findByText('Status unavailable')

    expect(items().map((li) => li.querySelector('.badge'))).toEqual([null, null, null, null, null, null])
    expect(itemsWith('lens-affected')).toEqual(['Cognition', 'Vision (SANS)', 'Cardiovascular'])
    expect(itemsWith('lens-dimmed')).toEqual(['Respiratory', 'Kidney & hydration', 'Bone & muscle'])
    expect(screen.queryByText(/^Lens on:/)).toBeNull()
  })

  it('AC19: SpO₂ 97 % and Radiation → figure items, organ shapes and leader lines marked', async () => {
    home().renderApp()
    await within(list()).findByText('Respiratory')

    await userEvent.click(chip('Radiation'))

    const affected = ['Cognition', 'Vision (SANS)', 'Cardiovascular']
    expect(itemsWith('lens-affected')).toEqual(affected)
    affected.forEach((system) => {
      expect(within(itemOf(system)).getByText('Affected by Radiation')).toHaveClass('visually-hidden')
      expect(figure().querySelector(`svg .organ[data-system="${system}"]`)).toHaveClass('organ--affected')
      expect(figure().querySelector(`svg .leader[data-system="${system}"]`)).toHaveClass('leader--affected')
    })
    expect(figure().querySelectorAll('.organ--affected')).toHaveLength(3)
    expect(itemsWith('lens-dimmed')).toEqual(['Respiratory', 'Kidney & hydration', 'Bone & muscle'])
  })

  it('AC20: SpO₂ 97 % and Gravity fields → Eyes, Heart, Kidneys, Bone & muscle marked; Cognition, Lungs dimmed', async () => {
    home().renderApp()
    await within(list()).findByText('Respiratory')

    await userEvent.click(chip('Gravity fields'))

    expect(itemsWith('lens-affected')).toEqual(['Vision (SANS)', 'Cardiovascular', 'Kidney & hydration', 'Bone & muscle'])
    expect(itemsWith('lens-dimmed')).toEqual(['Cognition', 'Respiratory'])
  })

  it('AC21: the figure is display-only', () => {
    home().renderApp()

    expect(figure().querySelector('button, a')).toBeNull()
  })

  it('AC22: home is Body systems, then Hazard lens, then the right column', () => {
    const { container } = home().renderApp()

    const children = [...(container.querySelector('main.layout')?.children ?? [])]
    expect(children).toHaveLength(3)
    expect(children[0]).toBe(list())
    expect(children[1]).toBe(lens())
    expect(children[2]).toHaveClass('stack')
    expect(children[2].tagName).toBe('DIV')
  })
})
