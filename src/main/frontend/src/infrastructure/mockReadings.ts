import type { ReadingPlaceholder } from '../domain/readings'

/** Synthetic tiles for readings the app can't take yet, using the #4 placeholder values (mockStatuses.ts); not measurements. */
export const mockReadings: ReadingPlaceholder[] = [
  { key: 'bloodPressure', text: '108/70', source: 'synthetic' },
  { key: 'cabinCo2', text: '2.3', source: 'synthetic' },
]
