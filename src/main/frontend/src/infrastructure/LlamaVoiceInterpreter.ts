import type { VoiceInterpreter } from '../domain/ports'
import { SYMPTOMS, type CheckInStep } from '../domain/checkInSteps'
import type { StepAnswer, VoiceCommand, VoiceTarget } from '../domain/voice'

const SCREENS: Record<string, VoiceTarget> = {
  open_home: { screen: 'home' },
  open_pvt: { screen: 'pvt' },
  open_packet: { screen: 'packet' },
  open_checkin: { screen: 'check-in' },
}

const COMMAND_PROMPT = `You turn an astronaut's spoken words into one action for a health app. Return only JSON.
Actions:
- open_home: the home screen ("go back", "home").
- open_system: the detail of one health system; set system. Any question about a body part or the cabin opens that system: heart -> Cardiovascular; lungs, breathing, oxygen -> Respiratory; eyes -> Vision (SANS); air, CO2 -> Cabin air; muscles, bones -> Bone & muscle; water, drinking -> Kidney & hydration.
- open_pvt: the 3-minute reaction-time test.
- open_packet: the surgeon packet (never sends it).
- briefing: a health briefing or report ("how am I doing", "give me my report", "read it again").
- open_checkin: the astronaut wants to do the morning check-in, or gives check-in values ("start my check-in", "I slept six hours, mood four").
- none: anything else, including questions the app cannot answer.
Fields that don't apply are null.`

/** The command schema: the systems of the Body systems list. */
function commandSchema(systems: string[]) {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['action', 'system'],
    properties: {
      action: { enum: [...Object.keys(SCREENS), 'open_system', 'briefing', 'none'] },
      system: { enum: [...systems, null] },
    },
  }
}

const SYMPTOM_IDS = SYMPTOMS.map((s) => s.id)

/**
 * The answer schema of one check-in step. No minimum/maximum: llama.cpp would rewrite an out-of-range number into a
 * different in-range one (SpO₂ 45 → 95, measured 2026-11-14), so the screen checks the limits instead.
 */
function answerSchema(step: CheckInStep) {
  if (step.kind === 'choices') {
    return {
      type: 'object',
      additionalProperties: false,
      required: ['symptoms', 'none'],
      properties: { symptoms: { type: 'array', items: { enum: SYMPTOM_IDS } }, none: { type: 'boolean' } },
    }
  }
  const type = step.kind === 'number' ? 'number' : 'integer'
  return { type: 'object', additionalProperties: false, required: ['value'], properties: { value: { type: [type, 'null'] } } }
}

function answerPrompt(step: CheckInStep): string {
  const head = `You read an astronaut's spoken answer to one question of a health check-in. Return only JSON.\nQuestion: ${step.prompt}\n`
  if (step.kind === 'choices') {
    const ids = SYMPTOMS.map((s) => `- ${s.id}: ${s.label}`).join('\n')
    return `${head}symptoms: the ids the astronaut says they have, only from:\n${ids}\nnone: true only when they say they have none.`
  }
  return `${head}value: the number they said, as digits ("seventy two" -> 72, "six and a half" -> 6.5), or null when they said no number. Copy it as said; never correct or limit it.`
}

/** Qwen3.5-4B on the ship-local llama-server (F25): turns spoken words into one command; it never decides a status. */
export class LlamaVoiceInterpreter implements VoiceInterpreter {
  private readonly schema: object

  /** `systems`: the rows of the Body systems list, the only systems a command can open. */
  constructor(
    private readonly baseUrl: string,
    systems: string[],
    private readonly fetchFn: typeof fetch = (input, init) => fetch(input, init),
  ) {
    this.schema = commandSchema(systems)
  }

  async interpret(transcript: string): Promise<VoiceCommand> {
    const content = await this.chat(COMMAND_PROMPT, transcript, {
      temperature: 0,
      response_format: { type: 'json_schema', json_schema: { name: 'command', schema: this.schema } },
    })
    try {
      return toCommand(JSON.parse(content))
    } catch {
      // A garbled or cut-off reply is not a command; voice keeps listening.
      return { kind: 'none' }
    }
  }

  async answer(step: CheckInStep, transcript: string): Promise<StepAnswer> {
    const content = await this.chat(answerPrompt(step), transcript, {
      temperature: 0,
      response_format: { type: 'json_schema', json_schema: { name: 'answer', schema: answerSchema(step) } },
    })
    try {
      return toAnswer(JSON.parse(content))
    } catch {
      return { kind: 'none' }
    }
  }

  private async chat(system: string, user: string, options: object): Promise<string> {
    const response = await this.fetchFn(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'system', content: system }, { role: 'user', content: user }], ...options }),
    })
    if (!response.ok) throw new Error(`Voice model failed with status ${response.status}`)
    return (await response.json()).choices[0].message.content
  }
}

function toCommand(reply: { action: string; system: string | null }): VoiceCommand {
  if (Object.hasOwn(SCREENS, reply.action)) return { kind: 'open', target: SCREENS[reply.action] }
  if (reply.action === 'open_system' && reply.system) return { kind: 'open', target: { screen: 'system', system: reply.system } }
  if (reply.action === 'briefing') return { kind: 'briefing' }
  return { kind: 'none' }
}

/** Symptoms win over "none": a model that says both has heard a symptom. */
function toAnswer(reply: { value?: number | null; symptoms?: string[]; none?: boolean }): StepAnswer {
  if (typeof reply.value === 'number') return { kind: 'value', value: reply.value }
  if (reply.symptoms?.length) return { kind: 'symptoms', symptoms: reply.symptoms }
  if (reply.none) return { kind: 'symptoms', symptoms: 'none' }
  return { kind: 'none' }
}
