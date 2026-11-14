import { VoiceIcon } from './icons'
import type { VoiceStatus } from './useVoice'

const LABELS: Record<Exclude<VoiceStatus, 'off'>, string> = {
  listening: 'Voice: listening',
  thinking: 'Voice: thinking',
  speaking: 'Voice: speaking',
  unreachable: 'Voice host unreachable',
  'audio-unavailable': 'Voice: audio not available',
}

/** Header button that turns hands-free voice control on and off (F25). */
/** `disabled` on the PVT screen: voice must never talk during the timed test. */
export function VoiceToggle({ status, onToggle, disabled }: { status: VoiceStatus; onToggle: () => void; disabled: boolean }) {
  const on = status === 'listening' || status === 'thinking' || status === 'speaking'
  return (
    <button type="button" className="icon-button" onClick={onToggle} aria-pressed={on} aria-label="Voice control" disabled={disabled}>
      <VoiceIcon />
    </button>
  )
}

/** Context pill with what voice control is doing; nothing while it is off. */
export function VoicePill({ status }: { status: VoiceStatus }) {
  if (status === 'off') return null
  return (
    <span className="pill" role="status">
      <VoiceIcon size={18} />
      <span>{LABELS[status]}</span>
    </span>
  )
}
