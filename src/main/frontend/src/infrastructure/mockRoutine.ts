import type { RoutinePlaceholder } from '../domain/routine'

/** Synthetic rows for routine items the app can't do yet; "1.1 L so far" matches mockStatuses. Not measurements. */
export const mockRoutine: RoutinePlaceholder[] = [
  { kind: 'placeholder', label: 'Exercise · resistance 45 min', detail: '14:00', source: 'synthetic' },
  { kind: 'placeholder', label: 'Fluids 2.5 L', detail: '1.1 L so far', source: 'synthetic' },
  { kind: 'placeholder', label: 'Workload (Bedford)', detail: '20:00–22:00', source: 'synthetic' },
]
