import { describe, expect, it } from 'vitest'
import { HAZARDS, isAffected, lensMark, type HazardId } from './hazards'

const hazard = (id: HazardId) => HAZARDS.find((h) => h.id === id)!

describe('HAZARDS', () => {
  it('lists the five HRP hazards in chip order', () => {
    expect(HAZARDS.map((h) => h.name)).toEqual([
      'Radiation',
      'Isolation & confinement',
      'Distance from Earth',
      'Gravity fields',
      'Hostile/closed environment',
    ])
  })
})

describe('isAffected', () => {
  it('Gravity fields affects Bone & muscle but not Sleep', () => {
    expect(isAffected(hazard('gravity'), 'Bone & muscle')).toBe(true)
    expect(isAffected(hazard('gravity'), 'Sleep')).toBe(false)
  })

  it('Distance from Earth affects every system', () => {
    expect(isAffected(hazard('distance'), 'Respiratory')).toBe(true)
  })
})

describe('lensMark', () => {
  it('no hazard selected → no mark', () => {
    expect(lensMark(null, 'Sleep', 'nominal')).toBeNull()
  })

  it('Gravity fields on nominal Bone & muscle → affected', () => {
    expect(lensMark(hazard('gravity'), 'Bone & muscle', 'nominal')).toBe('affected')
  })

  it('Gravity fields on nominal Sleep, no data or stale → dimmed', () => {
    expect(lensMark(hazard('gravity'), 'Sleep', 'nominal')).toBe('dimmed')
    expect(lensMark(hazard('gravity'), 'Sleep', 'no-data')).toBe('dimmed')
    expect(lensMark(hazard('gravity'), 'Sleep', 'stale')).toBe('dimmed')
  })

  it('Gravity fields on Respiratory in caution or warning → no mark, a filter never mutes a flag', () => {
    expect(lensMark(hazard('gravity'), 'Respiratory', 'caution')).toBeNull()
    expect(lensMark(hazard('gravity'), 'Respiratory', 'warning')).toBeNull()
  })

  it('Distance from Earth on Respiratory in caution → affected', () => {
    expect(lensMark(hazard('distance'), 'Respiratory', 'caution')).toBe('affected')
  })

  it('unknown status (still loading) counts as not flagged', () => {
    expect(lensMark(hazard('radiation'), 'Respiratory', undefined)).toBe('dimmed')
    expect(lensMark(hazard('radiation'), 'Cognition', undefined)).toBe('affected')
  })
})
