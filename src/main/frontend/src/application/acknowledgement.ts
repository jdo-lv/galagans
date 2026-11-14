import type { CheckInDraft } from '../domain/checkIn'
import { SYMPTOMS } from '../domain/checkInSteps'

/** What the check-in completion says (F13): reporting a symptom is thanked, values are never praised. */
export type Acknowledgement = {
  headline: string
  /** True when a symptom was logged. */
  reported: boolean
  /** One line per distinct `next` text, prefixed with its symptoms; empty when nothing was reported. */
  nextSteps: string[]
}

const capitalised = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/** `symptomDays`: consecutive real days per symptom id, from `StreakReader`; "(day N)" shows from day 2. */
export function acknowledge(checkIn: CheckInDraft, symptomDays: Record<string, number> = {}): Acknowledgement {
  const logged = SYMPTOMS.filter((s) => checkIn.symptoms.includes(s.id))
  if (logged.length === 0) {
    const what = checkIn.symptomsAnswered ? 'No symptoms logged.' : 'Symptoms not answered.'
    return { headline: `${what} Thanks for checking in.`, reported: false, nextSteps: [] }
  }
  const names = logged.map((s) => {
    const days = symptomDays[s.id] ?? 1
    return days >= 2 ? `${s.label.toLowerCase()} (day ${days})` : s.label.toLowerCase()
  })
  const byNext = new Map<string, string[]>()
  for (const s of logged) byNext.set(s.next, [...(byNext.get(s.next) ?? []), s.label.toLowerCase()])
  return {
    headline: `Logged: ${names.join(', ')}. Thanks for reporting.`,
    reported: true,
    nextSteps: [...byNext].map(([next, labels]) => `${capitalised(labels.join(', '))}: ${next}`),
  }
}
