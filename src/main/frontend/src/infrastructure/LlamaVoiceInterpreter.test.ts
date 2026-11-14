import { describe, expect, it } from 'vitest'
import { LlamaVoiceInterpreter } from './LlamaVoiceInterpreter'

function replyWith(content: string) {
  const requests: { url: string; body: Record<string, unknown> }[] = []
  const fetchFn = async (url: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ url: String(url), body: JSON.parse(String(init?.body)) })
    return new Response(JSON.stringify({ choices: [{ message: { content } }] }))
  }
  return { requests, interpreter: new LlamaVoiceInterpreter('/voice/llm', ['Respiratory', 'Vision (SANS)'], fetchFn) }
}

const reply = (fields: Record<string, unknown>) =>
  JSON.stringify({ action: 'none', system: null, sleepHours: null, heartRateBpm: null, spo2Percent: null, mood: null, ...fields })

describe('LlamaVoiceInterpreter', () => {
  it('asks llama-server for JSON that fits the command schema', async () => {
    const { requests, interpreter } = replyWith(reply({}))

    await interpreter.interpret('go back')

    expect(requests[0].url).toBe('/voice/llm/v1/chat/completions')
    expect(requests[0].body).toMatchObject({ temperature: 0, response_format: { type: 'json_schema' } })
  })

  it('offers exactly the given systems, and whole numbers for heart rate, SpO₂ and mood, without limits', async () => {
    const { requests, interpreter } = replyWith(reply({}))

    await interpreter.interpret('go back')

    const schema = (requests[0].body as { response_format: { json_schema: { schema: { properties: Record<string, object> } } } }).response_format.json_schema.schema
    expect(schema.properties.system).toEqual({ enum: ['Respiratory', 'Vision (SANS)', null] })
    // No minimum/maximum: llama.cpp would rewrite an out-of-range number into a different in-range one.
    expect(schema.properties.heartRateBpm).toEqual({ type: ['integer', 'null'] })
    expect(schema.properties.spo2Percent).toEqual({ type: ['integer', 'null'] })
    expect(schema.properties.mood).toEqual({ type: ['integer', 'null'] })
    expect(schema.properties.sleepHours).toEqual({ type: ['number', 'null'] })
  })

  it('open_system with Vision (SANS) → open that system', async () => {
    const { interpreter } = replyWith(reply({ action: 'open_system', system: 'Vision (SANS)' }))

    expect(await interpreter.interpret('how are my eyes')).toEqual({ kind: 'open', target: { screen: 'system', system: 'Vision (SANS)' } })
  })

  it('open_pvt with a stray system → open the PVT', async () => {
    const { interpreter } = replyWith(reply({ action: 'open_pvt', system: 'Sleep' }))

    expect(await interpreter.interpret("let's do the reaction test")).toEqual({ kind: 'open', target: { screen: 'pvt' } })
  })

  it('checkin keeps only the values that were said', async () => {
    const { interpreter } = replyWith(reply({ action: 'checkin', system: 'Cardiovascular', heartRateBpm: 72, spo2Percent: 98 }))

    expect(await interpreter.interpret('heart rate 72, oxygen 98')).toEqual({ kind: 'checkin', values: { heartRateBpm: 72, spo2Percent: 98 }, outOfRange: {} })
  })

  it('values outside the check-in limits (sleep 30 h, SpO₂ 45 %) move to outOfRange', async () => {
    const { interpreter } = replyWith(reply({ action: 'checkin', sleepHours: 30, spo2Percent: 45, mood: 4 }))

    expect(await interpreter.interpret('I slept thirty hours, oxygen forty five, mood four')).toEqual({
      kind: 'checkin',
      values: { mood: 4 },
      outOfRange: { sleepHours: 30, spo2Percent: 45 },
    })
  })

  it('a value missing from the reply is not heard', async () => {
    const { interpreter } = replyWith(JSON.stringify({ action: 'checkin', mood: 4 }))

    expect(await interpreter.interpret('mood four')).toStrictEqual({ kind: 'checkin', values: { mood: 4 }, outOfRange: {} })
  })

  it('a garbled reply is not a command', async () => {
    const { interpreter } = replyWith('{"action": "open_sys')

    expect(await interpreter.interpret('open')).toEqual({ kind: 'none' })
  })

  it('open_system without a system → none', async () => {
    const { interpreter } = replyWith(reply({ action: 'open_system' }))

    expect(await interpreter.interpret('open it')).toEqual({ kind: 'none' })
  })

  it('briefing → the full health briefing', async () => {
    const { interpreter } = replyWith(reply({ action: 'briefing' }))

    expect(await interpreter.interpret('how am I doing')).toEqual({ kind: 'briefing' })
  })

  it('rejects when llama-server answers with an error', async () => {
    const interpreter = new LlamaVoiceInterpreter('', [], async () => new Response('', { status: 503 }))

    await expect(interpreter.interpret('x')).rejects.toThrow('503')
  })
})
