import type { SpeechOutput } from '../domain/ports'
import { AudioUnavailableError } from '../domain/voice'

const DAYS: Record<string, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
}

/** Symbols, units and short forms in rule text and system details, as Piper should say them; order matters. */
const SPOKEN: [RegExp, string | ((match: string) => string)][] = [
  [/\s*·\s*/g, ', '],
  [/\bBP (\d+)\/(\d+)/g, 'blood pressure $1 over $2'],
  [/\bHR\b/g, 'heart rate'],
  [/(\d+)\/(\d+) min\/wk\b/g, '$1 of $2 minutes per week'],
  [/([\d.]+)\/([\d.]+) L\b/g, '$1 of $2 litres'],
  [/(\d)-h avg\b/g, '$1-hour average'],
  [/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/g, (day) => DAYS[day]],
  [/SpO₂/g, 'S P O 2'],
  [/₂/g, '2'],
  [/\s*→\s*/g, ', then '],
  [/\s*%/g, ' percent'],
  [/\s\+\s/g, ' plus '],
  [/(\d) ?bpm\b/g, '$1 beats per minute'],
  [/(\d) ?mmHg\b/g, '$1 millimetres of mercury'],
  [/(\d) ?ms\b/g, '$1 milliseconds'],
  [/(\d) ?h\b/g, '$1 hours'],
]

export function forSpeech(text: string): string {
  return SPOKEN.reduce(
    (spoken, [pattern, words]) => (typeof words === 'string' ? spoken.replace(pattern, words) : spoken.replace(pattern, words)),
    text,
  )
}

/** Reads text aloud with the ship-local Piper server (F25). */
export class PiperSpeechOutput implements SpeechOutput {
  constructor(private readonly baseUrl = '') {}

  async speak(text: string, signal: AbortSignal): Promise<void> {
    const response = await fetch(`${this.baseUrl}/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: forSpeech(text) }),
    })
    if (!response.ok) throw new Error(`Read-aloud failed with status ${response.status}`)
    // Piper labels its WAV as text/html, so the type is set here.
    const url = URL.createObjectURL(new Blob([await response.arrayBuffer()], { type: 'audio/wav' }))
    const audio = new Audio(url)
    try {
      await new Promise<void>((resolve, reject) => {
        if (signal.aborted) return resolve()
        signal.addEventListener('abort', () => (audio.pause(), resolve()), { once: true })
        audio.onended = () => resolve()
        audio.onerror = () => reject(new AudioUnavailableError('Read-aloud playback failed'))
        audio.play().catch((error: Error) => reject(new AudioUnavailableError(error.message)))
      })
    } finally {
      URL.revokeObjectURL(url)
    }
  }
}
