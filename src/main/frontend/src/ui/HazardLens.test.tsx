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
})
