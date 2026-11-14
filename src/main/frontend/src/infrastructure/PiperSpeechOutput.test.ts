import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockStatuses } from './mockStatuses'
import { forSpeech, PiperSpeechOutput } from './PiperSpeechOutput'
import rules from './rules.json'

describe('forSpeech', () => {
  it('says symbols and units in rule text as words', () => {
    expect(forSpeech('SpO₂ is below 94 %. Still below 94 % → tell the CMO now.')).toBe(
      'S P O 2 is below 94 percent. Still below 94 percent, then tell the CMO now.',
    )
    expect(forSpeech('Your PVT median is above 305 ms (synthetic baseline 265 ms + 15 %).')).toBe(
      'Your PVT median is above 305 milliseconds (synthetic baseline 265 milliseconds plus 15 percent).',
    )
  })

  it('says the short forms of the system details as words', () => {
    expect(forSpeech('HR 63 bpm · BP 108/70')).toBe('heart rate 63 beats per minute, blood pressure 108 over 70')
    expect(forSpeech('Exercise 540/600 min/wk')).toBe('Exercise 540 of 600 minutes per week')
    expect(forSpeech('Fluids 1.1/2.5 L today')).toBe('Fluids 1.1 of 2.5 litres today')
    expect(forSpeech('38% of 30-day limit')).toBe('38 percent of 30-day limit')
    expect(forSpeech('self-test done Wed · no changes')).toBe('self-test done Wednesday, no changes')
    expect(forSpeech('CO₂ 2.3 mmHg (1-h avg)')).toBe('CO2 2.3 millimetres of mercury (1-hour average)')
    expect(forSpeech('PVT 268 ms · within your baseline')).toBe('PVT 268 milliseconds, within your baseline')
  })

  it('leaves no symbol in any spoken rule text or system detail', () => {
    const spoken = [...rules.flatMap((r) => [r.what, r.why, r.next]), ...mockStatuses.map((p) => p.detail)]

    expect(spoken.map(forSpeech).filter((text) => /[^A-Za-z0-9 .,;:'()?!-]/.test(text))).toEqual([])
  })
})

describe('PiperSpeechOutput', () => {
  afterEach(() => vi.unstubAllGlobals())

  function stubAudio() {
    const played: { pause: () => void; type?: string }[] = []
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array([82, 73, 70, 70]), { headers: { 'Content-Type': 'text/html' } })))
    vi.stubGlobal('URL', { ...URL, createObjectURL: (blob: Blob) => (played.push({ pause: vi.fn(), type: blob.type }), 'blob:x'), revokeObjectURL: () => {} })
    vi.stubGlobal(
      'Audio',
      class {
        onended: (() => void) | null = null
        onerror: (() => void) | null = null
        pause = () => played.at(-1)?.pause()
        play = async () => {}
      },
    )
    return played
  }

  it('plays Piper\'s reply as audio/wav and stops playing when the signal aborts', async () => {
    const played = stubAudio()
    const controller = new AbortController()

    const speaking = new PiperSpeechOutput('/voice/tts').speak('Home.', controller.signal)
    await vi.waitFor(() => expect(played).toHaveLength(1))
    controller.abort()
    await speaking

    expect(played[0].type).toBe('audio/wav')
    expect(played[0].pause).toHaveBeenCalled()
  })
})
