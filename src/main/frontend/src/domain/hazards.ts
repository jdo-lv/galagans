import { isFlagged, type SystemStatus } from './rules'

export type HazardId = 'radiation' | 'isolation' | 'distance' | 'gravity' | 'hostile'

/** One NASA HRP hazard and the Body systems rows it affects (hazard lens, F12). */
export interface Hazard {
  id: HazardId
  name: string
  effect: string
  systems: string[] | 'all'
  checks: string[]
  source: string
}

const HRP_HAZARDS = 'NASA HRP five hazards (research/nasa-hrp.md §1)'

// Effects quote research/nasa-hrp.md §1; systems and checks follow the idea's mapping table, renamed to list rows (issue #14).
export const HAZARDS: Hazard[] = [
  {
    id: 'radiation',
    name: 'Radiation',
    effect:
      'Cancer and degenerative disease (heart disease, cataracts); possible CNS effects; acute syndrome from solar particle events (SPEs).',
    systems: ['Radiation', 'Immune', 'Vision (SANS)', 'Cardiovascular', 'Cognition'],
    checks: ['dose budget (RadLab replay)', 'symptom checklist'],
    source: `${HRP_HAZARDS}; NASA-STD-3001 organ limits [V1 4031] (research/nasa-hrp.md §3)`,
  },
  {
    id: 'isolation',
    name: 'Isolation & confinement',
    effect:
      'Circadian/sleep disruption, fatigue, mood and motivation changes; behavioral, cognitive and psychiatric conditions.',
    systems: ['Sleep', 'Cognition'],
    checks: ['sleep diary', 'KSS', 'mood', 'PVT'],
    source: HRP_HAZARDS,
  },
  {
    id: 'distance',
    name: 'Distance from Earth',
    effect: 'Indirect: no real-time help, no evacuation, finite medical supplies.',
    systems: 'all',
    checks: ['escalation tier', 'comms delay in the surgeon packet'],
    source: HRP_HAZARDS,
  },
  {
    id: 'gravity',
    name: 'Gravity fields',
    effect:
      'Bone loss, muscle loss, headward fluid shift (vision), kidney stones, orthostatic intolerance after landing, balance and motion sickness.',
    systems: ['Bone & muscle', 'Vision (SANS)', 'Kidney & hydration', 'Cardiovascular'],
    checks: ['BP', 'fluids', 'vision self-test', 'body mass', 'exercise minutes'],
    source: HRP_HAZARDS,
  },
  {
    id: 'hostile',
    name: 'Hostile/closed environment',
    effect: 'Altered microbes, raised stress hormones, immune dysregulation, CO₂, noise, toxic contaminants.',
    systems: ['Cognition', 'Cabin air', 'Sleep', 'Immune'],
    checks: ['cabin CO₂', 'temperature', 'humidity', 'noise'],
    source: `${HRP_HAZARDS}; CO₂ and noise effects (research/health-indicators.md, Summary table)`,
  },
]

export function isAffected(hazard: Hazard, system: string): boolean {
  return hazard.systems === 'all' || hazard.systems.includes(system)
}

/** How the lens shows one system. A flag (levels 2–5) outside the hazard keeps no mark: a filter never mutes a flag. */
export function lensMark(
  hazard: Hazard | null,
  system: string,
  state?: SystemStatus['state'],
): 'affected' | 'dimmed' | null {
  if (!hazard) return null
  if (isAffected(hazard, system)) return 'affected'
  if (isFlagged(state)) return null
  return 'dimmed'
}
