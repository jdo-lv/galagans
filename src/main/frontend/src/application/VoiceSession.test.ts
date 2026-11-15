import { beforeEach, describe, expect, it } from 'vitest'
import { FakeCheckInForm, FakeSpeechInput, FakeSpeechOutput, FakeVoiceInterpreter, FakeVoiceScreen } from '../test/fakes'
import { VoiceSession } from './VoiceSession'

describe('VoiceSession', () => {
  let input: FakeSpeechInput
  let output: FakeSpeechOutput
  let interpreter: FakeVoiceInterpreter
  let screen: FakeVoiceScreen
  let session: VoiceSession

  beforeEach(() => {
    input = new FakeSpeechInput()
    output = new FakeSpeechOutput()
    interpreter = new FakeVoiceInterpreter()
    screen = new FakeVoiceScreen()
    const briefing = { brief: async (system?: string) => (system ? `Briefing on ${system}.` : 'Full briefing.') }
    session = new VoiceSession(input, output, interpreter, briefing)
  })

  it('gives the health briefing when it starts, and ends on "stop"', async () => {
    input.said = ['Stop.']

    await session.run(screen, new AbortController().signal)

    expect(output.spoken).toEqual(['Full briefing.', 'Voice off.'])
  })

  it('"how are my eyes doing" opens Vision (SANS) and briefs on it', async () => {
    input.said = ['How are my eyes doing?', 'stop']
    interpreter.commands['How are my eyes doing?'] = { kind: 'open', target: { screen: 'system', system: 'Vision (SANS)' } }

    await session.run(screen, new AbortController().signal)

    expect(screen.opened).toEqual([{ screen: 'system', system: 'Vision (SANS)' }])
    expect(output.spoken[1]).toBe('Briefing on Vision (SANS).')
  })

  it('opening the PVT turns voice off, so it never talks during the test', async () => {
    input.said = ['start the reaction test', 'how am I doing']
    interpreter.commands['start the reaction test'] = { kind: 'open', target: { screen: 'pvt' } }

    await session.run(screen, new AbortController().signal)

    expect(screen.opened).toEqual([{ screen: 'pvt' }])
    expect(screen.openedAfterSpeaking).toBe(true)
    expect(output.spoken).toEqual(['Full briefing.', 'Opening the reaction test. Voice is off during the test.'])
    expect(input.said).toEqual(['how am I doing'])
  })

  it('"go back" opens Home and says "Home."', async () => {
    input.said = ['go back', 'stop']
    interpreter.commands['go back'] = { kind: 'open', target: { screen: 'home' } }

    await session.run(screen, new AbortController().signal)

    expect(screen.opened).toEqual([{ screen: 'home' }])
    expect(output.spoken[1]).toBe('Home.')
  })

  it('"send the packet to the doctor" only opens the packet', async () => {
    input.said = ['send the packet to the doctor', 'stop']
    interpreter.commands['send the packet to the doctor'] = { kind: 'open', target: { screen: 'packet' } }

    await session.run(screen, new AbortController().signal)

    expect(screen.opened).toEqual([{ screen: 'packet' }])
    expect(output.spoken[1]).toBe('Opening the surgeon packet. Sending it needs a tap.')
  })

  it('"how am I doing" gives the full briefing again', async () => {
    input.said = ['how am I doing', 'stop']
    interpreter.commands['how am I doing'] = { kind: 'briefing' }

    await session.run(screen, new AbortController().signal)

    expect(output.spoken[1]).toBe('Full briefing.')
  })

  it('"okay, stop" ends voice: stop counts anywhere', async () => {
    input.said = ['okay, stop']

    await session.run(screen, new AbortController().signal)

    expect(output.spoken).toEqual(['Full briefing.', 'Voice off.'])
  })

  it('a reply that arrives after voice is off opens nothing and says nothing', async () => {
    const controller = new AbortController()
    input.said = ['how are my eyes doing']
    interpreter.commands['how are my eyes doing'] = { kind: 'open', target: { screen: 'system', system: 'Vision (SANS)' } }
    interpreter.onInterpret = () => controller.abort()

    await session.run(screen, controller.signal)

    expect(screen.opened).toEqual([])
    expect(output.spoken).toEqual(['Full briefing.'])
  })

  it('#64 AC59: answers with what it can do when the words are not a command', async () => {
    input.said = ["What's the weather on Mars?", 'stop']

    await session.run(screen, new AbortController().signal)

    expect(output.spoken[1]).toBe('I can give your health briefing or open a screen.')
  })

  it('shows thinking, speaking and listening while it works', async () => {
    input.said = ['stop']

    await session.run(screen, new AbortController().signal)

    expect(screen.states).toEqual(['thinking', 'speaking', 'listening', 'thinking', 'speaking'])
  })

  it('ends without speaking again once the signal aborts', async () => {
    const controller = new AbortController()
    input.onListen = () => controller.abort()

    await session.run(screen, controller.signal)

    expect(output.spoken).toHaveLength(1)
  })

  it('on a check-in it gives no briefing and asks the step on screen, then fills it from what is heard', async () => {
    const form = new FakeCheckInForm()
    screen.form = form
    input.said = ['Seventy two.', 'stop']
    interpreter.answers['Seventy two.'] = { kind: 'value', value: 72 }

    await session.run(screen, new AbortController().signal)

    expect(output.spoken).toEqual(['Heart rate value?', 'SpO₂ value?', 'Voice off.'])
    expect(form.filled).toEqual([{ kind: 'value', value: 72 }])
  })

  it('"start my check-in" opens it and asks its first step', async () => {
    screen.opensWith = new FakeCheckInForm()
    input.said = ['Start my check-in', 'stop']
    interpreter.commands['Start my check-in'] = { kind: 'open', target: { screen: 'check-in' } }

    await session.run(screen, new AbortController().signal)

    expect(output.spoken).toEqual(['Full briefing.', 'Heart rate value?', 'Voice off.'])
  })

  it('"save" ends voice after "Check-in saved."', async () => {
    const form = new FakeCheckInForm()
    form.index = 5
    form.outcome = 'saved'
    screen.form = form
    input.said = ['Save.', 'never heard']

    await session.run(screen, new AbortController().signal)

    expect(output.spoken).toEqual(['Symptoms, or none? Then say save.', 'Check-in saved.'])
    expect(input.said).toEqual(['never heard'])
  })
})
