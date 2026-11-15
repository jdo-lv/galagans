import type { SpeechInput, SpeechOutput, VoiceInterpreter, VoiceScreen } from '../domain/ports'
import type { VoiceCommand, VoiceTarget } from '../domain/voice'
import { VoiceCheckIn } from './VoiceCheckIn'

const STOP = /\b(stop|exit|goodbye|voice off)\b/i
const PVT_OPENING = 'Opening the reaction test. Voice is off during the test.'
const SAY_AGAIN = 'Say it again.'

type OpenedTarget = Exclude<VoiceTarget, { screen: 'check-in' }>

/**
 * Hands-free use of the app (F25): gives the health briefing, then listens and acts until "stop", the PVT or abort.
 * While a check-in question shows, voice asks and fills that step instead (#64). The LLM only picks a command or
 * reads an answer; the screen validates and saves.
 */
export class VoiceSession {
  private readonly checkIn: VoiceCheckIn

  constructor(
    private readonly input: SpeechInput,
    private readonly output: SpeechOutput,
    private readonly interpreter: VoiceInterpreter,
    private readonly briefing: { brief(system?: string): Promise<string> },
  ) {
    this.checkIn = new VoiceCheckIn(interpreter)
  }

  async run(screen: VoiceScreen, signal: AbortSignal): Promise<void> {
    const say = async (text: string) => {
      if (!text || signal.aborted) return
      screen.show('speaking')
      await this.output.speak(text, signal)
    }
    // The check-in step voice last asked; undefined outside a check-in.
    let asked: number | undefined

    screen.show('thinking')
    if (!screen.checkIn()) await say(await this.briefing.brief())
    while (!signal.aborted) {
      const form = screen.checkIn()
      if (!form) asked = undefined
      else if (asked !== form.current().index) {
        // The question depends on the device value the screen is still reading.
        await form.prefillSettled
        if (signal.aborted) return
        asked = form.current().index
        await say(this.checkIn.question(form))
        if (signal.aborted) return
      }

      screen.show('listening')
      const heard = (await this.input.listen(signal)).trim()
      if (!heard || signal.aborted) continue
      screen.show('thinking')
      if (STOP.test(heard)) return say('Voice off.')
      // Touch wins: a step change or a left check-in while listening drops what was heard.
      if (screen.checkIn()?.current().index !== asked) continue

      if (form) {
        const current = () => !signal.aborted && screen.checkIn() === form && form.current().index === asked
        const turn = await this.checkIn.apply(form, heard, current)
        if (signal.aborted) return
        if (turn.ask) asked = undefined
        await say(turn.say ?? '')
        if (turn.end) return
        continue
      }

      const command = await this.interpreter.interpret(heard)
      if (signal.aborted) return
      // Voice must never talk during the timed reaction test: say so, then open it and end.
      if (command.kind === 'open' && command.target.screen === 'pvt') {
        await say(PVT_OPENING)
        if (!signal.aborted) screen.open(command.target)
        return
      }
      await say(await this.answer(command, screen))
    }
  }

  private async answer(command: VoiceCommand, screen: VoiceScreen): Promise<string> {
    switch (command.kind) {
      case 'open': {
        const target = command.target
        // The check-in's first question is spoken by the loop once it shows; from the completion screen there is nothing to open.
        if (target.screen === 'check-in') return (await screen.openCheckIn()) ? '' : SAY_AGAIN
        screen.open(target)
        return this.opened(target)
      }
      case 'briefing':
        return this.briefing.brief()
      case 'none':
        return 'I can give your health briefing or open a screen.'
    }
  }

  private async opened(target: OpenedTarget): Promise<string> {
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
