import { useState, type FormEvent, type ReactNode } from 'react'
import type { CheckInDraft } from '../domain/checkIn'
import { HeartIcon, MoodIcon, MoonIcon, OxygenIcon } from './icons'

interface FieldSpec {
  name: string
  label: string
  unit: string
  min: number
  max: number
  step?: number
  icon: ReactNode
}

const FIELDS: FieldSpec[] = [
  { name: 'heartRate', label: 'Heart rate', unit: 'bpm', min: 20, max: 250, icon: <HeartIcon /> },
  { name: 'spo2', label: 'SpO₂', unit: '%', min: 50, max: 100, icon: <OxygenIcon /> },
  { name: 'sleep', label: 'Sleep', unit: 'h', min: 0, max: 24, step: 0.5, icon: <MoonIcon /> },
  { name: 'mood', label: 'Mood', unit: '1–5', min: 1, max: 5, icon: <MoodIcon /> },
]

function toNumber(value: FormDataEntryValue | null): number | undefined {
  return value === null || value === '' ? undefined : Number(value)
}

export function CheckInForm({ onSubmit }: { onSubmit: (draft: CheckInDraft) => Promise<unknown> }) {
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setSaving(true)
    try {
      await onSubmit({
        heartRateBpm: toNumber(data.get('heartRate')),
        spo2Percent: toNumber(data.get('spo2')),
        sleepHours: toNumber(data.get('sleep')),
        mood: toNumber(data.get('mood')),
        symptoms: [],
      })
      form.reset()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <p className="muted">Fill in what you measured. Leave the rest as —.</p>
      <div className="tile-grid">
        {FIELDS.map((field) => (
          <label key={field.name} className="field-tile">
            <span className="field-tile__top">
              <input name={field.name} type="number" inputMode="decimal" min={field.min} max={field.max} step={field.step} placeholder="—" />
              {field.icon}
            </span>
            <span className="tile-label">
              {field.label} <span className="tile-label__suffix">/ {field.unit}</span>
            </span>
          </label>
        ))}
      </div>
      <button type="submit" className="button-primary" disabled={saving}>
        Save check-in
      </button>
    </form>
  )
}
