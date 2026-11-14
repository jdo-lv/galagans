import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { reading, setup } from '../test/renderApp'

describe('Voice control (F25)', () => {
  beforeEach(() => {
    window.location.hash = ''
  })

  it('the mic button gives the health briefing, listens, and turns off on a second tap', async () => {
    const { voice, renderApp } = setup()
    renderApp()
    const mic = screen.getByRole('button', { name: 'Voice control' })

    await userEvent.click(mic)

    expect(await screen.findByText('Voice: listening')).toBeInTheDocument()
    expect(voice.output.spoken[0]).toMatch(/^No cautions or warnings\. There is no .* reading yet\. To do today: .*\. What would you like to do next\?$/)
    expect(mic).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(mic)

    expect(screen.queryByText(/^Voice:/)).not.toBeInTheDocument()
    expect(mic).toHaveAttribute('aria-pressed', 'false')
  })

  it('a flagged system (Respiratory at SpO₂ 92 %) opens its detail screen', async () => {
    const { voice, renderApp } = setup({ seed: [reading('a', '2026-11-14T09:00:00Z', 92)] })
    voice.input.said = ['how is my breathing']
    voice.interpreter.commands['how is my breathing'] = { kind: 'open', target: { screen: 'system', system: 'Respiratory' } }
    renderApp()

    await userEvent.click(screen.getByRole('button', { name: 'Voice control' }))

    await waitFor(() => expect(voice.output.spoken[1]).toMatch(/^Caution, Respiratory\./))
    expect(window.location.hash).toBe('#/systems/Respiratory')
  })

  it('a system that is not flagged (Respiratory at SpO₂ 97 %) keeps the screen and only briefs on it', async () => {
    const { voice, renderApp } = setup({ seed: [reading('a', '2026-11-14T09:00:00Z', 97)] })
    voice.input.said = ['how is my breathing']
    voice.interpreter.commands['how is my breathing'] = { kind: 'open', target: { screen: 'system', system: 'Respiratory' } }
    renderApp()

    await userEvent.click(screen.getByRole('button', { name: 'Voice control' }))

    await waitFor(() => expect(voice.output.spoken[1]).toBe('Respiratory is nominal: SpO₂ 97 %. What would you like to do next?'))
    expect(window.location.hash).toBe('')
  })

  it('a system without a detail screen (Vision (SANS)) keeps the screen and only briefs on it', async () => {
    const { voice, renderApp } = setup()
    voice.input.said = ['How are my eyes doing?']
    voice.interpreter.commands['How are my eyes doing?'] = { kind: 'open', target: { screen: 'system', system: 'Vision (SANS)' } }
    renderApp()

    await userEvent.click(screen.getByRole('button', { name: 'Voice control' }))

    await waitFor(() => expect(voice.output.spoken[1]).toBe('There is no Vision (SANS) data yet. What would you like to do next?'))
    expect(window.location.hash).toBe('')
  })

  it('on the PVT screen the mic is disabled, so voice can\'t start during the test', async () => {
    window.location.hash = '#/pvt'
    const { voice, renderApp } = setup()
    renderApp()

    const mic = screen.getByRole('button', { name: 'Voice control' })
    expect(mic).toBeDisabled()
    await userEvent.click(mic)

    expect(voice.output.spoken).toEqual([])
    expect(mic).toHaveAttribute('aria-pressed', 'false')
  })

  it('tapping "Start reaction test" while voice is on turns voice off', async () => {
    const { renderApp } = setup()
    renderApp()
    const mic = screen.getByRole('button', { name: 'Voice control' })
    await userEvent.click(mic)
    await screen.findByText('Voice: listening')

    await userEvent.click(screen.getByRole('button', { name: 'Start reaction test' }))

    await waitFor(() => expect(mic).toHaveAttribute('aria-pressed', 'false'))
    expect(screen.queryByText(/^Voice:/)).not.toBeInTheDocument()
  })

  it('a check-in confirmed by voice is stored and Today\'s routine shows the morning check-in done', async () => {
    const { voice, repository, renderApp } = setup()
    voice.input.said = ['I slept six hours', 'yes']
    voice.interpreter.commands['I slept six hours'] = { kind: 'checkin', values: { sleepHours: 6 } }
    renderApp()

    await userEvent.click(screen.getByRole('button', { name: 'Voice control' }))

    await waitFor(() => expect([...repository.items.values()].map((i) => i.checkIn.sleepHours)).toEqual([6]))
    await waitFor(() => expect(screen.getByText('Morning check-in').closest('li')).toHaveClass('routine-item--done'))
  })

  it('says "Voice: audio not available" when the microphone is blocked', async () => {
    const { voice, renderApp } = setup()
    voice.input.audioBlocked = true
    renderApp()

    await userEvent.click(screen.getByRole('button', { name: 'Voice control' }))

    expect(await screen.findByText('Voice: audio not available')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Voice control' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('tapping the mic after an error pill starts a new session', async () => {
    const { voice, renderApp } = setup()
    voice.input.audioBlocked = true
    renderApp()
    const mic = screen.getByRole('button', { name: 'Voice control' })
    await userEvent.click(mic)
    await screen.findByText('Voice: audio not available')

    voice.input.audioBlocked = false
    await userEvent.click(mic)

    expect(await screen.findByText('Voice: listening')).toBeInTheDocument()
    expect(mic).toHaveAttribute('aria-pressed', 'true')
  })

  it('says the voice host is unreachable when the model does not answer', async () => {
    const { voice, renderApp } = setup()
    voice.input.said = ['how am I doing']
    voice.interpreter.unreachable = true
    renderApp()

    await userEvent.click(screen.getByRole('button', { name: 'Voice control' }))

    expect(await screen.findByText('Voice host unreachable')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Voice control' })).toHaveAttribute('aria-pressed', 'false')
  })
})
