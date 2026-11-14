import { beforeEach, describe, expect, it } from 'vitest'
import type { CheckInDraft } from '../domain/checkIn'
import { FakeSpeechInput, FakeSpeechOutput, FakeVoiceInterpreter, FakeVoiceScreen } from '../test/fakes'
import { VoiceSession } from './VoiceSession'

describe('VoiceSession', () => {
  let input: FakeSpeechInput
  let output: FakeSpeechOutput
  let interpreter: FakeVoiceInterpreter
  let screen: FakeVoiceScreen
  let recorded: CheckInDraft[]
  let alerts: string
  let session: VoiceSession

  beforeEach(() => {
    input = new FakeSpeechInput()
    output = new FakeSpeechOutput()
    interpreter = new FakeVoiceInterpreter()
    screen = new FakeVoiceScreen()
    recorded = []
    alerts = ''
    const recorder = {
      record: async (draft: CheckInDraft) => {
        recorded.push(draft)
        return { ...draft, id: 'c1', recordedAt: '2026-11-14T20:00:00Z' }
      },
    }
    const briefing = {
      brief: async (system?: string) => (system ? `Briefing on ${system}.` : 'Full briefing.'),
      alerts: async () => alerts,
    }
    session = new VoiceSession(input, output, interpreter, recorder, briefing)
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

  it('reads back a check-in answer and saves it only after "yes"', async () => {
    input.said = ['I slept six hours, mood four', 'Yes.', 'stop']
    interpreter.commands['I slept six hours, mood four'] = { kind: 'checkin', values: { sleepHours: 6, mood: 4 } }

    await session.run(screen, new AbortController().signal)

    expect(output.spoken[1]).toBe('Sleep 6 hours, mood 4 of 5. Say confirm to save, or no.')
    expect(recorded).toEqual([{ symptoms: [], sleepHours: 6, mood: 4 }])
    expect(screen.savedCount).toBe(1)
    expect(output.spoken[2]).toBe('Check-in saved.')
  })

  it('"Correct the heart rate, it\'s 62." is a correction, not a confirm: read back, saved only after "yes"', async () => {
    input.said = ['heart rate seventy two', "Correct the heart rate, it's 62.", 'yes', 'stop']
    interpreter.commands['heart rate seventy two'] = { kind: 'checkin', values: { heartRateBpm: 72 } }
    interpreter.commands["Correct the heart rate, it's 62."] = { kind: 'checkin', values: { heartRateBpm: 62 } }

    await session.run(screen, new AbortController().signal)

    expect(output.spoken[2]).toBe('Heart rate 62 beats per minute. Say confirm to save, or no.')
    expect(recorded).toEqual([{ symptoms: [], heartRateBpm: 62 }])
  })

  it('"Yes, but my mood is three." adds the mood instead of saving', async () => {
    input.said = ['I slept six hours', 'Yes, but my mood is three.', 'stop']
    interpreter.commands['I slept six hours'] = { kind: 'checkin', values: { sleepHours: 6 } }
    interpreter.commands['Yes, but my mood is three.'] = { kind: 'checkin', values: { mood: 3 } }

    await session.run(screen, new AbortController().signal)

    expect(output.spoken[2]).toBe('Sleep 6 hours, mood 3 of 5. Say confirm to save, or no.')
    expect(recorded).toEqual([])
  })

  it('"Yes, how am I doing?" saves: a confirm with no new value wins, the other request is not carried out', async () => {
    input.said = ['heart rate seventy two', 'Yes, how am I doing?', 'stop']
    interpreter.commands['heart rate seventy two'] = { kind: 'checkin', values: { heartRateBpm: 72 } }
    interpreter.commands['Yes, how am I doing?'] = { kind: 'briefing' }

    await session.run(screen, new AbortController().signal)

    expect(output.spoken[2]).toBe('Check-in saved.')
    expect(recorded).toEqual([{ symptoms: [], heartRateBpm: 72 }])
  })

  it('"Yes, oxygen 45." saves nothing: the out-of-range value is named and the earlier values wait for "yes"', async () => {
    input.said = ['heart rate seventy two', 'Yes, oxygen 45.', 'yes', 'stop']
    interpreter.commands['heart rate seventy two'] = { kind: 'checkin', values: { heartRateBpm: 72 } }
    interpreter.commands['Yes, oxygen 45.'] = { kind: 'checkin', values: {}, outOfRange: { spo2Percent: 45 } }

    await session.run(screen, new AbortController().signal)

    expect(output.spoken[2]).toBe('Oxygen 45 percent is outside what the check-in takes. Please say it again or type it.')
    expect(recorded).toEqual([{ symptoms: [], heartRateBpm: 72 }])
  })

  it('"No, that\'s not correct." discards the heard values: a decline word wins', async () => {
    input.said = ['heart rate seventy two', "No, that's not correct.", 'stop']
    interpreter.commands['heart rate seventy two'] = { kind: 'checkin', values: { heartRateBpm: 72 } }

    await session.run(screen, new AbortController().signal)

    expect(output.spoken[2]).toBe('Not saved.')
    expect(recorded).toEqual([])
  })

  it('"That\'s not correct." and "Don\'t save" save nothing', async () => {
    input.said = ['heart rate seventy two', "That's not correct.", 'heart rate seventy two', "Don't save", 'stop']
    interpreter.commands['heart rate seventy two'] = { kind: 'checkin', values: { heartRateBpm: 72 } }

    await session.run(screen, new AbortController().signal)

    expect(output.spoken[2]).toBe('Not saved.')
    expect(output.spoken[4]).toBe('Not saved.')
    expect(recorded).toEqual([])
  })

  it('after a save, any alert now present is spoken', async () => {
    input.said = ['oxygen eighty nine', 'yes', 'stop']
    interpreter.commands['oxygen eighty nine'] = { kind: 'checkin', values: { spo2Percent: 89 } }
    alerts = 'Warning, Respiratory. This is decision support; your flight surgeon has the final word.'

    await session.run(screen, new AbortController().signal)

    expect(output.spoken[2]).toBe('Check-in saved. Warning, Respiratory. This is decision support; your flight surgeon has the final word.')
  })

  it('reads all four values back in order: sleep, heart rate, oxygen, mood', async () => {
    input.said = ['all four', 'stop']
    interpreter.commands['all four'] = { kind: 'checkin', values: { mood: 4, spo2Percent: 92, heartRateBpm: 72, sleepHours: 6 } }

    await session.run(screen, new AbortController().signal)

    expect(output.spoken[1]).toBe('Sleep 6 hours, heart rate 72 beats per minute, oxygen 92 percent, mood 4 of 5. Say confirm to save, or no.')
  })

  it('values from two answers are merged, the newer value winning: "I slept six hours", "mood four", "yes"', async () => {
    input.said = ['I slept six hours', 'mood four', 'yes', 'stop']
    interpreter.commands['I slept six hours'] = { kind: 'checkin', values: { sleepHours: 6, mood: 2 } }
    interpreter.commands['mood four'] = { kind: 'checkin', values: { mood: 4 } }

    await session.run(screen, new AbortController().signal)

    expect(output.spoken[2]).toBe('Sleep 6 hours, mood 4 of 5. Say confirm to save, or no.')
    expect(recorded).toEqual([{ symptoms: [], sleepHours: 6, mood: 4 }])
  })

  it('turning voice off while the PVT sentence is spoken opens nothing', async () => {
    const controller = new AbortController()
    input.said = ['start the reaction test']
    interpreter.commands['start the reaction test'] = { kind: 'open', target: { screen: 'pvt' } }
    output.onSpeak = (text) => text.startsWith('Opening the reaction test') && controller.abort()

    await session.run(screen, controller.signal)

    expect(screen.opened).toEqual([])
  })

  it('any other command drops the heard values', async () => {
    input.said = ['I slept six hours', 'how am I doing', 'yes', 'stop']
    interpreter.commands['I slept six hours'] = { kind: 'checkin', values: { sleepHours: 6 } }
    interpreter.commands['how am I doing'] = { kind: 'briefing' }

    await session.run(screen, new AbortController().signal)

    expect(recorded).toEqual([])
    expect(output.spoken[3]).toBe('I can give your health briefing, open a screen, or take check-in answers.')
  })

  it('a check-in command without values answers "I didn\'t hear a value." and a later "yes" records nothing', async () => {
    input.said = ['my check-in', 'yes', 'stop']
    interpreter.commands['my check-in'] = { kind: 'checkin', values: {} }

    await session.run(screen, new AbortController().signal)

    expect(output.spoken[1]).toBe("I didn't hear a value.")
    expect(recorded).toEqual([])
  })

  it('"Yes, stop." ends voice and saves nothing: stop wins over confirm', async () => {
    input.said = ['I slept six hours', 'Yes, stop.']
    interpreter.commands['I slept six hours'] = { kind: 'checkin', values: { sleepHours: 6 } }

    await session.run(screen, new AbortController().signal)

    expect(output.spoken.at(-1)).toBe('Voice off.')
    expect(recorded).toEqual([])
  })

  it('a failed save keeps the values, so a second "yes" retries', async () => {
    let attempts = 0
    session = new VoiceSession(input, output, interpreter, {
      record: async (draft) => {
        if (++attempts === 1) throw new Error('storage failed')
        recorded.push(draft)
        return { ...draft, id: 'c1', recordedAt: '2026-11-14T20:00:00Z' }
      },
    }, { brief: async () => 'Full briefing.', alerts: async () => '' })
    input.said = ['I slept six hours', 'yes', 'yes', 'stop']
    interpreter.commands['I slept six hours'] = { kind: 'checkin', values: { sleepHours: 6 } }

    await session.run(screen, new AbortController().signal)

    expect(output.spoken.slice(2)).toEqual(['Check-in not saved. Say confirm to try again, or no.', 'Check-in saved.', 'Voice off.'])
    expect(recorded).toEqual([{ symptoms: [], sleepHours: 6 }])
  })

  it('a value outside the check-in limits is named and dropped; the others are read back', async () => {
    input.said = ['oxygen forty five, heart rate seventy two', 'stop']
    interpreter.commands['oxygen forty five, heart rate seventy two'] = {
      kind: 'checkin',
      values: { heartRateBpm: 72 },
      outOfRange: { spo2Percent: 45 },
    }

    await session.run(screen, new AbortController().signal)

    expect(output.spoken[1]).toBe(
      'Oxygen 45 percent is outside what the check-in takes. Please say it again or type it. ' +
        'Heart rate 72 beats per minute. Say confirm to save, or no.',
    )
  })

  it('only values outside the limits: named, nothing to confirm', async () => {
    input.said = ['oxygen forty five, heart rate three hundred', 'yes', 'stop']
    interpreter.commands['oxygen forty five, heart rate three hundred'] = {
      kind: 'checkin',
      values: {},
      outOfRange: { heartRateBpm: 300, spo2Percent: 45 },
    }

    await session.run(screen, new AbortController().signal)

    expect(output.spoken[1]).toBe('Heart rate 300 beats per minute, oxygen 45 percent are outside what the check-in takes. Please say it again or type it.')
    expect(recorded).toEqual([])
  })

  it('an empty check-in answer keeps the values heard before', async () => {
    input.said = ['I slept six hours', 'my check-in', 'yes', 'stop']
    interpreter.commands['I slept six hours'] = { kind: 'checkin', values: { sleepHours: 6 } }
    interpreter.commands['my check-in'] = { kind: 'checkin', values: {} }

    await session.run(screen, new AbortController().signal)

    expect(output.spoken[2]).toBe("I didn't hear a value.")
    expect(recorded).toEqual([{ symptoms: [], sleepHours: 6 }])
  })

  it('a "yes" transcribed after voice was turned off records nothing and says nothing', async () => {
    const controller = new AbortController()
    let turn = 0
    const lateInput = {
      listen: async () => {
        if (++turn === 1) return 'I slept six hours'
        controller.abort()
        return 'yes'
      },
    }
    interpreter.commands['I slept six hours'] = { kind: 'checkin', values: { sleepHours: 6 } }
    session = new VoiceSession(lateInput, output, interpreter, { record: async (d) => (recorded.push(d), { ...d, id: 'c', recordedAt: '' }) }, {
      brief: async () => 'Full briefing.',
      alerts: async () => '',
    })

    await session.run(screen, controller.signal)

    expect(recorded).toEqual([])
    expect(output.spoken).toHaveLength(2)
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

  it('"no" discards the heard values', async () => {
    input.said = ['heart rate seventy two', 'No.', 'yes', 'stop']
    interpreter.commands['heart rate seventy two'] = { kind: 'checkin', values: { heartRateBpm: 72 } }

    await session.run(screen, new AbortController().signal)

    expect(output.spoken[2]).toBe('Not saved.')
    expect(recorded).toEqual([])
  })

  it('answers with what it can do when the words are not a command', async () => {
    input.said = ["What's the weather on Mars?", 'stop']

    await session.run(screen, new AbortController().signal)

    expect(output.spoken[1]).toBe('I can give your health briefing, open a screen, or take check-in answers.')
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
})
