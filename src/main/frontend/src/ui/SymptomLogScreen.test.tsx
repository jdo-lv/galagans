import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { setup } from '../test/renderApp'

describe('Log symptoms (#57)', () => {
  it('AC10: Log symptoms shows a focused heading and a blank form named by it', async () => {
    window.history.replaceState(null, '', '#/add')
    setup().renderApp()

    await userEvent.click(within(await screen.findByRole('region', { name: 'Add entry' })).getByRole('link', { name: 'Log symptoms' }))

    const region = await screen.findByRole('region', { name: 'Log symptoms' })
    expect(window.location.hash).toBe('#/symptoms')
    const heading = within(region).getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent(/^Log symptoms$/)
    await waitFor(() => expect(document.activeElement).toBe(heading))
    const forms = region.querySelectorAll('form')
    expect(forms).toHaveLength(1)
    const form = forms[0]
    expect(form).toHaveAttribute('aria-labelledby', heading.id)
    expect(form.children).toHaveLength(1)
    const text = form.firstElementChild as Element
    expect(text.tagName).toBe('P')
    expect(text).toHaveClass('muted')
    expect(text.textContent).toBe('Symptom fields come next.')
    expect(form.querySelectorAll('input, select, textarea, button')).toHaveLength(0)
  })
})
