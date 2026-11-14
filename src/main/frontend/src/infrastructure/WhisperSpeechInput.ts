import type { SpeechInput } from '../domain/ports'
import { AudioUnavailableError } from '../domain/voice'

const SPEECH_RMS = 0.02
const PAUSE_MS = 1200
const WAIT_MS = 8000
const MAX_MS = 15000

/** Records the microphone until the speaker pauses, then transcribes with the ship-local whisper-server (F25). */
export class WhisperSpeechInput implements SpeechInput {
  constructor(private readonly baseUrl = '') {}

  async listen(signal: AbortSignal): Promise<string> {
    if (signal.aborted) return ''
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch((error: Error) => {
      throw new AudioUnavailableError(error.message)
    })
    try {
      const audio = await record(stream, signal)
      return audio ? await this.transcribe(audio) : ''
    } finally {
      stream.getTracks().forEach((track) => track.stop())
    }
  }

  private async transcribe(audio: Blob): Promise<string> {
    const form = new FormData()
    form.append('file', audio, 'speech.webm')
    form.append('response_format', 'json')
    const response = await fetch(`${this.baseUrl}/inference`, { method: 'POST', body: form })
    if (!response.ok) throw new Error(`Speech-to-text failed with status ${response.status}`)
    // A reply without text counts as silence.
    return toTranscript((await response.json().catch(() => ({}))).text)
  }
}

/** Whisper's text, or '' for a bracketed non-speech tag such as "[BLANK_AUDIO]", which counts as silence. */
export function toTranscript(text: unknown): string {
  if (typeof text !== 'string') return ''
  const trimmed = text.trim()
  return /^\[.*\]$/.test(trimmed) ? '' : trimmed
}

/** Resolves with the recording once speech is followed by a pause; undefined when nobody spoke or it was aborted. */
function record(stream: MediaStream, signal: AbortSignal): Promise<Blob | undefined> {
  return new Promise((resolve) => {
    const recorder = new MediaRecorder(stream)
    const chunks: Blob[] = []
    const context = new AudioContext()
    const analyser = context.createAnalyser()
    context.createMediaStreamSource(stream).connect(analyser)
    const samples = new Float32Array(analyser.fftSize)
    const started = performance.now()
    let spoke = false
    let lastSound = started

    const timer = setInterval(() => {
      analyser.getFloatTimeDomainData(samples)
      const rms = Math.sqrt(samples.reduce((sum, x) => sum + x * x, 0) / samples.length)
      const now = performance.now()
      if (rms > SPEECH_RMS) {
        spoke = true
        lastSound = now
      }
      const done =
        signal.aborted || (spoke && now - lastSound > PAUSE_MS) || (!spoke && now - started > WAIT_MS) || now - started > MAX_MS
      if (!done) return
      clearInterval(timer)
      recorder.stop()
    }, 100)

    recorder.ondataavailable = (event) => chunks.push(event.data)
    recorder.onstop = () => {
      void context.close()
      resolve(spoke && !signal.aborted ? new Blob(chunks, { type: recorder.mimeType }) : undefined)
    }
    recorder.start()
  })
}
