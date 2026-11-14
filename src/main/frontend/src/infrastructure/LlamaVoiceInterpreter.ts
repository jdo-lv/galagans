import type { VoiceInterpreter } from '../domain/ports'
import { READINGS } from '../domain/readings'
import type { SpokenValues, VoiceCommand, VoiceTarget } from '../domain/voice'

const SCREENS: Record<string, VoiceTarget> = {
  open_home: { screen: 'home' },
  open_pvt: { screen: 'pvt' },
  open_packet: { screen: 'packet' },
}

/** Whole numbers, as the check-in form and the sync API take them; sleep may have decimals. */
const VALUES: Record<keyof SpokenValues, 'integer' | 'number'> = {
  sleepHours: 'number',
  heartRateBpm: 'integer',
  spo2Percent: 'integer',
  mood: 'integer',
}

const COMMAND_PROMPT = `You turn an astronaut's spoken words into one action for a health app. Return only JSON.
Actions:
- open_home: the home screen ("go back", "home").
- open_system: the detail of one health system; set system. Any question about a body part or the cabin opens that system: heart -> Cardiovascular; lungs, breathing, oxygen -> Respiratory; eyes -> Vision (SANS); air, CO2 -> Cabin air; muscles, bones -> Bone & muscle; water, drinking -> Kidney & hydration.
- open_pvt: the 3-minute reaction-time test.
- open_packet: the surgeon packet (never sends it).
- briefing: a health briefing or report ("how am I doing", "give me my report", "read it again").
- checkin: the astronaut gives check-in values with numbers. Fill only the values said: sleepHours, heartRateBpm, spo2Percent (oxygen), mood (1 to 5).
- none: anything else, including questions the app cannot answer.
Fields that don't apply are null.`

function limits(indicator: string) {
  const spec = READINGS.find((r) => r.indicator === indicator)
  return spec && spec.indicator !== null ? { minimum: spec.validMin, maximum: spec.validMax } : {}
}

/** Within the check-in form's limits (`READINGS` validMin–validMax). */
function withinLimits(indicator: string, value: number): boolean {
  const { minimum, maximum } = limits(indicator)
  return (minimum === undefined || value >= minimum) && (maximum === undefined || value <= maximum)
}

/** The command schema: the systems of the Body systems list, and each value as a number or null. */
function commandSchema(systems: string[]) {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['action', 'system', ...Object.keys(VALUES)],
    properties: {
      action: { enum: [...Object.keys(SCREENS), 'open_system', 'briefing', 'checkin', 'none'] },
      system: { enum: [...systems, null] },
      ...Object.fromEntries(
        // No minimum/maximum: llama.cpp would rewrite an out-of-range number into a different in-range one
        // (SpO₂ 45 → 95, measured 2026-11-14), so the limits are checked after parsing instead.
        Object.entries(VALUES).map(([key, type]) => [key, { type: [type, 'null'] }]),
      ),
    },
  }
}

type Reply = { action: string; system: string | null } & Record<keyof SpokenValues, number | null>

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

function toCommand(reply: Reply): VoiceCommand {
  if (Object.hasOwn(SCREENS, reply.action)) return { kind: 'open', target: SCREENS[reply.action] }
  if (reply.action === 'open_system' && reply.system) return { kind: 'open', target: { screen: 'system', system: reply.system } }
  if (reply.action === 'briefing') return { kind: 'briefing' }
  if (reply.action !== 'checkin') return { kind: 'none' }
  const heard = (Object.keys(VALUES) as (keyof SpokenValues)[]).filter((key) => typeof reply[key] === 'number')
  const pick = (keys: (keyof SpokenValues)[]) => Object.fromEntries(keys.map((key) => [key, reply[key]]))
  return {
    kind: 'checkin',
    values: pick(heard.filter((key) => withinLimits(key, reply[key] as number))),
    outOfRange: pick(heard.filter((key) => !withinLimits(key, reply[key] as number))),
  }
}
