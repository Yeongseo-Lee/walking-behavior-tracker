import { useEffect, useMemo, useState } from 'react'
import './App.css'

function App() {
  const storageKey = 'walkingBehaviorEntries:v1'

  const purposeOptions = useMemo(
    () => ['commute', 'exercise', 'transportation', 'leisure', 'health', 'other'],
    [],
  )
  const barrierOptions = useMemo(
    () => [
      'fatigue',
      'weather',
      'lack of time',
      'low motivation',
      'pain',
      'none',
      'other',
    ],
    [],
  )

  const [entries, setEntries] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      const parsed = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })

  const [form, setForm] = useState(() => {
    const today = new Date()
    const yyyy = String(today.getFullYear())
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    return {
      date: `${yyyy}-${mm}-${dd}`,
      minutes: '',
      purpose: 'exercise',
      barrier: 'none',
      memo: '',
    }
  })

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(entries))
  }, [entries])

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleSave(e) {
    e.preventDefault()

    const minutesNumber = Number(form.minutes)
    if (!form.date) return
    if (!Number.isFinite(minutesNumber) || minutesNumber < 0) return

    const newEntry = {
      id: crypto?.randomUUID?.() ?? String(Date.now()),
      date: form.date,
      minutes: minutesNumber,
      purpose: form.purpose,
      barrier: form.barrier,
      memo: form.memo.trim(),
      createdAt: Date.now(),
    }

    setEntries((prev) => [newEntry, ...prev])
    setForm((prev) => ({ ...prev, minutes: '', memo: '' }))
  }

  function handleDelete(id) {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <div className="page">
      <header className="header">
        <h1 className="title">Walking Behavior Pattern Tracker</h1>
        <p className="subtitle">
          Log a walking entry, then see your saved history below. Your data stays on this device
          (saved in your browser).
        </p>
      </header>

      <main className="grid">
        <section className="card" aria-label="New walking entry">
          <h2 className="cardTitle">New entry</h2>

          <form className="form" onSubmit={handleSave}>
            <div className="field">
              <label className="label" htmlFor="date">
                Date
              </label>
              <input
                id="date"
                className="input"
                type="date"
                value={form.date}
                onChange={(e) => updateField('date', e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="minutes">
                Walking minutes
              </label>
              <input
                id="minutes"
                className="input"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                placeholder="e.g. 20"
                value={form.minutes}
                onChange={(e) => updateField('minutes', e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="purpose">
                Walking purpose
              </label>
              <select
                id="purpose"
                className="select"
                value={form.purpose}
                onChange={(e) => updateField('purpose', e.target.value)}
              >
                {purposeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="label" htmlFor="barrier">
                Barrier
              </label>
              <select
                id="barrier"
                className="select"
                value={form.barrier}
                onChange={(e) => updateField('barrier', e.target.value)}
              >
                {barrierOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="field fieldFull">
              <label className="label" htmlFor="memo">
                Memo
              </label>
              <textarea
                id="memo"
                className="textarea"
                rows={3}
                placeholder="Optional notes (how it felt, where you walked, etc.)"
                value={form.memo}
                onChange={(e) => updateField('memo', e.target.value)}
              />
            </div>

            <div className="actions">
              <button className="button primary" type="submit">
                Save Entry
              </button>
              <div className="hint" aria-live="polite">
                {entries.length === 0 ? 'No entries yet.' : `${entries.length} saved entr${entries.length === 1 ? 'y' : 'ies'}.`}
              </div>
            </div>
          </form>
        </section>

        <section className="card" aria-label="Saved walking entries">
          <h2 className="cardTitle">Saved entries</h2>

          {entries.length === 0 ? (
            <div className="empty">
              Your saved entries will appear here after you click <strong>Save Entry</strong>.
            </div>
          ) : (
            <ul className="list">
              {entries.map((entry) => (
                <li className="listItem" key={entry.id}>
                  <div className="entryMain">
                    <div className="entryTop">
                      <span className="pill">{entry.date}</span>
                      <span className="pill">{entry.minutes} min</span>
                      <span className="pill">{entry.purpose}</span>
                      <span className="pill">barrier: {entry.barrier}</span>
                    </div>
                    {entry.memo ? <div className="entryMemo">{entry.memo}</div> : null}
                  </div>
                  <button
                    className="button danger"
                    type="button"
                    onClick={() => handleDelete(entry.id)}
                    aria-label={`Delete entry on ${entry.date}`}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
