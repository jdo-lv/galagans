import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockStatuses } from '../infrastructure/mockStatuses'
import { setup } from '../test/renderApp'
import { BodyFigure } from './BodyFigure'
import { BODY_OUTLINES } from './bodyOutlines'

// #61: the drawing itself. Labels, badges and display-only stay in HazardLens.test.tsx "Body figure on Home".
const silhouette = () => document.querySelector<SVGPathElement>('.body-figure .silhouette')!
const positions = () => ({
  icons: [...document.querySelectorAll('.body-figure svg .organ')].map((i) => ['x', 'y', 'width'].map((a) => i.getAttribute(a))),
  labels: [...document.querySelectorAll<HTMLElement>('.hotspot')].map((li) => li.getAttribute('style')),
})

describe('Body figure drawing (#61)', () => {
  it('AC3: on Home each system is marked on the drawing by its icon', async () => {
    setup({ now: '2026-11-14T09:30:00Z', placeholders: mockStatuses }).renderApp()
    await within(screen.getByRole('region', { name: 'Body systems' })).findByText('Respiratory')

    const icons = [...document.querySelectorAll<SVGElement>('.body-figure svg .organ')]
    expect(icons.map((icon) => icon.dataset.system)).toEqual([
      'Cognition',
      'Vision (SANS)',
      'Respiratory',
      'Cardiovascular',
      'Kidney & hydration',
      'Bone & muscle',
    ])
    expect(icons.map((icon) => [...icon.classList].find((c) => c.startsWith('tabler-icon-')))).toEqual([
      'tabler-icon-brain',
      'tabler-icon-eye',
      'tabler-icon-lungs',
      'tabler-icon-heartbeat',
      'tabler-icon-kidneys',
      'tabler-icon-bone',
    ])
  })

  it('AC1: draws the female outline by default', () => {
    render(<BodyFigure statuses={{ kind: 'loading' }} />)

    expect(silhouette()).toHaveAttribute('data-body', 'female')
    expect(silhouette()).toHaveAttribute('d', BODY_OUTLINES.female)
  })

  it('AC2: draws the male outline with the same icon and label positions', () => {
    const { unmount } = render(<BodyFigure statuses={{ kind: 'loading' }} />)
    const female = positions()
    unmount()

    render(<BodyFigure statuses={{ kind: 'loading' }} body="male" />)

    expect(silhouette()).toHaveAttribute('data-body', 'male')
    expect(silhouette()).toHaveAttribute('d', BODY_OUTLINES.male)
    expect(positions()).toEqual(female)
  })

  it('AC15: crops the 532 × 362 frame to the figure and hangs each label off its leader end', () => {
    render(<BodyFigure statuses={{ kind: 'loading' }} />)

    expect(document.querySelector('.body-figure svg')).toHaveAttribute('viewBox', '117 0 264 362')
    const heart = document.querySelector<SVGLineElement>('.leader[data-system="Cardiovascular"]')!
    expect([heart.getAttribute('x2'), heart.getAttribute('y2')]).toEqual(['318', '95'])
    const label = document.querySelector<HTMLElement>('.hotspot[data-system="Cardiovascular"]')!
    expect(label.style.getPropertyValue('--x')).toBe(`${((318 - 117) / 264) * 100}%`)
    expect(label.style.getPropertyValue('--y')).toBe(`${(95 / 362) * 100}%`)
  })

  it('AC22: the figure draws no hazard-lens marks (the lens lives on Stats, which has no figure)', () => {
    render(<BodyFigure statuses={{ kind: 'loading' }} />)

    expect(document.querySelector('.body-figure [class*="affected"], .body-figure [class*="dimmed"]')).toBeNull()
  })
})
