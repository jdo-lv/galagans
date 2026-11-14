import { useState, type FormEvent } from 'react'
import type { CheckInDraft } from '../domain/checkIn'

function toNumber(value: string): number | undefined {
  return value === '' ? undefined : Number(value)
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
        heartRateBpm: toNumber(String(data.get('heartRate'))),
        spo2Percent: toNumber(String(data.get('spo2'))),
        sleepHours: toNumber(String(data.get('sleep'))),
        mood: toNumber(String(data.get('mood'))),
        symptoms: [],
      })
      form.reset()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="checkin" onSubmit={handleSubmit}>
      <label>
        Heart rate (bpm)
        <input name="heartRate" type="number" min={20} max={250} />
      </label>
      <label>
        SpO2 (%)
        <input name="spo2" type="number" min={50} max={100} />
      </label>
      <label>
        Sleep (hours)
        <input name="sleep" type="number" min={0} max={24} step={0.5} />
      </label>
      <label>
        Mood (1-5)
        <input name="mood" type="number" min={1} max={5} />
      </label>
      <button type="submit" className="btn" disabled={saving}>
        Save check-in
      </button>
    </form>
  )
}
