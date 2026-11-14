import { render } from '@testing-library/react'
import type { ComponentType } from 'react'
import { describe, expect, it } from 'vitest'
import * as icons from './icons'

const entries = Object.entries(icons) as [string, ComponentType<{ size?: number }>][]

describe('app icons', () => {
  it('exports the body systems, statuses and readings the app talks about', () => {
    expect(Object.keys(icons)).toEqual(
      expect.arrayContaining(['RespiratoryIcon', 'KidneyIcon', 'DigestionIcon', 'Spo2Icon', 'CautionIcon', 'WarningIcon']),
    )
  })

  it.each(entries)('%s is decorative, 22 px by default and takes the shared line weight', (_, Icon) => {
    const { container } = render(<Icon />)
    const svg = container.querySelector('svg')

    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('width', '22')
    expect(svg).toHaveClass('tabler-icon')
  })

  it('lets a caller pick another size', () => {
    const { container } = render(<icons.OfflineIcon size={18} />)

    expect(container.querySelector('svg')).toHaveAttribute('width', '18')
  })
})
