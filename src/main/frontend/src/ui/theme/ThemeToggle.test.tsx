import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { ThemeToggle } from './ThemeToggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
  })

  it('switches a light screen to dark when tapped', async () => {
    render(<ThemeToggle />)

    await userEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }))

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()
  })

  it('starts in the theme chosen the last time the app ran', async () => {
    const firstRun = render(<ThemeToggle />)
    await userEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }))
    firstRun.unmount()
    delete document.documentElement.dataset.theme

    render(<ThemeToggle />)

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()
  })

  it('leaves the theme to the system until the crewmember picks one', () => {
    render(<ThemeToggle />)

    expect(document.documentElement.dataset.theme).toBeUndefined()
  })
})
