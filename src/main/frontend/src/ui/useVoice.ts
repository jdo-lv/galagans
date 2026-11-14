import { useCallback, useEffect, useRef, useState } from 'react'
import type { VoiceScreen } from '../domain/ports'
import { AudioUnavailableError, type VoiceState, type VoiceTarget } from '../domain/voice'
import { useServices } from './ServicesContext'

export type VoiceStatus = VoiceState | 'off' | 'unreachable' | 'audio-unavailable'

/** Starts and stops the voice session (F25); it opens screens through `open`. */
export function useVoice(open: (target: VoiceTarget) => void, saved: () => void) {
  const { voiceSession } = useServices()
  const [status, setStatus] = useState<VoiceStatus>('off')
  const running = useRef<AbortController | null>(null)
  const latest = useRef({ open, saved })

  useEffect(() => {
    latest.current = { open, saved }
  }, [open, saved])
  useEffect(() => () => running.current?.abort(), [])

  /** Ends a running session without another word; does nothing when voice is off. */
  const stop = useCallback(() => {
    if (!running.current) return
    running.current.abort()
    running.current = null
    setStatus('off')
  }, [])

  const toggle = useCallback(() => {
    if (running.current) return stop()
    const controller = new AbortController()
    running.current = controller
    const screen: VoiceScreen = {
      open: (target) => latest.current.open(target),
      saved: () => latest.current.saved(),
      show: setStatus,
    }
    const end = (status: VoiceStatus) => {
      if (running.current !== controller) return
      running.current = null
      setStatus(status)
    }
    voiceSession.run(screen, controller.signal).then(
      () => end('off'),
      // An error pill stays until the mic is tapped again.
      (error) => end(error instanceof AudioUnavailableError ? 'audio-unavailable' : 'unreachable'),
    )
  }, [voiceSession, stop])

  return { status, toggle, stop }
}

