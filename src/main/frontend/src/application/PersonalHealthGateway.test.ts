import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { FakeObservationRepository, FakeReadingSource } from '../test/fakes'
import { PersonalHealthGateway } from './PersonalHealthGateway'

const NOW = new Date('2026-11-14T10:00:00Z')
const message = (fields: Record<string, unknown> = {}) => ({ id: 'm1', t: '2026-11-14T09:59:30Z', spo2_pct: 91, pulse_bpm: 61, src: 'synthetic', ...fields })
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('PersonalHealthGateway', () => {
  let source: FakeReadingSource
  let repository: FakeObservationRepository
  let listener: Mock<() => void>

  beforeEach(() => {
    source = new FakeReadingSource()
    repository = new FakeObservationRepository()
    listener = vi.fn<() => void>()
    const gateway = new PersonalHealthGateway(source, repository, () => NOW)
    gateway.subscribe(listener)
    gateway.start()
  })

  async function emit(value: unknown) {
    source.emit(value)
    await flush()
  }

  it('AC3: an oximeter message becomes SpO₂ and pulse Observations, then listeners are called once', async () => {
    await emit(message())

    expect([...repository.items.values()]).toEqual([
      {
        resourceType: 'Observation',
        id: 'oximeter:m1:spo2Percent',
        status: 'final',
        code: { text: 'spo2Percent' },
        valueQuantity: { value: 91, unit: '%' },
        effectiveDateTime: '2026-11-14T09:59:30Z',
        device: { display: 'oximeter · synthetic' },
      },
      {
        resourceType: 'Observation',
        id: 'oximeter:m1:heartRateBpm',
        status: 'final',
        code: { text: 'heartRateBpm' },
        valueQuantity: { value: 61, unit: 'bpm' },
        effectiveDateTime: '2026-11-14T09:59:30Z',
        device: { display: 'oximeter · synthetic' },
      },
    ])
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('AC4: the same message twice leaves two Observations', async () => {
    await emit(message())
    await emit(message())

    expect([...repository.items.keys()].filter((id) => id.startsWith('oximeter:m1:'))).toHaveLength(2)
  })

  it.each([['missing', undefined], ['a string', '61'], ['null', null], ['below 20', 19], ['above 250', 251], ['NaN', NaN]])(
    'AC5: pulse %s stores only SpO₂',
    async (_, pulse) => {
      await emit(message({ pulse_bpm: pulse }))

      expect([...repository.items.keys()]).toEqual(['oximeter:m1:spo2Percent'])
    },
  )

  it('AC6: a fractional SpO₂ is stored as is', async () => {
    await emit(message({ spo2_pct: 91.5 }))

    expect(repository.items.get('oximeter:m1:spo2Percent')?.valueQuantity.value).toBe(91.5)
  })

  it.each([
    ['null', null],
    ['an array', [message()]],
    ['a string', 'x'],
    ['a number', 7],
    ['id missing', message({ id: undefined })],
    ['id empty', message({ id: '' })],
    ['id a number', message({ id: 5 })],
    ['t missing', message({ t: undefined })],
    ['t a date word', message({ t: 'Nov 14 2026' })],
    ['t a year', message({ t: '2026' })],
    ['t not a real date', message({ t: '2026-13-45T25:61:61Z' })],
    ['t 61 s ahead', message({ t: '2026-11-14T10:01:01Z' })],
    ['spo2 missing', message({ spo2_pct: undefined })],
    ['spo2 a string', message({ spo2_pct: '91' })],
    ['spo2 below 50', message({ spo2_pct: 49 })],
    ['spo2 above 100', message({ spo2_pct: 101 })],
    ['src missing', message({ src: undefined })],
    ['src unknown', message({ src: 'ble' })],
  ])('AC7: %s is dropped', async (_, value) => {
    await emit(value)

    expect(repository.items.size).toBe(0)
    expect(listener).not.toHaveBeenCalled()
  })

  it('AC8: t exactly 60 s ahead is stored', async () => {
    await emit(message({ t: '2026-11-14T10:01:00Z' }))

    expect(repository.items.size).toBe(2)
  })

  it('AC9: a failing put drops the message silently, and the next one still works', async () => {
    repository.failPut = true
    await emit(message())
    expect(listener).not.toHaveBeenCalled()

    repository.failPut = false
    await emit(message({ id: 'm2' }))

    expect(repository.items.has('oximeter:m2:spo2Percent')).toBe(true)
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
