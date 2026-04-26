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

  const summary = useMemo(() => {
    const entryCount = entries.length
    const totalMinutes = entries.reduce((sum, e) => sum + (Number(e?.minutes) || 0), 0)
    const averageMinutes = entryCount === 0 ? 0 : totalMinutes / entryCount

    function mostCommonValue(key) {
      if (entryCount === 0) return null
      const counts = new Map()
      for (const e of entries) {
        const raw = e?.[key]
        const value = typeof raw === 'string' ? raw : String(raw ?? '')
        if (!value) continue
        counts.set(value, (counts.get(value) ?? 0) + 1)
      }
      if (counts.size === 0) return null

      let bestValue = null
      let bestCount = -1
      for (const [value, count] of counts.entries()) {
        if (count > bestCount) {
          bestValue = value
          bestCount = count
        }
      }
      return bestValue
    }

    return {
      entryCount,
      totalMinutes,
      averageMinutes,
      mostCommonPurpose: mostCommonValue('purpose'),
      mostCommonBarrier: mostCommonValue('barrier'),
    }
  }, [entries])

  const chartData = useMemo(() => {
    const purposeTotals = new Map(purposeOptions.map((p) => [p, 0]))
    const barrierCounts = new Map(barrierOptions.map((b) => [b, 0]))

    for (const e of entries) {
      const minutes = Number(e?.minutes) || 0

      const purpose = e?.purpose
      if (typeof purpose === 'string' && purposeTotals.has(purpose)) {
        purposeTotals.set(purpose, purposeTotals.get(purpose) + minutes)
      } else if (typeof purpose === 'string') {
        purposeTotals.set(purpose, (purposeTotals.get(purpose) ?? 0) + minutes)
      }

      const barrier = e?.barrier
      if (typeof barrier === 'string' && barrierCounts.has(barrier)) {
        barrierCounts.set(barrier, barrierCounts.get(barrier) + 1)
      } else if (typeof barrier === 'string') {
        barrierCounts.set(barrier, (barrierCounts.get(barrier) ?? 0) + 1)
      }
    }

    const minutesByPurpose = Array.from(purposeTotals.entries()).map(([name, minutes]) => ({
      name,
      minutes,
    }))

    const barriersFrequency = Array.from(barrierCounts.entries()).map(([name, count]) => ({
      name,
      count,
    }))

    return { minutesByPurpose, barriersFrequency }
  }, [entries, purposeOptions, barrierOptions])

  const chartSummary = useMemo(() => {
    const maxMinutes = chartData.minutesByPurpose.reduce(
      (max, d) => (d.minutes > max ? d.minutes : max),
      0,
    )
    const maxBarrierCount = chartData.barriersFrequency.reduce(
      (max, d) => (d.count > max ? d.count : max),
      0,
    )
    return { maxMinutes, maxBarrierCount }
  }, [chartData])

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleSave(e) {
    e.preventDefault()

    const minutesNumber = Number(form.minutes)
    if (!form.date) return
    if (!Number.isFinite(minutesNumber) || minutesNumber < 0) return

    const newEntry = {
      id: Date.now().toString(),
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

        <section className="summary" aria-label="Dashboard summary">
          <div className="summaryCard">
            <div className="summaryLabel">Total walking minutes</div>
            <div className="summaryValue">{summary.totalMinutes}</div>
          </div>
          <div className="summaryCard">
            <div className="summaryLabel">Number of entries</div>
            <div className="summaryValue">{summary.entryCount}</div>
          </div>
          <div className="summaryCard">
            <div className="summaryLabel">Average minutes per entry</div>
            <div className="summaryValue">
              {summary.entryCount === 0 ? 0 : Math.round(summary.averageMinutes * 10) / 10}
            </div>
          </div>
          <div className="summaryCard">
            <div className="summaryLabel">Most common purpose</div>
            <div className="summaryValue">
              {summary.mostCommonPurpose ?? <span className="summaryMuted">No data yet</span>}
            </div>
          </div>
          <div className="summaryCard">
            <div className="summaryLabel">Most common barrier</div>
            <div className="summaryValue">
              {summary.mostCommonBarrier ?? <span className="summaryMuted">No data yet</span>}
            </div>
          </div>
        </section>
      </header>

      <section className="charts" aria-label="Charts">
        <div className="card">
          <h2 className="cardTitle">Total minutes by purpose</h2>
          {entries.length === 0 ? (
            <div className="empty">No chart data yet.</div>
          ) : (
            <div className="chartWrap" role="img" aria-label="Bar chart of minutes by purpose">
              <div className="cssChart" aria-hidden="true">
                {chartData.minutesByPurpose.map((d) => {
                  const pct =
                    chartSummary.maxMinutes === 0
                      ? 0
                      : Math.round((d.minutes / chartSummary.maxMinutes) * 100)
                  return (
                    <div className="cssBarRow" key={d.name}>
                      <div className="cssBarLabel">{d.name}</div>
                      <div className="cssBarTrack">
                        <div className="cssBarFill" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="cssBarValue">{d.minutes}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="cardTitle">Barrier frequency</h2>
          {entries.length === 0 ? (
            <div className="empty">No chart data yet.</div>
          ) : (
            <div className="chartWrap" role="img" aria-label="Bar chart of barrier frequency">
              <div className="cssChart" aria-hidden="true">
                {chartData.barriersFrequency.map((d) => {
                  const pct =
                    chartSummary.maxBarrierCount === 0
                      ? 0
                      : Math.round((d.count / chartSummary.maxBarrierCount) * 100)
                  return (
                    <div className="cssBarRow" key={d.name}>
                      <div className="cssBarLabel">{d.name}</div>
                      <div className="cssBarTrack">
                        <div className="cssBarFill alt" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="cssBarValue">{d.count}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>

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
