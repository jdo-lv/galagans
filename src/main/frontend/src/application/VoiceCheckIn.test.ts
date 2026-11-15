import { beforeEach, describe, expect, it } from 'vitest'
import { FakeCheckInForm, FakeVoiceInterpreter } from '../test/fakes'
import { VoiceCheckIn } from './VoiceCheckIn'

describe('VoiceCheckIn', () => {
  let interpreter: FakeVoiceInterpreter
  let form: FakeCheckInForm
  let voice: VoiceCheckIn
  const apply = (heard: string) => voice.apply(form, heard, () => true)

  beforeEach(() => {
    interpreter = new FakeVoiceInterpreter()
    form = new FakeCheckInForm()
    voice = new VoiceCheckIn(interpreter)
  })

  it('asks each step with its spoken text, the prefilled one only while the field shows the device value', () => {
    expect(voice.question(form)).toBe('Heart rate value?')
    form.prefilled = true
    expect(voice.question(form)).toBe('Confirm or update heart rate value.')
    form.index = 3
    form.prefilled = false
    expect(voice.question(form)).toBe('Sleepiness, 1 to 9?')
  })

  it('a number rounds to the step and fills, then Next', async () => {
    form.index = 2
    interpreter.answers['six'] = { kind: 'value', value: 6.33 }

    expect(await apply('six')).toEqual({})

    expect(form.filled).toEqual([{ kind: 'value', value: 6.5 }])
    expect(form.calls).toEqual(['next'])
  })

  it('a number the screen refuses says "Not valid. Say it again."', async () => {
    form.outcome = 'refused'
    interpreter.answers['x'] = { kind: 'value', value: 300 }

    expect(await apply('x')).toEqual({ say: 'Not valid. Say it again.' })
  })

  it.each(['Yes.', 'Keep it.', 'Correct.', 'Confirm.'])('"%s" keeps the field and moves on', async (heard) => {
    await apply(heard)

    expect(form.calls).toEqual(['next'])
    expect(form.filled).toEqual([])
  })

  it.each(['No.', 'Not really.', "Don't keep it."])('"%s" is not a keep', async (heard) => {
    expect(await apply(heard)).toEqual({ say: 'Say it again.' })
    expect(form.calls).toEqual([])
  })

  it('a scale value outside its range fills nothing', async () => {
    form.index = 3
    interpreter.answers['twelve'] = { kind: 'value', value: 12 }

    expect(await apply('twelve')).toEqual({ say: 'Not valid. Say it again.' })
    expect(form.filled).toEqual([])
  })

  it('symptoms fill and wait for "save"; "don\'t save" does not save, "no symptoms, save" does', async () => {
    form.index = 5
    interpreter.answers['h'] = { kind: 'symptoms', symptoms: ['headache'] }
    interpreter.answers["h, don't save"] = { kind: 'symptoms', symptoms: ['headache'] }
    interpreter.answers['none, save'] = { kind: 'symptoms', symptoms: 'none' }

    expect(await apply('h')).toEqual({})
    expect(await apply("h, don't save")).toEqual({})
    expect(form.calls).toEqual([])
    form.outcome = 'saved'
    expect(await apply('none, save')).toEqual({ say: 'Check-in saved.', end: true })
  })

  it('"Yes" and "Don\'t save" on Symptoms say it again', async () => {
    form.index = 5

    expect(await apply('Yes.')).toEqual({ say: 'Say it again.' })
    expect(await apply("Don't save.")).toEqual({ say: 'Say it again.' })
  })

  it('"save" on another step says it again', async () => {
    expect(await apply('Save.')).toEqual({ say: 'Say it again.' })
  })

  it('a failed save says "Not saved. Try again."', async () => {
    form.index = 5
    form.outcome = 'failed'

    expect(await apply('Save.')).toEqual({ say: 'Not saved. Try again.' })
  })

  it('control words: skip, back (also "previous" and a bare "back"), cancel; "back pain" is a symptom', async () => {
    form.index = 2
    await apply('Skip.')
    await apply('Go back.')
    await apply('Previous.')
    expect(await apply('Back.')).toEqual({ ask: true })
    expect(form.calls).toEqual(['skip', 'back', 'back', 'back'])
    expect(await apply('Cancel.')).toEqual({ say: 'Check-in cancelled.' })
    form.index = 5
    interpreter.answers['Back pain.'] = { kind: 'symptoms', symptoms: ['back-pain'] }
    await apply('Back pain.')
    expect(form.filled).toEqual([{ kind: 'symptoms', symptoms: ['back-pain'] }])
  })

  it('the answer is dropped when the step changed while the model was thinking', async () => {
    interpreter.answers['x'] = { kind: 'value', value: 72 }

    expect(await voice.apply(form, 'x', () => false)).toEqual({})
    expect(form.filled).toEqual([])
    expect(form.calls).toEqual([])
  })
})
