import { afterEach, describe, expect, it, vi } from 'vitest'
import { toTranscript, WhisperSpeechInput } from './WhisperSpeechInput'

it('" [BLANK_AUDIO]\\n" counts as silence; real speech is trimmed', () => {
  expect(toTranscript(' [BLANK_AUDIO]\n')).toBe('')
  expect(toTranscript(' How are my eyes doing?\n')).toBe('How are my eyes doing?')
  expect(toTranscript(undefined)).toBe('')
})

describe('WhisperSpeechInput', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  /** A microphone that records `rms` and a fetch that must not be called unless speech was heard. */
  function stubMicrophone(rms: number) {
    const track = { stop: vi.fn() }
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [track] }) } })
    vi.stubGlobal(
      'MediaRecorder',
      class {
        mimeType = 'audio/webm'
        ondataavailable: ((e: { data: Blob }) => void) | null = null
        onstop: (() => void) | null = null
        start() {}
        stop() {
          this.ondataavailable?.({ data: new Blob(['a']) })
          this.onstop?.()
        }
      },
    )
    vi.stubGlobal(
      'AudioContext',
      class {
        createAnalyser = () => ({ fftSize: 4, getFloatTimeDomainData: (samples: Float32Array) => samples.fill(rms) })
        createMediaStreamSource = () => ({ connect: () => {} })
        close = async () => {}
      },
    )
    const fetchFn = vi.fn(async () => new Response(JSON.stringify({ text: ' yes' })))
    vi.stubGlobal('fetch', fetchFn)
    return { track, fetchFn }
  }

  it('8 s without speech (RMS ≤ 0.02) gives "" without asking whisper-server, and releases the microphone', async () => {
    vi.useFakeTimers()
    const { track, fetchFn } = stubMicrophone(0.01)

    const listening = new WhisperSpeechInput('/voice/stt').listen(new AbortController().signal)
    await vi.advanceTimersByTimeAsync(8100)

    expect(await listening).toBe('')
    expect(fetchFn).not.toHaveBeenCalled()
    expect(track.stop).toHaveBeenCalled()
  })

  it('an abort while listening gives "" and releases the microphone', async () => {
    vi.useFakeTimers()
    const { track, fetchFn } = stubMicrophone(0.5)
    const controller = new AbortController()

    const listening = new WhisperSpeechInput('/voice/stt').listen(controller.signal)
    await vi.advanceTimersByTimeAsync(300)
    controller.abort()
    await vi.advanceTimersByTimeAsync(200)

    expect(await listening).toBe('')
    expect(fetchFn).not.toHaveBeenCalled()
    expect(track.stop).toHaveBeenCalled()
  })
})
