import { describe, expect, it } from 'vitest'
import { READINGS, type LatestReading } from '../domain/readings'
import { RULES } from '../test/rules'
import { toPacketItem } from './packetItems'

const [SPO01, SPO02] = RULES
const spec = (key: string) => READINGS.find((s) => s.key === key)!
const AT = '2026-11-14T07:21:00.000Z'

describe('toPacketItem', () => {
  it('AC7: the label gets its suffix after a space', () => {
    expect(toPacketItem({ spec: spec('cabinCo2'), state: 'no-data' }).label).toBe('Cabin CO₂ (1-h avg)')
    expect(toPacketItem({ spec: spec('spo2'), state: 'no-data' }).label).toBe('SpO₂')
  })

  it('AC8: a caution reading keeps its value, age, source, rule id and tier', () => {
    const reading: LatestReading = { spec: spec('spo2'), state: 'check', value: 92, recordedAt: AT, source: 'manual', rule: SPO01 }

    expect(toPacketItem(reading)).toStrictEqual({
      key: 'spo2',
      label: 'SpO₂',
      unit: '%',
      state: 'check',
      value: 92,
      recordedAt: AT,
      source: 'manual',
      ruleId: 'SPO-01',
      tier: 'CMO',
    })
  })

  it('AC9: a warning reading carries SPO-02 and "Urgent ground"', () => {
    const item = toPacketItem({ spec: spec('spo2'), state: 'emergency', value: 88, recordedAt: AT, source: 'manual', rule: SPO02 })

    expect(item).toMatchObject({ state: 'emergency', ruleId: 'SPO-02', tier: 'Urgent ground' })
  })

  it('AC10: a nominal reading has no rule id or tier', () => {
    const item = toPacketItem({ spec: spec('spo2'), state: 'nominal', value: 96, recordedAt: AT, source: 'manual' })

    expect(item.state).toBe('nominal')
    expect(item).not.toHaveProperty('ruleId')
    expect(item).not.toHaveProperty('tier')
  })

  it('AC11: a stale reading has state stale and no rule id or tier', () => {
    const item = toPacketItem({ spec: spec('spo2'), state: 'stale', value: 92, recordedAt: AT, source: 'manual' })

    expect(item).toStrictEqual({ key: 'spo2', label: 'SpO₂', unit: '%', state: 'stale', value: 92, recordedAt: AT, source: 'manual' })
  })

  it.each([
    ['heartRate', 63, 'manual'],
    ['sleep', 7, 'manual'],
    ['mood', 3, 'manual'],
    ['pvt', 268, 'in-app test'],
  ] as const)('AC12: a nominal %s with no rule rows is unrated', (key, value, source) => {
    const item = toPacketItem({ spec: spec(key), state: 'nominal', value, recordedAt: AT, source, unrated: true })

    expect(item).toStrictEqual({ key, label: spec(key).label, unit: spec(key).unit, state: 'unrated', value, recordedAt: AT, source })
  })

  it('AC12: an unrated reading that is stale or missing keeps that state', () => {
    expect(toPacketItem({ spec: spec('heartRate'), state: 'stale', value: 63, recordedAt: AT, source: 'manual', unrated: true }).state).toBe('stale')
    expect(toPacketItem({ spec: spec('sleep'), state: 'no-data', unrated: true }).state).toBe('no-data')
  })

  it('AC13: a missing reading is key, label, unit and state only', () => {
    expect(toPacketItem({ spec: spec('sleep'), state: 'no-data' })).toStrictEqual({ key: 'sleep', label: 'Sleep', unit: 'h', state: 'no-data' })
  })

  it('a paired reading keeps its value and its "108/70" text', () => {
    const item = toPacketItem({ spec: spec('bloodPressure'), state: 'nominal', value: 108, text: '108/70', recordedAt: AT, source: 'BP cuff · synthetic', unrated: true })

    expect(item).toStrictEqual({
      key: 'bloodPressure',
      label: 'Blood pressure',
      unit: 'mmHg',
      state: 'unrated',
      value: 108,
      text: '108/70',
      recordedAt: AT,
      source: 'BP cuff · synthetic',
    })
  })
})
