import type { SpeechInput, SpeechOutput, VoiceInterpreter, VoiceScreen } from '../domain/ports'
import { speakValues, type SpokenValues, type VoiceCommand, type VoiceTarget } from '../domain/voice'
import type { CheckInRecording } from './CheckInRecorder'

const STOP = /\b(stop|exit|goodbye|voice off)\b/i
const CONFIRM = /\b(confirm|yes|correct|save)\b/i
const DECLINE = /\b(no|not|don't|wrong|cancel|discard)\b/i
const PVT_OPENING = 'Opening the reaction test. Voice is off during the test.'

/**
 * Hands-free use of the app (F25): gives the health briefing, then listens and acts until "stop", the PVT or abort.
 * The LLM only picks a command; a check-in is saved only after the astronaut confirms.
 */
export class VoiceSession {
  constructor(
    private readonly input: SpeechInput,
    private readonly output: SpeechOutput,
    private readonly interpreter: VoiceInterpreter,
    private readonly recorder: CheckInRecording,
    private readonly briefing: { brief(system?: string): Promise<string>; alerts(): Promise<string> },
  ) {}

  async run(screen: VoiceScreen, signal: AbortSignal): Promise<void> {
    const say = async (text: string) => {
      if (signal.aborted) return
      screen.show('speaking')
      await this.output.speak(text, signal)
    }
    let heardValues: SpokenValues | undefined

    screen.show('thinking')
    await say(await this.briefing.brief())
    while (!signal.aborted) {
      screen.show('listening')
      const heard = (await this.input.listen(signal)).trim()
      if (!heard || signal.aborted) continue
      screen.show('thinking')
      if (STOP.test(heard)) return say('Voice off.')

      // A decline word wins over a confirm word in the same answer: nothing is saved by mistake.
      if (heardValues && DECLINE.test(heard)) {
        heardValues = undefined
        await say('Not saved.')
        continue
      }
      const command = await this.interpreter.interpret(heard)
      if (signal.aborted) return
      // A confirm word saves only when the answer brings no new values: "Yes, but my mood is three." is a correction.
      const bringsValues = command.kind === 'checkin' && Object.keys({ ...command.values, ...command.outOfRange }).length > 0
      if (heardValues && CONFIRM.test(heard) && !bringsValues) {
        try {
          await this.recorder.record({ symptoms: [], ...heardValues })
        } catch {
          // The values stay, so "yes" again retries.
          await say('Check-in not saved. Say confirm to try again, or no.')
          continue
        }
        heardValues = undefined
        screen.saved()
        // A new flag must be heard, not only seen.
        await say(`Check-in saved. ${await this.briefing.alerts()}`.trim())
        continue
      }

      if (command.kind === 'checkin') {
        // Answers add up until confirmed; a repeated field takes the newer value.
        const values = { ...heardValues, ...command.values }
        heardValues = Object.keys(values).length ? values : undefined
        await say(checkinAnswer(command.values, values, command.outOfRange ?? {}))
        continue
      }
      heardValues = undefined
      // Voice must never talk during the timed reaction test: say so, then open it and end.
      if (command.kind === 'open' && command.target.screen === 'pvt') {
        await say(PVT_OPENING)
        if (!signal.aborted) screen.open(command.target)
        return
      }
      await say(await this.answer(command, screen))
    }
  }

  private async answer(command: Exclude<VoiceCommand, { kind: 'checkin' }>, screen: VoiceScreen): Promise<string> {
    switch (command.kind) {
      case 'open':
        screen.open(command.target)
        return this.opened(command.target)
      case 'briefing':
        return this.briefing.brief()
      case 'none':
        return 'I can give your health briefing, open a screen, or take check-in answers.'
    }
  }

  private async opened(target: VoiceTarget): Promise<string> {
    switch (target.screen) {
      case 'system':
        return this.briefing.brief(target.system)
      case 'home':
        return 'Home.'
      case 'pvt':
        return PVT_OPENING
      case 'packet':
        return 'Opening the surgeon packet. Sending it needs a tap.'
    }
  }
}

/** Out-of-range values are named first; then what is waiting to be confirmed, if this answer added to it. */
function checkinAnswer(added: SpokenValues, waiting: SpokenValues, outOfRange: SpokenValues): string {
  const rejected = Object.keys(outOfRange).length
  const lines = [
    rejected && `${speakValues(outOfRange)} ${rejected > 1 ? 'are' : 'is'} outside what the check-in takes. Please say it again or type it.`,
    Object.keys(added).length && `${speakValues(waiting)}. Say confirm to save, or no.`,
  ].filter(Boolean)
  return lines.length ? lines.join(' ') : "I didn't hear a value."
}
