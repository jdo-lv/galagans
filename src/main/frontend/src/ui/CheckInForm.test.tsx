import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { READINGS } from '../domain/readings'
import { CheckInForm } from './CheckInForm'

function limitsOf(indicator: string) {
  const spec = READINGS.find((r) => r.indicator === indicator)
  return spec && spec.indicator !== null ? { min: String(spec.validMin), max: String(spec.validMax) } : undefined
}

describe('CheckInForm', () => {
  it.each([
    ['heartRate', 'heartRateBpm'],
    ['spo2', 'spo2Percent'],
    ['sleep', 'sleepHours'],
    ['mood', 'mood'],
  ])('AC27: input %s has the min and max of the %s READINGS row', (name, indicator) => {
    const { container } = render(<CheckInForm onSubmit={async () => {}} />)
    const input = container.querySelector(`input[name=${name}]`)

    expect({ min: input?.getAttribute('min'), max: input?.getAttribute('max') }).toEqual(limitsOf(indicator))
  })
})
