import { describe, expect, it } from 'vitest'
import { CHECK_IN_STEPS, SYMPTOMS } from '../domain/checkInSteps'
import { LlamaVoiceInterpreter } from './LlamaVoiceInterpreter'

function replyWith(content: string) {
  const requests: { url: string; body: Record<string, unknown> }[] = []
  const fetchFn = async (url: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ url: String(url), body: JSON.parse(String(init?.body)) })
    return new Response(JSON.stringify({ choices: [{ message: { content } }] }))
  }
  return { requests, interpreter: new LlamaVoiceInterpreter('/voice/llm', ['Respiratory', 'Vision (SANS)'], fetchFn) }
}

const reply = (fields: Record<string, unknown>) => JSON.stringify({ action: 'none', system: null, ...fields })

describe('LlamaVoiceInterpreter', () => {
  it('asks llama-server for JSON that fits the command schema', async () => {
    const { requests, interpreter } = replyWith(reply({}))

    await interpreter.interpret('go back')

    expect(requests[0].url).toBe('/voice/llm/v1/chat/completions')
    expect(requests[0].body).toMatchObject({ temperature: 0, response_format: { type: 'json_schema' } })
  })

  it('#64 AC58: offers exactly the given systems and these actions, and nothing else', async () => {
    const { requests, interpreter } = replyWith(reply({}))

    await interpreter.interpret('go back')

    const schema = (requests[0].body as { response_format: { json_schema: { schema: { required: string[]; properties: Record<string, object> } } } }).response_format.json_schema.schema
    expect(schema.required).toEqual(['action', 'system'])
    expect(Object.keys(schema.properties)).toEqual(['action', 'system'])
    expect(schema.properties.system).toEqual({ enum: ['Respiratory', 'Vision (SANS)', null] })
    expect(schema.properties.action).toEqual({ enum: ['open_home', 'open_pvt', 'open_packet', 'open_checkin', 'open_system', 'briefing', 'none'] })
  })

  it('#64 AC58: open_checkin → open the check-in', async () => {
    const { interpreter } = replyWith(reply({ action: 'open_checkin', system: null }))

    expect(await interpreter.interpret('start my check-in')).toEqual({ kind: 'open', target: { screen: 'check-in' } })
  })

  it('open_system with Vision (SANS) → open that system', async () => {
    const { interpreter } = replyWith(reply({ action: 'open_system', system: 'Vision (SANS)' }))

    expect(await interpreter.interpret('how are my eyes')).toEqual({ kind: 'open', target: { screen: 'system', system: 'Vision (SANS)' } })
  })

  it('open_pvt with a stray system → open the PVT', async () => {
    const { interpreter } = replyWith(reply({ action: 'open_pvt', system: 'Sleep' }))

    expect(await interpreter.interpret("let's do the reaction test")).toEqual({ kind: 'open', target: { screen: 'pvt' } })
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

  describe('answer', () => {
    const number = CHECK_IN_STEPS[0]
    const scale = CHECK_IN_STEPS[3]
    const symptoms = CHECK_IN_STEPS[5]
    const schemaOf = (body: Record<string, unknown>) => (body as { response_format: { json_schema: { schema: object } } }).response_format.json_schema.schema
    const systemOf = (body: Record<string, unknown>) => (body as { messages: { content: string }[] }).messages[0].content

    it('#64 AC60: a number step is asked at temperature 0 with its prompt and a number-or-null schema without limits', async () => {
      const { requests, interpreter } = replyWith(JSON.stringify({ value: 63 }))

      await interpreter.answer(number, 'sixty three')

      expect(requests[0].url).toBe('/voice/llm/v1/chat/completions')
      expect(requests[0].body).toMatchObject({ temperature: 0 })
      expect(systemOf(requests[0].body)).toContain(number.prompt)
      expect(schemaOf(requests[0].body)).toEqual({ type: 'object', additionalProperties: false, required: ['value'], properties: { value: { type: ['number', 'null'] } } })
    })

    it('#64 AC60: a scale step takes an integer or null', async () => {
      const { requests, interpreter } = replyWith(JSON.stringify({ value: 4 }))

      await interpreter.answer(scale, 'four')

      expect(systemOf(requests[0].body)).toContain(scale.prompt)
      expect(schemaOf(requests[0].body)).toEqual({ type: 'object', additionalProperties: false, required: ['value'], properties: { value: { type: ['integer', 'null'] } } })
    })

    it('#64 AC61: the symptom step lists the ids with their labels in the schema and the prompt', async () => {
      const { requests, interpreter } = replyWith(JSON.stringify({ symptoms: [], none: true }))

      await interpreter.answer(symptoms, 'none')

      expect(schemaOf(requests[0].body)).toEqual({
        type: 'object',
        additionalProperties: false,
        required: ['symptoms', 'none'],
        properties: {
          symptoms: { type: 'array', items: { enum: ['headache', 'congestion', 'rash', 'neck-face-swelling', 'back-pain'] } },
          none: { type: 'boolean' },
        },
      })
      for (const s of SYMPTOMS) expect(systemOf(requests[0].body)).toContain(`${s.id}: ${s.label}`)
    })

    it.each([
      [{ value: 63 }, number, { kind: 'value', value: 63 }],
      [{ value: null }, number, { kind: 'none' }],
      [{ symptoms: ['headache'], none: false }, symptoms, { kind: 'symptoms', symptoms: ['headache'] }],
      [{ symptoms: [], none: true }, symptoms, { kind: 'symptoms', symptoms: 'none' }],
      [{ symptoms: ['rash'], none: true }, symptoms, { kind: 'symptoms', symptoms: ['rash'] }],
      [{ symptoms: [], none: false }, symptoms, { kind: 'none' }],
    ])('#64 AC62: reply %j → %j', async (content, step, expected) => {
      const { interpreter } = replyWith(JSON.stringify(content))

      expect(await interpreter.answer(step, 'x')).toEqual(expected)
    })

    it('#64 AC62: content that is not JSON is no answer', async () => {
      const { interpreter } = replyWith('{"value": 6')

      expect(await interpreter.answer(number, 'x')).toEqual({ kind: 'none' })
    })

    it('#64 AC62: HTTP 503 rejects', async () => {
      const interpreter = new LlamaVoiceInterpreter('', [], async () => new Response('', { status: 503 }))

      await expect(interpreter.answer(number, 'x')).rejects.toThrow('503')
    })
  })
})
